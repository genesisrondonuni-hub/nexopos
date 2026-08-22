import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { DEFAULT_SHOP_WHATSAPP_NUMBER, isValidWhatsAppNumber, normalizeWhatsAppNumber } from "@/lib/whatsapp";
import type { CartItem, CashMovement, CashSession, DailySummary, Order, OrderStatus, PaymentSplit, Product, ProductMovement } from "@/shared/pos-types";
import { getCashSessionSummary } from "@/shared/cash-utils";
import type { SupplierReceiptLine } from "@/shared/supply-types";
import { applyInventoryImport, revertInventoryImport, type ImportedInventoryProduct, type InventoryImportRecord } from "@/shared/inventory-import";
import { createProductCode, getBarcodeValidation, isValidProductCode, normalizeProductCode } from "@/shared/product-code";
import { getProfileDemoData, isDemoOrderId, isDemoProductId } from "@/shared/business-profile-demo";
import type { BusinessProfileId } from "@/shared/business-types";

const restaurantDemo = getProfileDemoData("RESTAURANT");
const starterProducts: Product[] = restaurantDemo.products;
const starterOrders: Order[] = restaurantDemo.orders;

const STORAGE_KEY = "@nexopos:operacion:v1";

type CheckoutInput = {
  payments: PaymentSplit[];
  tip: number;
  discount?: number;
  tax?: number;
};

type PublicOrderInput = {
  customerName: string;
  customerPhone: string;
  delivery: "Recogida" | "Domicilio";
  deliveryAddress?: string;
  deliveryFee?: number;
};

type AgentOrderInput = {
  customerName: string;
  customerPhone: string;
  delivery: "Recogida" | "Domicilio";
  deliveryAddress?: string;
  items: Array<{ productId: string; quantity: number }>;
};

export type BusinessSettings = {
  whatsappNumber: string;
  activeBranchId: string;
};

type NexoContextValue = {
  products: Product[];
  orders: Order[];
  cart: CartItem[];
  catalogCart: CartItem[];
  businessSettings: BusinessSettings;
  cashSession: CashSession | null;
  cashMovements: CashMovement[];
  summary: DailySummary;
  addToCart: (product: Product) => void;
  addFreeSale: () => void;
  setCartQuantity: (itemId: string, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  checkout: (input: CheckoutInput) => Order | null;
  openCashSession: (input: { operatorName: string; openingBase: number }) => { opened: boolean; reason?: string };
  closeCashSession: (closingAmount: number) => { closed: boolean; difference?: number; reason?: string };
  recordCashMovement: (input: { type: CashMovement["type"]; amount: number; concept: string }) => { recorded: boolean; reason?: string };
  addToCatalogCart: (product: Product) => void;
  setCatalogQuantity: (itemId: string, quantity: number) => void;
  createPublicOrder: (input: PublicOrderInput) => Order | null;
  createAgentOrder: (input: AgentOrderInput) => { order?: Order; reason?: string };
  cancelPendingOrder: (orderId: string, windowMinutes: number) => { cancelled: boolean; reason?: string };
  updateWhatsAppNumber: (value: string) => boolean;
  updateActiveBranch: (branchId: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  assignKitchenStation: (orderId: string, station: string) => void;
  toggleCatalog: (productId: string) => void;
  updateProductCategory: (productId: string, category: string) => void;
  createProduct: (product: Omit<Product, "id">) => { created: boolean; reason?: string };
  updateProductDetails: (productId: string, changes: Pick<Product, "code" | "name" | "description" | "imageUri" | "category" | "price" | "cost" | "stock" | "minStock">) => { updated: boolean; reason?: string };
  applyProductImages: (images: Array<{ productId: string; imageUri: string }>) => { updated: number };
  applyImportedProductCodes: (updates: Array<{ productId: string; code: string }>) => { updated: number; reason?: string };
  upsertImportedProducts: (products: ImportedInventoryProduct[], source?: string) => { created: number; updated: number; importId: string };
  receiveSupplierStock: (lines: SupplierReceiptLine[]) => { applied: number; unmatched: number };
  importHistory: InventoryImportRecord[];
  productMovements: ProductMovement[];
  revertImport: (importId: string) => { reverted: boolean; reason?: string };
  replaceProfileDemo: (profileId: BusinessProfileId, edited?: { products: Product[]; orders: Order[] }) => { products: number; orders: number };
  hydrated: boolean;
};

const NexoContext = createContext<NexoContextValue | undefined>(undefined);

export function NexoProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(starterProducts);
  const [orders, setOrders] = useState<Order[]>(starterOrders);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [catalogCart, setCatalogCart] = useState<CartItem[]>([]);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>({ whatsappNumber: DEFAULT_SHOP_WHATSAPP_NUMBER, activeBranchId: "main" });
  const [cashSession, setCashSession] = useState<CashSession | null>(null);
  const [cashMovements, setCashMovements] = useState<CashMovement[]>([]);
  const [summary, setSummary] = useState<DailySummary>({ sales: restaurantDemo.sales, expenses: 0, profit: restaurantDemo.profit, orders: restaurantDemo.orders.length });
  const [importHistory, setImportHistory] = useState<InventoryImportRecord[]>([]);
  const [productMovements, setProductMovements] = useState<ProductMovement[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const restore = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (!saved) return;
        const state = JSON.parse(saved) as { products?: Product[]; orders?: Order[]; summary?: DailySummary; businessSettings?: BusinessSettings; importHistory?: InventoryImportRecord[]; productMovements?: ProductMovement[]; cashSession?: CashSession | null; cashMovements?: CashMovement[] };
        if (state.products) setProducts(state.products.map((product, index) => ({ ...product, code: isValidProductCode(product.code ?? "") ? product.code : createProductCode(product.name, index), description: product.description?.trim() || `Producto de ${product.category}` })));
        if (state.orders) setOrders(state.orders);
        if (state.summary) setSummary(state.summary);
        if (state.businessSettings && isValidWhatsAppNumber(state.businessSettings.whatsappNumber)) {
          setBusinessSettings({ whatsappNumber: normalizeWhatsAppNumber(state.businessSettings.whatsappNumber), activeBranchId: state.businessSettings.activeBranchId || "main" });
        }
        if (state.importHistory) setImportHistory(state.importHistory);
        if (state.productMovements) setProductMovements(state.productMovements);
        if (state.cashSession) setCashSession(state.cashSession);
        if (state.cashMovements) setCashMovements(state.cashMovements);
      } catch {
        // The starter data remains available when local data cannot be restored.
      } finally {
        setHydrated(true);
      }
    };
    void restore();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ products, orders, summary, businessSettings, importHistory, productMovements, cashSession, cashMovements }));
  }, [hydrated, products, orders, summary, businessSettings, importHistory, productMovements, cashSession, cashMovements]);

  const addToCart = useCallback((product: Product) => {
    if (product.stock <= 0) return;
    setCart((current) => {
      const found = current.find((item) => item.productId === product.id);
      if (found) return current.map((item) => item.id === found.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...current, { id: `cart-${Date.now()}`, productId: product.id, productCode: product.code, name: product.name, quantity: 1, unitPrice: product.price, unitCost: product.cost, collection: product.collection, isFreeSale: false }];
    });
  }, []);

  const addFreeSale = useCallback(() => {
    setCart((current) => [...current, { id: `free-${Date.now()}`, name: "Venta libre", quantity: 1, unitPrice: 5000, isFreeSale: true }]);
  }, []);

  const setCartQuantity = useCallback((itemId: string, quantity: number) => {
    setCart((current) => quantity <= 0 ? current.filter((item) => item.id !== itemId) : current.map((item) => item.id === itemId ? { ...item, quantity } : item));
  }, []);

  const removeFromCart = useCallback((itemId: string) => setCart((current) => current.filter((item) => item.id !== itemId)), []);

  const addToCatalogCart = useCallback((product: Product) => {
    if (!product.showInCatalog || product.stock <= 0) return;
    setCatalogCart((current) => {
      const found = current.find((item) => item.productId === product.id);
      if (found) return current.map((item) => item.id === found.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...current, { id: `shop-${Date.now()}`, productId: product.id, productCode: product.code, name: product.name, quantity: 1, unitPrice: product.price, unitCost: product.cost, collection: product.collection, isFreeSale: false }];
    });
  }, []);

  const setCatalogQuantity = useCallback((itemId: string, quantity: number) => {
    setCatalogCart((current) => quantity <= 0 ? current.filter((item) => item.id !== itemId) : current.map((item) => item.id === itemId ? { ...item, quantity } : item));
  }, []);

  const checkout = useCallback((input: CheckoutInput) => {
    const subtotal = cart.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
    const discount = Math.min(subtotal, Math.max(0, input.discount ?? 0));
    const tax = Math.max(0, input.tax ?? 0);
    const total = subtotal - discount + tax + input.tip;
    const paid = input.payments.reduce((value, payment) => value + payment.amount, 0);
    if (!cart.length || Math.abs(total - paid) > 0.01) return null;

    const timestamp = Date.now();
    const order: Order = {
      id: `o-${Date.now()}`,
      code: `#${1050 + orders.length}`,
      customerName: "Venta de mostrador",
      status: "PAGADO",
      source: "POS",
      delivery: "Mesa",
      total,
      subtotal,
      discount,
      tax,
      tip: input.tip,
      payments: input.payments,
      createdAt: "Ahora",
      createdTimestamp: timestamp,
      branchId: businessSettings.activeBranchId,
      items: cart,
    };

    setOrders((current) => [order, ...current]);
    setProducts((current) => current.map((product) => {
      const sold = cart.filter((item) => item.productId === product.id).reduce((qty, item) => qty + item.quantity, 0);
      return sold ? { ...product, stock: Math.max(0, product.stock - sold) } : product;
    }));
    setProductMovements((current) => {
      const sales = cart.filter((item) => item.productId).map((item) => {
        const product = products.find((entry) => entry.id === item.productId);
        return { id: `mov-sale-${Date.now()}-${item.id}`, productId: item.productId!, type: "VENTA_POS" as const, label: `Venta POS ${order.code}`, quantityDelta: -item.quantity, stockAfter: product ? Math.max(0, product.stock - item.quantity) : undefined, createdAt: "Ahora" };
      });
      return [...sales, ...current].slice(0, 400);
    });
    setSummary((current) => ({ ...current, sales: current.sales + total, profit: current.profit + total - cart.reduce((cost, item) => {
      const product = products.find((entry) => entry.id === item.productId);
      return cost + (item.unitCost ?? product?.cost ?? 0) * item.quantity;
    }, 0), orders: current.orders + 1 }));
    setCart([]);
    return order;
  }, [businessSettings.activeBranchId, cart, orders.length, products]);

  const openCashSession = useCallback((input: { operatorName: string; openingBase: number }) => {
    if (cashSession?.status === "ABIERTA") return { opened: false, reason: "Ya existe una caja abierta. Cierra o arquea el turno actual antes de abrir otro." };
    const operatorName = input.operatorName.trim() || "Operador";
    const openingBase = Math.max(0, input.openingBase);
    const now = Date.now();
    setCashSession({ id: `cash-${now}`, branchId: businessSettings.activeBranchId, operatorName, openingBase, openedAt: "Ahora", openedTimestamp: now, status: "ABIERTA" });
    return { opened: true };
  }, [businessSettings.activeBranchId, cashSession]);

  const recordCashMovement = useCallback((input: { type: CashMovement["type"]; amount: number; concept: string }) => {
    if (!cashSession || cashSession.status !== "ABIERTA") return { recorded: false, reason: "Abre una caja antes de registrar ingresos o egresos." };
    const amount = Math.max(0, input.amount);
    const concept = input.concept.trim();
    if (!amount || !concept) return { recorded: false, reason: "Indica un concepto y un valor mayor a cero." };
    const now = Date.now();
    const movement: CashMovement = { id: `cash-mov-${now}`, sessionId: cashSession.id, type: input.type, amount, concept, createdAt: "Ahora", createdTimestamp: now };
    setCashMovements((current) => [movement, ...current].slice(0, 200));
    if (input.type === "EGRESO") setSummary((current) => ({ ...current, expenses: current.expenses + amount, profit: current.profit - amount }));
    return { recorded: true };
  }, [cashSession]);

  const closeCashSession = useCallback((closingAmount: number) => {
    if (!cashSession || cashSession.status !== "ABIERTA") return { closed: false, reason: "No hay una caja abierta para cerrar." };
    const summary = getCashSessionSummary(cashSession, orders, cashMovements);
    const amount = Math.max(0, closingAmount);
    const difference = amount - summary.expected;
    const now = Date.now();
    setCashSession({ ...cashSession, status: "CERRADA", closingAmount: amount, difference, closedAt: "Ahora", closedTimestamp: now });
    return { closed: true, difference };
  }, [cashMovements, cashSession, orders]);

  const createPublicOrder = useCallback((input: PublicOrderInput) => {
    if (!catalogCart.length) return null;
    const total = catalogCart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) + (input.deliveryFee ?? 0);
    const timestamp = Date.now();
    const order: Order = {
      id: `o-${Date.now()}`,
      code: `#${1050 + orders.length}`,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      status: "PENDIENTE",
      source: "CATÁLOGO",
      delivery: input.delivery,
      deliveryAddress: input.deliveryAddress,
      deliveryFee: input.deliveryFee,
      total,
      createdAt: "Ahora",
      createdTimestamp: timestamp,
      branchId: businessSettings.activeBranchId,
      items: catalogCart,
    };
    setOrders((current) => [order, ...current]);
    setCatalogCart([]);
    return order;
  }, [businessSettings.activeBranchId, catalogCart, orders.length]);

  const createAgentOrder = useCallback((input: AgentOrderInput) => {
    const customerName = input.customerName.trim();
    const customerPhone = input.customerPhone.replace(/\D/g, "");
    if (customerName.length < 2 || customerPhone.length < 7 || !input.items.length) return { reason: "Completa el nombre, teléfono y al menos un producto." };
    if (input.delivery === "Domicilio" && !input.deliveryAddress?.trim()) return { reason: "Ingresa la dirección para coordinar el domicilio." };
    const requested = input.items.map((item) => ({ ...item, product: products.find((product) => product.id === item.productId) })).filter((item): item is { productId: string; quantity: number; product: Product } => Boolean(item.product && Number.isInteger(item.quantity) && item.quantity > 0));
    if (requested.length !== input.items.length || requested.some((item) => item.product.stock < item.quantity)) return { reason: "Uno o más productos ya no tienen existencias suficientes." };
    const items: CartItem[] = requested.map((item, index) => ({ id: `agent-${Date.now()}-${index}`, productId: item.product.id, productCode: item.product.code, name: item.product.name, quantity: item.quantity, unitPrice: item.product.price, unitCost: item.product.cost, collection: item.product.collection, isFreeSale: false }));
    const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const timestamp = Date.now();
    const order: Order = { id: `o-agent-${timestamp}`, code: `#${1050 + orders.length}`, customerName, customerPhone, status: "PENDIENTE", source: "AGENTE", delivery: input.delivery, deliveryAddress: input.deliveryAddress?.trim(), total, createdAt: "Ahora", createdTimestamp: timestamp, branchId: businessSettings.activeBranchId, items };
    setOrders((current) => [order, ...current]);
    setProducts((current) => current.map((product) => { const sold = requested.find((item) => item.productId === product.id)?.quantity ?? 0; return sold ? { ...product, stock: product.stock - sold } : product; }));
    setProductMovements((current) => [...requested.map((item, index) => ({ id: `mov-agent-${Date.now()}-${index}`, productId: item.productId, type: "VENTA_AGENTE" as const, label: `Pedido del agente ${order.code}`, quantityDelta: -item.quantity, stockAfter: item.product.stock - item.quantity, createdAt: "Ahora" })), ...current].slice(0, 400));
    setSummary((current) => ({ ...current, sales: current.sales + total, profit: current.profit + total - requested.reduce((sum, item) => sum + item.product.cost * item.quantity, 0), orders: current.orders + 1 }));
    return { order };
  }, [businessSettings.activeBranchId, orders.length, products]);

  const cancelPendingOrder = useCallback((orderId: string, windowMinutes: number) => {
    const order = orders.find((item) => item.id === orderId);
    if (!order || order.status !== "PENDIENTE") return { cancelled: false, reason: "Solo es posible cancelar pedidos que aún están pendientes." };
    const elapsedMinutes = (Date.now() - (order.createdTimestamp ?? Date.now())) / 60_000;
    if (elapsedMinutes > windowMinutes) return { cancelled: false, reason: "La ventana de cancelación configurada ya terminó." };
    setOrders((current) => current.map((item) => item.id === orderId ? { ...item, status: "ARCHIVADO", cancelledAt: "Ahora", cancellationReason: "Cancelado por operador" } : item));
    setProducts((current) => current.map((product) => { const restored = order.items.filter((item) => item.productId === product.id).reduce((sum, item) => sum + item.quantity, 0); return restored ? { ...product, stock: product.stock + restored } : product; }));
    setProductMovements((current) => [...order.items.filter((item) => item.productId).map((item, index) => ({ id: `mov-cancel-${Date.now()}-${index}`, productId: item.productId!, type: "CANCELACIÓN" as const, label: `Cancelación ${order.code}`, quantityDelta: item.quantity, createdAt: "Ahora" })), ...current].slice(0, 400));
    if (order.source === "AGENTE") setSummary((current) => ({ ...current, sales: Math.max(0, current.sales - order.total), profit: Math.max(0, current.profit - (order.total - order.items.reduce((sum, item) => sum + (item.unitCost ?? products.find((product) => product.id === item.productId)?.cost ?? 0) * item.quantity, 0))), orders: Math.max(0, current.orders - 1) }));
    return { cancelled: true };
  }, [orders, products]);

  const updateWhatsAppNumber = useCallback((value: string) => {
    if (!isValidWhatsAppNumber(value)) return false;
    setBusinessSettings((current) => ({ ...current, whatsappNumber: normalizeWhatsAppNumber(value) }));
    return true;
  }, []);

  const updateActiveBranch = useCallback((branchId: string) => {
    const normalized = branchId.trim();
    if (normalized) setBusinessSettings((current) => ({ ...current, activeBranchId: normalized }));
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    const timestamp = Date.now();
    setOrders((current) => current.map((order) => order.id === orderId ? { ...order, status, kitchenStartedTimestamp: status === "EN PROCESO" ? order.kitchenStartedTimestamp ?? timestamp : order.kitchenStartedTimestamp, kitchenReadyTimestamp: status === "PAGADO" ? timestamp : order.kitchenReadyTimestamp } : order));
  }, []);

  const assignKitchenStation = useCallback((orderId: string, station: string) => {
    const normalized = station.trim();
    if (normalized) setOrders((current) => current.map((order) => order.id === orderId ? { ...order, kitchenStation: normalized } : order));
  }, []);

  const toggleCatalog = useCallback((productId: string) => {
    setProducts((current) => current.map((product) => product.id === productId ? { ...product, showInCatalog: !product.showInCatalog } : product));
  }, []);

  const updateProductCategory = useCallback((productId: string, category: string) => {
    const normalized = category.trim();
    if (!normalized) return;
    setProducts((current) => current.map((product) => product.id === productId ? { ...product, category: normalized } : product));
  }, []);

  const createProduct = useCallback((product: Omit<Product, "id">) => {
    const code = normalizeProductCode(product.code);
    if (!isValidProductCode(code)) return { created: false, reason: "El código debe tener entre 2 y 32 caracteres alfanuméricos." };
    if (!product.name.trim() || !product.description.trim()) return { created: false, reason: "Ingresa un nombre y una descripción para el producto." };
    if (products.some((entry) => entry.code === code)) return { created: false, reason: "Ya existe un producto con este código." };
    const id = `product-${Date.now()}`;
    const created = { ...product, id, code, name: product.name.trim(), description: product.description.trim() };
    setProducts((current) => [...current, created]);
    setProductMovements((current) => [{ id: `mov-create-${Date.now()}`, productId: id, type: "CREACIÓN" as const, label: "Producto creado", quantityDelta: created.stock, stockAfter: created.stock, createdAt: "Ahora" }, ...current].slice(0, 400));
    return { created: true };
  }, [products]);

  const updateProductDetails = useCallback((productId: string, changes: Pick<Product, "code" | "name" | "description" | "imageUri" | "galleryImageUris" | "category" | "collection" | "colors" | "sizes" | "price" | "cost" | "stock" | "minStock">) => {
    const code = normalizeProductCode(changes.code);
    if (!isValidProductCode(code) || !changes.name.trim() || !changes.description.trim()) return { updated: false, reason: "Revisa el código, nombre y descripción del producto." };
    if (products.some((entry) => entry.id !== productId && entry.code === code)) return { updated: false, reason: "Ya existe otro producto con este código." };
    const previous = products.find((product) => product.id === productId);
    setProducts((current) => current.map((product) => product.id === productId ? { ...product, ...changes, code, name: changes.name.trim(), description: changes.description.trim() } : product));
    if (previous) {
      const quantityDelta = changes.stock - previous.stock;
      setProductMovements((current) => [{ id: `mov-adjust-${Date.now()}`, productId, type: "AJUSTE" as const, label: quantityDelta ? "Ajuste de existencias" : "Ficha del producto actualizada", quantityDelta, stockAfter: changes.stock, createdAt: "Ahora" }, ...current].slice(0, 400));
    }
    return { updated: true };
  }, [products]);

  const applyProductImages = useCallback((images: Array<{ productId: string; imageUri: string }>) => {
    const imageByProductId = new Map(images.map((image) => [image.productId, image.imageUri]));
    if (!imageByProductId.size) return { updated: 0 };
    setProducts((current) => current.map((product) => imageByProductId.has(product.id) ? { ...product, imageUri: imageByProductId.get(product.id) } : product));
    setProductMovements((current) => [...images.map((image, index) => ({ id: `mov-image-${Date.now()}-${index}`, productId: image.productId, type: "AJUSTE" as const, label: "Imagen de producto actualizada", createdAt: "Ahora" })), ...current].slice(0, 400));
    return { updated: imageByProductId.size };
  }, []);

  const applyImportedProductCodes = useCallback((updates: Array<{ productId: string; code: string }>) => {
    const codesByProduct = new Map(updates.map((update) => [update.productId, normalizeProductCode(update.code)]));
    if (!codesByProduct.size) return { updated: 0 };
    if (codesByProduct.size !== updates.length) return { updated: 0, reason: "El archivo contiene el mismo producto más de una vez." };
    const candidateProducts = products.map((product) => ({ ...product, code: codesByProduct.get(product.id) ?? product.code }));
    if (candidateProducts.some((product) => !isValidProductCode(product.code))) return { updated: 0, reason: "Uno de los códigos no tiene un formato válido." };
    if (candidateProducts.some((product) => { const barcode = getBarcodeValidation(product.code); return barcode.format !== null && !barcode.valid; })) return { updated: 0, reason: "Uno de los códigos EAN o UPC no supera el dígito de verificación." };
    if (new Set(candidateProducts.map((product) => product.code)).size !== candidateProducts.length) return { updated: 0, reason: "Los códigos deben ser únicos." };
    setProducts(candidateProducts);
    setProductMovements((current) => [...updates.map((update, index) => ({ id: `mov-code-import-${Date.now()}-${index}`, productId: update.productId, type: "AJUSTE" as const, label: "Código actualizado desde Excel", createdAt: "Ahora" })), ...current].slice(0, 400));
    return { updated: updates.length };
  }, [products]);

  const upsertImportedProducts = useCallback((importedProducts: ImportedInventoryProduct[], source = "Archivo") => {
    const result = applyInventoryImport(products, importedProducts, source);
    setProducts(result.products);
    setImportHistory((current) => [result.record, ...current].slice(0, 30));
    setProductMovements((current) => [...result.record.changes.map((change, index) => ({ id: `mov-import-${result.record.id}-${index}`, productId: change.productId, type: "IMPORTACIÓN" as const, label: `Importación · ${source}`, quantityDelta: change.after.stock - (change.before?.stock ?? 0), stockAfter: change.after.stock, createdAt: result.record.createdAt })), ...current].slice(0, 400));
    return { created: result.record.created, updated: result.record.updated, importId: result.record.id };
  }, [products]);

  const receiveSupplierStock = useCallback((lines: SupplierReceiptLine[]) => {
    const normalized = (value: string) => value.trim().toLocaleLowerCase();
    const matches = lines.map((line) => ({ line, product: products.find((product) => (line.code && product.code === line.code) || normalized(product.name) === normalized(line.name)) }));
    const applied = matches.filter((entry) => entry.product).length;
    const unmatched = matches.length - applied;
    const byProductId = new Map(matches.filter((entry): entry is { line: SupplierReceiptLine; product: Product } => Boolean(entry.product)).map((entry) => [entry.product.id, entry.line]));
    if (!byProductId.size) return { applied, unmatched };
    setProducts((current) => current.map((product) => {
      const line = byProductId.get(product.id);
      if (!line) return product;
      const nextStock = product.stock + line.quantity;
      const weightedCost = line.unitCost === undefined ? product.cost : ((product.cost * product.stock) + (line.unitCost * line.quantity)) / nextStock;
      return { ...product, stock: nextStock, cost: Math.round(weightedCost * 100) / 100 };
    }));
    const now = Date.now();
    setProductMovements((current) => [...matches.filter((entry): entry is { line: SupplierReceiptLine; product: Product } => Boolean(entry.product)).map((entry, index) => ({ id: `mov-supply-${now}-${index}`, productId: entry.product.id, type: "IMPORTACIÓN" as const, label: "Recepción de proveedor", quantityDelta: entry.line.quantity, stockAfter: entry.product.stock + entry.line.quantity, createdAt: "Ahora" })), ...current].slice(0, 400));
    return { applied, unmatched };
  }, [products]);

  const revertImport = useCallback((importId: string) => {
    const record = importHistory.find((entry) => entry.id === importId);
    if (!record) return { reverted: false, reason: "No encontramos este registro de importación." };
    const result = revertInventoryImport(products, record);
    if (!result.reverted) return result;
    setProducts(result.products);
    setImportHistory((current) => current.filter((entry) => entry.id !== importId));
    setProductMovements((current) => [...record.changes.filter((change) => change.before).map((change, index) => ({ id: `mov-revert-${record.id}-${index}`, productId: change.productId, type: "REVERSIÓN" as const, label: `Reversión de importación · ${record.source}`, quantityDelta: change.before!.stock - change.after.stock, stockAfter: change.before!.stock, createdAt: "Ahora" })), ...current].slice(0, 400));
    return { reverted: true };
  }, [importHistory, products]);

  const replaceProfileDemo = useCallback((profileId: BusinessProfileId, edited?: { products: Product[]; orders: Order[] }) => {
    const demo = edited ?? getProfileDemoData(profileId);
    setProducts((current) => [...current.filter((product) => !isDemoProductId(product.id)), ...demo.products]);
    setOrders((current) => [...current.filter((order) => !isDemoOrderId(order.id)), ...demo.orders]);
    setProductMovements((current) => current.filter((movement) => !isDemoProductId(movement.productId)));
    setCart([]);
    setCatalogCart([]);
    return { products: demo.products.length, orders: demo.orders.length };
  }, []);

  const value = useMemo(() => ({ products, orders, cart, catalogCart, businessSettings, cashSession, cashMovements, summary, importHistory, productMovements, addToCart, addFreeSale, setCartQuantity, removeFromCart, checkout, openCashSession, closeCashSession, recordCashMovement, addToCatalogCart, setCatalogQuantity, createPublicOrder, createAgentOrder, cancelPendingOrder, updateWhatsAppNumber, updateActiveBranch, updateOrderStatus, assignKitchenStation, toggleCatalog, updateProductCategory, createProduct, updateProductDetails, applyProductImages, applyImportedProductCodes, upsertImportedProducts, receiveSupplierStock, revertImport, replaceProfileDemo, hydrated }), [products, orders, cart, catalogCart, businessSettings, cashSession, cashMovements, summary, importHistory, productMovements, addToCart, addFreeSale, setCartQuantity, removeFromCart, checkout, openCashSession, closeCashSession, recordCashMovement, addToCatalogCart, setCatalogQuantity, createPublicOrder, createAgentOrder, cancelPendingOrder, updateWhatsAppNumber, updateActiveBranch, updateOrderStatus, assignKitchenStation, toggleCatalog, updateProductCategory, createProduct, updateProductDetails, applyProductImages, applyImportedProductCodes, upsertImportedProducts, receiveSupplierStock, revertImport, replaceProfileDemo, hydrated]);

  return <NexoContext.Provider value={value}>{children}</NexoContext.Provider>;
}

export function useNexo() {
  const context = useContext(NexoContext);
  if (!context) throw new Error("useNexo debe usarse dentro de NexoProvider");
  return context;
}
