export function normalizeProductCode(value: string) {
  return value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/\s+/g, "-").replace(/[^A-Z0-9_-]/g, "").slice(0, 32);
}

export function isValidProductCode(value: string) {
  const normalized = normalizeProductCode(value);
  return normalized === value.trim().toUpperCase() && /^[A-Z0-9][A-Z0-9_-]{1,31}$/.test(normalized);
}

export type BarcodeFormat = "EAN-8" | "UPC-A" | "EAN-13";

export function getBarcodeValidation(value: string): { format: BarcodeFormat | null; valid: boolean } {
  const normalized = normalizeProductCode(value);
  if (!/^\d+$/.test(normalized)) return { format: null, valid: true };
  const format: BarcodeFormat | null = normalized.length === 8 ? "EAN-8" : normalized.length === 12 ? "UPC-A" : normalized.length === 13 ? "EAN-13" : null;
  if (!format) return { format: null, valid: true };
  const digits = normalized.split("").map(Number);
  const expected = digits.pop()!;
  const sum = digits.reverse().reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1), 0);
  return { format, valid: (10 - (sum % 10)) % 10 === expected };
}

export function createProductCode(name: string, sequence = 0) {
  const base = normalizeProductCode(name).replace(/-/g, "").slice(0, 12) || "PRODUCTO";
  return `SKU-${base}-${String(sequence + 1).padStart(3, "0")}`;
}
