import db from "@/lib/db";
import { broadcast } from "@/lib/events";

export async function POST(req: Request) {
  const { id } = await req.json();
  if (!id) return Response.json({ error: "missing id" }, { status: 400 });

  db.prepare(`DELETE FROM requests WHERE song_id=?`).run(id);
  db.prepare(`DELETE FROM songs WHERE id=?`).run(id);

  broadcast("ranking_update");
  console.warn("[INFO] Admin-Dashboard deleted song with id " + id);

  return Response.json({ success: true });
}
