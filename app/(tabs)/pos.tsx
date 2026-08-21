import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Card, colors, formatCOP, PrimaryButton, SoftButton } from "@/components/nexo-ui";
import { ScreenContainer } from "@/components/screen-container";
import { haptic } from "@/lib/haptics";
import { useNexo } from "@/lib/pos-store";
import type { Product } from "@/shared/pos-types";

const categories = ["Todos", "Entradas", "Platos", "Bebidas", "Postres"];

export default function PosScreen() {
  const { products, cart, addToCart, addFreeSale } = useNexo();
  const total = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const renderProduct = ({ item }: { item: Product }) => (
    <Pressable onPress={() => { haptic.light(); addToCart(item); }} style={({ pressed }) => [styles.product, pressed && styles.productPressed]}>
      <View style={[styles.productImage, { backgroundColor: item.category === "Bebidas" ? "#DFEFFF" : item.category === "Postres" ? "#FDE9E4" : colors.mint }]}><MaterialIcons name={item.category === "Bebidas" ? "local-drink" : item.category === "Postres" ? "cake" : "restaurant"} size={24} color={item.category === "Postres" ? colors.coral : colors.green} /></View>
      <Text numberOfLines={2} style={styles.productName}>{item.name}</Text>
      <View style={styles.productFooter}><Text style={styles.productPrice}>{formatCOP(item.price)}</Text><Text style={[styles.stock, item.stock <= item.minStock && styles.lowStock]}>{item.stock} disp.</Text></View>
    </Pressable>
  );

  return (
    <ScreenContainer containerClassName="bg-[#F6F3EE]" className="px-5">
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <View style={styles.header}><View><Text style={styles.eyebrow}>PUNTO DE VENTA</Text><Text style={styles.title}>Nueva venta</Text></View><Pressable onPress={() => { haptic.medium(); addFreeSale(); }} style={({ pressed }) => [styles.iconButton, pressed && styles.productPressed]}><MaterialIcons name="add" size={22} color={colors.green} /></Pressable></View>
            <Pressable onPress={() => undefined} style={({ pressed }) => [styles.search, pressed && styles.productPressed]}><MaterialIcons name="search" size={21} color={colors.muted} /><Text style={styles.searchText}>Buscar producto o código</Text><MaterialIcons name="qr-code-scanner" size={20} color={colors.green} /></Pressable>
            <View style={styles.categoryRow}><View style={styles.categoryActive}><Text style={styles.categoryActiveText}>{categories[0]}</Text></View><View style={styles.category}><Text style={styles.categoryText}>{categories[1]}</Text></View><View style={styles.category}><Text style={styles.categoryText}>{categories[2]}</Text></View><View style={styles.category}><Text style={styles.categoryText}>{categories[3]}</Text></View></View>
            <Card style={styles.cartPreview}>
              <View style={styles.cartTop}><View style={styles.cartCount}><MaterialIcons name="shopping-bag" size={17} color={colors.green} /><Text style={styles.cartCountText}>{cart.length ? `${cart.length} productos en la cuenta` : "La cuenta está vacía"}</Text></View><Text style={styles.cartTotal}>{formatCOP(total)}</Text></View>
              {cart.length ? <PrimaryButton label="Revisar y cobrar" icon="arrow-forward" onPress={() => router.push("/checkout")} /> : <SoftButton label="Agregar venta libre" icon="add-circle-outline" onPress={() => { haptic.medium(); addFreeSale(); }} />}
            </Card>
            <Text style={styles.listHeading}>Productos</Text>
          </>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: 12, paddingBottom: 110, paddingTop: 14 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  eyebrow: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 0.7 },
  title: { color: colors.ink, fontSize: 28, fontWeight: "800", letterSpacing: -0.7, marginTop: 3 },
  iconButton: { alignItems: "center", backgroundColor: colors.mint, borderRadius: 14, height: 44, justifyContent: "center", width: 44 },
  search: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.line, borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 10, minHeight: 48, paddingHorizontal: 14 },
  searchText: { color: colors.muted, flex: 1, fontSize: 13, fontWeight: "600" },
  categoryRow: { flexDirection: "row", gap: 8, marginTop: 2 },
  category: { borderColor: colors.line, borderRadius: 999, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 8 },
  categoryActive: { backgroundColor: colors.ink, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8 },
  categoryText: { color: colors.muted, fontSize: 11, fontWeight: "800" },
  categoryActiveText: { color: colors.white, fontSize: 11, fontWeight: "800" },
  cartPreview: { gap: 12, marginTop: 2 },
  cartTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  cartCount: { alignItems: "center", flexDirection: "row", gap: 8 },
  cartCountText: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  cartTotal: { color: colors.green, fontSize: 17, fontWeight: "800" },
  listHeading: { color: colors.ink, fontSize: 17, fontWeight: "800", marginTop: 7 },
  gridRow: { gap: 12, justifyContent: "space-between" },
  product: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: 17, borderWidth: 1, flex: 1, padding: 11 },
  productPressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  productImage: { alignItems: "center", borderRadius: 13, height: 76, justifyContent: "center" },
  productName: { color: colors.ink, fontSize: 13, fontWeight: "800", lineHeight: 17, marginTop: 10, minHeight: 34 },
  productFooter: { alignItems: "flex-end", flexDirection: "row", justifyContent: "space-between", marginTop: 7 },
  productPrice: { color: colors.green, fontSize: 12, fontWeight: "800" },
  stock: { color: colors.muted, fontSize: 10, fontWeight: "700" },
  lowStock: { color: colors.coral },
});
