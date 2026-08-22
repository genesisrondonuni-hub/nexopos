import type { FiscalDocumentMode, VenezuelanFiscalSettings } from "./business-types";

export const DEFAULT_VENEZUELAN_FISCAL_SETTINGS: VenezuelanFiscalSettings = {
  countryCode: "VE",
  currencyCode: "VES",
  rif: "",
  ivaRate: 16,
  documentMode: "OPERATIVO",
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

export function fiscalModeLabel(mode: FiscalDocumentMode) {
  return mode === "DIGITAL_PENDIENTE" ? "Emisión digital por configurar" : "Comprobante operativo";
}
