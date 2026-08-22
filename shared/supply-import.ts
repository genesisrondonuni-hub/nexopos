import type { SupplierReceiptLine } from "./supply-types";

export type SupplyImportIssue = { row: number; message: string; severity: "warning" | "error" };
export type SupplyReceiptPreview = { lines: SupplierReceiptLine[]; issues: SupplyImportIssue[] };

function key(value: unknown) { return String(value ?? "").trim().toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, ""); }
function number(value: unknown) { const normalized = String(value ?? "").replace(/[^0-9,.-]/g, "").replace(/\./g, "").replace(",", "."); const parsed = Number(normalized); return Number.isFinite(parsed) ? parsed : 0; }

const aliases: Record<string, "code" | "name" | "quantity" | "unitCost"> = {
  codigo: "code", sku: "code", referencia: "code", code: "code",
  nombre: "name", producto: "name", product: "name", name: "name",
  cantidad: "quantity", unidades: "quantity", recibido: "quantity", entrada: "quantity", quantity: "quantity",
  costo: "unitCost", cost: "unitCost", costounitario: "unitCost", precio_compra: "unitCost",
};

export function previewSupplierReceiptRows(rows: unknown[][]): SupplyReceiptPreview {
  if (!rows.length) return { lines: [], issues: [{ row: 0, message: "El archivo no contiene filas.", severity: "error" }] };
  const headers = rows[0].map((header) => aliases[key(header)]);
  const index = (field: string) => headers.findIndex((header) => header === field);
  const codeIndex = index("code"); const nameIndex = index("name"); const quantityIndex = index("quantity"); const costIndex = index("unitCost");
  if (quantityIndex < 0 || (codeIndex < 0 && nameIndex < 0)) return { lines: [], issues: [{ row: 1, message: "Se requieren Cantidad y Código o Nombre.", severity: "error" }] };
  const issues: SupplyImportIssue[] = []; const lines: SupplierReceiptLine[] = [];
  rows.slice(1).forEach((row, sourceIndex) => {
    const rowNumber = sourceIndex + 2; const code = codeIndex >= 0 ? String(row[codeIndex] ?? "").trim() : ""; const name = nameIndex >= 0 ? String(row[nameIndex] ?? "").trim() : ""; const quantity = number(row[quantityIndex]); const unitCost = costIndex >= 0 ? number(row[costIndex]) : undefined;
    if ((!code && !name) || quantity <= 0 || (unitCost !== undefined && unitCost < 0)) { issues.push({ row: rowNumber, message: "Código o nombre y una cantidad positiva son obligatorios.", severity: "error" }); return; }
    lines.push({ code: code || undefined, name: name || code, quantity, unitCost });
  });
  return { lines, issues };
}
