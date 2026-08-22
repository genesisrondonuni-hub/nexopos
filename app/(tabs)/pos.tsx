import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Card, colors, formatCOP, PrimaryButton, SoftButton } from "@/components/nexo-ui";
import { BusinessModeBanner } from "@/components/business-mode-banner";
import { ScreenContainer } from "@/components/screen-container";
import { haptic } from "@/lib/haptics";
import { useNexo } from "@/lib/pos-store";
import { useBusiness } from "@/lib/business-store";
import type { Product } from "@/shared/pos-types";

export default function PosScreen() {
  const { products, cart, addToCart, addFreeSale } = useNexo();
  const { profile, configuration } = useBusiness();
  const categories = ["Todos", ...configuration.categories];
  const [activeCategory, setActiveCategory] = useState("Todos");
  const selectedCategory = categories.includes(activeCategory) ? activeCategory : "Todos";
  const visibleProducts = selectedCategory === "Todos" ? products : products.filter((product) => product.category === selectedCategory);
  const total = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const renderProduct = ({ item }: { item: Product }) => (
    <Pressable onPress={() => { haptic.light(); addToCart(item); }} style={({ pressed }) => [styles.product, pressed && styles.productPressed]}>
      <View style={[styles.productImage, { backgroundColor: colors.mint }]}><MaterialIcons name={configuration.features.recipes ? "restaurant" : "local-grocery-store"} size={24} color={colors.green} /></View>
      <Text numberOfLines={2} style={styles.productName}>{item.name}</Text><Text style={styles.productCode}>{item.code}</Text>
      <View style={styles.productFooter}><Text style={styles.productPrice}>{formatCOP(item.price)}</Text><Text style={[styles.stock, item.stock <= item.minStock && styles.lowStock]}>{item.stock} disp.</Text></View>
    </Pressable>
  );

  return (
    <ScreenContainer containerClassName="bg-[#F6F3EE]" className="px-5">
      <FlatList
        data={visibleProducts}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            <View style={styles.header}><View><Text style={styles.eyebrow}>{profile.shortLabel.toUpperCase()} · PUNTO DE VENTA</Text><Text style={styles.title}>Nueva venta</Text></View><Pressable onPress={() => { haptic.medium(); addFreeSale(); }} style={({ pressed }) => [styles.iconButton, pressed && styles.productPressed]}><MaterialIcons name="add" size={22} color={colors.green} /></Pressable></View>
            <BusinessModeBanner area="POS" /><Pressable onPress={() => undefined} style={({ pressed }) => [styles.search, pressed && styles.productPressed]}><MaterialIcons name="search" size={21} color={colors.muted} /><Text style={styles.searchText}>{configuration.features.barcode ? "Buscar producto o código" : "Buscar producto o servicio"}</Text>{configuration.features.barcode ? <MaterialIcons name="qr-code-scanner" size={20} color={colors.green} /> : <MaterialIcons name="tune" size={20} color={colors.green} />}</Pressable>
            <FlatList horizontal data={categories} keyExtractor={(item) => item} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow} renderItem={({ item }) => <Pressable onPress={() => { haptic.light(); setActiveCategory(item); }} style={({ pressed }) => [item === selectedCategory ? styles.categoryActive : styles.category, pressed && styles.productPressed]}><Text style={item === selectedCategory ? styles.categoryActiveText : styles.categoryText}>{item}</Text></Pressable>} />
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
  productCode: { color: colors.green, fontSize: 9, fontWeight: "900", letterSpacing: 0.4, marginTop: 3 },
  productFooter: { alignItems: "flex-end", flexDirection: "row", justifyContent: "space-between", marginTop: 7 },
  productPrice: { color: colors.green, fontSize: 12, fontWeight: "800" },
  stock: { color: colors.muted, fontSize: 10, fontWeight: "700" },
  lowStock: { color: colors.coral },
});
