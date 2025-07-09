const crypto = require('crypto');
const { sql } = require('drizzle-orm/sql');
const { sqliteTable, text, unique } = require('drizzle-orm/sqlite-core');
const { relations } = require('drizzle-orm/relations');

const users = sqliteTable("users", {
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

const notes = sqliteTable("notes", {
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
  audioUrls: text("audio_urls", { mode: "json" }).default("[]"),
  callerName: text("caller_name").notNull(),
  callerEmail: text("caller_email").notNull(),
  callerLocation: text("caller_location").notNull(),
  callerAddress: text("caller_address").notNull(),
  callReason: text("call_reason").notNull(),
});

// Relations
const notesRelations = relations(notes, ({one}) => ({
  user: one(users, {
    fields: [notes.userId],
    references: [users.id]
  }),
}));

const usersRelations = relations(users, ({many}) => ({
  notes: many(notes),
}));

module.exports = {
  users,
  notes,
  notesRelations,
  usersRelations
};