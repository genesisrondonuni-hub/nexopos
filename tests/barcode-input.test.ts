import { describe, expect, it } from "vitest";

import { parseBarcodeInput } from "../shared/barcode-input";

describe("entrada de lector de códigos", () => {
  it("normaliza el retorno de carro que envía un lector físico", () => {
    expect(parseBarcodeInput("  SKU-ABC-001\r\n")).toMatchObject({ normalized: "SKU-ABC-001", valid: true, likelyScannerCode: true });
  });

  it("identifica un EAN inválido antes de enviarlo al POS", () => {
    expect(parseBarcodeInput("7702004000000")).toMatchObject({ format: "EAN-13", valid: false, likelyScannerCode: true });
  });
});
