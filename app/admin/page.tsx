/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import SpotifyPlayer from "@/components/SpotifyPlayer/SpotifyPlayer";
import { useAppState } from "@/hooks/useAppState";
import { Song } from "@/lib/types";
import { useEffect, useRef, useState } from "react";

export default function Admin() {
  const [songs, setSongs] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [viewers, setViewers] = useState(0);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [spotifyUser, setSpotifyUser] = useState<any | null>(null);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const { appState, setAppState, pushNewApplicationState } = useAppState();

  const logRef = useRef<HTMLDivElement | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/ranking");
      let songs = await res.json()
      songs = songs.filter((i: any) => i.queued === "FALSE")
      setSongs(songs);
    } catch (e) {
      console.error("load ranking failed", e);
    }
  }

  async function loadSpotifyUser() {
    try {
      const res = await fetch("/api/spotify-user");
      if (!res.ok) return;
      setSpotifyUser(await res.json());
    } catch {}
  }

  async function deleteSong(id: string) {
    await fetch("/api/admin-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spotify_id: id }),
    });
    load();
  }

  async function queueSong(id: string) {
    await fetch("/api/admin-queue-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spotify_id: id }),
    });
    load();
  }

  useEffect(() => {
    load();
    loadSpotifyUser();

    let ev: EventSource;
    function connect() {
      ev = new EventSource("/api/events");
      ev.onmessage = (e) => {
        if (!e.data) return;
        try {
          const msg = JSON.parse(e.data);
          if (msg.event === "ranking_update") load();
          if (msg.event === "server_log") setLogs((prev) => [...prev.slice(-199), msg.data]);
          if (msg.event === "viewer_count") setViewers(Math.max(0, msg.data - 1));
          if (msg.event === "spotify_login") loadSpotifyUser();
        } catch {}
      };
      ev.onerror = () => { ev.close(); setTimeout(connect, 2000); };
    }
    connect();
    return () => ev?.close();
  }, []);

  useEffect(() => {
    if (!shouldAutoScroll) return;
    const el = logRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [logs, shouldAutoScroll]);

  function handleLogScroll() {
    const el = logRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setShouldAutoScroll(atBottom);
  }

  return (
<main
  className="min-h-screen text-white antialiased flex flex-col p-3 font-sans"
  style={{ background: "#07071a" }}
>
  <div className="relative z-10 flex-1 flex flex-col max-w-[1600px] mx-auto w-full gap-3">

    {/* ── TOP ROW: Header + Player ── */}
    <div className="flex flex-row w-full gap-3 items-stretch">

      {/* Header card */}
      <div
        className="flex-[3] rounded-xl border flex-shrink-0 overflow-hidden"
        style={{ background: "#10102a", borderColor: "rgba(59,130,246,0.3)" }}
      >
        <div className="p-3 flex flex-wrap items-center justify-between gap-3 h-full">

          <div className="flex items-center gap-3">
            <div className="w-1 h-7 rounded-full" style={{ background: "#3b82f6" }} />
            <div>
              <h1 className="text-lg font-black tracking-tight text-white">Control Panel</h1>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: "rgba(147,197,253,0.7)" }}>
                Live Management
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2"
            style={{ background: "rgba(59,130,246,0.18)", border: "1px solid rgba(59,130,246,0.4)" }}
          >
            <span className="inline-flex h-2 w-2 rounded-full" style={{ background: "#60a5fa" }} />
            <span className="text-base font-black" style={{ color: "#93c5fd" }}>{viewers}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "rgba(147,197,253,0.8)" }}>Viewers</span>
          </div>

          <div className="flex items-center gap-2">
            {spotifyUser && (
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
              >
                {spotifyUser.image && (
                  <img src={spotifyUser.image} className="w-6 h-6 rounded-full object-cover" alt="" />
                )}
                <span className="text-[13px] font-semibold text-white">
                  {spotifyUser.name}
                </span>
              </div>
            )}
            <a
              href="/api/spotify-auth"
              className="px-3 py-2 rounded-lg text-[11px] font-black uppercase tracking-wider whitespace-nowrap"
              style={{ background: "rgba(59,130,246,0.18)", border: "1px solid rgba(59,130,246,0.4)", color: "#93c5fd" }}
            >
              {spotifyUser ? "Switch Account" : "Spotify Login"}
            </a>
          </div>
        </div>
      </div>

      {/* Spotify Player */}
      <div className="flex-1 min-w-[260px]">
        <SpotifyPlayer />
      </div>
    </div>

    {/* ── MIDDLE ROW: Queue + Settings toggle ── */}
    <div className="flex-1 flex gap-3 relative">

      {/* Request Queue — always full width, settings overlays */}
      <div
        className="flex-1 flex flex-col min-w-0 rounded-xl border overflow-hidden"
        style={{ background: "#10102a", borderColor: "rgba(59,130,246,0.3)" }}
      >
        {/* Table header */}
        <div
          className="px-4 py-2.5 flex items-center justify-between gap-2"
          style={{ borderBottom: "1px solid rgba(59,130,246,0.2)" }}
        >
          <div className="flex items-center gap-2">
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: "#93c5fd" }}>
              Request Queue
            </h2>
            <span
              className="text-[11px] font-black px-2 py-0.5 rounded-md"
              style={{ background: "rgba(59,130,246,0.25)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.4)" }}
            >
              {songs.length}
            </span>
            {appState.enable_autoplay==="TRUE" && <h2 className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: "#ff4d00" }}>
              AUTO QUEUE ACTIVE
            </h2>}
          </div>
          {/* Settings toggle button */}
          <button
            onClick={() => setSettingsExpanded(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider"
            style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)", color: "#93c5fd" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Settings
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left">
            <thead
              className="sticky top-0 text-[10px] uppercase tracking-wider"
              style={{ background: "#10102a", borderBottom: "1px solid rgba(59,130,246,0.2)" }}
            >
              <tr>
                <th className="px-4 py-2.5 font-black" style={{ color: "#93c5fd" }}>Track</th>
                <th className="px-4 py-2.5 font-black text-center" style={{ color: "#93c5fd" }}>Votes</th>
                <th className="px-4 py-2.5 font-black text-center" style={{ color: "#93c5fd"}}>Device</th>
                <th className="px-4 py-2.5 font-black text-right" style={{ color: "#93c5fd" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {songs.map((s: Song, i) => (
                <tr
                  key={s.spotify_id}
                  style={{ borderTop: i > 0 ? "1px solid rgba(59,130,246,0.12)" : "none" }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={s.cover_url} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" alt="" />
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold truncate leading-tight text-white">{s.title}</p>
                        <p className="text-[12px] truncate mt-0.5" style={{ color: "rgba(200,210,255,0.6)" }}>{s.artist}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-lg text-[12px] font-black"
                      style={{ background: "rgba(59,130,246,0.2)", color: "#93c5fd", border: "1px solid rgba(59,130,246,0.4)" }}
                    >
                      {s.votes}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className="inline-flex items-center px-2.5 py-1 rounded-lg text-[12px] font-black"
                      style={{ color: "#93c5fd"}}
                    >
                      {s.device_id}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => queueSong(s.spotify_id)}
                        className="px-3 py-1.5 text-[11px] font-black uppercase rounded-lg"
                        style={{
                          background: "rgba(59,130,246,0.2)",
                          border: "1px solid rgba(59,130,246,0.45)",
                          color: "#93c5fd",
                        }}
                      >
                        Queue
                      </button>
                      <button
                        onClick={() => deleteSong(s.spotify_id)}
                        className="px-3 py-1.5 text-[11px] font-black uppercase rounded-lg"
                        style={{
                          background: "rgba(239,68,68,0.12)",
                          border: "1px solid rgba(239,68,68,0.35)",
                          color: "rgba(252,165,165,0.9)",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {songs.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-[11px] font-black uppercase tracking-[0.3em]" style={{ color: "rgba(255,255,255,0.25)" }}>
                No active requests
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Settings — slide-over panel on top of queue */}
      {settingsExpanded && (
        <>
          {/* Backdrop */}
          <div
            className="absolute inset-0 z-10 rounded-xl"
            style={{ background: "rgba(7,7,26,0.5)" }}
            onClick={() => setSettingsExpanded(false)}
          />

          {/* Panel */}
          <div
            className="absolute right-0 top-0 bottom-0 z-20 flex flex-col rounded-xl border overflow-hidden"
            style={{
              background: "#10102a",
              borderColor: "rgba(59,130,246,0.35)",
              width: "24rem",
            }}
          >
            {/* Settings header */}
            <div
              className="px-4 py-3 flex items-center justify-between gap-2 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(59,130,246,0.2)" }}
            >
              <h2 className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: "#93c5fd" }}>
                Settings
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={pushNewApplicationState}
                  className="px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider"
                  style={{ background: "rgba(59,130,246,0.25)", border: "1px solid rgba(59,130,246,0.5)", color: "#93c5fd" }}
                >
                  Push Changes
                </button>
                <button
                  onClick={() => setSettingsExpanded(false)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)" }}
                >
                  Close
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-4">

              {/* Toggles */}
              <div className="space-y-2">
                {[
                  { id: "enable_autoplay", label: "Auto-Queue" },
                  { id: "enable_page", label: "Requests Possible" },
                  { id: "enable_dj", label: "DJ Mode" },
                  { id: "enable_player", label: "Player Active" },
                ].map((t) => {
                  const isOn = appState[t.id as keyof typeof appState] === "TRUE";
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between px-3 py-3 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                    >
                      <span className="text-[13px] font-semibold text-white">
                        {t.label}
                      </span>
                      <button
                        onClick={() => setAppState({ ...appState, [t.id]: isOn ? "FALSE" : "TRUE" })}
                        className="relative w-10 h-5 rounded-full flex-shrink-0"
                        style={{
                          background: isOn ? "rgba(59,130,246,0.6)" : "rgba(255,255,255,0.1)",
                          border: isOn ? "1px solid rgba(96,165,250,0.6)" : "1px solid rgba(255,255,255,0.15)",
                        }}
                      >
                        <div
                          className="absolute top-[3px] w-[14px] h-[14px] rounded-full"
                          style={{
                            background: isOn ? "#93c5fd" : "rgba(255,255,255,0.4)",
                            left: isOn ? "21px" : "3px",
                            transition: "left 0.15s ease",
                          }}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div style={{ height: "1px", background: "rgba(59,130,246,0.2)" }} />

              {/* Text fields */}
              {[
                { key: "dp_message", label: "Maintenance Message", rows: 3, placeholder: "Maintenance message..." },
                { key: "autoplay_message", label: "AutoPlay Message", rows: 3, placeholder: "Autplay message..." },
                { key: "dj_avatar_url", label: "DJ Avatar URL", rows: 2, placeholder: "https://..." },
                { key: "dj_message", label: "DJ Message", rows: 3, placeholder: "Message shown in DJ mode..." },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] block mb-1.5" style={{ color: "#93c5fd" }}>
                    {f.label}
                  </label>
                  <textarea
                    value={(appState as any)[f.key] || ""}
                    onChange={(e) => setAppState({ ...appState, [f.key]: e.target.value })}
                    rows={f.rows}
                    placeholder={f.placeholder}
                    className="w-full p-2.5 text-[13px] rounded-lg resize-none outline-none"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(59,130,246,0.3)",
                      color: "rgba(255,255,255,0.85)",
                      caretColor: "#60a5fa",
                    }}
                  />
                </div>
              ))}

              {/* DJ Name + Instagram */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "dj_name", label: "DJ Name", placeholder: "DJ Name" },
                  { key: "dj_insta", label: "Instagram", placeholder: "handle" },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] block mb-1.5" style={{ color: "#93c5fd" }}>
                      {f.label}
                    </label>
                    <input
                      type="text"
                      value={(appState as any)[f.key] || ""}
                      onChange={(e) => setAppState({ ...appState, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="w-full p-2.5 text-[13px] rounded-lg outline-none"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(59,130,246,0.3)",
                        color: "rgba(255,255,255,0.85)",
                        caretColor: "#60a5fa",
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>

    {/* ── BOTTOM: Server Logs ── */}
    <div
      className="rounded-xl border overflow-hidden"
      style={{ background: "#10102a", borderColor: "rgba(59,130,246,0.3)" }}
    >
      <div
        className="px-4 py-2.5 flex items-center gap-2"
        style={{ borderBottom: "1px solid rgba(59,130,246,0.2)" }}
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: shouldAutoScroll ? "#60a5fa" : "rgba(255,255,255,0.25)" }}
        />
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em]" style={{ color: "#93c5fd" }}>
          Server Logs
        </h2>
      </div>
      <div
        ref={logRef}
        onScroll={handleLogScroll}
        className="max-h-32 overflow-y-auto p-3 space-y-0.5 font-mono text-[12px]"
        style={{ background: "rgba(0,0,0,0.35)" }}
      >
        {logs.map((l, i) => (
          <div key={i} className="flex gap-3">
            <span className="flex-shrink-0" style={{ color: "rgba(147,197,253,0.6)" }}>
              {new Date(l.time).toLocaleTimeString()}
            </span>
            <span
              style={{
                color:
                  l.level === "error"
                    ? "rgba(252,165,165,0.95)"
                    : l.level === "warn"
                    ? "rgba(253,224,71,0.9)"
                    : "rgba(255,255,255,0.7)",
              }}
            >
              {l.msg}
            </span>
          </div>
        ))}
        {logs.length === 0 && (
          <p className="text-[11px] italic" style={{ color: "rgba(255,255,255,0.2)" }}>
            Waiting for logs…
          </p>
        )}
      </div>
    </div>
  </div>
</main>
  );
}