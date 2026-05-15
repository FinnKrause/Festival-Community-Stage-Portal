import db from "@/lib/db";
import { getSpotifyUserCredentialsToken } from "../spotifyUserCredentials";
import { getRanking } from "../ranking";
import { addToSpotifyQueue } from "../spotifyControls";
import { broadcast } from "../events";
import { Song } from "../types";

function isAutoPlayEnabled(): boolean {
  const row = db
    .prepare(`SELECT enable_autoplay FROM app_state WHERE id=1`)
    .get() as { enable_autoplay: "TRUE" | "FALSE" };

  if (row.enable_autoplay === "TRUE") return true;
  else return false;
}

export async function getCurrentPlaybackProgressinPercent() {
  let token;

  try {
    token = await getSpotifyUserCredentialsToken();
  } catch (e) {
    return 0;
  }
  if (!token) return 0;

  const res = await fetch(`https://api.spotify.com/v1/me/player`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(
      "[ERR] Couldn't fetch the current playback progress. Error:",
      text,
    );
    return 0;
  }

  const data = await res.json();
  return data.progress_ms / data.item.duration_ms;
}

function getCurrentTopSong() {
  const rows = getRanking(2);
  if (typeof rows === "object" && rows?.length >= 0) return rows[0];
  else return null;
}

function addTopSongToQueue() {
  const data = getCurrentTopSong() as Song;

  try {
    if (data != undefined) {
      if (data.queued === "TRUE") return;

      addToSpotifyQueue(data.spotify_id!);
      db.prepare(
        `UPDATE songs SET queued = 'TRUE', queued_at = ? WHERE spotify_id=?`,
      ).run(Date.now(), data.spotify_id);

      console.log(
        `[INFO]: (Auto-Play) Song "${data.title}" from "${data.artist}" was automatically queued!`,
      );

      broadcast("ranking_update");
    } else {
      console.warn(
        "[WARN]: (Auto-Play) There are no currently-wished-for songs to automatically add to the queue!",
      );
    }
  } catch (e) {
    console.error(e);
  }
}

async function autoPlayWorker() {
  const shouldAutoplay = isAutoPlayEnabled();
  if (shouldAutoplay) {
    const currentTrackProgress = await getCurrentPlaybackProgressinPercent();
    if (currentTrackProgress > 0.8) {
      addTopSongToQueue();
    }
  }
}

export function startAutoPlay() {
  setTimeout(() => autoPlayWorker(), 3000);
  setInterval(autoPlayWorker, 30000);
}
