export type BusinessProfileId = "RESTAURANT" | "FAST_FOOD" | "SUPERMARKET" | "GROCERY" | "WAREHOUSE" | "LIQUOR_STORE";

export type BusinessFeatures = {
  recipes: boolean;
  tables: boolean;
  barcode: boolean;
  wholesalePricing: boolean;
  delivery: boolean;
  catalog: boolean;
  ageCheck: boolean;
  weightedProducts: boolean;
};

export type BusinessProfileDefinition = {
  id: BusinessProfileId;
  label: string;
  shortLabel: string;
  description: string;
  icon: "restaurant" | "fastfood" | "local-grocery-store" | "shopping-basket" | "warehouse" | "liquor";
  suggestedCategories: string[];
  features: BusinessFeatures;
};

export type BusinessConfiguration = {
  profileId: BusinessProfileId;
  businessName: string;
  suggestedCategories: string[];
  categories: string[];
  features: BusinessFeatures;
};
