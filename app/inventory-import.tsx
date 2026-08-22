import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import * as XLSX from "xlsx";

import { Card, colors, formatMoney, PrimaryButton, SoftButton } from "@/components/nexo-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useBusiness } from "@/lib/business-store";
import { haptic } from "@/lib/haptics";
import { useNexo } from "@/lib/pos-store";
import { googleSheetCsvUrl, parseDelimitedText, previewInventoryRows, type InventoryImportPreview } from "@/shared/inventory-import";

async function readAsset(asset: DocumentPicker.DocumentPickerAsset) {
  const extension = asset.name.split(".").pop()?.toLocaleLowerCase();
  if (extension === "xlsx" || extension === "xls") {
    const content = asset.file ? await asset.file.arrayBuffer() : await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
    const workbook = XLSX.read(content, { type: asset.file ? "array" : "base64" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
  }
  const text = asset.file ? await asset.file.text() : await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.UTF8 });
  return parseDelimitedText(text);
}

export default function InventoryImportScreen() {
  const { upsertImportedProducts, importHistory } = useNexo();
  const { addCategory } = useBusiness();
  const [preview, setPreview] = useState<InventoryImportPreview | null>(null);
  const [sourceName, setSourceName] = useState("");
  const [sheetUrl, setSheetUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const loadRows = (rows: unknown[][], name: string) => { setPreview(previewInventoryRows(rows)); setSourceName(name); haptic.medium(); };
  const chooseFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ["text/plain", "text/csv", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"], copyToCacheDirectory: true });
      if (result.canceled) return;
      setLoading(true);
      loadRows(await readAsset(result.assets[0]), result.assets[0].name);
    } catch { Alert.alert("No pudimos leer el archivo", "Usa un TXT, CSV o Excel con las columnas Nombre y Precio."); }
    finally { setLoading(false); }
  };
  const loadSheet = async () => {
    const url = googleSheetCsvUrl(sheetUrl);
    if (!url) { Alert.alert("Enlace no válido", "Pega un enlace de Google Sheets publicado o de exportación CSV."); return; }
    try {
      setLoading(true);
      const response = await fetch(url);
      if (!response.ok) throw new Error("sheet");
      loadRows(parseDelimitedText(await response.text()), "Google Sheets");
    } catch { Alert.alert("No pudimos acceder a la hoja", "Verifica que esté publicada o compartida para acceso público y que permita exportación CSV."); }
    finally { setLoading(false); }
  };
  const applyImport = () => {
    if (!preview?.products.length) return;
    preview.products.forEach((product) => addCategory(product.category));
    const result = upsertImportedProducts(preview.products, sourceName);
    haptic.success();
    Alert.alert("Inventario actualizado", `${result.created} productos creados y ${result.updated} actualizados.`, [{ text: "Ver inventario", onPress: () => router.replace("/(tabs)/inventory") }]);
  };

  return <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#F6F3EE]" className="px-5">
    <FlatList
      data={preview?.products ?? []}
      keyExtractor={(item, index) => `${item.code}-${index}`}
      renderItem={({ item }) => <Card style={styles.product}><View style={styles.productIcon}><MaterialIcons name="inventory-2" size={18} color={colors.green} /></View><View style={styles.productCopy}><Text style={styles.productName}>{item.name}</Text><Text style={styles.productCode}>{item.code}</Text><Text style={styles.productDescription} numberOfLines={1}>{item.description}</Text><Text style={styles.productMeta}>{item.category} · {item.stock} unidades</Text></View><Text style={styles.price}>{formatMoney(item.price)}</Text></Card>}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={<><View style={styles.header}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><MaterialIcons name="arrow-back" size={21} color={colors.ink} /></Pressable><View style={styles.headerCopy}><Text style={styles.eyebrow}>INVENTARIO</Text><Text style={styles.title}>Importar productos</Text></View><Pressable onPress={() => router.push("/inventory-import-history" as never)} style={({ pressed }) => [styles.historyButton, pressed && styles.pressed]}><MaterialIcons name="history" size={20} color={colors.green} /><Text style={styles.historyText}>{importHistory.length}</Text></Pressable></View><Card style={styles.info}><MaterialIcons name="upload-file" size={22} color={colors.green} /><Text style={styles.infoText}>Usa Código, Nombre, Descripción, Categoría, Precio, Costo, Stock, Stock mínimo y Catálogo. Si omites el código se genera uno automáticamente.</Text></Card><Text style={styles.section}>Desde un archivo</Text><SoftButton label="Seleccionar TXT, CSV o Excel" icon="attach-file" onPress={() => void chooseFile()} /><Text style={styles.section}>Desde Google Sheets</Text><TextInput value={sheetUrl} onChangeText={setSheetUrl} placeholder="Pega el enlace de una hoja publicada" placeholderTextColor={colors.muted} autoCapitalize="none" autoCorrect={false} keyboardType="url" style={styles.input} /><SoftButton label="Cargar hoja publicada" icon="table-chart" onPress={() => void loadSheet()} />{loading ? <View style={styles.loading}><ActivityIndicator color={colors.green} /><Text style={styles.loadingText}>Leyendo información…</Text></View> : null}{preview ? <View style={styles.previewHeader}><View><Text style={styles.section}>Vista previa</Text><Text style={styles.previewSource}>{sourceName} · {preview.products.length} productos válidos</Text></View><View style={styles.status}><Text style={styles.statusText}>{preview.issues.filter((issue) => issue.severity === "error").length} errores</Text></View></View> : null}</>}
      ListFooterComponent={preview ? <View style={styles.footer}>{preview.issues.length ? <Card style={styles.issues}><Text style={styles.issueTitle}>Revisión del archivo</Text>{preview.issues.slice(0, 4).map((issue) => <Text key={`${issue.row}-${issue.message}`} style={[styles.issue, issue.severity === "error" && styles.issueError]}>Fila {issue.row}: {issue.message}</Text>)}{preview.issues.length > 4 ? <Text style={styles.issue}>Y {preview.issues.length - 4} avisos más.</Text> : null}</Card> : null}<PrimaryButton label={`Aplicar ${preview.products.length} productos`} icon="check-circle" onPress={applyImport} disabled={!preview.products.length} /><Text style={styles.note}>Los archivos se procesan para la vista previa antes de modificar el inventario.</Text></View> : null}
    />
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { gap: 10, paddingBottom: 18, paddingTop: 8 }, header: { alignItems: "center", flexDirection: "row", gap: 12, marginBottom: 4 }, headerCopy: { flex: 1 }, back: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.line, borderRadius: 13, borderWidth: 1, height: 42, justifyContent: "center", width: 42 }, historyButton: { alignItems: "center", backgroundColor: colors.mint, borderRadius: 13, flexDirection: "row", gap: 3, height: 42, justifyContent: "center", width: 45 }, historyText: { color: colors.green, fontSize: 11, fontWeight: "800" }, eyebrow: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.7 }, title: { color: colors.ink, fontSize: 23, fontWeight: "800", letterSpacing: -0.5, marginTop: 2 }, info: { alignItems: "center", backgroundColor: colors.mint, borderColor: "#B5E0CF", flexDirection: "row", gap: 10, padding: 13 }, infoText: { color: colors.ink, flex: 1, fontSize: 11, lineHeight: 16 }, section: { color: colors.ink, fontSize: 14, fontWeight: "800", marginTop: 5 }, input: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: 12, borderWidth: 1, color: colors.ink, fontSize: 12, minHeight: 47, paddingHorizontal: 12 }, loading: { alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "center", marginVertical: 8 }, loadingText: { color: colors.muted, fontSize: 12, fontWeight: "700" }, previewHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 5 }, previewSource: { color: colors.muted, fontSize: 11, marginTop: 3 }, status: { backgroundColor: "#FDE9E4", borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 }, statusText: { color: colors.coral, fontSize: 10, fontWeight: "800" }, product: { alignItems: "center", flexDirection: "row", gap: 10, minHeight: 70, padding: 10 }, productIcon: { alignItems: "center", backgroundColor: colors.mint, borderRadius: 10, height: 34, justifyContent: "center", width: 34 }, productCopy: { flex: 1 }, productName: { color: colors.ink, fontSize: 12, fontWeight: "800" }, productCode: { color: colors.green, fontSize: 9, fontWeight: "900", letterSpacing: 0.35, marginTop: 2 }, productDescription: { color: colors.muted, fontSize: 9, marginTop: 2 }, productMeta: { color: colors.muted, fontSize: 10, marginTop: 3 }, price: { color: colors.green, fontSize: 11, fontWeight: "800" }, footer: { gap: 11, marginTop: 5 }, issues: { backgroundColor: "#FFF7E7", borderColor: "#F0D39E", gap: 5 }, issueTitle: { color: colors.ink, fontSize: 12, fontWeight: "800" }, issue: { color: colors.gold, fontSize: 10, lineHeight: 15 }, issueError: { color: colors.coral }, note: { color: colors.muted, fontSize: 10, lineHeight: 14, textAlign: "center" }, pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
});
