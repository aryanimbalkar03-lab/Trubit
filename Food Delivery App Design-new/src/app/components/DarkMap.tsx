import { useMemo } from "react";
import { motion } from "motion/react";
import { CITY } from "../data/catalog";
import { cx } from "./glass";
import { GoogleMap, useJsApiLoader, Polyline, OverlayViewF } from "@react-google-maps/api";
import { Utensils } from "lucide-react";

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

const mapStyles = [
  { elementType: "geometry", stylers: [{ color: PALETTE.land }] },
  { elementType: "labels.text.stroke", stylers: [{ color: PALETTE.land }] },
  { elementType: "labels.text.fill", stylers: [{ color: PALETTE.label }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: PALETTE.road }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: PALETTE.arterial }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: PALETTE.water }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
];

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
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });

  if (GOOGLE_MAPS_API_KEY === "YOUR_API_KEY_HERE" || !isLoaded) {
    return (
      <SvgMapFallback
        markers={markers}
        route={route}
        className={className}
        center={center}
        zoomOut={zoomOut}
      />
    );
  }

  return (
    <RealGoogleMap
      markers={markers}
      route={route}
      className={className}
      center={center}
      zoomOut={zoomOut}
    />
  );
}

function RealGoogleMap({
  markers,
  route,
  className,
  center,
  zoomOut = 1,
}: {
  markers: Marker[];
  route?: { lat: number; lng: number }[];
  className?: string;
  center: { lat: number; lng: number };
  zoomOut?: number;
}) {
  const zoom = Math.round(14 - Math.log2(zoomOut));

  return (
    <div className={cx("relative w-full h-full overflow-hidden", className)}>
      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%", backgroundColor: PALETTE.land }}
        center={center}
        zoom={zoom}
        options={{
          styles: mapStyles,
          disableDefaultUI: true,
          gestureHandling: "cooperative",
        }}
      >
        {route && route.length > 0 && (
          <Polyline
            path={route}
            options={{
              strokeColor: "#ffffff",
              strokeOpacity: 0.7,
              strokeWeight: 3,
              geodesic: true,
            }}
          />
        )}

        {markers.map((m) => (
          <OverlayViewF
            key={m.id}
            position={{ lat: m.lat, lng: m.lng }}
            mapPaneName="overlayMouseTarget"
            getPixelPositionOffset={(width, height) => ({
              x: -(width / 2),
              y: -(height / 2),
            })}
          >
            <div className="relative">
              {m.kind === "you" ? (
                <span className="relative grid place-items-center">
                  <motion.span
                    className="absolute size-8 rounded-full bg-white/20"
                    animate={{ scale: [1, 2.1], opacity: [0.5, 0] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
                  />
                  <span className="relative size-3 rounded-full border-2 border-black bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                </span>
              ) : m.kind === "rider" ? (
                <BirdMarker />
              ) : m.kind === "restaurant" ? (
                <span className="grid size-7 place-items-center rounded-full bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                  <Utensils size={14} />
                </span>
              ) : (
                <span className="flex flex-col items-center">
                  <span className="size-2.5 rounded-full ring-2 bg-white/50 ring-black" />
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
          </OverlayViewF>
        ))}
      </GoogleMap>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_35%,rgba(0,0,0,0.75))]" />
    </div>
  );
}

function BirdMarker() {
  return (
    <div className="relative grid place-items-center size-10">
      <style>{`
        @keyframes flap {
          0%, 100% { transform: rotateX(0deg) scale(1); }
          50% { transform: rotateX(60deg) scale(0.9); }
        }
      `}</style>
      <svg
        viewBox="0 0 24 24"
        className="w-7 h-7 fill-white drop-shadow-[0_0_12px_rgba(255,255,255,0.8)]"
        style={{
          animation: "flap 0.25s infinite ease-in-out",
          transformOrigin: "center",
        }}
      >
        <path d="M22,2 L12,8 L2,2 L6,10 L2,18 L12,12 L22,18 L18,10 L22,2 Z" />
      </svg>
    </div>
  );
}

function SvgMapFallback({
  markers,
  route,
  className,
  center = CITY,
  zoomOut = 1,
}: {
  markers: Marker[];
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
        {BLOCKS.map((b, i) => (
          <rect key={i} x={b[0]} y={b[1]} width={b[2]} height={b[3]} rx="0.6" fill={i % 7 === 0 ? PALETTE.park : PALETTE.block} />
        ))}
        <path d="M-5 78 C 18 70, 30 88, 52 82 C 74 76, 86 92, 108 84 L108 108 L-5 108 Z" fill={PALETTE.water} />
        {GRID_V.map((x) => (
          <line key={`v${x}`} x1={x} y1="-5" x2={x} y2="105" stroke={PALETTE.road} strokeWidth="0.7" />
        ))}
        {GRID_H.map((y) => (
          <line key={`h${y}`} x1="-5" y1={y} x2="105" y2={y} stroke={PALETTE.road} strokeWidth="0.7" />
        ))}
        <line x1="-5" y1="41" x2="105" y2="37" stroke={PALETTE.arterial} strokeWidth="1.8" />
        <line x1="63" y1="-5" x2="57" y2="105" stroke={PALETTE.arterial} strokeWidth="1.8" />
        <path d="M-5 20 C 30 26, 55 12, 105 22" stroke={PALETTE.arterial} strokeWidth="1.4" fill="none" />
        {path && (
          <>
            <path d={path} stroke="rgba(255,255,255,0.14)" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            <motion.path d={path} stroke="#fff" strokeWidth="1.1" fill="none" strokeLinecap="round" strokeDasharray="3 4" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease: "easeInOut" }} />
          </>
        )}
      </svg>
      {markers.map((m) => {
        const p = project(m);
        if (p.x < -6 || p.x > 106 || p.y < -6 || p.y > 106) return null;
        return (
          <div key={m.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
            {m.kind === "you" ? (
              <span className="relative grid place-items-center">
                <motion.span className="absolute size-8 rounded-full bg-white/20" animate={{ scale: [1, 2.1], opacity: [0.5, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }} />
                <span className="size-3 rounded-full border-2 border-black bg-white" />
              </span>
            ) : m.kind === "rider" ? (
              <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}>
                <BirdMarker />
              </motion.div>
            ) : m.kind === "restaurant" ? (
              <span className="grid size-7 place-items-center rounded-full bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                <Utensils size={14} />
              </span>
            ) : (
              <span className="flex flex-col items-center">
                <span className={cx("size-2.5 rounded-full ring-2 bg-white/50 ring-black")} />
                {m.label && (
                  <span className="mt-1 max-w-[6rem] truncate rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] backdrop-blur-sm" style={{ color: PALETTE.label }}>
                    {m.label}
                  </span>
                )}
              </span>
            )}
          </div>
        );
      })}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_35%,rgba(0,0,0,0.75))]" />
    </div>
  );
}

const GRID_V = [8, 20, 31, 44, 57, 70, 82, 94];
const GRID_H = [10, 22, 33, 46, 58, 69, 80, 92];

const BLOCKS: [number, number, number, number][] = [
  [10, 12, 9, 8], [22, 12, 7, 8], [33, 12, 9, 8], [46, 12, 9, 8], [59, 12, 9, 8], [72, 12, 8, 8],
  [10, 24, 9, 7], [22, 24, 7, 7], [33, 24, 9, 7], [46, 24, 9, 7], [59, 24, 9, 7], [72, 24, 8, 7],
  [10, 35, 9, 9], [22, 35, 7, 9], [33, 35, 9, 9], [46, 35, 9, 9], [59, 35, 9, 9], [72, 35, 8, 9],
  [10, 48, 9, 8], [22, 48, 7, 8], [33, 48, 9, 8], [46, 48, 9, 8], [59, 48, 9, 8], [72, 48, 8, 8],
  [10, 60, 9, 7], [22, 60, 7, 7], [33, 60, 9, 7], [46, 60, 9, 7], [59, 60, 9, 7], [72, 60, 8, 7],
  [84, 12, 8, 8], [84, 24, 8, 7], [84, 35, 8, 9], [84, 48, 8, 8],
];
