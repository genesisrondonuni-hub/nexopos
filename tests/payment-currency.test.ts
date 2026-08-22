import { describe, expect, it } from "vitest";

import { calculateCashChange, createReceivedPayment } from "../shared/payment-currency";

describe("moneda recibida en pagos", () => {
  it("conserva el importe contable en VES al recibir USD", () => {
    expect(createReceivedPayment("cash", "Efectivo", 36500, "USD", 36.5)).toMatchObject({ amount: 36500, receivedCurrency: "USD", receivedAmount: 1000, exchangeRate: 36.5 });
  });

  it("mantiene el pago en VES cuando no hay tasa USD válida", () => {
    expect(createReceivedPayment("cash", "Efectivo", 36500, "USD", 0)).toMatchObject({ amount: 36500, receivedCurrency: "VES", receivedAmount: 36500 });
  });
});

describe("vuelto en efectivo", () => {
  it("calcula el vuelto en VES sin cambiar el importe contable", () => {
    expect(calculateCashChange(36500, "VES", 36.5, 40000)).toEqual({ currency: "VES", amountDue: 36500, tenderedAmount: 40000, changeAmount: 3500, shortfallAmount: 0 });
  });

  it("calcula el vuelto en USD usando la tasa manual vigente", () => {
    expect(calculateCashChange(36500, "USD", 36.5, 1100)).toEqual({ currency: "USD", amountDue: 1000, tenderedAmount: 1100, changeAmount: 100, shortfallAmount: 0 });
  });

  it("indica el faltante y degrada a VES si no existe tasa USD válida", () => {
    expect(calculateCashChange(36500, "USD", 0, 30000)).toEqual({ currency: "VES", amountDue: 36500, tenderedAmount: 30000, changeAmount: 0, shortfallAmount: 6500 });
  });
});
