/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import SpotifyPlayer from "@/components/SpotifyPlayer";
import { useEffect, useRef, useState } from "react";

const ACCENT_GREEN = "#1c7537";

export default function Admin() {
  const [songs, setSongs] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [viewers, setViewers] = useState(0);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [spotifyUser, setSpotifyUser] = useState<any | null>(null);

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
      const data = await res.json();
      setSpotifyUser(data);
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

          if (msg.event === "ranking_update") {
            load();
          }

          if (msg.event === "server_log") {
            setLogs((prev) => [...prev.slice(-199), msg.data]);
          }

          if (msg.event === "viewer_count") {
            setViewers(Math.max(0, msg.data - 1));
          }

          if (msg.event === "spotify_login") {
            loadSpotifyUser();
          }
        } catch {}
      };

      ev.onerror = () => {
        ev.close();
        setTimeout(connect, 2000);
      };
    }

    connect();

    return () => ev?.close();
  }, []);

  /* AUTO SCROLL WHEN NEW LOGS ARRIVE */
  useEffect(() => {
    if (!shouldAutoScroll) return;

    const el = logRef.current;
    if (!el) return;

    el.scrollTop = el.scrollHeight;
  }, [logs, shouldAutoScroll]);

  /* DETECT USER SCROLL POSITION */
  function handleLogScroll() {
    const el = logRef.current;
    if (!el) return;

    const threshold = 40;

    const atBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;

    setShouldAutoScroll(atBottom);
  }

  return (
    <main className="h-screen bg-[#F3F4F6] text-[#111827] p-4 md:p-10 font-sans antialiased">
      <div className="max-w-5xl mx-auto h-full flex flex-col gap-6">

        {/* Unified Dashboard Header */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">

            {/* LEFT SIDE */}
            <div>
              <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                <span
                  className="w-2 h-5 rounded-full"
                  style={{ backgroundColor: ACCENT_GREEN }}
                ></span>
                Control Panel
              </h1>

              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                Live Management
              </p>

              <p className="text-[11px] text-gray-400 font-bold mt-1">
                👁 {viewers} Viewers
              </p>
            </div>

            <SpotifyPlayer />

            {/* SPOTIFY ACCOUNT */}
            <div className="flex flex-col items-center gap-3">

              {spotifyUser && (
                <div className="flex flex-row items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                  {spotifyUser.image && (
                    <img
                      src={spotifyUser.image}
                      className="w-7 h-7 rounded-full"
                      alt=""
                    />
                  )}
                  <span className="text-xs font-bold text-gray-700">
                    {spotifyUser.name}
                  </span>
                </div>
              )}

              <a
                href="/api/spotify-auth"
                className="px-4 py-2 bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-black transition-colors text-center"
              >
                {spotifyUser
                  ? "Switch Account"
                  : "Spotify Login"}
              </a>

            </div>
          </div>
        </div>

        {/* Management Table */}
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex justify-between items-center px-1 mb-2">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
              Request Queue ({songs.length})
            </h2>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
            <div className="overflow-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-gray-50/90 backdrop-blur border-b border-gray-100 text-[10px] uppercase tracking-widest text-gray-400">
                  <tr>
                    <th className="px-6 py-4 font-bold">Track</th>
                    <th className="px-6 py-4 font-bold text-center">Votes</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-50">
                  {songs.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={s.cover_url}
                            className="w-10 h-10 rounded-lg object-cover shadow-sm"
                            alt=""
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate leading-none mb-1">
                              {s.title}
                            </p>
                            <p className="text-xs text-gray-500 truncate font-medium">
                              {s.artist}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black bg-gray-100 text-gray-600">
                          {s.votes}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => queueSong(s.id)}
                            className="px-4 py-2 bg-white border border-gray-200 text-[#1c7537] text-[10px] font-black uppercase tracking-tighter rounded-xl hover:border-[#1c7537] hover:bg-green-50 transition-all active:scale-95"
                          >
                            QUEUE
                          </button>

                          <button
                            onClick={() => deleteSong(s.id)}
                            className="px-4 py-2 bg-white border border-gray-200 text-red-500 text-[10px] font-black uppercase tracking-tighter rounded-xl hover:border-red-200 hover:bg-red-50 transition-all active:scale-95"
                          >
                            DELETE
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {songs.length === 0 && (
                <div className="py-20 text-center">
                  <p className="text-sm font-bold text-gray-300 italic uppercase tracking-widest">
                    No active requests
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Server Logs */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-3 border-b border-gray-100 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
            Server Logs
          </div>

          <div
            ref={logRef}
            onScroll={handleLogScroll}
            className="max-h-30 overflow-y-auto font-mono text-[11px] p-4 space-y-1 bg-gray-50"
          >
            {logs.map((l, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-gray-400 shrink-0">
                  {new Date(l.time).toLocaleTimeString()}
                </span>

                <span
                  className={
                    l.level === "error"
                      ? "text-red-500"
                      : l.level === "warn"
                      ? "text-yellow-600"
                      : "text-gray-700"
                  }
                >
                  {l.msg}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}