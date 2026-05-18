import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const dbPath = process.env.DB_PATH || path.join(__dirname, "data.db");

const sqlite3 = require("sqlite3").verbose();
const _db = new sqlite3.Database(dbPath);

const init = new Promise((resolve, reject) => {
  _db.serialize(() => {
    //_db.run("PRAGMA journal_mode = WAL");
    _db.run("PRAGMA foreign_keys = ON");
    _db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('admin','member')),
        createdAt TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        createdBy INTEGER NOT NULL REFERENCES users(id),
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS project_members (
        projectId INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        userId INTEGER NOT NULL REFERENCES users(id),
        PRIMARY KEY (projectId, userId)
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','in_progress','review','done')),
        priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low','medium','high','urgent')),
        dueDate TEXT,
        projectId INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        assignedTo INTEGER REFERENCES users(id),
        createdBy INTEGER NOT NULL REFERENCES users(id),
        createdAt TEXT NOT NULL DEFAULT (datetime('now')),
        updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
});

function prepare(sql) {
  return {
    get: (...params) =>
      new Promise((resolve, reject) => {
        _db.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      }),
    all: (...params) =>
      new Promise((resolve, reject) => {
        _db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      }),
    run: (...params) =>
      new Promise((resolve, reject) => {
        _db.run(sql, params, function (err) {
          if (err) reject(err);
          else resolve({ lastInsertRowid: this.lastID, changes: this.changes });
        });
      }),
  };
}

const db = { prepare, _db };
export { init };
export default db;
