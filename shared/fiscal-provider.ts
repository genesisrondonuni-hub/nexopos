import type { FiscalProviderDraft } from "./business-types";

export function fiscalProviderReadiness(provider: FiscalProviderDraft) {
  if (!provider.name.trim() && !provider.rif.trim() && !provider.authorizationReference.trim()) return { status: "NO_CONFIGURADO" as const, label: "Sin proveedor configurado" };
  if (!provider.name.trim() || !provider.rif.trim() || !provider.authorizationReference.trim()) return { status: "PENDIENTE" as const, label: "Completa la ficha para verificar" };
  return { status: provider.verificationStatus === "VERIFICADO" ? "VERIFICADO" as const : "PENDIENTE" as const, label: provider.verificationStatus === "VERIFICADO" ? "Verificación registrada" : "Pendiente de verificación oficial" };
}
