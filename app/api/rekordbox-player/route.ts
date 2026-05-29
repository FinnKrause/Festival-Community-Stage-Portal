import {
  getRekordboxPlayerState,
  setRekordboxPlayerState,
} from "@/lib/rekordboxPlayerState";

export async function GET() {
  return Response.json(getRekordboxPlayerState());
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  if (!body.spotify_id || !body.playing) {
    console.error(
      "[ERR]: Client sent new Rekordbox-Player-Data, but either no spotify_id or no playing_field was provided: " +
        JSON.stringify(body),
    );
    return;
  }

  setRekordboxPlayerState({
    spotify_id: body.spotify_id,
    playing: body.playing,
  });

  return Response.json({ success: true });
}
