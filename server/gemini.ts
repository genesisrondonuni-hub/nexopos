import { z } from "zod";

import type { GeminiAnalysis, GeminiBusinessSnapshot } from "../shared/gemini-analysis";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

const analysisSchema = z.object({
  summary: z.string().min(1).max(1200),
  priorities: z.array(z.object({
    area: z.enum(["INVENTARIO", "VENTAS", "CRM"]),
    severity: z.enum(["ALTA", "MEDIA", "BAJA"]),
    title: z.string().min(1).max(120),
    detail: z.string().min(1).max(400),
    action: z.string().min(1).max(300),
  })).max(6),
});

type GeminiModel = { name: string; supportedGenerationMethods?: string[] };

function apiKey() {
  return process.env.GEMINI_API_KEY?.trim() ?? "";
}

async function request(path: string, init?: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    return await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { "x-goog-api-key": apiKey(), "Content-Type": "application/json", ...(init?.headers ?? {}) },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveModel(preferredModel = "AUTO") {
  const response = await request("/models?pageSize=100");
  if (!response.ok) throw new Error("La clave de Gemini no fue autorizada.");
  const data = await response.json() as { models?: GeminiModel[] };
  const candidates = (data.models ?? []).filter((model) => model.supportedGenerationMethods?.includes("generateContent"));
  const requested = preferredModel.trim().replace(/^models\//, "");
  const preferred = requested !== "AUTO" ? candidates.find((model) => model.name.replace(/^models\//, "") === requested) : candidates.find((model) => model.name.includes("flash")) ?? candidates[0];
  if (requested !== "AUTO" && !preferred) throw new Error("El modelo elegido no está disponible para esta clave de Gemini.");
  if (!preferred) throw new Error("La cuenta de Gemini no tiene un modelo disponible para análisis.");
  return preferred.name.replace(/^models\//, "");
}

export async function getGeminiStatus(preferredModel = "AUTO") {
  if (!apiKey()) return { state: "SIN_CONFIGURAR" as const, detail: "Agrega una clave de Gemini en la configuración segura del proyecto." };
  try {
    const model = await resolveModel(preferredModel);
    return { state: "CONECTADO" as const, model, detail: "La conexión segura está lista para analizar la operación." };
  } catch {
    return { state: "REQUIERE_ATENCIÓN" as const, detail: "La clave actual no pudo validarse. Actualízala de forma segura." };
  }
}

export function buildGeminiPrompt(snapshot: GeminiBusinessSnapshot) {
  return `Eres un analista operativo para una pequeña empresa. Analiza solamente estos datos internos y no inventes cifras. Devuelve JSON válido con {summary, priorities}. priorities es un máximo de 6 objetos con area (INVENTARIO, VENTAS o CRM), severity (ALTA, MEDIA o BAJA), title, detail y action. Da acciones concretas, prudentes y priorizadas. Datos: ${JSON.stringify(snapshot)}`;
}

export function parseGeminiAnalysis(value: unknown): GeminiAnalysis {
  return analysisSchema.parse(value);
}

export async function analyzeBusiness(snapshot: GeminiBusinessSnapshot, preferredModel = "AUTO") {
  if (!apiKey()) throw new Error("Configura una clave de Gemini antes de solicitar un análisis.");
  const model = await resolveModel(preferredModel);
  const response = await request(`/models/${model}:generateContent`, {
    method: "POST",
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: buildGeminiPrompt(snapshot) }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.2, maxOutputTokens: 1800 },
    }),
  });
  if (!response.ok) throw new Error("Gemini no pudo completar el análisis. Verifica la clave o inténtalo de nuevo.");
  const payload = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");
  if (!text) throw new Error("Gemini no devolvió recomendaciones utilizables.");
  return parseGeminiAnalysis(JSON.parse(text));
}
