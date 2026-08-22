export type GeminiIntegrationSettings = {
  enabled: boolean;
  modelPreference: string;
  analyzeInventory: boolean;
  analyzeSales: boolean;
  analyzeCrm: boolean;
};

export type GoogleSheetsIntegrationSettings = {
  spreadsheetId: string;
  sheetName: string;
};

export type IntegrationSettings = {
  gemini: GeminiIntegrationSettings;
  googleSheets: GoogleSheetsIntegrationSettings;
};

export const defaultIntegrationSettings: IntegrationSettings = {
  gemini: {
    enabled: true,
    modelPreference: "AUTO",
    analyzeInventory: true,
    analyzeSales: true,
    analyzeCrm: true,
  },
  googleSheets: {
    spreadsheetId: "",
    sheetName: "Hoja 1",
  },
};
