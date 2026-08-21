import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, formatCOP } from "@/components/nexo-ui";
import { ScreenContainer } from "@/components/screen-container";
import { haptic } from "@/lib/haptics";
import { useNexo } from "@/lib/pos-store";
import type { Product } from "@/shared/pos-types";

function CatalogItem({ product }: { product: Product }) {
  const { addToCatalogCart } = useNexo();
  const soldOut = product.stock <= 0;
  return <View style={styles.product}>
    <View style={[styles.productArt, { backgroundColor: product.category === "Bebidas" ? "#DFEFFF" : product.category === "Postres" ? "#FDE9E4" : colors.mint }]}>
      <MaterialIcons name={product.category === "Bebidas" ? "local-drink" : product.category === "Postres" ? "cake" : "restaurant"} size={29} color={product.category === "Postres" ? colors.coral : colors.green} />
    </View>
    <View style={styles.productCopy}><Text style={styles.category}>{product.category}</Text><Text style={styles.productName}>{product.name}</Text><Text style={styles.productDescription}>{product.type === "RECIPE" ? "Preparado al momento" : "Disponible hoy"}</Text></View>
    <View style={styles.productEnd}><Text style={styles.productPrice}>{formatCOP(product.price)}</Text><Pressable disabled={soldOut} onPress={() => { haptic.light(); addToCatalogCart(product); }} style={({ pressed }) => [styles.addButton, soldOut && styles.disabledButton, pressed && !soldOut && styles.pressed]}><MaterialIcons name={soldOut ? "remove-shopping-cart" : "add"} size={19} color={colors.white} /></Pressable></View>
  </View>;
}

export default function ShopScreen() {
  const { products, catalogCart } = useNexo();
  const catalogProducts = products.filter((product) => product.showInCatalog);
  const itemCount = catalogCart.reduce((sum, item) => sum + item.quantity, 0);
  const total = catalogCart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  return <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#F6F3EE]" className="px-5"><FlatList data={catalogProducts} renderItem={({ item }) => <CatalogItem product={item} />} keyExtractor={(item) => item.id} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} ListHeaderComponent={<><View style={styles.topbar}><Pressable onPress={() => router.canGoBack() ? router.back() : router.replace("/")} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><MaterialIcons name="arrow-back" size={21} color={colors.ink} /></Pressable><Text style={styles.topbarLabel}>MENÚ DIGITAL</Text><Pressable onPress={() => router.push("/shop-checkout" as never)} style={({ pressed }) => [styles.cartButton, pressed && styles.pressed]}><MaterialIcons name="shopping-bag" size={20} color={colors.white} />{itemCount ? <View style={styles.cartCount}><Text style={styles.cartCountText}>{itemCount}</Text></View> : null}</Pressable></View><View style={styles.hero}><View style={styles.shopLogo}><Text style={styles.shopLogoText}>NC</Text></View><View><Text style={styles.shopName}>Nexo Café</Text><View style={styles.openLine}><View style={styles.greenDot} /><Text style={styles.openText}>Abierto hasta las 9:00 p. m.</Text></View></View></View><View style={styles.intro}><Text style={styles.introTitle}>Nuestro menú</Text><Text style={styles.introBody}>Elige tus favoritos y envía el pedido directamente por WhatsApp.</Text></View></>} ListFooterComponent={catalogProducts.length ? <View style={styles.footerSpace} /> : <View style={styles.empty}><MaterialIcons name="menu-book" size={32} color={colors.muted} /><Text style={styles.emptyText}>No hay productos disponibles en este momento.</Text></View>} /><View style={styles.checkoutBar}><View><Text style={styles.checkoutCaption}>{itemCount ? `${itemCount} productos seleccionados` : "Tu carrito está vacío"}</Text><Text style={styles.checkoutTotal}>{formatCOP(total)}</Text></View><Pressable disabled={!itemCount} onPress={() => router.push("/shop-checkout" as never)} style={({ pressed }) => [styles.checkoutButton, !itemCount && styles.disabledButton, pressed && itemCount > 0 && styles.pressed]}><Text style={styles.checkoutButtonText}>Ver pedido</Text><MaterialIcons name="arrow-forward" size={18} color={colors.white} /></Pressable></View></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { gap: 11, paddingBottom: 96, paddingTop: 6 },
  topbar: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 19 },
  back: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.line, borderRadius: 13, borderWidth: 1, height: 42, justifyContent: "center", width: 42 },
  topbarLabel: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  cartButton: { alignItems: "center", backgroundColor: colors.ink, borderRadius: 13, height: 42, justifyContent: "center", position: "relative", width: 42 },
  cartCount: { alignItems: "center", backgroundColor: colors.coral, borderColor: colors.sand, borderRadius: 10, borderWidth: 2, height: 19, justifyContent: "center", position: "absolute", right: -6, top: -6, width: 19 },
  cartCountText: { color: colors.white, fontSize: 9, fontWeight: "800" },
  hero: { alignItems: "center", backgroundColor: colors.ink, borderRadius: 21, flexDirection: "row", gap: 12, padding: 17 },
  shopLogo: { alignItems: "center", backgroundColor: colors.green, borderRadius: 16, height: 51, justifyContent: "center", width: 51 },
  shopLogoText: { color: colors.white, fontSize: 16, fontWeight: "800" },
  shopName: { color: colors.white, fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  openLine: { alignItems: "center", flexDirection: "row", gap: 6, marginTop: 5 },
  greenDot: { backgroundColor: "#73D1AB", borderRadius: 4, height: 7, width: 7 },
  openText: { color: "#C4D7D0", fontSize: 11, fontWeight: "600" },
  intro: { marginTop: 9 },
  introTitle: { color: colors.ink, fontSize: 23, fontWeight: "800", letterSpacing: -0.5 },
  introBody: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  product: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.line, borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 11, minHeight: 106, padding: 12 },
  productArt: { alignItems: "center", borderRadius: 14, height: 68, justifyContent: "center", width: 68 },
  productCopy: { flex: 1 },
  category: { color: colors.green, fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  productName: { color: colors.ink, fontSize: 14, fontWeight: "800", marginTop: 3 },
  productDescription: { color: colors.muted, fontSize: 10, marginTop: 3 },
  productEnd: { alignItems: "flex-end", alignSelf: "stretch", justifyContent: "space-between" },
  productPrice: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  addButton: { alignItems: "center", backgroundColor: colors.green, borderRadius: 11, height: 34, justifyContent: "center", width: 34 },
  checkoutBar: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.line, borderRadius: 19, borderWidth: 1, bottom: 13, flexDirection: "row", justifyContent: "space-between", left: 20, padding: 11, position: "absolute", right: 20 },
  checkoutCaption: { color: colors.muted, fontSize: 10, fontWeight: "700" },
  checkoutTotal: { color: colors.ink, fontSize: 16, fontWeight: "800", marginTop: 2 },
  checkoutButton: { alignItems: "center", backgroundColor: colors.green, borderRadius: 13, flexDirection: "row", gap: 6, minHeight: 44, paddingHorizontal: 14 },
  checkoutButtonText: { color: colors.white, fontSize: 12, fontWeight: "800" },
  disabledButton: { backgroundColor: "#AAB6B2" },
  footerSpace: { height: 8 },
  empty: { alignItems: "center", gap: 10, paddingVertical: 40 },
  emptyText: { color: colors.muted, fontSize: 13, fontWeight: "700", textAlign: "center" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
});
