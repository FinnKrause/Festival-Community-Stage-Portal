import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { initializeJobs } from "./jobs";

const dbPath = path.join(process.cwd(), "data");

if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath);
}

const db = new Database(path.join(dbPath, "songs.db"));

db.exec(`
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS songs (
  spotify_id TEXT PRIMARY KEY ,
  title TEXT,
  artist TEXT,
  cover_url TEXT,
  votes INTEGER DEFAULT 1,
  created_at INTEGER,
  device_id TEXT,
  queued TEXT DEFAULT 'FALSE',
  queued_at INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  song_id INTEGER NOT NULL,
  device_id TEXT,
  created_at INTEGER,
  FOREIGN KEY (song_id) REFERENCES songs(spotify_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS app_state (
  id INTEGER PRIMARY KEY,

  enable_autoplay TEXT,
  enable_page TEXT,
  enable_player TEXT,
  enable_dj TEXT,

  dp_message TEXT,
  autoplay_message TEXT,

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
  enable_autoplay,
  enable_page, 
  enable_player, 
  enable_dj, 
  dp_message, 
  autoplay_message,
  dj_name, 
  dj_insta, 
  dj_message, 
  dj_avatar_url
) VALUES (
  1,
  'FALSE',
  'TRUE',
  'TRUE',
  'FALSE',
  'Aktuell machen wir leider eine Pause, schaue später wieder vorbei!',
  'Aktuell ist leider kein DJ da, damit ihr aber trotzdem eure Musik hören könnt, wird immer der am höchsten gevotete Song automatisch gespielt. Wir probieren das aus, sollte das missbraucht werden, wird es wieder deaktiviert :)',
  'Anonymous',
  'bundeskanzler',
  'Aktuell legt einer unserer DJs auf, für diese Zeit ist das Songwunschsystem leider blockiert!',
  'https://hips.hearstapps.com/hmg-prod/images/f6ggka-67a4b1aa28d9f.jpg?crop=0.655xw:1.00xh;0.0612xw,0&resize=640:*'
);
`,
).run();

initializeJobs();

export default db;
