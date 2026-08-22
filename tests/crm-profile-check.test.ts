import { describe, expect, it } from "vitest";
import { buildCrmProfileChecks } from "../shared/crm-profile-check";
import { DEFAULT_VENEZUELAN_FISCAL_SETTINGS } from "../shared/venezuela-fiscal";

const medical = { profileId: "MEDICAL_OFFICE" as const, businessName: "Consultorio", suggestedCategories: ["Consulta"], categories: ["Consulta", "Control"], features: { recipes: false, tables: false, barcode: false, wholesalePricing: false, delivery: false, catalog: true, ageCheck: false, weightedProducts: false, appointments: true, serviceOrders: true, variants: false, onlineSales: false }, copy: { catalogGreeting: "Hola", crmMessage: "Agenda", agentWelcome: "Orienta" }, fiscal: DEFAULT_VENEZUELAN_FISCAL_SETTINGS };

describe("validación guiada CRM por perfil", () => {
  it("incluye agenda y límite administrativo para perfiles de salud", () => {
    const ids = buildCrmProfileChecks(medical).map((check) => check.id);
    expect(ids).toContain("agenda");
    expect(ids).toContain("scope");
    expect(ids).toContain("templates");
    expect(ids).toContain("branches");
  });

  it("incluye variantes y ventas en línea cuando el perfil las habilita", () => {
    const ids = buildCrmProfileChecks({ ...medical, profileId: "SHOE_STORE", features: { ...medical.features, appointments: false, serviceOrders: false, variants: true, onlineSales: true, delivery: true } }).map((check) => check.id);
    expect(ids).toContain("variants");
    expect(ids).toContain("online");
    expect(ids).toContain("delivery");
  });
});
