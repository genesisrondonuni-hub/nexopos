import type { BusinessCopy, BusinessProfileId, BusinessStarterItem } from "./business-types";

const DEFAULT_COPY: BusinessCopy = {
  catalogGreeting: "Explora nuestro catálogo y encuentra opciones disponibles.",
  crmMessage: "Gestiona conversaciones, solicitudes y oportunidades comerciales.",
  agentWelcome: "Responde con el catálogo, disponibilidad y reglas verificadas de este negocio.",
};

const PROFILE_COPY: Partial<Record<BusinessProfileId, BusinessCopy>> = {
  MEDICAL_OFFICE: { catalogGreeting: "Consulta servicios administrativos y solicita una cita comercial.", crmMessage: "Gestiona solicitudes y agenda administrativa sin información clínica.", agentWelcome: "Orienta servicios y agenda comercial; escala consultas clínicas al personal habilitado." },
  CLINICAL_LAB: { catalogGreeting: "Consulta servicios y agenda disponibles; los resultados se gestionan fuera de este módulo.", crmMessage: "Gestiona solicitudes comerciales y agenda sin resultados ni datos clínicos.", agentWelcome: "Orienta servicios y horarios; no solicita ni interpreta información clínica." },
  DENTAL_CLINIC: { catalogGreeting: "Explora servicios, presupuestos comerciales y disponibilidad de agenda.", crmMessage: "Gestiona solicitudes y presupuestos sin ficha odontológica.", agentWelcome: "Orienta servicios y agenda; escala valoraciones odontológicas al profesional." },
  VETERINARY_LAB: { catalogGreeting: "Consulta servicios de laboratorio y logística comercial para tutores y clínicas.", crmMessage: "Gestiona solicitudes comerciales sin información clínica de mascotas.", agentWelcome: "Orienta servicios y logística; escala consultas veterinarias al personal habilitado." },
  VETERINARY_OFFICE: { catalogGreeting: "Explora servicios administrativos, productos y solicitudes para mascotas.", crmMessage: "Gestiona tutores, solicitudes y productos sin historia clínica.", agentWelcome: "Orienta agenda y productos; escala consultas clínicas veterinarias." },
  SHOE_STORE: { catalogGreeting: "Encuentra referencias, tallas y accesorios disponibles.", crmMessage: "Gestiona clientes, referencias, tallas y pedidos de calzado.", agentWelcome: "Asesora por talla, estilo y disponibilidad real antes de proponer un pedido." },
  ONLINE_STORE: { catalogGreeting: "Compra desde el catálogo digital con entrega o recogida según disponibilidad.", crmMessage: "Gestiona compradores, pedidos web y despacho desde un solo flujo.", agentWelcome: "Guía compras digitales con catálogo, disponibilidad y condiciones verificadas." },
};

const STARTER_CATALOGS: Partial<Record<BusinessProfileId, BusinessStarterItem[]>> = {
  MEDICAL_OFFICE: [{ name: "Consulta general", description: "Servicio administrativo de consulta programada.", category: "Consulta general", type: "SERVICE" }, { name: "Control programado", description: "Solicitud administrativa de control según agenda.", category: "Control", type: "SERVICE" }, { name: "Certificado administrativo", description: "Servicio administrativo sujeto a validación del consultorio.", category: "Certificados", type: "SERVICE" }],
  CLINICAL_LAB: [{ name: "Solicitud de toma de muestra", description: "Servicio administrativo de agenda para toma de muestra.", category: "Toma de muestras", type: "SERVICE" }, { name: "Perfil de laboratorio", description: "Solicitud comercial de perfil; condiciones se confirman con el laboratorio.", category: "Perfiles", type: "SERVICE" }, { name: "Paquete preventivo", description: "Servicio administrativo sujeto a disponibilidad.", category: "Servicios preventivos", type: "SERVICE" }],
  DENTAL_CLINIC: [{ name: "Valoración inicial", description: "Solicitud comercial de valoración y agenda.", category: "Valoración", type: "SERVICE" }, { name: "Higiene dental", description: "Servicio sujeto a confirmación de agenda.", category: "Higiene", type: "SERVICE" }, { name: "Control de ortodoncia", description: "Solicitud de seguimiento administrativo.", category: "Ortodoncia", type: "SERVICE" }],
  VETERINARY_LAB: [{ name: "Recepción de muestra", description: "Solicitud comercial de recepción y logística.", category: "Muestras", type: "SERVICE" }, { name: "Perfil veterinario", description: "Servicio sujeto a revisión del laboratorio.", category: "Perfiles veterinarios", type: "SERVICE" }, { name: "Servicio para clínica", description: "Solicitud comercial para cliente institucional.", category: "Servicios para clínicas", type: "SERVICE" }],
  VETERINARY_OFFICE: [{ name: "Consulta veterinaria", description: "Solicitud de cita sujeta a confirmación profesional.", category: "Consulta", type: "SERVICE" }, { name: "Vacunación programada", description: "Solicitud administrativa de agenda.", category: "Vacunación", type: "SERVICE" }, { name: "Alimento para mascota", description: "Producto de inventario para tutores.", category: "Alimentos", type: "FINAL" }],
  SHOE_STORE: [{ name: "Tenis urbano", description: "Referencia de calzado; configura tallas y disponibilidad.", category: "Dama", type: "FINAL" }, { name: "Zapato casual", description: "Referencia de calzado; configura tallas y disponibilidad.", category: "Caballero", type: "FINAL" }, { name: "Kit de cuidado", description: "Accesorio para calzado.", category: "Accesorios", type: "FINAL" }],
  ONLINE_STORE: [{ name: "Producto destacado", description: "Referencia inicial para catálogo digital.", category: "Destacados", type: "FINAL" }, { name: "Novedad de catálogo", description: "Referencia inicial para ventas digitales.", category: "Novedades", type: "FINAL" }, { name: "Accesorio online", description: "Referencia complementaria para pedidos web.", category: "Accesorios", type: "FINAL" }],
};

export function getProfileCopy(profileId: BusinessProfileId): BusinessCopy { return PROFILE_COPY[profileId] ?? DEFAULT_COPY; }
export function getProfileStarterCatalog(profileId: BusinessProfileId): BusinessStarterItem[] { return STARTER_CATALOGS[profileId] ?? []; }
