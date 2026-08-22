import type { CashMovement, CashSession, Order } from "./pos-types";

export type CashSessionSummary = {
  cashSales: number;
  incomes: number;
  expenses: number;
  expected: number;
  difference?: number;
};

export function getCashSessionSummary(session: CashSession | undefined, orders: Order[], movements: CashMovement[]): CashSessionSummary {
  if (!session) return { cashSales: 0, incomes: 0, expenses: 0, expected: 0 };
  const cashSales = orders.filter((order) => order.status === "PAGADO" && (order.createdTimestamp ?? 0) >= session.openedTimestamp).reduce((sum, order) => sum + (order.payments?.filter((payment) => payment.method === "Efectivo").reduce((paymentSum, payment) => paymentSum + payment.amount, 0) ?? 0), 0);
  const sessionMovements = movements.filter((movement) => movement.sessionId === session.id);
  const incomes = sessionMovements.filter((movement) => movement.type === "INGRESO").reduce((sum, movement) => sum + movement.amount, 0);
  const expenses = sessionMovements.filter((movement) => movement.type === "EGRESO").reduce((sum, movement) => sum + movement.amount, 0);
  const expected = session.openingBase + cashSales + incomes - expenses;
  return { cashSales, incomes, expenses, expected, difference: session.closingAmount === undefined ? undefined : session.closingAmount - expected };
}
