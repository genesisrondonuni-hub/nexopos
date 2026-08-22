import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";

import { Card, colors, formatCOP, SoftButton } from "@/components/nexo-ui";
import { BusinessModeBanner } from "@/components/business-mode-banner";
import { ScreenContainer } from "@/components/screen-container";
import { haptic } from "@/lib/haptics";
import { useNexo } from "@/lib/pos-store";
import { useBusiness } from "@/lib/business-store";
import type { Product } from "@/shared/pos-types";

export default function InventoryScreen() {
  const { products, toggleCatalog, updateProductCategory } = useNexo();
  const { profile, configuration } = useBusiness();
  const alerts = products.filter((product) => product.stock <= product.minStock).length;
  const renderProduct = ({ item }: { item: Product }) => {
    const atMinimum = item.stock <= item.minStock;
    return <Card style={styles.productCard}>
      <Pressable onPress={() => router.push({ pathname: "/product-editor", params: { productId: item.id } } as never)} style={({ pressed }) => [styles.productIcon, { backgroundColor: atMinimum ? "#FDE9E4" : colors.mint }, pressed && styles.pressed]}>{item.imageUri ? <Image source={{ uri: item.imageUri }} style={styles.productPhoto} /> : <MaterialIcons name={item.type === "SERVICE" ? "room-service" : "inventory-2"} size={20} color={atMinimum ? colors.coral : colors.green} />}</Pressable>
      <View style={styles.productBody}><Text style={styles.productName}>{item.name}</Text><Text style={styles.productCode}>{item.code}</Text><Pressable onPress={() => Alert.alert("Asignar categoría", item.name, [...configuration.categories.map((category) => ({ text: category, onPress: () => { haptic.medium(); updateProductCategory(item.id, category); } })), { text: "Cancelar", style: "cancel" }])} style={({ pressed }) => [styles.categoryButton, pressed && styles.pressed]}><Text style={styles.productMeta}>{item.category}</Text><MaterialIcons name="edit" size={12} color={colors.green} /></Pressable><Text style={[styles.stock, atMinimum && styles.lowStock]}>{atMinimum ? "Stock mínimo" : `${item.stock} unidades disponibles · ${formatCOP(item.price)}`}</Text></View>
      <Pressable accessibilityLabel={`Editar ${item.name}`} onPress={() => router.push({ pathname: "/product-editor", params: { productId: item.id } } as never)} style={({ pressed }) => [styles.editProduct, pressed && styles.pressed]}><MaterialIcons name="edit" size={16} color={colors.green} /></Pressable>
      <Pressable onPress={() => { haptic.medium(); toggleCatalog(item.id); }} style={({ pressed }) => [styles.catalogToggle, item.showInCatalog && styles.catalogToggleOn, pressed && styles.pressed]}><MaterialIcons name={item.showInCatalog ? "visibility" : "visibility-off"} size={17} color={item.showInCatalog ? colors.white : colors.muted} /></Pressable>
    </Card>;
  };
  return <ScreenContainer containerClassName="bg-[#F6F3EE]" className="px-5"><FlatList data={products} renderItem={renderProduct} keyExtractor={(item) => item.id} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} ListHeaderComponent={<><View style={styles.header}><View><Text style={styles.eyebrow}>{profile.shortLabel.toUpperCase()} · EXISTENCIAS</Text><Text style={styles.title}>Inventario</Text></View><Pressable onPress={() => router.push("/product-editor" as never)} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}><MaterialIcons name="add" size={22} color={colors.white} /></Pressable></View><BusinessModeBanner area="INVENTARIO" /><View style={styles.notice}><MaterialIcons name={alerts ? "warning-amber" : configuration.features.weightedProducts ? "scale" : "verified"} size={19} color={alerts ? colors.gold : colors.green} /><Text style={styles.noticeText}>{alerts ? `${alerts} productos están en stock mínimo` : configuration.features.weightedProducts ? "El perfil permite productos por peso y existencias por presentación" : "Todos los productos están por encima del mínimo"}</Text></View><View style={styles.filters}><SoftButton label="Todos" icon="filter-list" onPress={() => undefined} /><SoftButton label="Bajo stock" icon="warning-amber" onPress={() => undefined} /></View><Text style={styles.listHeading}>{configuration.features.barcode ? "Productos con control de código" : "Productos activos"}</Text></>} /></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { gap: 11, paddingBottom: 110, paddingTop: 14 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 13 },
  eyebrow: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 0.7 },
  title: { color: colors.ink, fontSize: 28, fontWeight: "800", letterSpacing: -0.7, marginTop: 3 },
  addButton: { alignItems: "center", backgroundColor: colors.green, borderRadius: 14, height: 44, justifyContent: "center", width: 44 },
  notice: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.line, borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 9, padding: 13 },
  noticeText: { color: colors.ink, flex: 1, fontSize: 12, fontWeight: "700" },
  filters: { flexDirection: "row", gap: 9 },
  listHeading: { color: colors.ink, fontSize: 17, fontWeight: "800", marginTop: 4 },
  productCard: { alignItems: "center", flexDirection: "row", gap: 11, minHeight: 78, padding: 12 },
  productIcon: { alignItems: "center", borderRadius: 12, height: 42, justifyContent: "center", overflow: "hidden", width: 42 },
  productPhoto: { height: "100%", width: "100%" },
  productBody: { flex: 1 },
  productName: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  productCode: { color: colors.green, fontSize: 9, fontWeight: "900", letterSpacing: 0.4, marginTop: 2 },
  productMeta: { color: colors.muted, fontSize: 11, marginTop: 2 },
  categoryButton: { alignItems: "center", flexDirection: "row", gap: 4, marginTop: 2, maxWidth: 170 },
  stock: { color: colors.green, fontSize: 11, fontWeight: "800", marginTop: 4 },
  lowStock: { color: colors.coral },
  editProduct: { alignItems: "center", backgroundColor: colors.mint, borderRadius: 12, height: 36, justifyContent: "center", width: 36 },
  catalogToggle: { alignItems: "center", backgroundColor: "#E8ECEA", borderRadius: 12, height: 36, justifyContent: "center", width: 36 },
  catalogToggleOn: { backgroundColor: colors.green },
  pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
});
