import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("cobro con referencia USD/VES", () => {
  it("muestra el formateador dual en los importes del cobro", () => {
    const source = readFileSync(resolve(process.cwd(), "app/checkout.tsx"), "utf8");
    expect(source).toContain("formatDualCurrency");
    expect(source).toContain("dual.ves");
    expect(source).toContain("dual.usd");
    expect(source).toContain("usdVesRateUpdatedAt");
    expect(source).toContain("ReceivedCurrencyPicker");
  });
});
