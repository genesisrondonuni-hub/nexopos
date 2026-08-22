import { describe, expect, it } from "vitest";

import { createReceivedPayment } from "../shared/payment-currency";

describe("moneda recibida en pagos", () => {
  it("conserva el importe contable en VES al recibir USD", () => {
    expect(createReceivedPayment("cash", "Efectivo", 36500, "USD", 36.5)).toMatchObject({ amount: 36500, receivedCurrency: "USD", receivedAmount: 1000, exchangeRate: 36.5 });
  });

  it("mantiene el pago en VES cuando no hay tasa USD válida", () => {
    expect(createReceivedPayment("cash", "Efectivo", 36500, "USD", 0)).toMatchObject({ amount: 36500, receivedCurrency: "VES", receivedAmount: 36500 });
  });
});
