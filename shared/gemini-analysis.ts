export type GeminiBusinessSnapshot = {
  summary: { sales: number; expenses: number; profit: number; orders: number };
  products: Array<{ name: string; category: string; stock: number; minStock: number; price: number; cost: number }>;
  opportunities: Array<{ stageId: string; source: string; value: number; deliveryStatus?: string }>;
};

export type GeminiPriority = {
  area: "INVENTARIO" | "VENTAS" | "CRM";
  severity: "ALTA" | "MEDIA" | "BAJA";
  title: string;
  detail: string;
  action: string;
};

export type GeminiAnalysis = {
  summary: string;
  priorities: GeminiPriority[];
};
