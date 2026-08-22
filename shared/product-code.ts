export function normalizeProductCode(value: string) {
  return value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().replace(/\s+/g, "-").replace(/[^A-Z0-9_-]/g, "").slice(0, 32);
}

export function isValidProductCode(value: string) {
  const normalized = normalizeProductCode(value);
  return normalized === value.trim().toUpperCase() && /^[A-Z0-9][A-Z0-9_-]{1,31}$/.test(normalized);
}

export function createProductCode(name: string, sequence = 0) {
  const base = normalizeProductCode(name).replace(/-/g, "").slice(0, 12) || "PRODUCTO";
  return `SKU-${base}-${String(sequence + 1).padStart(3, "0")}`;
}
