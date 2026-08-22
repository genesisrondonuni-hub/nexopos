import type { BusinessFeatures, BusinessProfileId } from "./business-types";
import type { AgentServicePolicy } from "./crm-types";
import { isServiceAvailable } from "../lib/crm-utils";

export type SalesAgentIntent = "CATALOG_QUERY" | "ORDER_PROPOSAL" | "DELIVERY" | "HANDOFF";
export type SalesAgentDelivery = "PICKUP" | "DELIVERY" | "UNDECIDED";

export type SalesAgentProduct = { id: string; name: string; category: string; description: string; price: number; stock: number; code: string };
export type SalesAgentContext = { businessName: string; profileId: BusinessProfileId; features: BusinessFeatures; products: SalesAgentProduct[]; customerMessage: string; agentPolicy: AgentServicePolicy };
export type SalesAgentProposal = { productId: string; quantity: number };
export type SalesAgentReply = { reply: string; intent: SalesAgentIntent; delivery: SalesAgentDelivery; proposals: SalesAgentProposal[]; needsCustomerData: boolean; requiresConfirmation: true; mustVerifyAge: boolean };

const profileInstructions: Record<BusinessProfileId, string> = {
  RESTAURANT: "Habla de platos, preparación, mesas y recogida. Recomienda solo productos disponibles.",
  FAST_FOOD: "Prioriza pedidos rápidos, combos, tiempos de despacho y delivery.",
  SUPERMARKET: "Ayuda a localizar productos empacados, unidades, códigos y existencias reales.",
  GROCERY: "Aclara unidad o peso, disponibilidad y sustituciones prudentes para productos de abasto.",
  WAREHOUSE: "Orienta sobre surtido, cantidades y precios; no inventes condiciones mayoristas.",
  LIQUOR_STORE: "Ofrece bebidas disponibles y exige confirmación de mayoría de edad antes de un pedido con entrega.",
  MEDICAL_OFFICE: "Orienta únicamente sobre servicios comerciales, precios disponibles, horarios y solicitudes de cita. No solicites ni evalúes síntomas, diagnósticos, tratamientos, urgencias o historias clínicas; escala esos asuntos al personal habilitado.",
  CLINICAL_LAB: "Informa únicamente servicios comerciales, horarios y solicitudes. No solicites, interpretes ni comuniques resultados clínicos, diagnósticos, tratamientos o preparación médica no provista por el negocio; escala al personal habilitado.",
  DENTAL_CLINIC: "Orienta únicamente sobre servicios, presupuestos comerciales y agenda. No emitas valoraciones odontológicas, diagnósticos, tratamientos ni recomendaciones clínicas; escala esas preguntas al profesional habilitado.",
  VETERINARY_LAB: "Orienta únicamente sobre servicios comerciales, logística y disponibilidad. No evalúes animales, síntomas, muestras, resultados ni tratamientos; escala las consultas clínicas a personal veterinario habilitado.",
  VETERINARY_OFFICE: "Orienta sobre agenda, servicios comerciales y productos disponibles. No diagnostiques ni recomiendes tratamientos para mascotas; escala consultas clínicas o urgentes a personal veterinario habilitado.",
  SHOE_STORE: "Pregunta por talla, estilo, color y disponibilidad. Recomienda solo referencias existentes y no prometas cambios, reservas o descuentos no confirmados.",
  CLOTHING_STORE: "Pregunta por talla, prenda, color y colección. Recomienda solo referencias disponibles y no prometas cambios, reservas, descuentos ni ajustes no confirmados.",
  ONLINE_STORE: "Orienta sobre catálogo, disponibilidad, pedido web, entrega y recogida. No inventes métodos de pago, descuentos, coberturas o tiempos de despacho.",
};

export function buildSalesAgentPrompt(context: SalesAgentContext) {
  return `Eres el agente de ventas de ${context.businessName}, un negocio tipo ${context.profileId}. ${profileInstructions[context.profileId]} Usa únicamente el catálogo y stock adjuntos. Nunca inventes precio, producto, cobertura, descuentos ni disponibilidad. No confirmes ni cobres ventas: propone una orden y marca requiresConfirmation como true. Si se requiere delivery solicita dirección; si el perfil exige control de edad, marca mustVerifyAge como true. Responde JSON válido con reply, intent (CATALOG_QUERY|ORDER_PROPOSAL|DELIVERY|HANDOFF), delivery (PICKUP|DELIVERY|UNDECIDED), proposals [{productId,quantity}], needsCustomerData, requiresConfirmation, mustVerifyAge. Contexto: ${JSON.stringify(context)}`;
}

export function createSalesAgentFallback(context: SalesAgentContext, now = new Date()): SalesAgentReply {
  if (!isServiceAvailable(context.agentPolicy, now)) return { reply: context.agentPolicy.outsideHoursMessage, intent: "HANDOFF", delivery: "UNDECIDED", proposals: [], needsCustomerData: false, requiresConfirmation: true, mustVerifyAge: false };
  if (context.agentPolicy.humanHandoffEnabled && /asesor|humano|queja|reclamo|cancelar|cancelación/.test(context.customerMessage.toLocaleLowerCase())) return { reply: context.agentPolicy.humanHandoffMessage, intent: "HANDOFF", delivery: "UNDECIDED", proposals: [], needsCustomerData: true, requiresConfirmation: true, mustVerifyAge: false };
  const words = context.customerMessage.toLocaleLowerCase().split(/\W+/).filter((word) => word.length > 2);
  const product = context.products.find((item) => item.stock > 0 && words.some((word) => `${item.name} ${item.category} ${item.description}`.toLocaleLowerCase().includes(word)));
  const asksDelivery = /domicilio|entrega|delivery|enviar/.test(context.customerMessage.toLocaleLowerCase());
  const needsAgeCheck = context.features.ageCheck && asksDelivery;
  if (product) return { reply: `Tengo disponible ${product.name} por $${product.price.toLocaleString("es-CO")}. Puedo preparar una propuesta para tu confirmación${asksDelivery ? " y coordinar el domicilio" : ""}.`, intent: asksDelivery ? "DELIVERY" : "ORDER_PROPOSAL", delivery: asksDelivery ? "DELIVERY" : "UNDECIDED", proposals: [{ productId: product.id, quantity: 1 }], needsCustomerData: asksDelivery, requiresConfirmation: true, mustVerifyAge: needsAgeCheck };
  const serviceFlow = context.features.appointments ? " Indícame el servicio, fecha y horario que te interesa para preparar una solicitud." : " Indícame el producto, cantidad y si prefieres recoger o domicilio para preparar una propuesta verificable.";
  return { reply: `Con gusto te ayudo con ${context.businessName}.${serviceFlow}`, intent: "CATALOG_QUERY", delivery: "UNDECIDED", proposals: [], needsCustomerData: false, requiresConfirmation: true, mustVerifyAge: false };
}

export function validateSalesAgentReply(reply: SalesAgentReply, context: Pick<SalesAgentContext, "products" | "features" | "agentPolicy">, now = new Date()): SalesAgentReply {
  if (!isServiceAvailable(context.agentPolicy, now)) return { reply: context.agentPolicy.outsideHoursMessage, intent: "HANDOFF", delivery: "UNDECIDED", proposals: [], needsCustomerData: false, requiresConfirmation: true, mustVerifyAge: false };
  const available = new Map(context.products.filter((product) => product.stock > 0).map((product) => [product.id, product]));
  const proposals = reply.proposals.filter((proposal) => available.has(proposal.productId) && Number.isInteger(proposal.quantity) && proposal.quantity > 0).map((proposal) => ({ ...proposal, quantity: Math.min(proposal.quantity, available.get(proposal.productId)!.stock) }));
  const delivery = context.features.delivery ? reply.delivery : reply.delivery === "DELIVERY" ? "UNDECIDED" : reply.delivery;
  return { ...reply, delivery, proposals, needsCustomerData: reply.needsCustomerData || delivery === "DELIVERY", mustVerifyAge: context.features.ageCheck && delivery === "DELIVERY", requiresConfirmation: true };
}
