import type { BranchSchedule } from "./crm-types";
import type { Order, Product } from "./pos-types";

export type ProductSalesMetric = {
  productId: string;
  code: string;
  name: string;
  category: string;
  collection: string;
  unitsSold: number;
  revenue: number;
  costOfSales: number;
  grossProfit: number;
  grossMargin: number;
  stock: number;
  currentPrice: number;
  currentCost: number;
  priceBelowCost: boolean;
  retirementReason?: string;
};

export type SalesGroupMetric = {
  id: string;
  name: string;
  orders: number;
  revenue: number;
  costOfSales: number;
  grossProfit: number;
};

export type SalesAnalytics = {
  activeOrders: number;
  productMetrics: ProductSalesMetric[];
  bestSellers: ProductSalesMetric[];
  leastSellers: ProductSalesMetric[];
  lossProducts: ProductSalesMetric[];
  exitCandidates: ProductSalesMetric[];
  branches: SalesGroupMetric[];
  collections: SalesGroupMetric[];
};

type BuildSalesAnalyticsInput = {
  products: Product[];
  orders: Order[];
  branches?: BranchSchedule[];
};

const emptyGroup = (id: string, name: string): SalesGroupMetric => ({ id, name, orders: 0, revenue: 0, costOfSales: 0, grossProfit: 0 });

function addGroupLine(group: SalesGroupMetric, revenue: number, cost: number) {
  group.revenue += revenue;
  group.costOfSales += cost;
  group.grossProfit += revenue - cost;
}

/** Crea métricas usando pedidos no anulados y conserva el costo histórico cuando existe. */
export function buildSalesAnalytics({ products, orders, branches = [] }: BuildSalesAnalyticsInput): SalesAnalytics {
  const activeOrders = orders.filter((order) => order.status !== "ARCHIVADO");
  const productById = new Map(products.map((product) => [product.id, product]));
  const salesByProduct = new Map<string, { unitsSold: number; revenue: number; costOfSales: number }>();
  const branchNames = new Map(branches.map((branch) => [branch.id, branch.name]));
  if (!branchNames.has("main")) branchNames.set("main", "Sede principal");
  const branchGroups = new Map<string, SalesGroupMetric>();
  const collectionGroups = new Map<string, SalesGroupMetric>();

  activeOrders.forEach((order) => {
    const branchId = order.branchId || "main";
    const branch = branchGroups.get(branchId) ?? emptyGroup(branchId, branchNames.get(branchId) ?? "Sede sin nombre");
    branch.orders += 1;
    branchGroups.set(branchId, branch);

    order.items.forEach((item) => {
      if (!item.productId || item.isFreeSale) return;
      const product = productById.get(item.productId);
      if (!product) return;
      const revenue = item.unitPrice * item.quantity;
      const cost = (item.unitCost ?? product.cost) * item.quantity;
      const productSale = salesByProduct.get(product.id) ?? { unitsSold: 0, revenue: 0, costOfSales: 0 };
      productSale.unitsSold += item.quantity;
      productSale.revenue += revenue;
      productSale.costOfSales += cost;
      salesByProduct.set(product.id, productSale);
      addGroupLine(branch, revenue, cost);

      const collectionName = item.collection?.trim() || product.collection?.trim() || product.category;
      const collection = collectionGroups.get(collectionName) ?? emptyGroup(collectionName, collectionName);
      collection.orders += 1;
      addGroupLine(collection, revenue, cost);
      collectionGroups.set(collectionName, collection);
    });
  });

  const productMetrics = products.map((product) => {
    const sales = salesByProduct.get(product.id) ?? { unitsSold: 0, revenue: 0, costOfSales: 0 };
    const grossProfit = sales.revenue - sales.costOfSales;
    const priceBelowCost = product.price < product.cost;
    const retirementReason = grossProfit < 0
      ? "Genera pérdida en las ventas registradas."
      : priceBelowCost
        ? "El precio actual está por debajo del costo."
        : sales.unitsSold === 0 && product.stock > 0
          ? `Sin ventas registradas y ${product.stock} unidades disponibles.`
          : undefined;
    return {
      productId: product.id,
      code: product.code,
      name: product.name,
      category: product.category,
      collection: product.collection?.trim() || product.category,
      unitsSold: sales.unitsSold,
      revenue: sales.revenue,
      costOfSales: sales.costOfSales,
      grossProfit,
      grossMargin: sales.revenue ? grossProfit / sales.revenue : 0,
      stock: product.stock,
      currentPrice: product.price,
      currentCost: product.cost,
      priceBelowCost,
      retirementReason,
    };
  });

  const byUnitsAscending = [...productMetrics].sort((a, b) => a.unitsSold - b.unitsSold || a.revenue - b.revenue || a.name.localeCompare(b.name));
  const byUnitsDescending = [...productMetrics].sort((a, b) => b.unitsSold - a.unitsSold || b.revenue - a.revenue || a.name.localeCompare(b.name));
  const byLoss = [...productMetrics].filter((metric) => metric.grossProfit < 0 || metric.priceBelowCost).sort((a, b) => a.grossProfit - b.grossProfit || a.name.localeCompare(b.name));

  return {
    activeOrders: activeOrders.length,
    productMetrics,
    bestSellers: byUnitsDescending.filter((metric) => metric.unitsSold > 0),
    leastSellers: byUnitsAscending.filter((metric) => metric.unitsSold > 0),
    lossProducts: byLoss,
    exitCandidates: productMetrics.filter((metric) => Boolean(metric.retirementReason)).sort((a, b) => (a.grossProfit - b.grossProfit) || (a.unitsSold - b.unitsSold) || a.name.localeCompare(b.name)),
    branches: [...branchGroups.values()].sort((a, b) => b.revenue - a.revenue || a.name.localeCompare(b.name)),
    collections: [...collectionGroups.values()].sort((a, b) => b.revenue - a.revenue || a.name.localeCompare(b.name)),
  };
}
