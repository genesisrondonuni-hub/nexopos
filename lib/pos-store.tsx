import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import type { CartItem, DailySummary, Order, OrderStatus, PaymentSplit, Product } from "@/shared/pos-types";

const starterProducts: Product[] = [
  { id: "p-arepa", name: "Arepa de queso", category: "Entradas", price: 8500, cost: 2900, stock: 32, minStock: 10, showInCatalog: true, type: "FINAL" },
  { id: "p-bowl", name: "Bowl campesino", category: "Platos", price: 21500, cost: 8200, stock: 14, minStock: 8, showInCatalog: true, type: "RECIPE" },
  { id: "p-hamb", name: "Hamburguesa Nexo", category: "Platos", price: 26900, cost: 10600, stock: 8, minStock: 8, showInCatalog: true, type: "RECIPE" },
  { id: "p-limo", name: "Limonada natural", category: "Bebidas", price: 7500, cost: 1800, stock: 28, minStock: 10, showInCatalog: true, type: "FINAL" },
  { id: "p-cafe", name: "Café americano", category: "Bebidas", price: 5200, cost: 900, stock: 45, minStock: 12, showInCatalog: true, type: "FINAL" },
  { id: "p-postre", name: "Torta de chocolate", category: "Postres", price: 9800, cost: 3400, stock: 6, minStock: 6, showInCatalog: false, type: "FINAL" },
];

const starterOrders: Order[] = [
  {
    id: "o-1048",
    code: "#1048",
    customerName: "Valentina Ruiz",
    customerPhone: "300 555 0183",
    status: "PENDIENTE",
    source: "CATÁLOGO",
    delivery: "Domicilio",
    total: 34400,
    createdAt: "Hace 6 min",
    items: [
      { id: "i-1", name: "Bowl campesino", quantity: 1, unitPrice: 21500, isFreeSale: false },
      { id: "i-2", name: "Limonada natural", quantity: 1, unitPrice: 7500, isFreeSale: false },
      { id: "i-3", name: "Empaque", quantity: 1, unitPrice: 5400, isFreeSale: true },
    ],
  },
  {
    id: "o-1047",
    code: "#1047",
    customerName: "Mesa 04",
    status: "EN PROCESO",
    source: "POS",
    delivery: "Mesa",
    total: 53800,
    createdAt: "Hace 14 min",
    items: [
      { id: "i-4", name: "Hamburguesa Nexo", quantity: 2, unitPrice: 26900, isFreeSale: false },
    ],
  },
  {
    id: "o-1046",
    code: "#1046",
    customerName: "Camilo Pérez",
    customerPhone: "301 212 4208",
    status: "PAGADO",
    source: "CATÁLOGO",
    delivery: "Recogida",
    total: 20200,
    createdAt: "Hace 28 min",
    items: [
      { id: "i-5", name: "Arepa de queso", quantity: 2, unitPrice: 8500, isFreeSale: false },
      { id: "i-6", name: "Café americano", quantity: 1, unitPrice: 3200, isFreeSale: false },
    ],
  },
];

const STORAGE_KEY = "@nexopos:operacion:v1";

type CheckoutInput = {
  payments: PaymentSplit[];
  tip: number;
};

type NexoContextValue = {
  products: Product[];
  orders: Order[];
  cart: CartItem[];
  summary: DailySummary;
  addToCart: (product: Product) => void;
  addFreeSale: () => void;
  setCartQuantity: (itemId: string, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  checkout: (input: CheckoutInput) => Order | null;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  toggleCatalog: (productId: string) => void;
  hydrated: boolean;
};

const NexoContext = createContext<NexoContextValue | undefined>(undefined);

export function NexoProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(starterProducts);
  const [orders, setOrders] = useState<Order[]>(starterOrders);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [summary, setSummary] = useState<DailySummary>({ sales: 1284400, expenses: 342800, profit: 941600, orders: 48 });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const restore = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (!saved) return;
        const state = JSON.parse(saved) as { products?: Product[]; orders?: Order[]; summary?: DailySummary };
        if (state.products) setProducts(state.products);
        if (state.orders) setOrders(state.orders);
        if (state.summary) setSummary(state.summary);
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
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ products, orders, summary }));
  }, [hydrated, products, orders, summary]);

  const addToCart = useCallback((product: Product) => {
    if (product.stock <= 0) return;
    setCart((current) => {
      const found = current.find((item) => item.productId === product.id);
      if (found) return current.map((item) => item.id === found.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...current, { id: `cart-${Date.now()}`, productId: product.id, name: product.name, quantity: 1, unitPrice: product.price, isFreeSale: false }];
    });
  }, []);

  const addFreeSale = useCallback(() => {
    setCart((current) => [...current, { id: `free-${Date.now()}`, name: "Venta libre", quantity: 1, unitPrice: 5000, isFreeSale: true }]);
  }, []);

  const setCartQuantity = useCallback((itemId: string, quantity: number) => {
    setCart((current) => quantity <= 0 ? current.filter((item) => item.id !== itemId) : current.map((item) => item.id === itemId ? { ...item, quantity } : item));
  }, []);

  const removeFromCart = useCallback((itemId: string) => setCart((current) => current.filter((item) => item.id !== itemId)), []);

  const checkout = useCallback((input: CheckoutInput) => {
    const subtotal = cart.reduce((total, item) => total + item.quantity * item.unitPrice, 0);
    const total = subtotal + input.tip;
    const paid = input.payments.reduce((value, payment) => value + payment.amount, 0);
    if (!cart.length || Math.abs(total - paid) > 0.01) return null;

    const order: Order = {
      id: `o-${Date.now()}`,
      code: `#${1050 + orders.length}`,
      customerName: "Venta de mostrador",
      status: "PAGADO",
      source: "POS",
      delivery: "Mesa",
      total,
      createdAt: "Ahora",
      items: cart,
    };

    setOrders((current) => [order, ...current]);
    setProducts((current) => current.map((product) => {
      const sold = cart.filter((item) => item.productId === product.id).reduce((qty, item) => qty + item.quantity, 0);
      return sold ? { ...product, stock: Math.max(0, product.stock - sold) } : product;
    }));
    setSummary((current) => ({ ...current, sales: current.sales + total, profit: current.profit + total - cart.reduce((cost, item) => {
      const product = products.find((entry) => entry.id === item.productId);
      return cost + (product?.cost ?? 0) * item.quantity;
    }, 0), orders: current.orders + 1 }));
    setCart([]);
    return order;
  }, [cart, orders.length, products]);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus) => {
    setOrders((current) => current.map((order) => order.id === orderId ? { ...order, status } : order));
  }, []);

  const toggleCatalog = useCallback((productId: string) => {
    setProducts((current) => current.map((product) => product.id === productId ? { ...product, showInCatalog: !product.showInCatalog } : product));
  }, []);

  const value = useMemo(() => ({ products, orders, cart, summary, addToCart, addFreeSale, setCartQuantity, removeFromCart, checkout, updateOrderStatus, toggleCatalog, hydrated }), [products, orders, cart, summary, addToCart, addFreeSale, setCartQuantity, removeFromCart, checkout, updateOrderStatus, toggleCatalog, hydrated]);

  return <NexoContext.Provider value={value}>{children}</NexoContext.Provider>;
}

export function useNexo() {
  const context = useContext(NexoContext);
  if (!context) throw new Error("useNexo debe usarse dentro de NexoProvider");
  return context;
}
