import db from "@/lib/db";
import { broadcast } from "@/lib/events";

export async function GET(req: Request) {
  const result = db
    .prepare(
      `
    SELECT *
    FROM app_state
    WHERE id = 1;
    `,
    )
    .get();

  return Response.json({ error: false, data: result });
}

export async function POST(req: Request) {
  const data = await req.json();
  const {
    enable_autoplay,
    enable_page,
    enable_dj,
    dp_message,
    autoplay_message,
    dj_name,
    dj_insta,
    dj_message,
    enable_spotify_player,
    enable_rekordbox_player,
    dj_avatar_url,
  } = data;

  if (
    !enable_autoplay ||
    !enable_page ||
    !enable_spotify_player ||
    !enable_rekordbox_player ||
    !enable_dj ||
    !dp_message ||
    !dj_insta ||
    !dj_name ||
    !dj_message ||
    !dj_avatar_url ||
    !autoplay_message
  )
    return Response.json({
      error: true,
      message: "Not all arguments provided!",
    });

  db.prepare(
    `
        UPDATE app_state 
        SET 
        enable_autoplay = ?,
        enable_page = ?,
        enable_spotify_player = ?,
        enable_rekordbox_player = ?,
         enable_dj = ? ,
         dp_message = ? ,
         autoplay_message = ? ,
         dj_name = ? ,
         dj_insta = ? ,
         dj_message = ?,
         dj_avatar_url = ?
        WHERE id=1`,
  ).run(
    enable_autoplay,
    enable_page,
    enable_spotify_player,
    enable_rekordbox_player,
    enable_dj,
    dp_message,
    autoplay_message,
    dj_name,
    dj_insta,
    dj_message,
    dj_avatar_url,
  );

  console.warn("[WARN]: Updated the Application state");
  broadcast("app_state");

  return Response.json({ success: true });
}
