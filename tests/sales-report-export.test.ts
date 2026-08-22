import { describe, expect, it } from "vitest";

import { buildSalesAnalytics } from "../shared/sales-analytics";
import { buildSalesReportWorkbookBase64, getSalesReportFilename } from "../shared/sales-report-export";

describe("sales report export", () => {
  it("genera un libro Excel y un nombre de archivo rastreable para el rango seleccionado", () => {
    const analytics = buildSalesAnalytics({ products: [{ id: "p", code: "SKU-1", name: "Producto", description: "Detalle", category: "General", price: 100, cost: 30, stock: 5, minStock: 1, showInCatalog: true, type: "FINAL" }], orders: [] });
    expect(buildSalesReportWorkbookBase64(analytics, "30D", new Date("2026-08-22T12:00:00.000Z")).length).toBeGreaterThan(100);
    expect(getSalesReportFilename("30D", new Date("2026-08-22T12:00:00.000Z"))).toBe("nexopos-analisis-comercial-30d-2026-08-22.xlsx");
  });
});
