import db from "@/lib/db";
import { broadcast } from "@/lib/events";
import { getRanking } from "@/lib/ranking";

export async function POST(req: Request) {
  const body = await req.json();
  const { id, device_id } = body;

  if (!id || !device_id) {
    return Response.json({ error: "missing params" }, { status: 400 });
  }

  // Prüfen, ob das Device schon gevotet hat
  const exists = db
    .prepare(`SELECT 1 FROM requests WHERE song_id=? AND device_id=?`)
    .get(id, device_id);

  if (exists) {
    return Response.json({ error: "already_voted" }, { status: 400 });
  }

  db.prepare(`UPDATE songs SET votes=votes+1 WHERE id=?`).run(id);

  db.prepare(
    `INSERT INTO requests (song_id, device_id, created_at)
     VALUES (?, ?, ?)`,
  ).run(id, device_id, Date.now());

  broadcast("ranking_update");

  return Response.json(getRanking());
}
