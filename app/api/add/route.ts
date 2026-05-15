import db from "@/lib/db";
import { broadcast } from "@/lib/events";
import { Song } from "@/lib/types";

export async function POST(req: Request) {
  const body = await req.json();
  const { spotify_id, title, artist, cover_url, device_id } = body;

  if (!spotify_id || !title || !device_id) {
    console.error("[ERR]: Failed to add song because of missing params.");
    return Response.json(
      { error: true, message: "missing params" },
      { status: 400 },
    );
  }

  // Check if song already exists
  const existingSong: Song = db
    .prepare(`SELECT * FROM songs WHERE spotify_id=?`)
    .get(spotify_id) as Song;

  if (existingSong) {
    // Check if this device already voted for the song
    const existingVote = db
      .prepare(`SELECT 1 FROM requests WHERE song_id=? AND device_id=?`)
      .get(spotify_id, device_id);

    if (existingVote) {
      // user already voted → do nothing
      return Response.json({ error: true, message: "already_voted" });
    }

    // increase vote count
    db.prepare(`UPDATE songs SET votes = votes + 1 WHERE spotify_id=?`).run(
      existingSong.spotify_id,
    );

    // store request
    db.prepare(
      `
      INSERT INTO requests (song_id, device_id, created_at)
      VALUES (?,?,?)
    `,
    ).run(existingSong.spotify_id, device_id, Date.now());

    broadcast("ranking_update");
    return Response.json({ error: false });
  }

  // Check queue size
  const row = db
    .prepare(`SELECT COUNT(*) as c FROM songs WHERE queued = 'FALSE'`)
    .get() as {
    c: number;
  };
  const count = row.c;

  const MAX = Number(process.env.NEXT_MAX_REQUESTED_SONGS || 5);

  if (count >= MAX) {
    return Response.json(
      { error: true, message: "The queue is already full!" },
      { status: 400 },
    );
  }

  // Insert new song
  db.prepare(
    `
    INSERT INTO songs
    (spotify_id, title, artist, cover_url, votes, created_at, device_id)
    VALUES (?,?,?,?,?,?,?)
  `,
  ).run(spotify_id, title, artist, cover_url, 1, Date.now(), device_id);

  // store first vote
  db.prepare(
    `
    INSERT INTO requests (song_id, device_id, created_at)
    VALUES (?,?,?)
  `,
  ).run(spotify_id, device_id, Date.now());

  console.log(
    '[INFO] Client requested song "' + title + '" by "' + artist + '"',
  );

  broadcast("ranking_update");
  return Response.json({ error: false });
}
