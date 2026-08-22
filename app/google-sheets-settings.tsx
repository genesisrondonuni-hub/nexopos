import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Card, colors, PrimaryButton, SoftButton } from "@/components/nexo-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useBusiness } from "@/lib/business-store";
import { haptic } from "@/lib/haptics";
import { useIntegrations } from "@/lib/integrations-store";
import { useNexo } from "@/lib/pos-store";
import { trpc } from "@/lib/trpc";
import { previewInventoryRows } from "@/shared/inventory-import";

export default function GoogleSheetsSettingsScreen() {
  const { settings, updateGoogleSheets } = useIntegrations();
  const { addCategory } = useBusiness();
  const { upsertImportedProducts } = useNexo();
  const sheets = settings.googleSheets;
  const status = trpc.googleSheets.status.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const startAuthorization = trpc.googleSheets.startAuthorization.useMutation();
  const completeAuthorization = trpc.googleSheets.completeAuthorization.useMutation();
  const readValues = trpc.googleSheets.readValues.useMutation();
  const isConnected = Boolean(sheets.connectionId);

  const connectGoogle = async () => {
    if (status.data?.state !== "LISTO_PARA_AUTORIZAR") {
      Alert.alert("OAuth pendiente", status.data?.detail ?? "Registra primero el Client ID y Client Secret de Google en la configuración segura.");
      return;
    }
    try {
      const redirectUri = Linking.createURL("google-sheets");
      const start = await startAuthorization.mutateAsync({ redirectUri });
      const result = await WebBrowser.openAuthSessionAsync(start.authorizationUrl, redirectUri);
      if (result.type !== "success") return;
      const params = Linking.parse(result.url).queryParams ?? {};
      const code = typeof params.code === "string" ? params.code : "";
      const state = typeof params.state === "string" ? params.state : "";
      const error = typeof params.error === "string" ? params.error : "";
      if (error || !code || !state) throw new Error(error || "Google no devolvió un código de autorización.");
      const completed = await completeAuthorization.mutateAsync({ code, state, redirectUri });
      updateGoogleSheets({ connectionId: completed.connectionId });
      haptic.success();
      Alert.alert("Cuenta conectada", "Ya puedes leer una hoja privada configurada para este negocio.");
    } catch (error) {
      Alert.alert("No se pudo conectar Google", error instanceof Error ? error.message : "Inténtalo de nuevo.");
    }
  };

  const importPrivateSheet = async () => {
    if (!sheets.connectionId || !sheets.spreadsheetId.trim() || !sheets.sheetName.trim()) {
      Alert.alert("Falta información", "Conecta la cuenta de Google e indica el ID y pestaña de la hoja.");
      return;
    }
    try {
      const result = await readValues.mutateAsync({ connectionId: sheets.connectionId, spreadsheetId: sheets.spreadsheetId.trim(), sheetName: sheets.sheetName.trim() });
      const preview = previewInventoryRows(result.values);
      if (!preview.products.length) throw new Error("La hoja no contiene productos válidos. Revisa las columnas Nombre y Precio.");
      Alert.alert("Vista previa lista", `${preview.products.length} productos válidos y ${preview.issues.length} avisos.`, [{ text: "Cancelar", style: "cancel" }, { text: "Aplicar", onPress: () => { preview.products.forEach((product) => addCategory(product.category)); const summary = upsertImportedProducts(preview.products, "Google Sheets privada"); haptic.success(); Alert.alert("Inventario actualizado", `${summary.created} creados y ${summary.updated} actualizados.`, [{ text: "Ver inventario", onPress: () => router.replace("/(tabs)/inventory") }]); } }]);
    } catch (error) {
      Alert.alert("No se pudo leer la hoja", error instanceof Error ? error.message : "Inténtalo de nuevo.");
    }
  };

  return <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#F6F3EE]" className="px-5"><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><View style={styles.header}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><MaterialIcons name="arrow-back" size={21} color={colors.ink} /></Pressable><View><Text style={styles.eyebrow}>GOOGLE WORKSPACE</Text><Text style={styles.title}>Sheets privadas</Text></View></View><Card style={styles.info}><MaterialIcons name={isConnected ? "verified-user" : "lock"} size={21} color={colors.green} /><Text style={styles.infoText}>{isConnected ? "La cuenta del negocio está conectada. Puedes leer la hoja configurada de manera privada." : "Esta conexión permite importar hojas privadas cuando las credenciales OAuth estén registradas de forma segura."}</Text></Card><Text style={styles.section}>Hoja predeterminada</Text><TextInput value={sheets.spreadsheetId} onChangeText={(spreadsheetId) => updateGoogleSheets({ spreadsheetId: spreadsheetId.trim() })} placeholder="ID de la hoja de cálculo" placeholderTextColor={colors.muted} autoCapitalize="none" autoCorrect={false} style={styles.input} /><Text style={styles.help}>El ID aparece entre /d/ y /edit en la URL de Google Sheets.</Text><TextInput value={sheets.sheetName} onChangeText={(sheetName) => updateGoogleSheets({ sheetName })} placeholder="Nombre de la pestaña" placeholderTextColor={colors.muted} style={styles.input} /><Card style={styles.steps}><Text style={styles.stepsTitle}>Estado de la conexión</Text><View style={styles.step}><View style={styles.number}><Text style={styles.numberText}>1</Text></View><Text style={styles.stepText}>Registra Client ID y Client Secret OAuth en la configuración segura del proyecto.</Text></View><View style={styles.step}><View style={styles.number}><Text style={styles.numberText}>2</Text></View><Text style={styles.stepText}>Autoriza la cuenta de Google del negocio para leer las hojas privadas.</Text></View><View style={styles.step}><View style={styles.number}><Text style={styles.numberText}>3</Text></View><Text style={styles.stepText}>Importa una vista previa y aplica sus productos al inventario.</Text></View></Card><SoftButton label="Ver historial de importaciones" icon="history" onPress={() => router.push("/inventory-import-history" as never)} /><Pressable onPress={() => void connectGoogle()} style={({ pressed }) => [styles.connect, (startAuthorization.isPending || completeAuthorization.isPending) && styles.disabled, pressed && styles.pressed]} disabled={startAuthorization.isPending || completeAuthorization.isPending}><MaterialIcons name="account-circle" size={19} color={colors.white} /><Text style={styles.connectText}>{isConnected ? "Reconectar cuenta de Google" : "Conectar cuenta de Google"}</Text></Pressable><PrimaryButton label={readValues.isPending ? "Leyendo hoja…" : "Importar hoja privada"} icon="table-chart" onPress={() => void importPrivateSheet()} disabled={!isConnected || readValues.isPending} /></ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { gap: 12, paddingBottom: 24, paddingTop: 8 }, header: { alignItems: "center", flexDirection: "row", gap: 12, marginBottom: 3 }, back: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.line, borderRadius: 13, borderWidth: 1, height: 42, justifyContent: "center", width: 42 }, eyebrow: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.7 }, title: { color: colors.ink, fontSize: 22, fontWeight: "800", letterSpacing: -0.4, marginTop: 2 }, info: { alignItems: "center", backgroundColor: colors.mint, borderColor: "#B5E0CF", flexDirection: "row", gap: 10, padding: 13 }, infoText: { color: colors.ink, flex: 1, fontSize: 11, lineHeight: 16 }, section: { color: colors.ink, fontSize: 14, fontWeight: "800", marginTop: 4 }, input: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: 12, borderWidth: 1, color: colors.ink, fontSize: 12, minHeight: 47, paddingHorizontal: 12 }, help: { color: colors.muted, fontSize: 10, lineHeight: 14, marginTop: -6 }, steps: { gap: 11, padding: 13 }, stepsTitle: { color: colors.ink, fontSize: 13, fontWeight: "800", marginBottom: 2 }, step: { alignItems: "flex-start", flexDirection: "row", gap: 9 }, number: { alignItems: "center", backgroundColor: colors.mint, borderRadius: 99, height: 20, justifyContent: "center", width: 20 }, numberText: { color: colors.green, fontSize: 10, fontWeight: "900" }, stepText: { color: colors.muted, flex: 1, fontSize: 10, lineHeight: 15 }, connect: { alignItems: "center", backgroundColor: colors.ink, borderRadius: 13, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 50 }, connectText: { color: colors.white, fontSize: 12, fontWeight: "800" }, disabled: { opacity: 0.55 }, pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
});
