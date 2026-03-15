"use client";

import { useEffect, useState } from "react";

const REFRESH = Number(process.env.NEXT_PUBLIC_PLAYER_REFRESH ?? 1000);
const ACCENT_GREEN = "#1c7537";

export default function SpotifyPlayer() {
  const [data, setData] = useState<any>(null);

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
    <div className="rounded-2xl border border-gray-100 bg-white p-4 mb-2">
      <div className="flex items-center gap-4">
        {/* Artwork */}
        <img 
          src={data.playing.cover} 
          className="w-12 h-12 rounded-lg shadow-sm flex-shrink-0" 
          alt="Cover"
          onClick={() => window.open(data.playing.url, "_blank")}
        />

        {/* Content Column */}
        <div className="flex-1 min-w-0">
          {/* Current Song */}
          <div className="mb-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: ACCENT_GREEN }} />
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Now Playing</p>
            </div>
            <p className="text-sm font-bold text-gray-900 truncate">
              {data.playing.title} <span className="font-normal text-gray-500">· {data.playing.artist}</span>
            </p>
          </div>

          {/* Next Section - Inline below current */}
          {data.queue?.length > 0 && (
            <div className="flex items-center gap-2 text-[11px] text-gray-400">
              <span className="font-bold text-[9px] uppercase tracking-tighter" style={{ color: ACCENT_GREEN }}>Next</span>
              <div className="truncate italic flex-1">
                {data.queue.map((q: any, idx: number) => (
                  <span key={idx}>
                    {q.title} · {q.artist}{idx < data.queue.length - 1 ? " | " : ""}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}