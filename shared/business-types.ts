export type BusinessProfileId = "RESTAURANT" | "FAST_FOOD" | "SUPERMARKET" | "GROCERY" | "WAREHOUSE" | "LIQUOR_STORE" | "MEDICAL_OFFICE" | "CLINICAL_LAB" | "DENTAL_CLINIC" | "VETERINARY_LAB" | "VETERINARY_OFFICE" | "SHOE_STORE" | "CLOTHING_STORE" | "ONLINE_STORE";

export type BusinessFeatures = {
  recipes: boolean;
  tables: boolean;
  barcode: boolean;
  wholesalePricing: boolean;
  delivery: boolean;
  catalog: boolean;
  ageCheck: boolean;
  weightedProducts: boolean;
  appointments: boolean;
  serviceOrders: boolean;
  variants: boolean;
  onlineSales: boolean;
};

export type BusinessCopy = {
  catalogGreeting: string;
  crmMessage: string;
  agentWelcome: string;
};

export type BusinessStarterItem = {
  name: string;
  description: string;
  category: string;
  type: "FINAL" | "RECIPE" | "SERVICE";
  price?: number;
  cost?: number;
  stock?: number;
  collection?: string;
  colors?: string[];
  sizes?: string[];
};

export type BusinessProfileDefinition = {
  id: BusinessProfileId;
  label: string;
  shortLabel: string;
  description: string;
  icon: "restaurant" | "fastfood" | "local-grocery-store" | "shopping-basket" | "warehouse" | "liquor" | "local-hospital" | "science" | "medical-services" | "pets" | "checkroom" | "language";
  suggestedCategories: string[];
  features: BusinessFeatures;
};

export type BusinessConfiguration = {
  profileId: BusinessProfileId;
  businessName: string;
  suggestedCategories: string[];
  categories: string[];
  features: BusinessFeatures;
  copy: BusinessCopy;
};
