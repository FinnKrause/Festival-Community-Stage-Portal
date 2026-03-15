import db from "./db";
import { broadcast } from "./events";

const EXPIRATION = parseInt(process.env.SONG_TIMEOUT || "1800000");

export function startCleanup() {
  setInterval(() => {
    const top3 = db
      .prepare(
        `
      SELECT id FROM songs
      ORDER BY votes DESC
      LIMIT 3
      `,
      )
      .all()
      .map((s: any) => s.id);

    const now = Date.now();

    const songs = db
      .prepare(`SELECT id,title,artist,created_at FROM songs`)
      .all();

    for (const s of songs) {
      if (top3.includes(s.id)) continue;

      if (now - s.created_at > EXPIRATION) {
        db.prepare(`DELETE FROM requests WHERE song_id=?`).run(s.id);

        db.prepare(`DELETE FROM songs WHERE id=?`).run(s.id);
        console.warn('[INFO] Song "' + s.title + '" expired');
      }
    }
    broadcast("ranking_update");
  }, 1000 * 60);
}
