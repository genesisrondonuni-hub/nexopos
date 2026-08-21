export type ServerPaymentMethod = "CASH" | "CARD" | "TRANSFER" | "DIGITAL_WALLET";
export type ServerOrderStatus = "PENDING" | "PROCESSING" | "PAID" | "ARCHIVED";
export type ServerOrderSource = "POS" | "CATALOG";
export type ServerDeliveryMethod = "PICKUP" | "DELIVERY" | "DINE_IN";

export type ServerOrderItem = {
  productId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  isFreeSale: boolean;
};

type ServerPayment = { method: ServerPaymentMethod; amount: number };

export type ServerOrder = {
  id: string;
  businessId: string;
  customerName?: string;
  customerPhone?: string;
  source: ServerOrderSource;
  deliveryMethod: ServerDeliveryMethod;
  status: ServerOrderStatus;
  items: ServerOrderItem[];
  payments: ServerPayment[];
  subtotal: number;
  tip: number;
  total: number;
  createdAt: string;
};

type CashSession = {
  id: string;
  businessId: string;
  employeeId: string;
  openingBalance: number;
  openedAt: string;
  status: "OPEN" | "CLOSED";
};

const stockByProduct = new Map<string, number>([
  ["p-arepa", 32], ["p-bowl", 14], ["p-hamb", 8], ["p-limo", 28], ["p-cafe", 45], ["p-postre", 6],
]);
const sessions = new Map<string, CashSession>();
const orders = new Map<string, ServerOrder>();
let sequence = 1049;

function newId(prefix: string) { sequence += 1; return `${prefix}-${sequence}`; }
function isoNow() { return new Date().toISOString(); }

export function resetNexoStore() {
  sessions.clear();
  orders.clear();
  stockByProduct.set("p-arepa", 32); stockByProduct.set("p-bowl", 14); stockByProduct.set("p-hamb", 8);
  stockByProduct.set("p-limo", 28); stockByProduct.set("p-cafe", 45); stockByProduct.set("p-postre", 6);
  sequence = 1049;
}

export function openCashSession(input: { businessId: string; employeeId: string; openingBalance: number }) {
  const session: CashSession = { id: newId("session"), ...input, openedAt: isoNow(), status: "OPEN" };
  sessions.set(session.id, session);
  return session;
}

function totalFor(items: ServerOrderItem[], tip: number) {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) + tip;
}

function deductInventory(items: ServerOrderItem[]) {
  for (const item of items) {
    if (!item.productId || item.isFreeSale) continue;
    const available = stockByProduct.get(item.productId);
    if (available === undefined) continue;
    if (available < item.quantity) throw new Error(`Inventario insuficiente para ${item.name}`);
  }
  for (const item of items) {
    if (!item.productId || item.isFreeSale) continue;
    const available = stockByProduct.get(item.productId);
    if (available !== undefined) stockByProduct.set(item.productId, available - item.quantity);
  }
}

export function createPosSale(input: { businessId: string; sessionId: string; employeeId: string; items: ServerOrderItem[]; payments: ServerPayment[]; tip: number }) {
  const session = sessions.get(input.sessionId);
  if (!session || session.status !== "OPEN" || session.businessId !== input.businessId) throw new Error("La caja indicada no está abierta para este negocio");
  const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const total = totalFor(input.items, input.tip);
  const paid = input.payments.reduce((sum, payment) => sum + payment.amount, 0);
  if (Math.abs(total - paid) > 0.01) throw new Error("La suma de los pagos debe coincidir con el total de la venta");
  deductInventory(input.items);
  const order: ServerOrder = { id: newId("order"), businessId: input.businessId, source: "POS", deliveryMethod: "DINE_IN", status: "PAID", items: input.items, payments: input.payments, subtotal, tip: input.tip, total, createdAt: isoNow() };
  orders.set(order.id, order);
  return { order, inventoryUpdated: input.items.filter((item) => item.productId && !item.isFreeSale).map((item) => ({ productId: item.productId, remaining: stockByProduct.get(item.productId!) ?? 0 })) };
}

export function createCatalogOrder(input: { businessId: string; customerName: string; customerPhone: string; deliveryMethod: Exclude<ServerDeliveryMethod, "DINE_IN">; items: ServerOrderItem[]; tip?: number }) {
  const tip = input.tip ?? 0;
  const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const order: ServerOrder = { id: newId("order"), businessId: input.businessId, customerName: input.customerName, customerPhone: input.customerPhone, source: "CATALOG", deliveryMethod: input.deliveryMethod, status: "PENDING", items: input.items, payments: [], subtotal, tip, total: subtotal + tip, createdAt: isoNow() };
  orders.set(order.id, order);
  const detail = input.items.map((item) => `${item.quantity}× ${item.name}`).join(", ");
  return { order, whatsappMessage: `Hola, soy ${input.customerName}. Pedido ${order.id}: ${detail}. Total: $${order.total.toLocaleString("es-CO")}. Entrega: ${input.deliveryMethod}.` };
}

export function updateOrderStatus(input: { orderId: string; status: ServerOrderStatus }) {
  const order = orders.get(input.orderId);
  if (!order) throw new Error("Pedido no encontrado");
  const allowed: Record<ServerOrderStatus, ServerOrderStatus[]> = { PENDING: ["PROCESSING", "ARCHIVED"], PROCESSING: ["PAID", "ARCHIVED"], PAID: ["ARCHIVED"], ARCHIVED: [] };
  if (!allowed[order.status].includes(input.status)) throw new Error("Transición de estado no permitida");
  const updated = { ...order, status: input.status };
  orders.set(updated.id, updated);
  return updated;
}

export function listOrders(businessId: string) { return [...orders.values()].filter((order) => order.businessId === businessId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)); }
