import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import type { CrmAutomationSettings, CrmMessageTemplates, CrmSettings, DeliveryPreferences, DeliveryStatus, SalesOpportunity } from "@/shared/crm-types";

const STORAGE_KEY = "@nexopos:crm:v1";

const defaultSettings: CrmSettings = {
  stages: [
    { id: "lead", name: "Nuevo lead", color: "#D99A22" },
    { id: "contacted", name: "Contactado", color: "#2366A4" },
    { id: "confirmed", name: "Confirmado", color: "#197B63" },
    { id: "won", name: "Venta cerrada", color: "#744BB7" },
  ],
  delivery: { enabled: true, baseFee: 4500, freeShippingAbove: 60000, zones: "Chapinero, Usaquén, Teusaquillo" },
  automations: { enabled: true, welcomeOnNewLead: true, deliveryStatusUpdate: true, followUpReminder: true },
  templates: { newLead: "crm_bienvenida", deliveryUpdate: "crm_estado_delivery" },
};

const starterOpportunities: SalesOpportunity[] = [
  { id: "crm-001", customerName: "Laura Gómez", phone: "300 555 0183", stageId: "lead", source: "CATÁLOGO", value: 34400, lastActivity: "Hace 4 min", deliveryStatus: "PENDIENTE", address: "Calle 72 # 12-34" },
  { id: "crm-002", customerName: "Mateo Rojas", phone: "301 202 1147", stageId: "contacted", source: "WHATSAPP", value: 53800, lastActivity: "Hace 16 min", deliveryStatus: "EN RUTA", address: "Cra. 15 # 85-22" },
  { id: "crm-003", customerName: "Sofía Martínez", phone: "315 881 6712", stageId: "confirmed", source: "CATÁLOGO", value: 21500, lastActivity: "Hace 28 min", deliveryStatus: "PENDIENTE", address: "Recogida en tienda" },
  { id: "crm-004", customerName: "Carlos Vera", phone: "316 410 2981", stageId: "won", source: "PRESENCIAL", value: 42700, lastActivity: "Hoy, 10:12 a. m." },
];

type CrmContextValue = {
  settings: CrmSettings;
  opportunities: SalesOpportunity[];
  hydrated: boolean;
  moveOpportunity: (opportunityId: string, stageId: string) => void;
  updateDeliveryStatus: (opportunityId: string, status: DeliveryStatus) => void;
  updateStageName: (stageId: string, name: string) => void;
  addStage: () => void;
  removeStage: (stageId: string) => boolean;
  updateDelivery: (changes: Partial<DeliveryPreferences>) => void;
  updateAutomations: (changes: Partial<CrmAutomationSettings>) => void;
  updateTemplates: (changes: Partial<CrmMessageTemplates>) => void;
  createAgentOpportunity: (input: { customerName: string; phone: string; value: number; delivery: boolean; address?: string }) => void;
};

const CrmContext = createContext<CrmContextValue | undefined>(undefined);

export function CrmProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CrmSettings>(defaultSettings);
  const [opportunities, setOpportunities] = useState<SalesOpportunity[]>(starterOpportunities);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const restore = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (!saved) return;
        const parsed = JSON.parse(saved) as { settings?: CrmSettings; opportunities?: SalesOpportunity[] };
        if (parsed.settings?.stages?.length) setSettings(parsed.settings);
        if (parsed.opportunities) setOpportunities(parsed.opportunities);
      } catch {
        // Starter CRM data is intentionally retained when local storage is unavailable.
      } finally {
        setHydrated(true);
      }
    };
    void restore();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ settings, opportunities }));
  }, [hydrated, settings, opportunities]);

  const moveOpportunity = useCallback((opportunityId: string, stageId: string) => {
    setOpportunities((current) => current.map((opportunity) => opportunity.id === opportunityId ? { ...opportunity, stageId, lastActivity: "Ahora" } : opportunity));
  }, []);

  const updateDeliveryStatus = useCallback((opportunityId: string, deliveryStatus: DeliveryStatus) => {
    setOpportunities((current) => current.map((opportunity) => opportunity.id === opportunityId ? { ...opportunity, deliveryStatus, lastActivity: "Ahora" } : opportunity));
  }, []);

  const updateStageName = useCallback((stageId: string, name: string) => {
    const normalized = name.trim();
    if (!normalized) return;
    setSettings((current) => ({ ...current, stages: current.stages.map((stage) => stage.id === stageId ? { ...stage, name: normalized } : stage) }));
  }, []);

  const addStage = useCallback(() => {
    const palette = ["#B25D2A", "#4B76B8", "#2F8A75", "#934B87"];
    setSettings((current) => ({ ...current, stages: [...current.stages, { id: `stage-${Date.now()}`, name: "Nueva etapa", color: palette[current.stages.length % palette.length] }] }));
  }, []);

  const removeStage = useCallback((stageId: string) => {
    if (settings.stages.length <= 2) return false;
    const replacement = settings.stages.find((stage) => stage.id !== stageId);
    if (!replacement) return false;
    setOpportunities((current) => current.map((opportunity) => opportunity.stageId === stageId ? { ...opportunity, stageId: replacement.id, lastActivity: "Reasignado" } : opportunity));
    setSettings((current) => ({ ...current, stages: current.stages.filter((stage) => stage.id !== stageId) }));
    return true;
  }, [settings.stages]);

  const updateDelivery = useCallback((changes: Partial<DeliveryPreferences>) => {
    setSettings((current) => ({ ...current, delivery: { ...current.delivery, ...changes } }));
  }, []);

  const updateAutomations = useCallback((changes: Partial<CrmAutomationSettings>) => {
    setSettings((current) => ({ ...current, automations: { ...current.automations, ...changes } }));
  }, []);

  const updateTemplates = useCallback((changes: Partial<CrmMessageTemplates>) => {
    setSettings((current) => ({ ...current, templates: { ...current.templates, ...changes } }));
  }, []);

  const createAgentOpportunity = useCallback((input: { customerName: string; phone: string; value: number; delivery: boolean; address?: string }) => {
    setOpportunities((current) => [{ id: `crm-agent-${Date.now()}`, customerName: input.customerName.trim(), phone: input.phone.trim(), stageId: settings.stages.find((stage) => stage.id === "confirmed")?.id ?? settings.stages[0].id, source: "WHATSAPP", value: input.value, lastActivity: "Ahora · Agente", deliveryStatus: input.delivery ? "PENDIENTE" : undefined, address: input.address?.trim() }, ...current]);
  }, [settings.stages]);

  const value = useMemo(() => ({ settings, opportunities, hydrated, moveOpportunity, updateDeliveryStatus, updateStageName, addStage, removeStage, updateDelivery, updateAutomations, updateTemplates, createAgentOpportunity }), [settings, opportunities, hydrated, moveOpportunity, updateDeliveryStatus, updateStageName, addStage, removeStage, updateDelivery, updateAutomations, updateTemplates, createAgentOpportunity]);

  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
}

export function useCrm() {
  const context = useContext(CrmContext);
  if (!context) throw new Error("useCrm debe usarse dentro de CrmProvider");
  return context;
}
