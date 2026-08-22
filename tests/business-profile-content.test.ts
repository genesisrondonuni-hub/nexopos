import { describe, expect, it } from "vitest";
import { getProfileCopy, getProfileStarterCatalog } from "../shared/business-profile-content";

describe("contenido inicial por perfil", () => {
  it("provee un catálogo de servicios administrativo y seguro para consultorio médico", () => {
    const catalog = getProfileStarterCatalog("MEDICAL_OFFICE");
    expect(catalog).toHaveLength(3);
    expect(catalog.every((item) => item.type === "SERVICE")).toBe(true);
    expect(catalog.join(" ")).not.toContain("diagnóstico");
  });

  it("provee referencias iniciales y una copia comercial para zapatería", () => {
    const catalog = getProfileStarterCatalog("SHOE_STORE");
    expect(catalog.some((item) => item.name === "Tenis urbano")).toBe(true);
    expect(getProfileCopy("SHOE_STORE").agentWelcome).toContain("talla");
  });
});
