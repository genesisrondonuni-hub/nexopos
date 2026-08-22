import type { DeliveryPreferences } from "@/shared/crm-types";
import type { AgentServicePolicy } from "@/shared/crm-types";

export function calculateDeliveryFee(subtotal: number, preferences: DeliveryPreferences, delivery: "Recogida" | "Domicilio") {
  if (delivery !== "Domicilio" || !preferences.enabled) return 0;
  if (subtotal >= preferences.freeShippingAbove) return 0;
  return Math.max(0, preferences.baseFee);
}

export function isServiceAvailable(policy: AgentServicePolicy, now = new Date()) {
  if (!policy.enabled) return false;
  const dateParts = new Intl.DateTimeFormat("en-US", { timeZone: policy.timezone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const part = (type: string) => dateParts.find((entry) => entry.type === type)?.value ?? "";
  const weekday = part("weekday");
  if (weekday === "Sat" && !policy.servesSaturday) return false;
  if (weekday === "Sun" && !policy.servesSunday) return false;
  const toMinutes = (value: string) => { const [hour, minute] = value.split(":").map(Number); return hour * 60 + minute; };
  const current = Number(part("hour")) * 60 + Number(part("minute"));
  const opening = toMinutes(policy.opensAt);
  const closing = toMinutes(policy.closesAt);
  return opening <= closing ? current >= opening && current < closing : current >= opening || current < closing;
}

export function cancellationAllowed(policy: AgentServicePolicy, minutesSinceOrder: number) {
  return policy.allowPendingCancellation && Number.isFinite(minutesSinceOrder) && minutesSinceOrder >= 0 && minutesSinceOrder <= policy.cancellationWindowMinutes;
}
