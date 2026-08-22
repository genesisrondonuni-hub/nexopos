import * as XLSX from "xlsx";

import type { SalesAnalytics, SalesAnalyticsRange } from "./sales-analytics";

const RANGE_LABELS: Record<SalesAnalyticsRange, string> = { ALL: "Todo el historial", "7D": "Últimos 7 días", "30D": "Últimos 30 días", "90D": "Últimos 90 días" };

function addSheet(workbook: XLSX.WorkBook, name: string, rows: Array<Record<string, string | number>>) {
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), name);
}

/** Genera un archivo XLSX portable, sin incluir información de credenciales ni datos de configuración sensible. */
export function buildSalesReportWorkbookBase64(analytics: SalesAnalytics, range: SalesAnalyticsRange, generatedAt = new Date()) {
  const workbook = XLSX.utils.book_new();
  addSheet(workbook, "Resumen", [
    { Métrica: "Rango analizado", Valor: RANGE_LABELS[range] },
    { Métrica: "Generado", Valor: generatedAt.toISOString() },
    { Métrica: "Pedidos no anulados", Valor: analytics.activeOrders },
    { Métrica: "Productos con pérdida", Valor: analytics.lossProducts.length },
    { Métrica: "Productos candidatos a retiro", Valor: analytics.exitCandidates.length },
  ]);
  addSheet(workbook, "Productos", analytics.productMetrics.map((metric) => ({ Código: metric.code, Producto: metric.name, Categoría: metric.category, Colección: metric.collection, "Unidades vendidas": metric.unitsSold, Ingresos: metric.revenue, "Costo de ventas": metric.costOfSales, "Utilidad bruta": metric.grossProfit, "Margen bruto": metric.grossMargin, Stock: metric.stock, "Precio actual": metric.currentPrice, "Costo actual": metric.currentCost, "Precio bajo costo": metric.priceBelowCost ? "Sí" : "No", Recomendación: metric.retirementReason ?? "" })));
  addSheet(workbook, "Sedes", analytics.branches.map((metric) => ({ Sede: metric.name, Pedidos: metric.orders, Ingresos: metric.revenue, "Costo de ventas": metric.costOfSales, "Utilidad bruta": metric.grossProfit })));
  addSheet(workbook, "Colecciones", analytics.collections.map((metric) => ({ Colección: metric.name, Pedidos: metric.orders, Ingresos: metric.revenue, "Costo de ventas": metric.costOfSales, "Utilidad bruta": metric.grossProfit })));
  addSheet(workbook, "Revisar catálogo", analytics.exitCandidates.map((metric) => ({ Código: metric.code, Producto: metric.name, Stock: metric.stock, "Unidades vendidas": metric.unitsSold, "Utilidad bruta": metric.grossProfit, Motivo: metric.retirementReason ?? "" })));
  return XLSX.write(workbook, { bookType: "xlsx", type: "base64", compression: true });
}

export function getSalesReportFilename(range: SalesAnalyticsRange, timestamp = new Date()) {
  const date = timestamp.toISOString().slice(0, 10);
  return `nexopos-analisis-comercial-${range.toLowerCase()}-${date}.xlsx`;
}
