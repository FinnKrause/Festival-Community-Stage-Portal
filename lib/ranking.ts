import db from "./db";

export function getRanking(limit = 100) {
  if (!process.env.NEXT_MAX_REQUESTED_SONGS) {
    console.error(
      "[ERR]: api/ranking/route.ts cannot read NEXT_MAX_REQUESTED_SONGS from .env",
    );
    return;
  }
  const rows = db
    .prepare(
      `
        SELECT *
        FROM songs
        ORDER BY votes DESC
        LIMIT ?
      `,
    )
    .all(limit);

  return rows;
}
