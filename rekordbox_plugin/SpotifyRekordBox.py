import base64
import contextlib
import io
import json
import mimetypes
import re
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import pyrekordbox.db6.database as rekordbox_database
import requests
from pyrekordbox import Rekordbox6Database
from pyrekordbox.db6.tables import DjmdContent

REKORDBOX_SETTINGS_DIR = (
    Path.home() / "Library" / "Application Support" / "Pioneer" / "rekordbox6"
)
REKORDBOX_DB_DIR = Path.home() / "Library" / "Pioneer" / "rekordbox"
REKORDBOX_SHARE_DIR = REKORDBOX_DB_DIR / "share"
REPORT_PATH = REKORDBOX_SETTINGS_DIR / ".cache" / ".spotify" / "report.json"
PLAY_SETTINGS_PATH = REKORDBOX_SETTINGS_DIR / "PlaySettings.xml"
SERVICE_URL = "https://songreq.finnkrause.com/api/rekordbox-player"
SPOTIFY_TRACK_RE = re.compile(
    r"(?:spotify:track:|open\.spotify\.com/track/)([A-Za-z0-9]+)"
)
PLAY_STATUS_RE = re.compile(r'name="PlayStatus(\d+)" val="(\d+)"')


@dataclass(frozen=True)
class PlayerState:
    source: str
    playing: bool
    identity: str
    position_ms: int
    sequence_number: int
    spotify_id: Optional[str] = None
    local_id: Optional[str] = None
    title: Optional[str] = None
    artist: Optional[str] = None
    cover_url: Optional[str] = None


def disable_rekordbox_process_check() -> None:
    rekordbox_database.get_rekordbox_pid = lambda: None


def extract_spotify_id(*values: Optional[str]) -> Optional[str]:
    for value in values:
        if not value:
            continue
        match = SPOTIFY_TRACK_RE.search(value)
        if match:
            return match.group(1)
    return None


def read_playing_states() -> list[bool]:
    try:
        text = PLAY_SETTINGS_PATH.read_text()
    except OSError:
        return [False, False]

    states = [False, False]
    for deck, status in PLAY_STATUS_RE.findall(text):
        deck_index = int(deck)
        if deck_index < len(states):
            states[deck_index] = status == "2"
    return states


def read_spotify_report() -> dict[str, tuple[bool, str, int, int]]:
    try:
        report = json.loads(REPORT_PATH.read_text())
    except (OSError, json.JSONDecodeError):
        return {}

    states: dict[str, tuple[bool, str, int, int]] = {}
    for item in report.get("playbackReportInfo") or []:
        spotify_id = extract_spotify_id(item.get("trackUrl"))
        if not spotify_id:
            continue

        states[spotify_id] = (
            not bool(item.get("paused")),
            str(item.get("playbackId") or spotify_id),
            int(item.get("endPositionMs") or 0),
            int(item.get("sequenceNumber") or 0),
        )

    return states


def read_artwork_data_url(image_path: Optional[str]) -> Optional[str]:
    if not image_path:
        return None

    path = REKORDBOX_SHARE_DIR / image_path.lstrip("/")
    if not path.exists():
        return None

    mime_type = mimetypes.guess_type(path)[0] or "image/jpeg"
    return (
        f"data:{mime_type};base64,{base64.b64encode(path.read_bytes()).decode('ascii')}"
    )


def get_loaded_tracks() -> list[PlayerState]:
    disable_rekordbox_process_check()
    playing_states = read_playing_states()
    spotify_report = read_spotify_report()

    with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(
        io.StringIO()
    ):
        with Rekordbox6Database() as db:
            contents = (
                db.get_content().order_by(DjmdContent.updated_at.desc()).limit(2).all()
            )

            players: list[PlayerState] = []
            for index, content in enumerate(contents):
                spotify_id = extract_spotify_id(content.FolderPath, content.FileNameL)
                playing = (
                    playing_states[index] if index < len(playing_states) else False
                )

                if spotify_id:
                    report_playing, playback_id, position_ms, sequence = (
                        spotify_report.get(
                            spotify_id,
                            (playing, spotify_id, 0, index),
                        )
                    )
                    players.append(
                        PlayerState(
                            source="spotify",
                            spotify_id=spotify_id,
                            playing=report_playing,
                            identity=playback_id,
                            position_ms=position_ms,
                            sequence_number=sequence,
                        )
                    )
                    continue

                players.append(
                    PlayerState(
                        source="local",
                        local_id=str(content.ID),
                        title=content.Title or content.FileNameL or "Unknown track",
                        artist=content.Artist.Name if content.Artist else "",
                        cover_url=read_artwork_data_url(content.ImagePath),
                        playing=playing,
                        identity=f"local:{content.ID}",
                        position_ms=0,
                        sequence_number=index,
                    )
                )

            return players


def choose_player(
    players: list[PlayerState],
    selected_identity: Optional[str],
) -> Optional[PlayerState]:
    by_identity = {player.identity: player for player in players}
    selected = by_identity.get(selected_identity or "")

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


def payload_for_state(state: PlayerState) -> dict[str, object]:
    payload: dict[str, object] = {
        "source": state.source,
        "playing": state.playing,
    }

    if state.source == "spotify":
        payload["spotify_id"] = state.spotify_id
        return payload

    payload.update(
        {
            "local_id": state.local_id,
            "title": state.title,
            "artist": state.artist,
            "cover_url": state.cover_url,
        }
    )
    return payload


def send_state(state: PlayerState) -> None:
    payload = payload_for_state(state)
    response = requests.post(SERVICE_URL, json=payload, timeout=5)
    response.raise_for_status()
    print(f"POST {SERVICE_URL}: {json.dumps(payload)}", flush=True)


def watch() -> None:
    selected_identity: Optional[str] = None
    last_sent: Optional[tuple[Optional[str], Optional[str], bool]] = None

    while True:
        state = choose_player(get_loaded_tracks(), selected_identity)

        if state:
            selected_identity = state.identity
            current = (state.spotify_id, state.local_id, state.playing)

            if current != last_sent:
                send_state(state)
                last_sent = current

        time.sleep(1)


if __name__ == "__main__":
    try:
        watch()
    except KeyboardInterrupt:
        pass
