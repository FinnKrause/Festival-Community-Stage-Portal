import { getClientCredentialsToken } from "./spotifyClientCredentials";

export type RekordboxPlayerInput = {
  source?: "spotify" | "local";
  spotify_id?: string;
  local_id?: string;
  playing: boolean;
  title?: string | null;
  artist?: string | null;
  cover_url?: string | null;
};

export type RekordboxPlayerState = {
  source: "spotify" | "local";
  spotify_id: string | null;
  local_id: string | null;
  playing: boolean;
  title: string | null;
  artist: string | null;
  cover_url: string | null;
  url: string | null;
  updated_at: number;
};

type SpotifyTrackResponse = {
  name?: string;
  artists?: { name?: string }[];
  album?: { images?: { url?: string }[] };
  external_urls?: { spotify?: string };
};

let state: RekordboxPlayerState | null = null;

async function fetchSpotifyTrack(
  spotify_id: string,
): Promise<SpotifyTrackResponse> {
  const token = await getClientCredentialsToken();

  const res = await fetch(
    `https://api.spotify.com/v1/tracks/${encodeURIComponent(spotify_id)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

function isSpotifyInput(input: RekordboxPlayerInput) {
  return input.source === "spotify" || Boolean(input.spotify_id);
}

export async function setRekordboxPlayerState(
  input: RekordboxPlayerInput,
): Promise<RekordboxPlayerState> {
  const source = isSpotifyInput(input) ? "spotify" : "local";
  let title = input.title ?? null;
  let artist = input.artist ?? null;
  let cover_url = input.cover_url ?? null;
  let url: string | null = null;

  if (source === "spotify" && input.spotify_id) {
    try {
      const track = await fetchSpotifyTrack(input.spotify_id);

      title = track.name ?? null;
      artist =
        track.artists
          ?.map((a) => a.name)
          .filter((name): name is string => Boolean(name))
          .join(", ") ?? null;
      cover_url = track.album?.images?.[0]?.url ?? null;
      url = track.external_urls?.spotify ?? null;
    } catch (err: unknown) {
      console.error(
        "[ERR]: Could not fetch Rekordbox Spotify track metadata:",
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  state = {
    source,
    spotify_id: input.spotify_id ?? null,
    local_id: input.local_id ?? null,
    playing: input.playing,
    title,
    artist,
    cover_url,
    url,
    updated_at: Date.now(),
  };

  return state;
}

export function getRekordboxPlayerState() {
  if (state && state?.updated_at + 60000 < new Date().getTime()) state = null;
  return state;
}
