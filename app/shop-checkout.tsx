import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Card, colors, formatCOP, PrimaryButton } from "@/components/nexo-ui";
import { ScreenContainer } from "@/components/screen-container";
import { haptic } from "@/lib/haptics";
import { useCrm } from "@/lib/crm-store";
import { calculateDeliveryFee } from "@/lib/crm-utils";
import { useNexo } from "@/lib/pos-store";
import { buildWhatsAppOrderUrl } from "@/lib/whatsapp";
import type { CartItem } from "@/shared/pos-types";

export default function ShopCheckoutScreen() {
  const { catalogCart, setCatalogQuantity, createPublicOrder, businessSettings } = useNexo();
  const { settings: crmSettings } = useCrm();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [delivery, setDelivery] = useState<"Recogida" | "Domicilio">("Recogida");
  const [address, setAddress] = useState("");
  const total = useMemo(() => catalogCart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0), [catalogCart]);
  const deliveryFee = calculateDeliveryFee(total, crmSettings.delivery, delivery);
  const finalTotal = total + deliveryFee;
  useEffect(() => {
    if (!crmSettings.delivery.enabled && delivery === "Domicilio") setDelivery("Recogida");
  }, [crmSettings.delivery.enabled, delivery]);
  const complete = Boolean(catalogCart.length && name.trim() && phone.trim() && (delivery === "Recogida" || address.trim()));
  const sendOrder = async () => {
    if (!complete) return;
    const order = createPublicOrder({ customerName: name.trim(), customerPhone: phone.trim(), delivery, deliveryAddress: delivery === "Domicilio" ? address.trim() : undefined, deliveryFee });
    if (!order) return;
    haptic.success();
    const url = buildWhatsAppOrderUrl(order, businessSettings.whatsappNumber);
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) throw new Error("unsupported");
      await Linking.openURL(url);
    } catch {
      Alert.alert("Pedido listo", "El pedido fue registrado. Abre WhatsApp para confirmar el envío al negocio.");
    }
  };
  const renderLine = ({ item }: { item: CartItem }) => <View style={styles.line}><View style={styles.lineCopy}><Text style={styles.lineName}>{item.name}</Text><Text style={styles.linePrice}>{formatCOP(item.unitPrice)} c/u</Text></View><View style={styles.counter}><Pressable onPress={() => { haptic.light(); setCatalogQuantity(item.id, item.quantity - 1); }} style={({ pressed }) => [styles.counterButton, pressed && styles.pressed]}><MaterialIcons name="remove" size={15} color={colors.green} /></Pressable><Text style={styles.counterText}>{item.quantity}</Text><Pressable onPress={() => { haptic.light(); setCatalogQuantity(item.id, item.quantity + 1); }} style={({ pressed }) => [styles.counterButton, pressed && styles.pressed]}><MaterialIcons name="add" size={15} color={colors.green} /></Pressable></View><Text style={styles.lineTotal}>{formatCOP(item.quantity * item.unitPrice)}</Text></View>;
  return <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#F6F3EE]" className="px-5"><FlatList data={catalogCart} renderItem={renderLine} keyExtractor={(item) => item.id} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} ListHeaderComponent={<><View style={styles.header}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><MaterialIcons name="arrow-back" size={21} color={colors.ink} /></Pressable><View><Text style={styles.eyebrow}>NEXO CAFÉ</Text><Text style={styles.title}>Tu pedido</Text></View><View style={styles.backGhost} /></View>{catalogCart.length ? <><Card style={styles.orderCard}><Text style={styles.sectionTitle}>Resumen</Text></Card></> : <Card style={styles.empty}><MaterialIcons name="shopping-bag" size={30} color={colors.muted} /><Text style={styles.emptyText}>Tu carrito todavía está vacío.</Text><Pressable onPress={() => router.replace("/shop")} style={({ pressed }) => [styles.returnButton, pressed && styles.pressed]}><Text style={styles.returnText}>Ver menú</Text></Pressable></Card>}</>} ListFooterComponent={catalogCart.length ? <View style={styles.footer}><Card style={styles.totalCard}><View style={styles.totalRow}><Text style={styles.totalLabel}>Subtotal</Text><Text style={styles.totalValue}>{formatCOP(total)}</Text></View>{delivery === "Domicilio" ? <View style={styles.totalRow}><Text style={styles.totalLabel}>Delivery</Text><Text style={styles.totalValue}>{deliveryFee ? formatCOP(deliveryFee) : "Gratis"}</Text></View> : null}<View style={styles.totalDivider} /><View style={styles.totalRow}><Text style={styles.totalLabel}>Total del pedido</Text><Text style={styles.total}>{formatCOP(finalTotal)}</Text></View></Card><Text style={styles.sectionTitle}>Tus datos</Text><TextInput value={name} onChangeText={setName} placeholder="Nombre completo" placeholderTextColor={colors.muted} returnKeyType="next" style={styles.input} /><TextInput value={phone} onChangeText={setPhone} placeholder="Teléfono o WhatsApp" placeholderTextColor={colors.muted} keyboardType="phone-pad" returnKeyType="done" style={styles.input} /><Text style={styles.sectionTitle}>¿Cómo lo quieres recibir?</Text><View style={styles.deliveryOptions}><Pressable onPress={() => { haptic.medium(); setDelivery("Recogida"); }} style={({ pressed }) => [styles.deliveryOption, delivery === "Recogida" && styles.deliverySelected, pressed && styles.pressed]}><MaterialIcons name="shopping-bag" size={19} color={delivery === "Recogida" ? colors.white : colors.green} /><Text style={[styles.deliveryText, delivery === "Recogida" && styles.deliveryTextSelected]}>Recogida</Text></Pressable>{crmSettings.delivery.enabled ? <Pressable onPress={() => { haptic.medium(); setDelivery("Domicilio"); }} style={({ pressed }) => [styles.deliveryOption, delivery === "Domicilio" && styles.deliverySelected, pressed && styles.pressed]}><MaterialIcons name="two-wheeler" size={19} color={delivery === "Domicilio" ? colors.white : colors.green} /><Text style={[styles.deliveryText, delivery === "Domicilio" && styles.deliveryTextSelected]}>Domicilio</Text></Pressable> : null}</View>{delivery === "Domicilio" ? <TextInput value={address} onChangeText={setAddress} placeholder="Dirección de entrega" placeholderTextColor={colors.muted} returnKeyType="done" style={styles.input} /> : <Card style={styles.pickupNote}><MaterialIcons name="storefront" size={18} color={colors.green} /><Text style={styles.pickupText}>Te confirmaremos por WhatsApp cuándo puedes recogerlo.</Text></Card>}<PrimaryButton label={`Enviar pedido · ${formatCOP(finalTotal)}`} icon="send" onPress={() => void sendOrder()} disabled={!complete} /><Text style={styles.privacy}>Al continuar se abrirá WhatsApp con el mensaje de pedido listo para enviar.</Text></View> : null} /></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { gap: 10, paddingBottom: 18, paddingTop: 8 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 9 },
  back: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.line, borderRadius: 13, borderWidth: 1, height: 42, justifyContent: "center", width: 42 },
  backGhost: { width: 42 },
  eyebrow: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.7, textAlign: "center" },
  title: { color: colors.ink, fontSize: 23, fontWeight: "800", letterSpacing: -0.5, marginTop: 2, textAlign: "center" },
  orderCard: { paddingBottom: 2, paddingTop: 2 },
  sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: "800", marginBottom: 2 },
  line: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.line, borderRadius: 15, borderWidth: 1, flexDirection: "row", gap: 8, minHeight: 69, paddingHorizontal: 12 },
  lineCopy: { flex: 1 },
  lineName: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  linePrice: { color: colors.muted, fontSize: 10, marginTop: 3 },
  counter: { alignItems: "center", flexDirection: "row", gap: 6 },
  counterButton: { alignItems: "center", backgroundColor: colors.mint, borderRadius: 9, height: 26, justifyContent: "center", width: 26 },
  counterText: { color: colors.ink, fontSize: 12, fontWeight: "800", minWidth: 10, textAlign: "center" },
  lineTotal: { color: colors.ink, fontSize: 11, fontWeight: "800", minWidth: 55, textAlign: "right" },
  footer: { gap: 12, marginTop: 5 },
  totalCard: { padding: 14 },
  totalRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  totalLabel: { color: colors.muted, fontSize: 13, fontWeight: "700" },
  totalValue: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  total: { color: colors.green, fontSize: 20, fontWeight: "800" },
  totalDivider: { borderTopColor: colors.line, borderTopWidth: 1 },
  input: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: 13, borderWidth: 1, color: colors.ink, fontSize: 13, fontWeight: "600", minHeight: 50, paddingHorizontal: 14 },
  deliveryOptions: { flexDirection: "row", gap: 9 },
  deliveryOption: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.line, borderRadius: 13, borderWidth: 1, flex: 1, flexDirection: "row", gap: 7, justifyContent: "center", minHeight: 51 },
  deliverySelected: { backgroundColor: colors.green, borderColor: colors.green },
  deliveryText: { color: colors.green, fontSize: 12, fontWeight: "800" },
  deliveryTextSelected: { color: colors.white },
  pickupNote: { alignItems: "center", flexDirection: "row", gap: 9, padding: 12 },
  pickupText: { color: colors.muted, flex: 1, fontSize: 11, lineHeight: 16 },
  privacy: { color: colors.muted, fontSize: 10, lineHeight: 14, textAlign: "center" },
  empty: { alignItems: "center", gap: 10, paddingVertical: 34 },
  emptyText: { color: colors.muted, fontSize: 13, fontWeight: "700" },
  returnButton: { backgroundColor: colors.mint, borderRadius: 11, paddingHorizontal: 14, paddingVertical: 10 },
  returnText: { color: colors.green, fontSize: 12, fontWeight: "800" },
  pressed: { opacity: 0.72, transform: [{ scale: 0.97 }] },
});
