import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import type { BusinessConfiguration, BusinessFeatures, BusinessProfileDefinition, BusinessProfileId } from "@/shared/business-types";

const STORAGE_KEY = "@nexopos:business-profile:v1";

export const BUSINESS_PROFILES: BusinessProfileDefinition[] = [
  { id: "RESTAURANT", label: "Restaurante", shortLabel: "Restaurante", description: "Mesas, recetas, menú y atención de salón.", icon: "restaurant", suggestedCategories: ["Entradas", "Platos fuertes", "Bebidas", "Postres"], features: { recipes: true, tables: true, barcode: false, wholesalePricing: false, delivery: true, catalog: true, ageCheck: false, weightedProducts: false } },
  { id: "FAST_FOOD", label: "Comida rápida", shortLabel: "Comida rápida", description: "Pedidos ágiles, combos, mostrador y domicilio.", icon: "fastfood", suggestedCategories: ["Combos", "Hamburguesas", "Acompañamientos", "Bebidas"], features: { recipes: true, tables: false, barcode: false, wholesalePricing: false, delivery: true, catalog: true, ageCheck: false, weightedProducts: false } },
  { id: "SUPERMARKET", label: "Supermercado", shortLabel: "Supermercado", description: "Productos empacados, código de barras y stock mínimo.", icon: "local-grocery-store", suggestedCategories: ["Despensa", "Bebidas", "Limpieza", "Hogar"], features: { recipes: false, tables: false, barcode: true, wholesalePricing: false, delivery: true, catalog: true, ageCheck: false, weightedProducts: true } },
  { id: "GROCERY", label: "Abasto", shortLabel: "Abasto", description: "Venta por unidad, peso y volumen para consumo diario.", icon: "shopping-basket", suggestedCategories: ["Granos", "Frutas y verduras", "Lácteos", "Aseo"], features: { recipes: false, tables: false, barcode: true, wholesalePricing: true, delivery: true, catalog: true, ageCheck: false, weightedProducts: true } },
  { id: "WAREHOUSE", label: "Bodega", shortLabel: "Bodega", description: "Surtido, distribución y precios para clientes comerciales.", icon: "warehouse", suggestedCategories: ["Surtido", "Mayorista", "Bebidas", "Hogar"], features: { recipes: false, tables: false, barcode: true, wholesalePricing: true, delivery: false, catalog: false, ageCheck: false, weightedProducts: false } },
  { id: "LIQUOR_STORE", label: "Licorería", shortLabel: "Licorería", description: "Venta de bebidas, horarios y delivery controlado.", icon: "liquor", suggestedCategories: ["Cervezas", "Vinos", "Destilados", "Mezcladores"], features: { recipes: false, tables: false, barcode: true, wholesalePricing: true, delivery: true, catalog: true, ageCheck: true, weightedProducts: false } },
];

const defaultProfile = BUSINESS_PROFILES[0];
const defaultConfiguration: BusinessConfiguration = {
  profileId: defaultProfile.id,
  businessName: "Nexo Café",
  suggestedCategories: defaultProfile.suggestedCategories,
  features: defaultProfile.features,
};

type BusinessContextValue = {
  configuration: BusinessConfiguration;
  profile: BusinessProfileDefinition;
  hydrated: boolean;
  selectProfile: (profileId: BusinessProfileId) => void;
  updateBusinessName: (businessName: string) => void;
  updateFeatures: (changes: Partial<BusinessFeatures>) => void;
};

const BusinessContext = createContext<BusinessContextValue | undefined>(undefined);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [configuration, setConfiguration] = useState<BusinessConfiguration>(defaultConfiguration);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const restore = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (!saved) return;
        const parsed = JSON.parse(saved) as BusinessConfiguration;
        if (BUSINESS_PROFILES.some((profile) => profile.id === parsed.profileId) && parsed.businessName) setConfiguration(parsed);
      } catch {
        // The default restaurant profile remains available when local preferences cannot be restored.
      } finally {
        setHydrated(true);
      }
    };
    void restore();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(configuration));
  }, [configuration, hydrated]);

  const selectProfile = useCallback((profileId: BusinessProfileId) => {
    const profile = BUSINESS_PROFILES.find((entry) => entry.id === profileId);
    if (!profile) return;
    setConfiguration((current) => ({ ...current, profileId, suggestedCategories: profile.suggestedCategories, features: profile.features }));
  }, []);

  const updateBusinessName = useCallback((businessName: string) => {
    const normalized = businessName.trim();
    if (normalized) setConfiguration((current) => ({ ...current, businessName: normalized }));
  }, []);

  const updateFeatures = useCallback((changes: Partial<BusinessFeatures>) => {
    setConfiguration((current) => ({ ...current, features: { ...current.features, ...changes } }));
  }, []);

  const profile = useMemo(() => BUSINESS_PROFILES.find((entry) => entry.id === configuration.profileId) ?? defaultProfile, [configuration.profileId]);
  const value = useMemo(() => ({ configuration, profile, hydrated, selectProfile, updateBusinessName, updateFeatures }), [configuration, profile, hydrated, selectProfile, updateBusinessName, updateFeatures]);
  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (!context) throw new Error("useBusiness debe usarse dentro de BusinessProvider");
  return context;
}
