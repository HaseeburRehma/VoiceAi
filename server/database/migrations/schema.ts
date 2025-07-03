import { sqliteTable, AnySQLiteColumn, text, foreignKey } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const users = sqliteTable("users", {
	id: text().primaryKey(),
	name: text().notNull(),
	username: text().notNull(),
	password: text().notNull(),
	email: text().notNull(),
	avatar: text(),
	createdAt: text("created_at").default("sql`(CURRENT_TIMESTAMP)`").notNull(),
	updatedAt: text("updated_at").default("sql`(CURRENT_TIMESTAMP)`").notNull(),
});

export const notes = sqliteTable("notes", {
	id: text().primaryKey(),
	text: text().notNull(),
	userId: text("user_id").references(() => users.id),
	createdAt: text("created_at").default("sql`(CURRENT_TIMESTAMP)`").notNull(),
	updatedAt: text("updated_at").default("sql`(CURRENT_TIMESTAMP)`").notNull(),
	audioUrls: text("audio_urls"),
	callerName: text("caller_name").notNull(),
	callerEmail: text("caller_email").notNull(),
	callerLocation: text("caller_location").notNull(),
	callerAddress: text("caller_address").notNull(),
	callReason: text("call_reason").notNull(),
});

