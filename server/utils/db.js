const Database = require('better-sqlite3');
const { drizzle } = require('drizzle-orm/better-sqlite3');
const * as schema = require('../database/schema');
const path = require('path');

let _db = null;

async function getDb() {
  if (_db) return _db;

  const dbPath = path.join(process.cwd(), 'dev.sqlite');
  const sqlite = new Database(dbPath);
  
  _db = drizzle(sqlite, { schema });
  return _db;
}

const tables = schema;

module.exports = { getDb, tables };