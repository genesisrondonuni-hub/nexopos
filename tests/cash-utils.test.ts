import { describe, expect, it } from "vitest";

import { getCashSessionSummary } from "../shared/cash-utils";

describe("cash session summary", () => {
  it("calcula efectivo esperado con ventas y movimientos del turno", () => {
    const session = { id: "cash-1", branchId: "main", operatorName: "Caja", openingBase: 100000, openedAt: "Ahora", openedTimestamp: 1000, status: "ABIERTA" as const };
    const orders = [{ id: "o-1", code: "#1", customerName: "Mostrador", status: "PAGADO" as const, source: "POS" as const, delivery: "Mesa" as const, total: 30000, createdAt: "Ahora", createdTimestamp: 1200, items: [], payments: [{ id: "cash", method: "Efectivo" as const, amount: 20000 }, { id: "card", method: "Tarjeta" as const, amount: 10000 }] }];
    const movements = [{ id: "m-1", sessionId: "cash-1", type: "EGRESO" as const, amount: 5000, concept: "Compra", createdAt: "Ahora", createdTimestamp: 1300 }, { id: "m-2", sessionId: "cash-1", type: "INGRESO" as const, amount: 2000, concept: "Cambio", createdAt: "Ahora", createdTimestamp: 1400 }];
    expect(getCashSessionSummary(session, orders, movements)).toMatchObject({ cashSales: 20000, incomes: 2000, expenses: 5000, expected: 117000 });
  });
});
