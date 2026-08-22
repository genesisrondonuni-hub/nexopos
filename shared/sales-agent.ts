import type { BusinessFeatures, BusinessProfileId } from "./business-types";

export type SalesAgentIntent = "CATALOG_QUERY" | "ORDER_PROPOSAL" | "DELIVERY" | "HANDOFF";
export type SalesAgentDelivery = "PICKUP" | "DELIVERY" | "UNDECIDED";

export type SalesAgentProduct = { id: string; name: string; category: string; description: string; price: number; stock: number; code: string };
export type SalesAgentContext = { businessName: string; profileId: BusinessProfileId; features: BusinessFeatures; products: SalesAgentProduct[]; customerMessage: string };
export type SalesAgentProposal = { productId: string; quantity: number };
export type SalesAgentReply = { reply: string; intent: SalesAgentIntent; delivery: SalesAgentDelivery; proposals: SalesAgentProposal[]; needsCustomerData: boolean; requiresConfirmation: true; mustVerifyAge: boolean };

const profileInstructions: Record<BusinessProfileId, string> = {
  RESTAURANT: "Habla de platos, preparación, mesas y recogida. Recomienda solo productos disponibles.",
  FAST_FOOD: "Prioriza pedidos rápidos, combos, tiempos de despacho y delivery.",
  SUPERMARKET: "Ayuda a localizar productos empacados, unidades, códigos y existencias reales.",
  GROCERY: "Aclara unidad o peso, disponibilidad y sustituciones prudentes para productos de abasto.",
  WAREHOUSE: "Orienta sobre surtido, cantidades y precios; no inventes condiciones mayoristas.",
  LIQUOR_STORE: "Ofrece bebidas disponibles y exige confirmación de mayoría de edad antes de un pedido con entrega.",
};

export function buildSalesAgentPrompt(context: SalesAgentContext) {
  return `Eres el agente de ventas de ${context.businessName}, un negocio tipo ${context.profileId}. ${profileInstructions[context.profileId]} Usa únicamente el catálogo y stock adjuntos. Nunca inventes precio, producto, cobertura, descuentos ni disponibilidad. No confirmes ni cobres ventas: propone una orden y marca requiresConfirmation como true. Si se requiere delivery solicita dirección; si el perfil exige control de edad, marca mustVerifyAge como true. Responde JSON válido con reply, intent (CATALOG_QUERY|ORDER_PROPOSAL|DELIVERY|HANDOFF), delivery (PICKUP|DELIVERY|UNDECIDED), proposals [{productId,quantity}], needsCustomerData, requiresConfirmation, mustVerifyAge. Contexto: ${JSON.stringify(context)}`;
}

export function createSalesAgentFallback(context: SalesAgentContext): SalesAgentReply {
  const words = context.customerMessage.toLocaleLowerCase().split(/\W+/).filter((word) => word.length > 2);
  const product = context.products.find((item) => item.stock > 0 && words.some((word) => `${item.name} ${item.category} ${item.description}`.toLocaleLowerCase().includes(word)));
  const asksDelivery = /domicilio|entrega|delivery|enviar/.test(context.customerMessage.toLocaleLowerCase());
  const needsAgeCheck = context.features.ageCheck && asksDelivery;
  if (product) return { reply: `Tengo disponible ${product.name} por $${product.price.toLocaleString("es-CO")}. Puedo preparar una propuesta para tu confirmación${asksDelivery ? " y coordinar el domicilio" : ""}.`, intent: asksDelivery ? "DELIVERY" : "ORDER_PROPOSAL", delivery: asksDelivery ? "DELIVERY" : "UNDECIDED", proposals: [{ productId: product.id, quantity: 1 }], needsCustomerData: asksDelivery, requiresConfirmation: true, mustVerifyAge: needsAgeCheck };
  return { reply: `Con gusto te ayudo con ${context.businessName}. Indícame el producto, cantidad y si prefieres recoger o domicilio para preparar una propuesta verificable.`, intent: "CATALOG_QUERY", delivery: "UNDECIDED", proposals: [], needsCustomerData: false, requiresConfirmation: true, mustVerifyAge: false };
}

export function validateSalesAgentReply(reply: SalesAgentReply, context: Pick<SalesAgentContext, "products" | "features">): SalesAgentReply {
  const available = new Map(context.products.filter((product) => product.stock > 0).map((product) => [product.id, product]));
  const proposals = reply.proposals.filter((proposal) => available.has(proposal.productId) && Number.isInteger(proposal.quantity) && proposal.quantity > 0).map((proposal) => ({ ...proposal, quantity: Math.min(proposal.quantity, available.get(proposal.productId)!.stock) }));
  const delivery = context.features.delivery ? reply.delivery : reply.delivery === "DELIVERY" ? "UNDECIDED" : reply.delivery;
  return { ...reply, delivery, proposals, needsCustomerData: reply.needsCustomerData || delivery === "DELIVERY", mustVerifyAge: context.features.ageCheck && delivery === "DELIVERY", requiresConfirmation: true };
}
