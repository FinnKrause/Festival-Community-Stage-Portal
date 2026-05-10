/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import SpotifyPlayer from "@/components/SpotifyPlayer";
import { useAppState } from "@/hooks/useAppState";
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
      setSongs(await res.json());
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

  async function deleteSong(id: number) {
    await fetch("/api/admin-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  async function queueSong(id: number) {
    await fetch("/api/admin-queue-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
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
  style={{ background: "#0a0a1a" }}
>
  {/* Ambient glow - blue theme */}
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
    <div
      className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full"
      style={{ background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)" }}
    />
    <div
      className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full"
      style={{ background: "radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)" }}
    />
  </div>

  <div className="relative z-10 flex-1 flex flex-col max-w-[1600px] mx-auto w-full gap-3">

    {/* ── TOP ROW: Header + Player ── */}
    <div className="flex flex-row w-full gap-3 items-stretch">

      {/* Header card */}
      <div
        className="flex-[3] rounded-2xl border flex-shrink-0 overflow-hidden"
        style={{ background: "#0f0f1a", borderColor: "rgba(59,130,246,0.15)" }}
      >
        <div className="p-4 flex flex-wrap items-center justify-between gap-4 h-full">

          {/* Title */}
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 rounded-full" style={{ background: "#3b82f6" }} />
            <div>
              <h1 className="text-xl font-black tracking-tight text-white">Control Panel</h1>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] mt-0.5" style={{ color: "rgba(59,130,246,0.6)" }}>
                Live Management
              </p>
            </div>
          </div>

          {/* Viewers */}
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)" }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: "#3b82f6" }} />
            </span>
            <span className="text-base font-black" style={{ color: "#60a5fa" }}>{viewers}</span>
            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "rgba(96,165,250,0.7)" }}>Viewers</span>
          </div>

          {/* Spotify account */}
          <div className="flex items-center gap-2">
            {spotifyUser && (
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                {spotifyUser.image && (
                  <img src={spotifyUser.image} className="w-6 h-6 rounded-full object-cover" alt="" />
                )}
                <span className="text-[12px] font-semibold" style={{ color: "rgba(255,255,255,0.7)" }}>
                  {spotifyUser.name}
                </span>
              </div>
            )}
            <a
              href="/api/spotify-auth"
              className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap"
              style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", color: "#60a5fa" }}
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

    {/* ── MIDDLE ROW: Queue + Settings ── */}
    <div className="flex-1 min-h-[60vh] flex gap-3">

      {/* Request Queue */}
      <div
        className="flex-1 flex flex-col min-w-0 rounded-2xl border overflow-hidden"
        style={{ background: "#0f0f1a", borderColor: "rgba(59,130,246,0.15)" }}
      >
        {/* Table header */}
        <div
          className="px-4 py-2.5 flex items-center gap-2"
          style={{ borderBottom: "1px solid rgba(59,130,246,0.1)" }}
        >
          <h2 className="text-[9px] font-black uppercase tracking-[0.25em]" style={{ color: "rgba(96,165,250,0.6)" }}>
            Request Queue
          </h2>
          <span
            className="text-[9px] font-black px-1.5 py-0.5 rounded-md"
            style={{ background: "rgba(59,130,246,0.1)", color: "#60a5fa" }}
          >
            {songs.length}
          </span>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left">
            <thead
              className="sticky top-0 text-[9px] uppercase tracking-wider"
              style={{ background: "#0f0f1a", borderBottom: "1px solid rgba(59,130,246,0.1)" }}
            >
              <tr>
                <th className="px-4 py-2 font-black" style={{ color: "rgba(96,165,250,0.5)" }}>Track</th>
                <th className="px-4 py-2 font-black text-center" style={{ color: "rgba(96,165,250,0.5)" }}>Votes</th>
                <th className="px-4 py-2 font-black text-right" style={{ color: "rgba(96,165,250,0.5)" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {songs.map((s, i) => (
                <tr
                  key={s.id}
                  style={{ borderTop: i > 0 ? "1px solid rgba(59,130,246,0.08)" : "none" }}
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <img src={s.cover_url} className="w-9 h-9 rounded-xl object-cover flex-shrink-0" alt="" />
                      <div className="min-w-0">
                        <p className="text-[13px] font-black truncate leading-tight text-white">{s.title}</p>
                        <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.45)" }}>{s.artist}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black"
                      style={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.25)" }}
                    >
                      {s.votes}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => queueSong(s.id)}
                        className="px-3 py-1.5 text-[10px] font-black uppercase rounded-xl active:scale-95"
                        style={{
                          background: "rgba(59,130,246,0.12)",
                          border: "1px solid rgba(59,130,246,0.25)",
                          color: "#60a5fa",
                        }}
                      >
                        Queue
                      </button>
                      <button
                        onClick={() => deleteSong(s.id)}
                        className="px-3 py-1.5 text-[10px] font-black uppercase rounded-xl active:scale-95"
                        style={{
                          background: "rgba(239,68,68,0.08)",
                          border: "1px solid rgba(239,68,68,0.2)",
                          color: "rgba(239,68,68,0.8)",
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
              <p className="text-[9px] font-black uppercase tracking-[0.3em]" style={{ color: "rgba(255,255,255,0.15)" }}>
                No active requests
              </p>
            </div>
          )}
        </div>
      </div>

      {/* System Settings — collapsible */}
      <div
        className="rounded-2xl border flex-shrink-0 overflow-hidden flex flex-col"
        style={{
          background: "#0f0f1a",
          borderColor: "rgba(59,130,246,0.15)",
          width: settingsExpanded ? "22rem" : "2.5rem",
          transition: "width 0.25s ease",
        }}
      >
        {/* Collapsed */}
        {!settingsExpanded && (
          <button
            onClick={() => setSettingsExpanded(true)}
            className="w-full h-full flex flex-col items-center justify-center gap-4 py-6 active:opacity-70"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(96,165,250,0.4)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        )}

        {/* Expanded */}
        {settingsExpanded && (
          <div className="flex flex-col h-full min-w-0">
            {/* Settings header */}
            <div
              className="px-4 py-2.5 flex items-center justify-between gap-2 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(59,130,246,0.1)" }}
            >
              <h2 className="text-[9px] font-black uppercase tracking-[0.25em]" style={{ color: "rgba(96,165,250,0.6)" }}>
                Settings
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSettingsExpanded(false)}
                  className="w-6 h-6 rounded-full flex items-center justify-center active:opacity-70"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
                <button
                  onClick={pushNewApplicationState}
                  className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider active:scale-95"
                  style={{ background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.25)", color: "#60a5fa" }}
                >
                  Push Changes
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-4">

              {/* Toggles */}
              <div className="space-y-2">

                {[
                  { id: "enable_page", label: "Requests Possible" },
                  { id: "enable_dj", label: "DJ Mode" },
                  { id: "enable_player", label: "Player Active" },
                ].map((t) => {
                  const isOn = appState[t.id as keyof typeof appState] === "TRUE";
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <span className="text-[12px] font-semibold" style={{ color: "rgba(255,255,255,0.65)" }}>
                        {t.label}
                      </span>
                      <button
                        onClick={() => setAppState({ ...appState, [t.id]: isOn ? "FALSE" : "TRUE" })}
                        className="relative w-9 h-5 rounded-full flex-shrink-0"
                        style={{
                          background: isOn ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.08)",
                          border: isOn ? "1px solid rgba(96,165,250,0.4)" : "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        <div
                          className="absolute top-[3px] w-[14px] h-[14px] rounded-full"
                          style={{
                            background: isOn ? "#60a5fa" : "rgba(255,255,255,0.3)",
                            left: isOn ? "19px" : "3px",
                            transition: "left 0.15s ease, background 0.15s ease",
                          }}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Divider */}
              <div style={{ height: "1px", background: "rgba(59,130,246,0.1)" }} />

              {/* Text fields */}
              {[
                { key: "dp_message", label: "Maintenance Message", rows: 2, placeholder: "Maintenance message..." },
                { key: "dj_avatar_url", label: "DJ Avatar URL", rows: 1, placeholder: "https://..." },
                { key: "dj_message", label: "DJ Message", rows: 3, placeholder: "Message shown in DJ mode..." },
              ].map((f) => (
                <div key={f.key}>
                  <label className="text-[9px] font-black uppercase tracking-[0.2em] block mb-1" style={{ color: "rgba(96,165,250,0.5)" }}>
                    {f.label}
                  </label>
                  <textarea
                    value={(appState as any)[f.key] || ""}
                    onChange={(e) => setAppState({ ...appState, [f.key]: e.target.value })}
                    rows={f.rows}
                    placeholder={f.placeholder}
                    className="w-full p-2.5 text-[12px] rounded-xl resize-none outline-none focus:ring-1"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(59,130,246,0.2)",
                      color: "rgba(255,255,255,0.7)",
                      caretColor: "#60a5fa",
                    }}
                  />
                </div>
              ))}

              {/* DJ Name + Instagram */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "dj_name", label: "DJ Name", placeholder: "DJ Name" },
                  { key: "dj_insta", label: "Instagram", placeholder: "@handle" },
                ].map((f) => (
                  <div key={f.key}>
                    <label className="text-[9px] font-black uppercase tracking-[0.2em] block mb-1" style={{ color: "rgba(96,165,250,0.5)" }}>
                      {f.label}
                    </label>
                    <input
                      type="text"
                      value={(appState as any)[f.key] || ""}
                      onChange={(e) => setAppState({ ...appState, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="w-full p-2.5 text-[12px] rounded-xl outline-none focus:ring-1"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(59,130,246,0.2)",
                        color: "rgba(255,255,255,0.7)",
                        caretColor: "#60a5fa",
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* ── BOTTOM: Server Logs ── */}
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: "#0f0f1a", borderColor: "rgba(59,130,246,0.15)" }}
    >
      <div
        className="px-4 py-2.5 flex items-center gap-2"
        style={{ borderBottom: "1px solid rgba(59,130,246,0.1)" }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: shouldAutoScroll ? "#60a5fa" : "rgba(255,255,255,0.2)" }}
        />
        <h2 className="text-[9px] font-black uppercase tracking-[0.25em]" style={{ color: "rgba(96,165,250,0.6)" }}>
          Server Logs
        </h2>
      </div>
      <div
        ref={logRef}
        onScroll={handleLogScroll}
        className="max-h-32 overflow-y-auto p-3 space-y-0.5 font-mono text-[11px]"
        style={{ background: "rgba(0,0,0,0.3)" }}
      >
        {logs.map((l, i) => (
          <div key={i} className="flex gap-3">
            <span className="flex-shrink-0" style={{ color: "rgba(96,165,250,0.4)" }}>
              {new Date(l.time).toLocaleTimeString()}
            </span>
            <span
              style={{
                color:
                  l.level === "error"
                    ? "rgba(239,68,68,0.85)"
                    : l.level === "warn"
                    ? "rgba(234,179,8,0.8)"
                    : "rgba(255,255,255,0.5)",
              }}
            >
              {l.msg}
            </span>
          </div>
        ))}
        {logs.length === 0 && (
          <p className="text-[10px] italic" style={{ color: "rgba(255,255,255,0.15)" }}>
            Waiting for logs…
          </p>
        )}
      </div>
    </div>
  </div>
</main>
  );
}