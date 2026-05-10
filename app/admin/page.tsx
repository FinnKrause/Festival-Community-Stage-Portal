/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import SpotifyPlayer from "@/components/SpotifyPlayer";
import { useAppState } from "@/hooks/useAppState";
import { useEffect, useRef, useState } from "react";

const ACCENT_GREEN = "#1c7537";

export default function Admin() {
  const [songs, setSongs] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [viewers, setViewers] = useState(0);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [spotifyUser, setSpotifyUser] = useState<any | null>(null);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const {appState, setAppState, pushNewApplicationState} = useAppState();

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
    <main className="min-h-screen bg-[#F3F4F6] text-[#111827] p-3 font-sans antialiased flex flex-col">
      <div className="flex-1 flex flex-col max-w-[1600px] mx-auto w-full gap-3">

        <div className="flex flex-row w-full gap-3">
          {/* Top Bar - Header Section (takes only needed space) */}
          <div className="flex-3 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-shrink-0">
            <div className="p-4 flex flex-wrap items-center justify-between gap-4">
              {/* Header Left */}
              <div className="flex items-center gap-4">
                <span
                  className="w-2 h-8 rounded-full"
                  style={{ backgroundColor: ACCENT_GREEN }}
                ></span>
                <div>
                  <h1 className="text-2xl font-black tracking-tight">Control Panel</h1>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mt-0.5">
                    Live Management
                  </p>
                </div>
              </div>

              {/* Viewers Badge - Made to stand out */}
              <div className="flex items-center gap-2  rounded-lg px-3 py-2">
                <span className="text-lg font-black text-green-700">{viewers}</span>
                <span className="text-[10px] font-bold uppercase text-green-600 tracking-wider">Viewers</span>
              </div>

              {/* Account Section */}
              <div className="flex items-center gap-3">
                {spotifyUser && (
                  <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                    {spotifyUser.image && (
                      <img src={spotifyUser.image} className="w-7 h-7 rounded-full" alt="" />
                    )}
                    <span className="text-sm font-semibold text-gray-700">{spotifyUser.name}</span>
                  </div>
                )}
                <a
                  href="/api/spotify-auth"
                  className="px-4 py-2 bg-gray-900 text-white text-[11px] font-bold uppercase tracking-wider rounded-lg hover:bg-black transition-colors text-center whitespace-nowrap"
                >
                  {spotifyUser ? "Switch Account" : "Spotify Login"}
                </a>
              </div>
            </div>
          </div>

          {/* Spotify Player - Takes remaining space */}
          <div className="flex-1">
            <SpotifyPlayer />
          </div>
        </div>



        {/* Center Row - Request Queue + Expanding System Settings (min 60% height) */}
        <div className="flex-1 min-h-[60vh] flex gap-3">
          
          {/* Request Queue - Takes remaining space */}
          <div className="flex-1 flex flex-col min-w-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-2 border-b border-gray-100">
              <h2 className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                Request Queue ({songs.length})
              </h2>
            </div>
            
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-gray-50/95 backdrop-blur-sm border-b border-gray-100 text-[10px] uppercase tracking-wider text-gray-400">
                  <tr>
                    <th className="px-4 py-2 font-bold">Track</th>
                    <th className="px-4 py-2 font-bold text-center">Votes</th>
                    <th className="px-4 py-2 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {songs.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-3">
                          <img src={s.cover_url} className="w-10 h-10 rounded-lg object-cover shadow-sm" alt="" />
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate leading-tight">{s.title}</p>
                            <p className="text-xs text-gray-500 truncate">{s.artist}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-600">
                          {s.votes}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => queueSong(s.id)} 
                            className="px-3 py-1.5 bg-white border border-gray-200 text-[#1c7537] text-[10px] font-bold uppercase rounded-lg hover:bg-green-50 hover:border-green-200 transition-all active:scale-95"
                          >
                            QUEUE
                          </button>
                          <button 
                            onClick={() => deleteSong(s.id)} 
                            className="px-3 py-1.5 bg-white border border-gray-200 text-red-500 text-[10px] font-bold uppercase rounded-lg hover:bg-red-50 hover:border-red-200 transition-all active:scale-95"
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
                <div className="py-16 text-center">
                  <p className="text-sm font-bold text-gray-300 italic uppercase tracking-widest">No active requests</p>
                </div>
              )}
            </div>
          </div>

          {/* System Settings - Expands Horizontally */}
          <div 
            className={`
              bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 ease-in-out flex-shrink-0
              ${settingsExpanded ? 'w-96' : 'w-10'}
            `}
          >
            {/* Collapsed View */}
            {!settingsExpanded && (
              <button
                onClick={() => setSettingsExpanded(true)}
                className="w-full h-full flex flex-col items-center justify-center gap-3 py-4 hover:bg-gray-50 transition-colors"
              >


                <span className="text-gray-400 text-xs">◀</span>
              </button>
            )}

            {/* Expanded View */}
            {settingsExpanded && (
              <div className="flex flex-col h-full">
                <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                  <h2 className="text-[11px] font-black uppercase tracking-wider text-gray-400">
                    System Settings
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={pushNewApplicationState}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-tighter rounded-md hover:bg-gray-200 transition-all"
                    >
                      PUSH CHANGES
                    </button>
                    <button
                      onClick={() => setSettingsExpanded(false)}
                      className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                      <span className="text-gray-500 text-xs">▶</span>
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-auto p-4 space-y-2">
                  {/* Toggles */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-gray-400">Controls</label>
                    {[
                      { id: 'enable_page', label: 'Requests Possible' },
                      { id: 'enable_dj', label: 'DJ Mode' },
                      { id: 'enable_player', label: 'Player Active' }
                    ].map((t) => (
                      <div key={t.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                        <span className="text-[11px] font-medium text-gray-700">{t.label}</span>
                        <button
                          onClick={() => setAppState({ ...appState, [t.id]: appState[t.id as keyof AppState] === "TRUE" ? "FALSE" : "TRUE" })}
                          className={`w-8 h-4 rounded-full relative transition-colors ${appState[t.id as keyof AppState] === "TRUE" ? "bg-green-500" : "bg-gray-300"}`}
                        >
                          <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${appState[t.id as keyof AppState] === "TRUE" ? "left-4.5" : "left-0.5"}`} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Maintenance Message */}
                  <div>
                    <label className="text-[9px] font-black uppercase text-gray-400">Maintenance Message</label>
                    <textarea
                      value={appState.dp_message || ""}
                      onChange={(e) => setAppState({ ...appState, dp_message: e.target.value })}
                      className="w-full mt-1 p-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none"
                      rows={2}
                      placeholder="Maintenance message..."
                    />
                  </div>

                  {/* DJ Info */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-black uppercase text-gray-400">DJ Name</label>
                      <input
                        type="text"
                        value={appState.dj_name || ""}
                        onChange={(e) => setAppState({ ...appState, dj_name: e.target.value })}
                        className="w-full mt-1 p-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300"
                        placeholder="DJ Name"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-gray-400">Instagram</label>
                      <input
                        type="text"
                        value={appState.dj_insta || ""}
                        onChange={(e) => setAppState({ ...appState, dj_insta: e.target.value })}
                        className="w-full mt-1 p-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300"
                        placeholder="@instagram"
                      />
                    </div>
                  </div>

                  {/* DJ-Avatar Message */}
                  <div>
                    <label className="text-[9px] font-black uppercase text-gray-400">DJ-Profilbild</label>
                    <textarea
                      value={appState.dj_avatar_url || ""}
                      onChange={(e) => setAppState({ ...appState, dj_avatar_url: e.target.value })}
                      className="w-full mt-1 p-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none"
                      rows={1}
                      placeholder="URL des Profilbildes"
                    />
                  </div>

                  {/* Block Message */}
                  <div>
                    <label className="text-[9px] font-black uppercase text-gray-400">DJ-Message</label>
                    <textarea
                      value={appState.dj_message || ""}
                      onChange={(e) => setAppState({ ...appState, dj_message: e.target.value })}
                      className="w-full mt-1 p-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 resize-none"
                      rows={3}
                      placeholder="Message shown when page is blocked..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Server Logs - Compact at bottom */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-100 text-[10px] font-black uppercase tracking-wider text-gray-400">
            Server Logs
          </div>
          <div 
            ref={logRef} 
            onScroll={handleLogScroll} 
            className="max-h-32 overflow-y-auto font-mono text-[11px] p-3 space-y-1 bg-gray-50"
          >
            {logs.map((l, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-gray-400 shrink-0">{new Date(l.time).toLocaleTimeString()}</span>
                <span className={l.level === "error" ? "text-red-500" : l.level === "warn" ? "text-yellow-600" : "text-gray-700"}>{l.msg}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}