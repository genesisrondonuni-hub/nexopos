import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { Card, colors, PrimaryButton, SoftButton } from "@/components/nexo-ui";
import { ScreenContainer } from "@/components/screen-container";
import { getLoginUrl, startOAuthLogin } from "@/constants/oauth";
import { useAuth } from "@/hooks/use-auth";
import { trpc } from "@/lib/trpc";
import { createOperationSnapshot, OPERATION_SNAPSHOT_KEYS, parseOperationSnapshot } from "@/shared/operation-snapshot";

const BUSINESS_KEY = "principal";

export default function SyncSettingsScreen() {
  const { user, loading: authLoading, refresh } = useAuth();
  const [working, setWorking] = useState<"upload" | "restore" | null>(null);
  const snapshot = trpc.sync.get.useQuery({ businessKey: BUSINESS_KEY }, { enabled: Boolean(user) });
  const saveSnapshot = trpc.sync.save.useMutation();

  const login = async () => {
    if (!getLoginUrl()) { Alert.alert("Inicio de sesión no disponible", "La configuración de autenticación estará disponible al ejecutar la aplicación publicada."); return; }
    await startOAuthLogin();
    void refresh();
  };
  const upload = async () => {
    if (!user) return;
    setWorking("upload");
    try {
      const records = await AsyncStorage.multiGet(OPERATION_SNAPSHOT_KEYS);
      const payload = JSON.stringify(createOperationSnapshot(records));
      if (payload.length > 750000) { Alert.alert("Respaldo muy grande", "Reduce imágenes o históricos locales antes de sincronizar."); return; }
      const result = await saveSnapshot.mutateAsync({ businessKey: BUSINESS_KEY, expectedRevision: snapshot.data?.revision ?? 0, payload });
      await snapshot.refetch();
      Alert.alert("Respaldo actualizado", `La operación de este equipo se guardó en la nube con versión ${result.revision}.`);
    } catch (error) {
      Alert.alert("No se pudo respaldar", error instanceof Error ? error.message : "Verifica tu conexión e intenta de nuevo.");
    } finally { setWorking(null); }
  };
  const restore = async () => {
    if (!snapshot.data?.payload) { Alert.alert("Sin respaldo", "Todavía no hay una copia remota para este negocio."); return; }
    const parsed = parseOperationSnapshot(snapshot.data.payload);
    if (!parsed) { Alert.alert("Respaldo inválido", "La copia remota no tiene una estructura compatible."); return; }
    Alert.alert("Restaurar operación", "Se reemplazarán los datos locales de negocio, ventas, CRM y abastecimiento por la copia remota. Después reinicia la aplicación.", [{ text: "Cancelar", style: "cancel" }, { text: "Restaurar", style: "destructive", onPress: async () => {
      setWorking("restore");
      try { await AsyncStorage.multiSet(parsed.records); Alert.alert("Datos restaurados", `Copia creada el ${new Date(parsed.capturedAt).toLocaleString("es-VE")}. Cierra y abre NexoPOS para cargarla.`); } catch { Alert.alert("No se pudo restaurar", "Los datos locales no fueron modificados completamente. Intenta de nuevo."); } finally { setWorking(null); }
    }}]);
  };
  const lastBackup = snapshot.data?.updatedAt ? new Date(snapshot.data.updatedAt).toLocaleString("es-VE") : "Aún no hay respaldo";
  return <ScreenContainer edges={["top", "bottom", "left", "right"]} containerClassName="bg-[#F6F3EE]" className="px-5"><View style={styles.content}><View style={styles.header}><Pressable onPress={() => router.back()} style={({ pressed }) => [styles.back, pressed && styles.pressed]}><MaterialIcons name="arrow-back" size={21} color={colors.ink} /></Pressable><View><Text style={styles.eyebrow}>DATOS DEL NEGOCIO</Text><Text style={styles.title}>Respaldo y sincronización</Text></View></View><Card style={styles.hero}><View style={styles.heroIcon}><MaterialIcons name="cloud-sync" size={25} color={colors.green} /></View><View style={styles.heroCopy}><Text style={styles.heroTitle}>Operación protegida</Text><Text style={styles.heroText}>Mantén una copia versionada de ventas, inventario, caja, CRM y proveedores. La operación local sigue disponible sin conexión.</Text></View></Card>{authLoading ? <ActivityIndicator color={colors.green} /> : !user ? <Card style={styles.account}><MaterialIcons name="lock-outline" size={21} color={colors.gold} /><View style={styles.accountCopy}><Text style={styles.accountTitle}>Cuenta requerida para respaldar</Text><Text style={styles.accountText}>Inicia sesión para vincular el respaldo a tu cuenta. Los datos no se exponen en el repositorio público.</Text></View><SoftButton label="Iniciar sesión" icon="login" onPress={() => void login()} /></Card> : <><Card style={styles.account}><View style={styles.userIcon}><MaterialIcons name="verified-user" size={19} color={colors.green} /></View><View style={styles.accountCopy}><Text style={styles.accountTitle}>{user.name || "Cuenta autenticada"}</Text><Text style={styles.accountText}>{user.email || "Respaldo vinculado"}</Text></View></Card><Card style={styles.status}><View><Text style={styles.statusLabel}>Última copia remota</Text><Text style={styles.statusValue}>{lastBackup}</Text></View><View style={styles.statusBadge}><Text style={styles.statusBadgeText}>V{snapshot.data?.revision ?? 0}</Text></View></Card><PrimaryButton label={working === "upload" ? "Guardando respaldo…" : "Respaldar este equipo"} icon="cloud-upload" disabled={Boolean(working) || saveSnapshot.isPending} onPress={() => void upload()} /><SoftButton label={working === "restore" ? "Restaurando…" : "Restaurar desde la nube"} icon="cloud-download" onPress={() => void restore()} /></>}<Card style={styles.notice}><MaterialIcons name="info-outline" size={18} color={colors.gold} /><Text style={styles.noticeText}>Cuando dos equipos modifican datos, descarga primero la copia más reciente antes de subir cambios. Esta primera etapa crea copias versionadas; la conciliación automática por registro se implementará antes de usar varias cajas en simultáneo.</Text></Card></View></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { gap: 11, paddingTop: 10 }, header: { alignItems: "center", flexDirection: "row", gap: 11, marginBottom: 4 }, back: { alignItems: "center", backgroundColor: colors.white, borderColor: colors.line, borderRadius: 13, borderWidth: 1, height: 42, justifyContent: "center", width: 42 }, eyebrow: { color: colors.muted, fontSize: 9, fontWeight: "900", letterSpacing: 0.8 }, title: { color: colors.ink, fontSize: 21, fontWeight: "800", marginTop: 2 }, hero: { alignItems: "flex-start", backgroundColor: colors.mint, borderColor: "#B5E0CF", flexDirection: "row", gap: 10, padding: 13 }, heroIcon: { alignItems: "center", backgroundColor: colors.white, borderRadius: 12, height: 42, justifyContent: "center", width: 42 }, heroCopy: { flex: 1 }, heroTitle: { color: colors.ink, fontSize: 13, fontWeight: "800" }, heroText: { color: colors.muted, fontSize: 10, lineHeight: 14, marginTop: 3 }, account: { alignItems: "center", flexDirection: "row", gap: 9, padding: 12 }, accountCopy: { flex: 1 }, accountTitle: { color: colors.ink, fontSize: 12, fontWeight: "800" }, accountText: { color: colors.muted, fontSize: 9, lineHeight: 13, marginTop: 2 }, userIcon: { alignItems: "center", backgroundColor: colors.mint, borderRadius: 10, height: 32, justifyContent: "center", width: 32 }, status: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", padding: 13 }, statusLabel: { color: colors.muted, fontSize: 10, fontWeight: "800" }, statusValue: { color: colors.ink, fontSize: 12, fontWeight: "800", marginTop: 3 }, statusBadge: { alignItems: "center", backgroundColor: colors.mint, borderRadius: 999, minWidth: 36, paddingHorizontal: 8, paddingVertical: 6 }, statusBadgeText: { color: colors.green, fontSize: 10, fontWeight: "900" }, notice: { alignItems: "flex-start", backgroundColor: "#FFF8E8", borderColor: "#F0DCA1", flexDirection: "row", gap: 8, padding: 11 }, noticeText: { color: "#725117", flex: 1, fontSize: 10, lineHeight: 14 }, pressed: { opacity: 0.7, transform: [{ scale: 0.98 }] } });
