export type PaymentMethod = "Efectivo" | "Tarjeta" | "Transferencia" | "Billetera";
export type OrderStatus = "PENDIENTE" | "EN PROCESO" | "PAGADO" | "ARCHIVADO";
export type ProductCategory = string;

export interface Product {
  id: string;
  code: string;
  name: string;
  description: string;
  imageUri?: string;
  galleryImageUris?: string[];
  category: ProductCategory;
  collection?: string;
  colors?: string[];
  sizes?: string[];
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  showInCatalog: boolean;
  type: "FINAL" | "RECIPE" | "SERVICE";
}

export type ProductMovementType = "CREACIÓN" | "AJUSTE" | "IMPORTACIÓN" | "REVERSIÓN" | "VENTA_POS" | "VENTA_AGENTE" | "CANCELACIÓN";

export interface ProductMovement {
  id: string;
  productId: string;
  type: ProductMovementType;
  label: string;
  quantityDelta?: number;
  stockAfter?: number;
  createdAt: string;
}

export interface CartItem {
  id: string;
  productId?: string;
  productCode?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  unitCost?: number;
  collection?: string;
  isFreeSale: boolean;
}

export interface PaymentSplit {
  id: string;
  method: PaymentMethod;
  amount: number;
}

export type CashMovementType = "INGRESO" | "EGRESO";

export interface CashMovement {
  id: string;
  sessionId: string;
  type: CashMovementType;
  amount: number;
  concept: string;
  createdAt: string;
  createdTimestamp: number;
}

export interface CashSession {
  id: string;
  branchId: string;
  operatorName: string;
  openingBase: number;
  openedAt: string;
  openedTimestamp: number;
  closedAt?: string;
  closedTimestamp?: number;
  closingAmount?: number;
  difference?: number;
  status: "ABIERTA" | "CERRADA";
}

export interface Order {
  id: string;
  code: string;
  customerName: string;
  customerPhone?: string;
  status: OrderStatus;
  source: "POS" | "CATÁLOGO" | "AGENTE";
  delivery: "Mesa" | "Recogida" | "Domicilio";
  deliveryAddress?: string;
  deliveryFee?: number;
  branchId?: string;
  items: CartItem[];
  total: number;
  subtotal?: number;
  discount?: number;
  tax?: number;
  tip?: number;
  payments?: PaymentSplit[];
  createdAt: string;
  createdTimestamp?: number;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface DailySummary {
  sales: number;
  expenses: number;
  profit: number;
  orders: number;
}
