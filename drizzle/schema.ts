import { int, mediumtext, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/** Core user table backing authentication. */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

/**
 * Encrypted-transport snapshot metadata. Payload remains an operational backup,
 * versioned per authenticated owner and business key to detect concurrent edits.
 */
export const operationSnapshots = mysqlTable("operation_snapshots", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  businessKey: varchar("businessKey", { length: 80 }).notNull(),
  revision: int("revision").notNull().default(1),
  payload: mediumtext("payload").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [uniqueIndex("operation_snapshots_user_business_unique").on(table.userId, table.businessKey)]);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type OperationSnapshot = typeof operationSnapshots.$inferSelect;
