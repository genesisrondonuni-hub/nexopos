import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Card, colors, formatCOP, MetricCard, SectionTitle, StatusPill } from "@/components/nexo-ui";
import { ScreenContainer } from "@/components/screen-container";
import { haptic } from "@/lib/haptics";
import { useCrm } from "@/lib/crm-store";
import { useBusiness } from "@/lib/business-store";
import { trpc } from "@/lib/trpc";
import { BUSINESS_EXPERIENCES } from "@/shared/business-experience";
import type { SalesOpportunity } from "@/shared/crm-types";

function deliveryLabel(status?: SalesOpportunity["deliveryStatus"]) {
  if (!status) return null;
  if (status === "EN RUTA") return { label: "En ruta", color: "#2366A4", bg: "#DFEFFF" };
  if (status === "ENTREGADO") return { label: "Entregado", color: colors.green, bg: colors.mint };
  return { label: "Por despachar", color: "#A36E0A", bg: "#FFF2D4" };
}

export default function CrmScreen() {
  const { settings, opportunities, moveOpportunity, updateDeliveryStatus } = useCrm();
  const { profile, configuration } = useBusiness();
  const experience = BUSINESS_EXPERIENCES[profile.id];
  const metaStatus = trpc.crm.metaStatus.useQuery();
  const sendTemplate = trpc.crm.sendTemplate.useMutation();
  const openPipeline = opportunities.filter((opportunity) => opportunity.stageId !== settings.stages[settings.stages.length - 1]?.id);
  const pipelineValue = openPipeline.reduce((sum, opportunity) => sum + opportunity.value, 0);
  const readyForDelivery = opportunities.filter((opportunity) => opportunity.deliveryStatus === "PENDIENTE").length;

  const advance = (opportunity: SalesOpportunity) => {
    const currentIndex = settings.stages.findIndex((stage) => stage.id === opportunity.stageId);
    const next = settings.stages[Math.min(currentIndex + 1, settings.stages.length - 1)];
    if (!next || next.id === opportunity.stageId) return;
    haptic.medium();
    moveOpportunity(opportunity.id, next.id);
  };

  const sendMetaMessage = async (opportunity: SalesOpportunity, templateName: string, parameters: string[]) => {
    if (!metaStatus.data?.sendReady) { Alert.alert("Meta WhatsApp no está activo", "Registra el token y el Phone Number ID en Integraciones para enviar plantillas reales.", [{ text: "Ir a integraciones", onPress: () => router.push("/api-integrations" as never) }, { text: "Cancelar", style: "cancel" }]); return; }
    try {
      const result = await sendTemplate.mutateAsync({ to: opportunity.phone, templateName, parameters, language: "es_CO" });
      if (result.status === "sent") { haptic.success(); Alert.alert("Mensaje enviado", `La plantilla ${templateName} se envió a ${opportunity.customerName}.`); }
    } catch {
      Alert.alert("No fue posible enviar", "Revisa que la plantilla esté aprobada por Meta y que sus variables coincidan con la configuración.");
    }
  };
  const progressDelivery = async (opportunity: SalesOpportunity) => {
    if (!opportunity.deliveryStatus) return;
    const next = opportunity.deliveryStatus === "PENDIENTE" ? "EN RUTA" : opportunity.deliveryStatus === "EN RUTA" ? "ENTREGADO" : "ENTREGADO";
    if (next === opportunity.deliveryStatus) return;
    haptic.medium();
    updateDeliveryStatus(opportunity.id, next);
    if (settings.automations.enabled && settings.automations.deliveryStatusUpdate) await sendMetaMessage(opportunity, settings.templates.deliveryUpdate, [opportunity.customerName, next]);
  };

  const renderOpportunity = ({ item }: { item: SalesOpportunity }) => {
    const stage = settings.stages.find((entry) => entry.id === item.stageId) ?? settings.stages[0];
    const delivery = deliveryLabel(item.deliveryStatus);
    const finalStage = stage.id === settings.stages[settings.stages.length - 1]?.id;
    return <Card style={styles.opportunityCard}>
      <View style={styles.opportunityTop}><View><Text style={styles.customerName}>{item.customerName}</Text><Text style={styles.customerMeta}>{item.source} · {item.lastActivity}</Text></View><View style={[styles.stage, { backgroundColor: `${stage.color}20` }]}><View style={[styles.stageDot, { backgroundColor: stage.color }]} /><Text style={[styles.stageText, { color: stage.color }]}>{stage.name}</Text></View></View>
      <View style={styles.opportunityMiddle}><View style={styles.phone}><MaterialIcons name="chat" size={15} color={colors.green} /><Text style={styles.phoneText}>{item.phone}</Text></View><Text style={styles.value}>{formatCOP(item.value)}</Text></View>
      {delivery ? <View style={styles.deliveryRow}><View style={[styles.deliveryPill, { backgroundColor: delivery.bg }]}><MaterialIcons name="two-wheeler" size={14} color={delivery.color} /><Text style={[styles.deliveryText, { color: delivery.color }]}>{delivery.label}</Text></View><Text numberOfLines={1} style={styles.address}>{item.address}</Text>{item.deliveryStatus !== "ENTREGADO" ? <Pressable onPress={() => progressDelivery(item)} style={({ pressed }) => [styles.deliveryAction, pressed && styles.pressed]}><MaterialIcons name="arrow-forward" size={15} color={colors.green} /></Pressable> : null}</View> : null}
      <View style={styles.actions}><Pressable onPress={() => void sendMetaMessage(item, settings.templates.newLead, [item.customerName])} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><MaterialIcons name="chat-bubble-outline" size={15} color={colors.green} /><Text style={styles.secondaryLabel}>{sendTemplate.isPending ? "Enviando…" : "Contactar"}</Text></Pressable><Pressable disabled={finalStage} onPress={() => advance(item)} style={({ pressed }) => [styles.advanceButton, finalStage && styles.disabledButton, pressed && !finalStage && styles.pressed]}><Text style={styles.advanceLabel}>{finalStage ? "Cerrado" : "Avanzar"}</Text><MaterialIcons name="arrow-forward" size={15} color={colors.white} /></Pressable></View>
    </Card>;
  };

  const secondaryMetric = configuration.features.delivery ? { label: "Para delivery", value: String(readyForDelivery), icon: "two-wheeler" as const, helper: settings.delivery.enabled ? "Servicio activo" : "Servicio pausado" } : configuration.features.appointments ? { label: "Por confirmar", value: String(openPipeline.length), icon: "event-available" as const, helper: "Solicitudes y agenda" } : { label: "Seguimiento", value: String(openPipeline.length), icon: "assignment" as const, helper: "Gestiones activas" };
  const agentText = configuration.copy.crmMessage || (configuration.features.appointments ? "Orienta servicios y agenda comercial; escala las consultas clínicas al personal habilitado." : configuration.features.variants ? "Responde sobre referencias, variantes y disponibilidad real antes de crear seguimiento." : "Responde, propone pedidos y crea seguimiento con el catálogo disponible.");
  return <ScreenContainer containerClassName="bg-[#F6F3EE]" className="px-5"><FlatList data={opportunities} renderItem={renderOpportunity} keyExtractor={(item) => item.id} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content} ListHeaderComponent={<><View style={styles.header}><View><Text style={styles.eyebrow}>{profile.shortLabel.toUpperCase()} · RELACIONES</Text><Text style={styles.title}>{experience.crmLabel}</Text></View><View style={styles.headerActions}><Pressable onPress={() => router.push("/sales-agent" as never)} style={({ pressed }) => [styles.agentButton, pressed && styles.pressed]}><MaterialIcons name="smart-toy" size={20} color={colors.white} /></Pressable><Pressable onPress={() => router.push("/crm-settings" as never)} style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}><MaterialIcons name="tune" size={20} color={colors.green} /></Pressable></View></View><View style={styles.metrics}><MetricCard label="Seguimiento abierto" value={formatCOP(pipelineValue, true)} icon="trending-up" helper={`${openPipeline.length} ${experience.customerLabel.toLocaleLowerCase()}`} /><MetricCard label={secondaryMetric.label} value={secondaryMetric.value} icon={secondaryMetric.icon} tone="gold" helper={secondaryMetric.helper} /></View><Pressable onPress={() => router.push("/sales-agent" as never)} style={({ pressed }) => [styles.agentBanner, pressed && styles.pressed]}><View style={styles.agentBannerIcon}><MaterialIcons name="smart-toy" size={19} color={colors.green} /></View><View style={styles.agentBannerCopy}><Text style={styles.agentBannerTitle}>{experience.agentLabel}</Text><Text style={styles.agentBannerText}>{agentText}</Text></View><MaterialIcons name="chevron-right" size={20} color={colors.green} /></Pressable><SectionTitle title="Pipeline" action="Configurar" onAction={() => router.push("/crm-settings" as never)} /><View style={styles.stageSummary}>{settings.stages[0] ? <View style={[styles.stageSummaryChip, { borderColor: settings.stages[0].color }]}><Text style={[styles.stageSummaryText, { color: settings.stages[0].color }]}>{settings.stages[0].name}</Text><Text style={styles.stageSummaryCount}>{opportunities.filter((entry) => entry.stageId === settings.stages[0].id).length}</Text></View> : null}{settings.stages[1] ? <View style={[styles.stageSummaryChip, { borderColor: settings.stages[1].color }]}><Text style={[styles.stageSummaryText, { color: settings.stages[1].color }]}>{settings.stages[1].name}</Text><Text style={styles.stageSummaryCount}>{opportunities.filter((entry) => entry.stageId === settings.stages[1].id).length}</Text></View> : null}{settings.stages[2] ? <View style={[styles.stageSummaryChip, { borderColor: settings.stages[2].color }]}><Text style={[styles.stageSummaryText, { color: settings.stages[2].color }]}>{settings.stages[2].name}</Text><Text style={styles.stageSummaryCount}>{opportunities.filter((entry) => entry.stageId === settings.stages[2].id).length}</Text></View> : null}</View><SectionTitle title={experience.customerLabel} /></>} /></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { gap: 11, paddingBottom: 112, paddingTop: 14 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  eyebrow: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 0.7 },
  title: { color: colors.ink, fontSize: 28, fontWeight: "800", letterSpacing: -0.7, marginTop: 3 },
  settingsButton: { alignItems: "center", backgroundColor: colors.mint, borderRadius: 14, height: 44, justifyContent: "center", width: 44 },
  headerActions: { flexDirection: "row", gap: 8 },
  agentButton: { alignItems: "center", backgroundColor: colors.green, borderRadius: 14, height: 44, justifyContent: "center", width: 44 },
  agentBanner: { alignItems: "center", backgroundColor: colors.white, borderColor: "#B5E0CF", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 9, padding: 11 },
  agentBannerIcon: { alignItems: "center", backgroundColor: colors.mint, borderRadius: 11, height: 37, justifyContent: "center", width: 37 },
  agentBannerCopy: { flex: 1 },
  agentBannerTitle: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  agentBannerText: { color: colors.muted, fontSize: 10, marginTop: 3 },
  metrics: { flexDirection: "row", gap: 12, justifyContent: "space-between" },
  stageSummary: { flexDirection: "row", gap: 8, marginBottom: 6 },
  stageSummaryChip: { alignItems: "center", backgroundColor: colors.white, borderRadius: 11, borderWidth: 1, flex: 1, gap: 3, minHeight: 54, justifyContent: "center", paddingHorizontal: 6 },
  stageSummaryText: { fontSize: 10, fontWeight: "800", textAlign: "center" },
  stageSummaryCount: { color: colors.ink, fontSize: 15, fontWeight: "800" },
  opportunityCard: { gap: 11, padding: 14 },
  opportunityTop: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  customerName: { color: colors.ink, fontSize: 15, fontWeight: "800" },
  customerMeta: { color: colors.muted, fontSize: 10, fontWeight: "700", marginTop: 3 },
  stage: { alignItems: "center", borderRadius: 999, flexDirection: "row", gap: 5, paddingHorizontal: 8, paddingVertical: 5 },
  stageDot: { borderRadius: 4, height: 7, width: 7 },
  stageText: { fontSize: 10, fontWeight: "800" },
  opportunityMiddle: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  phone: { alignItems: "center", flexDirection: "row", gap: 5 },
  phoneText: { color: colors.muted, fontSize: 11, fontWeight: "600" },
  value: { color: colors.green, fontSize: 17, fontWeight: "800" },
  deliveryRow: { alignItems: "center", backgroundColor: "#F8F8F6", borderRadius: 11, flexDirection: "row", gap: 7, minHeight: 38, paddingHorizontal: 9 },
  deliveryPill: { alignItems: "center", borderRadius: 9, flexDirection: "row", gap: 4, paddingHorizontal: 7, paddingVertical: 5 },
  deliveryText: { fontSize: 10, fontWeight: "800" },
  address: { color: colors.muted, flex: 1, fontSize: 10 },
  deliveryAction: { alignItems: "center", height: 28, justifyContent: "center", width: 25 },
  actions: { flexDirection: "row", gap: 8 },
  secondaryButton: { alignItems: "center", backgroundColor: colors.mint, borderRadius: 10, flex: 1, flexDirection: "row", gap: 6, justifyContent: "center", minHeight: 37 },
  secondaryLabel: { color: colors.green, fontSize: 11, fontWeight: "800" },
  advanceButton: { alignItems: "center", backgroundColor: colors.green, borderRadius: 10, flex: 1, flexDirection: "row", gap: 6, justifyContent: "center", minHeight: 37 },
  advanceLabel: { color: colors.white, fontSize: 11, fontWeight: "800" },
  disabledButton: { backgroundColor: "#AAB6B2" },
  pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
});
