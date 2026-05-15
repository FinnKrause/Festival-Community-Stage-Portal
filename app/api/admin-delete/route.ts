import db from "@/lib/db";
import { broadcast } from "@/lib/events";

export async function POST(req: Request) {
  const { spotify_id } = await req.json();
  if (!spotify_id)
    return Response.json({ error: "missing id" }, { status: 400 });

  db.prepare(`DELETE FROM requests WHERE song_id=?`).run(spotify_id);
  db.prepare(`DELETE FROM songs WHERE spotify_id=?`).run(spotify_id);

  broadcast("ranking_update");
  console.warn("[INFO] Admin-Dashboard deleted song with id " + spotify_id);

  return Response.json({ success: true });
}
