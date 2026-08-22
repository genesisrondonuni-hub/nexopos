import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatBusinessMoney, formatConfiguredMoney } from "@/shared/currency-format";
import { DEFAULT_VENEZUELAN_FISCAL_SETTINGS } from "@/shared/venezuela-fiscal";

export const colors = {
  ink: "#17211F",
  green: "#197B63",
  mint: "#DDF4EA",
  sand: "#F6F3EE",
  coral: "#D65A45",
  gold: "#D99A22",
  line: "#E6E2DB",
  muted: "#6E7874",
  white: "#FFFFFF",
};

export function formatMoney(value: number, compact = false) { return formatConfiguredMoney(value, compact); }

export function formatVES(value: number, compact = false) { return formatBusinessMoney(value, { ...DEFAULT_VENEZUELAN_FISCAL_SETTINGS, displayCurrency: "VES" }, compact); }

export function MetricCard({ label, value, icon, tone = "green", helper }: { label: string; value: string; icon: keyof typeof MaterialIcons.glyphMap; tone?: "green" | "gold" | "ink"; helper?: string }) {
  const background = tone === "green" ? colors.mint : tone === "gold" ? "#FFF2D4" : "#E8ECEA";
  const color = tone === "green" ? colors.green : tone === "gold" ? "#A36E0A" : colors.ink;
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: background }]}><MaterialIcons name={icon} size={19} color={color} /></View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      {helper ? <Text style={styles.metricHelper}>{helper}</Text> : null}
    </View>
  );
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? <Pressable onPress={onAction} style={({ pressed }) => [styles.textAction, pressed && styles.pressed]}><Text style={styles.textActionLabel}>{action}</Text></Pressable> : null}
    </View>
  );
}

export function StatusPill({ status }: { status: "PENDIENTE" | "EN PROCESO" | "PAGADO" | "ARCHIVADO" }) {
  const config = {
    PENDIENTE: { label: "Pendiente", color: "#A36E0A", bg: "#FFF2D4" },
    "EN PROCESO": { label: "En proceso", color: "#2366A4", bg: "#DFEFFF" },
    PAGADO: { label: "Pagado", color: colors.green, bg: colors.mint },
    ARCHIVADO: { label: "Archivado", color: colors.muted, bg: "#E8ECEA" },
  }[status];
  return <View style={[styles.statusPill, { backgroundColor: config.bg }]}><Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text></View>;
}

export function PrimaryButton({ label, icon, onPress, disabled = false }: { label: string; icon?: keyof typeof MaterialIcons.glyphMap; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.primaryButton, disabled && styles.disabledButton, pressed && !disabled && styles.primaryPressed]}>
      {icon ? <MaterialIcons name={icon} size={19} color={colors.white} /> : null}
      <Text style={styles.primaryLabel}>{label}</Text>
    </Pressable>
  );
}

export function SoftButton({ label, icon, onPress }: { label: string; icon?: keyof typeof MaterialIcons.glyphMap; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.softButton, pressed && styles.pressed]}>
      {icon ? <MaterialIcons name={icon} size={18} color={colors.green} /> : null}
      <Text style={styles.softLabel}>{label}</Text>
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderColor: colors.line, borderWidth: 1, borderRadius: 18, padding: 16 },
  metricCard: { width: "48%", backgroundColor: colors.white, borderRadius: 18, borderWidth: 1, borderColor: colors.line, padding: 14, minHeight: 148 },
  metricIcon: { alignItems: "center", borderRadius: 12, height: 36, justifyContent: "center", width: 36 },
  metricLabel: { color: colors.muted, fontSize: 12, fontWeight: "600", marginTop: 13 },
  metricValue: { color: colors.ink, fontSize: 21, fontWeight: "800", letterSpacing: -0.5, marginTop: 4 },
  metricHelper: { color: colors.green, fontSize: 11, fontWeight: "700", marginTop: 4 },
  sectionRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: "800", letterSpacing: -0.2 },
  textAction: { paddingHorizontal: 2, paddingVertical: 4 },
  textActionLabel: { color: colors.green, fontSize: 13, fontWeight: "800" },
  statusPill: { alignSelf: "flex-start", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { fontSize: 11, fontWeight: "800" },
  primaryButton: { alignItems: "center", backgroundColor: colors.green, borderRadius: 15, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 52, paddingHorizontal: 18 },
  primaryLabel: { color: colors.white, fontSize: 15, fontWeight: "800" },
  softButton: { alignItems: "center", backgroundColor: colors.mint, borderRadius: 13, flexDirection: "row", gap: 7, justifyContent: "center", minHeight: 42, paddingHorizontal: 12 },
  softLabel: { color: colors.green, fontSize: 13, fontWeight: "800" },
  pressed: { opacity: 0.68 },
  primaryPressed: { opacity: 0.9, transform: [{ scale: 0.97 }] },
  disabledButton: { backgroundColor: "#AAB6B2" },
});
