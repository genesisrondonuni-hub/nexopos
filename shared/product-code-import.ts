import type { Product } from "./pos-types";
import { getBarcodeValidation, isValidProductCode, normalizeProductCode } from "./product-code";

export type ProductCodeImportIssue = { row: number; severity: "error" | "warning"; message: string };
export type ProductCodeImportMatch = { productId: string; productName: string; previousCode: string; code: string };
export type ProductCodeImportPreview = { matches: ProductCodeImportMatch[]; issues: ProductCodeImportIssue[] };

const currentCodeHeaders = ["codigo actual", "codigo existente", "codigo", "sku", "code", "producto", "nombre"];
const newCodeHeaders = ["nuevo codigo", "codigo nuevo", "ean", "upc", "ean upc", "codigo de barras", "barcode"];

function header(value: unknown) { return String(value ?? "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase(); }
function cell(value: unknown) { return String(value ?? "").trim(); }

export function previewProductCodeImport(rows: unknown[][], products: Product[]): ProductCodeImportPreview {
  if (!rows.length) return { matches: [], issues: [{ row: 1, severity: "error", message: "El archivo no contiene encabezados." }] };
  const headers = rows[0].map(header);
  const currentIndex = headers.findIndex((value) => currentCodeHeaders.includes(value));
  const newIndex = headers.findIndex((value) => newCodeHeaders.includes(value));
  if (currentIndex < 0 || newIndex < 0) return { matches: [], issues: [{ row: 1, severity: "error", message: "Incluye las columnas Código actual (o Nombre) y Nuevo código, EAN o UPC." }] };
  const issues: ProductCodeImportIssue[] = [];
  const matches: ProductCodeImportMatch[] = [];
  const seenCodes = new Set<string>();
  rows.slice(1).forEach((row, index) => {
    const rowNumber = index + 2;
    const reference = cell(row[currentIndex]);
    const code = normalizeProductCode(cell(row[newIndex]));
    if (!reference && !code) return;
    if (!reference || !code) { issues.push({ row: rowNumber, severity: "error", message: "Completa el producto de referencia y el nuevo código." }); return; }
    const product = products.find((item) => item.code === normalizeProductCode(reference)) ?? products.find((item) => item.name.toLocaleLowerCase() === reference.toLocaleLowerCase());
    if (!product) { issues.push({ row: rowNumber, severity: "error", message: `No encontramos el producto ${reference}.` }); return; }
    if (!isValidProductCode(code)) { issues.push({ row: rowNumber, severity: "error", message: `El código ${code} no tiene un formato válido.` }); return; }
    const barcode = getBarcodeValidation(code);
    if (barcode.format && !barcode.valid) { issues.push({ row: rowNumber, severity: "error", message: `El dígito de verificación de ${barcode.format} no coincide.` }); return; }
    if (seenCodes.has(code)) { issues.push({ row: rowNumber, severity: "error", message: `El código ${code} se repite en el archivo.` }); return; }
    const owner = products.find((item) => item.code === code && item.id !== product.id);
    if (owner) { issues.push({ row: rowNumber, severity: "error", message: `El código ${code} ya pertenece a ${owner.name}.` }); return; }
    seenCodes.add(code);
    matches.push({ productId: product.id, productName: product.name, previousCode: product.code, code });
  });
  return { matches, issues };
}
