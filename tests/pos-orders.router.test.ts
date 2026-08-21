import { beforeEach, describe, expect, it } from "vitest";

import { appRouter } from "../server/routers";
import { resetNexoStore } from "../server/nexo-store";
import type { TrpcContext } from "../server/_core/context";

function createCaller() {
  const ctx = {
    user: null,
    req: { protocol: "https", headers: {} },
    res: { clearCookie: () => undefined },
  } as unknown as TrpcContext;
  return appRouter.createCaller(ctx);
}

describe("endpoints operativos de NexoPOS", () => {
  beforeEach(() => resetNexoStore());

  it("abre caja y confirma una venta con pago dividido", async () => {
    const caller = createCaller();
    const session = await caller.pos.openCashSession({ businessId: "nexo-cafe", employeeId: "cashier-1", openingBalance: 150000 });
    const result = await caller.pos.checkout({
      businessId: "nexo-cafe", sessionId: session.id, employeeId: "cashier-1", tip: 500,
      items: [
        { productId: "p-arepa", name: "Arepa de queso", quantity: 2, unitPrice: 8500, isFreeSale: false },
        { productId: "p-limo", name: "Limonada natural", quantity: 1, unitPrice: 7500, isFreeSale: false },
        { name: "Servicio de empaque", quantity: 1, unitPrice: 1000, isFreeSale: true },
      ],
      payments: [{ method: "CASH", amount: 13000 }, { method: "CARD", amount: 13000 }],
    });
    expect(result.order.status).toBe("PAID");
    expect(result.order.total).toBe(26000);
    expect(result.inventoryUpdated).toContainEqual({ productId: "p-arepa", remaining: 30 });
  });

  it("crea una orden de catálogo y permite avanzar su estado", async () => {
    const caller = createCaller();
    const created = await caller.orders.create({
      businessId: "nexo-cafe", customerName: "Laura Gómez", customerPhone: "3005550183", deliveryMethod: "DELIVERY",
      items: [{ productId: "p-bowl", name: "Bowl campesino", quantity: 1, unitPrice: 21500, isFreeSale: false }],
    });
    const processing = await caller.orders.updateStatus({ orderId: created.order.id, status: "PROCESSING" });
    expect(created.whatsappMessage).toContain("Laura Gómez");
    expect(processing.status).toBe("PROCESSING");
  });
});
