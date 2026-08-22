import { describe, expect, it } from "vitest";

import { fiscalModeLabel, isValidVenezuelanRif, normalizeIvaRate, normalizeVenezuelanRif, recordManualUsdVesRate } from "../shared/venezuela-fiscal";

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

  it("registra una tasa USD/VES manual con fuente y conserva la más reciente", () => {
    const first = recordManualUsdVesRate([], 36.5, "Decisión administrativa", "2026-08-22T10:00:00.000Z");
    const next = recordManualUsdVesRate(first, 37, "Cierre diario", "2026-08-22T18:00:00.000Z");
    expect(next[0]).toMatchObject({ rate: 37, sourceNote: "Cierre diario" });
    expect(next).toHaveLength(2);
  });
});
