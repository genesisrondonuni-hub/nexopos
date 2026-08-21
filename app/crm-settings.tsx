import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { Card, colors, PrimaryButton, SectionTitle } from "@/components/nexo-ui";
import { ScreenContainer } from "@/components/screen-container";
import { haptic } from "@/lib/haptics";
import { useCrm } from "@/lib/crm-store";
import type { CrmStage } from "@/shared/crm-types";

function ToggleRow({ icon, title, description, value, onChange }: { icon: keyof typeof MaterialIcons.glyphMap; title: string; description: string; value: boolean; onChange: (value: boolean) => void }) {
  return <View style={styles.toggleRow}><View style={styles.toggleIcon}><MaterialIcons name={icon} size={18} color={colors.green} /></View><View style={styles.toggleCopy}><Text style={styles.toggleTitle}>{title}</Text><Text style={styles.toggleDescription}>{description}</Text></View><Switch value={value} onValueChange={onChange} trackColor={{ false: "#D6DEDA", true: "#8FCEBA" }} thumbColor={value ? colors.green : "#FFFFFF"} /></View>;
}

export default function CrmSettingsScreen() {
  const { settings, updateStageName, addStage, removeStage, updateDelivery, updateAutomations, updateTemplates } = useCrm();
  const [zoneText, setZoneText] = useState(settings.delivery.zones);
  const [baseFeeText, setBaseFeeText] = useState(String(settings.delivery.baseFee));
  const [freeText, setFreeText] = useState(String(settings.delivery.freeShippingAbove));
  const renderStage = ({ item }: { item: CrmStage }) => <Card style={styles.stageCard}><View style={[styles.stageColor, { backgroundColor: item.color }]} /><TextInput defaultValue={item.name} onEndEditing={(event) => updateStageName(item.id, event.nativeEvent.text)} placeholder="Nombre de etapa" placeholderTextColor={colors.muted} returnKeyType="done" style={styles.stageInput} /><Pressable onPress={() => { if (!removeStage(item.id)) Alert.alert("Conserva dos etapas", "El CRM necesita al menos dos etapas activas."); else haptic.medium(); }} style={({ pressed }) => [styles.remove, pressed && styles.pressed]}><MaterialIcons name="delete-outline" size={19} color={colors.coral} /></Pressable></Card>;
  const saveNumeric = (value: string, field: "baseFee" | "freeShippingAbove") => { const numeric = Number(value.replace(/\D/g, "")); if (Number.isFinite(numeric)) updateDelivery({ [field]: numeric }); };
  return <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#F6F3EE]" className="px-5"><FlatList data={settings.stages} renderItem={renderStage} keyExtractor={(item) => item.id} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} ListHeaderComponent={<><View style={styles.header}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><MaterialIcons name="arrow-back" size={21} color={colors.ink} /></Pressable><View><Text style={styles.eyebrow}>ADMINISTRACIÓN</Text><Text style={styles.title}>Configurar CRM</Text></View></View><Card style={styles.info}><MaterialIcons name="tune" size={23} color={colors.green} /><Text style={styles.infoText}>Adapta el pipeline, automatizaciones y delivery a la forma de vender de tu negocio.</Text></Card><Card style={styles.metaReady}><View style={styles.metaIcon}><MaterialIcons name="api" size={19} color="#2366A4" /></View><View style={styles.metaCopy}><Text style={styles.metaTitle}>Meta WhatsApp Cloud API</Text><Text style={styles.metaText}>Integración preparada. La activación se habilitará cuando agregues las credenciales del negocio.</Text></View><View style={styles.pendingPill}><Text style={styles.pendingText}>PENDIENTE</Text></View></Card><SectionTitle title="Automatizaciones" /><Card style={styles.settingsCard}><ToggleRow icon="auto-awesome" title="Automatizaciones activas" description="Habilita las reglas configuradas del CRM." value={settings.automations.enabled} onChange={(enabled) => updateAutomations({ enabled })} /><ToggleRow icon="waving-hand" title="Bienvenida a leads" description="Enviar respuesta al crear una oportunidad." value={settings.automations.welcomeOnNewLead} onChange={(welcomeOnNewLead) => updateAutomations({ welcomeOnNewLead })} /><ToggleRow icon="local-shipping" title="Avisos de delivery" description="Informar cambios de estado de la entrega." value={settings.automations.deliveryStatusUpdate} onChange={(deliveryStatusUpdate) => updateAutomations({ deliveryStatusUpdate })} /><ToggleRow icon="schedule-send" title="Recordatorio de seguimiento" description="Marcar contactos sin actividad para revisión." value={settings.automations.followUpReminder} onChange={(followUpReminder) => updateAutomations({ followUpReminder })} /></Card><SectionTitle title="Plantillas de Meta" /><Card style={styles.deliveryCard}><Text style={styles.inputLabel}>Plantilla para nuevo lead</Text><TextInput defaultValue={settings.templates.newLead} onEndEditing={(event) => updateTemplates({ newLead: event.nativeEvent.text.trim() })} placeholder="crm_bienvenida" placeholderTextColor={colors.muted} autoCapitalize="none" returnKeyType="next" style={styles.input} /><Text style={styles.inputLabel}>Plantilla para cambios de delivery</Text><TextInput defaultValue={settings.templates.deliveryUpdate} onEndEditing={(event) => updateTemplates({ deliveryUpdate: event.nativeEvent.text.trim() })} placeholder="crm_estado_delivery" placeholderTextColor={colors.muted} autoCapitalize="none" returnKeyType="done" style={styles.input} /><Text style={styles.templateHelp}>Usa los nombres de plantillas aprobadas en WhatsApp Manager cuando conectes Meta.</Text></Card><SectionTitle title="Delivery" /><Card style={styles.deliveryCard}><ToggleRow icon="two-wheeler" title="Servicio de delivery" description="Mostrar domicilio como opción en el catálogo." value={settings.delivery.enabled} onChange={(enabled) => updateDelivery({ enabled })} /><Text style={styles.inputLabel}>Tarifa base (COP)</Text><TextInput value={baseFeeText} onChangeText={setBaseFeeText} onEndEditing={() => saveNumeric(baseFeeText, "baseFee")} keyboardType="numeric" returnKeyType="done" style={styles.input} /><Text style={styles.inputLabel}>Envío gratis desde (COP)</Text><TextInput value={freeText} onChangeText={setFreeText} onEndEditing={() => saveNumeric(freeText, "freeShippingAbove")} keyboardType="numeric" returnKeyType="done" style={styles.input} /><Text style={styles.inputLabel}>Zonas cubiertas</Text><TextInput value={zoneText} onChangeText={setZoneText} onEndEditing={() => updateDelivery({ zones: zoneText.trim() })} placeholder="Ej. Zona Norte, Centro" placeholderTextColor={colors.muted} returnKeyType="done" style={styles.input} /></Card><SectionTitle title="Etapas del pipeline" /></>} ListFooterComponent={<View style={styles.footer}><Pressable onPress={() => { haptic.light(); addStage(); }} style={({ pressed }) => [styles.addStage, pressed && styles.pressed]}><MaterialIcons name="add" size={18} color={colors.green} /><Text style={styles.addStageText}>Añadir etapa</Text></Pressable><PrimaryButton label="Guardar configuración" icon="check-circle" onPress={() => { haptic.success(); Alert.alert("CRM actualizado", "Tus etapas y reglas operativas se guardaron en este dispositivo.", [{ text: "Listo", onPress: () => router.back() }]); }} /></View>} /></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { gap: 11, paddingBottom: 18, paddingTop: 8 },
  header: { alignItems: "center", flexDirection: "row", gap: 12, marginBottom: 4 },
  back: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.line, borderRadius: 13, borderWidth: 1, height: 42, justifyContent: "center", width: 42 },
  eyebrow: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.7 },
  title: { color: colors.ink, fontSize: 23, fontWeight: "800", letterSpacing: -0.5, marginTop: 2 },
  info: { alignItems: "center", backgroundColor: colors.mint, borderColor: "#B5E0CF", flexDirection: "row", gap: 10, padding: 13 },
  infoText: { color: colors.ink, flex: 1, fontSize: 11, lineHeight: 16 },
  metaReady: { alignItems: "center", backgroundColor: "#F2F7FC", borderColor: "#CCE0F3", flexDirection: "row", gap: 9, padding: 12 },
  metaIcon: { alignItems: "center", backgroundColor: "#DFEFFF", borderRadius: 11, height: 36, justifyContent: "center", width: 36 },
  metaCopy: { flex: 1 },
  metaTitle: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  metaText: { color: colors.muted, fontSize: 10, lineHeight: 14, marginTop: 3 },
  pendingPill: { backgroundColor: "#FFF2D4", borderRadius: 999, paddingHorizontal: 7, paddingVertical: 4 },
  pendingText: { color: "#A36E0A", fontSize: 8, fontWeight: "800" },
  settingsCard: { paddingBottom: 0, paddingTop: 0 },
  toggleRow: { alignItems: "center", borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: "row", gap: 10, minHeight: 72 },
  toggleIcon: { alignItems: "center", backgroundColor: colors.mint, borderRadius: 11, height: 35, justifyContent: "center", width: 35 },
  toggleCopy: { flex: 1 },
  toggleTitle: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  toggleDescription: { color: colors.muted, fontSize: 10, lineHeight: 14, marginTop: 3 },
  deliveryCard: { gap: 10, padding: 14 },
  inputLabel: { color: colors.ink, fontSize: 11, fontWeight: "800", marginTop: 2 },
  input: { backgroundColor: "#F8F8F6", borderColor: colors.line, borderRadius: 11, borderWidth: 1, color: colors.ink, fontSize: 13, fontWeight: "600", minHeight: 44, paddingHorizontal: 12 },
  templateHelp: { color: colors.muted, fontSize: 10, lineHeight: 14, marginTop: 1 },
  stageCard: { alignItems: "center", flexDirection: "row", gap: 10, minHeight: 57, padding: 10 },
  stageColor: { borderRadius: 7, height: 14, width: 14 },
  stageInput: { color: colors.ink, flex: 1, fontSize: 13, fontWeight: "800", paddingVertical: 7 },
  remove: { alignItems: "center", height: 35, justifyContent: "center", width: 35 },
  footer: { gap: 13, marginTop: 3 },
  addStage: { alignItems: "center", backgroundColor: colors.mint, borderRadius: 12, flexDirection: "row", gap: 6, justifyContent: "center", minHeight: 45 },
  addStageText: { color: colors.green, fontSize: 12, fontWeight: "800" },
  pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
});
