import { describe, expect, it } from "vitest";

import { findSnapshotConflicts, reconcileOperationSnapshots, type OperationSnapshotPayload } from "../shared/operation-snapshot";

const local: OperationSnapshotPayload = { schemaVersion: 1, capturedAt: "2026-08-22T10:00:00.000Z", records: [["@nexopos:operacion:v1", JSON.stringify({ products: [{ id: "p-1", name: "Local" }, { id: "p-2", name: "Solo local" }], orders: [] })]] };
const remote: OperationSnapshotPayload = { schemaVersion: 1, capturedAt: "2026-08-22T11:00:00.000Z", records: [["@nexopos:operacion:v1", JSON.stringify({ products: [{ id: "p-1", name: "Remoto" }, { id: "p-3", name: "Solo remoto" }], orders: [] })]] };

describe("conciliación de respaldos", () => {
  it("identifica cambios simultáneos del mismo registro", () => {
    expect(findSnapshotConflicts(local, remote)).toMatchObject([{ id: "@nexopos:operacion:v1:products:p-1" }]);
  });

  it("conserva las altas independientes y aplica la decisión por registro", () => {
    const merged = reconcileOperationSnapshots(local, remote, { "@nexopos:operacion:v1:products:p-1": "REMOTE" });
    const value = JSON.parse(merged.records[0][1]) as { products: Array<{ id: string; name: string }> };
    expect(value.products).toEqual(expect.arrayContaining([{ id: "p-1", name: "Remoto" }, { id: "p-2", name: "Solo local" }, { id: "p-3", name: "Solo remoto" }]));
  });
});
