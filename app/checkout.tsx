import { router } from "expo-router";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useMemo, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Card, colors, PrimaryButton } from "@/components/nexo-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useBusiness } from "@/lib/business-store";
import { haptic } from "@/lib/haptics";
import { useNexo } from "@/lib/pos-store";
import { formatBusinessMoney, formatDualCurrency } from "@/shared/currency-format";
import { calculateCashChange, createReceivedPayment, type ReceivedCurrency } from "@/shared/payment-currency";
import type { CartItem, PaymentSplit } from "@/shared/pos-types";

type PaymentMode = "split" | "cash" | "card";
type Rate = number;

function RatePicker({ label, values, value, onChange }: { label: string; values: Rate[]; value: Rate; onChange: (value: Rate) => void }) {
  return <View style={styles.adjustment}><Text style={styles.totalLabel}>{label}</Text><View style={styles.rateOptions}>{values.map((rate) => <Pressable key={rate} onPress={() => { haptic.light(); onChange(rate); }} style={({ pressed }) => [styles.rateOption, value === rate && styles.rateOptionActive, pressed && styles.pressed]}><Text style={[styles.rateText, value === rate && styles.rateTextActive]}>{rate === 0 ? "No" : `${rate}%`}</Text></Pressable>)}</View></View>;
}

function ReceivedCurrencyPicker({ value, canUseUsd, onChange }: { value: ReceivedCurrency; canUseUsd: boolean; onChange: (value: ReceivedCurrency) => void }) {
  return <View style={styles.receivedCurrencyRow}>{(["VES", "USD"] as ReceivedCurrency[]).map((currency) => <Pressable key={currency} disabled={currency === "USD" && !canUseUsd} onPress={() => { haptic.light(); onChange(currency); }} style={({ pressed }) => [styles.currencyChip, value === currency && styles.currencyChipActive, currency === "USD" && !canUseUsd && styles.currencyChipDisabled, pressed && styles.pressed]}><Text style={[styles.currencyChipText, value === currency && styles.currencyChipTextActive]}>{currency}</Text></Pressable>)}</View>;
}

function parseCashAmount(value: string): number {
  const normalized = value.replace(/[^\d.,]/g, "");
  if (!normalized) return 0;
  const decimalIndex = Math.max(normalized.lastIndexOf(","), normalized.lastIndexOf("."));
  if (decimalIndex < 0) return Number(normalized) || 0;
  const whole = normalized.slice(0, decimalIndex).replace(/[.,]/g, "") || "0";
  const fraction = normalized.slice(decimalIndex + 1).replace(/[.,]/g, "");
  return Number(`${whole}.${fraction}`) || 0;
}

export default function CheckoutScreen() {
  const { cart, setCartQuantity, removeFromCart, checkout } = useNexo();
  const { configuration } = useBusiness();
  const [tipRate, setTipRate] = useState<Rate>(0);
  const [discountRate, setDiscountRate] = useState<Rate>(0);
  const [taxRate, setTaxRate] = useState<Rate>(configuration.fiscal.ivaRate);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("split");
  const [receivedCurrencies, setReceivedCurrencies] = useState<Record<string, ReceivedCurrency>>({ cash: "VES", card: "VES" });
  const [cashTendered, setCashTendered] = useState<Record<string, string>>({});
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0), [cart]);
  const discount = Math.round(subtotal * discountRate / 100);
  const taxable = subtotal - discount;
  const tax = Math.round(taxable * taxRate / 100);
  const tip = Math.round(taxable * tipRate / 100);
  const total = taxable + tax + tip;
  const formatMoney = (value: number) => { const dual = formatDualCurrency(value, configuration.fiscal); return dual.usd ? `${dual.ves} · ${dual.usd}` : dual.ves; };
  const paymentBase: { id: string; method: PaymentSplit["method"]; amount: number }[] = paymentMode === "split" ? [{ id: "cash", method: "Efectivo", amount: Math.ceil(total / 2) }, { id: "card", method: "Tarjeta", amount: Math.floor(total / 2) }] : [{ id: paymentMode, method: paymentMode === "cash" ? "Efectivo" : "Tarjeta", amount: total }];
  const payments = paymentBase.map((payment) => createReceivedPayment(payment.id, payment.method, payment.amount, receivedCurrencies[payment.id] ?? "VES", configuration.fiscal.usdVesRate));
  const cashChanges = payments.filter((payment) => payment.method === "Efectivo").map((payment) => {
    const currency = payment.receivedCurrency ?? "VES";
    const entered = cashTendered[payment.id];
    const tenderedAmount = entered === undefined ? payment.receivedAmount ?? payment.amount : parseCashAmount(entered);
    return { paymentId: payment.id, change: calculateCashChange(payment.amount, currency, payment.exchangeRate ?? configuration.fiscal.usdVesRate, tenderedAmount) };
  });
  const hasUsdRate = configuration.fiscal.usdVesRate > 0;
  const rateUpdatedAt = configuration.fiscal.usdVesRateUpdatedAt ? new Date(configuration.fiscal.usdVesRateUpdatedAt).toLocaleString("es-VE") : null;
  const rateContext = hasUsdRate ? `Tasa manual: 1 USD = Bs. ${configuration.fiscal.usdVesRate.toLocaleString("es-VE")} · ${rateUpdatedAt ?? "fecha pendiente"}` : "Configura una tasa USD/VES para aceptar y mostrar pagos en dólares.";
  const receivedLabel = (payment: PaymentSplit) => formatBusinessMoney(payment.receivedAmount ?? payment.amount, { displayCurrency: payment.receivedCurrency ?? "VES", usdVesRate: payment.exchangeRate ?? configuration.fiscal.usdVesRate });
  const pay = () => {
    const insufficient = cashChanges.find(({ change }) => change.shortfallAmount > 0);
    if (insufficient) {
      const currency = insufficient.change.currency;
      const missing = formatBusinessMoney(insufficient.change.shortfallAmount, { displayCurrency: currency, usdVesRate: configuration.fiscal.usdVesRate });
      Alert.alert("Monto insuficiente", `Faltan ${missing} para completar el pago en efectivo.`);
      return;
    }
    const settledPayments = payments.map((payment) => {
      const cash = cashChanges.find((item) => item.paymentId === payment.id);
      return cash ? { ...payment, tenderedAmount: cash.change.tenderedAmount, changeAmount: cash.change.changeAmount } : payment;
    });
    const order = checkout({ payments: settledPayments, tip, discount, tax });
    if (order) { haptic.success(); router.replace("/orders"); }
  };
  const renderItem = ({ item }: { item: CartItem }) => <View style={styles.lineItem}><View style={styles.itemBadge}><Text style={styles.itemBadgeText}>{item.quantity}</Text></View><View style={styles.itemCopy}><Text style={styles.itemName}>{item.name}</Text><Text style={styles.itemPrice}>{formatMoney(item.unitPrice)} c/u</Text></View><View style={styles.quantity}><Pressable onPress={() => { haptic.light(); setCartQuantity(item.id, item.quantity - 1); }} style={({ pressed }) => [styles.quantityButton, pressed && styles.pressed]}><MaterialIcons name="remove" size={16} color={colors.green} /></Pressable><Text style={styles.quantityText}>{item.quantity}</Text><Pressable onPress={() => { haptic.light(); setCartQuantity(item.id, item.quantity + 1); }} style={({ pressed }) => [styles.quantityButton, pressed && styles.pressed]}><MaterialIcons name="add" size={16} color={colors.green} /></Pressable></View><Pressable onPress={() => removeFromCart(item.id)} style={({ pressed }) => [styles.delete, pressed && styles.pressed]}><MaterialIcons name="close" size={17} color={colors.coral} /></Pressable></View>;
  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#F6F3EE]" className="px-5">
      <FlatList
        data={cart}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<>
          <View style={styles.header}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><MaterialIcons name="arrow-back" size={22} color={colors.ink} /></Pressable><View><Text style={styles.eyebrow}>CONFIRMAR VENTA</Text><Text style={styles.title}>Cobro</Text></View><View style={styles.headerSpacer} /></View>
          {cart.length ? null : <Card style={styles.empty}><MaterialIcons name="shopping-bag" size={28} color={colors.muted} /><Text style={styles.emptyText}>Aún no hay productos en esta venta.</Text></Card>}
        </>}
        ListFooterComponent={cart.length ? <View style={styles.footer}>
          <Card style={styles.totalCard}>
            <View style={styles.totalRow}><Text style={styles.totalLabel}>Subtotal</Text><Text style={styles.totalValue}>{formatMoney(subtotal)}</Text></View>
            <RatePicker label="Descuento" values={[0, 5, 10]} value={discountRate} onChange={setDiscountRate} />
            {discount ? <View style={styles.totalRow}><Text style={styles.discountLabel}>Descuento aplicado</Text><Text style={styles.discountValue}>− {formatMoney(discount)}</Text></View> : null}
            <RatePicker label="IVA" values={[0, configuration.fiscal.ivaRate]} value={taxRate} onChange={setTaxRate} />
            {tax ? <View style={styles.totalRow}><Text style={styles.totalLabel}>IVA aplicado</Text><Text style={styles.totalValue}>{formatMoney(tax)}</Text></View> : null}
            <RatePicker label="Propina" values={[0, 10]} value={tipRate} onChange={setTipRate} />
            {tip ? <View style={styles.totalRow}><Text style={styles.totalLabel}>Propina</Text><Text style={styles.totalValue}>{formatMoney(tip)}</Text></View> : null}
            <View style={styles.totalDivider} />
            <View style={styles.totalRow}><Text style={styles.grandLabel}>Total a cobrar</Text><Text style={styles.grandValue}>{formatMoney(total)}</Text></View>
            <View style={styles.rateContext}><MaterialIcons name="currency-exchange" size={16} color={colors.green} /><Text style={styles.rateContextText}>{rateContext}</Text><Pressable onPress={() => router.push("/fiscal-settings" as never)} style={({ pressed }) => [styles.updateRate, pressed && styles.pressed]}><Text style={styles.updateRateText}>Actualizar</Text></Pressable></View>
          </Card>
          <Text style={styles.paymentTitle}>Método de pago</Text>
          <View style={styles.paymentGrid}>
            <Pressable onPress={() => { haptic.medium(); setPaymentMode("split"); }} style={({ pressed }) => [styles.paymentOption, paymentMode === "split" && styles.paymentSelected, pressed && styles.pressed]}><MaterialIcons name="call-split" size={20} color={paymentMode === "split" ? colors.white : colors.green} /><Text style={[styles.paymentText, paymentMode === "split" && styles.paymentTextSelected]}>Mixto</Text></Pressable>
            <Pressable onPress={() => { haptic.medium(); setPaymentMode("cash"); }} style={({ pressed }) => [styles.paymentOption, paymentMode === "cash" && styles.paymentSelected, pressed && styles.pressed]}><MaterialIcons name="payments" size={20} color={paymentMode === "cash" ? colors.white : colors.green} /><Text style={[styles.paymentText, paymentMode === "cash" && styles.paymentTextSelected]}>Efectivo</Text></Pressable>
            <Pressable onPress={() => { haptic.medium(); setPaymentMode("card"); }} style={({ pressed }) => [styles.paymentOption, paymentMode === "card" && styles.paymentSelected, pressed && styles.pressed]}><MaterialIcons name="credit-card" size={20} color={paymentMode === "card" ? colors.white : colors.green} /><Text style={[styles.paymentText, paymentMode === "card" && styles.paymentTextSelected]}>Tarjeta</Text></Pressable>
          </View>
          <Card style={styles.paymentBreakdown}>
            <Text style={styles.breakdownTitle}>Distribución del pago</Text>
            {payments.map((payment) => {
              const cash = cashChanges.find((item) => item.paymentId === payment.id);
              const currency = payment.receivedCurrency ?? "VES";
              const entered = cashTendered[payment.id];
              return <View key={payment.id} style={styles.paymentBlock}>
                <View style={styles.paymentLine}><View><Text style={styles.paymentLineLabel}>{payment.method}</Text><Text style={styles.paymentReceived}>Recibido: {receivedLabel(payment)}</Text></View><Text style={styles.paymentLineValue}>{formatMoney(payment.amount)}</Text></View>
                <ReceivedCurrencyPicker value={currency} canUseUsd={hasUsdRate} onChange={(nextCurrency) => { setReceivedCurrencies((current) => ({ ...current, [payment.id]: nextCurrency })); setCashTendered((current) => { const next = { ...current }; delete next[payment.id]; return next; }); }} />
                {cash ? <><View style={styles.rateContext}><View style={styles.itemCopy}><Text style={styles.paymentLineLabel}>Efectivo entregado ({cash.change.currency})</Text><Text style={styles.paymentReceived}>El vuelto se devuelve en la misma moneda.</Text></View><TextInput value={entered ?? String(cash.change.amountDue)} onChangeText={(value) => setCashTendered((current) => ({ ...current, [payment.id]: value }))} keyboardType="decimal-pad" returnKeyType="done" selectTextOnFocus maxLength={14} style={styles.updateRate} accessibilityLabel={`Efectivo entregado en ${cash.change.currency}`} /></View><View style={styles.paymentLine}><Text style={cash.change.shortfallAmount > 0 ? styles.discountLabel : styles.paymentReceived}>{cash.change.shortfallAmount > 0 ? "Falta" : cash.change.changeAmount > 0 ? "Vuelto" : "Pago exacto"}</Text><Text style={cash.change.shortfallAmount > 0 ? styles.discountValue : styles.paymentLineValue}>{formatBusinessMoney(cash.change.shortfallAmount > 0 ? cash.change.shortfallAmount : cash.change.changeAmount, { displayCurrency: cash.change.currency, usdVesRate: configuration.fiscal.usdVesRate })}</Text></View></> : null}
              </View>;
            })}
          </Card>
          <PrimaryButton label={`Confirmar cobro · ${formatMoney(total)}`} icon="check-circle" onPress={pay} />
        </View> : null}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({ content: { gap: 10, paddingBottom: 18, paddingTop: 8 }, header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }, back: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.line, borderRadius: 14, borderWidth: 1, height: 44, justifyContent: "center", width: 44 }, headerSpacer: { width: 44 }, eyebrow: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.7, textAlign: "center" }, title: { color: colors.ink, fontSize: 23, fontWeight: "800", letterSpacing: -0.5, marginTop: 2, textAlign: "center" }, lineItem: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.line, borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 9, minHeight: 74, paddingHorizontal: 11 }, itemBadge: { alignItems: "center", backgroundColor: colors.mint, borderRadius: 10, height: 30, justifyContent: "center", width: 30 }, itemBadgeText: { color: colors.green, fontSize: 12, fontWeight: "800" }, itemCopy: { flex: 1 }, itemName: { color: colors.ink, fontSize: 13, fontWeight: "800" }, itemPrice: { color: colors.muted, fontSize: 11, marginTop: 3 }, quantity: { alignItems: "center", flexDirection: "row", gap: 6 }, quantityButton: { alignItems: "center", backgroundColor: colors.mint, borderRadius: 9, height: 28, justifyContent: "center", width: 28 }, quantityText: { color: colors.ink, fontSize: 12, fontWeight: "800", minWidth: 12, textAlign: "center" }, delete: { padding: 4 }, footer: { gap: 13, marginTop: 5 }, totalCard: { gap: 11, padding: 15 }, totalRow: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" }, totalLabel: { color: colors.muted, fontSize: 13, fontWeight: "700" }, totalValue: { color: colors.ink, fontSize: 13, fontWeight: "800" }, adjustment: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" }, rateOptions: { flexDirection: "row", gap: 6 }, rateOption: { borderColor: colors.line, borderRadius: 9, borderWidth: 1, minWidth: 37, paddingHorizontal: 8, paddingVertical: 6 }, rateOptionActive: { backgroundColor: colors.mint, borderColor: colors.green }, rateText: { color: colors.muted, fontSize: 10, fontWeight: "800", textAlign: "center" }, rateTextActive: { color: colors.green }, discountLabel: { color: colors.green, fontSize: 12, fontWeight: "800" }, discountValue: { color: colors.green, fontSize: 13, fontWeight: "800" }, totalDivider: { borderTopColor: colors.line, borderTopWidth: 1 }, grandLabel: { color: colors.ink, fontSize: 15, fontWeight: "800" }, grandValue: { color: colors.green, fontSize: 21, fontWeight: "800", textAlign: "right" }, rateContext: { alignItems: "center", backgroundColor: colors.mint, borderRadius: 10, flexDirection: "row", gap: 6, padding: 9 }, rateContextText: { color: colors.ink, flex: 1, fontSize: 9, fontWeight: "700", lineHeight: 13 }, updateRate: { backgroundColor: colors.white, borderColor: colors.green, borderRadius: 7, borderWidth: 1, paddingHorizontal: 7, paddingVertical: 5 }, updateRateText: { color: colors.green, fontSize: 9, fontWeight: "900" }, paymentTitle: { color: colors.ink, fontSize: 16, fontWeight: "800", marginTop: 4 }, paymentGrid: { flexDirection: "row", gap: 8 }, paymentOption: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.line, borderRadius: 13, borderWidth: 1, flex: 1, gap: 5, minHeight: 69, justifyContent: "center", paddingHorizontal: 5 }, paymentSelected: { backgroundColor: colors.green, borderColor: colors.green }, paymentText: { color: colors.green, fontSize: 10, fontWeight: "800", textAlign: "center" }, paymentTextSelected: { color: colors.white }, paymentBreakdown: { gap: 9, padding: 14 }, breakdownTitle: { color: colors.ink, fontSize: 12, fontWeight: "800", marginBottom: 2 }, paymentBlock: { borderTopColor: colors.line, borderTopWidth: 1, gap: 6, paddingTop: 8 }, paymentLine: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" }, paymentLineLabel: { color: colors.muted, fontSize: 12 }, paymentReceived: { color: colors.green, fontSize: 10, fontWeight: "800", marginTop: 2 }, paymentLineValue: { color: colors.ink, fontSize: 12, fontWeight: "800" }, receivedCurrencyRow: { flexDirection: "row", gap: 6 }, currencyChip: { borderColor: colors.line, borderRadius: 8, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 5 }, currencyChipActive: { backgroundColor: colors.mint, borderColor: colors.green }, currencyChipDisabled: { opacity: 0.4 }, currencyChipText: { color: colors.muted, fontSize: 9, fontWeight: "900" }, currencyChipTextActive: { color: colors.green }, empty: { alignItems: "center", gap: 10, paddingVertical: 30 }, emptyText: { color: colors.muted, fontSize: 13, fontWeight: "700" }, pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] } });
