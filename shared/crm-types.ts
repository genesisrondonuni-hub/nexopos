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
  outsideHours: string;
  handoff: string;
};

export type AgentServicePolicy = {
  enabled: boolean;
  timezone: string;
  opensAt: string;
  closesAt: string;
  servesSaturday: boolean;
  servesSunday: boolean;
  outsideHoursMessage: string;
  humanHandoffEnabled: boolean;
  humanHandoffMessage: string;
  allowPendingCancellation: boolean;
  cancellationWindowMinutes: number;
};

export type CrmSettings = {
  stages: CrmStage[];
  delivery: DeliveryPreferences;
  automations: CrmAutomationSettings;
  templates: CrmMessageTemplates;
  agentPolicy: AgentServicePolicy;
};
