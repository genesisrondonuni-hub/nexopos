import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Card, colors, formatMoney, PrimaryButton } from "@/components/nexo-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useBusiness } from "@/lib/business-store";
import { useCrm } from "@/lib/crm-store";
import { haptic } from "@/lib/haptics";
import { useNexo } from "@/lib/pos-store";
import { getProfileDemoData, getProfileDemoOpportunities } from "@/shared/business-profile-demo";
import type { SalesOpportunity } from "@/shared/crm-types";
import type { Order, Product } from "@/shared/pos-types";

type EditorRow = { kind: "label"; id: string; title: string; helper: string } | { kind: "product"; id: string; product: Product } | { kind: "order"; id: string; order: Order } | { kind: "appointment"; id: string; opportunity: SalesOpportunity };

export default function ProfileDemoEditorScreen() {
  const { profile } = useBusiness();
  const { replaceProfileDemo: replacePosDemo } = useNexo();
  const { replaceProfileDemo: replaceCrmDemo } = useCrm();
  const [draftProducts, setDraftProducts] = useState<Product[]>(() => getProfileDemoData(profile.id).products);
  const [draftOrders, setDraftOrders] = useState<Order[]>(() => getProfileDemoData(profile.id).orders);
  const [draftOpportunities, setDraftOpportunities] = useState<SalesOpportunity[]>(() => getProfileDemoOpportunities(profile.id));

  useEffect(() => {
    const demo = getProfileDemoData(profile.id);
    setDraftProducts(demo.products);
    setDraftOrders(demo.orders);
    setDraftOpportunities(getProfileDemoOpportunities(profile.id));
  }, [profile.id]);

  const updateProduct = (productId: string, changes: Partial<Product>) => setDraftProducts((current) => current.map((product) => product.id === productId ? { ...product, ...changes } : product));
  const updateOrder = (orderId: string, changes: Partial<Order>) => setDraftOrders((current) => current.map((order) => order.id === orderId ? { ...order, ...changes } : order));
  const updateOpportunity = (opportunityId: string, changes: Partial<SalesOpportunity>) => setDraftOpportunities((current) => current.map((opportunity) => opportunity.id === opportunityId ? { ...opportunity, ...changes } : opportunity));
  const rows = useMemo<EditorRow[]>(() => [
    { kind: "label", id: "products", title: "Productos o servicios", helper: "Ajusta nombres, precio y disponibilidad antes de cargar." },
    ...draftProducts.map((product) => ({ kind: "product" as const, id: `product-${product.id}`, product })),
    { kind: "label", id: "orders", title: "Pedidos de ejemplo", helper: "Cambia el cliente o la modalidad del pedido de muestra." },
    ...draftOrders.map((order) => ({ kind: "order" as const, id: `order-${order.id}`, order })),
    { kind: "label", id: "appointments", title: profile.features.appointments ? "Solicitudes y citas" : "Seguimientos comerciales", helper: profile.features.appointments ? "Edita el servicio, horario y punto de atención sin datos clínicos." : "Edita el motivo del seguimiento antes de cargar." },
    ...draftOpportunities.map((opportunity) => ({ kind: "appointment" as const, id: `opportunity-${opportunity.id}`, opportunity })),
  ], [draftOpportunities, draftOrders, draftProducts, profile.features.appointments]);

  const applyExamples = () => {
    const productById = new Map(draftProducts.map((product) => [product.id, product]));
    const orders = draftOrders.map((order) => {
      const items = order.items.map((item) => {
        const product = item.productId ? productById.get(item.productId) : undefined;
        return product ? { ...item, name: product.name, unitPrice: product.price, unitCost: product.cost, collection: product.collection } : item;
      });
      return { ...order, items, total: items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) };
    });
    replacePosDemo(profile.id, { products: draftProducts, orders });
    replaceCrmDemo(profile.id, draftOpportunities);
    haptic.success();
    router.back();
  };

  const renderItem = ({ item }: { item: EditorRow }) => {
    if (item.kind === "label") return <View style={styles.section}><Text style={styles.sectionTitle}>{item.title}</Text><Text style={styles.sectionHelper}>{item.helper}</Text></View>;
    if (item.kind === "product") return <Card style={styles.card}><View style={styles.productHeader}>{item.product.imageUri ? <Image source={{ uri: item.product.imageUri }} style={styles.image} /> : <View style={styles.imageFallback}><MaterialIcons name="inventory-2" size={20} color={colors.green} /></View>}<View style={styles.cardCopy}><Text style={styles.code}>{item.product.code}</Text><Text style={styles.cardTitle}>{item.product.category}</Text></View><Text style={styles.stockTag}>{item.product.stock} ud.</Text></View><Text style={styles.inputLabel}>Nombre</Text><TextInput value={item.product.name} onChangeText={(name) => updateProduct(item.product.id, { name })} style={styles.input} /><View style={styles.priceRow}><View style={styles.priceField}><Text style={styles.inputLabel}>Precio</Text><TextInput value={String(item.product.price)} inputMode="numeric" onChangeText={(value) => updateProduct(item.product.id, { price: Number(value.replace(/[^0-9]/g, "")) || 0 })} style={styles.input} /></View><View style={styles.priceField}><Text style={styles.inputLabel}>Stock</Text><TextInput value={String(item.product.stock)} inputMode="numeric" onChangeText={(value) => updateProduct(item.product.id, { stock: Number(value.replace(/[^0-9]/g, "")) || 0 })} style={styles.input} /></View></View></Card>;
    if (item.kind === "order") return <Card style={styles.card}><View style={styles.cardRow}><MaterialIcons name={item.order.delivery === "Domicilio" ? "two-wheeler" : "shopping-bag"} size={19} color={colors.green} /><View style={styles.cardCopy}><Text style={styles.cardTitle}>{item.order.code}</Text><Text style={styles.cardHint}>{formatMoney(item.order.total)} · {item.order.delivery}</Text></View></View><Text style={styles.inputLabel}>Cliente o referencia</Text><TextInput value={item.order.customerName} onChangeText={(customerName) => updateOrder(item.order.id, { customerName })} style={styles.input} /><Text style={styles.inputLabel}>Modalidad</Text><TextInput value={item.order.delivery} onChangeText={(delivery) => updateOrder(item.order.id, { delivery: delivery as Order["delivery"] })} style={styles.input} /></Card>;
    return <Card style={styles.card}><View style={styles.cardRow}><MaterialIcons name={item.opportunity.appointmentAt ? "event-available" : "assignment"} size={19} color={colors.green} /><View style={styles.cardCopy}><Text style={styles.cardTitle}>{item.opportunity.customerName}</Text><Text style={styles.cardHint}>{formatMoney(item.opportunity.value)}</Text></View></View><Text style={styles.inputLabel}>{profile.features.appointments ? "Servicio o motivo de cita" : "Motivo de seguimiento"}</Text><TextInput value={item.opportunity.subject ?? ""} onChangeText={(subject) => updateOpportunity(item.opportunity.id, { subject })} style={styles.input} />{profile.features.appointments ? <><Text style={styles.inputLabel}>Horario de agenda</Text><TextInput value={item.opportunity.appointmentAt ?? ""} onChangeText={(appointmentAt) => updateOpportunity(item.opportunity.id, { appointmentAt })} style={styles.input} /></> : null}</Card>;
  };

  return <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#F6F3EE]" className="px-5"><FlatList data={rows} renderItem={renderItem} keyExtractor={(item) => item.id} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} ListHeaderComponent={<><View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><MaterialIcons name="arrow-back" size={21} color={colors.ink} /></Pressable><View><Text style={styles.eyebrow}>{profile.shortLabel.toUpperCase()} · CONFIGURACIÓN</Text><Text style={styles.title}>Editar ejemplos</Text></View></View><Card style={styles.info}><MaterialIcons name="edit-note" size={22} color={colors.green} /><Text style={styles.infoText}>Revisa los datos antes de cargarlos. Esta acción solo reemplaza demostraciones y conserva tu información creada manualmente.</Text></Card></>} ListFooterComponent={<View style={styles.footer}><PrimaryButton label="Aplicar ejemplos editados" icon="check-circle" onPress={applyExamples} /></View>} /></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { gap: 10, paddingBottom: 28, paddingTop: 8 }, header: { alignItems: "center", flexDirection: "row", gap: 12 }, back: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.line, borderRadius: 13, borderWidth: 1, height: 42, justifyContent: "center", width: 42 }, eyebrow: { color: colors.muted, fontSize: 9, fontWeight: "900", letterSpacing: 0.7 }, title: { color: colors.ink, fontSize: 22, fontWeight: "800", marginTop: 2 }, info: { alignItems: "center", backgroundColor: colors.mint, borderColor: "#B5E0CF", flexDirection: "row", gap: 9, padding: 12 }, infoText: { color: colors.ink, flex: 1, fontSize: 10, fontWeight: "700", lineHeight: 14 }, section: { marginTop: 7 }, sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: "800" }, sectionHelper: { color: colors.muted, fontSize: 10, lineHeight: 14, marginTop: 3 }, card: { gap: 7, padding: 12 }, productHeader: { alignItems: "center", flexDirection: "row", gap: 9 }, image: { borderRadius: 10, height: 42, width: 42 }, imageFallback: { alignItems: "center", backgroundColor: colors.mint, borderRadius: 10, height: 42, justifyContent: "center", width: 42 }, cardRow: { alignItems: "center", flexDirection: "row", gap: 8 }, cardCopy: { flex: 1 }, code: { color: colors.green, fontSize: 8, fontWeight: "900" }, cardTitle: { color: colors.ink, fontSize: 12, fontWeight: "800" }, cardHint: { color: colors.muted, fontSize: 10, marginTop: 2 }, stockTag: { color: colors.green, fontSize: 10, fontWeight: "800" }, inputLabel: { color: colors.ink, fontSize: 10, fontWeight: "800", marginTop: 2 }, input: { backgroundColor: "#F8F8F6", borderColor: colors.line, borderRadius: 10, borderWidth: 1, color: colors.ink, fontSize: 12, minHeight: 41, paddingHorizontal: 10 }, priceRow: { flexDirection: "row", gap: 9 }, priceField: { flex: 1 }, footer: { marginTop: 4 }, });
