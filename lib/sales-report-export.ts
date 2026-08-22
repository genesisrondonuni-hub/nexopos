import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

import { buildSalesReportWorkbookBase64, getSalesReportFilename } from "@/shared/sales-report-export";
import type { SalesAnalytics, SalesAnalyticsRange } from "@/shared/sales-analytics";

const EXCEL_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export async function exportSalesReport(analytics: SalesAnalytics, range: SalesAnalyticsRange) {
  const content = buildSalesReportWorkbookBase64(analytics, range);
  const filename = getSalesReportFilename(range);
  if (Platform.OS === "web") {
    const link = document.createElement("a");
    link.href = `data:${EXCEL_MIME};base64,${content}`;
    link.download = filename;
    link.click();
    return filename;
  }
  if (!FileSystem.cacheDirectory) throw new Error("No fue posible preparar el archivo de exportación en el dispositivo.");
  const uri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(uri, content, { encoding: FileSystem.EncodingType.Base64 });
  if (!(await Sharing.isAvailableAsync())) throw new Error("La opción de compartir archivos no está disponible en este dispositivo.");
  await Sharing.shareAsync(uri, { dialogTitle: "Exportar análisis comercial", mimeType: EXCEL_MIME, UTI: "com.microsoft.excel.xlsx" });
  return filename;
}
