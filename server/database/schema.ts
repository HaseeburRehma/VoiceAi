// server/database/schema.ts - Fixed version
import crypto from "node:crypto";
import { sql } from "drizzle-orm/sql";
import { sqliteTable, text, unique } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomBytes(12).toString("hex")),
  name: text("name").notNull(),
  username: text("username").notNull(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  avatar: text("avatar"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`)
    .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
}, (table) => ({
  usernameUnique: unique("users_username_unique").on(table.username),
  emailUnique: unique("users_email_unique").on(table.email),
}));

export const notes = sqliteTable("notes", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => "nt_" + crypto.randomBytes(12).toString("hex")),
  text: text("text").notNull(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`)
    .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
  audioUrls: text("audio_urls", { mode: "json" }).$type<string[]>().default("[]"),
  callerName: text("caller_name").notNull(),
  callerEmail: text("caller_email").notNull(),
  callerLocation: text("caller_location").notNull(),
  callerAddress: text("caller_address").notNull(),
  callReason: text("call_reason").notNull(),
});

// Relations
import { relations } from "drizzle-orm/relations";

export const notesRelations = relations(notes, ({one}) => ({
  user: one(users, {
    fields: [notes.userId],
    references: [users.id]
  }),
}));

export const usersRelations = relations(users, ({many}) => ({
  notes: many(notes),
}));