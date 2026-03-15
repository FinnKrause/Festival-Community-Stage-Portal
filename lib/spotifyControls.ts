import { getSpotifyUserCredentialsToken } from "./spotifyUserCredentials";
import { getClientCredentialsToken } from "./spotifyClientCredentials";

export async function addToSpotifyQueue(spotify_id: string) {
  const token = await getSpotifyUserCredentialsToken();

  const res = await fetch(
    `https://api.spotify.com/v1/me/player/queue?uri=spotify:track:${encodeURIComponent(
      spotify_id,
    )}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("[ERR] Spotify Queue error:", text);
  } else {
    // console.log(
    //   "[PASS] Track " + spotify_id + " was added to the queue by the Admin-UI.",
    // );
  }
}

export async function searchTracks(query: string) {
  const t = await getClientCredentialsToken();

  const res = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`,
    {
      headers: {
        Authorization: `Bearer ${t}`,
      },
    },
  );

  return res.json();
}
