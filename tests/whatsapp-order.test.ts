import { describe, expect, it } from "vitest";

import { buildWhatsAppMessage, buildWhatsAppOrderUrl } from "../lib/whatsapp";
import type { Order } from "../shared/pos-types";

const deliveryOrder: Order = {
  id: "o-2001",
  code: "#2001",
  customerName: "Ana Torres",
  customerPhone: "300 111 2233",
  status: "PENDIENTE",
  source: "CATÁLOGO",
  delivery: "Domicilio",
  deliveryAddress: "Calle 72 # 12-34, Apto 402",
  total: 29000,
  createdAt: "Ahora",
  items: [
    { id: "item-1", productId: "p-bowl", name: "Bowl campesino", quantity: 1, unitPrice: 21500, isFreeSale: false },
    { id: "item-2", productId: "p-limo", name: "Limonada natural", quantity: 1, unitPrice: 7500, isFreeSale: false },
  ],
};

describe("mensaje de WhatsApp del catálogo", () => {
  it("incluye detalle, total, entrega y datos del cliente", () => {
    const message = buildWhatsAppMessage(deliveryOrder);
    expect(message).toContain("#2001");
    expect(message).toContain("1 × Bowl campesino");
    expect(message).toContain("$ 29.000");
    expect(message).toContain("Domicilio");
    expect(message).toContain("Calle 72 # 12-34");
    expect(message).toContain("Ana Torres");
  });

  it("genera una URL wa.me codificada con el destinatario indicado", () => {
    const url = buildWhatsAppOrderUrl(deliveryOrder, "+57 (300) 555-0183");
    expect(url).toMatch(/^https:\/\/wa\.me\/573005550183\?text=/);
    expect(decodeURIComponent(url)).toContain("Bowl campesino");
  });
});
