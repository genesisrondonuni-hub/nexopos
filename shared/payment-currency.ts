import type { PaymentMethod, PaymentSplit } from "./pos-types";

export type ReceivedCurrency = "VES" | "USD";

export function createReceivedPayment(id: string, method: PaymentMethod, amountVes: number, receivedCurrency: ReceivedCurrency, usdVesRate: number): PaymentSplit {
  const amount = Math.max(0, Math.round(amountVes * 100) / 100);
  const useUsd = receivedCurrency === "USD" && usdVesRate > 0;
  return { id, method, amount, receivedCurrency: useUsd ? "USD" : "VES", receivedAmount: useUsd ? Math.round((amount / usdVesRate) * 100) / 100 : amount, exchangeRate: useUsd ? usdVesRate : undefined };
}
