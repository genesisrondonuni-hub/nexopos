import { describe, expect, it } from "vitest";

import { buildSalesAgentPrompt, createSalesAgentFallback, validateSalesAgentReply } from "../shared/sales-agent";
import { DEFAULT_VENEZUELAN_FISCAL_SETTINGS } from "../shared/venezuela-fiscal";

const features = { recipes: true, tables: true, barcode: false, wholesalePricing: false, delivery: true, catalog: true, ageCheck: false, weightedProducts: false, appointments: false, serviceOrders: false, variants: false, onlineSales: false };
const agentPolicy = { enabled: true, timezone: "America/Bogota", opensAt: "08:00", closesAt: "20:00", servesSaturday: true, servesSunday: false, outsideHoursMessage: "Estamos fuera de horario.", humanHandoffEnabled: true, humanHandoffMessage: "Te conectaremos con un asesor.", allowPendingCancellation: true, cancellationWindowMinutes: 10 };
const context = { businessName: "Nexo Café", profileId: "RESTAURANT" as const, features, fiscal: DEFAULT_VENEZUELAN_FISCAL_SETTINGS, agentPolicy, products: [{ id: "p-1", name: "Hamburguesa Nexo", category: "Platos", description: "Hamburguesa de la casa", price: 26900, stock: 4, code: "SKU-HAMB-001" }], customerMessage: "Quiero una hamburguesa a domicilio" };

describe("agente de ventas", () => {
  it("incorpora las reglas del perfil y el catálogo real al prompt", () => {
    expect(buildSalesAgentPrompt(context)).toContain("RESTAURANT");
    expect(buildSalesAgentPrompt(context)).toContain("SKU-HAMB-001");
  });

  it("crea una propuesta local confirmable cuando Gemini aún no está activo", () => {
    const response = createSalesAgentFallback(context, new Date("2026-08-21T14:00:00.000Z"));
    expect(response.proposals[0]).toEqual({ productId: "p-1", quantity: 1 });
    expect(response.requiresConfirmation).toBe(true);
    expect(response.reply).toContain("Bs.");
  });

  it("descarta propuestas de productos no disponibles o inexistentes", () => {
    const reply = validateSalesAgentReply({ reply: "Propuesta", intent: "ORDER_PROPOSAL", delivery: "PICKUP", proposals: [{ productId: "missing", quantity: 1 }, { productId: "p-1", quantity: 9 }], needsCustomerData: false, requiresConfirmation: true, mustVerifyAge: false }, context, new Date("2026-08-21T14:00:00.000Z"));
    expect(reply.proposals).toEqual([{ productId: "p-1", quantity: 4 }]);
  });

  it("no permite que el agente active delivery cuando el perfil no lo ofrece", () => {
    const reply = validateSalesAgentReply({ reply: "Propuesta", intent: "DELIVERY", delivery: "DELIVERY", proposals: [], needsCustomerData: false, requiresConfirmation: true, mustVerifyAge: false }, { ...context, features: { ...features, delivery: false } }, new Date("2026-08-21T14:00:00.000Z"));
    expect(reply.delivery).toBe("UNDECIDED");
    expect(reply.requiresConfirmation).toBe(true);
  });

  it("aplica el mensaje fuera de horario antes de proponer una venta", () => {
    const response = createSalesAgentFallback(context, new Date("2026-08-24T02:00:00.000Z"));
    expect(response.intent).toBe("HANDOFF");
    expect(response.reply).toBe("Estamos fuera de horario.");
  });

  it("incluye límites no clínicos para los perfiles de salud", () => {
    const healthContext = { businessName: context.businessName, profileId: "MEDICAL_OFFICE" as const, features: { ...features, appointments: true, serviceOrders: true }, fiscal: context.fiscal, agentPolicy, products: context.products, customerMessage: "Quiero una cita" };
    const prompt = buildSalesAgentPrompt(healthContext);
    expect(prompt).toContain("No solicites ni evalúes síntomas");
    expect(prompt).toContain("servicios comerciales");
  });
});
