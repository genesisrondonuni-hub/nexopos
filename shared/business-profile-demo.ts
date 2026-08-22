import { getProfileCatalogImage, getProfileStarterCatalog } from "./business-profile-content";
import { createProductCode } from "./product-code";
import type { BusinessProfileId } from "./business-types";
import type { CartItem, Order, Product } from "./pos-types";
import type { SalesOpportunity } from "./crm-types";

type DemoContext = { customer: string; phone: string; subject: string; appointmentAt?: string; location: string; delivery: Order["delivery"]; source: Order["source"]; crmSource: SalesOpportunity["source"] };

const CONTEXT: Record<BusinessProfileId, DemoContext> = {
  RESTAURANT: { customer: "Mesa 08", phone: "3005550183", subject: "Reserva para almuerzo · 12:30", location: "Salón principal", delivery: "Mesa", source: "POS", crmSource: "PRESENCIAL" },
  FAST_FOOD: { customer: "Camila Torres", phone: "3014201098", subject: "Pedido de combo para recogida", location: "Mostrador", delivery: "Recogida", source: "CATÁLOGO", crmSource: "CATÁLOGO" },
  SUPERMARKET: { customer: "Andrés Pardo", phone: "3152267081", subject: "Pedido de mercado a domicilio", location: "Zona de cobertura", delivery: "Domicilio", source: "CATÁLOGO", crmSource: "CATÁLOGO" },
  GROCERY: { customer: "Diana Rojas", phone: "3008452190", subject: "Canasta de productos frescos", location: "Barrio cercano", delivery: "Domicilio", source: "CATÁLOGO", crmSource: "WHATSAPP" },
  WAREHOUSE: { customer: "Distribuciones Central", phone: "3165599202", subject: "Cotización de surtido mayorista", location: "Bodega principal", delivery: "Recogida", source: "POS", crmSource: "PRESENCIAL" },
  LIQUOR_STORE: { customer: "Julio Moreno", phone: "3146607814", subject: "Pedido nocturno con validación de edad", location: "Zona de cobertura", delivery: "Domicilio", source: "CATÁLOGO", crmSource: "WHATSAPP" },
  MEDICAL_OFFICE: { customer: "Laura Gómez", phone: "3005550183", subject: "Cita de consulta general", appointmentAt: "Hoy · 09:30", location: "Sede principal", delivery: "Recogida", source: "CATÁLOGO", crmSource: "CATÁLOGO" },
  CLINICAL_LAB: { customer: "Valeria Torres", phone: "3012124208", subject: "Toma de muestra · Hemograma", appointmentAt: "Hoy · 08:00", location: "Sede de toma de muestras", delivery: "Recogida", source: "CATÁLOGO", crmSource: "CATÁLOGO" },
  DENTAL_CLINIC: { customer: "Sofía Martínez", phone: "3158816712", subject: "Valoración odontológica", appointmentAt: "Hoy · 15:00", location: "Sede odontológica", delivery: "Recogida", source: "CATÁLOGO", crmSource: "WHATSAPP" },
  VETERINARY_LAB: { customer: "Clínica Patas", phone: "3174049120", subject: "Recepción de muestra veterinaria", appointmentAt: "Hoy · 10:00", location: "Recepción de muestras", delivery: "Recogida", source: "POS", crmSource: "PRESENCIAL" },
  VETERINARY_OFFICE: { customer: "Mariana López", phone: "3017406505", subject: "Cita veterinaria para mascota", appointmentAt: "Hoy · 11:30", location: "Consultorio veterinario", delivery: "Recogida", source: "CATÁLOGO", crmSource: "WHATSAPP" },
  SHOE_STORE: { customer: "Natalia Ruiz", phone: "3135557601", subject: "Pedido de tenis urbanos talla 38", location: "Tienda de calzado", delivery: "Recogida", source: "CATÁLOGO", crmSource: "CATÁLOGO" },
  CLOTHING_STORE: { customer: "Paula Méndez", phone: "3006089943", subject: "Pedido de camiseta básica talla M", location: "Tienda de ropa", delivery: "Recogida", source: "CATÁLOGO", crmSource: "CATÁLOGO" },
  ONLINE_STORE: { customer: "Daniel Romero", phone: "3162280102", subject: "Pedido web para despacho", location: "Despacho nacional", delivery: "Domicilio", source: "CATÁLOGO", crmSource: "CATÁLOGO" },
};

function getProfit(items: CartItem[]) { return items.reduce((sum, item) => sum + (item.unitPrice - (item.unitCost ?? 0)) * item.quantity, 0); }

export function getProfileDemoData(profileId: BusinessProfileId, now = Date.now()) {
  const context = CONTEXT[profileId];
  const imageUri = getProfileCatalogImage(profileId);
  const products: Product[] = getProfileStarterCatalog(profileId).map((item, index) => ({ id: `demo-${profileId.toLowerCase()}-${index + 1}`, code: createProductCode(`${profileId}-${item.name}`, index), name: item.name, description: item.description, imageUri, galleryImageUris: imageUri ? [imageUri] : undefined, category: item.category, collection: item.collection, colors: item.colors, sizes: item.sizes, price: item.price ?? 0, cost: item.cost ?? 0, stock: item.stock ?? (item.type === "SERVICE" ? 1 : 12), minStock: 1, showInCatalog: true, type: item.type }));
  const toCartItem = (product: Product, id: string): CartItem => ({ id, productId: product.id, productCode: product.code, name: product.name, quantity: 1, unitPrice: product.price, unitCost: product.cost, collection: product.collection, isFreeSale: false });
  const first = products[0];
  const second = products[1] ?? first;
  const primaryItems = first ? [toCartItem(first, `demo-item-${profileId}-1`)] : [];
  const secondaryItems = second ? [toCartItem(second, `demo-item-${profileId}-2`)] : [];
  const order = (suffix: string, status: Order["status"], items: CartItem[], timestamp: number): Order => ({ id: `demo-order-${profileId.toLowerCase()}-${suffix}`, code: `#DEMO-${suffix}`, customerName: profileId === "RESTAURANT" ? context.customer : `${context.customer} · ${context.subject}`, customerPhone: context.phone, status, source: context.source, delivery: context.delivery, deliveryAddress: context.delivery === "Domicilio" ? context.location : undefined, total: items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0), createdAt: suffix === "01" ? "Hace 18 min" : "Hace 46 min", createdTimestamp: timestamp, branchId: "main", items });
  const orders = first ? [order("01", "PENDIENTE", primaryItems, now - 18 * 60 * 1000), order("02", "PAGADO", secondaryItems, now - 46 * 60 * 1000)] : [];
  return { products, orders, sales: orders.reduce((sum, entry) => sum + entry.total, 0), profit: [...primaryItems, ...secondaryItems].length ? getProfit([...primaryItems, ...secondaryItems]) : 0 };
}

export function getProfileDemoOpportunities(profileId: BusinessProfileId): SalesOpportunity[] {
  const context = CONTEXT[profileId];
  const catalog = getProfileStarterCatalog(profileId);
  return [
    { id: `demo-crm-${profileId.toLowerCase()}-1`, customerName: context.customer, phone: context.phone, stageId: "lead", source: context.crmSource, value: catalog[0]?.price ?? 0, lastActivity: "Hace 8 min", subject: context.subject, appointmentAt: context.appointmentAt, address: context.location },
    { id: `demo-crm-${profileId.toLowerCase()}-2`, customerName: profileId === "RESTAURANT" ? "Mesa 03" : "Cliente de ejemplo", phone: "3025558190", stageId: "contacted", source: "WHATSAPP", value: catalog[1]?.price ?? catalog[0]?.price ?? 0, lastActivity: "Hace 26 min", subject: profileId === "CLINICAL_LAB" ? "Perfil lipídico" : `Seguimiento · ${catalog[1]?.name ?? "Solicitud comercial"}`, appointmentAt: context.appointmentAt ? "Hoy · 10:30" : undefined, address: context.location },
  ];
}

export function isDemoProductId(productId: string) { return productId.startsWith("demo-") || productId.startsWith("p-"); }
export function isDemoOrderId(orderId: string) { return orderId.startsWith("demo-order-") || orderId === "o-1048" || orderId === "o-1047" || orderId === "o-1046"; }
export function isDemoOpportunityId(opportunityId: string) { return opportunityId.startsWith("demo-crm-") || opportunityId.startsWith("crm-"); }
