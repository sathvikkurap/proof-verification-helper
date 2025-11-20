import Database from 'better-sqlite3';
import path from 'path';
import { createTables } from './schema';

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/proofs.db');

let db: Database.Database | null = null;

export function initDatabase() {
  if (db) return db;

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  createTables(db);
  console.log('Database initialized');

  return db;
}

export function getDatabase(): Database.Database {
  if (!db) {
    return initDatabase();
  }
  return db;
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

