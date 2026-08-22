import { z } from "zod";

import { buildSalesAgentPrompt, createSalesAgentFallback, validateSalesAgentReply, type SalesAgentContext, type SalesAgentReply } from "../shared/sales-agent";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const replySchema = z.object({ reply: z.string().min(1).max(1200), intent: z.enum(["CATALOG_QUERY", "ORDER_PROPOSAL", "DELIVERY", "HANDOFF"]), delivery: z.enum(["PICKUP", "DELIVERY", "UNDECIDED"]), proposals: z.array(z.object({ productId: z.string().min(1), quantity: z.number().int().positive().max(1000) })).max(12), needsCustomerData: z.boolean(), requiresConfirmation: z.literal(true), mustVerifyAge: z.boolean() });

function apiKey() { return process.env.GEMINI_API_KEY?.trim() ?? ""; }

async function resolveModel() {
  const response = await fetch(`${API_BASE}/models?pageSize=100`, { headers: { "x-goog-api-key": apiKey() } });
  if (!response.ok) throw new Error("No fue posible validar Gemini.");
  const data = await response.json() as { models?: Array<{ name: string; supportedGenerationMethods?: string[] }> };
  const model = (data.models ?? []).find((item) => item.name.includes("flash") && item.supportedGenerationMethods?.includes("generateContent")) ?? (data.models ?? []).find((item) => item.supportedGenerationMethods?.includes("generateContent"));
  if (!model) throw new Error("No hay modelos Gemini disponibles para este agente.");
  return model.name.replace(/^models\//, "");
}

export async function respondWithSalesAgent(context: SalesAgentContext): Promise<{ mode: "GEMINI" | "PREVIEW"; reply: SalesAgentReply }> {
  if (!apiKey()) return { mode: "PREVIEW", reply: createSalesAgentFallback(context) };
  const model = await resolveModel();
  const response = await fetch(`${API_BASE}/models/${model}:generateContent`, { method: "POST", headers: { "x-goog-api-key": apiKey(), "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: buildSalesAgentPrompt(context) }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.2, maxOutputTokens: 1300 } }) });
  if (!response.ok) throw new Error("Gemini no pudo responder al cliente.");
  const body = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");
  if (!text) throw new Error("Gemini no devolvió una respuesta utilizable.");
  return { mode: "GEMINI", reply: validateSalesAgentReply(replySchema.parse(JSON.parse(text)), context) };
}
