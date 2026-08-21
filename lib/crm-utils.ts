import type { DeliveryPreferences } from "@/shared/crm-types";

export function calculateDeliveryFee(subtotal: number, preferences: DeliveryPreferences, delivery: "Recogida" | "Domicilio") {
  if (delivery !== "Domicilio" || !preferences.enabled) return 0;
  if (subtotal >= preferences.freeShippingAbove) return 0;
  return Math.max(0, preferences.baseFee);
}
