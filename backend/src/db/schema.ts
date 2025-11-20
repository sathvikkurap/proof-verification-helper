import Database from 'better-sqlite3';

export function createTables(db: Database.Database) {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Proofs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS proofs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'incomplete',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Proof dependencies table
  db.exec(`
    CREATE TABLE IF NOT EXISTS proof_dependencies (
      id TEXT PRIMARY KEY,
      proof_id TEXT NOT NULL,
      depends_on_proof_id TEXT,
      depends_on_theorem TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (proof_id) REFERENCES proofs(id) ON DELETE CASCADE
    )
  `);

  // Theorems table (from mathlib or user-defined)
  db.exec(`
    CREATE TABLE IF NOT EXISTS theorems (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      statement TEXT NOT NULL,
      proof TEXT,
      category TEXT,
      difficulty TEXT,
      tags TEXT,
      location TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // User proof library (saved proofs)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_proof_library (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      proof_id TEXT NOT NULL,
      tags TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (proof_id) REFERENCES proofs(id) ON DELETE CASCADE,
      UNIQUE(user_id, proof_id)
    )
  `);

  // Comments/Annotations
  db.exec(`
    CREATE TABLE IF NOT EXISTS proof_comments (
      id TEXT PRIMARY KEY,
      proof_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      line_number INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (proof_id) REFERENCES proofs(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_proofs_user_id ON proofs(user_id);
    CREATE INDEX IF NOT EXISTS idx_proof_dependencies_proof_id ON proof_dependencies(proof_id);
    CREATE INDEX IF NOT EXISTS idx_theorems_name ON theorems(name);
    CREATE INDEX IF NOT EXISTS idx_theorems_category ON theorems(category);
    CREATE INDEX IF NOT EXISTS idx_user_proof_library_user_id ON user_proof_library(user_id);
  `);
}

