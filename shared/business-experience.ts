import type { BusinessProfileId } from "./business-types";

export type BusinessExperience = {
  accent: string;
  soft: string;
  border: string;
  headline: string;
  caption: string;
  posLabel: string;
  inventoryLabel: string;
};

export const BUSINESS_EXPERIENCES: Record<BusinessProfileId, BusinessExperience> = {
  RESTAURANT: { accent: "#9A5B34", soft: "#FFF0E4", border: "#EDC9AD", headline: "Servicio y cocina en sincronía", caption: "Menú, mesas y recetas para una atención de salón fluida.", posLabel: "Comanda nueva", inventoryLabel: "Mise en place y existencias" },
  FAST_FOOD: { accent: "#C85632", soft: "#FFF0E9", border: "#F1C0B1", headline: "Pedidos rápidos, mostrador ágil", caption: "Combos, despacho inmediato y delivery en un solo flujo.", posLabel: "Pedido express", inventoryLabel: "Ingredientes y empaques" },
  SUPERMARKET: { accent: "#28714B", soft: "#E8F5EB", border: "#B9DFC4", headline: "Venta de alto volumen", caption: "Productos empacados, stock y códigos para caja ágil.", posLabel: "Caja y escáner", inventoryLabel: "Góndola y reposición" },
  GROCERY: { accent: "#5A7D32", soft: "#F0F6E7", border: "#CDDFB4", headline: "Frescura para cada día", caption: "Unidades, peso y surtido esencial del barrio.", posLabel: "Venta de abasto", inventoryLabel: "Surtido por peso y unidad" },
  WAREHOUSE: { accent: "#395E86", soft: "#E9F1F8", border: "#B9D1E6", headline: "Control para distribución", caption: "Surtido, precios mayoristas y reposición por volumen.", posLabel: "Despacho mayorista", inventoryLabel: "Bodega y distribución" },
  LIQUOR_STORE: { accent: "#704079", soft: "#F5EAF6", border: "#DEC0E1", headline: "Catálogo nocturno controlado", caption: "Bebidas, validación de edad y delivery responsable.", posLabel: "Venta responsable", inventoryLabel: "Botellas y presentaciones" },
};
