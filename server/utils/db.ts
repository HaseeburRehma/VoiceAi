// server/utils/db.ts
import { drizzle as drizzleD1 } from 'drizzle-orm/d1'
import { drizzle as drizzleBS3 } from 'drizzle-orm/better-sqlite3'
import * as schema from '../database/schema'

let _db: any = null
console.log('🌐 D1 binding on globalThis:', (globalThis as any).DB)

export async function getDb() {
  if (_db) return _db

  // ⬇️ 1) Production: D1 binding from Pages
  const d1 = (globalThis as any).DB
  if (d1?.prepare) {
    return (_db = drizzleD1(d1, { schema }))
  }

  // ⬇️ 2) Local: Better-SQLite3 (only in dev)
  if (process.env.NODE_ENV === 'development') {
    const Database = (await import('better-sqlite3')).default
    const sqlite = new Database('dev.sqlite')
    return (_db = drizzleBS3(sqlite, { schema }))
  }

  throw new Error('No database available—did you bind D1?')
}
export const tables = schema
