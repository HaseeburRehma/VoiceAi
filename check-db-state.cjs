const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'dev.sqlite');
const db = new Database(dbPath, { readonly: true });

console.log('=== Database State Analysis ===');

// Get all indexes
console.log('\n--- All Indexes ---');
const indexes = db.prepare(`
  SELECT name, sql, tbl_name FROM sqlite_master 
  WHERE type = 'index' 
  ORDER BY tbl_name, name
`).all();

indexes.forEach(idx => {
  console.log(`Table: ${idx.tbl_name}`);
  console.log(`Index: ${idx.name}`);
  console.log(`SQL: ${idx.sql || 'Auto-generated'}`);
  console.log('');
});

// Get table constraints
console.log('\n--- Users Table Info ---');
const usersCols = db.prepare(`PRAGMA table_info(users)`).all();
usersCols.forEach(col => {
  console.log(`${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.dflt_value ? ` DEFAULT ${col.dflt_value}` : ''}${col.pk ? ' PRIMARY KEY' : ''}`);
});

console.log('\n--- Notes Table Info ---');
const notesCols = db.prepare(`PRAGMA table_info(notes)`).all();
notesCols.forEach(col => {
  console.log(`${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.dflt_value ? ` DEFAULT ${col.dflt_value}` : ''}${col.pk ? ' PRIMARY KEY' : ''}`);
});

// Check foreign keys
console.log('\n--- Foreign Keys ---');
const foreignKeys = db.prepare(`PRAGMA foreign_key_list(notes)`).all();
foreignKeys.forEach(fk => {
  console.log(`${fk.from} -> ${fk.table}.${fk.to}`);
});

db.close();
