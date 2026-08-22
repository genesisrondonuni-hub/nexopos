import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import * as XLSX from "xlsx";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { Card, colors, PrimaryButton, SoftButton } from "@/components/nexo-ui";
import { ScreenContainer } from "@/components/screen-container";
import { haptic } from "@/lib/haptics";
import { useNexo } from "@/lib/pos-store";
import { previewProductCodeImport, type ProductCodeImportPreview } from "@/shared/product-code-import";

async function readExcel(asset: DocumentPicker.DocumentPickerAsset) {
  const content = asset.file ? await asset.file.arrayBuffer() : await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
  const workbook = XLSX.read(content, { type: asset.file ? "array" : "base64" });
  return XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[workbook.SheetNames[0]], { header: 1, defval: "" });
}

export default function ProductCodeImportScreen() {
  const { products, applyImportedProductCodes } = useNexo();
  const [preview, setPreview] = useState<ProductCodeImportPreview | null>(null);
  const [sourceName, setSourceName] = useState("");
  const [loading, setLoading] = useState(false);
  const chooseFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"], copyToCacheDirectory: true });
      if (result.canceled) return;
      setLoading(true);
      setPreview(previewProductCodeImport(await readExcel(result.assets[0]), products));
      setSourceName(result.assets[0].name);
      haptic.medium();
    } catch { Alert.alert("No pudimos leer el Excel", "Usa un archivo XLSX o XLS con Código actual (o Nombre) y Nuevo código, EAN o UPC."); }
    finally { setLoading(false); }
  };
  const apply = () => {
    if (!preview?.matches.length) return;
    const result = applyImportedProductCodes(preview.matches.map((match) => ({ productId: match.productId, code: match.code })));
    if (result.reason) { Alert.alert("No se pudieron actualizar los códigos", result.reason); return; }
    haptic.success();
    Alert.alert("Códigos actualizados", `${result.updated} productos recibieron su nuevo código desde ${sourceName}.`, [{ text: "Ver inventario", onPress: () => router.replace("/(tabs)/inventory") }]);
  };
  return <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#F6F3EE]" className="px-5"><FlatList data={preview?.matches ?? []} keyExtractor={(item) => item.productId} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} renderItem={({ item }) => <Card style={styles.match}><View style={styles.matchIcon}><MaterialIcons name="qr-code-2" size={18} color={colors.green} /></View><View style={styles.matchCopy}><Text style={styles.productName}>{item.productName}</Text><Text style={styles.previous}>{item.previousCode}</Text></View><MaterialIcons name="arrow-forward" size={16} color={colors.muted} /><Text style={styles.code}>{item.code}</Text></Card>} ListHeaderComponent={<><View style={styles.header}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><MaterialIcons name="arrow-back" size={21} color={colors.ink} /></Pressable><View><Text style={styles.eyebrow}>INVENTARIO</Text><Text style={styles.title}>Importar códigos</Text></View></View><Card style={styles.info}><MaterialIcons name="table-chart" size={22} color={colors.green} /><Text style={styles.infoText}>Carga un Excel para asignar EAN, UPC u otros códigos únicos sin modificar precio, stock ni categorías.</Text></Card><Card style={styles.example}><Text style={styles.exampleTitle}>Columnas requeridas</Text><Text style={styles.exampleText}>Código actual o Nombre · Nuevo código, EAN o UPC</Text><Text style={styles.exampleText}>Ejemplo: SKU-AREPA-001 · 5901234123457</Text></Card><SoftButton label="Seleccionar archivo Excel" icon="upload-file" onPress={() => void chooseFile()} />{loading ? <View style={styles.loading}><ActivityIndicator color={colors.green} /><Text style={styles.loadingText}>Leyendo códigos…</Text></View> : null}{preview ? <View style={styles.previewHead}><View><Text style={styles.section}>Vista previa</Text><Text style={styles.source}>{sourceName} · {preview.matches.length} coincidencias</Text></View><View style={styles.issuePill}><Text style={styles.issuePillText}>{preview.issues.filter((issue) => issue.severity === "error").length} errores</Text></View></View> : null}</>} ListFooterComponent={preview ? <View style={styles.footer}>{preview.issues.length ? <Card style={styles.issues}><Text style={styles.issueTitle}>Revisa el archivo</Text>{preview.issues.slice(0, 5).map((issue) => <Text key={`${issue.row}-${issue.message}`} style={styles.issue}>Fila {issue.row}: {issue.message}</Text>)}</Card> : null}<PrimaryButton label={`Aplicar ${preview.matches.length} códigos`} icon="check-circle" disabled={!preview.matches.length || preview.issues.some((issue) => issue.severity === "error")} onPress={apply} /><Text style={styles.note}>Los códigos se validan y deben permanecer únicos antes de actualizar el inventario.</Text></View> : null} /></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { gap: 10, paddingBottom: 24, paddingTop: 8 }, header: { alignItems: "center", flexDirection: "row", gap: 12, marginBottom: 4 }, back: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.line, borderRadius: 13, borderWidth: 1, height: 42, justifyContent: "center", width: 42 }, eyebrow: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.7 }, title: { color: colors.ink, fontSize: 23, fontWeight: "800", letterSpacing: -0.5, marginTop: 2 }, info: { alignItems: "center", backgroundColor: colors.mint, borderColor: "#B5E0CF", flexDirection: "row", gap: 10, padding: 13 }, infoText: { color: colors.ink, flex: 1, fontSize: 11, lineHeight: 16 }, example: { backgroundColor: "#FFF7E7", borderColor: "#F0D39E", gap: 5, padding: 13 }, exampleTitle: { color: colors.ink, fontSize: 12, fontWeight: "800" }, exampleText: { color: colors.gold, fontSize: 10, lineHeight: 14 }, loading: { alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "center", marginVertical: 8 }, loadingText: { color: colors.muted, fontSize: 12, fontWeight: "700" }, previewHead: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 5 }, section: { color: colors.ink, fontSize: 14, fontWeight: "800" }, source: { color: colors.muted, fontSize: 11, marginTop: 3 }, issuePill: { backgroundColor: "#FDE9E4", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 }, issuePillText: { color: colors.coral, fontSize: 10, fontWeight: "800" }, match: { alignItems: "center", flexDirection: "row", gap: 9, minHeight: 64, padding: 10 }, matchIcon: { alignItems: "center", backgroundColor: colors.mint, borderRadius: 10, height: 34, justifyContent: "center", width: 34 }, matchCopy: { flex: 1 }, productName: { color: colors.ink, fontSize: 12, fontWeight: "800" }, previous: { color: colors.muted, fontSize: 9, marginTop: 3 }, code: { color: colors.green, fontSize: 10, fontWeight: "900", maxWidth: 106 }, footer: { gap: 11, marginTop: 3 }, issues: { backgroundColor: "#FDE9E4", borderColor: "#F5C8BD", gap: 5 }, issueTitle: { color: colors.ink, fontSize: 12, fontWeight: "800" }, issue: { color: colors.coral, fontSize: 10, lineHeight: 14 }, note: { color: colors.muted, fontSize: 10, lineHeight: 14, textAlign: "center" }, pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] } });
