const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, 'home_dashboard.db');

let db = null;

// Initialize database
async function initDatabase() {
  const SQL = await initSqlJs();

  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      icon TEXT DEFAULT '📁',
      color TEXT DEFAULT '#6366f1',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      amount REAL NOT NULL,
      category_id TEXT,
      description TEXT,
      date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      amount REAL NOT NULL,
      month TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
      UNIQUE(category_id, month)
    )
  `);

  // Income table for tracking income sources
  db.run(`
    CREATE TABLE IF NOT EXISTS income (
      id TEXT PRIMARY KEY,
      amount REAL NOT NULL,
      source TEXT NOT NULL,
      description TEXT,
      date DATE NOT NULL,
      is_recurring INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Seed default categories if empty
  const result = db.exec('SELECT COUNT(*) as count FROM categories');
  const count = result.length > 0 ? result[0].values[0][0] : 0;

  if (count === 0) {
    const defaultCategories = [
      { name: 'Utilities', icon: '💡', color: '#f59e0b' },
      { name: 'Subscriptions', icon: '📺', color: '#8b5cf6' },
      { name: 'Groceries', icon: '🛒', color: '#10b981' },
      { name: 'Rent/Mortgage', icon: '🏠', color: '#ef4444' },
      { name: 'Transport', icon: '🚗', color: '#3b82f6' },
      { name: 'Entertainment', icon: '🎮', color: '#ec4899' },
      { name: 'Healthcare', icon: '🏥', color: '#14b8a6' },
      { name: 'Other', icon: '📦', color: '#6b7280' }
    ];

    const stmt = db.prepare('INSERT INTO categories (id, name, icon, color) VALUES (?, ?, ?, ?)');
    for (const cat of defaultCategories) {
      stmt.run([uuidv4(), cat.name, cat.icon, cat.color]);
    }
    stmt.free();
    console.log('✅ Default categories seeded');
    saveDatabase();
  }

  console.log('✅ Database initialized');
  return db;
}

// Save database to file
function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// Helper to run queries and convert results to objects
function queryAll(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    if (params.length > 0) {
      stmt.bind(params);
    }

    const results = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push(row);
    }
    stmt.free();
    return results;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}

function queryOne(sql, params = []) {
  const results = queryAll(sql, params);
  return results.length > 0 ? results[0] : null;
}

function runQuery(sql, params = []) {
  try {
    const stmt = db.prepare(sql);
    stmt.run(params);
    stmt.free();
    saveDatabase();
    return { changes: db.getRowsModified() };
  } catch (error) {
    console.error('Run error:', error);
    throw error;
  }
}

module.exports = {
  initDatabase,
  saveDatabase,
  queryAll,
  queryOne,
  runQuery,
  getDb: () => db
};
