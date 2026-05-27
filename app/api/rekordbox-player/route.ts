import {
  getRekordboxPlayerState,
  setRekordboxPlayerState,
} from "@/lib/rekordboxPlayerState";

export async function GET() {
  return Response.json(getRekordboxPlayerState());
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  if (
    !body ||
    typeof body.playing !== "boolean" ||
    (typeof body.spotify_id !== "string" &&
      (body.source !== "local" || typeof body.title !== "string"))
  ) {
    return Response.json(
      {
        error:
          "Expected a Spotify state with spotify_id or a local state with source='local' and title",
      },
      { status: 400 },
    );
  }

  const state = await setRekordboxPlayerState({
    source: body.source === "local" ? "local" : "spotify",
    spotify_id: body.spotify_id,
    local_id: body.local_id,
    playing: body.playing,
    title: body.title,
    artist: body.artist,
    cover_url: body.cover_url,
  });

  return Response.json(state);
}
