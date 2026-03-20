import db from "@/lib/db";
import { broadcast } from "@/lib/events";
import { getRanking } from "@/lib/ranking";

export async function POST(req: Request) {
  const body = await req.json();
  const { spotify_id, title, artist, cover, device_id } = body;

  if (!spotify_id || !title || !device_id) {
    return Response.json({ error: "missing params" }, { status: 400 });
  }

  // Check if song already exists
  const existingSong = db
    .prepare(`SELECT id FROM songs WHERE spotify_id=?`)
    .get(spotify_id) as { id: string };

  if (existingSong) {
    // Check if this device already voted for the song
    const existingVote = db
      .prepare(`SELECT 1 FROM requests WHERE song_id=? AND device_id=?`)
      .get(existingSong.id, device_id);

    if (existingVote) {
      // user already voted → do nothing
      return Response.json(getRanking());
    }

    // increase vote count
    db.prepare(`UPDATE songs SET votes = votes + 1 WHERE id=?`).run(
      existingSong.id,
    );

    // store request
    db.prepare(
      `
      INSERT INTO requests (song_id, device_id, created_at)
      VALUES (?,?,?)
    `,
    ).run(existingSong.id, device_id, Date.now());

    broadcast("ranking_update");
    return Response.json(getRanking());
  }

  // Check queue size
  const row = db.prepare(`SELECT COUNT(*) as c FROM songs`).get() as {
    c: number;
  };
  const count = row.c;

  const MAX = Number(process.env.MAX_REQUESTED_SONGS ?? 10);

  if (count >= MAX) {
    return Response.json({ error: "queue_full" }, { status: 400 });
  }

  // Insert new song
  const result = db
    .prepare(
      `
    INSERT INTO songs
    (spotify_id, title, artist, cover_url, votes, created_at, device_id)
    VALUES (?,?,?,?,?,?,?)
  `,
    )
    .run(spotify_id, title, artist, cover, 1, Date.now(), device_id);

  // store first vote
  db.prepare(
    `
    INSERT INTO requests (song_id, device_id, created_at)
    VALUES (?,?,?)
  `,
  ).run(result.lastInsertRowid, device_id, Date.now());

  console.log(
    '[INFO] Client requested song "' + title + '" by "' + artist + '"',
  );

  broadcast("ranking_update");
  return Response.json(getRanking());
}
