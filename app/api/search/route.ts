/* eslint-disable @typescript-eslint/no-explicit-any */
import { searchTracks } from "@/lib/spotifyControls";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const q = searchParams.get("q");

  if (!q) {
    return Response.json([]);
  }

  const data = await searchTracks(q);

  const tracks = data.tracks.items.map((t: any) => ({
    id: t.id,
    title: t.name,
    artist: t.artists.map((a: any) => a.name).join(", "),
    cover: t.album.images[0]?.url,
  }));

  return Response.json(tracks);
}
