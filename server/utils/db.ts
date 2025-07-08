// server/utils/db.ts - Production-ready database utility
import { sql } from 'drizzle-orm'
import * as schema from '../database/schema'

let _db: any = null

export async function getDb() {
  if (_db) return _db

  // First priority: Cloudflare D1 database binding
  const cloudflareDb = (globalThis as any).DB
  
  if (cloudflareDb && typeof cloudflareDb.prepare === 'function') {
    const { drizzle } = await import('drizzle-orm/d1')
    _db = drizzle(cloudflareDb, { schema })
    console.log('Connected to Cloudflare D1 database')
    return _db
  }

  // Second priority: Check for NuxtHub database using auto-imported hubDatabase
  try {
    // Use the auto-imported hubDatabase function
    const db = hubDatabase()
    if (db) {
      const { drizzle } = await import('drizzle-orm/d1')
      _db = drizzle(db, { schema })
      console.log('Connected to NuxtHub database')
      return _db
    }
  } catch (error) {
    console.log('NuxtHub database not available:', error.message)
  }

  // Third priority: Development environment - use separate local db utility
  if (process.env.NODE_ENV === 'development') {
    try {
      const { getLocalDb } = await import('./localDb')
      _db = await getLocalDb()
      console.log('Connected to local development database')
      return _db
    } catch (error) {
      console.error('Failed to connect to local development database:', error)
    }
  }

  throw new Error('No database available. Make sure DB binding is configured in Cloudflare.')
}

export const tables = schema
export { sql, eq, and, or, desc } from 'drizzle-orm'