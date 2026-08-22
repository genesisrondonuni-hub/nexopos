import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import type { BusinessConfiguration, BusinessCopy, BusinessFeatures, BusinessProfileDefinition, BusinessProfileId } from "@/shared/business-types";
import { getProfileCopy } from "../shared/business-profile-content";
import { canRemoveCategory, hasCategoryName, normalizeCategoryName } from "../shared/category-utils";
import { DEFAULT_VENEZUELAN_FISCAL_SETTINGS, normalizeIvaRate, normalizeVenezuelanRif } from "../shared/venezuela-fiscal";
import { setMoneyPreferences } from "../shared/currency-format";
import { normalizeUsdVesRate } from "../shared/venezuela-fiscal";

const STORAGE_KEY = "@nexopos:business-profile:v1";

export const BUSINESS_PROFILES: BusinessProfileDefinition[] = [
  { id: "RESTAURANT", label: "Restaurante", shortLabel: "Restaurante", description: "Mesas, recetas, menú y atención de salón.", icon: "restaurant", suggestedCategories: ["Entradas", "Platos fuertes", "Bebidas", "Postres"], features: { recipes: true, tables: true, barcode: false, wholesalePricing: false, delivery: true, catalog: true, ageCheck: false, weightedProducts: false, appointments: false, serviceOrders: false, variants: false, onlineSales: false } },
  { id: "FAST_FOOD", label: "Comida rápida", shortLabel: "Comida rápida", description: "Pedidos ágiles, combos, mostrador y domicilio.", icon: "fastfood", suggestedCategories: ["Combos", "Hamburguesas", "Acompañamientos", "Bebidas"], features: { recipes: true, tables: false, barcode: false, wholesalePricing: false, delivery: true, catalog: true, ageCheck: false, weightedProducts: false, appointments: false, serviceOrders: false, variants: false, onlineSales: false } },
  { id: "SUPERMARKET", label: "Supermercado", shortLabel: "Supermercado", description: "Productos empacados, código de barras y stock mínimo.", icon: "local-grocery-store", suggestedCategories: ["Despensa", "Bebidas", "Limpieza", "Hogar"], features: { recipes: false, tables: false, barcode: true, wholesalePricing: false, delivery: true, catalog: true, ageCheck: false, weightedProducts: true, appointments: false, serviceOrders: false, variants: false, onlineSales: false } },
  { id: "GROCERY", label: "Abasto", shortLabel: "Abasto", description: "Venta por unidad, peso y volumen para consumo diario.", icon: "shopping-basket", suggestedCategories: ["Granos", "Frutas y verduras", "Lácteos", "Aseo"], features: { recipes: false, tables: false, barcode: true, wholesalePricing: true, delivery: true, catalog: true, ageCheck: false, weightedProducts: true, appointments: false, serviceOrders: false, variants: false, onlineSales: false } },
  { id: "WAREHOUSE", label: "Bodega", shortLabel: "Bodega", description: "Surtido, distribución y precios para clientes comerciales.", icon: "warehouse", suggestedCategories: ["Surtido", "Mayorista", "Bebidas", "Hogar"], features: { recipes: false, tables: false, barcode: true, wholesalePricing: true, delivery: false, catalog: false, ageCheck: false, weightedProducts: false, appointments: false, serviceOrders: false, variants: false, onlineSales: false } },
  { id: "LIQUOR_STORE", label: "Licorería", shortLabel: "Licorería", description: "Venta de bebidas, horarios y delivery controlado.", icon: "liquor", suggestedCategories: ["Cervezas", "Vinos", "Destilados", "Mezcladores"], features: { recipes: false, tables: false, barcode: true, wholesalePricing: true, delivery: true, catalog: true, ageCheck: true, weightedProducts: false, appointments: false, serviceOrders: false, variants: false, onlineSales: false } },
  { id: "MEDICAL_OFFICE", label: "Consultorio médico", shortLabel: "Consultorio", description: "Agenda comercial, servicios y seguimiento administrativo sin historia clínica.", icon: "local-hospital", suggestedCategories: ["Consulta general", "Control", "Certificados", "Servicios administrativos"], features: { recipes: false, tables: false, barcode: false, wholesalePricing: false, delivery: false, catalog: true, ageCheck: false, weightedProducts: false, appointments: true, serviceOrders: true, variants: false, onlineSales: false } },
  { id: "CLINICAL_LAB", label: "Laboratorio clínico", shortLabel: "Lab. clínico", description: "Solicitudes comerciales de servicios y agenda, sin resultados ni datos clínicos.", icon: "science", suggestedCategories: ["Toma de muestras", "Perfiles", "Servicios preventivos", "Paquetes administrativos"], features: { recipes: false, tables: false, barcode: true, wholesalePricing: true, delivery: false, catalog: true, ageCheck: false, weightedProducts: false, appointments: true, serviceOrders: true, variants: false, onlineSales: true } },
  { id: "DENTAL_CLINIC", label: "Clínica odontológica", shortLabel: "Odontología", description: "Agenda, presupuestos y servicios comerciales sin registro odontológico clínico.", icon: "medical-services", suggestedCategories: ["Valoración", "Higiene", "Ortodoncia", "Servicios administrativos"], features: { recipes: false, tables: false, barcode: false, wholesalePricing: false, delivery: false, catalog: true, ageCheck: false, weightedProducts: false, appointments: true, serviceOrders: true, variants: false, onlineSales: false } },
  { id: "VETERINARY_LAB", label: "Laboratorio veterinario", shortLabel: "Lab. vet.", description: "Servicios de laboratorio y solicitudes comerciales para tutores y clínicas.", icon: "science", suggestedCategories: ["Muestras", "Perfiles veterinarios", "Servicios para clínicas", "Insumos"], features: { recipes: false, tables: false, barcode: true, wholesalePricing: true, delivery: true, catalog: true, ageCheck: false, weightedProducts: false, appointments: true, serviceOrders: true, variants: false, onlineSales: true } },
  { id: "VETERINARY_OFFICE", label: "Consultorio veterinario", shortLabel: "Veterinaria", description: "Agenda, productos para mascotas y seguimiento de solicitudes no clínicas.", icon: "pets", suggestedCategories: ["Consulta", "Vacunación", "Alimentos", "Accesorios"], features: { recipes: false, tables: false, barcode: true, wholesalePricing: false, delivery: true, catalog: true, ageCheck: false, weightedProducts: true, appointments: true, serviceOrders: true, variants: true, onlineSales: true } },
  { id: "SHOE_STORE", label: "Zapatería", shortLabel: "Zapatería", description: "Catálogo por talla, referencias, inventario y venta por pedido.", icon: "checkroom", suggestedCategories: ["Dama", "Caballero", "Infantil", "Accesorios"], features: { recipes: false, tables: false, barcode: true, wholesalePricing: false, delivery: true, catalog: true, ageCheck: false, weightedProducts: false, appointments: false, serviceOrders: false, variants: true, onlineSales: true } },
  { id: "CLOTHING_STORE", label: "Tienda de ropa", shortLabel: "Ropa", description: "Prendas, tallas, colecciones, inventario y pedidos por catálogo.", icon: "checkroom", suggestedCategories: ["Camisetas", "Pantalones", "Vestidos", "Accesorios"], features: { recipes: false, tables: false, barcode: true, wholesalePricing: false, delivery: true, catalog: true, ageCheck: false, weightedProducts: false, appointments: false, serviceOrders: false, variants: true, onlineSales: true } },
  { id: "ONLINE_STORE", label: "Ventas en línea", shortLabel: "Tienda online", description: "Catálogo digital, pedidos web, despacho y conversaciones comerciales.", icon: "language", suggestedCategories: ["Destacados", "Novedades", "Ofertas", "Accesorios"], features: { recipes: false, tables: false, barcode: true, wholesalePricing: false, delivery: true, catalog: true, ageCheck: false, weightedProducts: false, appointments: false, serviceOrders: false, variants: true, onlineSales: true } },
];

const defaultProfile = BUSINESS_PROFILES[0];
const defaultConfiguration: BusinessConfiguration = {
  profileId: defaultProfile.id,
  businessName: "Nexo Café",
  suggestedCategories: defaultProfile.suggestedCategories,
  categories: defaultProfile.suggestedCategories,
  features: defaultProfile.features,
  copy: getProfileCopy(defaultProfile.id),
  fiscal: DEFAULT_VENEZUELAN_FISCAL_SETTINGS,
};

type BusinessContextValue = {
  configuration: BusinessConfiguration;
  profile: BusinessProfileDefinition;
  hydrated: boolean;
  selectProfile: (profileId: BusinessProfileId) => void;
  updateBusinessName: (businessName: string) => void;
  updateFeatures: (changes: Partial<BusinessFeatures>) => void;
  updateCopy: (changes: Partial<BusinessCopy>) => void;
  updateFiscal: (changes: Partial<BusinessConfiguration["fiscal"]>) => void;
  addCategory: (name: string) => boolean;
  renameCategory: (currentName: string, nextName: string) => boolean;
  removeCategory: (name: string) => boolean;
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
        const savedProfile = BUSINESS_PROFILES.find((profile) => profile.id === parsed.profileId);
        if (savedProfile && parsed.businessName) {
          const categories = Array.isArray(parsed.categories) && parsed.categories.length ? parsed.categories : parsed.suggestedCategories;
          const normalizedCategories = categories.map(normalizeCategoryName).filter((category): category is string => Boolean(category));
          setConfiguration({ ...parsed, suggestedCategories: savedProfile.suggestedCategories, categories: [...new Set(normalizedCategories)], features: { ...savedProfile.features, ...parsed.features }, copy: { ...getProfileCopy(savedProfile.id), ...parsed.copy }, fiscal: { ...DEFAULT_VENEZUELAN_FISCAL_SETTINGS, ...parsed.fiscal, countryCode: "VE", currencyCode: "VES", displayCurrency: parsed.fiscal?.displayCurrency === "USD" ? "USD" : "VES", usdVesRate: normalizeUsdVesRate(parsed.fiscal?.usdVesRate ?? 0), usdVesRateUpdatedAt: typeof parsed.fiscal?.usdVesRateUpdatedAt === "string" ? parsed.fiscal.usdVesRateUpdatedAt : null, rif: normalizeVenezuelanRif(parsed.fiscal?.rif ?? ""), ivaRate: normalizeIvaRate(parsed.fiscal?.ivaRate ?? DEFAULT_VENEZUELAN_FISCAL_SETTINGS.ivaRate) } });
        }
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

  useEffect(() => { setMoneyPreferences(configuration.fiscal); }, [configuration.fiscal]);

  const selectProfile = useCallback((profileId: BusinessProfileId) => {
    const profile = BUSINESS_PROFILES.find((entry) => entry.id === profileId);
    if (!profile) return;
    setConfiguration((current) => ({ ...current, profileId, suggestedCategories: profile.suggestedCategories, categories: profile.suggestedCategories, features: profile.features, copy: getProfileCopy(profile.id) }));
  }, []);

  const updateBusinessName = useCallback((businessName: string) => {
    const normalized = businessName.trim();
    if (normalized) setConfiguration((current) => ({ ...current, businessName: normalized }));
  }, []);

  const updateFeatures = useCallback((changes: Partial<BusinessFeatures>) => {
    setConfiguration((current) => ({ ...current, features: { ...current.features, ...changes } }));
  }, []);

  const updateCopy = useCallback((changes: Partial<BusinessCopy>) => {
    setConfiguration((current) => ({ ...current, copy: { ...current.copy, ...changes } }));
  }, []);

  const updateFiscal = useCallback((changes: Partial<BusinessConfiguration["fiscal"]>) => {
    setConfiguration((current) => ({ ...current, fiscal: { ...current.fiscal, ...changes, countryCode: "VE", currencyCode: "VES", displayCurrency: changes.displayCurrency === "USD" ? "USD" : changes.displayCurrency === "VES" ? "VES" : current.fiscal.displayCurrency, usdVesRate: changes.usdVesRate === undefined ? current.fiscal.usdVesRate : normalizeUsdVesRate(changes.usdVesRate), usdVesRateUpdatedAt: changes.usdVesRate === undefined ? current.fiscal.usdVesRateUpdatedAt : new Date().toISOString(), rif: changes.rif === undefined ? current.fiscal.rif : normalizeVenezuelanRif(changes.rif), ivaRate: changes.ivaRate === undefined ? current.fiscal.ivaRate : normalizeIvaRate(changes.ivaRate) } }));
  }, []);

  const addCategory = useCallback((name: string) => {
    const normalized = normalizeCategoryName(name);
    if (!normalized) return false;
    let added = false;
    setConfiguration((current) => {
      if (hasCategoryName(current.categories, normalized)) return current;
      added = true;
      return { ...current, categories: [...current.categories, normalized] };
    });
    return added;
  }, []);

  const renameCategory = useCallback((currentName: string, nextName: string) => {
    const normalized = normalizeCategoryName(nextName);
    if (!normalized) return false;
    let renamed = false;
    setConfiguration((current) => {
      if (hasCategoryName(current.categories, normalized, currentName)) return current;
      renamed = true;
      return { ...current, categories: current.categories.map((category) => category === currentName ? normalized : category) };
    });
    return renamed;
  }, []);

  const removeCategory = useCallback((name: string) => {
    let removed = false;
    setConfiguration((current) => {
      if (!canRemoveCategory(current.categories, name)) return current;
      removed = true;
      return { ...current, categories: current.categories.filter((category) => category !== name) };
    });
    return removed;
  }, []);

  const profile = useMemo(() => BUSINESS_PROFILES.find((entry) => entry.id === configuration.profileId) ?? defaultProfile, [configuration.profileId]);
  const value = useMemo(() => ({ configuration, profile, hydrated, selectProfile, updateBusinessName, updateFeatures, updateCopy, updateFiscal, addCategory, renameCategory, removeCategory }), [configuration, profile, hydrated, selectProfile, updateBusinessName, updateFeatures, updateCopy, updateFiscal, addCategory, renameCategory, removeCategory]);
  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (!context) throw new Error("useBusiness debe usarse dentro de BusinessProvider");
  return context;
}
