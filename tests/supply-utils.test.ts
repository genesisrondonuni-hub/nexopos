import { describe, expect, it } from "vitest";

import { previewSupplierReceiptRows } from "../shared/supply-import";
import { nextPurchaseOrderStatus, reorderProducts, suggestedReorderQuantity } from "../shared/supply-utils";

describe("abastecimiento", () => {
  it("genera sugerencias de reposición solo para existencias en mínimo", () => {
    const products = [{ id: "p", code: "A-1", name: "Arroz", description: "", category: "Despensa", price: 1, cost: 1, stock: 2, minStock: 5, showInCatalog: true, type: "FINAL" as const }, { id: "s", code: "S-1", name: "Servicio", description: "", category: "Servicios", price: 1, cost: 0, stock: 0, minStock: 0, showInCatalog: false, type: "SERVICE" as const }];
    expect(reorderProducts(products)).toHaveLength(1);
    expect(suggestedReorderQuantity(products[0]!)).toBe(8);
  });

  it("avanza el despacho desde borrador hasta despacho", () => {
    expect(nextPurchaseOrderStatus("BORRADOR")).toBe("ENVIADO");
    expect(nextPurchaseOrderStatus("ENVIADO")).toBe("EN_DESPACHO");
    expect(nextPurchaseOrderStatus("EN_DESPACHO")).toBeUndefined();
  });

  it("lee una hoja de recepción con código, cantidad y costo", () => {
    const preview = previewSupplierReceiptRows([["Código", "Nombre", "Cantidad", "Costo"], ["AR-01", "Arroz", "12", "4500"], ["", "Aceite", "0", "8000"]]);
    expect(preview.lines).toEqual([{ code: "AR-01", name: "Arroz", quantity: 12, unitCost: 4500 }]);
    expect(preview.issues.some((issue) => issue.severity === "error")).toBe(true);
  });
});
