import fs from 'node:fs/promises';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const DEFAULT_DB_PATH = path.resolve(process.cwd(), 'data', 'apphermann.sqlite');

let dbPromise;

function resolveDbPath() {
  return path.resolve(process.cwd(), process.env.DB_PATH || DEFAULT_DB_PATH);
}

async function ensureAdminUser(db) {
  const existingUser = await db.get('SELECT id FROM users LIMIT 1');

  if (existingUser) {
    return;
  }

  const username = process.env.APP_USERNAME;
  const passwordHash =
    process.env.APP_PASSWORD_HASH ||
    (process.env.APP_PASSWORD ? await bcrypt.hash(process.env.APP_PASSWORD, 12) : null);

  if (!username || !passwordHash) {
    throw new Error(
      'Missing bootstrap credentials. Set APP_USERNAME and APP_PASSWORD or APP_PASSWORD_HASH before starting the server.',
    );
  }

  await db.run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username.trim(), passwordHash]);
}

async function initDb() {
  const filename = resolveDbPath();
  await fs.mkdir(path.dirname(filename), { recursive: true });

  const db = await open({
    filename,
    driver: sqlite3.Database,
  });

  await db.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS gyms (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      gym_id TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      price REAL NOT NULL CHECK (price >= 0),
      frequency TEXT NOT NULL CHECK (frequency IN ('mensile', 'trimestrale', 'semestrale', 'annuale')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (gym_id) REFERENCES gyms (id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_gyms_user_id ON gyms (user_id);
    CREATE INDEX IF NOT EXISTS idx_clients_gym_id ON clients (gym_id);
    CREATE INDEX IF NOT EXISTS idx_clients_last_name ON clients (last_name);
  `);

  await ensureAdminUser(db);
  return db;
}

export function getDb() {
  if (!dbPromise) {
    dbPromise = initDb();
  }

  return dbPromise;
}
