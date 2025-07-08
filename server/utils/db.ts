// server/utils/db.ts
import { drizzle as drizzleD1 } from 'drizzle-orm/d1'
import * as schema             from '../database/schema'

let _db: any = null

export async function getDb() {
  if (_db) return _db

  // 1) In production on Pages, CF will inject DB
  const d1 = (globalThis as any).DB
  if (d1?.prepare) {
    _db = drizzleD1(d1, { schema })
    return _db
  }

  // 2) In local dev, use SQLite — Vite will inline this branch only when DEV=true
  if (import.meta.env.DEV) {
    // cast the dynamically imported modules to any so TS won't complain
    const sqlitePkg: any         = await import('drizzle-orm/better-sqlite3')
    const Database: any          = (await import('better-sqlite3')).default
    const path: any              = await import('path')

    const file   = path.resolve(process.cwd(), 'dev.sqlite')
    const sqlite = new Database(file)
    _db = sqlitePkg.drizzle(sqlite, { schema })
    return _db
  }

  throw new Error('No database available—did you bind D1?')
}

export const tables = schema
