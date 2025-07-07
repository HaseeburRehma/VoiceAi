// server/utils/db.ts
import { sql } from 'drizzle-orm'
import * as schema from '../database/schema'

let _db: any = null

export async function getDb() {
  if (_db) return _db

  const useD1 = process.env.USE_D1 === 'true'        // now ALWAYS false during the build
  const maybeDb = (globalThis as any).DB
  const haveBinding = maybeDb && typeof maybeDb.prepare === 'function'

  if (useD1 && haveBinding) {
    const { drizzle } = await import('drizzle-orm/d1')
    _db = drizzle(maybeDb, { schema })
    return _db
  }

  // fallback to SQLite
  const { default: Database } = await import('better-sqlite3')
  const { drizzle }           = await import('drizzle-orm/better-sqlite3')
  _db = drizzle(new Database('dev.sqlite'), { schema })
  try {
    _db.execute(sql`DROP TABLE IF EXISTS drizzle_migrations;`)
  } catch { /* ignore */ }
  return _db
}

export const tables = schema
export { sql, eq, and, or, desc } from 'drizzle-orm'
