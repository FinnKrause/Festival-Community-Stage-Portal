let token: string | null = null;
let tokenExpires = 0;

export async function getClientCredentialsToken() {
  if (token && Date.now() < tokenExpires) {
    return token;
  }

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(
          process.env.SPOTIFY_CLIENT_ID +
            ":" +
            process.env.SPOTIFY_CLIENT_SECRET,
        ).toString("base64"),
    },
    body: "grant_type=client_credentials",
  });

  const data = await res.json();

  token = data.access_token;
  tokenExpires = Date.now() + data.expires_in * 1000;
  return token;
}
