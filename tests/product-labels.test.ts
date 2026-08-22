import { describe, expect, it } from "vitest";

import { createCode39Svg, createProductLabelsHtml } from "../shared/product-labels";
import type { Product } from "../shared/pos-types";
import { DEFAULT_VENEZUELAN_FISCAL_SETTINGS } from "../shared/venezuela-fiscal";

const product: Product = { id: "p-1", code: "SKU-AREPA-001", name: "Arepa de queso", description: "Arepa", category: "Entradas", price: 8500, cost: 2900, stock: 10, minStock: 2, showInCatalog: true, type: "FINAL" };

describe("etiquetas de producto", () => {
  it("genera un SVG Code 39 para el código normalizado", () => {
    expect(createCode39Svg(product.code)).toContain("<svg");
    expect(createCode39Svg(product.code)).toContain("<rect");
  });

  it("genera HTML imprimible con negocio, producto y precio", () => {
    const html = createProductLabelsHtml([product], "Nexo Café", DEFAULT_VENEZUELAN_FISCAL_SETTINGS);
    expect(html).toContain("Nexo Café");
    expect(html).toContain("Arepa de queso");
    expect(html).toContain("SKU-AREPA-001");
    expect(html).toContain("8.500");
  });
});
