"use client";

import { useEffect, useMemo, useRef, useState, memo, useCallback } from "react";
import { useDebounce } from "use-debounce";
import { getDeviceId } from "@/lib/device";
import SpotifyPlayer from "@/components/SpotifyPlayer/SpotifyPlayer";
import { AppState, Song } from "@/lib/types";
import DisabledOverlay from "@/app/songreq/_components/DisabledOverlay";
import DJModeOverlay from "@/app/songreq/_components/DJModeOverlay";
import Image from "next/image";

const SongRow = memo(function SongRow({
  s,
  i,
  remaining,
  upvote,
}: {
  s: any;
  i: number;
  remaining: string;
  upvote: (id: number) => void;
}) {
  return (
    <div
      className="
        group flex items-center gap-4 p-4
        transition-colors duration-200
        hover:bg-white/[0.04]
        bg-[#2563eb]/[0.05]
        contain-layout contain-paint
        transform-gpu
      "
      style={{
        willChange: "transform",
        transform: "translateZ(0)",
      }}
    >
      {/* Rank */}
      <div className="w-5 flex-shrink-0 text-center">
        <span className="text-[11px] font-black text-white/20 group-hover:text-white/40 transition-colors">
          {i + 1}
        </span>
      </div>

      {/* Cover */}
      <div className="relative flex-shrink-0">
        <div
          className="absolute inset-0 rounded-xl bg-[#2563eb]/20"
          style={{
            transform: "translateZ(0)",
          }}
        />

        <Image
          src={s.cover_url}
          width={44}
          height={44}
          alt={s.title}
          className="
            relative rounded-xl object-cover shadow-md
            group-hover:scale-[1.04]
            transition-transform duration-200
            transform-gpu
          "
          unoptimized
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-black text-white truncate leading-tight mb-1.5">
          {s.title}
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className="
              text-[8px] font-black px-2 py-0.5 rounded-lg
              bg-[#2563eb]/15
              text-[#3b82f6]
              border border-[#2563eb]/20
              uppercase tracking-wide
            "
          >
            {s.votes} votes
          </span>

          <span className="text-[10px] font-bold text-white/20 tracking-widest">
            {remaining}
          </span>
        </div>
      </div>

      {/* Upvote */}
      {s.queued === "FALSE" && (
        <button
          onClick={() => upvote(s.spotify_id)}
          className="
            flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-2xl
            border border-white/8 bg-white/[0.04]
            text-white/20
            hover:border-[#3b82f6]/60
            hover:text-[#3b82f6]
            hover:bg-[#2563eb]/10
            active:scale-90
            transition-all duration-150
            transform-gpu
          "
          style={{
            transform: "translateZ(0)",
          }}
          aria-label="Upvote"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 1v10M1 6l5-5 5 5" />
          </svg>
        </button>
      )}

      {s.queued === "TRUE" && (
        <div
          className="
            flex-shrink-0 px-3 py-1 rounded-xl
            border border-emerald-400/20
            bg-emerald-400/10
            text-emerald-300
            text-[9px] font-black uppercase tracking-[0.18em]
          "
        >
          QUEUED
        </div>
      )}
    </div>
  );
});

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [ranking, setRanking] = useState<any[]>([]);
  const [appState, setAppState] = useState<AppState>();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const [queueFull, setQueueFull] = useState(false);
  const [showAutoplayInfo, setShowAutoplayInfo] = useState(false);

  const device = useMemo(() => getDeviceId(), []);
  const [debouncedQuery] = useDebounce(query, 150);

  const eventRef = useRef<EventSource | null>(null);

  const isPageDisabled = appState?.enable_page === "FALSE";
  const isDJMode = appState?.enable_dj === "TRUE";

  const showDJMode = isDJMode;
  const showDisabledMode = isPageDisabled && !isDJMode;
  const showOverlay = showDJMode || showDisabledMode;
  const showPlayer = appState?.enable_spotify_player === "TRUE" ? "spotify" : (appState?.enable_rekordbox_player === "TRUE"? "rekordbox" : null);

  const loadQueueStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/queue-status");
      const data = await res.json();
      setQueueFull(data.full);
    } catch {}
  }, []);

  const loadRanking = useCallback(async () => {
    try {
      const res = await fetch("/api/ranking");
      const data = await res.json();

      setRanking(data);

      loadQueueStatus();
    } catch {}
  }, [loadQueueStatus]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
    } catch {}
  }, []);

  const addSong = useCallback(
    async (song: Song) => {
      try {
        const payload = {
          spotify_id: song.spotify_id,
          title: song.title,
          artist: song.artist,
          cover_url: song.cover_url,
          device_id: device,
        };

        const res = await fetch("/api/add", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (data.error) {
          setErrorMsg(data.message);

          setTimeout(() => {
            setErrorMsg(null);
          }, 3000);

          return;
        }

        setQuery("");
        setResults([]);
      } catch {}
    },
    [device]
  );

  const upvote = useCallback(
    async (id: number) => {
      try {
        const res = await fetch("/api/upvote", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
            device_id: device,
          }),
        });

        const data = await res.json();

        if (data.error) {
          setErrorMsg(
            data.message === "already_voted"
              ? "ALREADY VOTED"
              : data.message
          );

          setTimeout(() => {
            setErrorMsg(null);
          }, 2000);

          return;
        }
      } catch {}
    },
    [device]
  );

  const getApplicationState = useCallback(async () => {
    try {
      const res = await fetch("/api/app-state");
      const data = await res.json();

      setAppState(data.data);

      if (data.data?.enable_autoplay === "TRUE") {
        setShowAutoplayInfo(true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    search(debouncedQuery);
  }, [debouncedQuery, search]);

  useEffect(() => {
    loadRanking();
    getApplicationState();

    function connect() {
      if (eventRef.current) {
        eventRef.current.close();
      }

      const ev = new EventSource("/api/events");

      eventRef.current = ev;

      ev.onmessage = (e) => {
        if (!e.data) return;

        try {
          const msg = JSON.parse(e.data);

          if (msg.event === "ranking_update") {
            loadRanking();
          }

          if (msg.event === "app_state") {
            getApplicationState();
          }
        } catch {}
      };

      ev.onerror = () => {
        ev.close();

        setTimeout(connect, 2000);
      };
    }

    connect();

    return () => {
      eventRef.current?.close();
    };
  }, [loadRanking, getApplicationState]);

  useEffect(() => {
    const t = setInterval(() => {
      setNow(Date.now());
    }, 60000);

    return () => clearInterval(t);
  }, []);

  const getRemainingTime = useCallback(
    (created_at: number) => {
      const EXPIRATION = 1800000;

      const remaining = EXPIRATION - (now - created_at);

      return remaining <= 0
        ? "EXPIRES SOON"
        : `${Math.ceil(remaining / 60000)}m left`;
    },
    [now]
  );

  if (showDJMode) {
    return (
      <DJModeOverlay
        name={appState?.dj_name || "DJ"}
        instagram={appState?.dj_insta}
        dj_avatar_url={appState?.dj_avatar_url}
        message={
          appState?.dj_message || "Get ready for an amazing night!"
        }
      />
    );
  }

  return (
<main
  className="
    min-h-screen
    bg-[#080810]
    text-white
    selection:bg-[#2563eb]
    selection:text-white
    antialiased
    relative
    overflow-x-hidden
  "
>
  {/* Single ambient layer — one gradient, no blur, no compositing */}
  <div
    aria-hidden="true"
    className="pointer-events-none fixed inset-0 z-0"
    style={{
      background:
        "linear-gradient(135deg, rgba(37,99,235,0.07) 0%, transparent 50%), linear-gradient(225deg, rgba(29,78,216,0.05) 0%, transparent 50%)",
    }}
  />

  {/* TOAST */}
  {errorMsg && (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[200]">
      <div
        className="
          bg-red-500
          text-white
          px-5 py-2.5
          rounded-2xl
          shadow-lg
          border border-red-400/30
          flex items-center gap-2
        "
        style={{ animation: "fadeSlideDown 0.2s ease both" }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full bg-white"
          style={{ animation: "simplePulse 1.5s ease-in-out infinite" }}
        />
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">
          {errorMsg}
        </span>
      </div>
    </div>
  )}

  <div
    className="
      relative z-10
      max-w-md mx-auto
      px-4 pt-8 pb-16
      flex flex-col gap-6
    "
  >
    {/* HEADER */}
    <header className="flex items-center justify-between">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          {/* Replaced animate-ping (2 layers) with single pulse */}
          <span
            className="h-1.5 w-1.5 rounded-full bg-[#3b82f6]"
            style={{ animation: "simplePulse 2s ease-in-out infinite" }}
          />
          <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#3b82f6]">
            WiWi-Meisterschaften x FAU
          </span>
        </div>

        <h1 className="text-[2.4rem] font-black italic tracking-tighter leading-[0.9] uppercase">
          PARTY
          <span
            className="text-transparent"
            style={{ WebkitTextStroke: "1.5px #2563eb" }}
          >
            ZELT
          </span>
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <Image
          src="/FAU-Logo.png"
          width={90}
          height={52}
          alt="FAU Logo"
          className="brightness-0 invert opacity-90"
          priority
        />
      </div>
    </header>

    {showPlayer && <SpotifyPlayer mode={showPlayer}/>}

    {/* DISABLED */}
    {showDisabledMode && (
      <div
        className="
          rounded-[2rem]
          border border-white/5
          bg-white/[0.03]
          p-8 text-center
          overflow-hidden
        "
        style={{
          background:
            "linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(8,8,16,0.95) 100%)",
        }}
      >
        <DisabledOverlay
          message={
            appState.dp_message || "Song requests are currently disabled"
          }
        />
      </div>
    )}

    {!showOverlay && (
      <>
        {/* AUTOPLAY BANNER */}
        {appState?.enable_autoplay === "TRUE" && showAutoplayInfo && (
          <div
            className="
              relative
              rounded-[1.75rem]
              border border-red-400/20
              p-4
              text-red-100
              overflow-hidden
            "
            style={{
              background: "rgba(239,68,68,0.08)",
            }}
          >
            <div className="flex items-start gap-3">
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-red-300">
                  Autoplay aktiv
                </p>
                <p className="mt-1 text-[12px] leading-5 text-white/80">
                  {appState.autoplay_message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAutoplayInfo(false)}
                className="
                  absolute right-3 top-3
                  flex h-8 w-8
                  items-center justify-center
                  rounded-full
                  bg-white/5
                  text-red-100
                  active:bg-white/10
                "
              >
                <span className="text-[14px] leading-none select-none">×</span>
              </button>
            </div>
          </div>
        )}

        {/* SEARCH */}
        <div className="relative z-50">
          {queueFull ? (
            <div
              className="rounded-[1.9rem] border border-white/[0.05] p-5 text-center"
              style={{
                background:
                  "linear-gradient(135deg, rgba(37,99,235,0.08) 0%, rgba(11,15,22,0.98) 60%)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.28)",
              }}
            >
              {/* top shimmer line */}
              <div
                className="absolute top-0 inset-x-0 h-px rounded-t-[1.9rem]"
                style={{
                  background:
                    "linear-gradient(to right, transparent, rgba(96,165,250,0.18), transparent)",
                }}
              />
              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-white/30">
                Arena Saturated · Upvote below
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Input container — no overdraw layers */}
              <div
                className="relative rounded-[1.9rem] border border-white/[0.06] overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(37,99,235,0.1) 0%, rgba(11,15,22,1) 55%)",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.32)",
                }}
              >
                <div
                  className="absolute top-0 inset-x-0 h-px"
                  style={{
                    background:
                      "linear-gradient(to right, transparent, rgba(96,165,250,0.2), transparent)",
                  }}
                />

                <div className="flex items-center h-[60px] px-4 gap-3">
                  {/* Search icon — filled path, no stroke outline issue */}
                  <div
                    className="
                      flex items-center justify-center
                      w-9 h-9 rounded-xl
                      border border-white/[0.05]
                      flex-shrink-0
                    "
                    style={{ background: "rgba(255,255,255,0.03)" }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        cx="11"
                        cy="11"
                        r="7"
                        stroke="rgba(255,255,255,0.25)"
                        strokeWidth="2"
                      />
                      <line
                        x1="16.5"
                        y1="16.5"
                        x2="21"
                        y2="21"
                        stroke="rgba(255,255,255,0.25)"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>

                  <input
                    className="
                      flex-1 h-full
                      bg-transparent
                      text-[16px]
                      font-black
                      tracking-[-0.02em]
                      text-white
                      placeholder:text-white/20
                      outline-none
                      border-none
                    "
                    placeholder="Schicke deinen Song an den DJ"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                  />
                </div>
              </div>

              {/* Results dropdown */}
              {results.length > 0 && (
                <div
                  className="
                    absolute w-full mt-3
                    rounded-[1.9rem]
                    border border-white/[0.06]
                    overflow-hidden
                    z-50
                  "
                  style={{
                    background: "rgba(11,15,22,0.99)",
                    boxShadow: "0 16px 40px rgba(0,0,0,0.40)",
                  }}
                >
                  <div className="divide-y divide-white/[0.04]">
                    {results.map((r) => (
                      <div
                        key={r.spotify_id}
                        className="flex items-center gap-3.5 p-3.5 active:bg-white/[0.03] transition-colors"
                      >
                        {/* Cover — shadow on img directly, not wrapper */}
                        <Image
                          src={r.cover_url}
                          width={44}
                          height={44}
                          alt={r.title}
                          className="rounded-xl object-cover flex-shrink-0"
                          style={{ boxShadow: "0 2px 12px rgba(37,99,235,0.14)" }}
                          unoptimized
                        />

                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-black text-white truncate leading-none mb-1">
                            {r.title}
                          </div>
                          <div className="text-[9px] uppercase tracking-[0.16em] text-white/30 font-bold truncate">
                            {r.artist}
                          </div>
                        </div>

                        <button
                          className="
                            flex-shrink-0
                            h-9 px-4
                            rounded-xl
                            text-white
                            text-[10px]
                            font-black
                            uppercase
                            tracking-[0.18em]
                            active:scale-95
                            transition-transform duration-100
                          "
                          style={{
                            background:
                              "linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)",
                            boxShadow: "0 4px 14px rgba(37,99,235,0.22)",
                          }}
                          onClick={() => addSong(r)}
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* LEADERBOARD */}
        <section className="space-y-3">
          <div className="flex items-center gap-3 px-1">
            <h2 className="text-[9px] font-black uppercase tracking-[0.3em] text-[#60a5fa]">
              Arena Leaderboard
            </h2>
            <div
              className="h-px flex-1"
              style={{
                background:
                  "linear-gradient(to right, rgba(59,130,246,0.18), transparent)",
              }}
            />
          </div>

          <div
            className="rounded-[2rem] border border-white/[0.06] overflow-hidden"
            style={{
              background: "rgba(11,15,22,0.99)",
              boxShadow: "0 6px 30px rgba(0,0,0,0.30)",
              contain: "layout style",
            }}
          >
            {/* Single top shimmer — no stacked gradients */}
            <div
              className="absolute top-0 inset-x-0 h-px"
              style={{
                background:
                  "linear-gradient(to right, transparent, rgba(96,165,250,0.18), transparent)",
              }}
            />

            <div className="divide-y divide-white/[0.04]">
              {ranking.map((s, i) => (
                <SongRow
                  key={s.spotify_id}
                  s={s}
                  i={i}
                  remaining={getRemainingTime(s.created_at)}
                  upvote={upvote}
                />
              ))}

              {ranking.length === 0 && (
                <div className="py-20 text-center">
                  <div
                    className="
                      w-14 h-14 rounded-2xl
                      mx-auto mb-4
                      flex items-center justify-center
                      border border-white/[0.05]
                    "
                    style={{ background: "rgba(255,255,255,0.02)" }}
                  >
                    {/* Clean music note icon — no stray stroke artifacts */}
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M9 18V5l12-2v13"
                        stroke="rgba(255,255,255,0.22)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="6" cy="18" r="3" fill="rgba(255,255,255,0.22)" />
                      <circle cx="18" cy="16" r="3" fill="rgba(255,255,255,0.22)" />
                    </svg>
                  </div>

                  <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">
                    Noch keine Vorschläge eingetroffen
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

      </>
    )}
    {/* FOOTER */}
    <footer className="mt-2 flex justify-center gap-6 opacity-20 text-[8px] font-bold uppercase tracking-widest">
      <p>© 2026 Finn Krause</p>
      <a href="https://forms.gle/ebtuHsYw8STsJ8WeA" target="_blank">Feedback</a>
      <a
        href="mailto:mail@finnkrause.com"
        className="hover:opacity-60 transition-opacity"
      >
        Kontakt
      </a>
    </footer>
  </div>

  {/* Global keyframes — add to your globals.css instead if preferred */}
  <style>{`
    @keyframes simplePulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.35; }
    }
    @keyframes fadeSlideDown {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `}</style>
</main>
  );
}