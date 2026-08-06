import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { cx } from "./glass";

/**
 * A food photo you can interrogate. Hold your thumb on it (or hover) and it
 * cycles through every angle the kitchen uploaded — top-down, cross-section,
 * in-hand — so you know what actually arrives. Lift off and it settles back
 * to the hero shot.
 */
export function FoodImage({
  angles,
  alt,
  className,
  imgClassName,
  intervalMs = 900,
  onInspect,
}: {
  angles: string[];
  alt: string;
  className?: string;
  imgClassName?: string;
  intervalMs?: number;
  onInspect?: () => void;
}) {
  const [i, setI] = useState(0);
  const [active, setActive] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!active || angles.length < 2) return;
    timer.current = window.setInterval(
      () => setI((n) => (n + 1) % angles.length),
      intervalMs,
    );
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [active, angles.length, intervalMs]);

  const start = () => {
    if (angles.length < 2) return;
    setActive(true);
    setI(1 % angles.length);
    onInspect?.();
  };
  const stop = () => {
    setActive(false);
    setI(0);
  };

  return (
    <div
      className={cx("relative overflow-hidden", className)}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onMouseEnter={start}
    >
      <AnimatePresence initial={false} mode="popLayout">
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.35, ease: [0.22, 0.9, 0.25, 1] }}
          className="absolute inset-0"
        >
          <ImageWithFallback
            src={angles[i]}
            alt={alt}
            className={cx("size-full object-cover", imgClassName)}
          />
        </motion.div>
      </AnimatePresence>

      {angles.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-1.5 flex justify-center gap-1">
          {angles.map((a, n) => (
            <motion.span
              key={a}
              animate={{
                opacity: active ? (n === i ? 1 : 0.35) : 0.45,
                width: n === i && active ? 10 : 4,
              }}
              className="h-1 rounded-full bg-white"
              style={{ boxShadow: "0 0 6px rgba(0,0,0,0.9)" }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
