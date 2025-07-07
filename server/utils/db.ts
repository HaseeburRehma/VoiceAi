// server/utils/db.ts
import { sql } from 'drizzle-orm'
import type { AnyD1Database } from 'drizzle-orm/d1'
import * as schema from '../database/schema'

let _db: any = null

export async function getDb() {
  if (_db) return _db

  // 1) Decide strictly by env var—no feature-detect
  const useD1 = process.env.USE_D1 === 'true'

  if (useD1) {
    try {
      const maybeDb = (globalThis as any).DB
      if (!maybeDb) throw new Error('globalThis.DB is not set')

      // 2) Attempt D1 init
      const { drizzle } = await import('drizzle-orm/d1')
      _db = drizzle(maybeDb as AnyD1Database, { schema })
      return _db
    } catch (err) {
      console.warn('D1 init failed, falling back to SQLite:', err)
    }
  }

  // 3) SQLite fallback (Vercel, local, etc.)
  const { default: Database } = await import('better-sqlite3')
  const { drizzle } = await import('drizzle-orm/better-sqlite3')
  _db = drizzle(new Database('dev.sqlite'), { schema })

  // optional dev-only migrations reset
  try {
    _db.execute(sql`DROP TABLE IF EXISTS drizzle_migrations;`)
    console.log('🗑️  Reset drizzle_migrations (dev only)')
  } catch { /* ignore */ }

  return _db
}

export const tables = schema
export { sql, eq, and, or, desc } from 'drizzle-orm'
