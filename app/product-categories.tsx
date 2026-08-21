import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Card, colors, PrimaryButton } from "@/components/nexo-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useBusiness } from "@/lib/business-store";
import { haptic } from "@/lib/haptics";

export default function ProductCategoriesScreen() {
  const { configuration, addCategory, renameCategory, removeCategory } = useBusiness();
  const [newCategory, setNewCategory] = useState("");
  const createCategory = () => {
    if (!addCategory(newCategory)) { Alert.alert("No se pudo crear", "Usa un nombre distinto de hasta 40 caracteres."); return; }
    haptic.success();
    setNewCategory("");
  };
  const renderCategory = ({ item }: { item: string }) => <Card style={styles.categoryRow}><View style={styles.categoryIcon}><MaterialIcons name="label" size={18} color={colors.green} /></View><TextInput defaultValue={item} onEndEditing={(event) => { const nextName = event.nativeEvent.text; if (nextName !== item && !renameCategory(item, nextName)) Alert.alert("No se pudo cambiar", "El nombre está vacío, es demasiado largo o ya existe."); }} placeholderTextColor={colors.muted} returnKeyType="done" style={styles.categoryInput} /><Pressable onPress={() => Alert.alert("Eliminar categoría", `¿Eliminar “${item}”? Los productos actuales conservarán su categoría hasta que los reasignes.`, [{ text: "Cancelar", style: "cancel" }, { text: "Eliminar", style: "destructive", onPress: () => { if (!removeCategory(item)) Alert.alert("Conserva una categoría", "El negocio debe tener al menos una categoría activa."); else haptic.medium(); } }])} style={({ pressed }) => [styles.remove, pressed && styles.pressed]}><MaterialIcons name="delete-outline" size={20} color={colors.coral} /></Pressable></Card>;
  return <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#F6F3EE]" className="px-5"><FlatList data={configuration.categories} renderItem={renderCategory} keyExtractor={(item) => item} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} ListHeaderComponent={<><View style={styles.header}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><MaterialIcons name="arrow-back" size={21} color={colors.ink} /></Pressable><View><Text style={styles.eyebrow}>CATÁLOGO E INVENTARIO</Text><Text style={styles.title}>Categorías</Text></View></View><Card style={styles.info}><MaterialIcons name="category" size={22} color={colors.green} /><Text style={styles.infoText}>Crea y edita las categorías que usa tu negocio. Después podrás asignarlas desde Inventario.</Text></Card><Text style={styles.newLabel}>Nueva categoría</Text><View style={styles.newRow}><TextInput value={newCategory} onChangeText={setNewCategory} onSubmitEditing={createCategory} placeholder="Ej. Productos orgánicos" placeholderTextColor={colors.muted} returnKeyType="done" style={styles.newInput} /><Pressable onPress={createCategory} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}><MaterialIcons name="add" size={22} color={colors.white} /></Pressable></View><Text style={styles.listLabel}>Categorías activas</Text></>} ListFooterComponent={<View style={styles.footer}><PrimaryButton label="Listo" icon="check-circle" onPress={() => router.back()} /></View>} /></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { gap: 10, paddingBottom: 18, paddingTop: 8 },
  header: { alignItems: "center", flexDirection: "row", gap: 12, marginBottom: 4 },
  back: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.line, borderRadius: 13, borderWidth: 1, height: 42, justifyContent: "center", width: 42 },
  eyebrow: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.7 },
  title: { color: colors.ink, fontSize: 23, fontWeight: "800", letterSpacing: -0.5, marginTop: 2 },
  info: { alignItems: "center", backgroundColor: colors.mint, borderColor: "#B5E0CF", flexDirection: "row", gap: 10, padding: 13 },
  infoText: { color: colors.ink, flex: 1, fontSize: 11, lineHeight: 16 },
  newLabel: { color: colors.ink, fontSize: 12, fontWeight: "800", marginTop: 3 },
  newRow: { flexDirection: "row", gap: 8 },
  newInput: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: 12, borderWidth: 1, color: colors.ink, flex: 1, fontSize: 13, fontWeight: "700", minHeight: 47, paddingHorizontal: 12 },
  addButton: { alignItems: "center", backgroundColor: colors.green, borderRadius: 12, height: 47, justifyContent: "center", width: 48 },
  listLabel: { color: colors.ink, fontSize: 15, fontWeight: "800", marginTop: 4 },
  categoryRow: { alignItems: "center", flexDirection: "row", gap: 10, minHeight: 57, padding: 10 },
  categoryIcon: { alignItems: "center", backgroundColor: colors.mint, borderRadius: 9, height: 32, justifyContent: "center", width: 32 },
  categoryInput: { color: colors.ink, flex: 1, fontSize: 13, fontWeight: "800", paddingVertical: 7 },
  remove: { alignItems: "center", height: 35, justifyContent: "center", width: 35 },
  footer: { marginTop: 4 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
});
