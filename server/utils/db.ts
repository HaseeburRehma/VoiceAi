// server/utils/db.ts
import * as schema from '../database/schema'

let _db: any = null

export async function getDb() {
  if (_db) return _db

  // ⬇️ 1) Production: D1 binding from Pages
  const d1 = (globalThis as any).DB
  if (d1?.prepare) {
    const { drizzle } = await import('drizzle-orm/d1')
    return (_db = drizzle(d1, { schema }))
  }

  // ⬇️ 2) Local: Better-SQLite3 (only in dev)
  if (process.env.NODE_ENV === 'development') {
    const { default: Database }     = await import('better-sqlite3')
    const { drizzle }               = await import('drizzle-orm/better-sqlite3')
    const sqlite = new Database('dev.sqlite')
    return (_db = drizzle(sqlite, { schema }))
  }

  throw new Error('No database available—did you bind D1?')
}
export const tables = schema
export { sql, eq, and, or, desc } from 'drizzle-orm'