import { describe, expect, it } from "vitest";

import { kitchenAlertLevel, kitchenElapsedMinutes, kitchenOrders, kitchenProductHistory, nextKitchenStatus } from "../shared/kitchen-utils";

describe("kitchen utilities", () => {
  it("avanza los pedidos por los estados de cocina", () => {
    expect(nextKitchenStatus("PENDIENTE")).toBe("EN PROCESO");
    expect(nextKitchenStatus("EN PROCESO")).toBe("PAGADO");
    expect(nextKitchenStatus("PAGADO")).toBeUndefined();
  });

  it("filtra órdenes con recetas activas y calcula el tiempo transcurrido", () => {
    const orders = [{ id: "r", code: "#1", customerName: "Mesa", status: "PENDIENTE" as const, source: "POS" as const, delivery: "Mesa" as const, total: 1, createdAt: "Ahora", createdTimestamp: 1_000, items: [{ id: "i", productId: "recipe", name: "Plato", quantity: 1, unitPrice: 1, isFreeSale: false }] }, { id: "p", code: "#2", customerName: "Mesa", status: "PENDIENTE" as const, source: "POS" as const, delivery: "Mesa" as const, total: 1, createdAt: "Ahora", createdTimestamp: 1_000, items: [{ id: "i2", productId: "drink", name: "Bebida", quantity: 1, unitPrice: 1, isFreeSale: false }] }];
    expect(kitchenOrders(orders, new Set(["recipe"]))).toHaveLength(1);
    expect(kitchenElapsedMinutes(orders[0]!, 181_000)).toBe(3);
  });

  it("clasifica demoras y resume tiempos por producto terminado", () => {
    const order = { id: "ready", code: "#3", customerName: "Mesa", status: "PAGADO" as const, source: "POS" as const, delivery: "Mesa" as const, total: 1, createdAt: "Ahora", createdTimestamp: 1_000, kitchenStartedTimestamp: 61_000, kitchenReadyTimestamp: 361_000, items: [{ id: "i", productId: "recipe", name: "Hamburguesa", quantity: 1, unitPrice: 1, isFreeSale: false }] };
    expect(kitchenAlertLevel({ ...order, kitchenReadyTimestamp: undefined }, 1_250_000)).toBe("CRÍTICA");
    expect(kitchenProductHistory([order])[0]).toMatchObject({ name: "Hamburguesa", completedOrders: 1, averageMinutes: 5 });
  });
});
