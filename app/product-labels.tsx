import * as Print from "expo-print";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { Card, colors, PrimaryButton, SoftButton } from "@/components/nexo-ui";
import { ScreenContainer } from "@/components/screen-container";
import { haptic } from "@/lib/haptics";
import { useBusiness } from "@/lib/business-store";
import { useNexo } from "@/lib/pos-store";
import { createProductLabelsHtml } from "@/shared/product-labels";

export default function ProductLabelsScreen() {
  const { products } = useNexo();
  const { configuration } = useBusiness();
  const [selected, setSelected] = useState<string[]>(products.map((product) => product.id));
  const selectedProducts = useMemo(() => products.filter((product) => selected.includes(product.id)), [products, selected]);
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const print = async () => {
    if (!selectedProducts.length) return;
    if (Platform.OS === "web") { Alert.alert("Impresión desde teléfono", "Abre NexoPOS en Android o iPhone para enviar las etiquetas a la impresora del sistema."); return; }
    try { await Print.printAsync({ html: createProductLabelsHtml(selectedProducts, configuration.businessName) }); haptic.success(); }
    catch { Alert.alert("No pudimos abrir la impresión", "Verifica que el dispositivo tenga una impresora disponible e inténtalo de nuevo."); }
  };
  return <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#F6F3EE]" className="px-5"><FlatList data={products} keyExtractor={(item) => item.id} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} renderItem={({ item }) => { const active = selected.includes(item.id); return <Pressable onPress={() => toggle(item.id)} style={({ pressed }) => [styles.product, active && styles.productActive, pressed && styles.pressed]}><View style={[styles.checkbox, active && styles.checkboxActive]}>{active ? <MaterialIcons name="check" size={16} color={colors.white} /> : null}</View><View style={styles.productCopy}><Text style={styles.productName}>{item.name}</Text><Text style={styles.code}>{item.code}</Text></View><Text style={styles.price}>${item.price.toLocaleString("es-CO")}</Text></Pressable>; }} ListHeaderComponent={<><View style={styles.header}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><MaterialIcons name="arrow-back" size={21} color={colors.ink} /></Pressable><View><Text style={styles.eyebrow}>INVENTARIO</Text><Text style={styles.title}>Etiquetas de código</Text></View></View><Card style={styles.info}><MaterialIcons name="print" size={22} color={colors.green} /><Text style={styles.infoText}>Selecciona productos para imprimir etiquetas Code 39. El lector de NexoPOS reconoce este formato y devolverá el código del artículo.</Text></Card><View style={styles.actions}><SoftButton label={selected.length === products.length ? "Quitar selección" : "Seleccionar todos"} icon="select-all" onPress={() => setSelected(selected.length === products.length ? [] : products.map((product) => product.id))} /><Text style={styles.counter}>{selected.length} etiquetas seleccionadas</Text></View></>} ListFooterComponent={<View style={styles.footer}><PrimaryButton label={`Imprimir ${selected.length} etiquetas`} icon="print" disabled={!selected.length} onPress={() => void print()} /><Text style={styles.note}>Prueba una etiqueta impresa con la guía del lector antes de imprimir un lote completo.</Text></View>} /></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { gap: 10, paddingBottom: 24, paddingTop: 8 }, header: { alignItems: "center", flexDirection: "row", gap: 12, marginBottom: 4 }, back: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.line, borderRadius: 13, borderWidth: 1, height: 42, justifyContent: "center", width: 42 }, eyebrow: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.7 }, title: { color: colors.ink, fontSize: 23, fontWeight: "800", letterSpacing: -0.5, marginTop: 2 }, info: { alignItems: "center", backgroundColor: colors.mint, borderColor: "#B5E0CF", flexDirection: "row", gap: 10, padding: 13 }, infoText: { color: colors.ink, flex: 1, fontSize: 11, lineHeight: 16 }, actions: { gap: 8, marginTop: 3 }, counter: { color: colors.muted, fontSize: 10, fontWeight: "800", textAlign: "center" }, product: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.line, borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 10, minHeight: 62, padding: 11 }, productActive: { borderColor: "#79BEA9", backgroundColor: "#F2FBF7" }, checkbox: { alignItems: "center", borderColor: colors.line, borderRadius: 8, borderWidth: 1, height: 25, justifyContent: "center", width: 25 }, checkboxActive: { backgroundColor: colors.green, borderColor: colors.green }, productCopy: { flex: 1 }, productName: { color: colors.ink, fontSize: 12, fontWeight: "800" }, code: { color: colors.green, fontSize: 9, fontWeight: "900", letterSpacing: 0.4, marginTop: 3 }, price: { color: colors.ink, fontSize: 11, fontWeight: "800" }, footer: { gap: 10, marginTop: 4 }, note: { color: colors.muted, fontSize: 10, lineHeight: 14, textAlign: "center" }, pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] } });
