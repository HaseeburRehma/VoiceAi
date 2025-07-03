declare module "drizzle-orm/sqlite3" {
  import type { Database } from "sqlite3";
  import type { DrizzleConfig } from "drizzle-orm";

  export function drizzle<S extends Record<string, any>>(
    dbPathOrHandle: string | Database,
    config: DrizzleConfig<S> & { schema: S }
  ): unknown;
}