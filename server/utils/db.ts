// server/utils/db.ts - Fixed version
import { sql } from 'drizzle-orm'
import * as schema from '../database/schema'

let _db: any = null

export async function getDb() {
  if (_db) return _db

  // Check if we're in Cloudflare environment by looking for the DB binding
  const cloudflareDb = (globalThis as any).DB
  
  if (cloudflareDb && typeof cloudflareDb.prepare === 'function') {
    // Use Cloudflare D1 database
    const { drizzle } = await import('drizzle-orm/d1')
    _db = drizzle(cloudflareDb, { schema })
    console.log('Connected to Cloudflare D1 database')
    return _db
  }

  // Local development with better-sqlite3
  try {
    const { default: Database } = await import('better-sqlite3')
    const { drizzle } = await import('drizzle-orm/better-sqlite3')
    
    // Ensure we have a valid database path for local development
    const dbPath = process.env.NODE_ENV === 'development' ? 'dev.sqlite' : ':memory:'
    
    console.log('Using SQLite database:', dbPath)
    
    // Create database instance with proper error handling
    const sqlite = new Database(dbPath)
    _db = drizzle(sqlite, { schema })
    
    return _db
  } catch (error) {
    console.error('Failed to initialize database:', error)
    throw new Error(`Database initialization failed: ${error.message}`)
  }
}

export const tables = schema
export { sql, eq, and, or, desc } from 'drizzle-orm'