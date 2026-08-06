import { motion } from "motion/react";
import {
  Heart,
  MapPin,
  Wallet,
  Ticket,
  Bell,
  HelpCircle,
  Settings,
  ChevronRight,
  Crown,
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Glass, Divider } from "../components/glass";
import { RESTAURANTS } from "../data/catalog";
import { TrubitWordmark } from "../components/Logo";
import { rupees, savingsOn, useApp } from "../store/app-store";

const MENU = [
  { id: "addresses", label: "Saved addresses", sub: "Home, Work", icon: MapPin },
  { id: "payments", label: "Payments", sub: "UPI, Visa •••• 4471", icon: Wallet },
  { id: "coupons", label: "Coupons & offers", sub: "3 available", icon: Ticket },
  { id: "notifications", label: "Notifications", sub: "Order & offer alerts", icon: Bell },
  { id: "help", label: "Help centre", sub: "24×7 support", icon: HelpCircle },
  { id: "settings", label: "Settings", sub: "Preferences, privacy", icon: Settings },
];

export function ProfileScreen({ onOpenRestaurant }: { onOpenRestaurant: (id: string) => void }) {
  const { favourites, orders, toggleFav } = useApp();
  const favRestaurants = RESTAURANTS.filter((r) => favourites.includes(r.id));
  const lifetimeSaved = orders.reduce(
    (sum, o) => sum + o.lines.reduce((s, l) => s + savingsOn(l.dish.price) * l.qty, 0),
    0,
  );

  return (
    <div className="pb-40">
      <div className="px-5 pt-8">
        <Glass sheen className="p-6">
          <div className="flex items-center gap-4">
            <div className="grid size-16 shrink-0 place-items-center rounded-full border border-white/15 bg-white text-black">
              <span className="tracking-[0.06em]">AK</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-white">Ananya Kapoor</p>
              <p className="text-white/40">+91 98••• ••420</p>
            </div>
          </div>

          <div className="mt-6 flex items-stretch gap-4">
            <Metric value={String(orders.length)} label="Orders" />
            <Divider className="h-auto w-px bg-white/10" />
            <Metric value={String(favourites.length)} label="Favourites" />
            <Divider className="h-auto w-px bg-white/10" />
            <Metric value={rupees(lifetimeSaved)} label="Saved" />
          </div>
        </Glass>
      </div>

      {/* Membership */}
      <div className="mt-5 px-5">
        <Glass className="relative overflow-hidden p-6">
          <motion.div
            className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 skew-x-[-20deg] bg-white/10 blur-xl"
            animate={{ x: ["0%", "400%"] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
          />
          <div className="relative flex items-center gap-4">
            <Crown className="size-6 shrink-0 text-white" />
            <div className="min-w-0 flex-1">
              <p className="text-white">Trubit Noir</p>
              <p className="text-white/45">Free delivery, priority riders, ₹0 surge</p>
            </div>
            <ChevronRight className="size-4 shrink-0 text-white/50" />
          </div>
        </Glass>
      </div>

      {/* Favourites */}
      {favRestaurants.length > 0 && (
        <div className="mt-9">
          <div className="mb-4 flex items-center gap-2 px-5 text-white/45">
            <Heart className="size-4" />
            <span className="tracking-[0.22em] uppercase">Favourites</span>
          </div>
          <div className="scrollbar-none flex gap-4 overflow-x-auto px-5 pb-2">
            {favRestaurants.map((r) => (
              <Glass
                key={r.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => onOpenRestaurant(r.id)}
                className="h-36 w-40 shrink-0 cursor-pointer"
              >
                <ImageWithFallback
                  src={r.image}
                  alt={r.name}
                  className="absolute inset-0 size-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFav(r.id);
                  }}
                  className="absolute top-2 right-2 grid size-8 place-items-center rounded-full border border-white/15 bg-black/40 backdrop-blur-xl"
                  aria-label="Remove favourite"
                >
                  <Heart className="size-3.5 fill-white text-white" />
                </button>
                <div className="relative flex h-full items-end p-3">
                  <p className="line-clamp-2 text-white">{r.name}</p>
                </div>
              </Glass>
            ))}
          </div>
        </div>
      )}

      {/* Menu */}
      <div className="mt-9 px-5">
        <Glass className="divide-y divide-white/[0.07]">
          {MENU.map((m, i) => {
            const Icon = m.icon;
            return (
              <motion.button
                key={m.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                whileTap={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                className="flex w-full items-center gap-4 px-5 py-4 text-left"
              >
                <Icon className="size-4 shrink-0 text-white/70" />
                <div className="min-w-0 flex-1">
                  <p className="text-white">{m.label}</p>
                  <p className="truncate text-white/40">{m.sub}</p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-white/30" />
              </motion.button>
            );
          })}
        </Glass>

        <div className="mt-10 flex flex-col items-center gap-2">
          <TrubitWordmark className="text-white/25" />
          <p className="text-white/20">v1.0.0 · 0% commission, always</p>
        </div>
      </div>
    </div>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1">
      <p className="text-white">{value}</p>
      <p className="mt-0.5 text-white/40">{label}</p>
    </div>
  );
}
