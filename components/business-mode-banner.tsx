import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StyleSheet, Text, View } from "react-native";

import { useBusiness } from "@/lib/business-store";
import { BUSINESS_EXPERIENCES } from "@/shared/business-experience";

export function BusinessModeBanner({ area }: { area: "POS" | "INVENTARIO" | "CATALOGO" }) {
  const { profile } = useBusiness();
  const experience = BUSINESS_EXPERIENCES[profile.id];
  const label = area === "POS" ? experience.posLabel : area === "INVENTARIO" ? experience.inventoryLabel : profile.shortLabel;
  return <View style={[styles.container, { backgroundColor: experience.soft, borderColor: experience.border }]}><View style={[styles.icon, { backgroundColor: experience.accent }]}><MaterialIcons name={profile.icon as never} size={20} color="#FFFFFF" /></View><View style={styles.copy}><Text style={[styles.label, { color: experience.accent }]}>{profile.shortLabel.toUpperCase()} · {label.toUpperCase()}</Text><Text style={styles.title}>{experience.headline}</Text><Text style={styles.caption}>{experience.caption}</Text></View></View>;
}

const styles = StyleSheet.create({
  container: { alignItems: "flex-start", borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 11, padding: 13 },
  icon: { alignItems: "center", borderRadius: 12, height: 42, justifyContent: "center", width: 42 },
  copy: { flex: 1 }, label: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5 }, title: { color: "#17211F", fontSize: 13, fontWeight: "800", marginTop: 2 }, caption: { color: "#5F6A66", fontSize: 10, lineHeight: 14, marginTop: 3 },
});
