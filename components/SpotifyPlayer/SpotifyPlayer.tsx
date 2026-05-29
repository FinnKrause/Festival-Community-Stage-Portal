/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatedBorder } from "../AnimatedBorder";

const REFRESH = Number(process.env.NEXT_PUBLIC_PLAYER_REFRESH ?? 1000);

type Track = {
  title: string;
  artist: string;
  cover_url: string | null;
  url: string | null;
};

type PlayerData = {
  playing: Track | null;
  queue?: Track[];
};

type SpotifyPlayerProps = {
  mode: "spotify" | "rekordbox";
};

export default function SpotifyPlayer({ mode }: SpotifyPlayerProps) {
  const [data, setData] = useState<PlayerData | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const load = useCallback(async () => {
    try {
      const endpoint = mode === "rekordbox" ? "/api/rekordbox-player" : "/api/player";
      const res = await fetch(endpoint);
      if (!res.ok) return;

      const json = await res.json();
      setData(json);
    } catch {
      setData(null);
    }
  }, [mode]);

  useEffect(() => {
    void load();
    const interval = setInterval(() => {
      void load();
    }, REFRESH);

    return () => clearInterval(interval);
  }, [load]);

  const playing = data?.playing;
  const queue = data?.queue ?? [];
  const canExpand = mode !== "rekordbox" && queue.length > 0;

  if (!playing) return null;

  return (
    <div
      onClick={() => canExpand && setIsExpanded((value) => !value)}
      className="relative w-full overflow-hidden rounded-[2rem] cursor-pointer active:scale-[0.98] transition-transform duration-150"
      style={{ background: "#0f1115" }}
    >
      <AnimatedBorder />
      <div
        className="absolute -right-8 -top-8 w-40 h-40 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 p-3.5">
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0 w-14 h-14">
            <div
              className="absolute -inset-[3px] rounded-[15px]"
              style={{
                background: "conic-gradient(from 0deg, transparent 0%, transparent 55%, #3b82f6 72%, #60a5fa 80%, transparent 92%, transparent 100%)",
                animation: "spin 3s linear infinite",
              }}
            />
            <div
              className="absolute -inset-[1px] rounded-[13px]"
              style={{ background: "#0f1115" }}
            />
            <img
              src={playing.cover_url ?? ""}
              className="relative w-14 h-14 rounded-xl object-cover z-10"
              onClick={(e) => {
                e.stopPropagation();
                if (playing.url) {
                  window.open(playing.url, "_blank");
                }
              }}
              alt="Cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="flex gap-[2px] items-end h-2.5">
                {[
                  "eq 0.55s ease-in-out infinite alternate",
                  "eq 0.85s ease-in-out infinite alternate",
                  "eq 0.7s ease-in-out infinite alternate",
                ].map((anim, i) => (
                  <div
                    key={i}
                    className="w-[3px] rounded-sm"
                    style={{
                      height: i === 1 ? "60%" : "100%",
                      animation: anim,
                      background: i === 1 ? "#10b981" : "#3b82f6",
                    }}
                  />
                ))}
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-[#3b82f6]">
                Now Playing
              </span>
            </div>
            <h3 className="text-[13px] font-black text-white truncate leading-none mb-1">
              {playing.title}
            </h3>
            <p className="text-[10px] font-semibold truncate" style={{ color: "rgba(255,255,255,0.38)" }}>
              {playing.artist}
            </p>
          </div>

          {canExpand ? (
            <div
              className="flex-shrink-0 p-2 rounded-full transition-transform duration-500"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.08)",
                transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          ) : null}
        </div>

        <div
          className="grid transition-all duration-500 ease-in-out"
          style={{
            gridTemplateRows: canExpand && isExpanded ? "1fr" : "0fr",
            opacity: canExpand && isExpanded ? 1 : 0,
            marginTop: canExpand && isExpanded ? "12px" : "0px",
          }}
        >
          <div className="overflow-hidden">
            <div
              className="rounded-2xl p-3"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <div className="flex items-center gap-2 mb-2.5">
                <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
                <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.22)" }}>
                  Up Next
                </span>
                <div className="h-px flex-1" style={{ background: "rgba(255,255,255,0.08)" }} />
              </div>

              <div className="space-y-2">
                {queue.length > 0 ? (
                  queue.slice(0, 1).map((song, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="text-[9px] font-black w-3" style={{ color: "rgba(255,255,255,0.2)" }}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold truncate" style={{ color: "rgba(255,255,255,0.65)" }}>
                          {song.title}
                        </p>
                        <p className="text-[8px] font-semibold truncate uppercase tracking-wide" style={{ color: "rgba(255,255,255,0.25)" }}>
                          {song.artist}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[9px] font-bold text-center py-1 italic" style={{ color: "rgba(255,255,255,0.2)" }}>
                    Queue is empty
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes eq {
          from { transform: scaleY(0.25); }
          to   { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}
