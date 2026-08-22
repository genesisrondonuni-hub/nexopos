import { createHmac, timingSafeEqual } from "crypto";

type MetaTemplateInput = {
  to: string;
  templateName: string;
  parameters: string[];
  language?: string;
};

type MetaTemplatePayload = {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  type: "template";
  template: {
    name: string;
    language: { code: string };
    components: Array<{ type: "body"; parameters: Array<{ type: "text"; text: string }> }>;
  };
};

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

export function getMetaWhatsAppStatus() {
  const sendReady = Boolean(process.env.META_WHATSAPP_ACCESS_TOKEN?.trim() && process.env.META_WHATSAPP_PHONE_NUMBER_ID?.trim());
  const webhookReady = Boolean(process.env.META_WHATSAPP_WABA_ID?.trim() && process.env.META_WEBHOOK_VERIFY_TOKEN?.trim() && process.env.META_APP_SECRET?.trim());
  return {
    configured: sendReady,
    sendReady,
    webhookReady,
    provider: "Meta WhatsApp Cloud API" as const,
    message: sendReady ? webhookReady ? "Envío y verificación de webhook configurados." : "El envío de plantillas está listo; falta completar el webhook de estados." : "Pendiente de token de acceso y Phone Number ID de Meta.",
  };
}

export type MetaWebhookEvent = { id: string; kind: "MENSAJE" | "ESTADO" | "OTRO"; from?: string; detail: string; receivedAt: string };
const webhookEvents: MetaWebhookEvent[] = [];

export function verifyMetaWebhookChallenge(input: { mode?: string; verifyToken?: string; challenge?: string }) {
  const expected = process.env.META_WEBHOOK_VERIFY_TOKEN?.trim();
  if (!expected || input.mode !== "subscribe" || !input.verifyToken || input.verifyToken !== expected) return null;
  return input.challenge ?? null;
}

export function isValidMetaWebhookSignature(rawBody: Buffer, signature?: string) {
  const secret = process.env.META_APP_SECRET?.trim();
  if (!secret || !signature?.startsWith("sha256=")) return false;
  const expected = `sha256=${createHmac("sha256", secret).update(rawBody).digest("hex")}`;
  const supplied = signature.trim();
  return expected.length === supplied.length && timingSafeEqual(Buffer.from(expected), Buffer.from(supplied));
}

type MetaWebhookValue = { messages?: Array<{ from?: string; text?: { body?: string }; type?: string }>; statuses?: Array<{ recipient_id?: string; status?: string }> };
type MetaWebhookPayload = { entry?: Array<{ changes?: Array<{ value?: MetaWebhookValue }> }> };

export function captureMetaWebhookPayload(payload: unknown) {
  const records: MetaWebhookEvent[] = [];
  const entries = typeof payload === "object" && payload ? (payload as MetaWebhookPayload).entry ?? [] : [];
  entries.forEach((entry) => entry.changes?.forEach((change) => {
    change.value?.messages?.forEach((message, index) => records.push({ id: `meta-msg-${Date.now()}-${index}`, kind: "MENSAJE", from: message.from, detail: message.text?.body?.slice(0, 300) ?? message.type ?? "Mensaje recibido", receivedAt: new Date().toISOString() }));
    change.value?.statuses?.forEach((status, index) => records.push({ id: `meta-status-${Date.now()}-${index}`, kind: "ESTADO", from: status.recipient_id, detail: status.status ?? "Estado actualizado", receivedAt: new Date().toISOString() }));
  }));
  webhookEvents.unshift(...records);
  webhookEvents.splice(100);
  return records;
}

export function getMetaWebhookEvents() { return [...webhookEvents]; }

export function buildMetaTemplatePayload(input: MetaTemplateInput): MetaTemplatePayload {
  const phone = normalizePhone(input.to);
  if (!/^\d{8,15}$/.test(phone)) throw new Error("El destinatario debe incluir un número de WhatsApp válido.");
  if (!/^[a-z0-9_]{1,512}$/.test(input.templateName)) throw new Error("El nombre de la plantilla de Meta no tiene un formato válido.");
  return {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phone,
    type: "template",
    template: {
      name: input.templateName,
      language: { code: input.language ?? "es_CO" },
      components: [{ type: "body", parameters: input.parameters.map((text) => ({ type: "text", text })) }],
    },
  };
}

export async function sendMetaTemplate(input: MetaTemplateInput) {
  const status = getMetaWhatsAppStatus();
  const payload = buildMetaTemplatePayload(input);
  if (!status.sendReady) return { status: "not_configured" as const, payload };

  const version = process.env.META_GRAPH_API_VERSION ?? "v23.0";
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID!;
  const response = await fetch(`https://graph.facebook.com/${version}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.META_WHATSAPP_ACCESS_TOKEN!}` },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Meta rechazó el envío (${response.status}): ${JSON.stringify(body)}`);
  return { status: "sent" as const, payload, body };
}
