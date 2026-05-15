/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { AnimatedBorder } from "../AnimatedBorder";

const REFRESH = Number(process.env.NEXT_PUBLIC_PLAYER_REFRESH ?? 1000);

export default function SpotifyPlayer() {
  const [data, setData] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/player");
      if (res.ok) setData(await res.json());
    } catch {}
  }

  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH);
    return () => clearInterval(t);
  }, []);

  if (!data || !data.playing) return null;

  return (
    <div
      onClick={() => setIsExpanded(!isExpanded)}
      className="relative w-full overflow-hidden rounded-[2rem] cursor-pointer active:scale-[0.98] transition-transform duration-150"
      style={{ background: "#0f1115" }}
    >
      {/* Animated border — SVG rect matches the card's border-radius exactly */}
      <AnimatedBorder />

      {/* Accent glow — contained within rounded corners via overflow-hidden on parent */}
      <div
        className="absolute -right-8 -top-8 w-40 h-40 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 p-3.5">
        {/* Main row */}
        <div className="flex items-center gap-3">

          {/* Cover art with spinning conic ring */}
          <div className="relative flex-shrink-0 w-14 h-14">
            {/* Spinning conic gradient — extends 3px beyond the image */}
            <div
              className="absolute -inset-[3px] rounded-[15px]"
              style={{
                background: "conic-gradient(from 0deg, transparent 0%, transparent 55%, #3b82f6 72%, #60a5fa 80%, transparent 92%, transparent 100%)",
                animation: "spin 3s linear infinite",
              }}
            />
            {/* Gap layer — sits between the conic ring and the image, same bg as card */}
            <div
              className="absolute -inset-[1px] rounded-[13px]"
              style={{ background: "#0f1115" }}
            />
            <img
              src={data.playing.cover}
              className="relative w-14 h-14 rounded-xl object-cover z-10"
              onClick={(e) => {
                e.stopPropagation();
                window.open(data.playing.url, "_blank");
              }}
              alt="Cover"
            />
          </div>

          {/* Track info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {/* Equaliser bars - using blue primary, green secondary */}
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
                      background: i === 1 ? "#10b981" : "#3b82f6"
                    }}
                  />
                ))}
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-[#3b82f6]">
                Now Playing
              </span>
            </div>
            <h3 className="text-[13px] font-black text-white truncate leading-none mb-1">
              {data.playing.title}
            </h3>
            <p className="text-[10px] font-semibold truncate" style={{ color: "rgba(255,255,255,0.38)" }}>
              {data.playing.artist}
            </p>
          </div>

          {/* Expand chevron */}
          <div
            className="flex-shrink-0 p-2 rounded-full transition-transform duration-500"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            <svg
              width="12" height="12" viewBox="0 0 24 24"
              fill="none" stroke="rgba(255,255,255,0.3)"
              strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </div>
        </div>

        {/* Expandable queue */}
        <div
          className="grid transition-all duration-500 ease-in-out"
          style={{
            gridTemplateRows: isExpanded ? "1fr" : "0fr",
            opacity: isExpanded ? 1 : 0,
            marginTop: isExpanded ? "12px" : "0px",
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
                {data.queue?.length > 0 ? (
                  data.queue.slice(0, 1).map((song: any, idx: number) => (
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