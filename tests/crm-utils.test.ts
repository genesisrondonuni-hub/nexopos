import { describe, expect, it } from "vitest";

import { calculateDeliveryFee } from "../lib/crm-utils";
import { buildMetaTemplatePayload, getMetaWhatsAppStatus } from "../server/meta-whatsapp";

const delivery = { enabled: true, baseFee: 4500, freeShippingAbove: 60000, zones: "Centro" };

describe("reglas configurables del CRM", () => {
  it("calcula delivery según la configuración del negocio", () => {
    expect(calculateDeliveryFee(25000, delivery, "Domicilio")).toBe(4500);
    expect(calculateDeliveryFee(60000, delivery, "Domicilio")).toBe(0);
    expect(calculateDeliveryFee(25000, delivery, "Recogida")).toBe(0);
    expect(calculateDeliveryFee(25000, { ...delivery, enabled: false }, "Domicilio")).toBe(0);
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
});
