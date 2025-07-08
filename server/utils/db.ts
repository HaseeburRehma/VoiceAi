import * as schema from '../database/schema'

let _db: any = null

export async function getDb() {
  if (_db) return _db

  // 1) Cloudflare D1 binding
  const d1 = (globalThis as any).DB
  if (d1?.prepare) {
    const { drizzle } = await import('drizzle-orm/d1')
    return (_db = drizzle(d1, { schema }))
  }

  // 2) Local dev fallback
  if (process.env.NODE_ENV === 'development') {
    const { default: Database } = await import('better-sqlite3')
    const { drizzle }        = await import('drizzle-orm/better-sqlite3')
    const file = 'dev.sqlite'
    const sqlite = new Database(file)
    return (_db = drizzle(sqlite, { schema }))
  }

  throw new Error('No DB available — missing D1 binding?')
}
export const tables = schema
export { sql, eq, and, or, desc } from 'drizzle-orm'