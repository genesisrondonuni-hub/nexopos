import { describe, expect, it } from "vitest";

import { googleSheetsInternals, startGoogleSheetsAuthorization } from "../server/google-sheets";

describe("infraestructura de Google Sheets", () => {
  it("expira solicitudes OAuth anteriores al límite de seguridad", () => {
    googleSheetsInternals.pendingAuthorizations.set("old", { redirectUri: "nexopos://google-sheets", createdAt: Date.now() - 11 * 60 * 1000 });
    googleSheetsInternals.clearExpiredAuthorizations();
    expect(googleSheetsInternals.pendingAuthorizations.has("old")).toBe(false);
  });

  it("no genera una autorización sin credenciales de servidor", () => {
    const previousId = process.env.GOOGLE_SHEETS_CLIENT_ID;
    const previousSecret = process.env.GOOGLE_SHEETS_CLIENT_SECRET;
    delete process.env.GOOGLE_SHEETS_CLIENT_ID;
    delete process.env.GOOGLE_SHEETS_CLIENT_SECRET;
    expect(() => startGoogleSheetsAuthorization("nexopos://google-sheets")).toThrow("Client ID");
    process.env.GOOGLE_SHEETS_CLIENT_ID = previousId;
    process.env.GOOGLE_SHEETS_CLIENT_SECRET = previousSecret;
  });
});
