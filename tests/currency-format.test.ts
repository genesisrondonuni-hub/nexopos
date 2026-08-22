import { describe, expect, it } from "vitest";

import { formatBusinessMoney, formatDualCurrency } from "../shared/currency-format";

describe("formato monetario venezolano", () => {
  it("muestra bolívares cuando esa es la moneda de presentación", () => {
    expect(formatBusinessMoney(36500, { displayCurrency: "VES", usdVesRate: 0 })).toContain("Bs.");
  });

  it("convierte solo la presentación a USD con una tasa manual", () => {
    expect(formatBusinessMoney(36500, { displayCurrency: "USD", usdVesRate: 36.5 })).toContain("$1,000.00");
  });

  it("expone VES y USD al mismo tiempo para un cobro", () => {
    const dual = formatDualCurrency(36500, { usdVesRate: 36.5 });
    expect(dual.ves).toContain("Bs.");
    expect(dual.usd).toContain("$1,000.00");
  });
});
