export type CrmStage = {
  id: string;
  name: string;
  color: string;
};

export type DeliveryStatus = "PENDIENTE" | "EN RUTA" | "ENTREGADO";

export type SalesOpportunity = {
  id: string;
  customerName: string;
  phone: string;
  stageId: string;
  source: "CATÁLOGO" | "WHATSAPP" | "PRESENCIAL";
  value: number;
  lastActivity: string;
  deliveryStatus?: DeliveryStatus;
  address?: string;
};

export type DeliveryPreferences = {
  enabled: boolean;
  baseFee: number;
  freeShippingAbove: number;
  zones: string;
};

export type CrmAutomationSettings = {
  enabled: boolean;
  welcomeOnNewLead: boolean;
  deliveryStatusUpdate: boolean;
  followUpReminder: boolean;
};

export type CrmMessageTemplates = {
  newLead: string;
  deliveryUpdate: string;
};

export type CrmSettings = {
  stages: CrmStage[];
  delivery: DeliveryPreferences;
  automations: CrmAutomationSettings;
  templates: CrmMessageTemplates;
};
