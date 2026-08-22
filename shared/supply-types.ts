export type PurchaseOrderStatus = "BORRADOR" | "ENVIADO" | "EN_DESPACHO" | "PARCIAL" | "RECIBIDO" | "CANCELADO";

export type Supplier = {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email?: string;
  leadDays: number;
  active: boolean;
  createdAt: string;
};

export type PurchaseOrderLine = {
  productId: string;
  code: string;
  name: string;
  requestedQuantity: number;
  receivedQuantity: number;
  unitCost: number;
};

export type PurchaseOrder = {
  id: string;
  supplierId: string;
  status: PurchaseOrderStatus;
  lines: PurchaseOrderLine[];
  createdAt: string;
  dispatchedAt?: string;
  receivedAt?: string;
  notes?: string;
};

export type SupplierReceiptLine = {
  code?: string;
  name: string;
  quantity: number;
  unitCost?: number;
};

export type SupplierReceipt = {
  id: string;
  supplierId: string;
  purchaseOrderId?: string;
  source: string;
  receivedAt: string;
  lines: SupplierReceiptLine[];
  appliedLines: number;
  unmatchedLines: number;
};
