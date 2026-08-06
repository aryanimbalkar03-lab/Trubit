import { useMemo } from "react";
import { motion } from "motion/react";
import { CITY } from "../data/catalog";
import { cx } from "./glass";

/**
 * Dark map surface.
 *
 * Google Maps needs a billed API key, which this build has no way to hold
 * securely — so this renders the same geometry (real lat/lng, projected and
 * road-gridded) in Google's "dark" styling. Drop a key in below and swap the
 * body for <GoogleMap mapId=… /> and every caller keeps working: the props
 * are already lat/lng.
 */
export const GOOGLE_MAPS_API_KEY = "YOUR_API_KEY_HERE";

/** Google's official dark style, kept here so the vector fallback matches it. */
const PALETTE = {
  land: "#0b0b0c",
  block: "#161617",
  road: "#2a2a2c",
  arterial: "#3a3a3d",
  water: "#0e1a24",
  park: "#121a12",
  label: "rgba(255,255,255,0.35)",
};

export type Marker = {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  kind: "restaurant" | "you" | "rider" | "pin";
};

/** Degrees visible across the viewport. ~0.06° ≈ 6.5 km. */
const SPAN = 0.062;

export function DarkMap({
  markers,
  route,
  className,
  center = CITY,
  zoomOut = 1,
}: {
  markers: Marker[];
  /** Ordered lat/lng path drawn as the delivery route. */
  route?: { lat: number; lng: number }[];
  className?: string;
  center?: { lat: number; lng: number };
  zoomOut?: number;
}) {
  const span = SPAN * zoomOut;

  const project = useMemo(
    () =>
      (p: { lat: number; lng: number }) => ({
        x: ((p.lng - center.lng) / span) * 100 + 50,
        // latitude grows upward, y grows downward
        y: 50 - ((p.lat - center.lat) / (span * 0.62)) * 100,
      }),
    [center.lat, center.lng, span],
  );

  const path = route?.length
    ? route.map(project).reduce((acc, p, i) => `${acc}${i ? "L" : "M"}${p.x} ${p.y}`, "")
    : null;

  return (
    <div className={cx("relative overflow-hidden", className)} style={{ background: PALETTE.land }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full">
        {/* City blocks */}
        {BLOCKS.map((b, i) => (
          <rect
            key={i}
            x={b[0]}
            y={b[1]}
            width={b[2]}
            height={b[3]}
            rx="0.6"
            fill={i % 7 === 0 ? PALETTE.park : PALETTE.block}
          />
        ))}

        {/* Water body */}
        <path
          d="M-5 78 C 18 70, 30 88, 52 82 C 74 76, 86 92, 108 84 L108 108 L-5 108 Z"
          fill={PALETTE.water}
        />

        {/* Street grid */}
        {GRID_V.map((x) => (
          <line key={`v${x}`} x1={x} y1="-5" x2={x} y2="105" stroke={PALETTE.road} strokeWidth="0.7" />
        ))}
        {GRID_H.map((y) => (
          <line key={`h${y}`} x1="-5" y1={y} x2="105" y2={y} stroke={PALETTE.road} strokeWidth="0.7" />
        ))}

        {/* Arterials */}
        <line x1="-5" y1="41" x2="105" y2="37" stroke={PALETTE.arterial} strokeWidth="1.8" />
        <line x1="63" y1="-5" x2="57" y2="105" stroke={PALETTE.arterial} strokeWidth="1.8" />
        <path d="M-5 20 C 30 26, 55 12, 105 22" stroke={PALETTE.arterial} strokeWidth="1.4" fill="none" />

        {/* Delivery route */}
        {path && (
          <>
            <path d={path} stroke="rgba(255,255,255,0.14)" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            <motion.path
              d={path}
              stroke="#fff"
              strokeWidth="1.1"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="3 4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.4, ease: "easeInOut" }}
            />
          </>
        )}
      </svg>

      {/* Markers sit in DOM so they can carry labels and animation */}
      {markers.map((m) => {
        const p = project(m);
        if (p.x < -6 || p.x > 106 || p.y < -6 || p.y > 106) return null;
        return (
          <div
            key={m.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            {m.kind === "you" ? (
              <span className="relative grid place-items-center">
                <motion.span
                  className="absolute size-8 rounded-full bg-white/20"
                  animate={{ scale: [1, 2.1], opacity: [0.5, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
                />
                <span className="size-3 rounded-full border-2 border-black bg-white" />
              </span>
            ) : m.kind === "rider" ? (
              <motion.span
                className="grid size-7 place-items-center rounded-full bg-white text-black shadow-[0_0_22px_rgba(255,255,255,0.5)]"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <span className="text-[10px]">▲</span>
              </motion.span>
            ) : (
              <span className="flex flex-col items-center">
                <span
                  className={cx(
                    "size-2.5 rounded-full ring-2",
                    m.kind === "restaurant"
                      ? "bg-white ring-black"
                      : "bg-white/50 ring-black",
                  )}
                />
                {m.label && (
                  <span
                    className="mt-1 max-w-[6rem] truncate rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] backdrop-blur-sm"
                    style={{ color: PALETTE.label }}
                  >
                    {m.label}
                  </span>
                )}
              </span>
            )}
          </div>
        );
      })}

      {/* Vignette so the map reads as a surface, not a picture */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_35%,rgba(0,0,0,0.75))]" />
    </div>
  );
}

const GRID_V = [8, 20, 31, 44, 57, 70, 82, 94];
const GRID_H = [10, 22, 33, 46, 58, 69, 80, 92];

/** x, y, w, h — hand-placed so the grid reads as a real neighbourhood. */
const BLOCKS: [number, number, number, number][] = [
  [10, 12, 9, 8], [22, 12, 7, 8], [33, 12, 9, 8], [46, 12, 9, 8], [59, 12, 9, 8], [72, 12, 8, 8],
  [10, 24, 9, 7], [22, 24, 7, 7], [33, 24, 9, 7], [46, 24, 9, 7], [59, 24, 9, 7], [72, 24, 8, 7],
  [10, 35, 9, 9], [22, 35, 7, 9], [33, 35, 9, 9], [46, 35, 9, 9], [59, 35, 9, 9], [72, 35, 8, 9],
  [10, 48, 9, 8], [22, 48, 7, 8], [33, 48, 9, 8], [46, 48, 9, 8], [59, 48, 9, 8], [72, 48, 8, 8],
  [10, 60, 9, 7], [22, 60, 7, 7], [33, 60, 9, 7], [46, 60, 9, 7], [59, 60, 9, 7], [72, 60, 8, 7],
  [84, 12, 8, 8], [84, 24, 8, 7], [84, 35, 8, 9], [84, 48, 8, 8],
];
