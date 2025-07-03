// drizzle.d1.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./server/database/schema.ts",
  out:    "./server/database/migrations-d1",
  dialect: "sqlite",
  driver:  "d1-http",            // ← use the D1 HTTP driver
  dbCredentials: {
    accountId:  process.env.CF_ACCOUNT_ID!,
    databaseId: process.env.CF_DATABASE_ID!,
    token:      process.env.CF_D1_TOKEN!,
  },
});
