import { motion } from "motion/react";
import birdSrc from "../../imports/image.png";
import { cx } from "./glass";

/**
 * The Trubit mark — the supplied courier-bird artwork, cropped to the bird and
 * lifted clean off its black plate.
 *
 * The art is white on black, so we use it as a *luminance mask* over a
 * `currentColor` fill: white paints, black becomes genuine transparency. No
 * box, no blend-mode tricks, and the mark inherits text colour like an icon.
 *
 * The wing is a second copy of the same mask, clipped along the black gap
 * between the wing fan and the tail and hinged at the shoulder, so it beats
 * independently of the body.
 *
 * Crop window inside the 1024×559 source: x 330→700, y 40→470 — the bird plus
 * enough headroom for the wing to swing without clipping.
 */
const PLATE = {
  width: `${(1024 / 370) * 100}%`,
  height: `${(559 / 430) * 100}%`,
  left: `${(-330 / 370) * 100}%`,
  top: `${(-40 / 430) * 100}%`,
  backgroundColor: "currentColor",
  WebkitMaskImage: `url(${birdSrc})`,
  maskImage: `url(${birdSrc})`,
  WebkitMaskSize: "100% 100%",
  maskSize: "100% 100%",
  maskMode: "luminance",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
} as const;

/** Everything above/left of the wing–tail gap. */
const WING_CLIP = "polygon(0% 0%, 62.2% 0%, 62.2% 47.7%, 17.6% 60.5%, 0% 61.2%)";
/** The complement: head, cap, body, tail, legs and the bag. */
const BODY_CLIP =
  "polygon(62.2% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 61.2%, 17.6% 60.5%, 62.2% 47.7%)";
/** Where the wing hinges. */
const SHOULDER = "60.8% 47.7%";

const BEAT = {
  duration: 1.05,
  repeat: Infinity,
  repeatType: "mirror",
  ease: [0.45, 0, 0.35, 1],
} as const;

export function TrubitMark({
  className,
  flying = false,
  animated = false,
}: {
  className?: string;
  /** Beating wing and bobbing body. */
  flying?: boolean;
  /** One-off reveal (splash). */
  animated?: boolean;
}) {
  return (
    <motion.div
      className={cx("relative aspect-[370/430]", className)}
      style={{ background: "transparent", overflow: "visible" }}
      initial={animated ? { opacity: 0, scale: 0.9 } : undefined}
      animate={animated ? { opacity: 1, scale: 1 } : undefined}
      transition={{ duration: 0.5, ease: [0.22, 0.9, 0.25, 1] }}
      aria-hidden
    >
      {/* Body, head, cap, tail and the order — rises on the downbeat */}
      <motion.div
        className="absolute inset-0 overflow-hidden"
        style={{ transformOrigin: SHOULDER, clipPath: BODY_CLIP, background: "transparent" }}
        animate={flying ? { y: ["1.4%", "-1.4%"], rotate: [1, -1] } : undefined}
        transition={flying ? BEAT : undefined}
      >
        <div className="absolute" style={PLATE} />
      </motion.div>

      {/* The wing — hinged at the shoulder */}
      <motion.div
        className="absolute inset-0 overflow-hidden"
        style={{ transformOrigin: SHOULDER, clipPath: WING_CLIP, background: "transparent" }}
        animate={flying ? { rotate: [-12, 16], scaleY: [1, 0.9] } : undefined}
        transition={flying ? BEAT : undefined}
      >
        <div className="absolute" style={PLATE} />
      </motion.div>
    </motion.div>
  );
}

/** Square app-icon lockup: white tile, black mark. */
export function TrubitBadge({
  className,
  animated = false,
  flying = false,
}: {
  className?: string;
  animated?: boolean;
  flying?: boolean;
}) {
  return (
    <div
      className={cx(
        "relative grid place-items-center overflow-hidden rounded-[28%] bg-white text-black",
        className,
      )}
    >
      <motion.span
        className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 skew-x-[-20deg] bg-black/[0.07]"
        animate={{ x: ["0%", "420%"] }}
        transition={{ duration: 3.4, repeat: Infinity, repeatDelay: 2.2, ease: "easeInOut" }}
      />
      <TrubitMark className="relative h-[80%]" animated={animated} flying={flying} />
    </div>
  );
}

export function TrubitWordmark({ className }: { className?: string }) {
  return (
    <div className={cx("flex items-center gap-2.5", className)}>
      <TrubitMark className="h-7" />
      <span className="tracking-[0.34em] uppercase">Trubit</span>
    </div>
  );
}
