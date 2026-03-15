import { getCachedPlayerState } from "@/lib/spotifyPlayerCache";

export async function GET() {
  const data = await getCachedPlayerState();
  return Response.json(data);
}
