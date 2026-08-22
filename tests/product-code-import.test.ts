import { describe, expect, it } from "vitest";

import { previewProductCodeImport } from "../shared/product-code-import";
import type { Product } from "../shared/pos-types";

const products: Product[] = [
  { id: "p-1", code: "SKU-AREPA-001", name: "Arepa de queso", description: "Arepa", category: "Entradas", price: 8500, cost: 2900, stock: 10, minStock: 2, showInCatalog: true, type: "FINAL" },
  { id: "p-2", code: "SKU-CAFE-002", name: "Café americano", description: "Café", category: "Bebidas", price: 5200, cost: 900, stock: 10, minStock: 2, showInCatalog: true, type: "FINAL" },
];

describe("importación de códigos de producto", () => {
  it("vincula EAN válidos por código o nombre existente", () => {
    const preview = previewProductCodeImport([["Código actual", "EAN"], ["SKU-AREPA-001", "5901234123457"], ["Café americano", "036000291452"]], products);
    expect(preview.issues).toEqual([]);
    expect(preview.matches).toEqual([{ productId: "p-1", productName: "Arepa de queso", previousCode: "SKU-AREPA-001", code: "5901234123457" }, { productId: "p-2", productName: "Café americano", previousCode: "SKU-CAFE-002", code: "036000291452" }]);
  });

  it("rechaza códigos con control inválido, duplicados o productos ausentes", () => {
    const preview = previewProductCodeImport([["Producto", "Nuevo código"], ["Arepa de queso", "5901234123458"], ["No existe", "5901234123457"]], products);
    expect(preview.matches).toEqual([]);
    expect(preview.issues).toHaveLength(2);
  });
});
