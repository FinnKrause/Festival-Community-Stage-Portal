"use client";

import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { getDeviceId } from "@/lib/device";
import SpotifyPlayer from "@/components/SpotifyPlayer";
import Image from "next/image";

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
      setErrorMsg(data.error === "queue_full" ? "Queue is full" : "Error adding song");
      setTimeout(() => setErrorMsg(null), 4000);
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
      setErrorMsg(data.error === "already_voted" ? "Already voted" : "Error");
      setTimeout(() => setErrorMsg(null), 4000);
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

  /* UPDATE TIME ONLY EVERY 60s */

  useEffect(() => {
    const t = setInterval(() => {
      setNow(Date.now());
    }, 60000);

    return () => clearInterval(t);
  }, []);

  const getRemainingTime = (created_at: number, index: number) => {
    const EXPIRATION = 1800000;

    if (index < 3) return "∞";

    const remaining = EXPIRATION - (now - created_at);

    if (remaining <= 0) return "0m";

    const minutes = Math.ceil(remaining / 60000);

    return `${minutes} min`;
  };

  return (
    <main className="h-screen bg-[#F9FAFB] text-gray-900 p-5 pb-10">

      {errorMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-2xl shadow-2xl z-50 text-sm font-bold animate-in fade-in zoom-in duration-300">
          {errorMsg}
        </div>
      )}

      <div className="max-w-md mx-auto flex flex-col gap-6">

        {/* SEARCH + PLAYER */}

        <div className="relative">
          <div className="flex justify-between items-center h-[40px] mb-[20px]">
            <div>
              <h1
                className="text-xl font-black italic tracking-tighter leading-none"
                style={{ color: ACCENT_GREEN }}
              >
                SONG REQUESTS
              </h1>
              <p className="text-[10px] font-medium italic tracking-tighter uppercase opacity-80">
                WiWi-Meisterschaften 2026
              </p>
            </div>
            <div className="flex gap-4 h-full">
              <img src="/FSI-Logo2.png"  className="h-[40px] w-auto object-contain" alt="FSI-Logo" />
              <img src="/FAU-Logo.png"  className="hidden min-[451px]:block h-full w-auto object-contain" alt="FAU-Logo" />
            </div>
          </div>

          <SpotifyPlayer />

          {queueFull ? (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 text-sm text-center text-gray-500">
              <div className="font-bold mb-1">Queue is currently full</div>
              <div className="text-xs opacity-70">
                Please wait until songs are played or expire before adding new ones. You can still vote for your favorite music!
              </div>
            </div>
          ) : (
            <>
              <input
                className="w-full p-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 transition-all"
                style={{ "--tw-ring-color": ACCENT_GREEN } as any}
                placeholder="Search for a song..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />

              {results.length > 0 && (
                <div className="absolute w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-40 max-h-60 overflow-y-auto divide-y divide-gray-50">

                  {results.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 p-3 active:bg-gray-50"
                    >
                      <img src={r.cover} className="w-10 h-10 rounded-lg shadow-sm" />

                      <div className="flex-1 min-w-0 text-sm">
                        <div className="font-bold truncate">{r.title}</div>
                        <div className="text-gray-500 truncate">{r.artist}</div>
                      </div>

                      <button
                        className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-transform active:scale-95"
                        style={{ backgroundColor: ACCENT_GREEN }}
                        onClick={() => addSong(r)}
                      >
                        Add
                      </button>
                    </div>
                  ))}

                </div>
              )}
            </>
          )}
        </div>

        {/* RANKING */}

        <section>
          <h2 className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-400 mb-3 px-1">
            REQUESTED SONGS
          </h2>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

            <div className="overflow-y-auto divide-y divide-gray-50">

              {ranking.map((s, i) => {
                const isTop3 = i < 3;
                const remaining = getRemainingTime(s.created_at, i);

                return (
                  <div
                    key={s.id}
                    className={`flex items-center gap-3 p-4 transition-colors ${
                      isTop3 ? "bg-green-50/100" : "bg-white"
                    }`}
                  >

                    <div className={`text-sm font-black w-5 text-center ${isTop3 ? "text-[#1c7537]" : "text-gray-300"}`}>
                      {i + 1}
                    </div>

                    <img src={s.cover_url} className="w-12 h-12 rounded-xl shadow-sm" />

                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate leading-tight">
                        {s.title}
                      </div>

                      <div className="text-[11px] text-gray-500 truncate mb-1">
                        {s.artist}
                      </div>

                      <div className="flex gap-2 text-[9px] font-bold uppercase tracking-wider">
                        <span style={{ color: ACCENT_GREEN }}>
                          {s.votes} Votes
                        </span>

                        <span className="text-gray-400 opacity-60">·</span>

                        <span className="text-gray-400">
                          EXPIRES IN {remaining}
                        </span>
                      </div>
                    </div>

                    <button
                      className="h-10 w-10 flex items-center justify-center rounded-2xl border border-gray-100 text-[#1c7537] transition-all active:scale-90"
                      onClick={() => upvote(s.id)}
                    >
                      ▲
                    </button>

                  </div>
                );
              })}

              {ranking.length === 0 && (
                <div className="p-10 text-center text-gray-400 text-sm italic">
                  No requests yet. Be the first!
                </div>
              )}

            </div>

          </div>
        </section>

      </div>
      
      <footer className="max-w-md mx-auto w-full p-4 text-[10px] opacity-60 flex justify-between items-center border-t border-white/10">
        <span>© 2026 Finn K</span>
        <a href="mailto:mail@finnkrause.com" className="hover:underline">
          mail@finnkrause.com
        </a>
      </footer>
    </main>
  );
}