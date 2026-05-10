import { AppState } from "@/lib/app_state";
import db from "@/lib/db";
import { broadcast } from "@/lib/events";

export async function GET(req: Request) {
  const result = db
    .prepare(
      `
    SELECT enable_page, enable_player, enable_dj, dp_message, dj_name, dj_insta, dj_message
    FROM app_state
    WHERE id = 1;
    `,
    )
    .get();

  return Response.json({ success: true, data: result });
}

export async function POST(req: Request) {
  const data = await req.json();
  const {
    enable_page,
    enable_dj,
    dp_message,
    dj_name,
    dj_insta,
    dj_message,
    enable_player,
  } = data;

  if (
    !enable_page ||
    !enable_player ||
    !enable_dj ||
    !dp_message ||
    !dj_insta ||
    !dj_name ||
    !dj_message
  )
    return Response.json({
      success: false,
      message: "Not all arguments provided!",
    });

  db.prepare(
    `
        UPDATE app_state 
        SET 
        enable_page = ?,
        enable_player = ?,
         enable_dj = ? ,
         dp_message = ? ,
         dj_name = ? ,
         dj_insta = ? ,
         dj_message = ?
        WHERE id=1`,
  ).run(
    enable_page,
    enable_player,
    enable_dj,
    dp_message,
    dj_name,
    dj_insta,
    dj_message,
  );

  console.warn("[WARN]: Updated the Application state");
  broadcast("app_state");

  return Response.json({ success: true });
}
