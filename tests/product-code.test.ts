import { describe, expect, it } from "vitest";

import { createProductCode, isValidProductCode, normalizeProductCode } from "../shared/product-code";

describe("códigos de producto", () => {
  it("normaliza códigos para uso operativo", () => {
    expect(normalizeProductCode(" agua  01 ")).toBe("AGUA-01");
    expect(isValidProductCode("AGUA-01")).toBe(true);
  });

  it("genera un código cuando la importación no lo suministra", () => {
    expect(createProductCode("Café molido", 3)).toBe("SKU-CAFEMOLIDO-004");
    expect(isValidProductCode("A")).toBe(false);
  });
});
