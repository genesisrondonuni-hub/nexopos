import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Card, colors, PrimaryButton } from "@/components/nexo-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useBusiness } from "@/lib/business-store";
import { haptic } from "@/lib/haptics";
import { fiscalProviderReadiness } from "@/shared/fiscal-provider";
import { isValidVenezuelanRif, normalizeVenezuelanRif } from "@/shared/venezuela-fiscal";

export default function FiscalProviderSettingsScreen() {
  const { configuration, updateFiscal } = useBusiness();
  const [name, setName] = useState(configuration.fiscal.provider.name);
  const [rif, setRif] = useState(configuration.fiscal.provider.rif);
  const [reference, setReference] = useState(configuration.fiscal.provider.authorizationReference);
  const readiness = fiscalProviderReadiness({ name, rif, authorizationReference: reference, verificationStatus: configuration.fiscal.provider.verificationStatus, verifiedAt: configuration.fiscal.provider.verifiedAt });
  const save = () => {
    const normalizedRif = normalizeVenezuelanRif(rif);
    if (normalizedRif && !isValidVenezuelanRif(normalizedRif)) { Alert.alert("RIF por revisar", "Verifica el RIF de la imprenta digital o proveedor antes de guardar."); return; }
    const complete = Boolean(name.trim() && normalizedRif && reference.trim());
    updateFiscal({ provider: { name: name.trim(), rif: normalizedRif, authorizationReference: reference.trim(), verificationStatus: complete ? "PENDIENTE" : "NO_CONFIGURADO", verifiedAt: null } });
    haptic.success(); Alert.alert("Ficha guardada", complete ? "La ficha quedó pendiente de contrastar con el listado oficial del SENIAT. NexoPOS no emitirá documentos fiscales todavía." : "La ficha está incompleta y no habilita ninguna emisión fiscal.", [{ text: "Listo", onPress: () => router.back() }]);
  };
  return <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#F6F3EE]" className="px-5"><View style={styles.content}><View style={styles.header}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><MaterialIcons name="arrow-back" size={21} color={colors.ink} /></Pressable><View><Text style={styles.eyebrow}>FISCAL · VENEZUELA</Text><Text style={styles.title}>Proveedor autorizado</Text></View></View><Card style={styles.hero}><MaterialIcons name="verified-user" size={24} color={colors.green} /><View style={styles.heroCopy}><Text style={styles.heroTitle}>{readiness.label}</Text><Text style={styles.heroText}>Registra solo una ficha de preparación. La autorización y la versión de software se validan externamente antes de emitir.</Text></View></Card><Text style={styles.label}>Razón social o nombre comercial</Text><TextInput value={name} onChangeText={setName} placeholder="Proveedor o imprenta digital" placeholderTextColor={colors.muted} maxLength={160} style={styles.input} /><Text style={styles.label}>RIF del proveedor</Text><TextInput value={rif} onChangeText={setRif} autoCapitalize="characters" placeholder="J-12345678-9" placeholderTextColor={colors.muted} maxLength={32} style={styles.input} /><Text style={styles.label}>Referencia de autorización o sistema</Text><TextInput value={reference} onChangeText={setReference} placeholder="Providencia, versión homologada o referencia" placeholderTextColor={colors.muted} maxLength={160} style={styles.input} /><Card style={styles.notice}><MaterialIcons name="info-outline" size={18} color={colors.gold} /><Text style={styles.noticeText}>Verifica la empresa, el RIF, la autorización y la versión vigente en el portal oficial del SENIAT. Esta pantalla no transmite datos, no asigna números de control y no guarda credenciales.</Text></Card><PrimaryButton label="Guardar ficha preparatoria" icon="save" onPress={save} /></View></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { gap: 10, paddingTop: 10 }, header: { alignItems: "center", flexDirection: "row", gap: 11, marginBottom: 4 }, back: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.line, borderRadius: 13, borderWidth: 1, height: 42, justifyContent: "center", width: 42 }, eyebrow: { color: colors.muted, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 }, title: { color: colors.ink, fontSize: 21, fontWeight: "800", marginTop: 2 }, hero: { alignItems: "flex-start", backgroundColor: colors.mint, borderColor: "#B5E0CF", flexDirection: "row", gap: 10, padding: 13 }, heroCopy: { flex: 1 }, heroTitle: { color: colors.ink, fontSize: 13, fontWeight: "800" }, heroText: { color: colors.muted, fontSize: 10, lineHeight: 14, marginTop: 3 }, label: { color: colors.ink, fontSize: 12, fontWeight: "800", marginTop: 5 }, input: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: 12, borderWidth: 1, color: colors.ink, fontSize: 14, fontWeight: "700", minHeight: 48, paddingHorizontal: 13 }, notice: { alignItems: "flex-start", backgroundColor: "#FFF8E8", borderColor: "#F0DCA1", flexDirection: "row", gap: 8, padding: 11 }, noticeText: { color: "#725117", flex: 1, fontSize: 10, lineHeight: 14 }, pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] } });
