import type { Order, OrderStatus } from "./pos-types";

export type KitchenStatus = Extract<OrderStatus, "PENDIENTE" | "EN PROCESO" | "PAGADO">;

export const KITCHEN_COLUMNS: Array<{ status: KitchenStatus; label: string; color: string }> = [
  { status: "PENDIENTE", label: "Por preparar", color: "#D99A22" },
  { status: "EN PROCESO", label: "En preparación", color: "#197B63" },
  { status: "PAGADO", label: "Listo", color: "#4A7FB5" },
];

export function nextKitchenStatus(status: KitchenStatus) { return status === "PENDIENTE" ? "EN PROCESO" : status === "EN PROCESO" ? "PAGADO" : undefined; }

export function kitchenOrders(orders: Order[], recipeProductIds: Set<string>) { return orders.filter((order) => order.status !== "ARCHIVADO" && order.items.some((item) => item.productId && recipeProductIds.has(item.productId))); }

export function kitchenElapsedMinutes(order: Order, now = Date.now()) { return Math.max(0, Math.floor((now - (order.createdTimestamp ?? now)) / 60_000)); }
