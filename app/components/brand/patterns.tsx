import { cn } from "~/lib/utils";

/** Patrón de curvas de nivel (topografía) para fondos y texturas ecológicas. */
export function TopoPattern({ className }: { className?: string }) {
  const lines = [
    "M-50 80 C 150 20, 300 140, 520 70 S 900 20, 1100 90 S 1400 140, 1550 60",
    "M-50 150 C 170 90, 320 210, 540 140 S 920 90, 1120 160 S 1420 210, 1550 130",
    "M-50 220 C 190 160, 340 280, 560 210 S 940 160, 1140 230 S 1440 280, 1550 200",
    "M-50 290 C 210 230, 360 350, 580 280 S 960 230, 1160 300 S 1460 350, 1550 270",
    "M-50 360 C 230 300, 380 420, 600 350 S 980 300, 1180 370 S 1480 420, 1550 340",
  ];
  return (
    <svg
      viewBox="0 0 1500 420"
      preserveAspectRatio="xMidYMid slice"
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.2">
        {lines.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    </svg>
  );
}

const PINES = [
  { x: 40, h: 118 },
  { x: 95, h: 150 },
  { x: 150, h: 104 },
  { x: 228, h: 132 },
  { x: 1150, h: 126 },
  { x: 1212, h: 160 },
  { x: 1268, h: 112 },
  { x: 1330, h: 146 },
  { x: 1395, h: 120 },
];

/** Paisaje ilustrado de la sierra con pinos para portadas y encabezados. */
export function ForestLandscape({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 640"
      preserveAspectRatio="xMidYMax slice"
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="landscape-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0c1f13" />
          <stop offset="0.55" stopColor="#1b3924" />
          <stop offset="1" stopColor="#2d6b3e" />
        </linearGradient>
        <radialGradient id="landscape-sun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#f4d58d" stopOpacity="0.55" />
          <stop offset="1" stopColor="#f4d58d" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="1440" height="640" fill="url(#landscape-sky)" />
      <circle cx="1060" cy="250" r="220" fill="url(#landscape-sun)" />
      <circle cx="1060" cy="250" r="46" fill="#f4d58d" fillOpacity="0.28" />
      <path
        d="M0 360 C 140 300 250 330 380 280 S 640 200 790 250 S 1080 330 1230 270 S 1400 240 1440 250 V640 H0Z"
        fill="#3d8550"
        opacity="0.35"
      />
      <path
        d="M0 430 C 180 370 340 410 500 360 S 800 310 960 360 S 1240 420 1440 350 V640 H0Z"
        fill="#255533"
        opacity="0.85"
      />
      <path d="M0 500 C 230 450 420 480 640 450 S 1030 420 1220 470 S 1400 490 1440 480 V640 H0Z" fill="#1b3924" />
      <g fill="#0c1f13">
        {PINES.map(({ x, h }) => {
          const base = 560;
          const w = h * 0.42;
          return (
            <path
              key={x}
              d={`M${x} ${base - h} L${x + w * 0.5} ${base - h * 0.55} H${x + w * 0.22} L${x + w * 0.62} ${base - h * 0.18} H${x + w * 0.08} V${base} H${x - w * 0.08} V${base - h * 0.18} H${x - w * 0.62} L${x - w * 0.22} ${base - h * 0.55} H${x - w * 0.5} Z`}
            />
          );
        })}
      </g>
      <path d="M0 560 C 300 525 600 550 900 535 S 1300 540 1440 525 V640 H0Z" fill="#0c1f13" />
    </svg>
  );
}
