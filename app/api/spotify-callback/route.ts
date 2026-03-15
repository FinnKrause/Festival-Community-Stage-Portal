import { NextResponse } from "next/server";
import { setSpotifyUserCredentials } from "@/lib/spotifyUserCredentials";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  const client_id = process.env.SPOTIFY_CLIENT_ID!;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET!;
  const redirect_uri = process.env.SPOTIFY_REDIRECT_URI!;

  const params = new URLSearchParams();
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", redirect_uri);

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

  if (!res.ok) {
    const text = await res.text();
    console.error("Spotify auth error:", text);
    return NextResponse.json({ error: "Spotify auth failed" }, { status: 500 });
  }

  const data = await res.json();

  // Store tokens centrally
  setSpotifyUserCredentials({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  console.warn("[WARN] Received new UserAccessToken from Spotify ");

  return NextResponse.redirect(`${appUrl}/admin`);
}
