import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Card, colors, PrimaryButton } from "@/components/nexo-ui";
import { ScreenContainer } from "@/components/screen-container";
import { haptic } from "@/lib/haptics";
import { useNexo } from "@/lib/pos-store";

export default function BusinessSettingsScreen() {
  const { businessSettings, updateWhatsAppNumber } = useNexo();
  const [number, setNumber] = useState(businessSettings.whatsappNumber);
  const [error, setError] = useState("");
  const save = () => {
    if (!updateWhatsAppNumber(number)) {
      haptic.medium();
      setError("Ingresa entre 8 y 15 dígitos, incluido el código de país.");
      return;
    }
    haptic.success();
    Alert.alert("Canal actualizado", "El catálogo usará este número para los próximos pedidos.", [{ text: "Listo", onPress: () => router.back() }]);
  };
  return <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#F6F3EE]" className="px-5"><View style={styles.content}><View style={styles.header}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><MaterialIcons name="arrow-back" size={21} color={colors.ink} /></Pressable><View><Text style={styles.eyebrow}>CONFIGURACIÓN DEL NEGOCIO</Text><Text style={styles.title}>Canal de pedidos</Text></View></View><Card style={styles.infoCard}><View style={styles.infoIcon}><MaterialIcons name="chat" size={23} color={colors.green} /></View><View style={styles.infoCopy}><Text style={styles.infoTitle}>Pedidos por WhatsApp</Text><Text style={styles.infoText}>El catálogo enviará sus mensajes a este número.</Text></View></Card><Text style={styles.label}>Número de WhatsApp</Text><TextInput value={number} onChangeText={(value) => { setNumber(value); setError(""); }} placeholder="Ej. 584121234567" placeholderTextColor={colors.muted} keyboardType="phone-pad" returnKeyType="done" onSubmitEditing={save} style={[styles.input, Boolean(error) && styles.inputError]} /><Text style={styles.help}>Incluye el código de país. Puedes escribir espacios, guiones o el signo +.</Text>{error ? <Text style={styles.error}>{error}</Text> : null}<View style={styles.example}><MaterialIcons name="info-outline" size={16} color={colors.muted} /><Text style={styles.exampleText}>Ejemplo para Venezuela: +58 412 123 4567</Text></View><View style={styles.bottom}><PrimaryButton label="Guardar número" icon="check-circle" onPress={save} /></View></View></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { flex: 1, gap: 14, paddingTop: 8 },
  header: { alignItems: "center", flexDirection: "row", gap: 12, marginBottom: 7 },
  back: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.line, borderRadius: 13, borderWidth: 1, height: 42, justifyContent: "center", width: 42 },
  eyebrow: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.7 },
  title: { color: colors.ink, fontSize: 23, fontWeight: "800", letterSpacing: -0.5, marginTop: 2 },
  infoCard: { alignItems: "center", flexDirection: "row", gap: 11, padding: 14 },
  infoIcon: { alignItems: "center", backgroundColor: colors.mint, borderRadius: 13, height: 44, justifyContent: "center", width: 44 },
  infoCopy: { flex: 1 },
  infoTitle: { color: colors.ink, fontSize: 14, fontWeight: "800" },
  infoText: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  label: { color: colors.ink, fontSize: 13, fontWeight: "800", marginTop: 5 },
  input: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: 13, borderWidth: 1, color: colors.ink, fontSize: 17, fontWeight: "700", minHeight: 54, paddingHorizontal: 14 },
  inputError: { borderColor: colors.coral },
  help: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: -6 },
  error: { color: colors.coral, fontSize: 11, fontWeight: "700", marginTop: -3 },
  example: { alignItems: "center", flexDirection: "row", gap: 7, marginTop: 4 },
  exampleText: { color: colors.muted, fontSize: 11 },
  bottom: { marginTop: "auto", paddingBottom: 4 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
});
