import type { BusinessProfileId } from "./business-types";

export type BusinessExperience = {
  accent: string;
  soft: string;
  border: string;
  headline: string;
  caption: string;
  posLabel: string;
  inventoryLabel: string;
  crmLabel: string;
  customerLabel: string;
  orderLabel: string;
  agentLabel: string;
};

export const BUSINESS_EXPERIENCES: Record<BusinessProfileId, BusinessExperience> = {
  RESTAURANT: { accent: "#9A5B34", soft: "#FFF0E4", border: "#EDC9AD", headline: "Servicio y cocina en sincronía", caption: "Menú, mesas y recetas para una atención de salón fluida.", posLabel: "Comanda nueva", inventoryLabel: "Mise en place y existencias", crmLabel: "CRM de ventas", customerLabel: "Clientes", orderLabel: "Pedidos", agentLabel: "Agente gastronómico" },
  FAST_FOOD: { accent: "#C85632", soft: "#FFF0E9", border: "#F1C0B1", headline: "Pedidos rápidos, mostrador ágil", caption: "Combos, despacho inmediato y delivery en un solo flujo.", posLabel: "Pedido express", inventoryLabel: "Ingredientes y empaques", crmLabel: "CRM de pedidos", customerLabel: "Clientes", orderLabel: "Pedidos", agentLabel: "Agente de pedidos" },
  SUPERMARKET: { accent: "#28714B", soft: "#E8F5EB", border: "#B9DFC4", headline: "Venta de alto volumen", caption: "Productos empacados, stock y códigos para caja ágil.", posLabel: "Caja y escáner", inventoryLabel: "Góndola y reposición", crmLabel: "CRM comercial", customerLabel: "Clientes", orderLabel: "Pedidos", agentLabel: "Agente de góndola" },
  GROCERY: { accent: "#5A7D32", soft: "#F0F6E7", border: "#CDDFB4", headline: "Frescura para cada día", caption: "Unidades, peso y surtido esencial del barrio.", posLabel: "Venta de abasto", inventoryLabel: "Surtido por peso y unidad", crmLabel: "CRM de abasto", customerLabel: "Clientes", orderLabel: "Pedidos", agentLabel: "Agente de abasto" },
  WAREHOUSE: { accent: "#395E86", soft: "#E9F1F8", border: "#B9D1E6", headline: "Control para distribución", caption: "Surtido, precios mayoristas y reposición por volumen.", posLabel: "Despacho mayorista", inventoryLabel: "Bodega y distribución", crmLabel: "CRM mayorista", customerLabel: "Cuentas comerciales", orderLabel: "Despachos", agentLabel: "Agente mayorista" },
  LIQUOR_STORE: { accent: "#704079", soft: "#F5EAF6", border: "#DEC0E1", headline: "Catálogo nocturno controlado", caption: "Bebidas, validación de edad y delivery responsable.", posLabel: "Venta responsable", inventoryLabel: "Botellas y presentaciones", crmLabel: "CRM de ventas", customerLabel: "Clientes", orderLabel: "Pedidos", agentLabel: "Agente responsable" },
  MEDICAL_OFFICE: { accent: "#2F6F92", soft: "#E8F4F8", border: "#B9D9E8", headline: "Agenda y servicios administrativos", caption: "Solicitudes, horarios y seguimiento comercial sin información clínica.", posLabel: "Registrar servicio", inventoryLabel: "Insumos y servicios", crmLabel: "CRM de agenda", customerLabel: "Personas interesadas", orderLabel: "Solicitudes", agentLabel: "Agente de agenda" },
  CLINICAL_LAB: { accent: "#546AA5", soft: "#EFF1FB", border: "#CBD2EE", headline: "Servicios y agenda organizados", caption: "Seguimiento de solicitudes comerciales sin resultados clínicos.", posLabel: "Registrar solicitud", inventoryLabel: "Insumos y servicios", crmLabel: "CRM de solicitudes", customerLabel: "Personas interesadas", orderLabel: "Solicitudes", agentLabel: "Agente de servicios" },
  DENTAL_CLINIC: { accent: "#247D8A", soft: "#E7F6F7", border: "#B9DFE3", headline: "Agenda y presupuestos claros", caption: "Servicios, presupuestos y seguimiento sin ficha odontológica.", posLabel: "Registrar servicio", inventoryLabel: "Insumos y servicios", crmLabel: "CRM de agenda", customerLabel: "Personas interesadas", orderLabel: "Solicitudes", agentLabel: "Agente de citas" },
  VETERINARY_LAB: { accent: "#6A5A9C", soft: "#F0ECFA", border: "#D3C8EA", headline: "Servicios para tutores y clínicas", caption: "Solicitudes comerciales y logística sin datos clínicos de mascotas.", posLabel: "Registrar solicitud", inventoryLabel: "Insumos y servicios", crmLabel: "CRM de solicitudes", customerLabel: "Tutores y clínicas", orderLabel: "Solicitudes", agentLabel: "Agente veterinario" },
  VETERINARY_OFFICE: { accent: "#3D7C65", soft: "#E8F5EE", border: "#B9DFC9", headline: "Agenda y tienda para mascotas", caption: "Servicios, productos y solicitudes administrativas para tutores.", posLabel: "Registrar servicio", inventoryLabel: "Productos y suministros", crmLabel: "CRM veterinario", customerLabel: "Tutores", orderLabel: "Solicitudes", agentLabel: "Agente para tutores" },
  SHOE_STORE: { accent: "#9A5F3E", soft: "#FFF1E8", border: "#EFCDB9", headline: "Referencias, tallas y catálogo", caption: "Inventario por referencia y pedidos con atención personalizada.", posLabel: "Venta de calzado", inventoryLabel: "Referencias y tallas", crmLabel: "CRM de calzado", customerLabel: "Clientes", orderLabel: "Pedidos", agentLabel: "Asesor de calzado" },
  CLOTHING_STORE: { accent: "#A14D6A", soft: "#FFF0F4", border: "#EDC5D1", headline: "Colecciones, tallas y estilo", caption: "Prendas, referencias y ventas por catálogo con atención personalizada.", posLabel: "Venta de ropa", inventoryLabel: "Prendas, tallas y colecciones", crmLabel: "CRM de moda", customerLabel: "Clientes", orderLabel: "Pedidos", agentLabel: "Asesor de moda" },
  ONLINE_STORE: { accent: "#3A618F", soft: "#EAF1F8", border: "#BFD1E5", headline: "Ventas digitales conectadas", caption: "Catálogo, pedidos web, despacho y conversaciones comerciales.", posLabel: "Pedido en línea", inventoryLabel: "Catálogo y despacho", crmLabel: "CRM e-commerce", customerLabel: "Compradores", orderLabel: "Órdenes web", agentLabel: "Agente e-commerce" },
};
