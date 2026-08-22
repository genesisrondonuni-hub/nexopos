import type { Order } from "@/shared/pos-types";

export const DEFAULT_SHOP_WHATSAPP_NUMBER = "584121234567";

export function normalizeWhatsAppNumber(value: string) {
  return value.replace(/\D/g, "");
}

export function isValidWhatsAppNumber(value: string) {
  return /^\d{8,15}$/.test(normalizeWhatsAppNumber(value));
}

function money(value: number) {
  return new Intl.NumberFormat("es-VE", { style: "currency", currency: "VES", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

export function buildWhatsAppMessage(order: Order) {
  const lines = order.items.map((item) => `• ${item.quantity} × ${item.name} — ${money(item.quantity * item.unitPrice)}`);
  return [
    `Hola, quiero confirmar el pedido ${order.code}.`,
    "",
    "*Detalle del pedido*",
    ...lines,
    "",
    `*Total: ${money(order.total)}*`,
    `Entrega: ${order.delivery}`,
    ...(order.deliveryFee ? [`Costo de delivery: ${money(order.deliveryFee)}`] : []),
    ...(order.deliveryAddress ? [`Dirección: ${order.deliveryAddress}`] : []),
    `Cliente: ${order.customerName}`,
    `Teléfono: ${order.customerPhone ?? "No informado"}`,
    "",
    "Quedo pendiente de confirmación. Gracias.",
  ].join("\n");
}

export function buildWhatsAppOrderUrl(order: Order, recipient = DEFAULT_SHOP_WHATSAPP_NUMBER) {
  const normalizedRecipient = normalizeWhatsAppNumber(recipient);
  return `https://wa.me/${normalizedRecipient}?text=${encodeURIComponent(buildWhatsAppMessage(order))}`;
}
