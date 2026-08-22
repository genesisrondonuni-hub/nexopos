import { describe, expect, it } from "vitest";

import { buildSalesAgentPrompt, createSalesAgentFallback, validateSalesAgentReply } from "../shared/sales-agent";

const features = { recipes: true, tables: true, barcode: false, wholesalePricing: false, delivery: true, catalog: true, ageCheck: false, weightedProducts: false };
const context = { businessName: "Nexo Café", profileId: "RESTAURANT" as const, features, products: [{ id: "p-1", name: "Hamburguesa Nexo", category: "Platos", description: "Hamburguesa de la casa", price: 26900, stock: 4, code: "SKU-HAMB-001" }], customerMessage: "Quiero una hamburguesa a domicilio" };

describe("agente de ventas", () => {
  it("incorpora las reglas del perfil y el catálogo real al prompt", () => {
    expect(buildSalesAgentPrompt(context)).toContain("RESTAURANT");
    expect(buildSalesAgentPrompt(context)).toContain("SKU-HAMB-001");
  });

  it("crea una propuesta local confirmable cuando Gemini aún no está activo", () => {
    const response = createSalesAgentFallback(context);
    expect(response.proposals[0]).toEqual({ productId: "p-1", quantity: 1 });
    expect(response.requiresConfirmation).toBe(true);
  });

  it("descarta propuestas de productos no disponibles o inexistentes", () => {
    const reply = validateSalesAgentReply({ reply: "Propuesta", intent: "ORDER_PROPOSAL", delivery: "PICKUP", proposals: [{ productId: "missing", quantity: 1 }, { productId: "p-1", quantity: 9 }], needsCustomerData: false, requiresConfirmation: true, mustVerifyAge: false }, context);
    expect(reply.proposals).toEqual([{ productId: "p-1", quantity: 4 }]);
  });

  it("no permite que el agente active delivery cuando el perfil no lo ofrece", () => {
    const reply = validateSalesAgentReply({ reply: "Propuesta", intent: "DELIVERY", delivery: "DELIVERY", proposals: [], needsCustomerData: false, requiresConfirmation: true, mustVerifyAge: false }, { ...context, features: { ...features, delivery: false } });
    expect(reply.delivery).toBe("UNDECIDED");
    expect(reply.requiresConfirmation).toBe(true);
  });
});
