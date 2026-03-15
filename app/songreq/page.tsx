"use client";

import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { getDeviceId } from "@/lib/device";
import SpotifyPlayer from "@/components/SpotifyPlayer";

const ACCENT_GREEN = "#1c7537";

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [ranking, setRanking] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [now, setNow] = useState<number>(new Date().getTime());
  const [queueFull, setQueueFull] = useState(false);

  const device = getDeviceId();
  const [debouncedQuery] = useDebounce(query, 400);

  async function loadRanking() {
    const res = await fetch("/api/ranking");
    setRanking(await res.json());
    loadQueueStatus();
  }

  async function loadQueueStatus() {
    const res = await fetch("/api/queue-status");
    const data = await res.json();
    setQueueFull(data.full);
  }

  async function search(q: string) {
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    setResults(await res.json());
  }

  async function addSong(song: any) {
    const payload = {
      spotify_id: song.id ?? song.spotify_id,
      title: song.title,
      artist: song.artist,
      cover: song.cover ?? song.cover_url,
      device_id: device,
    };

    const res = await fetch("/api/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.error) {
      setErrorMsg(data.error === "queue_full" ? "QUEUE FULL" : "SYSTEM ERROR");
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    setQuery("");
    setResults([]);
    loadRanking();
  }

  async function upvote(id: number) {
    const res = await fetch("/api/upvote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, device_id: device })
    });
    const data = await res.json();

    if (data.error) {
      setErrorMsg(data.error === "already_voted" ? "ALREADY VOTED" : "VOTE FAILED");
      setTimeout(() => setErrorMsg(null), 2000);
      return;
    }

    loadRanking();
  }

  useEffect(() => {
    search(debouncedQuery);
  }, [debouncedQuery]);

  useEffect(() => {
    loadRanking();
    let ev: EventSource;
    function connect() {
      ev = new EventSource("/api/events");
      ev.onmessage = (e) => {
        if (!e.data) return;
        try {
          const msg = JSON.parse(e.data);
          if (msg.event === "ranking_update") {
            loadRanking();
            loadQueueStatus();
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

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  const getRemainingTime = (created_at: number, index: number) => {
    const EXPIRATION = 1800000;
    if (index < 3) return "HELD";
    const remaining = EXPIRATION - (now - created_at);
    return remaining <= 0 ? "0m" : `${Math.ceil(remaining / 60000)}m`;
  };

  return (
    <main className="min-h-screen bg-[#F2F4F7] text-gray-900 selection:bg-[#1c7537] selection:text-white antialiased">
      
      {errorMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[85%] max-w-[300px]">
          <div className="bg-red-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center justify-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{errorMsg}</span>
          </div>
        </div>
      )}

      <div className="max-w-md mx-auto px-4 pt-6 pb-12 flex flex-col gap-6">
        
        <header className="flex items-center justify-between px-1">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1c7537] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#1c7537]"></span>
              </span>
              <p className="text-[10px] font-black text-[#1c7537] uppercase tracking-[0.2em]">WiWi '26 LIVE</p>
            </div>
            <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none">
              Track <span className="bg-gradient-to-br from-[#1c7537] to-gray-400 bg-clip-text text-transparent">Arena</span>
            </h1>
          </div>
          <img src="/FSI-Logo2.png" className="h-10 w-auto contrast-125" alt="Logo" />
        </header>

        <SpotifyPlayer />

        <div className="relative z-50">
          {queueFull ? (
            <div className="bg-white/40 border-2 border-dashed border-gray-200 rounded-[2rem] p-6 text-center">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Arena Saturated • Upvote Below</span>
            </div>
          ) : (
            <div className="relative group">
              <input
                className="w-full h-14 px-6 bg-white border border-gray-100 rounded-2xl shadow-sm focus:shadow-xl focus:ring-4 focus:ring-[#1c7537]/10 outline-none transition-all text-[16px] font-bold placeholder:text-gray-300"
                placeholder="REQUEST A TRACK..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {results.length > 0 && (
                <div className="absolute w-full mt-2 bg-white/95 border border-gray-100 rounded-[1.5rem] shadow-2xl overflow-hidden divide-y divide-gray-50 backdrop-blur-xl animate-in zoom-in-95 duration-200">
                  {results.map((r) => (
                    <div key={r.id} className="flex items-center gap-4 p-4 active:bg-[#1c7537]/5">
                      <img src={r.cover} className="w-10 h-10 rounded-lg shadow-sm" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-black truncate">{r.title}</div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase truncate">{r.artist}</div>
                      </div>
                      <button
                        className="bg-gray-900 text-white h-8 px-4 rounded-xl text-[10px] font-black uppercase"
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

        <section className="space-y-3">
          <div className="flex items-center gap-3 px-1">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#1c7537]">Arena Leaderboard</h2>
            <div className="h-[2px] flex-1 bg-gradient-to-r from-[#1c7537]/20 to-transparent rounded-full" />
          </div>

          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] overflow-hidden">
            <div className="divide-y divide-gray-50">
              {ranking.map((s, i) => {
                const remaining = getRemainingTime(s.created_at, i);

                return (
                  <div key={s.id} className="group flex items-center gap-4 p-4 hover:bg-[#1c7537]/[0.02] transition-colors">
                    <div className="w-5 text-[11px] font-black text-center text-gray-300 group-hover:text-[#1c7537] transition-colors">
                      {i + 1}
                    </div>

                    <div className="relative">
                      <img src={s.cover_url} className="w-12 h-12 rounded-xl object-cover shadow-sm group-hover:scale-105 transition-transform" />
                      {/* <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${i < 3 ? 'bg-[#1c7537]' : 'bg-gray-200'}`}>
                         <div className={`w-1 h-1 bg-white rounded-full ${i < 3 ? 'animate-pulse' : ''}`} />
                      </div> */}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-black text-gray-900 truncate tracking-tight mb-1">
                        {s.title}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tighter bg-[#1c7537]/5 text-[#1c7537] border border-[#1c7537]/10">
                          {s.votes} Votes
                        </span>
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-1.5 py-0.5 rounded-md">
                          {remaining !== "HELD" ? remaining : "TOP"}
                        </span>
                      </div>
                    </div>

                    <button
                      className="h-11 w-11 flex items-center justify-center rounded-2xl transition-all active:scale-90 border-2 bg-white border-gray-100 text-gray-300 hover:border-[#1c7537] hover:text-[#1c7537] hover:bg-[#1c7537]/5 group-hover:border-[#1c7537]/30"
                      onClick={() => upvote(s.id)}
                    >
                      <svg width="14" height="14" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 1v10M1 6l5-5 5 5" />
                      </svg>
                    </button>
                  </div>
                );
              })}

              {ranking.length === 0 && (
                <div className="py-20 text-center">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">No Tracks Queued</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <footer className="mt-2 flex justify-center gap-6 opacity-20 text-[8px] font-bold uppercase tracking-widest py-2">
          <p>© 2026 F. Krause</p>
          <a href="mailto:mail@finnkrause.com">Kontakt</a>
        </footer>
      </div>
    </main>
  );
}