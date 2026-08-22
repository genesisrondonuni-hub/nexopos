import { describe, expect, it } from "vitest";

import { buildSupplierOrderMessage, normalizedSupplierPhone, supplierOrderWhatsAppUrl } from "../shared/supplier-order-message";

const supplier = { id: "s", name: "Abastos Norte", contactName: "Laura", phone: "300 123 4567", leadDays: 2, active: true, createdAt: "2026-01-01" };
const order = { id: "po-123", supplierId: "s", status: "BORRADOR" as const, createdAt: "2026-01-01", lines: [{ productId: "p", code: "AR-01", name: "Arroz", requestedQuantity: 8, receivedQuantity: 0, unitCost: 4000 }] };

describe("mensaje de pedido al proveedor", () => {
  it("normaliza un teléfono colombiano y compone el pedido", () => {
    expect(normalizedSupplierPhone(supplier.phone)).toBe("573001234567");
    expect(buildSupplierOrderMessage(order, supplier, "Nexo Café")).toContain("Arroz (AR-01): 8 und.");
  });

  it("produce un enlace de WhatsApp solo cuando existe teléfono", () => {
    expect(supplierOrderWhatsAppUrl(order, supplier, "Nexo Café")).toContain("https://wa.me/573001234567");
    expect(supplierOrderWhatsAppUrl(order, { ...supplier, phone: "" }, "Nexo Café")).toBeNull();
  });
});
