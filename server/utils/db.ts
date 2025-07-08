// server/utils/db.ts
import { drizzle } from 'drizzle-orm/d1'    // only D1-driver here
import * as schema from '../database/schema'

let _db: any = null

/**
 * Returns a Drizzle client.
 * In production (Pages) it uses the globalThis.DB D1 binding;
 * in local dev it dynamically pulls in better-sqlite3.
 */
export async function getDb() {
  if (_db) return _db

  // 1) pages() D1 binding
  const d1 = (globalThis as any).DB
  if (d1?.prepare) {
    _db = drizzle(d1, { schema })
    return _db
  }

  // 2) local dev fallback
  if (process.env.NODE_ENV !== 'production') {
    // only now do we pull in the node‐only packages
    const { default: Database } = await import('better-sqlite3')
    const { drizzle: drizzleSQLite } = await import('drizzle-orm/better-sqlite3')
    const { resolve } = await import('node:path')

    const file   = resolve(process.cwd(), 'dev.sqlite')
    const sqlite = new Database(file)
    _db = drizzleSQLite(sqlite, { schema })
    return _db
  }

  throw new Error('No database available—did you bind D1?')
}

export const tables = schema
