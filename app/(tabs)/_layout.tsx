import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 56 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Resumen",
          tabBarIcon: ({ color }) => <MaterialIcons size={24} name="space-dashboard" color={color} />,
        }}
      />
      <Tabs.Screen name="pos" options={{ title: "Vender", tabBarIcon: ({ color }) => <MaterialIcons size={24} name="point-of-sale" color={color} /> }} />
      <Tabs.Screen name="inventory" options={{ title: "Inventario", tabBarIcon: ({ color }) => <MaterialIcons size={24} name="inventory-2" color={color} /> }} />
      <Tabs.Screen name="orders" options={{ title: "Pedidos", tabBarIcon: ({ color }) => <MaterialIcons size={24} name="receipt-long" color={color} /> }} />
      <Tabs.Screen name="crm" options={{ title: "CRM", tabBarIcon: ({ color }) => <MaterialIcons size={24} name="groups" color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: "Más", tabBarIcon: ({ color }) => <MaterialIcons size={24} name="more-horiz" color={color} /> }} />
    </Tabs>
  );
}
