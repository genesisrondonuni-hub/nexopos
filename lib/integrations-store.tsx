import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { defaultIntegrationSettings, type GeminiIntegrationSettings, type IntegrationSettings } from "@/shared/integration-types";

const STORAGE_KEY = "@nexopos:integrations:v1";

type IntegrationsContextValue = {
  settings: IntegrationSettings;
  hydrated: boolean;
  updateGemini: (changes: Partial<GeminiIntegrationSettings>) => void;
};

const IntegrationsContext = createContext<IntegrationsContextValue | undefined>(undefined);

export function IntegrationsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<IntegrationSettings>(defaultIntegrationSettings);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const restore = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as Partial<IntegrationSettings>;
          setSettings({ gemini: { ...defaultIntegrationSettings.gemini, ...parsed.gemini } });
        }
      } catch {
        // The safe default configuration remains usable if local storage is unavailable.
      } finally {
        setHydrated(true);
      }
    };
    void restore();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [hydrated, settings]);

  const updateGemini = useCallback((changes: Partial<GeminiIntegrationSettings>) => {
    setSettings((current) => ({ ...current, gemini: { ...current.gemini, ...changes } }));
  }, []);

  const value = useMemo(() => ({ settings, hydrated, updateGemini }), [settings, hydrated, updateGemini]);
  return <IntegrationsContext.Provider value={value}>{children}</IntegrationsContext.Provider>;
}

export function useIntegrations() {
  const context = useContext(IntegrationsContext);
  if (!context) throw new Error("useIntegrations debe usarse dentro de IntegrationsProvider");
  return context;
}
