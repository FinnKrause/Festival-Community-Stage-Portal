import db from "@/lib/db";
import { broadcast } from "@/lib/events";
import { addToSpotifyQueue } from "@/lib/spotifyControls";

export async function POST(req: Request) {
  const { spotify_id } = await req.json();
  if (!spotify_id)
    return Response.json({ error: "missing id" }, { status: 400 });

  const song = db
    .prepare(`SELECT spotify_id FROM songs WHERE spotify_id=?`)
    .get(spotify_id) as { spotify_id: string | number };
  if (!song) return Response.json({ error: "song not found" }, { status: 404 });

  try {
    addToSpotifyQueue(spotify_id);
  } catch (e) {
    console.error("Queue error", e);
    return Response.json({ error: true });
  }

  //Jetzt nur noch markiert als approved, sodass beim cleanup gelöscht wird
  db.prepare(
    `UPDATE songs SET queued = 'TRUE', queued_at = ? WHERE spotify_id=?`,
  ).run(Date.now(), spotify_id);

  broadcast("ranking_update");
  console.warn("[INFO] Admin-Dashboard queued song with id " + spotify_id);

  return Response.json({ success: true });
}
