import { describe, expect, it } from "vitest";

import { buildSalesAnalytics } from "../shared/sales-analytics";
import type { Order, Product } from "../shared/pos-types";

const products: Product[] = [
  { id: "a", code: "A-1", name: "Camisa", description: "Camisa", category: "Ropa", collection: "Verano", price: 100, cost: 40, stock: 10, minStock: 2, showInCatalog: true, type: "FINAL" },
  { id: "b", code: "B-1", name: "Pantalón", description: "Pantalón", category: "Ropa", collection: "Verano", price: 50, cost: 70, stock: 6, minStock: 2, showInCatalog: true, type: "FINAL" },
  { id: "c", code: "C-1", name: "Accesorio", description: "Accesorio", category: "Accesorios", price: 20, cost: 8, stock: 5, minStock: 1, showInCatalog: true, type: "FINAL" },
];

const orders: Order[] = [
  { id: "o1", code: "#1", customerName: "Cliente", status: "PAGADO", source: "POS", delivery: "Mesa", branchId: "north", total: 250, createdAt: "Ahora", items: [{ id: "i1", productId: "a", name: "Camisa", quantity: 2, unitPrice: 100, unitCost: 40, collection: "Verano", isFreeSale: false }, { id: "i2", productId: "b", name: "Pantalón", quantity: 1, unitPrice: 50, unitCost: 70, collection: "Verano", isFreeSale: false }] },
  { id: "o2", code: "#2", customerName: "Cliente", status: "ARCHIVADO", source: "POS", delivery: "Mesa", total: 100, createdAt: "Ahora", items: [{ id: "i3", productId: "a", name: "Camisa", quantity: 1, unitPrice: 100, isFreeSale: false }] },
];

describe("buildSalesAnalytics", () => {
  it("calcula rotación, margen y excluye pedidos anulados", () => {
    const analytics = buildSalesAnalytics({ products, orders, branches: [{ id: "north", name: "Sede norte", opensAt: "08:00", closesAt: "18:00", servesSaturday: true, servesSunday: false }] });
    expect(analytics.activeOrders).toBe(1);
    expect(analytics.bestSellers[0]?.name).toBe("Camisa");
    expect(analytics.productMetrics.find((metric) => metric.productId === "a")?.grossProfit).toBe(120);
    expect(analytics.branches[0]).toMatchObject({ name: "Sede norte", revenue: 250, grossProfit: 100 });
    expect(analytics.collections[0]).toMatchObject({ name: "Verano", revenue: 250 });
  });

  it("marca pérdidas y productos sin ventas como revisión o retiro sugerido", () => {
    const analytics = buildSalesAnalytics({ products, orders });
    expect(analytics.lossProducts.some((metric) => metric.name === "Pantalón")).toBe(true);
    expect(analytics.exitCandidates.find((metric) => metric.name === "Accesorio")?.retirementReason).toContain("Sin ventas");
  });

  it("filtra las ventas usando el rango temporal seleccionado", () => {
    const now = 1_800_000_000_000;
    const datedOrders = [{ ...orders[0], createdTimestamp: now - 2 * 24 * 60 * 60 * 1000 }, { ...orders[1], id: "o3", status: "PAGADO" as const, createdTimestamp: now - 45 * 24 * 60 * 60 * 1000 }];
    expect(buildSalesAnalytics({ products, orders: datedOrders, range: "7D", now }).activeOrders).toBe(1);
    expect(buildSalesAnalytics({ products, orders: datedOrders, range: "30D", now }).activeOrders).toBe(1);
    expect(buildSalesAnalytics({ products, orders: datedOrders, range: "90D", now }).activeOrders).toBe(2);
  });
});
