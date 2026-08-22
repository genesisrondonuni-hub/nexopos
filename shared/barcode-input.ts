import { getBarcodeValidation, normalizeProductCode } from "./product-code";

export type BarcodeInput = { normalized: string; valid: boolean; likelyScannerCode: boolean; format: string | null };

export function parseBarcodeInput(value: string): BarcodeInput {
  const normalized = normalizeProductCode(value.replace(/[\r\n\t]/g, ""));
  const validation = getBarcodeValidation(normalized);
  const likelyScannerCode = /^\d{8,13}$/.test(normalized) || /^[A-Z0-9]+(?:[-_][A-Z0-9]+)+$/.test(normalized);
  return { normalized, valid: validation.valid, likelyScannerCode, format: validation.format };
}
