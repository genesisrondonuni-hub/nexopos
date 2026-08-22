import type { VenezuelanFiscalSettings } from "./business-types";
import { DEFAULT_VENEZUELAN_FISCAL_SETTINGS } from "./venezuela-fiscal";

let activeFiscal: VenezuelanFiscalSettings = DEFAULT_VENEZUELAN_FISCAL_SETTINGS;

export function setMoneyPreferences(preferences: VenezuelanFiscalSettings) { activeFiscal = preferences; }

function formatVes(value: number) {
  return new Intl.NumberFormat("es-VE", { style: "currency", currency: "VES", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

export function formatBusinessMoney(value: number, fiscal: Pick<VenezuelanFiscalSettings, "displayCurrency" | "usdVesRate">, compact = false) {
  const amount = Number.isFinite(value) ? value : 0;
  if (fiscal.displayCurrency === "USD" && fiscal.usdVesRate > 0) {
    const dollars = amount / fiscal.usdVesRate;
    return compact && Math.abs(dollars) >= 1000000 ? `US$ ${(dollars / 1000000).toFixed(1).replace(".0", "")} M` : formatUsd(dollars);
  }
  return compact && Math.abs(amount) >= 1000000 ? `Bs. ${(amount / 1000000).toFixed(1).replace(".0", "")} M` : formatVes(amount);
}

export function formatConfiguredMoney(value: number, compact = false) {
  return formatBusinessMoney(value, activeFiscal, compact);
}

export function formatDualCurrency(value: number, fiscal: Pick<VenezuelanFiscalSettings, "usdVesRate">) {
  const ves = formatBusinessMoney(value, { displayCurrency: "VES", usdVesRate: fiscal.usdVesRate });
  const usd = fiscal.usdVesRate > 0 ? formatBusinessMoney(value, { displayCurrency: "USD", usdVesRate: fiscal.usdVesRate }) : null;
  return { ves, usd, rate: fiscal.usdVesRate };
}

export function currencyPresentationLabel(fiscal: Pick<VenezuelanFiscalSettings, "displayCurrency" | "usdVesRate">) {
  return fiscal.displayCurrency === "USD" && fiscal.usdVesRate > 0 ? "USD (referencia manual)" : "Bs. (VES)";
}
