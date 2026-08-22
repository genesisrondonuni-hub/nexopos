import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Card, colors, formatCOP, MetricCard, PrimaryButton, SectionTitle, StatusPill } from "@/components/nexo-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useNexo } from "@/lib/pos-store";
import { useBusiness } from "@/lib/business-store";
import { BUSINESS_EXPERIENCES } from "@/shared/business-experience";

function ActivityRow({ title, detail, amount, status }: { title: string; detail: string; amount: number; status: "PENDIENTE" | "EN PROCESO" | "PAGADO" | "ARCHIVADO" }) {
  return (
    <View style={styles.activityRow}>
      <View style={styles.activityIcon}><MaterialIcons name="receipt-long" size={18} color={colors.green} /></View>
      <View style={styles.activityCopy}><Text style={styles.activityTitle}>{title}</Text><Text style={styles.activityDetail}>{detail}</Text></View>
      <View style={styles.activityEnd}><Text style={styles.activityAmount}>{formatCOP(amount)}</Text><StatusPill status={status} /></View>
    </View>
  );
}

export default function DashboardScreen() {
  const { summary, orders, products } = useNexo();
  const { configuration, profile } = useBusiness();
  const experience = BUSINESS_EXPERIENCES[profile.id];
  const lowStock = products.filter((product) => product.stock <= product.minStock).length;

  return (
    <ScreenContainer containerClassName="bg-[#F6F3EE]" className="px-5">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View><Text style={[styles.eyebrow, { color: experience.accent }]}>{profile.shortLabel.toUpperCase()} · OPERACIÓN DE HOY</Text><Text style={styles.title}>Hola, {configuration.businessName}</Text></View>
          <View style={[styles.avatar, { backgroundColor: experience.accent }]}><Text style={styles.avatarText}>{configuration.businessName.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase()}</Text></View>
        </View>

        <View style={[styles.cashBanner, { backgroundColor: experience.accent }]}>
          <View style={styles.cashIcon}><MaterialIcons name={profile.icon as never} size={20} color={colors.white} /></View>
          <View style={styles.cashCopy}><Text style={styles.cashTitle}>{experience.posLabel}</Text><Text style={styles.cashDescription}>{experience.headline}</Text></View>
          <View><Text style={styles.cashAmount}>{formatCOP(150000)}</Text><Text style={styles.cashLabel}>Base inicial</Text></View>
        </View>

        <View style={styles.metrics}>
          <MetricCard label="Ventas de hoy" value={formatCOP(summary.sales, true)} icon="trending-up" helper="12,4% vs. ayer" />
          <MetricCard label="Utilidad" value={formatCOP(summary.profit, true)} icon="account-balance-wallet" tone="ink" helper="Margen: 73%" />
          <MetricCard label="Pedidos" value={String(summary.orders)} icon="receipt-long" tone="gold" helper={`${orders.filter((order) => order.status === "PENDIENTE").length} por atender`} />
          <MetricCard label="Gastos" value={formatCOP(summary.expenses, true)} icon="payments" tone="ink" helper="Dentro de meta" />
        </View>

        <View style={styles.actionBlock}>
          <PrimaryButton label="Nueva venta" icon="add-shopping-cart" onPress={() => router.push("/pos")} />
          <PrimaryButton label="Análisis de productos" icon="insights" onPress={() => router.push("/sales-analytics" as never)} />
          <View style={styles.secondaryAction}><Text style={styles.secondaryText}>{lowStock ? `${lowStock} productos requieren atención de inventario` : "Inventario actualizado"}</Text><MaterialIcons name={lowStock ? "warning-amber" : "check-circle"} size={17} color={lowStock ? colors.gold : colors.green} /></View>
        </View>

        <SectionTitle title="Actividad reciente" action="Ver pedidos" onAction={() => router.push("/orders")} />
        <Card style={styles.activityCard}>
          {orders[0] ? <ActivityRow title={`${orders[0].code} · ${orders[0].customerName}`} detail={`${orders[0].source} · ${orders[0].createdAt}`} amount={orders[0].total} status={orders[0].status} /> : null}
          {orders[1] ? <ActivityRow title={`${orders[1].code} · ${orders[1].customerName}`} detail={`${orders[1].source} · ${orders[1].createdAt}`} amount={orders[1].total} status={orders[1].status} /> : null}
        </Card>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: 20, paddingBottom: 112, paddingTop: 14 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  eyebrow: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 0.6 },
  title: { color: colors.ink, fontSize: 28, fontWeight: "800", letterSpacing: -0.7, marginTop: 4 },
  avatar: { alignItems: "center", backgroundColor: colors.ink, borderRadius: 18, height: 44, justifyContent: "center", width: 44 },
  avatarText: { color: colors.white, fontSize: 13, fontWeight: "800" },
  cashBanner: { alignItems: "center", backgroundColor: colors.ink, borderRadius: 18, flexDirection: "row", gap: 11, padding: 15 },
  cashIcon: { alignItems: "center", backgroundColor: "#2C554A", borderRadius: 12, height: 40, justifyContent: "center", width: 40 },
  cashCopy: { flex: 1 },
  cashTitle: { color: colors.white, fontSize: 14, fontWeight: "800" },
  cashDescription: { color: "#B9C9C3", fontSize: 11, marginTop: 2 },
  cashAmount: { color: colors.white, fontSize: 13, fontWeight: "800", textAlign: "right" },
  cashLabel: { color: "#B9C9C3", fontSize: 10, marginTop: 2, textAlign: "right" },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "space-between" },
  actionBlock: { gap: 10 },
  secondaryAction: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.line, borderRadius: 13, borderWidth: 1, flexDirection: "row", gap: 8, justifyContent: "center", minHeight: 42 },
  secondaryText: { color: colors.ink, fontSize: 12, fontWeight: "700" },
  activityCard: { paddingBottom: 3, paddingTop: 3 },
  activityRow: { alignItems: "center", flexDirection: "row", gap: 11, minHeight: 74 },
  activityIcon: { alignItems: "center", backgroundColor: colors.mint, borderRadius: 12, height: 38, justifyContent: "center", width: 38 },
  activityCopy: { flex: 1 },
  activityTitle: { color: colors.ink, fontSize: 13, fontWeight: "800" },
  activityDetail: { color: colors.muted, fontSize: 11, marginTop: 3 },
  activityEnd: { alignItems: "flex-end", gap: 5 },
  activityAmount: { color: colors.ink, fontSize: 12, fontWeight: "800" },
});
