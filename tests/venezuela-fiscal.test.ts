import { describe, expect, it } from "vitest";

import { fiscalModeLabel, isValidVenezuelanRif, normalizeIvaRate, normalizeVenezuelanRif } from "../shared/venezuela-fiscal";

describe("configuración fiscal venezolana", () => {
  it("normaliza y valida formatos RIF habituales", () => {
    expect(normalizeVenezuelanRif("j123456789")).toBe("J-12345678-9");
    expect(isValidVenezuelanRif("V-12345678-9")).toBe(true);
    expect(isValidVenezuelanRif("NIT-900123")).toBe(false);
  });

  it("conserva una tasa de IVA acotada y etiqueta el estado documental", () => {
    expect(normalizeIvaRate(16)).toBe(16);
    expect(normalizeIvaRate(80)).toBe(31);
    expect(fiscalModeLabel("OPERATIVO")).toBe("Comprobante operativo");
  });
});
