import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Linking, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { ScreenContainer } from "@/components/screen-container";
import { haptic } from "@/lib/haptics";
import { parseBarcodeInput } from "@/shared/barcode-input";

type CaptureMode = "CAMERA" | "HARDWARE";
const barcodeTypes: ("ean13" | "ean8" | "code128" | "code39" | "upc_a" | "upc_e" | "qr")[] = ["ean13", "ean8", "code128", "code39", "upc_a", "upc_e", "qr"];

export default function ProductScannerScreen() {
  const { mode: routeMode } = useLocalSearchParams<{ mode?: string }>();
  const [permission, requestPermission] = useCameraPermissions();
  const [code, setCode] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [captureMode, setCaptureMode] = useState<CaptureMode>(Platform.OS === "web" || routeMode === "hardware" ? "HARDWARE" : "CAMERA");
  const ensureCameraPermission = useCallback(async () => {
    if (Platform.OS === "web") { Alert.alert("Cámara no disponible", "En el navegador usa el lector físico o ingresa el código manualmente."); return false; }
    if (permission?.granted) return true;
    const response = await requestPermission();
    if (response.granted) return true;
    const message = response.canAskAgain ? "Permite el acceso para leer códigos con la cámara." : "La cámara fue bloqueada. Abre los ajustes del teléfono y habilita Cámara para NexoPOS.";
    Alert.alert("Permiso de cámara requerido", message, response.canAskAgain ? [{ text: "Entendido" }] : [{ text: "Cancelar", style: "cancel" }, { text: "Abrir ajustes", onPress: () => void Linking.openSettings() }]);
    return false;
  }, [permission?.granted, requestPermission]);
  const finishScan = (value: string) => {
    const parsed = parseBarcodeInput(value);
    if (!parsed.normalized) return;
    if (!parsed.valid) { haptic.warning(); Alert.alert("Código por revisar", `El ${parsed.format ?? "código"} no supera la validación de dígito de control. Intenta escanearlo nuevamente.`); return; }
    setCameraActive(false);
    haptic.success();
    router.replace({ pathname: "/(tabs)/pos", params: { scannedCode: parsed.normalized, scanToken: String(Date.now()) } } as never);
  };
  const activateCamera = useCallback(async (silent = false) => {
    if (!await ensureCameraPermission()) return;
    if (!silent) haptic.light();
    setCameraActive(true);
  }, [ensureCameraPermission]);
  useEffect(() => {
    if (captureMode !== "CAMERA" || Platform.OS === "web") return;
    const timer = setTimeout(() => { void activateCamera(true); }, 150);
    return () => { clearTimeout(timer); setCameraActive(false); };
  }, [activateCamera, captureMode]);
  const setMode = (next: CaptureMode) => { haptic.light(); setCameraActive(false); setCaptureMode(next); };
  const isHardware = captureMode === "HARDWARE";
  const cameraView = captureMode === "CAMERA" && cameraActive && permission?.granted ? <View style={styles.cameraWrap}><CameraView style={styles.camera} facing="back" barcodeScannerSettings={{ barcodeTypes }} onBarcodeScanned={({ data }) => finishScan(data)} onMountError={() => { setCameraActive(false); Alert.alert("Cámara no disponible", "No fue posible iniciar la cámara. Revisa el permiso o usa un lector físico."); }} /><View style={styles.cameraHint}><Text style={styles.cameraHintText}>Centra el código dentro del recuadro</Text><Pressable onPress={() => setCameraActive(false)} style={({ pressed }) => [styles.stopCamera, pressed && styles.pressed]}><MaterialIcons name="close" size={16} color="#17211F" /><Text style={styles.stopCameraText}>Cerrar</Text></Pressable></View></View> : null;
  return <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#17211F]" className="px-6"><View style={styles.content}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.close, pressed && styles.pressed]}><MaterialIcons name="close" size={23} color="#17211F" /></Pressable>{cameraView ?? <View style={styles.hero}><View style={styles.icon}><MaterialIcons name={isHardware ? "keyboard" : "qr-code-scanner"} size={42} color="#FFFFFF" /></View><Text style={styles.title}>{isHardware ? "Lector físico" : "Escanear producto"}</Text><Text style={styles.caption}>{isHardware ? "Conecta el lector USB, Bluetooth o integrado. Debe enviar el código como teclado y terminar con Enter." : "La cámara se activa dentro de esta pantalla. También puedes usar un lector físico o ingresar el código."}</Text></View>}<View style={styles.manual}><View style={styles.modeRow}>{(["CAMERA", "HARDWARE"] as CaptureMode[]).map((entry) => <Pressable key={entry} onPress={() => setMode(entry)} style={({ pressed }) => [styles.modeButton, captureMode === entry && styles.modeButtonActive, pressed && styles.pressed]}><MaterialIcons name={entry === "CAMERA" ? "photo-camera" : "keyboard"} size={17} color={captureMode === entry ? "#17211F" : "#CDEADD"} /><Text style={[styles.modeButtonText, captureMode === entry && styles.modeButtonTextActive]}>{entry === "CAMERA" ? "Cámara" : "Lector físico"}</Text></Pressable>)}</View>{captureMode === "CAMERA" && !cameraActive ? <Pressable onPress={() => void activateCamera()} style={({ pressed }) => [styles.activateCamera, pressed && styles.pressed]}><MaterialIcons name="photo-camera" size={18} color="#17211F" /><Text style={styles.activateCameraText}>{permission?.granted ? "Activar cámara" : "Permitir y activar cámara"}</Text></Pressable> : null}<Text style={styles.label}>{isHardware ? "Esperando lector" : "Código del producto"}</Text><TextInput value={code} onChangeText={setCode} placeholder={isHardware ? "Escanea aquí con el lector" : "Ej. SKU-ABC-001 o EAN-13"} placeholderTextColor="#9BB0A9" autoCapitalize="characters" autoCorrect={false} autoFocus={isHardware} returnKeyType="search" onSubmitEditing={() => finishScan(code)} style={styles.input} /><Pressable onPress={() => finishScan(code)} style={({ pressed }) => [styles.manualButton, !code.trim() && styles.disabled, pressed && code.trim() && styles.pressed]} disabled={!code.trim()}><Text style={styles.manualButtonText}>{isHardware ? "Procesar código del lector" : "Buscar código"}</Text></Pressable><Pressable onPress={() => setShowGuide((current) => !current)} style={({ pressed }) => [styles.guideToggle, pressed && styles.pressed]}><MaterialIcons name="help-outline" size={17} color="#CDEADD" /><Text style={styles.guideToggleText}>Guía de prueba en dispositivo</Text><MaterialIcons name={showGuide ? "expand-less" : "expand-more"} size={18} color="#CDEADD" /></Pressable>{showGuide ? <View style={styles.guide}><Text style={styles.guideText}>1. Cámara: pulsa Permitir y activar cámara; acepta el permiso y enfoca un EAN, UPC, Code 128 o código interno.</Text><Text style={styles.guideText}>2. Si el permiso fue bloqueado, toca la cámara otra vez y usa Abrir ajustes para habilitarla.</Text><Text style={styles.guideText}>3. Lector físico: conecta el equipo por USB, Bluetooth o al terminal; configura el sufijo Enter y toca el campo antes de escanear.</Text></View> : null}</View></View></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { flex: 1, paddingTop: 14 }, close: { alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 16, height: 44, justifyContent: "center", width: 44 }, hero: { alignItems: "center", flex: 1, justifyContent: "center", paddingHorizontal: 16 }, icon: { alignItems: "center", backgroundColor: "#27775F", borderRadius: 24, height: 88, justifyContent: "center", width: 88 }, title: { color: "#FFFFFF", fontSize: 25, fontWeight: "800", marginTop: 22 }, caption: { color: "#C4D7D0", fontSize: 13, lineHeight: 19, marginTop: 9, textAlign: "center" }, cameraWrap: { backgroundColor: "#0D1412", borderColor: "#36544B", borderRadius: 20, borderWidth: 1, flex: 1, marginTop: 18, overflow: "hidden" }, camera: { flex: 1 }, cameraHint: { alignItems: "center", backgroundColor: "#17211F", flexDirection: "row", justifyContent: "space-between", padding: 11 }, cameraHintText: { color: "#D8E7E1", fontSize: 11, fontWeight: "700" }, stopCamera: { alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 8, flexDirection: "row", gap: 4, paddingHorizontal: 8, paddingVertical: 6 }, stopCameraText: { color: "#17211F", fontSize: 10, fontWeight: "900" }, manual: { backgroundColor: "#21312D", borderColor: "#36544B", borderRadius: 20, borderWidth: 1, gap: 11, marginBottom: 10, marginTop: 12, padding: 16 }, modeRow: { flexDirection: "row", gap: 8 }, modeButton: { alignItems: "center", borderColor: "#4D6D62", borderRadius: 10, borderWidth: 1, flex: 1, flexDirection: "row", gap: 6, justifyContent: "center", minHeight: 39 }, modeButtonActive: { backgroundColor: "#FFFFFF", borderColor: "#FFFFFF" }, modeButtonText: { color: "#CDEADD", fontSize: 11, fontWeight: "800" }, modeButtonTextActive: { color: "#17211F" }, activateCamera: { alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 11, flexDirection: "row", gap: 7, justifyContent: "center", minHeight: 43 }, activateCameraText: { color: "#17211F", fontSize: 12, fontWeight: "900" }, label: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" }, input: { backgroundColor: "#FFFFFF", borderRadius: 12, color: "#17211F", fontSize: 13, fontWeight: "700", minHeight: 47, paddingHorizontal: 12 }, manualButton: { alignItems: "center", backgroundColor: "#FFFFFF", borderRadius: 12, minHeight: 45, justifyContent: "center" }, manualButtonText: { color: "#17211F", fontSize: 13, fontWeight: "800" }, guideToggle: { alignItems: "center", borderTopColor: "#36544B", borderTopWidth: 1, flexDirection: "row", gap: 7, marginTop: 2, paddingTop: 11 }, guideToggleText: { color: "#CDEADD", flex: 1, fontSize: 11, fontWeight: "800" }, guide: { backgroundColor: "#17211F", borderRadius: 10, gap: 5, padding: 10 }, guideText: { color: "#D8E7E1", fontSize: 10, lineHeight: 14 }, disabled: { opacity: 0.45 }, pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] } });
