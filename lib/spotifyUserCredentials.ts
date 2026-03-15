let accessToken: string | null = null;
let refreshToken: string | null = null;
let expiresAt = 0;

export function setSpotifyUserCredentials({
  accessToken: a,
  refreshToken: r,
  expiresIn,
}: {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}) {
  accessToken = a;
  refreshToken = r;
  expiresAt = Date.now() + expiresIn * 1000;
}

export async function getSpotifyUserCredentialsToken(): Promise<string> {
  const now = Date.now();

  if (accessToken && now < expiresAt - 30000) {
    return accessToken;
  }

  if (!refreshToken) {
    throw new Error(
      "Spotify-User-Token not available because of missing Authentication on the Admin Page!",
    );
  }

  const client_id = process.env.SPOTIFY_CLIENT_ID!;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET!;

  const params = new URLSearchParams();
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", refreshToken);

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(client_id + ":" + client_secret).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data = await res.json();

  accessToken = data.access_token;
  expiresAt = now + data.expires_in * 1000;

  console.log("[INFO] Received new AccessToken from Spotify");

  return accessToken!;
}
