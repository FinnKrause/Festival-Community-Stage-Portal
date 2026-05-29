import { memo } from "react";
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

export default SongRow;