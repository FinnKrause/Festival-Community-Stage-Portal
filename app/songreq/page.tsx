"use client";

import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { getDeviceId } from "@/lib/device";
import SpotifyPlayer from "@/components/SpotifyPlayer/SpotifyPlayer";
import { AppState, Song } from "@/lib/types";
import DisabledOverlay from "@/app/songreq/_components/DisabledOverlay";
import DJModeOverlay from "@/app/songreq/_components/DJModeOverlay";

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [ranking, setRanking] = useState<any[]>([]);
  const [appState, setAppState] = useState<AppState>();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [now, setNow] = useState<number>(new Date().getTime());
  const [queueFull, setQueueFull] = useState(false);
  const [showAutoplayInfo, setShowAutoplayInfo] = useState(false);

  const device = getDeviceId();
  const [debouncedQuery] = useDebounce(query, 150);

  const isPageDisabled = appState?.enable_page === "FALSE";
  const isDJMode = appState?.enable_dj === "TRUE";
  const showDJMode = isDJMode;
  const showDisabledMode = isPageDisabled && !isDJMode;
  const showOverlay = showDJMode || showDisabledMode;

  async function loadRanking() {
    const res = await fetch("/api/ranking");
    const data = await res.json();
    setRanking(data);
    // console.log(JSON.stringify(data))
    loadQueueStatus();
  }

  async function loadQueueStatus() {
    const res = await fetch("/api/queue-status");
    const data = await res.json();
    setQueueFull(data.full);
  }

  async function search(q: string) {
    if (q.length < 2) { setResults([]); return; }
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    setResults(await res.json());
  }

  async function addSong(song: Song) {
    const payload = {
      spotify_id: song.spotify_id,
      title: song.title,
      artist: song.artist,
      cover_url: song.cover_url,
      device_id: device,
    };
    const res = await fetch("/api/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.error) {
      setErrorMsg(data.message);
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    setQuery("");
    setResults([]);
  }

  async function upvote(id: number) {
    const res = await fetch("/api/upvote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, device_id: device }),
    });
    const data = await res.json();
    if (data.error) {
      setErrorMsg(data.message === "already_voted" ? "ALREADY VOTED" : data.message);
      setTimeout(() => setErrorMsg(null), 2000);
      return;
    }
  }

  async function getApplicationState() {
    const res = await fetch("/api/app-state");
    const data = await res.json();
    setAppState(data.data);
    if (data.data?.enable_autoplay === "TRUE") {
      setShowAutoplayInfo(true);
    }
  }

  useEffect(() => { search(debouncedQuery); }, [debouncedQuery]);

  useEffect(() => {
    loadRanking();
    getApplicationState();
    let ev: EventSource;
    function connect() {
      ev = new EventSource("/api/events");
      ev.onmessage = (e) => {
        if (!e.data) return;
        try {
          const msg = JSON.parse(e.data);
          if (msg.event === "ranking_update") { loadRanking(); loadQueueStatus(); }
          if (msg.event === "app_state") { getApplicationState(); }
        } catch {}
      };
      ev.onerror = () => { ev.close(); setTimeout(connect, 2000); };
    }
    connect();
    return () => ev?.close();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  const getRemainingTime = (created_at: number) => {
    const EXPIRATION = (process.env.NEXT_SONG_TIMEOUT || 1800000) as number;
    const remaining = EXPIRATION - (now - created_at);
    return remaining <= 0 ? "EXPIRES SOON" : `${Math.ceil(remaining / 60000)}m left`;
  };

  if (showDJMode)
    return (
      <DJModeOverlay
        name={appState.dj_name || "DJ"}
        instagram={appState.dj_insta}
        dj_avatar_url={appState.dj_avatar_url}
        message={appState.dj_message || "Get ready for an amazing night!"}
      />
    );

  return (
    <main className="min-h-screen bg-[#0a0a1a] text-white selection:bg-[#2563eb] selection:text-white antialiased relative overflow-x-hidden">

      {/* Ambient background blobs - blue tones */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-[#2563eb]/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-[#1d4ed8]/5 blur-[100px]" />
      </div>

      {/* Toast */}
      {errorMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] w-auto">
          <div className="bg-red-500/90 backdrop-blur-xl text-white px-5 py-2.5 rounded-2xl shadow-2xl border border-red-400/30 flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{errorMsg}</span>
          </div>
        </div>
      )}

      <div className="relative z-10 max-w-md mx-auto px-4 pt-8 pb-16 flex flex-col gap-6">

        {/* Header with two logos */}
        <header className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3b82f6] opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#3b82f6]" />
              </span>
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#3b82f6]">WiWi-Meisterschaften x FAU</span>
            </div>
            <h1 className="text-[2.4rem] font-black italic tracking-tighter leading-[0.9] uppercase">
              PARTY{" "}
              <span
                className="text-transparent"
                style={{
                  WebkitTextStroke: "1.5px #2563eb",
                }}
              >
                ZELT
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <img
              src="/FAU-Logo.png"
              className="h-13 w-auto brightness-0 invert opacity-90"
              alt="Logo"
            />
            {/* <img
              src="/FSI-Logo2.png"
              className="h-10 w-auto "
              alt="Logo"
            /> */}
          </div>
        </header>

        {/* Spotify Player */}
        {appState?.enable_player === "TRUE" && <SpotifyPlayer />}

        {/* Disabled overlay (inline) */}
        {showDisabledMode && (
          <div className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-white/[0.03] backdrop-blur-xl p-8 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-[#2563eb]/10 to-transparent" />
            <DisabledOverlay message={appState.dp_message || "Song requests are currently disabled"} />
          </div>
        )}

        {!showOverlay && (
          <>
            {/* Autoplay info */}
            {appState?.enable_autoplay === "TRUE" && showAutoplayInfo && (
              <div className="relative z-50 rounded-[1.75rem] border border-red-400/20 bg-red-500/10 p-4 shadow-2xl backdrop-blur-xl text-red-100">
                <div className="flex items-start gap-3">

                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-[0.25em] text-red-300">Autoplay aktiv</p>
                    <p className="mt-1 text-[12px] leading-5 text-white/80">
                      {appState.autoplay_message}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAutoplayInfo(false)}
                    style={{position: "absolute", right: 5, top: 5}}
                    className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-red-100 hover:bg-white/10 transition"
                    aria-label="Dismiss autoplay alert"
                  >
                    <span className="text-[14px] leading-none">x</span>
                  </button>
                </div>
              </div>
            )}

            {/* Search / Queue full */}
            <div className="relative z-50">
              {queueFull ? (
                <div className="rounded-[1.75rem] border border-white/5 bg-white/[0.03] p-5 text-center backdrop-blur-xl">
                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-white/30">
                    Arena Saturated · Upvote below
                  </p>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative flex items-center">
                    {/* Search icon */}
                    <svg
                      className="absolute left-5 text-white/20 pointer-events-none"
                      width="14" height="14" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                      className="w-full h-14 pl-11 pr-5 bg-white/[0.06] border border-white/8 rounded-2xl
                                 text-[16px] font-bold placeholder:text-white/20 text-white
                                 outline-none focus:bg-white/[0.09] focus:border-[#2563eb]/40
                                 focus:ring-2 focus:ring-[#2563eb]/20 transition-all duration-300"
                      placeholder="Schicke deinen Song an den DJ"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>

                  {results.length > 0 && (
                    <div className="absolute w-full mt-2 bg-[#14141a]/95 border border-white/8 rounded-[1.5rem]
                                    shadow-2xl overflow-hidden backdrop-blur-2xl divide-y divide-white/5
                                    animate-in zoom-in-95 fade-in duration-150 z-50">
                      {results.map((r) => (
                        <div
                          key={r.spotify_id}
                          className="flex items-center gap-3.5 p-3.5 hover:bg-white/[0.04] transition-colors"
                        >
                          <img src={r.cover_url} className="w-10 h-10 rounded-xl object-cover shadow-md" alt={r.title} />
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-bold text-white truncate">{r.title}</div>
                            <div className="text-[10px] text-white/40 font-semibold uppercase tracking-wide truncate">{r.artist}</div>
                          </div>
                          <button
                            className="flex-shrink-0 h-8 px-4 rounded-xl bg-[#2563eb] text-white text-[10px] font-black uppercase
                                       tracking-wider hover:bg-[#3b82f6] active:scale-95 transition-all duration-150"
                            onClick={() => addSong(r)}
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Leaderboard */}
            <section className="space-y-3">
              <div className="flex items-center gap-3 px-0.5">
                <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-[#3b82f6]">
                  Arena Leaderboard
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-[#3b82f6]/20 to-transparent" />
   
              </div>

              <div className="rounded-[2rem] border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl overflow-hidden divide-y divide-white/[0.04]">
                {ranking.map((s, i) => {
                  const remaining = getRemainingTime(s.created_at);

                  return (
                    <div
                      key={s.spotify_id}
                      className={`group flex items-center gap-4 p-4 transition-colors duration-200
                        hover:bg-white/[0.04] bg-[#2563eb]/[0.07]`}
                    >
                      {/* Rank */}
                      <div className="w-5 flex-shrink-0 text-center">
                          <span className="text-[11px] font-black text-white/20 group-hover:text-white/40 transition-colors">
                            {i + 1}
                          </span>
                      </div>

                      {/* Cover */}
                      <div className="relative flex-shrink-0">
                        <div className="absolute -inset-1 rounded-xl bg-[#2563eb]/30 blur-sm" />
                        <img
                          src={s.cover_url}
                          className="relative w-11 h-11 rounded-xl object-cover shadow-md group-hover:scale-[1.04] transition-transform duration-200"
                          alt={s.title}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-black text-white truncate leading-tight mb-1.5">
                          {s.title}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] font-black px-2 py-0.5 rounded-lg bg-[#2563eb]/15 text-[#3b82f6] border border-[#2563eb]/20 uppercase tracking-wide">
                            {s.votes} votes
                          </span>
                          <span className="text-[10px] font-bold text-white/20 tracking-widest">
                            {remaining}
                          </span>
                        </div>
                      </div>

                      {/* Upvote - using blue with green accent */}
                      {s.queued==="FALSE" && <button
                        onClick={() => upvote(s.spotify_id)}
                        className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-2xl
                                   border border-white/8 bg-white/[0.04] text-white/20
                                   hover:border-[#3b82f6]/60 hover:text-[#3b82f6] hover:bg-[#2563eb]/10
                                   active:scale-90 transition-all duration-150"
                        aria-label="Upvote"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 1v10M1 6l5-5 5 5" />
                        </svg>
                      </button>}

                      {s.queued === "TRUE" && (
                        <div
                          className="flex-shrink-0 px-3 py-1 rounded-xl
                                    border border-emerald-400/20
                                    bg-emerald-400/10
                                    text-emerald-300
                                    text-[9px] font-black uppercase tracking-[0.18em]
                                    shadow-[0_0_12px_rgba(74,222,128,0.12)]"
                        >
                          QUEUED
                        </div>
                      )}

                    </div>
                  );
                })}

                {ranking.length === 0 && (
                  <div className="py-20 text-center">
                    <div className="w-10 h-10 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        className="text-white/20">
                        <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                      </svg>
                    </div>
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Noch keine Vorschläge eingetroffen - Sei der erste :)</p>
                  </div>
                )}
              </div>
            </section>

            {/* Footer */}
            <footer className="mt-2 flex justify-center gap-6 opacity-20 text-[8px] font-bold uppercase tracking-widest">
              <p>Ein Projekt von Finn von der FAU</p>
              <a href="mailto:mail@finnkrause.com" className="hover:opacity-60 transition-opacity">Kontakt</a>
            </footer>
          </>
        )}
      </div>
    </main>
  );
}