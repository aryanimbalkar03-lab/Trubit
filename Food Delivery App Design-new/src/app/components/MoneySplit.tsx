import { motion } from "motion/react";
import { Glass, cx } from "./glass";
import { rupees } from "../store/app-store";

/**
 * Every rupee, accounted for. Aggregators take 25–30% and never show the split;
 * on Trubit the rider's cut is a floor, not a variable, and our cut is a flat fee.
 */
export function MoneySplit({ total, className }: { total: number; className?: string }) {
  const rider = Math.max(Math.round(total * 0.14), 45);
  const platform = 9;
  const kitchen = Math.max(total - rider - platform, 0);

  const parts = [
    { label: "The kitchen", value: kitchen, tone: "bg-white" },
    { label: "Your rider", value: rider, tone: "bg-white/55" },
    { label: "Trubit (flat fee)", value: platform, tone: "bg-white/20" },
  ];

  return (
    <Glass className={cx("p-5", className)}>
      <p className="tracking-[0.22em] text-white/45 uppercase">Where your money goes</p>

      <div className="mt-4 flex h-3 gap-1 overflow-hidden rounded-full">
        {parts.map((p, i) => (
          <motion.div
            key={p.label}
            initial={{ width: 0 }}
            animate={{ width: `${(p.value / total) * 100}%` }}
            transition={{ duration: 0.9, delay: 0.15 + i * 0.12, ease: [0.22, 0.9, 0.25, 1] }}
            className={cx("h-full rounded-full", p.tone)}
          />
        ))}
      </div>

      <div className="mt-4 space-y-2.5">
        {parts.map((p) => (
          <div key={p.label} className="flex items-center gap-3">
            <span className={cx("size-2 shrink-0 rounded-full", p.tone)} />
            <span className="flex-1 text-white/60">{p.label}</span>
            <span className="text-white">{rupees(p.value)}</span>
            <span className="w-10 text-right text-white/30">
              {Math.round((p.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-white/35">
        Aggregators keep 25–30% of this order. We keep {rupees(platform)}.
      </p>
    </Glass>
  );
}
