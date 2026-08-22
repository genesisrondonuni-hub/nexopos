import type { PurchaseOrder, Supplier } from "./supply-types";

export function normalizedSupplierPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return digits.length === 10 ? `57${digits}` : digits;
}

export function buildSupplierOrderMessage(order: PurchaseOrder, supplier: Supplier, businessName: string) {
  const items = order.lines.map((line) => `• ${line.name} (${line.code}): ${line.requestedQuantity} und.`).join("\n");
  return `Hola ${supplier.contactName || supplier.name}, desde ${businessName} solicitamos el pedido ${order.id.replace("po-", "OC-")}:\n\n${items}\n\nPor favor confirmar disponibilidad, valor final y fecha de despacho. Gracias.`;
}

export function supplierOrderWhatsAppUrl(order: PurchaseOrder, supplier: Supplier, businessName: string) {
  const phone = normalizedSupplierPhone(supplier.phone);
  if (!phone) return null;
  return `https://wa.me/${phone}?text=${encodeURIComponent(buildSupplierOrderMessage(order, supplier, businessName))}`;
}
