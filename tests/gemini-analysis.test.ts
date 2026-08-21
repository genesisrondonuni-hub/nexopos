import { describe, expect, it } from "vitest";

import { buildGeminiPrompt, parseGeminiAnalysis } from "../server/gemini";

describe("análisis de Gemini", () => {
  it("construye un prompt basado únicamente en datos operativos", () => {
    const prompt = buildGeminiPrompt({ summary: { sales: 100000, expenses: 25000, profit: 75000, orders: 5 }, products: [{ name: "Arroz", category: "Despensa", stock: 2, minStock: 5, price: 5000, cost: 3000 }], opportunities: [] });
    expect(prompt).toContain("Arroz");
    expect(prompt).toContain("100000");
  });

  it("acepta prioridades estructuradas y rechaza áreas inválidas", () => {
    expect(parseGeminiAnalysis({ summary: "Hay inventario bajo.", priorities: [{ area: "INVENTARIO", severity: "ALTA", title: "Reponer arroz", detail: "Quedan dos unidades.", action: "Crear orden de compra." }] }).priorities).toHaveLength(1);
    expect(() => parseGeminiAnalysis({ summary: "x", priorities: [{ area: "OTRO", severity: "ALTA", title: "x", detail: "x", action: "x" }] })).toThrow();
  });
});
