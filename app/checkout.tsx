import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Card, colors, formatCOP, PrimaryButton } from "@/components/nexo-ui";
import { ScreenContainer } from "@/components/screen-container";
import { haptic } from "@/lib/haptics";
import { useNexo } from "@/lib/pos-store";
import type { CartItem, PaymentSplit } from "@/shared/pos-types";

type PaymentMode = "split" | "cash" | "card";

export default function CheckoutScreen() {
  const { cart, setCartQuantity, removeFromCart, checkout } = useNexo();
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0), [cart]);
  const [tipRate, setTipRate] = useState<0 | 10>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("split");
  const tip = Math.round(subtotal * tipRate / 100);
  const total = subtotal + tip;
  const payments: PaymentSplit[] = paymentMode === "split" ? [{ id: "cash", method: "Efectivo", amount: Math.ceil(total / 2) }, { id: "card", method: "Tarjeta", amount: Math.floor(total / 2) }] : [{ id: paymentMode, method: paymentMode === "cash" ? "Efectivo" : "Tarjeta", amount: total }];
  const pay = () => { const order = checkout({ payments, tip }); if (order) { haptic.success(); router.replace("/orders"); } };
  const renderItem = ({ item }: { item: CartItem }) => <View style={styles.lineItem}><View style={styles.itemBadge}><Text style={styles.itemBadgeText}>{item.quantity}</Text></View><View style={styles.itemCopy}><Text style={styles.itemName}>{item.name}</Text><Text style={styles.itemPrice}>{formatCOP(item.unitPrice)} c/u</Text></View><View style={styles.quantity}><Pressable onPress={() => { haptic.light(); setCartQuantity(item.id, item.quantity - 1); }} style={({ pressed }) => [styles.quantityButton, pressed && styles.pressed]}><MaterialIcons name="remove" size={16} color={colors.green} /></Pressable><Text style={styles.quantityText}>{item.quantity}</Text><Pressable onPress={() => { haptic.light(); setCartQuantity(item.id, item.quantity + 1); }} style={({ pressed }) => [styles.quantityButton, pressed && styles.pressed]}><MaterialIcons name="add" size={16} color={colors.green} /></Pressable></View><Pressable onPress={() => removeFromCart(item.id)} style={({ pressed }) => [styles.delete, pressed && styles.pressed]}><MaterialIcons name="close" size={17} color={colors.coral} /></Pressable></View>;
  return <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#F6F3EE]" className="px-5"><FlatList data={cart} renderItem={renderItem} keyExtractor={(item) => item.id} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} ListHeaderComponent={<><View style={styles.header}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><MaterialIcons name="arrow-back" size={22} color={colors.ink} /></Pressable><View><Text style={styles.eyebrow}>CONFIRMAR VENTA</Text><Text style={styles.title}>Cobro</Text></View><View style={styles.headerSpacer} /></View>{cart.length ? null : <Card style={styles.empty}><MaterialIcons name="shopping-bag" size={28} color={colors.muted} /><Text style={styles.emptyText}>Aún no hay productos en esta venta.</Text></Card>}</>} ListFooterComponent={cart.length ? <View style={styles.footer}><Card style={styles.totalCard}><View style={styles.totalRow}><Text style={styles.totalLabel}>Subtotal</Text><Text style={styles.totalValue}>{formatCOP(subtotal)}</Text></View><View style={styles.tipRow}><Text style={styles.totalLabel}>Propina</Text><View style={styles.tipOptions}><Pressable onPress={() => { haptic.light(); setTipRate(0); }} style={({ pressed }) => [styles.tipOption, tipRate === 0 && styles.tipOptionActive, pressed && styles.pressed]}><Text style={[styles.tipText, tipRate === 0 && styles.tipTextActive]}>Sin propina</Text></Pressable><Pressable onPress={() => { haptic.light(); setTipRate(10); }} style={({ pressed }) => [styles.tipOption, tipRate === 10 && styles.tipOptionActive, pressed && styles.pressed]}><Text style={[styles.tipText, tipRate === 10 && styles.tipTextActive]}>10%</Text></Pressable></View></View><View style={styles.totalDivider} /><View style={styles.totalRow}><Text style={styles.grandLabel}>Total a cobrar</Text><Text style={styles.grandValue}>{formatCOP(total)}</Text></View></Card><Text style={styles.paymentTitle}>Método de pago</Text><View style={styles.paymentGrid}><Pressable onPress={() => { haptic.medium(); setPaymentMode("split"); }} style={({ pressed }) => [styles.paymentOption, paymentMode === "split" && styles.paymentSelected, pressed && styles.pressed]}><MaterialIcons name="call-split" size={20} color={paymentMode === "split" ? colors.white : colors.green} /><Text style={[styles.paymentText, paymentMode === "split" && styles.paymentTextSelected]}>Mitad y mitad</Text></Pressable><Pressable onPress={() => { haptic.medium(); setPaymentMode("cash"); }} style={({ pressed }) => [styles.paymentOption, paymentMode === "cash" && styles.paymentSelected, pressed && styles.pressed]}><MaterialIcons name="payments" size={20} color={paymentMode === "cash" ? colors.white : colors.green} /><Text style={[styles.paymentText, paymentMode === "cash" && styles.paymentTextSelected]}>Efectivo</Text></Pressable><Pressable onPress={() => { haptic.medium(); setPaymentMode("card"); }} style={({ pressed }) => [styles.paymentOption, paymentMode === "card" && styles.paymentSelected, pressed && styles.pressed]}><MaterialIcons name="credit-card" size={20} color={paymentMode === "card" ? colors.white : colors.green} /><Text style={[styles.paymentText, paymentMode === "card" && styles.paymentTextSelected]}>Tarjeta</Text></Pressable></View><Card style={styles.paymentBreakdown}><Text style={styles.breakdownTitle}>Distribución del pago</Text>{payments.length === 2 ? <><View style={styles.paymentLine}><Text style={styles.paymentLineLabel}>Efectivo</Text><Text style={styles.paymentLineValue}>{formatCOP(payments[0].amount)}</Text></View><View style={styles.paymentLine}><Text style={styles.paymentLineLabel}>Tarjeta</Text><Text style={styles.paymentLineValue}>{formatCOP(payments[1].amount)}</Text></View></> : <View style={styles.paymentLine}><Text style={styles.paymentLineLabel}>{payments[0].method}</Text><Text style={styles.paymentLineValue}>{formatCOP(payments[0].amount)}</Text></View>}</Card><PrimaryButton label={`Confirmar cobro · ${formatCOP(total)}`} icon="check-circle" onPress={pay} /></View> : null} /></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { gap: 10, paddingBottom: 18, paddingTop: 8 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  back: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.line, borderRadius: 14, borderWidth: 1, height: 44, justifyContent: "center", width: 44 },
  headerSpacer: { width: 44 },
  eyebrow: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.7, textAlign: "center" },
  title: { color: colors.ink, fontSize: 23, fontWeight: "800", letterSpacing: -0.5, marginTop: 2, textAlign: "center" },
  lineItem: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.line, borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 9, minHeight: 74, paddingHorizontal: 11 },
  itemBadge: { alignItems: "center", backgroundColor: colors.mint, borderRadius: 10, height: 30, justifyContent: "center", width: 30 },
  itemBadgeText: { color: colors.green, fontSize: 12, fontWeight: "800" },
  itemCopy: { flex: 1 },
  itemName: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  itemPrice: { color: colors.muted, fontSize: 11, marginTop: 3 },
  quantity: { alignItems: "center", flexDirection: "row", gap: 6 },
  quantityButton: { alignItems: "center", backgroundColor: colors.mint, borderRadius: 9, height: 28, justifyContent: "center", width: 28 },
  quantityText: { color: colors.ink, fontSize: 12, fontWeight: "800", minWidth: 12, textAlign: "center" },
  delete: { padding: 4 },
  footer: { gap: 13, marginTop: 5 },
  totalCard: { gap: 12, padding: 15 },
  totalRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  totalLabel: { color: colors.muted, fontSize: 13, fontWeight: "700" },
  totalValue: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  tipRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  tipOptions: { flexDirection: "row", gap: 7 },
  tipOption: { borderColor: colors.line, borderRadius: 9, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 6 },
  tipOptionActive: { backgroundColor: colors.mint, borderColor: colors.green },
  tipText: { color: colors.muted, fontSize: 10, fontWeight: "800" },
  tipTextActive: { color: colors.green },
  totalDivider: { borderTopColor: colors.line, borderTopWidth: 1 },
  grandLabel: { color: colors.ink, fontSize: 15, fontWeight: "800" },
  grandValue: { color: colors.green, fontSize: 21, fontWeight: "800" },
  paymentTitle: { color: colors.ink, fontSize: 16, fontWeight: "800", marginTop: 4 },
  paymentGrid: { flexDirection: "row", gap: 8 },
  paymentOption: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.line, borderRadius: 13, borderWidth: 1, flex: 1, gap: 5, minHeight: 69, justifyContent: "center", paddingHorizontal: 5 },
  paymentSelected: { backgroundColor: colors.green, borderColor: colors.green },
  paymentText: { color: colors.green, fontSize: 10, fontWeight: "800", textAlign: "center" },
  paymentTextSelected: { color: colors.white },
  paymentBreakdown: { gap: 8, padding: 14 },
  breakdownTitle: { color: colors.ink, fontSize: 12, fontWeight: "800", marginBottom: 2 },
  paymentLine: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  paymentLineLabel: { color: colors.muted, fontSize: 12 },
  paymentLineValue: { color: colors.ink, fontSize: 12, fontWeight: "800" },
  empty: { alignItems: "center", gap: 10, paddingVertical: 30 },
  emptyText: { color: colors.muted, fontSize: 13, fontWeight: "700" },
  pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
});
