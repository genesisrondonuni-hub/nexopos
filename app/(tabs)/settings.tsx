import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Card, colors, SectionTitle, SoftButton } from "@/components/nexo-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useNexo } from "@/lib/pos-store";
import { useBusiness } from "@/lib/business-store";

function SettingRow({ icon, title, description, onPress }: { icon: keyof typeof MaterialIcons.glyphMap; title: string; description: string; onPress?: () => void }) {
  return <Pressable disabled={!onPress} onPress={onPress} style={({ pressed }) => [styles.row, pressed && onPress && styles.rowPressed]}><View style={styles.rowIcon}><MaterialIcons name={icon} size={19} color={colors.green} /></View><View style={styles.rowCopy}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowDescription}>{description}</Text></View><MaterialIcons name="chevron-right" size={20} color={colors.muted} /></Pressable>;
}

export default function SettingsScreen() {
  const { businessSettings } = useNexo();
  const { configuration, profile } = useBusiness();
  return <ScreenContainer containerClassName="bg-[#F6F3EE]" className="px-5"><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}><View><Text style={styles.eyebrow}>{profile.shortLabel.toUpperCase()}</Text><Text style={styles.title}>Más opciones</Text></View><Card style={styles.businessCard}><View style={styles.logo}><Text style={styles.logoText}>{configuration.businessName.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase()}</Text></View><View style={styles.businessCopy}><Text style={styles.businessTitle}>{configuration.businessName}</Text><Text style={styles.businessSub}>{profile.label} · Configuración adaptable</Text></View><View style={styles.openPill}><Text style={styles.openText}>ABIERTO</Text></View></Card><SoftButton label="Abrir catálogo público" icon="storefront" onPress={() => router.push("/shop")} /><SectionTitle title="Inventario e inteligencia" /><Card style={styles.settingsCard}><SettingRow icon="upload-file" title="Importar inventario" description="TXT, CSV, Excel o Google Sheets" onPress={() => router.push("/inventory-import" as never)} /><SettingRow icon="settings-input-component" title="Integraciones y APIs" description="Gemini, modelos y conexión segura" onPress={() => router.push("/api-integrations" as never)} /><SettingRow icon="auto-awesome" title="Gemini para el negocio" description="Analizar ventas, stock y CRM" onPress={() => router.push("/gemini-settings" as never)} /></Card><SectionTitle title="Configuración" /><Card style={styles.settingsCard}><SettingRow icon="business-center" title="Perfil de negocio" description={profile.label} onPress={() => router.push("/business-profile" as never)} /><SettingRow icon="chat" title="Canal de pedidos" description={`WhatsApp: +${businessSettings.whatsappNumber}`} onPress={() => router.push("/business-settings" as never)} /><SettingRow icon="storefront" title="Datos del negocio" description="Logo, horarios y tienda virtual" /><SettingRow icon="group" title="Equipo y permisos" description="Administrador, cajero y vendedor" /><SettingRow icon="request-quote" title="Facturación" description="DIAN y comprobantes electrónicos" /><SettingRow icon="analytics" title="Reportes" description="Ventas, gastos y rendimiento" /></Card><SectionTitle title="Soporte" /><SoftButton label="Centro de ayuda" icon="help-outline" onPress={() => undefined} /><Text style={styles.version}>NexoPOS · Versión 1.0.0</Text></ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { gap: 18, paddingBottom: 112, paddingTop: 14 },
  eyebrow: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 0.7 },
  title: { color: colors.ink, fontSize: 28, fontWeight: "800", letterSpacing: -0.7, marginTop: 3 },
  businessCard: { alignItems: "center", flexDirection: "row", gap: 11, padding: 14 },
  logo: { alignItems: "center", backgroundColor: colors.ink, borderRadius: 14, height: 46, justifyContent: "center", width: 46 },
  logoText: { color: colors.white, fontSize: 14, fontWeight: "800" },
  businessCopy: { flex: 1 },
  businessTitle: { color: colors.ink, fontSize: 15, fontWeight: "800" },
  businessSub: { color: colors.muted, fontSize: 11, marginTop: 3 },
  openPill: { backgroundColor: colors.mint, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  openText: { color: colors.green, fontSize: 9, fontWeight: "800" },
  settingsCard: { paddingBottom: 0, paddingTop: 0 },
  row: { alignItems: "center", borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: "row", gap: 11, minHeight: 74 },
  rowPressed: { opacity: 0.68 },
  rowIcon: { alignItems: "center", backgroundColor: colors.mint, borderRadius: 11, height: 36, justifyContent: "center", width: 36 },
  rowCopy: { flex: 1 },
  rowTitle: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  rowDescription: { color: colors.muted, fontSize: 11, marginTop: 3 },
  version: { color: colors.muted, fontSize: 11, fontWeight: "700", textAlign: "center" },
});
