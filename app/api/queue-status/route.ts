import db from "@/lib/db";

const MAX_QUEUE = Number(process.env.MAX_QUEUE_LENGTH ?? 20);

export async function GET() {
  const row = db.prepare(`SELECT COUNT(*) as count FROM songs`).get() as {
    count: number;
  };

  return Response.json({
    count: row.count,
    max: MAX_QUEUE,
    full: row.count >= MAX_QUEUE,
  });
}
