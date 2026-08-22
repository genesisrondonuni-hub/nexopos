import { randomUUID } from "crypto";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SHEETS_READONLY_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";
const MAX_STATE_AGE_MS = 10 * 60 * 1000;

type PendingAuthorization = { redirectUri: string; createdAt: number };
type GoogleConnection = { accessToken: string; refreshToken?: string; expiresAt: number };

const pendingAuthorizations = new Map<string, PendingAuthorization>();
const connections = new Map<string, GoogleConnection>();

function getConfig() {
  return {
    clientId: process.env.GOOGLE_SHEETS_CLIENT_ID?.trim() ?? "",
    clientSecret: process.env.GOOGLE_SHEETS_CLIENT_SECRET?.trim() ?? "",
  };
}

function ensureConfigured() {
  const config = getConfig();
  if (!config.clientId || !config.clientSecret) {
    throw new Error("Configura el Client ID y Client Secret de Google en la configuración segura antes de conectar una hoja privada.");
  }
  return config;
}

function clearExpiredAuthorizations(now = Date.now()) {
  pendingAuthorizations.forEach((value, key) => {
    if (now - value.createdAt > MAX_STATE_AGE_MS) pendingAuthorizations.delete(key);
  });
}

export function getGoogleSheetsStatus() {
  const { clientId, clientSecret } = getConfig();
  if (!clientId || !clientSecret) {
    return { state: "SIN_CONFIGURAR" as const, detail: "Agrega las credenciales OAuth de Google en la configuración segura para leer hojas privadas." };
  }
  return { state: "LISTO_PARA_AUTORIZAR" as const, detail: "Las credenciales están registradas. Autoriza una cuenta de Google desde la aplicación." };
}

export function startGoogleSheetsAuthorization(redirectUri: string) {
  const { clientId } = ensureConfigured();
  clearExpiredAuthorizations();
  const state = randomUUID();
  pendingAuthorizations.set(state, { redirectUri, createdAt: Date.now() });
  const url = new URL(AUTH_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", SHEETS_READONLY_SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("state", state);
  return { authorizationUrl: url.toString(), state };
}

export async function completeGoogleSheetsAuthorization(input: { code: string; state: string; redirectUri: string }) {
  const { clientId, clientSecret } = ensureConfigured();
  clearExpiredAuthorizations();
  const pending = pendingAuthorizations.get(input.state);
  if (!pending || pending.redirectUri !== input.redirectUri) {
    throw new Error("La solicitud de autorización expiró o no coincide con esta aplicación. Inténtalo de nuevo.");
  }
  pendingAuthorizations.delete(input.state);
  const body = new URLSearchParams({
    code: input.code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: input.redirectUri,
    grant_type: "authorization_code",
  });
  const response = await fetch(TOKEN_URL, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  if (!response.ok) throw new Error("Google no pudo completar la autorización. Revisa el URI de redirección y las credenciales OAuth.");
  const payload = await response.json() as { access_token?: string; refresh_token?: string; expires_in?: number };
  if (!payload.access_token) throw new Error("Google no devolvió un token de acceso para la hoja privada.");
  const connectionId = randomUUID();
  connections.set(connectionId, { accessToken: payload.access_token, refreshToken: payload.refresh_token, expiresAt: Date.now() + Math.max(60, payload.expires_in ?? 3600) * 1000 });
  return { connectionId, expiresAt: new Date(connections.get(connectionId)!.expiresAt).toISOString() };
}

export async function readGoogleSheetValues(input: { connectionId: string; spreadsheetId: string; sheetName: string }) {
  const connection = connections.get(input.connectionId);
  if (!connection) throw new Error("La sesión de Google no está disponible. Autoriza la cuenta otra vez.");
  if (connection.expiresAt <= Date.now()) throw new Error("La sesión de Google expiró. Autoriza la cuenta otra vez.");
  const range = `${input.sheetName}!A:Z`;
  const endpoint = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(input.spreadsheetId)}/values/${encodeURIComponent(range)}`;
  const response = await fetch(endpoint, { headers: { Authorization: `Bearer ${connection.accessToken}` } });
  if (!response.ok) throw new Error("No fue posible leer la hoja. Verifica que la cuenta autorizada tenga acceso y que el ID y pestaña sean correctos.");
  const payload = await response.json() as { values?: unknown[][] };
  return { values: payload.values ?? [] };
}

export const googleSheetsInternals = { pendingAuthorizations, connections, clearExpiredAuthorizations };
