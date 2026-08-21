import { describe, expect, it } from "vitest";

import { googleSheetCsvUrl, parseDelimitedText, previewInventoryRows } from "../shared/inventory-import";

describe("importación de inventario", () => {
  it("acepta columnas en español, normaliza precios y omite duplicados", () => {
    const preview = previewInventoryRows(parseDelimitedText("Nombre;Categoría;Precio;Costo;Stock\nAgua;Bebidas;2.500,50;800;12\nAgua;Bebidas;2500,50;800;12\nPan;Panadería;1500;600;8"));
    expect(preview.products).toHaveLength(2);
    expect(preview.products[0]).toMatchObject({ name: "Agua", category: "Bebidas", price: 2500.5, stock: 12 });
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
});
