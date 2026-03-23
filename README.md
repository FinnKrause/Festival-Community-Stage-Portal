# Festival Community Stage Portal

[![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-green)](https://github.com/WiseLibs/better-sqlite3)
[![Spotify API](https://img.shields.io/badge/Spotify-API-1DB954)](https://developer.spotify.com/)

**live, interactive song request system** for festivals and events — empowering attendees to shape the soundtrack of the night. Built for **WiWi '26** by the [FSI WiSo](https://fsi-wiso.de) team (independent community project).

<p align="center">
  <img src="/public/FSI-Logo2.png" alt="FSI WiSo Logo" width="150" />
</p>

## 📋 Overview

Festival Community Stage Portal transforms the traditional DJ booth into a collaborative experience. Attendees can request songs, vote on upcoming tracks, and watch the live leaderboard update in real-time — all while the admin panel provides full control over the Spotify playback queue.

**Live Demo Context:** This implementation was purpose-built for the WiWi '26 festival and is maintained by [Finn K.](https://github.com/FinnKrause) as a contribution to the FSI WiSo community.

---

## ✨ Features

### 🎵 **Public Song Request Interface**

- **Spotify Search** — Search tracks via Spotify's catalog
- **One-Click Requests** — Add songs to the voting pool (queue capacity: 20-30 songs)
- **Real-Time Leaderboard** — Sorted by votes, showing time remaining until expiration
- **Device-Based Voting** — Each device can vote once per song (prevents spam)
- **Auto-Expiration** — Songs outside the top 3 expire after 30 minutes (configurable)

### 🎛️ **Admin Dashboard** (Protected Route)

- **Full Queue Management** — View all requests with vote counts
- **Direct Spotify Integration** — Queue songs to Spotify's active player
- **Delete Inappropriate Requests** — Remove unwanted songs instantly
- **Live Server Logs** — Real-time monitoring with auto-scroll
- **Viewer Count** — See how many people are currently using the portal

### 🔊 **Spotify Integration**

- **Now Playing Display** — Shows current track with album art
- **Upcoming Queue Preview** — Next 3 songs in Spotify's queue
- **Automatic Refresh** — Configurable polling intervals
- **Token Management** — Client credentials + user OAuth token handling

### ⚡ **Real-Time Updates**

- **Server-Sent Events (SSE)** — Live ranking updates without polling
- **Heartbeat System** — Prevents disconnects on Safari and mobile browsers
- **Broadcast Logs** — Admin sees server activity in real-time

---

## 🏗️ Architecture

```
     ┌──────────────────┐     ┌─────────────────┐
   Public User   │────▶│   Next.js App    │────▶│   SQLite DB     │
  (Browser via   │     │  (Server Actions │     │  (Songs/Requests│
   Reverse Proxy)│     │   + API Routes)  │     │   + Votes)      │
     └──────────────────┘     └─────────────────┘
        │                        │                         │
        │                        ▼                         │
        │               ┌──────────────────┐               │
        └──────────────▶│   Spotify API    │◀──────────────┘
                        │  (Search/Queue/  │
                        │   Player State)  │
                        └──────────────────┘
                               ▲
                               │
                        ┌──────┴──────┐
                        │ Admin Panel │
                        │ (OAuth Flow)│
                        └─────────────┘
```

---

## 🛠️ Tech Stack

| Category                | Technology                                |
| ----------------------- | ----------------------------------------- |
| **Framework**           | Next.js 16 (App Router)                   |
| **Language**            | TypeScript                                |
| **Database**            | SQLite with better-sqlite3                |
| **Styling**             | Tailwind CSS                              |
| **Real-Time**           | Server-Sent Events (SSE)                  |
| **Spotify Integration** | Web API (Client Credentials + User OAuth) |
| **Deployment**          | Docker + Reverse Proxy (nginx/Caddy)      |
| **Utilities**           | use-debounce, ws (WebSocket for dev)      |

---

## 📦 Installation & Setup

### Prerequisites

- Node.js 20+ or Docker
- Spotify Developer Account (for API credentials)
- Reverse proxy (nginx/Caddy) for SSL and admin route protection

### Local Development

. **Clone the repository**

```bash
git clone https://github.com/FinnKrause/Festival-Community-Stage-Portal.git
cd Festival-Community-Stage-Portal
```

. **Install dependencies**

```bash
npm install
```

. **Set up environment variables**

```bash
cp .env.example .env.local
```

Fill in your Spotify credentials (see [Environment Variables](#environment-variables)).

. **Run the development server**

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

. **Initialize the admin session**

- Navigate to `/admin` and click "Spotify Login"
- Authorize the application to manage your Spotify playback

### Docker Deployment

. **Build the Docker image**

```bash
docker build -t festival-stage-portal .
```

. **Run with docker-compose**

```bash
docker-compose up -d
```

. **Configure reverse proxy** for SSL termination and admin route protection

---

## 🔧 Environment Variables

| Variable                     | Description                | Example                                       |
| ---------------------------- | -------------------------- | --------------------------------------------- |
| `SPOTIFY_CLIENT_ID`          | Spotify App Client ID      | `abc123...`                                   |
| `SPOTIFY_CLIENT_SECRET`      | Spotify App Client Secret  | `xyz789...`                                   |
| `SPOTIFY_REDIRECT_URI`       | OAuth callback URL         | `https://yourdomain.com/api/spotify-callback` |
| `NEXT_PUBLIC_APP_URL`        | Public app URL (for OAuth) | `https://yourdomain.com`                      |
| `SONG_TIMEOUT`               | Song expiration in ms      | `1800000` (30 min)                            |
| `SPOTIFY_REFRESH_INTERVAL`   | Player state refresh (ms)  | `5000`                                        |
| `NEXT_PUBLIC_PLAYER_REFRESH` | Client player refresh (ms) | `10000`                                       |
| `MAX_REQUESTED_SONGS`        | Max queue size             | `25`                                          |

---

## 🔒 Secure the Admin Route

project **does not include built-in authentication** for the admin panel. For production use:

. **Place the entire app behind a reverse proxy** (nginx, Caddy, Traefik)
. **Configure authentication at the proxy level** for the `/admin` route
. **Recommended:** Use Authentik, Authelia, or HTTP Basic Auth with strong credentials

### Spotify Token Security

- Client credentials are stored as environment variables (never exposed to client)
- User OAuth tokens are stored in memory (not persisted to database)
- Token refresh happens automatically via the refresh token flow

---

## 🚀 Deployment Recommendations

. **Use a reverse proxy** (nginx/Caddy) for SSL termination and admin route protection
. **Set up monitoring** for the Spotify token refresh (alerts if refresh fails)
. **Configure regular database backups** for the `data/songs.db` file
. **Set appropriate `MAX_REQUESTED_SONGS`** based on event duration (20-30 recommended)
. **Test the Spotify OAuth flow** before the event to ensure refresh tokens work

---

## 🎨 Customization for Your Event

this project was built for WiWi '26, you can adapt it:

- **Logo:** Replace `/public/FSI-Logo2.png` with your event branding
- **Colors:** Update `ACCENT_GREEN` in `app/page.tsx` and `app/admin/page.tsx`
- **Event Name:** Change "WiWi '26 LIVE" in the public header
- **Queue Size:** Adjust `MAX_REQUESTED_SONGS` in `.env`

---

## 📝 API Routes Overview

| Route                     | Method | Description                      |
| ------------------------- | ------ | -------------------------------- |
| `/api/search?q=`          | GET    | Search Spotify tracks            |
| `/api/add`                | POST   | Add song to voting pool          |
| `/api/ranking`            | GET    | Get current leaderboard          |
| `/api/upvote`             | POST   | Vote for a song                  |
| `/api/player`             | GET    | Get currently playing track      |
| `/api/queue-status`       | GET    | Check if queue is full           |
| `/api/events`             | GET    | SSE stream for real-time updates |
| `/api/admin-delete`       | POST   | Delete a song (admin)            |
| `/api/admin-queue-delete` | POST   | Queue song to Spotify (admin)    |
| `/api/spotify-auth`       | GET    | Initiate Spotify OAuth           |
| `/api/spotify-callback`   | GET    | OAuth callback handler           |

---

## 🐛 Known Limitations

- Spotify queue management requires an **active Spotify Premium account** for the admin
- SSE connections may be limited by hosting platforms (works best with reverse proxy)
- No persistent storage for Spotify tokens (tokens expire with server restart)

---

## 🤝 Contributing

project was created for a specific event, but contributions are welcome! If you'd like to improve the codebase:

. Fork the repository
. Create a feature branch (`git checkout -b feature/amazing-feature`)
. Commit your changes (`git commit -m 'Add amazing feature'`)
. Push to the branch (`git push origin feature/amazing-feature`)
. Open a Pull Request

---

## 📄 License

project is private and maintained by [Finn Krause](mailto:mail@finnkrause.com) for the FSI WiSo community. Please contact the author for licensing inquiries.

---

## 👏 Acknowledgments

- **FSI WiSo** — For fostering community-driven projects
- **Spotify** — For providing the API that makes this possible
- **WiWi '26** — The event that inspired this interactive experience

---

<p align="center">
  Made with 🎵 by <a href="https://github.com/FinnKrause">Finn Krause</a> for the <a href="https://fsi-wiso.de">FSI WiSo</a> community
</p>
