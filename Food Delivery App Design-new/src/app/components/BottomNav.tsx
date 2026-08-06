import { motion } from "motion/react";
import {
  Home,
  Search,
  ReceiptText,
  User,
  Armchair,
  Activity,
  Power,
  Bike,
  IndianRupee,
  LayoutDashboard,
  UtensilsCrossed,
  BarChart3,
  Store,
} from "lucide-react";
import { cx } from "./glass";
import type { Role } from "../store/platform";

export type UserTab = "home" | "search" | "dinein" | "insights" | "orders" | "profile";
export type Tab = string;

type Item = { id: string; label: string; icon: typeof Home };

/** Each hat gets its own five. The pill animates between them either way. */
export const NAV: Record<Role, Item[]> = {
  user: [
    { id: "home", label: "Home", icon: Home },
    { id: "search", label: "Search", icon: Search },
    { id: "dinein", label: "Dine in", icon: Armchair },
    { id: "insights", label: "You eat", icon: Activity },
    { id: "orders", label: "Orders", icon: ReceiptText },
    { id: "profile", label: "You", icon: User },
  ],
  rider: [
    { id: "shift", label: "Shift", icon: Power },
    { id: "job", label: "Trip", icon: Bike },
    { id: "earnings", label: "Earn", icon: IndianRupee },
    { id: "profile", label: "You", icon: User },
  ],
  partner: [
    { id: "dash", label: "Today", icon: LayoutDashboard },
    { id: "menu", label: "Menu", icon: UtensilsCrossed },
    { id: "analytics", label: "Stats", icon: BarChart3 },
    { id: "profile", label: "Store", icon: Store },
  ],
};

export function BottomNav({
  role,
  tab,
  onChange,
}: {
  role: Role;
  tab: Tab;
  onChange: (t: Tab) => void;
}) {
  const tabs = NAV[role];
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-40 px-4 pb-5">
      <div className="pointer-events-auto relative overflow-hidden rounded-full border border-white/12 bg-black/55 p-1.5 shadow-[0_10px_50px_-12px_rgba(0,0,0,1)] backdrop-blur-2xl">
        <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
        <div className="relative flex">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onChange(t.id)}
                className="relative min-w-0 flex-1 py-2.5"
                aria-label={t.label}
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-full bg-white"
                  />
                )}
                <span
                  className={cx(
                    "relative flex flex-col items-center gap-1 transition-colors",
                    active ? "text-black" : "text-white/50",
                  )}
                >
                  <Icon className="size-[1.05rem]" />
                  <span className="truncate text-[9px] tracking-[0.1em] uppercase">{t.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
