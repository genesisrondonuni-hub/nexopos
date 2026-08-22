import { describe, expect, it } from "vitest";

import { createOperationSnapshot, parseOperationSnapshot } from "../shared/operation-snapshot";

describe("respaldo de operación", () => {
  it("incluye solo los registros operativos permitidos", () => {
    const snapshot = createOperationSnapshot([["@nexopos:operacion:v1", "{\"orders\":[]}"], ["otro", "secreto"]]);
    expect(snapshot.records).toEqual([["@nexopos:operacion:v1", "{\"orders\":[]}"]]);
  });

  it("rechaza esquemas o claves no permitidas al restaurar", () => {
    expect(parseOperationSnapshot(JSON.stringify({ schemaVersion: 1, capturedAt: "2026-08-22", records: [["otro", "x"]] }))).toBeNull();
    expect(parseOperationSnapshot(JSON.stringify(createOperationSnapshot([["@nexopos:crm:v1", "{}"]])))).not.toBeNull();
  });
});
