import { describe, expect, it } from "vitest";

import { filterOrders, filterLabel, statusAfterConfirmation } from "../shared/order-filters";

describe("filtros de pedidos", () => {
  const orders = [
    { id: "p", code: "#1", customerName: "Ana", status: "PENDIENTE" as const, source: "POS" as const, delivery: "Mesa" as const, total: 1, items: [], createdAt: "Ahora" },
    { id: "e", code: "#2", customerName: "Luis", status: "EN PROCESO" as const, source: "POS" as const, delivery: "Mesa" as const, total: 1, items: [], createdAt: "Ahora" },
  ];

  it("filtra pendientes y confirmación sin ocultar los demás estados de forma incorrecta", () => {
    expect(filterOrders(orders, "TODOS")).toHaveLength(2);
    expect(filterOrders(orders, "PENDIENTE").map((order) => order.id)).toEqual(["p"]);
    expect(filterOrders(orders, "EN PROCESO").map((order) => order.id)).toEqual(["e"]);
    expect(filterLabel("EN PROCESO", true)).toBe("Confirmación");
  });

  it("avanza correctamente los estados al confirmar un pedido", () => {
    expect(statusAfterConfirmation("PENDIENTE")).toBe("EN PROCESO");
    expect(statusAfterConfirmation("EN PROCESO")).toBe("PAGADO");
    expect(statusAfterConfirmation("PAGADO")).toBe("PAGADO");
  });
});
