import db from "@/lib/db";
import { broadcast } from "@/lib/events";
import { getSpotifyUserCredentialsToken } from "@/lib/spotifyUserCredentials";

export async function POST(req: Request) {
  const { id } = await req.json();
  if (!id) return Response.json({ error: "missing id" }, { status: 400 });

  const song = db.prepare(`SELECT spotify_id FROM songs WHERE id=?`).get(id);
  if (!song) return Response.json({ error: "song not found" }, { status: 404 });

  try {
    const token = await getSpotifyUserCredentialsToken();

    await fetch(
      `https://api.spotify.com/v1/me/player/queue?uri=spotify:track:${encodeURIComponent(
        song.spotify_id,
      )}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
  } catch (e) {
    console.error("Queue error", e);
    return Response.json({ error: true });
  }

  db.prepare(`DELETE FROM requests WHERE song_id=?`).run(id);
  db.prepare(`DELETE FROM songs WHERE id=?`).run(id);

  broadcast("ranking_update");
  console.warn("[INFO] Admin-Dashboard queued song with id " + id);

  return Response.json({ success: true });
}
