"use client";

import { useEffect, useState } from "react";

const REFRESH = Number(process.env.NEXT_PUBLIC_PLAYER_REFRESH ?? 1000);
const ACCENT_GREEN = "#1c7537";

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
      className="group relative overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-300 ease-in-out cursor-pointer active:scale-[0.99]"
    >
      {/* Blurred Background Layer */}
      <div 
        className="absolute inset-0 opacity-10 saturate-150 blur-2xl scale-110 pointer-events-none transition-opacity"
        style={{ 
          backgroundImage: `url(${data.playing.cover})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />

      <div className="relative z-10">
        {/* Top Section: Now Playing */}
        <div className="p-4 flex items-center gap-4">
          <div className="relative shrink-0">
             <div className="absolute -inset-1 bg-[#1c7537]/10 rounded-xl animate-pulse" />
             <img 
               src={data.playing.cover} 
               className="relative w-12 h-12 rounded-xl shadow-md border border-white/50 object-cover active:scale-90 transition-transform z-20" 
               onClick={(e) => {
                 e.stopPropagation(); // Don't trigger expand when clicking the link
                 window.open(data.playing.url, "_blank");
               }}
               alt="Cover"
             />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1c7537] animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#1c7537]">On Air</span>
              </div>
              {/* Expand Indicator */}
              <div className={`text-[10px] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="text-gray-500">
                  <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <h3 className="text-[14px] font-black text-gray-900 truncate leading-tight tracking-tight">
              {data.playing.title}
            </h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter truncate">
              {data.playing.artist}
            </p>
          </div>
        </div>

        {/* Expandable Content: Upcoming 3 */}
        <div 
          className={`grid transition-all duration-300 ease-in-out ${
            isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          }`}
        >
          <div className="overflow-hidden">
            {data.queue?.length > 0 ? (
              <div className="bg-gray-50/50 px-4 pb-4 pt-2 border-t border-gray-100/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-gray-300">Next Up</span>
                </div>
                <div className="flex gap-2">
                  {data.queue.slice(0, 3).map((song: any, idx: number) => (
                    <div key={idx} className="flex-1 min-w-0 bg-white/80 rounded-xl p-2 border border-white shadow-sm">
                      <p className="text-[9px] font-black text-gray-900 truncate">{song.title}</p>
                      <p className="text-[8px] font-bold text-gray-400 truncate uppercase tracking-tighter">{song.artist}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="px-4 pb-4 pt-2 border-t border-gray-100/50 text-center">
                <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">No songs in queue</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}