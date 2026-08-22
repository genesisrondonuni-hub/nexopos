export const OPERATION_SNAPSHOT_KEYS = [
  "@nexopos:business-profile:v1",
  "@nexopos:operacion:v1",
  "@nexopos:crm:v1",
  "@nexopos:supply:v1",
] as const;

export type OperationSnapshotPayload = {
  schemaVersion: 1;
  capturedAt: string;
  records: Array<[string, string]>;
};

export function createOperationSnapshot(records: ReadonlyArray<readonly [string, string | null]>): OperationSnapshotPayload {
  const validRecords = records.reduce<Array<[string, string]>>((current, [key, value]) => typeof value === "string" && OPERATION_SNAPSHOT_KEYS.includes(key as typeof OPERATION_SNAPSHOT_KEYS[number]) ? [...current, [key, value]] : current, []);
  return { schemaVersion: 1, capturedAt: new Date().toISOString(), records: validRecords };
}

export function parseOperationSnapshot(value: string): OperationSnapshotPayload | null {
  try {
    const parsed = JSON.parse(value) as Partial<OperationSnapshotPayload>;
    if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.records) || typeof parsed.capturedAt !== "string") return null;
    const valid = parsed.records.every((record) => Array.isArray(record) && record.length === 2 && typeof record[0] === "string" && typeof record[1] === "string" && OPERATION_SNAPSHOT_KEYS.includes(record[0] as typeof OPERATION_SNAPSHOT_KEYS[number]));
    return valid ? { schemaVersion: 1, capturedAt: parsed.capturedAt, records: parsed.records as Array<[string, string]> } : null;
  } catch {
    return null;
  }
}
