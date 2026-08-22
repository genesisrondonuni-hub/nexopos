import type { Order, OrderStatus } from "./pos-types";

export type KitchenStatus = Extract<OrderStatus, "PENDIENTE" | "EN PROCESO" | "PAGADO">;

export const KITCHEN_COLUMNS: Array<{ status: KitchenStatus; label: string; color: string }> = [
  { status: "PENDIENTE", label: "Por preparar", color: "#D99A22" },
  { status: "EN PROCESO", label: "En preparación", color: "#197B63" },
  { status: "PAGADO", label: "Listo", color: "#4A7FB5" },
];

export const KITCHEN_STATIONS = ["General", "Plancha", "Fritura", "Bebidas", "Despacho"] as const;

export function nextKitchenStatus(status: KitchenStatus) { return status === "PENDIENTE" ? "EN PROCESO" : status === "EN PROCESO" ? "PAGADO" : undefined; }

export function kitchenOrders(orders: Order[], recipeProductIds: Set<string>) { return orders.filter((order) => order.status !== "ARCHIVADO" && order.items.some((item) => item.productId && recipeProductIds.has(item.productId))); }

export function kitchenElapsedMinutes(order: Order, now = Date.now()) { return Math.max(0, Math.floor((now - (order.createdTimestamp ?? now)) / 60_000)); }

export function kitchenAlertLevel(order: Order, now = Date.now()) { const minutes = kitchenElapsedMinutes(order, now); return minutes >= 20 ? "CRÍTICA" : minutes >= 12 ? "ATENCIÓN" : "NORMAL"; }

export function kitchenProductHistory(orders: Order[]) {
  const byProduct = new Map<string, { name: string; totalMinutes: number; completedOrders: number }>();
  orders.filter((order) => order.kitchenReadyTimestamp).forEach((order) => {
    const start = order.kitchenStartedTimestamp ?? order.createdTimestamp ?? order.kitchenReadyTimestamp!;
    const minutes = Math.max(0, Math.round((order.kitchenReadyTimestamp! - start) / 60_000));
    order.items.forEach((item) => {
      const current = byProduct.get(item.productId ?? item.name) ?? { name: item.name, totalMinutes: 0, completedOrders: 0 };
      byProduct.set(item.productId ?? item.name, { ...current, totalMinutes: current.totalMinutes + minutes, completedOrders: current.completedOrders + 1 });
    });
  });
  return [...byProduct.values()].map((item) => ({ ...item, averageMinutes: item.completedOrders ? Math.round(item.totalMinutes / item.completedOrders) : 0 })).sort((a, b) => b.completedOrders - a.completedOrders || b.averageMinutes - a.averageMinutes);
}
