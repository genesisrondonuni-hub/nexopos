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

export type ReconciliationChoice = "LOCAL" | "REMOTE";
export type SnapshotConflict = { id: string; storageKey: string; label: string; local: string; remote: string };

type StoredDocument = Record<string, unknown>;

function parseDocument(value: string) {
  try { const parsed = JSON.parse(value); return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as StoredDocument : null; } catch { return null; }
}

function indexedRecords(value: unknown) {
  return Array.isArray(value) && value.every((entry) => entry && typeof entry === "object" && typeof (entry as { id?: unknown }).id === "string") ? new Map(value.map((entry) => [(entry as { id: string }).id, entry])) : null;
}

export function findSnapshotConflicts(local: OperationSnapshotPayload, remote: OperationSnapshotPayload): SnapshotConflict[] {
  const localRecords = new Map(local.records);
  const remoteRecords = new Map(remote.records);
  const conflicts: SnapshotConflict[] = [];
  OPERATION_SNAPSHOT_KEYS.forEach((storageKey) => {
    const localValue = localRecords.get(storageKey);
    const remoteValue = remoteRecords.get(storageKey);
    if (!localValue || !remoteValue || localValue === remoteValue) return;
    const localDocument = parseDocument(localValue);
    const remoteDocument = parseDocument(remoteValue);
    if (!localDocument || !remoteDocument) { conflicts.push({ id: `${storageKey}:document`, storageKey, label: "Configuración del módulo", local: localValue, remote: remoteValue }); return; }
    const collections = new Set([...Object.keys(localDocument), ...Object.keys(remoteDocument)]);
    let foundCollection = false;
    collections.forEach((collection) => {
      const localItems = indexedRecords(localDocument[collection]);
      const remoteItems = indexedRecords(remoteDocument[collection]);
      if (!localItems || !remoteItems) return;
      foundCollection = true;
      new Set([...localItems.keys(), ...remoteItems.keys()]).forEach((id) => {
        const left = localItems.get(id);
        const right = remoteItems.get(id);
        if (left && right && JSON.stringify(left) !== JSON.stringify(right)) conflicts.push({ id: `${storageKey}:${collection}:${id}`, storageKey, label: `${collection} · ${id}`, local: JSON.stringify(left), remote: JSON.stringify(right) });
      });
    });
    if (!foundCollection) conflicts.push({ id: `${storageKey}:document`, storageKey, label: "Configuración del módulo", local: localValue, remote: remoteValue });
  });
  return conflicts;
}

export function reconcileOperationSnapshots(local: OperationSnapshotPayload, remote: OperationSnapshotPayload, choices: Record<string, ReconciliationChoice>): OperationSnapshotPayload {
  const remoteRecords = new Map(remote.records);
  const conflicts = new Map(findSnapshotConflicts(local, remote).map((entry) => [entry.id, entry]));
  const records = local.records.map(([storageKey, localValue]): [string, string] => {
    const remoteValue = remoteRecords.get(storageKey);
    if (!remoteValue || localValue === remoteValue) return [storageKey, localValue];
    const localDocument = parseDocument(localValue);
    const remoteDocument = parseDocument(remoteValue);
    const documentChoice = choices[`${storageKey}:document`] ?? "LOCAL";
    if (!localDocument || !remoteDocument || conflicts.has(`${storageKey}:document`)) return [storageKey, documentChoice === "REMOTE" ? remoteValue : localValue];
    const result: StoredDocument = { ...localDocument };
    Object.keys(remoteDocument).forEach((collection) => {
      const localItems = indexedRecords(localDocument[collection]);
      const remoteItems = indexedRecords(remoteDocument[collection]);
      if (!localItems || !remoteItems) return;
      const merged = new Map(localItems);
      remoteItems.forEach((remoteItem, id) => {
        const localItem = localItems.get(id);
        const conflictId = `${storageKey}:${collection}:${id}`;
        if (!localItem || (conflicts.has(conflictId) && choices[conflictId] === "REMOTE")) merged.set(id, remoteItem);
      });
      result[collection] = [...merged.values()];
    });
    return [storageKey, JSON.stringify(result)];
  });
  return { schemaVersion: 1, capturedAt: new Date().toISOString(), records };
}

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
