import { describe, expect, it } from "vitest";

describe("credenciales de Gemini", () => {
  const liveTest = process.env.RUN_GEMINI_LIVE_TEST === "true";
  it.skipIf(!liveTest)("autoriza una consulta ligera de modelos", async () => {
    const apiKey = process.env.GEMINI_API_KEY;
    expect(apiKey).toBeTruthy();
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
      headers: { "x-goog-api-key": apiKey! },
    });
    expect(response.ok).toBe(true);
  }, 15_000);
});
