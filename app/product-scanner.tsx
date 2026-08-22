import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { CameraView, type Subscription } from "expo-camera";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { haptic } from "@/lib/haptics";
import { normalizeProductCode } from "@/shared/product-code";

export default function ProductScannerScreen() {
  const subscription = useRef<Subscription | null>(null);
  const [code, setCode] = useState("");
  const [opening, setOpening] = useState(false);
  const finishScan = (value: string) => {
    const normalized = normalizeProductCode(value);
    if (!normalized) return;
    subscription.current?.remove();
    subscription.current = null;
    haptic.success();
    router.replace({ pathname: "/(tabs)/pos", params: { scannedCode: normalized } } as never);
  };
  const openScanner = async () => {
    if (Platform.OS === "web") { Alert.alert("Escáner no disponible", "En el navegador puedes escribir o pegar el código del producto."); return; }
    if (opening) return;
    setOpening(true);
    subscription.current?.remove();
    subscription.current = CameraView.onModernBarcodeScanned((event) => finishScan(event.data));
    try {
      await CameraView.launchScanner({ barcodeTypes: ["ean13", "ean8", "code128", "code39", "upc_a", "upc_e", "qr"], isGuidanceEnabled: true, isHighlightingEnabled: true });
    } catch {
      subscription.current?.remove();
      subscription.current = null;
      Alert.alert("No fue posible abrir el escáner", "Puedes ingresar el código manualmente e intentarlo de nuevo desde un dispositivo compatible.");
    } finally { setOpening(false); }
  };
  useEffect(() => { if (Platform.OS !== "web") void openScanner(); return () => { subscription.current?.remove(); subscription.current = null; void CameraView.dismissScanner().catch(() => undefined); }; }, []);
  return <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#17211F]" className="px-6"><View style={styles.content}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.close, pressed && styles.pressed]}><MaterialIcons name="close" size={23} color="#17211F" /></Pressable><View style={styles.hero}><View style={styles.icon}><MaterialIcons name="qr-code-scanner" size={42} color="#FFFFFF" /></View><Text style={styles.title}>Escanear producto</Text><Text style={styles.caption}>El escáner se abre de forma segura en tu dispositivo. Si no lo tienes a mano, ingresa el código manualmente.</Text></View><View style={styles.manual}><Text style={styles.label}>Código del producto</Text><TextInput value={code} onChangeText={setCode} placeholder="Ej. SKU-ABC-001" placeholderTextColor="#9BB0A9" autoCapitalize="characters" autoCorrect={false} returnKeyType="search" onSubmitEditing={() => finishScan(code)} style={styles.input} /><Pressable onPress={() => finishScan(code)} style={({ pressed }) => [styles.manualButton, !code.trim() && styles.disabled, pressed && code.trim() && styles.pressed]} disabled={!code.trim()}><Text style={styles.manualButtonText}>Buscar código</Text></Pressable><Pressable onPress={() => void openScanner()} style={({ pressed }) => [styles.scanAgain, pressed && styles.pressed]}><MaterialIcons name="qr-code-scanner" size={18} color="#CDEADD" /><Text style={styles.scanAgainText}>{opening ? "Abriendo escáner…" : "Abrir escáner"}</Text></Pressable></View></View></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { flex: 1, paddingTop: 14 }, close: { alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 16, height: 44, justifyContent: "center", width: 44 }, hero: { alignItems: "center", flex: 1, justifyContent: "center", paddingHorizontal: 16 }, icon: { alignItems: "center", backgroundColor: "#27775F", borderRadius: 24, height: 88, justifyContent: "center", width: 88 }, title: { color: "#FFFFFF", fontSize: 25, fontWeight: "800", marginTop: 22 }, caption: { color: "#C4D7D0", fontSize: 13, lineHeight: 19, marginTop: 9, textAlign: "center" }, manual: { backgroundColor: "#21312D", borderColor: "#36544B", borderRadius: 20, borderWidth: 1, gap: 11, marginBottom: 10, padding: 16 }, label: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" }, input: { backgroundColor: "#FFFFFF", borderRadius: 12, color: "#17211F", fontSize: 13, fontWeight: "700", minHeight: 47, paddingHorizontal: 12 }, manualButton: { alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 12, minHeight: 45, justifyContent: "center" }, manualButtonText: { color: "#17211F", fontSize: 13, fontWeight: "800" }, scanAgain: { alignItems: "center", flexDirection: "row", gap: 7, justifyContent: "center", minHeight: 34 }, scanAgainText: { color: "#CDEADD", fontSize: 12, fontWeight: "800" }, disabled: { opacity: 0.45 }, pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] } });
