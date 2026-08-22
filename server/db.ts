import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";

import { InsertUser, operationSnapshots, users } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); } catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  (["name", "email", "loginMethod"] as const).forEach((field) => { if (user[field] !== undefined) { values[field] = user[field] ?? null; updateSet[field] = user[field] ?? null; } });
  values.lastSignedIn = user.lastSignedIn ?? new Date(); updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; } else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getOperationSnapshot(userId: number, businessKey: string) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const result = await db.select().from(operationSnapshots).where(and(eq(operationSnapshots.userId, userId), eq(operationSnapshots.businessKey, businessKey))).limit(1);
  return result[0] ?? null;
}

export async function saveOperationSnapshot(input: { userId: number; businessKey: string; expectedRevision: number; payload: string }) {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_UNAVAILABLE");
  const current = await getOperationSnapshot(input.userId, input.businessKey);
  const currentRevision = current?.revision ?? 0;
  if (currentRevision !== input.expectedRevision) return { conflict: true as const, revision: currentRevision };
  const revision = currentRevision + 1;
  if (current) {
    await db.update(operationSnapshots).set({ payload: input.payload, revision, updatedAt: new Date() }).where(eq(operationSnapshots.id, current.id));
  } else {
    await db.insert(operationSnapshots).values({ userId: input.userId, businessKey: input.businessKey, payload: input.payload, revision });
  }
  return { conflict: false as const, revision };
}
