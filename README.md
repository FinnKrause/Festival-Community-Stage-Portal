# Festival Community Stage Portal

**A live song request system for parties and events** — let attendees suggest tracks without interrupting the DJ. Requests go into a voting pool, and the admin (DJ/organizer) can approve and queue them directly to Spotify.

> Built by [Finn Krause](https://github.com/FinnKrause) for [FSI WiSo](https://fsi-wiso.de) events. The university group uses it but is not involved in development.

---

## 🎯 The Problem It Solves

DJs constantly get interrupted by song requests. This portal lets attendees submit and vote on tracks **without talking to the DJ**. The admin sees ranked requests and can queue approved songs directly to Spotify with one click — keeping the DJ focused on mixing, not managing requests.

---

## ⚡ Core Features

**Public Interface**

- Search Spotify and request songs
- Vote on pending requests (1 vote per device per song)
- Live leaderboard showing top requests
- Auto-expiration: songs outside top 3 expire after 30min

**Admin Dashboard** (`/admin`)

- View all requests sorted by votes
- Approve songs → added directly to Spotify queue
- Delete unwanted requests
- Live server logs and viewer count

**Spotify Integration**

- Shows currently playing track + next 3 songs
- Admin pushes approved songs directly to Spotify
- Requires Spotify Premium account for admin

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
cp .env.example .env
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
# Build
docker build -t festival-portal .

# Run with docker-compose
docker-compose up -d
```

The app runs on port `3000` internally — expose it via reverse proxy.

### 4. Secure the Admin Route

**This project has no built-in admin auth.** Protect `/admin` at the proxy level:

- Use **HTTP Basic Auth** with nginx/Caddy
- Or integrate **Authentik/Authelia** for SSO
- Never expose `/admin` publicly without authentication

**Spotify token security:** Admin tokens are stored in memory only (not persisted), auto-refreshed via refresh token flow.

---

## 📁 What Happens Under the Hood

1. **User requests song** → stored in SQLite with 1 vote (device ID prevents double-voting)
2. **Votes accumulate** → leaderboard updates via SSE in real-time
3. **Admin approves** → song added to Spotify's active queue via API
4. **Auto-cleanup** → songs outside top 3 expire after timeout (prevents stale requests)

**Database Schema:**

- `songs`: id, spotify_id, title, artist, cover_url, votes, created_at, device_id
- `requests`: tracks which devices voted for which songs (prevents duplicate votes)

---

## 🔧 API Routes (Key Ones)

| Route                     | Method | Purpose                            |
| ------------------------- | ------ | ---------------------------------- |
| `/api/search?q=`          | GET    | Search Spotify tracks              |
| `/api/add`                | POST   | Submit request                     |
| `/api/ranking`            | GET    | Get current leaderboard            |
| `/api/upvote`             | POST   | Vote for a song                    |
| `/api/events`             | GET    | SSE stream for real-time updates   |
| `/api/admin-queue-delete` | POST   | Queue song to Spotify (admin only) |
| `/api/admin-delete`       | POST   | Delete song (admin only)           |

---

## 🎨 Customization for Your Event

- **Logo:** Replace `/public/FSI-Logo2.png`
- **Accent color:** Change `ACCENT_GREEN` in `app/page.tsx` and `app/admin/page.tsx`
- **Event name:** Edit "WiWi '26 LIVE" in `app/page.tsx`
- **Queue capacity:** Adjust `MAX_REQUESTED_SONGS` in `.env`

---

## ⚠️ Known Limitations

- Admin needs **Spotify Premium** to control playback
- SSE connections may drop on some hosts (reverse proxy helps)
- Spotify tokens expire on server restart (no persistent storage)

---

## 📄 License & Credits

**Author:** Finn Krause ([mail@finnkrause.com](mailto:mail@finnkrause.com))  
**Organization:** Built for FSI WiSo events (independent project, not officially affiliated)  
**Source:** [github.com/FinnKrause/Festival-Community-Stage-Portal](https://github.com/FinnKrause/Festival-Community-Stage-Portal)

---

<p align="center">
  Made with 🎵 by Finn Krause
</p>
