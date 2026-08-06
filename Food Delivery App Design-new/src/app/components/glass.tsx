import { motion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";

export const cx = (...parts: (string | false | null | undefined)[]) =>
  parts.filter(Boolean).join(" ");

/** A slow specular sweep across a surface — the "glance" on the glass. */
export function Sheen({
  delay = 0,
  duration = 3.6,
  repeatDelay = 4.5,
  className,
}: {
  delay?: number;
  duration?: number;
  repeatDelay?: number;
  className?: string;
}) {
  return (
    <motion.span
      aria-hidden
      className={cx(
        "pointer-events-none absolute inset-y-[-40%] -left-1/3 w-1/3 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/[0.14] to-transparent blur-md",
        className,
      )}
      initial={{ x: "0%" }}
      animate={{ x: ["0%", "520%"] }}
      transition={{ duration, delay, repeat: Infinity, repeatDelay, ease: "easeInOut" }}
    />
  );
}

/** Frosted translucent surface — the core material of the Trubit UI. */
export function Glass({
  className,
  children,
  tone = "dark",
  sheen = false,
  sheenDelay = 0,
  ...rest
}: HTMLMotionProps<"div"> & {
  children?: ReactNode;
  tone?: "dark" | "light";
  sheen?: boolean;
  sheenDelay?: number;
}) {
  return (
    <motion.div
      transition={{ type: "spring", stiffness: 350, damping: 32 }}
      {...rest}
      className={cx(
        "relative overflow-hidden rounded-3xl border backdrop-blur-2xl backdrop-saturate-[150%] transition-all duration-300",
        tone === "dark"
          ? "border-white/[0.14] bg-gradient-to-b from-white/[0.08] to-white/[0.03] shadow-[0_12px_45px_-10px_rgba(0,0,0,0.95)] ring-1 ring-white/[0.05] ring-inset"
          : "border-black/10 bg-black/[0.04]",
        className,
      )}
    >
      <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/55 to-transparent" />
      <span className="pointer-events-none absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      {sheen && <Sheen delay={sheenDelay} />}
      {children}
    </motion.div>
  );
}

/** Struck-through aggregator price next to the honest Trubit price. */
export function PriceTag({
  price,
  elsewhere,
  className,
  size = "md",
}: {
  price: string;
  elsewhere: string;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span className={cx("flex items-baseline gap-2", className)}>
      <span className="text-white">{price}</span>
      <span className={cx("text-white/30 line-through", size === "sm" && "text-[11px]")}>
        {elsewhere}
      </span>
    </span>
  );
}

export function GlassButton({
  children,
  className,
  variant = "ghost",
  ...rest
}: HTMLMotionProps<"button"> & {
  children?: ReactNode;
  variant?: "ghost" | "solid" | "outline";
}) {
  const styles = {
    ghost:
      "border border-white/15 bg-white/[0.08] text-white shadow-[0_4px_20px_-4px_rgba(0,0,0,0.6)] backdrop-blur-2xl hover:bg-white/[0.15] hover:border-white/25 active:scale-95 transition-all duration-200",
    solid:
      "bg-gradient-to-r from-white via-neutral-100 to-white text-black font-semibold shadow-[0_0_25px_-4px_rgba(255,255,255,0.45)] hover:shadow-[0_0_35px_0px_rgba(255,255,255,0.7)] active:scale-95 transition-all duration-200",
    outline:
      "border border-white/30 text-white hover:bg-white/10 hover:border-white/50 active:scale-95 transition-all duration-200",
  }[variant];

  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 26, mass: 0.6 }}
      {...rest}
      className={cx(
        "relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full px-5 py-3 tracking-wide transition-all duration-300 outline-none select-none cursor-pointer",
        styles,
        className,
      )}
    >
      {variant === "solid" && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-y-[-60%] -left-1/3 w-1/3 skew-x-[-18deg] bg-black/[0.06] blur-sm"
          animate={{ x: ["0%", "520%"] }}
          transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 3.5, ease: "easeInOut" }}
        />
      )}
      <span className="relative inline-flex items-center gap-2">{children}</span>
    </motion.button>
  );
}

export function Chip({
  children,
  active,
  onClick,
  className,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      whileHover={{ scale: 1.02, y: -1 }}
      transition={{ type: "spring", stiffness: 420, damping: 28 }}
      onClick={onClick}
      className={cx(
        "shrink-0 rounded-full border px-4 py-2 whitespace-nowrap backdrop-blur-2xl transition-all duration-300 select-none cursor-pointer text-sm font-medium",
        active
          ? "border-white bg-white text-black font-semibold shadow-[0_0_20px_rgba(255,255,255,0.4)]"
          : "border-white/15 bg-white/[0.06] text-white/75 hover:bg-white/[0.14] hover:text-white hover:border-white/30",
        className,
      )}
    >
      {children}
    </motion.button>
  );
}

/** Slow-drifting monochrome light blobs behind the glass. */
export function Aurora() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -top-40 -left-32 h-[26rem] w-[26rem] rounded-full bg-white/[0.10] blur-[110px]"
        animate={{ x: [0, 60, -20, 0], y: [0, 40, 80, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 -right-40 h-[24rem] w-[24rem] rounded-full bg-white/[0.07] blur-[120px]"
        animate={{ x: [0, -50, 20, 0], y: [0, -60, 30, 0] }}
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-40 left-1/4 h-[22rem] w-[22rem] rounded-full bg-white/[0.06] blur-[110px]"
        animate={{ x: [0, 40, -40, 0], y: [0, -30, 20, 0] }}
        transition={{ duration: 38, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="absolute inset-0 opacity-[0.16] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}

export function VegDot({ veg }: { veg: boolean }) {
  return (
    <span
      className={cx(
        "inline-flex size-3.5 items-center justify-center rounded-[3px] border",
        veg ? "border-white/70" : "border-white/40",
      )}
    >
      <span className={cx("size-1.5 rounded-full", veg ? "bg-white" : "bg-white/50")} />
    </span>
  );
}

export function Divider({ className }: { className?: string }) {
  return (
    <div
      className={cx(
        "h-px w-full bg-gradient-to-r from-transparent via-white/12 to-transparent",
        className,
      )}
    />
  );
}
