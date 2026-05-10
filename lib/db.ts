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
PRAGMA foreign_keys = ON;

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
  song_id INTEGER NOT NULL,
  device_id TEXT,
  created_at INTEGER,
  FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS app_state (
  id INTEGER PRIMARY KEY,

  enable_page TEXT,
  enable_player TEXT,
  enable_dj TEXT,

  dp_message TEXT,

  dj_name TEXT,
  dj_insta TEXT,
  dj_message TEXT,
  dj_avatar_url TEXT
);
`);

db.prepare(
  `
INSERT OR IGNORE INTO app_state (
  id, 
  enable_page, 
  enable_player, 
  enable_dj, 
  dp_message, 
  dj_name, 
  dj_insta, 
  dj_message, 
  dj_avatar_url
) VALUES (
  1,
  'TRUE',
  'TRUE',
  'FALSE',
  'Aktuell machen wir leider eine Pause, schaue später wieder vorbei!',
  'DJ Sexy',
  'henni.colin',
  'Aktuell legt einer unserer DJs auf, für diese Zeit ist das Songwunschsystem leider blockiert!',
  'https://hips.hearstapps.com/hmg-prod/images/f6ggka-67a4b1aa28d9f.jpg?crop=0.655xw:1.00xh;0.0612xw,0&resize=640:*'
);
`,
).run();

startCleanup();

export default db;
