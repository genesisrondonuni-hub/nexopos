import type { GeminiAnalysis } from "./gemini-analysis";

export type GeminiAnalysisRecord = {
  generatedAt: string;
  model: string;
  analysis: GeminiAnalysis;
};

export type GeminiIntegrationSettings = {
  enabled: boolean;
  modelPreference: string;
  analyzeInventory: boolean;
  analyzeSales: boolean;
  analyzeCrm: boolean;
  history: GeminiAnalysisRecord[];
};

export type GoogleSheetsIntegrationSettings = {
  spreadsheetId: string;
  sheetName: string;
  connectionId?: string;
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
    history: [],
  },
  googleSheets: {
    spreadsheetId: "",
    sheetName: "Hoja 1",
  },
};
