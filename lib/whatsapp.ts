import type { Order } from "@/shared/pos-types";

// Sustituir por el número del negocio antes de compartir el catálogo con clientes.
export const SHOP_WHATSAPP_NUMBER = "573005550183";

function money(value: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);
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
    ...(order.deliveryAddress ? [`Dirección: ${order.deliveryAddress}`] : []),
    `Cliente: ${order.customerName}`,
    `Teléfono: ${order.customerPhone ?? "No informado"}`,
    "",
    "Quedo pendiente de confirmación. Gracias.",
  ].join("\n");
}

export function buildWhatsAppOrderUrl(order: Order, recipient = SHOP_WHATSAPP_NUMBER) {
  const normalizedRecipient = recipient.replace(/\D/g, "");
  return `https://wa.me/${normalizedRecipient}?text=${encodeURIComponent(buildWhatsAppMessage(order))}`;
}
