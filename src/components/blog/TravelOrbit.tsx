// Decorative animated globe with a plane flying a route. Pure CSS, no client JS.
// Coordinates share one 380x380 space so the SVG route and the CSS motion path line up.

const ROUTE = "M40 270 Q190 -20 340 110";
const MERIDIANS = [0, 1, 2, 3];

export function TravelOrbit({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`h-[380px] w-[380px] ${className}`}>
      <svg viewBox="0 0 380 380" className="absolute inset-0 h-full w-full" fill="none">
        <defs>
          <radialGradient id="globeFill" cx="35%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.02" />
          </radialGradient>
        </defs>

        <circle cx="190" cy="200" r="120" fill="url(#globeFill)" stroke="#fff" strokeOpacity="0.28" />

        {/* Turning meridians: scaleX sweeps each circle like a rotating globe. */}
        {MERIDIANS.map((i) => (
          <circle
            key={i}
            className="globe-meridian"
            style={{ animationDelay: `${-i * 2.5}s` }}
            cx="190"
            cy="200"
            r="120"
            stroke="#fff"
            strokeOpacity="0.22"
          />
        ))}

        {/* Latitudes */}
        {[-70, -35, 0, 35, 70].map((dy) => {
          const rx = Math.sqrt(120 * 120 - dy * dy);
          return (
            <ellipse
              key={dy}
              cx="190"
              cy={200 + dy}
              rx={rx}
              ry={rx * 0.14}
              stroke="#fff"
              strokeOpacity="0.16"
            />
          );
        })}

        {/* Flight path */}
        <path d={ROUTE} stroke="#fff" strokeOpacity="0.7" strokeWidth="1.5" strokeDasharray="4 7" className="route-dash" />

        {/* Endpoints */}
        {[
          { x: 40, y: 270, label: "LOS", dx: -6, dy: 22, anchor: "start" as const },
          { x: 340, y: 110, label: "LHR", dx: 6, dy: -14, anchor: "end" as const },
        ].map((p) => (
          <g key={p.label}>
            <circle cx={p.x} cy={p.y} r="4" fill="#ff3b30" />
            <circle cx={p.x} cy={p.y} r="4" stroke="#ff3b30" className="pin-pulse" />
            <text
              x={p.x + p.dx}
              y={p.y + p.dy}
              textAnchor={p.anchor}
              fontSize="11"
              letterSpacing="1.5"
              fill="#fff"
              fillOpacity="0.7"
              fontFamily="var(--font-geist-mono), monospace"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>

      <div className="plane" style={{ offsetPath: `path("${ROUTE}")` }}>
        <svg viewBox="-14 -12 28 24" className="h-6 w-7 -translate-x-1/2 -translate-y-1/2">
          <path d="M13 0 L-9 -9 L-5 0 L-9 9 Z" fill="#fff" />
        </svg>
      </div>
    </div>
  );
}
