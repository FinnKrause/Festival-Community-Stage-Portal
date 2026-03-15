import { getSpotifyUserCredentialsToken } from "@/lib/spotifyUserCredentials";

export async function GET() {
  try {
    const token = await getSpotifyUserCredentialsToken();

    const res = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return Response.json(null);
    }

    const data = await res.json();

    return Response.json({
      name: data.display_name,
      image: data.images?.[0]?.url ?? null,
    });
  } catch {
    return Response.json(null);
  }
}
