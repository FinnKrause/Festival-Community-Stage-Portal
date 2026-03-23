HHDFD# Festival Community Stage Portal
HHDFD
HHDFD**A live song request system for parties and events** — let attendees suggest tracks without interrupting the DJ. Requests go into a voting pool, and the admin (DJ/organizer) can approve and queue them directly to Spotify.
HHDFD
HHDFD> Built by [Finn Krause](https://github.com/FinnKrause) for [FSI WiSo](https://fsi-wiso.de) events. The university group uses it but is not involved in development.
HHDFD
HHDFD---
HHDFD
HHDFD## 🎯 The Problem It Solves
HHDFD
HHDFDDJs constantly get interrupted by song requests. This portal lets attendees submit and vote on tracks **without talking to the DJ**. The admin sees ranked requests and can queue approved songs directly to Spotify with one click — keeping the DJ focused on mixing, not managing requests.
HHDFD
HHDFD---
HHDFD
HHDFD## 👥 For the Crowd
HHDFD
HHDFD**What attendees can do:**
HHDFD
HHDFD- 🎵 **See what's playing** — currently playing track displayed prominently
HHDFD- 🔍 **Suggest any song** — search Spotify and add to the voting pool, no matter where you are in the crowd
HHDFD- 👍 **Vote with friends** — gather your crew to upvote your suggestions and push them up the leaderboard
HHDFD- 📊 **Watch the leaderboard** — see real-time which tracks are gaining momentum
HHDFD- ⏱️ **Track expiration** — songs outside the top 3 disappear after 30 minutes to keep the queue fresh
HHDFD
HHDFD**The experience:** Everyone participates. The crowd collectively decides what they want to hear. No one needs to fight their way to the DJ booth.
HHDFD
HHDFD---
HHDFD
HHDFD## 🎛️ For the DJ / Organizer
HHDFD
HHDFD**Admin Dashboard** (`/admin`)
HHDFD
HHDFD- 👁️ **Live overview** — see all requests sorted by votes
HHDFD- ✅ **One-click approve** — approved songs go directly to Spotify queue
HHDFD- 🗑️ **Remove unwanted** — delete troll or inappropriate requests instantly
HHDFD- 📝 **Server logs** — real-time activity feed
HHDFD- 📊 **Viewer count** — see how many people are participating
HHDFD- 🎵 **Spotify controls** — view currently playing and next 3 tracks
HHDFD
HHDFD**Requirements:** Admin needs a Spotify Premium account to control playback.
HHDFD
HHDFD---
HHDFD
HHDFD## 🛠️ Tech Stack
HHDFD
HHDFD- **Next.js 16** (App Router, TypeScript)
HHDFD- **SQLite** (better-sqlite3)
HHDFD- **Tailwind CSS**
HHDFD- **Spotify Web API**
HHDFD- **Server-Sent Events** for real-time updates
HHDFD- **Docker** deployment
HHDFD
HHDFD---
HHDFD
HHDFD## 🚀 Deployment & Setup
HHDFD
HHDFD### Prerequisites
HHDFD
HHDFD- Docker (or Node.js 20+ for local dev)
HHDFD- Spotify Developer account
HHDFD- Reverse proxy (nginx/Caddy) for SSL and admin route protection
HHDFD
HHDFD### 1. Get Spotify Credentials
HHDFD
HHDFD1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
HHDFD2. Create a new app → get `Client ID` and `Client Secret`
HHDFD3. Add redirect URI: `https://yourdomain.com/api/spotify-callback`
HHDFD4. **Important:** In your Spotify app settings, add the admin's Spotify email(s) to "Users and Access" → otherwise the OAuth login will fail
HHDFD5. See [Spotify's OAuth docs](https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow) for details
HHDFD
HHDFD### 2. Configure Environment
HHDFD
HHDFD`bash
HHDFDcp .env.example .env.local
HHDFD`
HHDFD
HHDFD| Variable | Value |
HHDFD|----------|-------|
HHDFD| `SPOTIFY_CLIENT_ID` | From Spotify Dashboard |
HHDFD| `SPOTIFY_CLIENT_SECRET` | From Spotify Dashboard |
HHDFD| `SPOTIFY_REDIRECT_URI` | `https://yourdomain.com/api/spotify-callback` |
HHDFD| `NEXT_PUBLIC_APP_URL` | `https://yourdomain.com` |
HHDFD| `MAX_REQUESTED_SONGS` | Recommended: `25` |
HHDFD| `SONG_TIMEOUT` | `1800000` (30 min) |
HHDFD
HHDFD### 3. Deploy with Docker
HHDFD
HHDFD`bash
HHDFD# Build
HHDFDdocker build -t festival-portal .
HHDFD
HHDFD# Run with docker-compose
HHDFDdocker-compose up -d
HHDFD`
HHDFD
HHDFDThe app runs on port `3000` internally — expose it via a reverse proxy.
HHDFD
HHDFD### 4. Secure the Admin Route
HHDFD
HHDFD**⚠️ This project has no built-in admin auth.** Protect `/admin` at the proxy level:
HHDFD
HHDFD- Use **HTTP Basic Auth** with nginx/Caddy
HHDFD- Or integrate **Authentik/Authelia** for SSO
HHDFD- Never expose `/admin` publicly without authentication
HHDFD
HHDFD**Spotify token security:** Admin tokens are stored in memory only (not persisted), auto-refreshed via refresh token flow.
HHDFD
HHDFD---
HHDFD
HHDFD## 📊 How It Works (Behind the Scenes)
HHDFD
HHDFD1. **Attendee requests a song** → stored in SQLite with 1 vote (device ID prevents double-voting)
HHDFD2. **Friends vote together** → votes accumulate, pushing songs up the leaderboard
HHDFD3. **Real-time updates** → leaderboard refreshes via SSE for everyone
HHDFD4. **DJ approves in dashboard** → song added to Spotify's active queue via API
HHDFD5. **Auto-cleanup** → songs outside top 3 expire after timeout (keeps the list relevant)
HHDFD
HHDFD**Database Schema:**
HHDFD- `songs`: id, spotify_id, title, artist, cover_url, votes, created_at, device_id
HHDFD- `requests`: tracks which devices voted for which songs (prevents duplicate votes)
HHDFD
HHDFD---
HHDFD
HHDFD## ⚠️ Known Limitations
HHDFD
HHDFD- Admin needs **Spotify Premium** to control playback
HHDFD- SSE connections may drop on some hosts (reverse proxy helps)
HHDFD- Spotify tokens expire on server restart (no persistent storage)
HHDFD
HHDFD---
HHDFD
HHDFD## 🎨 Customization for Your Event
HHDFD
HHDFD- **Logo:** Replace `/public/FSI-Logo2.png`
HHDFD- **Color:** Change `ACCENT_GREEN` in `app/page.tsx` and `app/admin/page.tsx`
HHDFD- **Event name:** Edit "WiWi '26 LIVE" in header
HHDFD- **Queue size:** Adjust `MAX_REQUESTED_SONGS` in `.env`
HHDFD
HHDFD---
HHDFD
HHDFD## 📄 License & Credits
HHDFD
HHDFD**Author:** Finn Krause ([mail@finnkrause.com](mailto:mail@finnkrause.com))  
HHDFD**Organization:** Built for FSI WiSo events (independent project, not officially affiliated)  
HHDFD**Source:** [github.com/FinnKrause/Festival-Community-Stage-Portal](https://github.com/FinnKrause/Festival-Community-Stage-Portal)
HHDFD
HHDFD---
HHDFD
HHDFD<p align="center">
HHDFD Made with ❤️ by Finn Krause
HHDFD</p>
