/* eslint-disable @typescript-eslint/no-explicit-any */
import { getSpotifyUserCredentialsToken } from "./spotifyUserCredentials";

type PlayerState = {
  playing: null | {
    title: string;
    artist: string;
    cover: string | null;
    url: string | null;
  };
  queue: {
    title: string;
    artist: string;
    cover: string | null;
    url: string | null;
  }[];
};

let cache: PlayerState = {
  playing: null,
  queue: [],
};

let lastFetch = 0;
const CACHE_TTL = Number(process.env.SPOTIFY_REFRESH_INTERVAL ?? 10000);

export async function getCachedPlayerState(): Promise<PlayerState> {
  const now = Date.now();

  if (now - lastFetch < CACHE_TTL) {
    return cache;
  }

  lastFetch = now;

  try {
    const token = await getSpotifyUserCredentialsToken();

    /* QUEUE + CURRENT TRACK */

    const queueRes = await fetch("https://api.spotify.com/v1/me/player/queue", {
      headers: { Authorization: `Bearer ${token}` },
    });

    let playing: PlayerState["playing"] = null;
    let queue: PlayerState["queue"] = [];

    if (queueRes.ok) {
      const q = await queueRes.json();

      /* CURRENTLY PLAYING */

      if (q.currently_playing) {
        const t = q.currently_playing;

        playing = {
          title: t.name,
          artist: t.artists.map((a: any) => a.name).join(", "),
          cover: t.album?.images?.[0]?.url ?? null,
          url: t.external_urls?.spotify ?? null,
        };
      }

      /* QUEUE */

      queue =
        q.queue?.slice(0, 3).map((t: any) => ({
          title: t.name,
          artist: t.artists.map((a: any) => a.name).join(", "),
          cover: t.album?.images?.[0]?.url ?? null,
          url: t.external_urls?.spotify ?? null,
        })) || [];
    }

    cache = { playing, queue };
  } catch (err: any) {
    console.error(
      "[ERR]: Auto-Update on Currently-Playing failed because: ",
      err?.message,
    );
  }

  return cache;
}
