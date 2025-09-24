const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'promptlab.db');
const db = new sqlite3.Database(dbPath);

// Initialize database tables
db.serialize(() => {
  // Folders table with unlimited nesting support
  db.run(`
    CREATE TABLE IF NOT EXISTS folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parent_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES folders (id)
    )
  `);

  // Chats table
  db.run(`
    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      folder_id INTEGER,
      rating INTEGER CHECK (rating >= 1 AND rating <= 10),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (folder_id) REFERENCES folders (id)
    )
  `);

  // Messages table
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      llm_provider TEXT,
      llm_model TEXT,
      temperature REAL,
      max_tokens INTEGER,
      response_time_ms INTEGER,
      tokens_used INTEGER,
      estimated_cost REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (chat_id) REFERENCES chats (id)
    )
  `);

  // Create indexes for better performance
  db.run('CREATE INDEX IF NOT EXISTS idx_chats_folder_id ON chats (folder_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_chats_created_at ON chats (created_at DESC)');
  db.run('CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages (chat_id)');
  db.run('CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders (parent_id)');
});

module.exports = db;