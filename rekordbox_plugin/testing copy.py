import json
import re
import time
import urllib.request
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Optional

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
SERVICE_URL = "https://example.com/rekordbox-state"
SPOTIFY_TRACK_RE = re.compile(
    r"(?:spotify:track:|open\.spotify\.com/track/)([A-Za-z0-9]+)"
)


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
    try:
        report = json.loads(REPORT_PATH.read_text())
    except (OSError, json.JSONDecodeError):
        return []

    players: list[PlayerState] = []
    for item in report.get("playbackReportInfo", []):
        spotify_id = extract_spotify_id(item.get("trackUrl"))
        if not spotify_id:
            continue

        players.append(
            PlayerState(
                spotify_id=spotify_id,
                playing=not bool(item.get("paused")),
                playback_id=str(item.get("playbackId") or ""),
                position_ms=int(item.get("endPositionMs") or 0),
                sequence_number=int(item.get("sequenceNumber") or 0),
            )
        )

    return players


def choose_player(
    players: list[PlayerState],
    selected_playback_id: Optional[str],
) -> Optional[PlayerState]:
    by_playback_id = {player.playback_id: player for player in players}
    selected = by_playback_id.get(selected_playback_id or "")

    # Keep the current active player while it is still playing. This prevents a
    # second started deck from replacing the first until the first stops.
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

    print(f"Would POST: {json.dumps(payload)}", flush=True)

    # Enable this once the service URL is known.
    # request = urllib.request.Request(
    #     SERVICE_URL,
    #     data=json.dumps(payload).encode("utf-8"),
    #     headers={"Content-Type": "application/json"},
    #     method="POST",
    # )
    # with urllib.request.urlopen(request, timeout=5) as response:
    #     response.read()


def watch() -> None:
    selected_playback_id: Optional[str] = None
    last_sent: Optional[tuple[str, bool]] = None

    while True:
        state = choose_player(read_players(), selected_playback_id)

        if state:
            selected_playback_id = state.playback_id
            current = (state.spotify_id, state.playing)

            if current != last_sent:
                send_state(state)
                last_sent = current

        time.sleep(1)


if __name__ == "__main__":
    watch()
