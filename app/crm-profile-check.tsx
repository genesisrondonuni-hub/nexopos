import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Card, colors, PrimaryButton } from "@/components/nexo-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useBusiness } from "@/lib/business-store";
import { buildCrmProfileChecks, type CrmProfileCheck } from "@/shared/crm-profile-check";

export default function CrmProfileCheckScreen() {
  const { configuration, profile } = useBusiness();
  const checks = buildCrmProfileChecks(configuration);
  const completed = checks.filter((check) => check.complete).length;
  const renderCheck = ({ item }: { item: CrmProfileCheck }) => <Card style={styles.check}><View style={[styles.icon, { backgroundColor: item.complete ? colors.mint : "#FFF2D4" }]}><MaterialIcons name={item.complete ? "check-circle" : "pending-actions"} size={20} color={item.complete ? colors.green : "#A36E0A"} /></View><View style={styles.copy}><Text style={styles.checkTitle}>{item.title}</Text><Text style={styles.checkDetail}>{item.detail}</Text></View></Card>;
  return <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#F6F3EE]" className="px-5"><FlatList data={checks} renderItem={renderCheck} keyExtractor={(item) => item.id} contentContainerStyle={styles.content} ListHeaderComponent={<><View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><MaterialIcons name="arrow-back" size={21} color={colors.ink} /></Pressable><View><Text style={styles.eyebrow}>{profile.shortLabel.toUpperCase()} · CRM</Text><Text style={styles.title}>Validación guiada</Text></View></View><Card style={styles.summary}><MaterialIcons name="fact-check" size={24} color={colors.green} /><View style={styles.copy}><Text style={styles.summaryTitle}>{completed} de {checks.length} controles listos</Text><Text style={styles.summaryText}>Revisa esta lista antes de activar conversaciones, catálogo y seguimiento para este perfil.</Text></View></Card></>} ListFooterComponent={<PrimaryButton label="Volver al perfil" icon="business" onPress={() => router.back()} />} /></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { gap: 10, paddingBottom: 24, paddingTop: 8 }, header: { alignItems: "center", flexDirection: "row", gap: 12, marginBottom: 6 }, back: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.line, borderRadius: 13, borderWidth: 1, height: 42, justifyContent: "center", width: 42 }, eyebrow: { color: colors.muted, fontSize: 9, fontWeight: "900", letterSpacing: 0.7 }, title: { color: colors.ink, fontSize: 22, fontWeight: "800", marginTop: 2 }, summary: { alignItems: "center", backgroundColor: colors.mint, borderColor: "#B5E0CF", flexDirection: "row", gap: 10, padding: 13 }, copy: { flex: 1 }, summaryTitle: { color: colors.ink, fontSize: 13, fontWeight: "800" }, summaryText: { color: colors.muted, fontSize: 10, lineHeight: 14, marginTop: 3 }, check: { alignItems: "flex-start", flexDirection: "row", gap: 10, padding: 13 }, icon: { alignItems: "center", borderRadius: 11, height: 38, justifyContent: "center", width: 38 }, checkTitle: { color: colors.ink, fontSize: 12, fontWeight: "800" }, checkDetail: { color: colors.muted, fontSize: 10, lineHeight: 14, marginTop: 3 } });
