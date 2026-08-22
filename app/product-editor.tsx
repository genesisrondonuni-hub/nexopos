import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Card, colors, PrimaryButton } from "@/components/nexo-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useBusiness } from "@/lib/business-store";
import { haptic } from "@/lib/haptics";
import { useNexo } from "@/lib/pos-store";
import { createProductCode, normalizeProductCode } from "@/shared/product-code";

const toNumber = (value: string) => Number(value.replace(/[^0-9.,-]/g, "").replace(",", ".")) || 0;

export default function ProductEditorScreen() {
  const { products, createProduct } = useNexo();
  const { configuration, profile } = useBusiness();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(configuration.categories[0] ?? "General");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [stock, setStock] = useState("0");
  const [minStock, setMinStock] = useState("0");
  const suggestedCode = useMemo(() => createProductCode(name || profile.shortLabel, products.length), [name, profile.shortLabel, products.length]);
  const applySuggestion = () => setCode(suggestedCode);
  const save = () => {
    const result = createProduct({ code: normalizeProductCode(code || suggestedCode), name, description, category, price: toNumber(price), cost: toNumber(cost), stock: toNumber(stock), minStock: toNumber(minStock), showInCatalog: true, type: configuration.features.recipes ? "RECIPE" : "FINAL" });
    if (!result.created) { Alert.alert("No se pudo guardar", result.reason); return; }
    haptic.success();
    router.back();
  };
  const chooseCategory = () => Alert.alert("Categoría", "Selecciona la categoría del producto.", [...configuration.categories.map((item) => ({ text: item, onPress: () => setCategory(item) })), { text: "Cancelar", style: "cancel" }]);
  return <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#F6F3EE]" className="px-5"><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><View style={styles.header}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><MaterialIcons name="arrow-back" size={21} color={colors.ink} /></Pressable><View><Text style={styles.eyebrow}>{profile.shortLabel.toUpperCase()} · INVENTARIO</Text><Text style={styles.title}>Nuevo producto</Text></View></View><Card style={styles.codeCard}><View style={styles.codeIcon}><MaterialIcons name="qr-code-2" size={22} color={colors.green} /></View><View style={styles.codeCopy}><Text style={styles.codeTitle}>Código de producto</Text><Text style={styles.codeText}>Úsalo para identificar, buscar o escanear este artículo.</Text></View></Card><Text style={styles.label}>Código</Text><View style={styles.codeInputRow}><TextInput value={code} onChangeText={(value) => setCode(normalizeProductCode(value))} placeholder={suggestedCode} placeholderTextColor={colors.muted} autoCapitalize="characters" autoCorrect={false} style={[styles.input, styles.codeInput]} /><Pressable onPress={applySuggestion} style={({ pressed }) => [styles.suggest, pressed && styles.pressed]}><MaterialIcons name="auto-fix-high" size={18} color={colors.green} /></Pressable></View><Text style={styles.help}>El código se normaliza en mayúsculas y no puede repetirse.</Text><Text style={styles.label}>Nombre</Text><TextInput value={name} onChangeText={setName} placeholder={configuration.features.recipes ? "Ej. Hamburguesa especial" : "Ej. Arroz premium 1 kg"} placeholderTextColor={colors.muted} style={styles.input} /><Text style={styles.label}>Descripción</Text><TextInput value={description} onChangeText={setDescription} placeholder="Describe la presentación, contenido o preparación" placeholderTextColor={colors.muted} multiline style={[styles.input, styles.description]} /><Text style={styles.label}>Categoría</Text><Pressable onPress={chooseCategory} style={({ pressed }) => [styles.selector, pressed && styles.pressed]}><Text style={styles.selectorText}>{category}</Text><MaterialIcons name="expand-more" size={20} color={colors.green} /></Pressable><View style={styles.twoCols}><View style={styles.field}><Text style={styles.label}>Precio</Text><TextInput value={price} onChangeText={setPrice} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={colors.muted} style={styles.input} /></View><View style={styles.field}><Text style={styles.label}>Costo</Text><TextInput value={cost} onChangeText={setCost} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={colors.muted} style={styles.input} /></View></View><View style={styles.twoCols}><View style={styles.field}><Text style={styles.label}>Stock inicial</Text><TextInput value={stock} onChangeText={setStock} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={colors.muted} style={styles.input} /></View><View style={styles.field}><Text style={styles.label}>Stock mínimo</Text><TextInput value={minStock} onChangeText={setMinStock} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={colors.muted} style={styles.input} /></View></View><PrimaryButton label="Guardar producto" icon="check" onPress={save} /></ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { gap: 9, paddingBottom: 26, paddingTop: 8 }, header: { alignItems: "center", flexDirection: "row", gap: 12, marginBottom: 4 }, back: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.line, borderRadius: 13, borderWidth: 1, height: 42, justifyContent: "center", width: 42 }, eyebrow: { color: colors.muted, fontSize: 9, fontWeight: "900", letterSpacing: 0.6 }, title: { color: colors.ink, fontSize: 22, fontWeight: "800", marginTop: 2 }, codeCard: { alignItems: "center", backgroundColor: colors.mint, borderColor: "#B5E0CF", flexDirection: "row", gap: 10, padding: 13 }, codeIcon: { alignItems: "center", backgroundColor: colors.white, borderRadius: 11, height: 38, justifyContent: "center", width: 38 }, codeCopy: { flex: 1 }, codeTitle: { color: colors.ink, fontSize: 12, fontWeight: "800" }, codeText: { color: colors.muted, fontSize: 10, lineHeight: 14, marginTop: 2 }, label: { color: colors.ink, fontSize: 11, fontWeight: "800", marginTop: 3 }, input: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: 12, borderWidth: 1, color: colors.ink, fontSize: 12, minHeight: 46, paddingHorizontal: 12 }, codeInputRow: { flexDirection: "row", gap: 8 }, codeInput: { flex: 1 }, suggest: { alignItems: "center", backgroundColor: colors.mint, borderRadius: 12, justifyContent: "center", width: 46 }, help: { color: colors.muted, fontSize: 9, lineHeight: 13, marginTop: -4 }, description: { minHeight: 80, paddingTop: 11, textAlignVertical: "top" }, selector: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.line, borderRadius: 12, borderWidth: 1, flexDirection: "row", justifyContent: "space-between", minHeight: 46, paddingHorizontal: 12 }, selectorText: { color: colors.ink, fontSize: 12, fontWeight: "700" }, twoCols: { flexDirection: "row", gap: 10 }, field: { flex: 1 }, pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] } });
