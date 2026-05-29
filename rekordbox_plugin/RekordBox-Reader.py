import json
import logging
import re
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

try:
    import requests
except ModuleNotFoundError:
    requests = None

#! ALERTE ROUGE
SERVICE_URL = "https://songreq.finnkrause.com/api/rekordbox-player"
#! ALERTE ROUGE

REPORT_PATH = (
    Path.home()
    / "Library"
    / "Application Support"
    / "Pioneer"
    / "rekordbox6"
    / ".cache"
    / ".spotify"
    / "report.json"
)

SPOTIFY_TRACK_RE = re.compile(
    r"(?:spotify:track:|open\.spotify\.com/track/)([A-Za-z0-9]+)"
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class PlayerState:
    spotify_id: str
    playing: bool
    playback_id: str
    position_ms: int
    sequence_number: int


def extract_spotify_id(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    match = SPOTIFY_TRACK_RE.search(value)
    return match.group(1) if match else None


def read_players() -> list[PlayerState]:
    if not REPORT_PATH.exists():
        logger.warning("Report file does not exist: %s", REPORT_PATH)
        return []

    try:
        text = REPORT_PATH.read_text(errors="replace")
    except OSError as exc:
        logger.warning("Could not read report file %s: %s", REPORT_PATH, exc)
        return []

    try:
        report = json.loads(text)
    except json.JSONDecodeError as exc:
        logger.warning("Invalid JSON in report file %s: %s", REPORT_PATH, exc)
        return []

    if not isinstance(report, dict):
        logger.warning(
            "Unexpected report structure: expected object, got %s",
            type(report).__name__,
        )
        return []

    raw_items = report.get("playbackReportInfo")
    if not isinstance(raw_items, list):
        logger.warning(
            "Missing or invalid playbackReportInfo field in report %s",
            REPORT_PATH,
        )
        return []

    players: list[PlayerState] = []
    for index, item in enumerate(raw_items, start=1):
        if not isinstance(item, dict):
            logger.warning("Skipping invalid playback item #%d: expected object", index)
            continue

        spotify_id = extract_spotify_id(item.get("trackUrl"))
        if not spotify_id:
            logger.info(
                "Skipping playback item #%d: missing or invalid Spotify track URL",
                index,
            )
            continue

        try:
            players.append(
                PlayerState(
                    spotify_id=spotify_id,
                    playing=not bool(item.get("paused")),
                    playback_id=str(item.get("playbackId") or ""),
                    position_ms=int(item.get("endPositionMs") or 0),
                    sequence_number=int(item.get("sequenceNumber") or 0),
                )
            )
        except (TypeError, ValueError) as exc:
            logger.warning(
                "Skipping playback item #%d due to invalid field type: %s",
                index,
                exc,
            )

    logger.debug("Loaded %d player records", len(players))
    return players


def choose_player(
    players: list[PlayerState],
    selected_playback_id: Optional[str],
) -> Optional[PlayerState]:
    by_playback_id = {player.playback_id: player for player in players}
    selected = by_playback_id.get(selected_playback_id or "")

    if selected and selected.playing:
        return selected

    playing_players = [player for player in players if player.playing]
    if playing_players:
        return max(playing_players, key=lambda player: player.position_ms)

    if selected:
        return selected

    if players:
        return max(players, key=lambda player: player.sequence_number)

    return None


def send_state(state: PlayerState) -> None:
    payload = {
        "spotify_id": state.spotify_id,
        "playing": state.playing,
    }

    logger.info("Prepared payload: %s", payload)

    if requests is None:
        logger.warning(
            "Cannot send state because the requests package is not installed"
        )
        return

    try:
        response = requests.post(SERVICE_URL, json=payload, timeout=5)
        response.raise_for_status()
        logger.info("State sent successfully: %s", response.status_code)
    except requests.RequestException as exc:
        logger.error("Failed to send state to %s: %s", SERVICE_URL, exc)


def watch() -> None:
    selected_playback_id: Optional[str] = None
    last_sent: Optional[tuple[str, bool]] = None

    while True:
        try:
            state = choose_player(read_players(), selected_playback_id)

            if state:
                selected_playback_id = state.playback_id
                current = (state.spotify_id, state.playing)

                if current != last_sent:
                    send_state(state)
                    last_sent = current
                else:
                    logger.debug("No state change detected")
            else:
                logger.debug("No valid player state found")
        except Exception:
            logger.exception("Unexpected error while reading report")

        time.sleep(1)


if __name__ == "__main__":
    try:
        watch()
    except KeyboardInterrupt:
        logger.info("Watcher stopped by user")
    except Exception:
        logger.exception("Unhandled exception in watcher")
