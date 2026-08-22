import { describe, expect, it } from "vitest";

import { BUSINESS_PROFILES } from "../lib/business-store";

describe("perfiles multi-negocio", () => {
  it("incluye los perfiles de alimentos, salud, veterinaria, calzado y ventas en línea", () => {
    expect(BUSINESS_PROFILES.map((profile) => profile.id)).toEqual([
      "RESTAURANT",
      "FAST_FOOD",
      "SUPERMARKET",
      "GROCERY",
      "WAREHOUSE",
      "LIQUOR_STORE",
      "MEDICAL_OFFICE",
      "CLINICAL_LAB",
      "DENTAL_CLINIC",
      "VETERINARY_LAB",
      "VETERINARY_OFFICE",
      "SHOE_STORE",
      "ONLINE_STORE",
    ]);
  });

  it("aplica capacidades características a cada tipo de negocio", () => {
    const restaurant = BUSINESS_PROFILES.find((profile) => profile.id === "RESTAURANT")!;
    const supermarket = BUSINESS_PROFILES.find((profile) => profile.id === "SUPERMARKET")!;
    const warehouse = BUSINESS_PROFILES.find((profile) => profile.id === "WAREHOUSE")!;
    const liquorStore = BUSINESS_PROFILES.find((profile) => profile.id === "LIQUOR_STORE")!;
    const medicalOffice = BUSINESS_PROFILES.find((profile) => profile.id === "MEDICAL_OFFICE")!;
    const veterinaryOffice = BUSINESS_PROFILES.find((profile) => profile.id === "VETERINARY_OFFICE")!;
    const shoeStore = BUSINESS_PROFILES.find((profile) => profile.id === "SHOE_STORE")!;
    const onlineStore = BUSINESS_PROFILES.find((profile) => profile.id === "ONLINE_STORE")!;
    expect(restaurant.features.recipes).toBe(true);
    expect(supermarket.features.barcode).toBe(true);
    expect(warehouse.features.wholesalePricing).toBe(true);
    expect(warehouse.features.catalog).toBe(false);
    expect(liquorStore.features.ageCheck).toBe(true);
    expect(medicalOffice.features.appointments).toBe(true);
    expect(medicalOffice.features.serviceOrders).toBe(true);
    expect(veterinaryOffice.features.variants).toBe(true);
    expect(shoeStore.features.variants).toBe(true);
    expect(onlineStore.features.onlineSales).toBe(true);
  });
});
