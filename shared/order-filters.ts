import type { Order, OrderStatus } from "./pos-types";

export type OrderFilter = "TODOS" | "PENDIENTE" | "EN PROCESO";

export function filterOrders(orders: Order[], filter: OrderFilter) {
  return filter === "TODOS" ? orders : orders.filter((order) => order.status === filter);
}

export function filterLabel(filter: OrderFilter, serviceFlow: boolean) {
  if (filter === "TODOS") return "Todos";
  if (filter === "PENDIENTE") return "Pendientes";
  return serviceFlow ? "Confirmación" : "En proceso";
}

export function statusAfterConfirmation(status: OrderStatus) {
  if (status === "PENDIENTE") return "EN PROCESO" as const;
  if (status === "EN PROCESO") return "PAGADO" as const;
  return status;
}
