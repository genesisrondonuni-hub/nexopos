import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";

import { Card, colors, PrimaryButton, SoftButton } from "@/components/nexo-ui";
import { ScreenContainer } from "@/components/screen-container";
import { haptic } from "@/lib/haptics";
import { useNexo } from "@/lib/pos-store";
import { previewProductImageImport, type ProductImageImportPreview } from "@/shared/product-image-import";

export default function ProductImageImportScreen() {
  const { products, applyProductImages } = useNexo();
  const [preview, setPreview] = useState<ProductImageImportPreview[]>([]);
  const chooseImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, selectionLimit: 100, quality: 0.7 });
    if (!result.canceled) setPreview(previewProductImageImport(products, result.assets.map((asset) => ({ uri: asset.uri, fileName: asset.fileName }))));
  };
  const matched = preview.filter((item) => item.matchedProductId);
  const apply = () => {
    const result = applyProductImages(matched.map((item) => ({ productId: item.matchedProductId!, imageUri: item.uri })));
    haptic.success();
    Alert.alert("Imágenes actualizadas", `${result.updated} productos quedaron vinculados a su imagen.`, [{ text: "Listo", onPress: () => router.back() }]);
  };
  const renderItem = ({ item }: { item: ProductImageImportPreview }) => <Card style={styles.row}><Image source={{ uri: item.uri }} style={styles.thumbnail} /><View style={styles.copy}><Text style={styles.code}>{item.code || "SIN CÓDIGO"}</Text><Text style={styles.name}>{item.productName ?? "No hay producto con este código"}</Text></View><View style={[styles.status, item.matchedProductId ? styles.statusOk : styles.statusWarning]}><MaterialIcons name={item.matchedProductId ? "check" : "priority-high"} size={17} color={item.matchedProductId ? colors.green : colors.coral} /></View></Card>;
  return <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#F6F3EE]" className="px-5"><FlatList data={preview} renderItem={renderItem} keyExtractor={(item) => `${item.uri}-${item.code}`} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} ListHeaderComponent={<><View style={styles.header}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><MaterialIcons name="arrow-back" size={21} color={colors.ink} /></Pressable><View><Text style={styles.eyebrow}>INVENTARIO</Text><Text style={styles.title}>Importar imágenes</Text></View></View><Card style={styles.info}><MaterialIcons name="collections" size={23} color={colors.green} /><View style={styles.infoCopy}><Text style={styles.infoTitle}>Vinculación por código</Text><Text style={styles.infoText}>Selecciona varias fotos cuyo nombre sea el código del producto. Ejemplo: SKU-ARROZ-001.jpg.</Text></View></Card><SoftButton label="Seleccionar imágenes" icon="photo-library" onPress={() => void chooseImages()} />{preview.length ? <View style={styles.previewHeader}><Text style={styles.section}>Vista previa</Text><Text style={styles.count}>{matched.length} de {preview.length} vinculadas</Text></View> : <View style={styles.empty}><MaterialIcons name="photo-size-select-large" size={32} color={colors.muted} /><Text style={styles.emptyText}>Aún no has seleccionado imágenes.</Text></View>}</>} ListFooterComponent={preview.length ? <View style={styles.footer}><Text style={styles.note}>Las imágenes sin coincidencia se omiten. Renombra el archivo con un código existente para vincularlo.</Text><PrimaryButton label={`Aplicar ${matched.length} imágenes`} icon="check" onPress={apply} disabled={!matched.length} /></View> : null} /></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { gap: 10, paddingBottom: 26, paddingTop: 8 }, header: { alignItems: "center", flexDirection: "row", gap: 12, marginBottom: 4 }, back: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.line, borderRadius: 13, borderWidth: 1, height: 42, justifyContent: "center", width: 42 }, eyebrow: { color: colors.muted, fontSize: 9, fontWeight: "900", letterSpacing: 0.6 }, title: { color: colors.ink, fontSize: 22, fontWeight: "800", marginTop: 2 }, info: { alignItems: "center", flexDirection: "row", gap: 11, padding: 13 }, infoCopy: { flex: 1 }, infoTitle: { color: colors.ink, fontSize: 12, fontWeight: "800" }, infoText: { color: colors.muted, fontSize: 10, lineHeight: 14, marginTop: 3 }, previewHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 6 }, section: { color: colors.ink, fontSize: 16, fontWeight: "800" }, count: { color: colors.green, fontSize: 11, fontWeight: "800" }, row: { alignItems: "center", flexDirection: "row", gap: 11, padding: 10 }, thumbnail: { backgroundColor: colors.mint, borderRadius: 10, height: 45, width: 45 }, copy: { flex: 1 }, code: { color: colors.green, fontSize: 9, fontWeight: "900", letterSpacing: 0.4 }, name: { color: colors.ink, fontSize: 12, fontWeight: "800", marginTop: 3 }, status: { alignItems: "center", borderRadius: 12, height: 34, justifyContent: "center", width: 34 }, statusOk: { backgroundColor: colors.mint }, statusWarning: { backgroundColor: "#FDE9E4" }, empty: { alignItems: "center", gap: 9, paddingVertical: 35 }, emptyText: { color: colors.muted, fontSize: 12, fontWeight: "700" }, footer: { gap: 11, marginTop: 5 }, note: { color: colors.muted, fontSize: 10, lineHeight: 14, textAlign: "center" }, pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] } });
