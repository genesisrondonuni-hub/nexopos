import type { ExchangeRateHistoryEntry, FiscalDocumentMode, VenezuelanFiscalSettings } from "./business-types";

export const DEFAULT_VENEZUELAN_FISCAL_SETTINGS: VenezuelanFiscalSettings = {
  countryCode: "VE",
  currencyCode: "VES",
  displayCurrency: "VES",
  usdVesRate: 0,
  usdVesRateUpdatedAt: null,
  usdVesRateSource: "",
  usdVesRateHistory: [],
  rif: "",
  ivaRate: 16,
  documentMode: "OPERATIVO",
  provider: { name: "", rif: "", authorizationReference: "", verificationStatus: "NO_CONFIGURADO", verifiedAt: null },
};

export function normalizeVenezuelanRif(value: string) {
  const compact = value.toUpperCase().replace(/[^VEJGP0-9]/g, "");
  const match = compact.match(/^([VEJGP])(\d{7,9})(\d)$/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : value.toUpperCase().trim();
}

export function isValidVenezuelanRif(value: string) {
  return /^[VEJGP]-?\d{7,9}-?\d$/i.test(value.trim());
}

export function normalizeIvaRate(value: number) {
  return Number.isFinite(value) ? Math.min(31, Math.max(0, Math.round(value * 100) / 100)) : DEFAULT_VENEZUELAN_FISCAL_SETTINGS.ivaRate;
}

export function normalizeUsdVesRate(value: number) {
  return Number.isFinite(value) ? Math.min(100000000, Math.max(0, Math.round(value * 10000) / 10000)) : 0;
}

export function normalizeRateHistory(value: unknown): ExchangeRateHistoryEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is ExchangeRateHistoryEntry => Boolean(entry) && typeof entry === "object" && typeof (entry as ExchangeRateHistoryEntry).id === "string" && normalizeUsdVesRate(Number((entry as ExchangeRateHistoryEntry).rate)) > 0 && typeof (entry as ExchangeRateHistoryEntry).recordedAt === "string" && typeof (entry as ExchangeRateHistoryEntry).sourceNote === "string").map((entry) => ({ ...entry, rate: normalizeUsdVesRate(entry.rate), sourceNote: entry.sourceNote.trim().slice(0, 160) || "Actualización manual" })).sort((left, right) => right.recordedAt.localeCompare(left.recordedAt)).slice(0, 60);
}

export function recordManualUsdVesRate(history: ExchangeRateHistoryEntry[], rate: number, sourceNote: string, recordedAt = new Date().toISOString()) {
  const normalizedRate = normalizeUsdVesRate(rate);
  if (normalizedRate <= 0) return normalizeRateHistory(history);
  const next: ExchangeRateHistoryEntry = { id: `${recordedAt}-${normalizedRate}`, rate: normalizedRate, recordedAt, sourceNote: sourceNote.trim().slice(0, 160) || "Actualización manual" };
  return normalizeRateHistory([next, ...history.filter((entry) => entry.rate !== normalizedRate || entry.sourceNote !== next.sourceNote)]);
}

export function fiscalModeLabel(mode: FiscalDocumentMode) {
  return mode === "DIGITAL_PENDIENTE" ? "Emisión digital por configurar" : "Comprobante operativo";
}
