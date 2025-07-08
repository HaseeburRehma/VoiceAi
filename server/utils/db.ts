// server/utils/db.ts
import { drizzle as drizzleD1 } from 'drizzle-orm/d1'
import * as schema             from '../database/schema'

let _db: any = null

export async function getDb() {
  if (_db) return _db

  // 1) Production on Pages: D1 binding
  const d1 = (globalThis as any).DB
  if (d1?.prepare) {
    _db = drizzleD1(d1, { schema })
    return _db
  }

  // 2) Local dev fallback – THIS WILL BE STRIPPED OUT IN PROD
  // Esbuild will see process.env.NODE_ENV !== 'production' → true locally, false in build.
  if (process.env.NODE_ENV === 'development') {
    // @ts-ignore — only used in dev, so we don’t care TS can’t find these
    const { default: Database } = await import('better-sqlite3')
    // @ts-ignore
    const sqlitePkg: any        = await import('drizzle-orm/better-sqlite3')

    // Avoid importing "path" entirely – just build the filename manually
    const file = process.cwd() + '/dev.sqlite'
    const sqlite = new Database(file)

    _db = sqlitePkg.drizzle(sqlite, { schema })
    return _db
  }

  throw new Error('No database available—did you bind D1?')
}

export const tables = schema
