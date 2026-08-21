import { describe, expect, it } from "vitest";

import { BUSINESS_PROFILES } from "../lib/business-store";

describe("perfiles multi-negocio", () => {
  it("incluye los seis perfiles operativos solicitados", () => {
    expect(BUSINESS_PROFILES.map((profile) => profile.id)).toEqual([
      "RESTAURANT",
      "FAST_FOOD",
      "SUPERMARKET",
      "GROCERY",
      "WAREHOUSE",
      "LIQUOR_STORE",
    ]);
  });

  it("aplica capacidades características a cada tipo de negocio", () => {
    const restaurant = BUSINESS_PROFILES.find((profile) => profile.id === "RESTAURANT")!;
    const supermarket = BUSINESS_PROFILES.find((profile) => profile.id === "SUPERMARKET")!;
    const warehouse = BUSINESS_PROFILES.find((profile) => profile.id === "WAREHOUSE")!;
    const liquorStore = BUSINESS_PROFILES.find((profile) => profile.id === "LIQUOR_STORE")!;
    expect(restaurant.features.recipes).toBe(true);
    expect(supermarket.features.barcode).toBe(true);
    expect(warehouse.features.wholesalePricing).toBe(true);
    expect(warehouse.features.catalog).toBe(false);
    expect(liquorStore.features.ageCheck).toBe(true);
  });
});
