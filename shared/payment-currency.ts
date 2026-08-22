import type { PaymentMethod, PaymentSplit } from "./pos-types";

export type ReceivedCurrency = "VES" | "USD";

export interface CashChange {
  currency: ReceivedCurrency;
  amountDue: number;
  tenderedAmount: number;
  changeAmount: number;
  shortfallAmount: number;
}

const roundMoney = (value: number) => Math.round(Math.max(0, value) * 100) / 100;

export function createReceivedPayment(id: string, method: PaymentMethod, amountVes: number, receivedCurrency: ReceivedCurrency, usdVesRate: number): PaymentSplit {
  const amount = roundMoney(amountVes);
  const useUsd = receivedCurrency === "USD" && usdVesRate > 0;
  return { id, method, amount, receivedCurrency: useUsd ? "USD" : "VES", receivedAmount: useUsd ? roundMoney(amount / usdVesRate) : amount, exchangeRate: useUsd ? usdVesRate : undefined };
}

/** Calcula el vuelto en la misma moneda entregada, sin alterar el importe contable en VES. */
export function calculateCashChange(amountVes: number, receivedCurrency: ReceivedCurrency, usdVesRate: number, tenderedAmount: number): CashChange {
  const useUsd = receivedCurrency === "USD" && usdVesRate > 0;
  const currency: ReceivedCurrency = useUsd ? "USD" : "VES";
  const amountDue = useUsd ? roundMoney(amountVes / usdVesRate) : roundMoney(amountVes);
  const tendered = roundMoney(tenderedAmount);
  const difference = Math.round((tendered - amountDue) * 100) / 100;

  return {
    currency,
    amountDue,
    tenderedAmount: tendered,
    changeAmount: difference > 0 ? difference : 0,
    shortfallAmount: difference < 0 ? Math.abs(difference) : 0,
  };
}
