import { describe, expect, it } from "vitest";

import { BUSINESS_PROFILES } from "../lib/business-store";
import { BUSINESS_EXPERIENCES } from "../shared/business-experience";

describe("identidad visual por negocio", () => {
  it("asigna una experiencia visual completa a cada perfil operativo", () => {
    BUSINESS_PROFILES.forEach((profile) => {
      const experience = BUSINESS_EXPERIENCES[profile.id];
      expect(experience.accent).toMatch(/^#[0-9A-F]{6}$/i);
      expect(experience.headline.length).toBeGreaterThan(8);
      expect(experience.posLabel.length).toBeGreaterThan(3);
    });
  });

  it("diferencia los acentos de las familias de negocio", () => {
    expect(BUSINESS_EXPERIENCES.RESTAURANT.accent).not.toBe(BUSINESS_EXPERIENCES.SUPERMARKET.accent);
    expect(BUSINESS_EXPERIENCES.LIQUOR_STORE.accent).not.toBe(BUSINESS_EXPERIENCES.FAST_FOOD.accent);
  });
});
