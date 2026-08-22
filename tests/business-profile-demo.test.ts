import { describe, expect, it } from "vitest";

import { BUSINESS_PROFILES } from "../lib/business-store";
import { getProfileDemoData, getProfileDemoOpportunities } from "../shared/business-profile-demo";

describe("business profile demo data", () => {
  it("proporciona productos y pedidos coherentes para cada perfil", () => {
    BUSINESS_PROFILES.forEach((profile) => {
      const demo = getProfileDemoData(profile.id, 1_800_000_000_000);
      expect(demo.products.length).toBeGreaterThanOrEqual(3);
      expect(demo.orders.length).toBe(2);
      expect(demo.orders.every((order) => order.items.every((item) => item.productId?.startsWith(`demo-${profile.id.toLowerCase()}`)))).toBe(true);
    });
  });

  it("incluye solicitudes de cita no clínicas para laboratorio clínico", () => {
    const lab = getProfileDemoData("CLINICAL_LAB");
    const opportunities = getProfileDemoOpportunities("CLINICAL_LAB");
    expect(lab.products.map((product) => product.name)).toContain("Hemograma completo");
    expect(lab.products.every((product) => product.type === "SERVICE")).toBe(true);
    expect(opportunities[0]?.subject).toContain("toma de muestra");
    expect(opportunities[0]?.appointmentAt).toBeTruthy();
  });

  it("incluye referencias de zapatería con tallas y colores", () => {
    const shoeStore = getProfileDemoData("SHOE_STORE");
    expect(shoeStore.products[0]).toMatchObject({ name: "Tenis urbano", sizes: ["35", "36", "37", "38", "39"], colors: ["Blanco", "Negro"] });
    expect(getProfileDemoOpportunities("SHOE_STORE")[0]?.subject).toContain("talla 38");
  });
});
