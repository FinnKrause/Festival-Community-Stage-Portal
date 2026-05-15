/* eslint-disable @typescript-eslint/no-explicit-any */
import db from "../db";
import { broadcast } from "../events";
import { Song } from "../types";

const EXPIRATION = parseInt(process.env.NEXT_SONG_TIMEOUT || "1800000");
const DISPLAY_QUEUED_FOR = parseInt(
  process.env.NEXT_DISPLAY_QUEUED_FOR || "15000",
);

export function startCleanup() {
  setInterval(() => {
    const now = Date.now();

    const songs = db
      .prepare(
        `SELECT spotify_id,title,artist,created_at,queued,queued_at FROM songs`,
      )
      .all() as Array<Song>;

    for (const s of songs) {
      if (now - s.created_at > EXPIRATION) {
        deleteSong(s.spotify_id);
        console.warn('[INFO] Song "' + s.title + '" expired');
      }
      if (s.queued === "TRUE" && now - s.queued_at > DISPLAY_QUEUED_FOR) {
        //Nach mindestens 15 Sekunden kann der Eintrag dann gelöscht werden
        deleteSong(s.spotify_id);
        console.warn(
          '[INFO] Queued song "' + s.title + '" was removed from the list',
        );
      }
    }
    broadcast("ranking_update");
  }, 60 * 1000);
}

function deleteSong(id: string) {
  db.prepare(`DELETE FROM requests WHERE song_id=?`).run(id);
  db.prepare(`DELETE FROM songs WHERE spotify_id=?`).run(id);
}
