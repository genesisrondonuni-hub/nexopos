import { describe, expect, it } from "vitest";

import { findProductByCode, searchProducts } from "../shared/product-search";

const products = [{ id: "p-1", code: "ARROZ-001", name: "Arroz premium", description: "Bolsa de arroz de 1 kg", category: "Granos", price: 4200, cost: 3000, stock: 8, minStock: 2, showInCatalog: true, type: "FINAL" as const }];

describe("búsqueda de productos", () => {
  it("encuentra productos por código, nombre y descripción", () => {
    expect(searchProducts(products, "arroz")).toHaveLength(1);
    expect(searchProducts(products, "ARROZ-001")).toHaveLength(1);
    expect(searchProducts(products, "1 kg")).toHaveLength(1);
  });

  it("normaliza la entrada de escaneo antes de buscar por código", () => {
    expect(findProductByCode(products, " arroz 001 ")?.id).toBe("p-1");
    expect(findProductByCode(products, "NO-EXISTE")).toBeNull();
  });
});
