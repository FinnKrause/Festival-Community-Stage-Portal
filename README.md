# Festival Community Stage Portal

**A live, interactive song suggestion system for parties and events** — bridging the gap between the DJ and the crowd without interrupting the flow of music.

> Built by [Finn Krause](https://github.com/FinnKrause) for [FSI WiSo](https://fsi-wiso.de) events. The university group uses this tool but is not involved in development.

---

## 🎯 The Idea

Imagine this: A QR code on stage, at the bar, or on every table. Attendees scan it with their phones, open the portal, and suddenly — they're part of the musical experience. They see what's playing right now, suggest tracks they'd love to hear, and vote on what others have suggested.

The DJ doesn't have to play everything that gets requested. That's not the point. The point is to **get a feel for what the crowd is vibing with**, to spot emerging trends, and to let those suggestions inspire the set. When a song starts getting votes, you know people are excited about it. When you play it, the crowd feels heard — because they were part of the conversation.

No one needs to fight their way to the DJ booth. No shouting requests over the music. Just a simple, elegant way to let the crowd shape the atmosphere while the DJ stays focused on mixing and reading the room.

---

## 👥 For the Crowd

**What attendees experience:**

- 🎵 **See what's playing** — the current track is displayed prominently so everyone knows what's on
- 🔍 **Suggest any song** — search Spotify and add to the suggestion pool, no matter where you're standing
- 👍 **Vote with friends** — gather your crew to upvote your suggestions and push them up the leaderboard
- 📊 **Watch the leaderboard** — see in real-time which tracks are gaining momentum
- ⏱️ **Fresh suggestions only** — songs outside the top 3 expire after 30 minutes to keep the list relevant

**The experience:** Everyone participates. The crowd collectively signals what they want to hear. No one needs to interrupt the DJ.

---

## 🎛️ For the DJ / Organizer

**Admin Dashboard** (`/admin`)

- 👁️ **Live overview** — see all suggestions sorted by votes
- ✅ **One-click approval** — approved songs go directly to Spotify queue
- 🗑️ **Remove unwanted** — delete suggestions that don't fit the vibe
- 📝 **Server logs** — real-time activity feed
- 📊 **Viewer count** — see how many people are participating
- 🎵 **Spotify controls** — view currently playing and next 3 tracks

**Requirements:** Admin needs a Spotify Premium account to control playback.

---

## 🚀 Technical Highlights

The app is designed to be **lightweight and efficient**:

- **Minimal server load** — album art, track data, and all media assets are loaded directly from Spotify's CDN, not proxied through the server
- **Real-time updates via SSE** — no constant polling, just lightweight server-sent events when things change
- **Local-first voting** — device IDs stored in localStorage prevent vote spam without server-side sessions
- **SQLite for simplicity** — no external database dependencies, everything contained in a single file

---

## 🛠️ Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **SQLite** (better-sqlite3)
- **Tailwind CSS**
- **Spotify Web API**
- **Server-Sent Events** for real-time updates
- **Docker** deployment

---

## 🚀 Deployment & Setup

### Prerequisites

- Docker (or Node.js 20+ for local dev)
- Spotify Developer account
- Reverse proxy (nginx/Caddy) for SSL and admin route protection

### 1. Get Spotify Credentials

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app → get `Client ID` and `Client Secret`
3. Add redirect URI: `https://yourdomain.com/api/spotify-callback`
4. **Important:** In your Spotify app settings, add the admin's Spotify email(s) to "Users and Access" → otherwise the OAuth login will fail
5. See [Spotify's OAuth docs](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow) for details

### 2. Configure Environment

```bash
cp .env.example .env.local
```

| Variable                | Value                                         |
| ----------------------- | --------------------------------------------- |
| `SPOTIFY_CLIENT_ID`     | From Spotify Dashboard                        |
| `SPOTIFY_CLIENT_SECRET` | From Spotify Dashboard                        |
| `SPOTIFY_REDIRECT_URI`  | `https://yourdomain.com/api/spotify-callback` |
| `NEXT_PUBLIC_APP_URL`   | `https://yourdomain.com`                      |
| `MAX_REQUESTED_SONGS`   | Recommended: `25`                             |
| `SONG_TIMEOUT`          | `1800000` (30 min)                            |

### 3. Deploy with Docker

```bash
# Build the image
docker build -t festival-portal .

# Run with docker-compose
docker-compose up -d
```

The app runs on port `3000` internally — expose it via a reverse proxy.

### 4. Secure the Admin Route

**⚠️ This project has no built-in admin auth.** Protect `/admin` at the proxy level:

- Use **HTTP Basic Auth** with nginx/Caddy
- Or integrate **Authentik/Authelia** for SSO
- Never expose `/admin` publicly without authentication

**Spotify token security:** Admin tokens are stored in memory only (not persisted), auto-refreshed via refresh token flow.

---

## 📊 How It Works (Behind the Scenes)

1. **Attendee scans QR code** → opens the portal on their phone
2. **Suggests a song** → stored in SQLite with 1 vote, device ID prevents spam
3. **Friends vote together** → votes accumulate, pushing songs up the leaderboard
4. **Real-time updates** → leaderboard refreshes via SSE for everyone simultaneously
5. **DJ approves in dashboard** → song added to Spotify's active queue via API
6. **Auto-cleanup** → songs outside top 3 expire after timeout, keeping the list fresh

**Database Schema:**

- `songs`: id, spotify_id, title, artist, cover_url, votes, created_at, device_id
- `requests`: tracks which devices voted for which songs (prevents duplicate votes)

---

## ⚠️ Known Limitations

- Admin needs **Spotify Premium** to control playback
- SSE connections may drop on some hosts (reverse proxy helps)
- Spotify tokens expire on server restart (no persistent storage)

---

## 📄 License & Credits

**Author:** Finn Krause
**Organization:** Built for FSI WiSo events (independent project, not officially affiliated)  
**Source:** [github.com/FinnKrause/Festival-Community-Stage-Portal](https://github.com/FinnKrause/Festival-Community-Stage-Portal)

**License** View LICENSE.md file
