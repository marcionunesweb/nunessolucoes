import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const DB_PATH = process.env.DB_PATH || './data/app.db';

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS app_data (
    user_id INTEGER PRIMARY KEY REFERENCES users(id),
    settings_json TEXT NOT NULL,
    ledger_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

export function countUsers() {
  return db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
}

export function getUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
}

export function getUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

export function createUser(email, passwordHash) {
  const info = db
    .prepare('INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)')
    .run(email.trim().toLowerCase(), passwordHash, new Date().toISOString());
  return info.lastInsertRowid;
}

export function getAppData(userId) {
  return db.prepare('SELECT settings_json, ledger_json FROM app_data WHERE user_id = ?').get(userId);
}

export function upsertAppData(userId, settingsJson, ledgerJson) {
  db.prepare(
    `INSERT INTO app_data (user_id, settings_json, ledger_json, updated_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       settings_json = excluded.settings_json,
       ledger_json = excluded.ledger_json,
       updated_at = excluded.updated_at`,
  ).run(userId, settingsJson, ledgerJson, new Date().toISOString());
}

export default db;
