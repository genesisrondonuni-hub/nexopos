import { describe, expect, it } from "vitest";

import { previewProductImageImport, productCodeFromImageName } from "../shared/product-image-import";

const products = [{ id: "p-1", code: "SKU-ARROZ-001", name: "Arroz", description: "Bolsa", category: "Granos", price: 4200, cost: 3000, stock: 8, minStock: 2, showInCatalog: true, type: "FINAL" as const }];

describe("importación de imágenes por código", () => {
  it("obtiene el código a partir del nombre del archivo", () => {
    expect(productCodeFromImageName("sku arroz 001.jpg")).toBe("SKU-ARROZ-001");
  });

  it("vincula cada imagen solo con el producto de mismo código", () => {
    const preview = previewProductImageImport(products, [{ uri: "file:///SKU-ARROZ-001.png", fileName: "SKU-ARROZ-001.png" }, { uri: "file:///SIN-CODIGO.jpg", fileName: "SIN-CODIGO.jpg" }]);
    expect(preview[0].matchedProductId).toBe("p-1");
    expect(preview[1].matchedProductId).toBeUndefined();
  });
});
