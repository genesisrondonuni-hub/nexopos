import { describe, expect, it } from "vitest";

import { canRemoveCategory, hasCategoryName, normalizeCategoryName } from "../shared/category-utils";

describe("categorías personalizadas", () => {
  it("normaliza nombres y rechaza valores vacíos o demasiado largos", () => {
    expect(normalizeCategoryName("  Productos   orgánicos ")).toBe("Productos orgánicos");
    expect(normalizeCategoryName("   ")).toBeNull();
    expect(normalizeCategoryName("x".repeat(41))).toBeNull();
  });

  it("evita duplicados sin distinguir mayúsculas", () => {
    expect(hasCategoryName(["Bebidas", "Panadería"], "bebidas")).toBe(true);
    expect(hasCategoryName(["Bebidas", "Panadería"], "BEBIDAS", "Bebidas")).toBe(false);
  });

  it("conserva al menos una categoría activa", () => {
    expect(canRemoveCategory(["General"], "General")).toBe(false);
    expect(canRemoveCategory(["General", "Bebidas"], "Bebidas")).toBe(true);
  });
});
