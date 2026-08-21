import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";

import { Card, colors, PrimaryButton, SectionTitle } from "@/components/nexo-ui";
import { ScreenContainer } from "@/components/screen-container";
import { BUSINESS_PROFILES, useBusiness } from "@/lib/business-store";
import { haptic } from "@/lib/haptics";
import type { BusinessFeatures, BusinessProfileDefinition } from "@/shared/business-types";

function FeatureToggle({ icon, label, value, onChange }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; value: boolean; onChange: (value: boolean) => void }) {
  return <View style={styles.featureRow}><View style={styles.featureIcon}><MaterialIcons name={icon} size={17} color={colors.green} /></View><Text style={styles.featureLabel}>{label}</Text><Switch value={value} onValueChange={onChange} trackColor={{ false: "#D6DEDA", true: "#8FCEBA" }} thumbColor={value ? colors.green : colors.white} /></View>;
}

export default function BusinessProfileScreen() {
  const { configuration, profile, selectProfile, updateBusinessName, updateFeatures } = useBusiness();
  const [name, setName] = useState(configuration.businessName);
  const renderProfile = ({ item }: { item: BusinessProfileDefinition }) => {
    const selected = item.id === profile.id;
    return <Pressable onPress={() => { haptic.medium(); selectProfile(item.id); }} style={({ pressed }) => [styles.profileCard, selected && styles.profileSelected, pressed && styles.pressed]}><View style={[styles.profileIcon, { backgroundColor: selected ? colors.green : colors.mint }]}><MaterialIcons name={item.icon} size={23} color={selected ? colors.white : colors.green} /></View><View style={styles.profileCopy}><Text style={styles.profileName}>{item.label}</Text><Text style={styles.profileDescription}>{item.description}</Text></View>{selected ? <MaterialIcons name="check-circle" size={21} color={colors.green} /> : <MaterialIcons name="chevron-right" size={21} color={colors.muted} />}</Pressable>;
  };
  const featureChange = (feature: keyof BusinessFeatures, value: boolean) => updateFeatures({ [feature]: value });
  return <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#F6F3EE]" className="px-5"><FlatList data={BUSINESS_PROFILES} renderItem={renderProfile} keyExtractor={(item) => item.id} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} ListHeaderComponent={<><View style={styles.header}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><MaterialIcons name="arrow-back" size={21} color={colors.ink} /></Pressable><View><Text style={styles.eyebrow}>ADMINISTRACIÓN</Text><Text style={styles.title}>Perfil de negocio</Text></View></View><Card style={styles.intro}><MaterialIcons name="business-center" size={22} color={colors.green} /><Text style={styles.introText}>Elige el perfil que mejor describe tu operación. Luego puedes ajustar cada módulo a tu medida.</Text></Card><Text style={styles.label}>Nombre visible del negocio</Text><TextInput value={name} onChangeText={setName} onEndEditing={() => updateBusinessName(name)} placeholder="Nombre de tu negocio" placeholderTextColor={colors.muted} returnKeyType="done" style={styles.input} /><SectionTitle title="Tipo de negocio" /></>} ListFooterComponent={<View style={styles.footer}><SectionTitle title="Módulos activos" /><Card style={styles.features}><FeatureToggle icon="restaurant-menu" label="Recetas y productos compuestos" value={configuration.features.recipes} onChange={(value) => featureChange("recipes", value)} /><FeatureToggle icon="table-restaurant" label="Mesas y atención de salón" value={configuration.features.tables} onChange={(value) => featureChange("tables", value)} /><FeatureToggle icon="qr-code-scanner" label="Código de barras" value={configuration.features.barcode} onChange={(value) => featureChange("barcode", value)} /><FeatureToggle icon="sell" label="Precios mayoristas" value={configuration.features.wholesalePricing} onChange={(value) => featureChange("wholesalePricing", value)} /><FeatureToggle icon="two-wheeler" label="Delivery" value={configuration.features.delivery} onChange={(value) => featureChange("delivery", value)} /><FeatureToggle icon="storefront" label="Catálogo público" value={configuration.features.catalog} onChange={(value) => featureChange("catalog", value)} /><FeatureToggle icon="verified-user" label="Validación de edad" value={configuration.features.ageCheck} onChange={(value) => featureChange("ageCheck", value)} /><FeatureToggle icon="scale" label="Productos por peso" value={configuration.features.weightedProducts} onChange={(value) => featureChange("weightedProducts", value)} /></Card><Text style={styles.categoryCaption}>Categorías sugeridas: {configuration.suggestedCategories.join(" · ")}</Text><PrimaryButton label="Guardar perfil" icon="check-circle" onPress={() => { updateBusinessName(name); haptic.success(); Alert.alert("Perfil actualizado", "La configuración se guardó y se aplicará a los módulos de NexoPOS.", [{ text: "Listo", onPress: () => router.back() }]); }} /></View>} /></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { gap: 10, paddingBottom: 18, paddingTop: 8 },
  header: { alignItems: "center", flexDirection: "row", gap: 12, marginBottom: 4 },
  back: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.line, borderRadius: 13, borderWidth: 1, height: 42, justifyContent: "center", width: 42 },
  eyebrow: { color: colors.muted, fontSize: 10, fontWeight: "800", letterSpacing: 0.7 },
  title: { color: colors.ink, fontSize: 23, fontWeight: "800", letterSpacing: -0.5, marginTop: 2 },
  intro: { alignItems: "center", backgroundColor: colors.mint, borderColor: "#B5E0CF", flexDirection: "row", gap: 10, padding: 13 },
  introText: { color: colors.ink, flex: 1, fontSize: 11, lineHeight: 16 },
  label: { color: colors.ink, fontSize: 12, fontWeight: "800", marginTop: 4 },
  input: { backgroundColor: colors.white, borderColor: colors.line, borderRadius: 12, borderWidth: 1, color: colors.ink, fontSize: 14, fontWeight: "700", minHeight: 48, paddingHorizontal: 13 },
  profileCard: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.line, borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 11, minHeight: 75, padding: 11 },
  profileSelected: { borderColor: colors.green, borderWidth: 1.5 },
  profileIcon: { alignItems: "center", borderRadius: 13, height: 45, justifyContent: "center", width: 45 },
  profileCopy: { flex: 1 },
  profileName: { color: colors.ink, fontSize: 14, fontWeight: "800" },
  profileDescription: { color: colors.muted, fontSize: 10, lineHeight: 14, marginTop: 3 },
  footer: { gap: 12, marginTop: 4 },
  features: { paddingBottom: 0, paddingTop: 0 },
  featureRow: { alignItems: "center", borderBottomColor: colors.line, borderBottomWidth: 1, flexDirection: "row", gap: 9, minHeight: 56 },
  featureIcon: { alignItems: "center", backgroundColor: colors.mint, borderRadius: 9, height: 30, justifyContent: "center", width: 30 },
  featureLabel: { color: colors.ink, flex: 1, fontSize: 11, fontWeight: "700" },
  categoryCaption: { color: colors.muted, fontSize: 10, lineHeight: 15 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] },
});
