import type { Product } from "./pos-types";
import type { PurchaseOrderStatus } from "./supply-types";

export function suggestedReorderQuantity(product: Product) { return Math.max(1, Math.max(product.minStock * 2, product.minStock + 1) - product.stock); }
export function reorderProducts(products: Product[]) { return products.filter((product) => product.type !== "SERVICE" && product.stock <= product.minStock).map((product) => ({ product, quantity: suggestedReorderQuantity(product) })); }
export function nextPurchaseOrderStatus(status: PurchaseOrderStatus): PurchaseOrderStatus | undefined { if (status === "BORRADOR") return "ENVIADO"; if (status === "ENVIADO") return "EN_DESPACHO"; return undefined; }
export function purchaseOrderStatusLabel(status: PurchaseOrderStatus) { return { BORRADOR: "Borrador", ENVIADO: "Enviado", EN_DESPACHO: "En despacho", PARCIAL: "Recepción parcial", RECIBIDO: "Recibido", CANCELADO: "Cancelado" }[status]; }
