import { resolve } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../database/schema";

export { sql, eq, and, or, desc } from "drizzle-orm";

const file   = resolve(process.cwd(), "dev.sqlite");
const sqlite = new Database(file);

export const localDb = drizzle(sqlite, { schema });
export const tables  = schema;
