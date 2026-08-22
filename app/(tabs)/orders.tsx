import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Card, colors, formatCOP, StatusPill } from "@/components/nexo-ui";
import { ScreenContainer } from "@/components/screen-container";
import { haptic } from "@/lib/haptics";
import { useNexo } from "@/lib/pos-store";
import { useCrm } from "@/lib/crm-store";
import type { Order, OrderStatus } from "@/shared/pos-types";

function nextStatus(current: OrderStatus): OrderStatus { if (current === "PENDIENTE") return "EN PROCESO"; if (current === "EN PROCESO") return "PAGADO"; if (current === "PAGADO") return "ARCHIVADO"; return "ARCHIVADO"; }
function actionLabel(current: OrderStatus) { if (current === "PENDIENTE") return "Preparar"; if (current === "EN PROCESO") return "Marcar pagado"; if (current === "PAGADO") return "Archivar"; return "Archivado"; }

export default function OrdersScreen() {
  const { orders, updateOrderStatus, cancelPendingOrder } = useNexo();
  const { settings } = useCrm();
  const renderOrder = ({ item }: { item: Order }) => <Card style={styles.orderCard}>
    <View style={styles.orderTop}><View><Text style={styles.orderCode}>{item.code}</Text><Text style={styles.customer}>{item.customerName}</Text></View><StatusPill status={item.status} /></View>
    <View style={styles.orderMeta}><View style={styles.metaItem}><MaterialIcons name={item.delivery === "Domicilio" ? "two-wheeler" : item.delivery === "Mesa" ? "table-restaurant" : "shopping-bag"} size={15} color={colors.muted} /><Text style={styles.metaText}>{item.delivery}</Text></View><View style={styles.metaItem}><MaterialIcons name={item.source === "POS" ? "point-of-sale" : "language"} size={15} color={colors.muted} /><Text style={styles.metaText}>{item.source}</Text></View><Text style={styles.metaText}>{item.createdAt}</Text></View>
    <View style={styles.orderBottom}><Text style={styles.total}>{formatCOP(item.total)}</Text><View style={styles.orderActions}>{item.status === "PENDIENTE" && settings.agentPolicy.allowPendingCancellation ? <Pressable onPress={() => Alert.alert("Cancelar pedido", `Se restaurará el inventario de ${item.code}.`, [{ text: "Volver", style: "cancel" }, { text: "Cancelar pedido", style: "destructive", onPress: () => { const result = cancelPendingOrder(item.id, settings.agentPolicy.cancellationWindowMinutes); if (!result.cancelled) Alert.alert("No se pudo cancelar", result.reason); else haptic.success(); } }])} style={({ pressed }) => [styles.cancelAction, pressed && styles.pressed]}><MaterialIcons name="close" size={15} color={colors.coral} /></Pressable> : null}<Pressable disabled={item.status === "ARCHIVADO"} onPress={() => { haptic.medium(); updateOrderStatus(item.id, nextStatus(item.status)); }} style={({ pressed }) => [styles.statusAction, item.status === "ARCHIVADO" && styles.disabledAction, pressed && item.status !== "ARCHIVADO" && styles.pressed]}><Text style={styles.statusActionText}>{item.cancelledAt ? "Cancelado" : actionLabel(item.status)}</Text><MaterialIcons name="arrow-forward" size={15} color={colors.green} /></Pressable></View></View>
  </Card>;
  return <ScreenContainer containerClassName="bg-[#F6F3EE]" className="px-5"><FlatList data={orders} renderItem={renderOrder} keyExtractor={(item) => item.id} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} ListHeaderComponent={<><View style={styles.header}><View><Text style={styles.eyebrow}>OPERACIÓN DEL DÍA</Text><Text style={styles.title}>Pedidos</Text></View><View style={styles.counter}><Text style={styles.counterValue}>{orders.filter((order) => order.status === "PENDIENTE").length}</Text><Text style={styles.counterText}>pendientes</Text></View></View><View style={styles.filters}><View style={styles.filterActive}><Text style={styles.filterActiveText}>Todos</Text></View><View style={styles.filter}><Text style={styles.filterText}>Pendientes</Text></View><View style={styles.filter}><Text style={styles.filterText}>En proceso</Text></View></View></>} /></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { gap: 11, paddingBottom: 110, paddingTop: 14 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  eyebrow: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 0.7 },
  title: { color: colors.ink, fontSize: 28, fontWeight: "800", letterSpacing: -0.7, marginTop: 3 },
  counter: { alignItems: "center", backgroundColor: "#FFF2D4", borderRadius: 14, paddingHorizontal: 13, paddingVertical: 8 },
  counterValue: { color: "#A36E0A", fontSize: 16, fontWeight: "800" },
  counterText: { color: "#A36E0A", fontSize: 9, fontWeight: "800" },
  filters: { flexDirection: "row", gap: 8, marginBottom: 2 },
  filter: { borderColor: colors.line, borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  filterActive: { backgroundColor: colors.ink, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  filterText: { color: colors.muted, fontSize: 11, fontWeight: "800" },
  filterActiveText: { color: colors.white, fontSize: 11, fontWeight: "800" },
  orderCard: { gap: 12, padding: 15 },
  orderTop: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  orderCode: { color: colors.green, fontSize: 12, fontWeight: "800" },
  customer: { color: colors.ink, fontSize: 15, fontWeight: "800", marginTop: 3 },
  orderMeta: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  metaItem: { alignItems: "center", flexDirection: "row", gap: 4 },
  metaText: { color: colors.muted, fontSize: 11, fontWeight: "700" },
  orderBottom: { alignItems: "center", borderTopColor: colors.line, borderTopWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingTop: 11 },
  total: { color: colors.ink, fontSize: 17, fontWeight: "800" },
  orderActions: { alignItems: "center", flexDirection: "row", gap: 7 },
  cancelAction: { alignItems: "center", backgroundColor: "#FDE9E4", borderRadius: 10, height: 34, justifyContent: "center", width: 34 },
  statusAction: { alignItems: "center", backgroundColor: colors.mint, borderRadius: 10, flexDirection: "row", gap: 5, paddingHorizontal: 10, paddingVertical: 8 },
  statusActionText: { color: colors.green, fontSize: 11, fontWeight: "800" },
  disabledAction: { backgroundColor: "#E8ECEA" },
  pressed: { opacity: 0.7, transform: [{ scale: 0.97 }] },
});
