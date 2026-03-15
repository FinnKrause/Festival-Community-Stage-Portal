import db from "./db";

export function getRanking() {
  const rows = db
    .prepare(
      `
SELECT *
FROM songs
ORDER BY votes DESC
LIMIT 50
`,
    )
    .all();

  return rows;
}
