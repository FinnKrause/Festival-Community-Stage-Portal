// Animated SVG border that travels around the rounded rectangle perfectly
export function AnimatedBorder() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="1"
        y="1"
        width="calc(100% - 2px)"
        height="calc(100% - 2px)"
        rx="31"
        ry="31"
        fill="none"
        stroke="url(#borderGlow)"
        strokeWidth="1.5"
        pathLength="1"
        strokeDasharray="0.15 0.85"
        strokeLinecap="round"
        style={{ animation: "borderTravel 2.8s linear infinite" }}
      />
      <defs>
        <linearGradient id="borderGlow" gradientUnits="userSpaceOnUse" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
          <stop offset="40%" stopColor="#3b82f6" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#60a5fa" stopOpacity="1" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <style>{`
        @keyframes borderTravel {
          from { stroke-dashoffset: 1; }
          to   { stroke-dashoffset: 0; }
        }
      `}</style>
    </svg>
  );
}