import type { Product } from "./pos-types";

export type ImportedInventoryProduct = {
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  showInCatalog: boolean;
};

export type ImportIssue = { row: number; message: string; severity: "warning" | "error" };
export type InventoryImportPreview = { products: ImportedInventoryProduct[]; issues: ImportIssue[]; duplicateCount: number };

export type InventoryImportChange = { productId: string; before?: Product; after: Product };
export type InventoryImportRecord = {
  id: string;
  source: string;
  createdAt: string;
  changes: InventoryImportChange[];
  created: number;
  updated: number;
};

export function applyInventoryImport(current: Product[], importedProducts: ImportedInventoryProduct[], source: string, timestamp = Date.now()) {
  const next = [...current];
  const changes: InventoryImportChange[] = [];
  let created = 0;
  let updated = 0;
  importedProducts.forEach((item, index) => {
    const existingIndex = next.findIndex((product) => product.name.toLocaleLowerCase() === item.name.toLocaleLowerCase());
    if (existingIndex >= 0) {
      const before = next[existingIndex];
      const after = { ...before, ...item };
      next[existingIndex] = after;
      changes.push({ productId: before.id, before, after });
      updated += 1;
    } else {
      const after: Product = { ...item, id: `import-${timestamp}-${index}`, type: "FINAL" };
      next.push(after);
      changes.push({ productId: after.id, after });
      created += 1;
    }
  });
  return { products: next, record: { id: `imp-${timestamp}`, source, createdAt: new Date(timestamp).toISOString(), changes, created, updated } satisfies InventoryImportRecord };
}

export function revertInventoryImport(current: Product[], record: InventoryImportRecord) {
  const hasConflict = record.changes.some((change) => {
    const product = current.find((entry) => entry.id === change.productId);
    return !product || JSON.stringify(product) !== JSON.stringify(change.after);
  });
  if (hasConflict) return { products: current, reverted: false, reason: "El inventario cambió después de esta importación; no es seguro revertirla automáticamente." };
  const createdIds = new Set(record.changes.filter((change) => !change.before).map((change) => change.productId));
  const previousById = new Map(record.changes.filter((change) => change.before).map((change) => [change.productId, change.before!]));
  return { products: current.filter((product) => !createdIds.has(product.id)).map((product) => previousById.get(product.id) ?? product), reverted: true as const };
}

const headerAliases: Record<string, keyof ImportedInventoryProduct> = {
  nombre: "name", name: "name", producto: "name", product: "name",
  categoria: "category", category: "category",
  precio: "price", price: "price", venta: "price",
  costo: "cost", cost: "cost",
  stock: "stock", existencias: "stock", inventario: "stock", quantity: "stock",
  stockminimo: "minStock", minimostock: "minStock", minstock: "minStock", minimumstock: "minStock",
  catalogo: "showInCatalog", catalog: "showInCatalog", publicado: "showInCatalog",
};

function normalizeHeader(value: unknown) {
  return String(value ?? "").trim().toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
}

function parseNumber(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const source = String(value ?? "").trim().replace(/[^0-9,.-]/g, "");
  const comma = source.lastIndexOf(",");
  const dot = source.lastIndexOf(".");
  const normalized = comma >= 0 && dot >= 0 ? (comma > dot ? source.replace(/\./g, "").replace(",", ".") : source.replace(/,/g, "")) : comma >= 0 ? source.replace(",", ".") : source;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBoolean(value: unknown) {
  const normalized = String(value ?? "").trim().toLocaleLowerCase();
  return !["no", "false", "0", "oculto", ""].includes(normalized);
}

export function parseDelimitedText(content: string) {
  const delimiter = content.includes("\t") ? "\t" : content.includes(";") ? ";" : ",";
  return content.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim()).map((line) => {
    const values: string[] = [];
    let value = "";
    let quoted = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"' && line[index + 1] === '"') { value += '"'; index += 1; }
      else if (char === '"') quoted = !quoted;
      else if (char === delimiter && !quoted) { values.push(value.trim()); value = ""; }
      else value += char;
    }
    values.push(value.trim());
    return values;
  });
}

export function previewInventoryRows(rows: unknown[][]): InventoryImportPreview {
  if (!rows.length) return { products: [], issues: [{ row: 0, message: "El archivo no contiene filas.", severity: "error" }], duplicateCount: 0 };
  const headings = rows[0].map((heading) => headerAliases[normalizeHeader(heading)]);
  const nameIndex = headings.findIndex((heading) => heading === "name");
  const priceIndex = headings.findIndex((heading) => heading === "price");
  if (nameIndex < 0 || priceIndex < 0) return { products: [], issues: [{ row: 1, message: "Se requieren las columnas Nombre y Precio.", severity: "error" }], duplicateCount: 0 };
  const find = (field: keyof ImportedInventoryProduct) => headings.findIndex((heading) => heading === field);
  const field = (row: unknown[], key: keyof ImportedInventoryProduct) => { const index = find(key); return index >= 0 ? row[index] : undefined; };
  const issues: ImportIssue[] = [];
  const products: ImportedInventoryProduct[] = [];
  const seen = new Set<string>();
  let duplicateCount = 0;
  rows.slice(1).forEach((row, sourceIndex) => {
    const rowNumber = sourceIndex + 2;
    const name = String(field(row, "name") ?? "").trim();
    const category = String(field(row, "category") ?? "General").trim() || "General";
    const price = parseNumber(field(row, "price"), -1);
    const cost = parseNumber(field(row, "cost"));
    const stock = parseNumber(field(row, "stock"));
    const minStock = parseNumber(field(row, "minStock"));
    if (!name || price < 0 || cost < 0 || stock < 0 || minStock < 0) { issues.push({ row: rowNumber, message: "Nombre, precio, costo y existencias deben ser válidos y no negativos.", severity: "error" }); return; }
    const key = `${name.toLocaleLowerCase()}::${category.toLocaleLowerCase()}`;
    if (seen.has(key)) { duplicateCount += 1; issues.push({ row: rowNumber, message: "Producto repetido en el archivo; se omitió esta fila.", severity: "warning" }); return; }
    seen.add(key);
    products.push({ name, category, price, cost, stock, minStock, showInCatalog: parseBoolean(field(row, "showInCatalog") ?? "sí") });
  });
  return { products, issues, duplicateCount };
}

export function googleSheetCsvUrl(value: string) {
  const input = value.trim();
  if (input.includes("output=csv") || input.includes("format=csv")) return input;
  const match = input.match(/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) return null;
  const gid = input.match(/[?&]gid=([0-9]+)/)?.[1] ?? "0";
  return `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv&gid=${gid}`;
}
