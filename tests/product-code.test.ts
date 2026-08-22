import { describe, expect, it } from "vitest";

import { createProductCode, getBarcodeValidation, isValidProductCode, normalizeProductCode } from "../shared/product-code";

describe("códigos de producto", () => {
  it("normaliza códigos para uso operativo", () => {
    expect(normalizeProductCode(" agua  01 ")).toBe("AGUA-01");
    expect(isValidProductCode("AGUA-01")).toBe(true);
  });

  it("genera un código cuando la importación no lo suministra", () => {
    expect(createProductCode("Café molido", 3)).toBe("SKU-CAFEMOLIDO-004");
    expect(isValidProductCode("A")).toBe(false);
  });

  it("valida el dígito de control de EAN y UPC", () => {
    expect(getBarcodeValidation("5901234123457")).toEqual({ format: "EAN-13", valid: true });
    expect(getBarcodeValidation("036000291452")).toEqual({ format: "UPC-A", valid: true });
    expect(getBarcodeValidation("5901234123458")).toEqual({ format: "EAN-13", valid: false });
    expect(getBarcodeValidation("SKU-CAFE-001")).toEqual({ format: null, valid: true });
  });
});
