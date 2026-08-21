export type GeminiIntegrationSettings = {
  enabled: boolean;
  modelPreference: string;
  analyzeInventory: boolean;
  analyzeSales: boolean;
  analyzeCrm: boolean;
};

export type IntegrationSettings = {
  gemini: GeminiIntegrationSettings;
};

export const defaultIntegrationSettings: IntegrationSettings = {
  gemini: {
    enabled: true,
    modelPreference: "AUTO",
    analyzeInventory: true,
    analyzeSales: true,
    analyzeCrm: true,
  },
};
