import { describe, expect, it } from "vitest";

import { applyInventoryImport, googleSheetCsvUrl, parseDelimitedText, previewInventoryRows, revertInventoryImport } from "../shared/inventory-import";

describe("importación de inventario", () => {
  it("acepta columnas en español, normaliza precios y omite duplicados", () => {
    const preview = previewInventoryRows(parseDelimitedText("Código;Nombre;Descripción;Categoría;Precio;Costo;Stock\nAGUA-001;Agua;Agua mineral;Bebidas;2.500,50;800;12\nAGUA-001;Agua;Agua mineral;Bebidas;2500,50;800;12\nPAN-001;Pan;Pan del día;Panadería;1500;600;8"));
    expect(preview.products).toHaveLength(2);
    expect(preview.products[0]).toMatchObject({ code: "AGUA-001", name: "Agua", description: "Agua mineral", category: "Bebidas", price: 2500.5, stock: 12 });
    expect(preview.duplicateCount).toBe(1);
  });

  it("requiere Nombre y Precio antes de permitir la importación", () => {
    const preview = previewInventoryRows(parseDelimitedText("Producto;Existencias\nArroz;10"));
    expect(preview.products).toHaveLength(0);
    expect(preview.issues[0]?.severity).toBe("error");
  });

  it("convierte un enlace estándar de Sheets en su exportación CSV", () => {
    expect(googleSheetCsvUrl("https://docs.google.com/spreadsheets/d/abc123/edit#gid=0")).toBe("https://docs.google.com/spreadsheets/d/abc123/export?format=csv&gid=0");
    expect(googleSheetCsvUrl("https://example.com/sheet")).toBeNull();
  });

  it("guarda un registro y revierte únicamente cuando no existen cambios posteriores", () => {
    const initial = [{ id: "p-1", code: "AGUA-001", name: "Agua", description: "Agua mineral", category: "Bebidas", price: 1000, cost: 400, stock: 2, minStock: 1, showInCatalog: true, type: "FINAL" as const }];
    const applied = applyInventoryImport(initial, [{ code: "AGUA-001", name: "Agua", description: "Agua mineral", category: "Bebidas", price: 1200, cost: 450, stock: 7, minStock: 2, showInCatalog: true }, { code: "JUGO-001", name: "Jugo", description: "Jugo natural", category: "Bebidas", price: 2500, cost: 800, stock: 5, minStock: 2, showInCatalog: true }], "archivo.xlsx", 1000);
    expect(applied.record).toMatchObject({ created: 1, updated: 1 });
    expect(revertInventoryImport(applied.products, applied.record)).toMatchObject({ reverted: true, products: initial });
    expect(revertInventoryImport(applied.products.map((product) => product.id === "p-1" ? { ...product, stock: 4 } : product), applied.record)).toMatchObject({ reverted: false });
  });
});
