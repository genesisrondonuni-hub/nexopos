import type { BusinessConfiguration, BusinessProfileId } from "./business-types";

export type CrmProfileCheck = { id: string; title: string; detail: string; complete: boolean };

const HEALTH_PROFILES: BusinessProfileId[] = ["MEDICAL_OFFICE", "CLINICAL_LAB", "DENTAL_CLINIC", "VETERINARY_LAB", "VETERINARY_OFFICE"];

export function buildCrmProfileChecks(configuration: BusinessConfiguration): CrmProfileCheck[] {
  const checks: CrmProfileCheck[] = [
    { id: "copy", title: "Mensajes comerciales", detail: "Personaliza el saludo de catálogo, CRM y agente antes de atender clientes.", complete: Boolean(configuration.copy.catalogGreeting.trim() && configuration.copy.crmMessage.trim() && configuration.copy.agentWelcome.trim()) },
    { id: "categories", title: "Categorías de operación", detail: "Revisa que las categorías reflejen los servicios o productos reales del negocio.", complete: configuration.categories.length >= 2 },
    { id: "catalog", title: "Catálogo público", detail: "Verifica qué elementos se muestran y sus precios antes de compartir el catálogo.", complete: configuration.features.catalog },
  ];
  if (configuration.features.appointments) checks.push({ id: "agenda", title: "Agenda comercial", detail: "Confirma horario, servicios y escalamiento a personal habilitado.", complete: configuration.features.serviceOrders });
  if (configuration.features.variants) checks.push({ id: "variants", title: "Variantes y referencias", detail: "Registra tallas, colores o referencias y valida existencias antes de vender.", complete: true });
  if (configuration.features.onlineSales) checks.push({ id: "online", title: "Ventas en línea", detail: "Revisa catálogo, datos de entrega y condiciones comerciales antes de publicar.", complete: configuration.features.catalog });
  if (configuration.features.delivery) checks.push({ id: "delivery", title: "Entrega o recogida", detail: "Confirma cobertura, tiempos y política de cancelación antes de ofrecer delivery.", complete: true });
  if (HEALTH_PROFILES.includes(configuration.profileId)) checks.push({ id: "scope", title: "Límite administrativo", detail: "El CRM gestiona agenda y solicitudes comerciales; no guarda historia clínica, resultados ni diagnósticos.", complete: true });
  return checks;
}
