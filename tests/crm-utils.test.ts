import { describe, expect, it } from "vitest";

import { calculateDeliveryFee, cancellationAllowed, isServiceAvailable } from "../lib/crm-utils";
import { buildMetaTemplatePayload, captureMetaWebhookPayload, getMetaWhatsAppStatus, isValidMetaWebhookSignature, sendMetaTemplate, verifyMetaWebhookChallenge } from "../server/meta-whatsapp";

const delivery = { enabled: true, baseFee: 4500, freeShippingAbove: 60000, zones: "Centro" };
const agentPolicy = { enabled: true, timezone: "America/Bogota", opensAt: "08:00", closesAt: "20:00", servesSaturday: true, servesSunday: false, outsideHoursMessage: "Fuera de horario", humanHandoffEnabled: true, humanHandoffMessage: "Asesor", allowPendingCancellation: true, cancellationWindowMinutes: 10 };

describe("reglas configurables del CRM", () => {
  it("calcula delivery según la configuración del negocio", () => {
    expect(calculateDeliveryFee(25000, delivery, "Domicilio")).toBe(4500);
    expect(calculateDeliveryFee(60000, delivery, "Domicilio")).toBe(0);
    expect(calculateDeliveryFee(25000, delivery, "Recogida")).toBe(0);
    expect(calculateDeliveryFee(25000, { ...delivery, enabled: false }, "Domicilio")).toBe(0);
  });

  it("respeta horario y ventana de cancelación configurados", () => {
    expect(isServiceAvailable(agentPolicy, new Date("2026-08-21T14:00:00.000Z"))).toBe(true);
    expect(isServiceAvailable(agentPolicy, new Date("2026-08-21T02:00:00.000Z"))).toBe(false);
    expect(cancellationAllowed(agentPolicy, 10)).toBe(true);
    expect(cancellationAllowed(agentPolicy, 11)).toBe(false);
  });

  it("prepara una plantilla de Meta con parámetros configurables", () => {
    const payload = buildMetaTemplatePayload({
      to: "+57 300 555 0183",
      templateName: "crm_bienvenida",
      parameters: ["Laura", "Nexo Café"],
    });
    expect(payload.to).toBe("573005550183");
    expect(payload.template.name).toBe("crm_bienvenida");
    expect(payload.template.components[0].parameters).toHaveLength(2);
  });

  it("indica que Meta sigue pendiente sin credenciales", () => {
    expect(getMetaWhatsAppStatus().provider).toBe("Meta WhatsApp Cloud API");
  });

  it("mantiene el envío bloqueado de forma segura sin credenciales", async () => {
    const keys = ["META_WHATSAPP_ACCESS_TOKEN", "META_WHATSAPP_PHONE_NUMBER_ID"] as const;
    const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
    keys.forEach((key) => delete process.env[key]);
    try {
      const result = await sendMetaTemplate({ to: "+57 300 555 0183", templateName: "crm_bienvenida", parameters: ["Valentina"] });
      expect(result.status).toBe("not_configured");
    } finally {
      keys.forEach((key) => { if (previous[key]) process.env[key] = previous[key]; });
    }
  });

  it("valida el desafío y captura eventos de webhook sin exponer datos sensibles", () => {
    const previousToken = process.env.META_WEBHOOK_VERIFY_TOKEN;
    process.env.META_WEBHOOK_VERIFY_TOKEN = "token-prueba";
    expect(verifyMetaWebhookChallenge({ mode: "subscribe", verifyToken: "token-prueba", challenge: "reto" })).toBe("reto");
    expect(verifyMetaWebhookChallenge({ mode: "subscribe", verifyToken: "incorrecto", challenge: "reto" })).toBeNull();
    const records = captureMetaWebhookPayload({ entry: [{ changes: [{ value: { messages: [{ from: "573005550183", type: "text", text: { body: "Hola" } }] } }] }] });
    expect(records[0]).toMatchObject({ kind: "MENSAJE", from: "573005550183", detail: "Hola" });
    expect(isValidMetaWebhookSignature(Buffer.from("{}"), "sha256=invalida")).toBe(false);
    if (previousToken) process.env.META_WEBHOOK_VERIFY_TOKEN = previousToken; else delete process.env.META_WEBHOOK_VERIFY_TOKEN;
  });
});
