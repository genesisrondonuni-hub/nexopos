import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Card, colors, formatCOP, SoftButton } from "@/components/nexo-ui";
import { ScreenContainer } from "@/components/screen-container";
import { haptic } from "@/lib/haptics";
import { useNexo } from "@/lib/pos-store";
import type { Product } from "@/shared/pos-types";

export default function InventoryScreen() {
  const { products, toggleCatalog } = useNexo();
  const alerts = products.filter((product) => product.stock <= product.minStock).length;
  const renderProduct = ({ item }: { item: Product }) => {
    const atMinimum = item.stock <= item.minStock;
    return <Card style={styles.productCard}>
      <View style={[styles.productIcon, { backgroundColor: atMinimum ? "#FDE9E4" : colors.mint }]}><MaterialIcons name={item.type === "SERVICE" ? "room-service" : "inventory-2"} size={20} color={atMinimum ? colors.coral : colors.green} /></View>
      <View style={styles.productBody}><Text style={styles.productName}>{item.name}</Text><Text style={styles.productMeta}>{item.category} · {formatCOP(item.price)}</Text><Text style={[styles.stock, atMinimum && styles.lowStock]}>{atMinimum ? "Stock mínimo" : `${item.stock} unidades disponibles`}</Text></View>
      <Pressable onPress={() => { haptic.medium(); toggleCatalog(item.id); }} style={({ pressed }) => [styles.catalogToggle, item.showInCatalog && styles.catalogToggleOn, pressed && styles.pressed]}><MaterialIcons name={item.showInCatalog ? "visibility" : "visibility-off"} size={17} color={item.showInCatalog ? colors.white : colors.muted} /></Pressable>
    </Card>;
  };
  return <ScreenContainer containerClassName="bg-[#F6F3EE]" className="px-5"><FlatList data={products} renderItem={renderProduct} keyExtractor={(item) => item.id} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} ListHeaderComponent={<><View style={styles.header}><View><Text style={styles.eyebrow}>CATÁLOGO Y EXISTENCIAS</Text><Text style={styles.title}>Inventario</Text></View><Pressable onPress={() => undefined} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}><MaterialIcons name="add" size={22} color={colors.white} /></Pressable></View><View style={styles.notice}><MaterialIcons name={alerts ? "warning-amber" : "verified"} size={19} color={alerts ? colors.gold : colors.green} /><Text style={styles.noticeText}>{alerts ? `${alerts} productos están en stock mínimo` : "Todos los productos están por encima del mínimo"}</Text></View><View style={styles.filters}><SoftButton label="Todos" icon="filter-list" onPress={() => undefined} /><SoftButton label="Bajo stock" icon="warning-amber" onPress={() => undefined} /></View><Text style={styles.listHeading}>Productos activos</Text></>} /></ScreenContainer>;
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
  productIcon: { alignItems: "center", borderRadius: 12, height: 42, justifyContent: "center", width: 42 },
  productBody: { flex: 1 },
  productName: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  productMeta: { color: colors.muted, fontSize: 11, marginTop: 2 },
  stock: { color: colors.green, fontSize: 11, fontWeight: "800", marginTop: 4 },
  lowStock: { color: colors.coral },
  catalogToggle: { alignItems: "center", backgroundColor: "#E8ECEA", borderRadius: 12, height: 36, justifyContent: "center", width: 36 },
  catalogToggleOn: { backgroundColor: colors.green },
  pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
});
