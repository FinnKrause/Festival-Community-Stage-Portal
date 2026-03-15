import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { startCleanup } from "./cleanup";

const dbPath = path.join(process.cwd(), "data");

if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath);
}

const db = new Database(path.join(dbPath, "songs.db"));

db.exec(`
CREATE TABLE IF NOT EXISTS songs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  spotify_id TEXT UNIQUE,
  title TEXT,
  artist TEXT,
  cover_url TEXT,
  votes INTEGER DEFAULT 1,
  created_at INTEGER,
  device_id TEXT
);

CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  song_id INTEGER,
  device_id TEXT,
  created_at INTEGER
);
`);

startCleanup();

export default db;
