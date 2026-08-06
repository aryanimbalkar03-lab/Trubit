import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  MapPin,
  ChevronDown,
  Search,
  SlidersHorizontal,
  TrendingDown,
  Timer,
  ShieldCheck,
  Headphones,
  HandCoins,
  Sparkles,
  Zap,
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Glass, Chip, Sheen, cx } from "../components/glass";
import { TrubitBadge, TrubitMark } from "../components/Logo";
import { RestaurantCard, SectionTitle } from "../components/pieces";
import { CATEGORIES, CATEGORY_MATCH, COLLECTIONS, RESTAURANTS } from "../data/catalog";
import { useApp } from "../store/app-store";
import { getActiveBoosts, recordBoostImpression } from "../lib/sync-engine";

const FILTERS = ["Fast Delivery", "Rating 4.5+", "Pure Veg", "Offers", "Under ₹500"] as const;

const STANDARDS = [
  {
    icon: Timer,
    title: "On time or ₹60 back",
    sub: "Credited automatically. You never have to ask.",
  },
  {
    icon: ShieldCheck,
    title: "Allergens on every dish",
    sub: "Full nutrition, portion weight and heat level.",
  },
  {
    icon: Headphones,
    title: "A human in 60 seconds",
    sub: "No chatbot loop. Missing item, instant refund.",
  },
  {
    icon: HandCoins,
    title: "Riders paid a floor",
    sub: "Rain and distance pay included, always.",
  },
];

export function HomeScreen({
  onOpenRestaurant,
  onSearch,
}: {
  onOpenRestaurant: (id: string) => void;
  onSearch: () => void;
}) {
  const { address, orders } = useApp();
  const [category, setCategory] = useState<string | null>(null);
  const [filters, setFilters] = useState<string[]>([]);
  const [perched, setPerched] = useState(true);

  const toggleFilter = (f: string) =>
    setFilters((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));

  /* Boosted restaurants get promoted to the top */
  const boosts = useMemo(() => getActiveBoosts(), []);
  const boostedIds = useMemo(() => new Set(boosts.map((b) => b.restaurantId)), [boosts]);

  /* Personalized: restaurants user has ordered from most */
  const frequentRestaurantIds = useMemo(() => {
    const freq = new Map<string, number>();
    orders.forEach((o) => freq.set(o.restaurantId, (freq.get(o.restaurantId) ?? 0) + 1));
    return [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id]) => id);
  }, [orders]);

  const list = useMemo(() => {
    let out = [...RESTAURANTS];
    if (category) {
      const ids = CATEGORY_MATCH[category] ?? [];
      out = out.filter((r) => ids.includes(r.id));
    }
    if (filters.includes("Fast Delivery")) out = out.filter((r) => r.etaMins <= 30);
    if (filters.includes("Rating 4.5+")) out = out.filter((r) => r.rating >= 4.5);
    if (filters.includes("Pure Veg")) out = out.filter((r) => r.pureVeg);
    if (filters.includes("Offers")) out = out.filter((r) => Boolean(r.offer));
    if (filters.includes("Under ₹500")) out = out.filter((r) => r.priceForTwo <= 500);
    /* Sort: boosted first, then by rating */
    out.sort((a, b) => {
      const aB = boostedIds.has(a.id) ? 1 : 0;
      const bB = boostedIds.has(b.id) ? 1 : 0;
      if (aB !== bB) return bB - aB;
      return b.rating - a.rating;
    });
    /* Track boost impressions */
    out.forEach((r) => {
      if (boostedIds.has(r.id)) recordBoostImpression(r.id);
    });
    return out;
  }, [category, filters, boostedIds]);

  return (
    <div className="pb-48">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-gradient-to-b from-black via-black/90 to-transparent px-5 pt-6 pb-4 backdrop-blur-2xl">
        <div className="flex items-start justify-between pr-32">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-white/50">
              <motion.div
                whileHover={{ rotate: 12, scale: 1.1 }}
                onHoverStart={() => setPerched(false)}
                onHoverEnd={() => setPerched(true)}
              >
                <TrubitBadge className="size-5 shrink-0" flying={!perched} />
              </motion.div>
              <span className="tracking-[0.2em] text-[11px] font-semibold uppercase">Deliver to</span>
            </div>
            <button className="mt-1.5 flex max-w-[13.5rem] items-center gap-1.5 text-white hover:opacity-80 transition-opacity">
              <MapPin className="size-3.5 shrink-0 text-white/70" />
              <span className="truncate font-semibold text-sm">{address}</span>
              <ChevronDown className="size-4 shrink-0 text-white/50" />
            </button>
          </div>
        </div>

        <button
          onClick={onSearch}
          className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-3.5 backdrop-blur-2xl transition-all duration-200 hover:bg-white/[0.12] hover:border-white/25 cursor-pointer shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
        >
          <Search className="size-4 text-white/60" />
          <span className="text-white/50 text-sm font-medium">Search “truffle burger”, “sushi”…</span>
          <SlidersHorizontal className="ml-auto size-4 text-white/60" />
        </button>
      </div>

      {/* Hero — the whole reason Trubit exists */}
      <div className="px-5">
        <Glass sheen className="relative h-60">
          <ImageWithFallback
            src={RESTAURANTS[0].cover}
            alt="Featured"
            className="absolute inset-0 size-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/75 to-black/25" />
          <motion.div
            className="absolute -top-6 -right-6"
            animate={{ y: [0, -8, 0], rotate: [0, 2.5, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <TrubitMark flying className="h-48 text-white opacity-[0.1]" />
          </motion.div>
          <div className="relative flex h-full flex-col justify-end p-5">
            <span className="mb-2 flex w-fit items-center gap-1.5 rounded-full border border-white/25 bg-black/45 px-3 py-1 text-[10px] tracking-[0.22em] text-white/85 uppercase backdrop-blur-xl">
              <TrendingDown className="size-3" />
              Zero commission
            </span>
            <h2 className="text-white">Menu prices.{"\n"}Nothing added on top.</h2>
            <p className="mt-2 text-white/60">
              Other apps charge restaurants 30–40% and you pay for it. Trubit charges them nothing.
            </p>
          </div>
        </Glass>
      </div>

      {/* Savings proof strip */}
      <div className="mt-4 px-5">
        <Glass className="flex items-stretch divide-x divide-white/[0.08] p-0">
          <Sheen duration={4.2} repeatDelay={5} />
          <Proof value="0%" label="Restaurant commission" />
          <Proof value="30–40%" label="Cheaper than elsewhere" />
          <Proof value="₹0" label="Surge & platform fee" />
        </Glass>
      </div>

      {/* Categories */}
      <div className="mt-8">
        <div className="px-5">
          <SectionTitle label="What are you craving?" />
        </div>
        <div className="scrollbar-none flex gap-4 overflow-x-auto px-5 pb-2">
          {CATEGORIES.map((c, i) => {
            const active = category === c.id;
            return (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => setCategory(active ? null : c.id)}
                className="flex shrink-0 flex-col items-center gap-2"
              >
                <motion.div
                  animate={{ scale: active ? 1.06 : 1 }}
                  transition={{ type: "spring", stiffness: 380, damping: 26 }}
                  className={cx(
                    "relative size-[4.5rem] overflow-hidden rounded-full border-2 transition-colors duration-500",
                    active
                      ? "border-white shadow-[0_0_28px_-6px_rgba(255,255,255,0.55)]"
                      : "border-white/12",
                  )}
                >
                  <ImageWithFallback src={c.image} alt={c.label} className="size-full object-cover" />
                  <div
                    className={cx(
                      "absolute inset-0 transition-colors duration-500",
                      active ? "bg-black/0" : "bg-black/25",
                    )}
                  />
                  {active && <Sheen duration={2.4} repeatDelay={3} />}
                </motion.div>
                <span className={cx(active ? "text-white" : "text-white/50")}>{c.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Collections */}
      <div className="mt-8">
        <div className="px-5">
          <SectionTitle label="Curated collections" action="See all" />
        </div>
        <div className="scrollbar-none flex gap-4 overflow-x-auto px-5 pb-2">
          {COLLECTIONS.map((c) => (
            <Glass
              key={c.id}
              whileTap={{ scale: 0.97 }}
              whileHover={{ y: -4 }}
              sheen
              className="h-40 w-44 shrink-0 cursor-pointer"
            >
              <ImageWithFallback
                src={c.image}
                alt={c.title.replace("\n", " ")}
                className="absolute inset-0 size-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="relative flex h-full flex-col justify-end p-4">
                <p className="whitespace-pre-line text-white">{c.title}</p>
                <p className="mt-1 text-white/50">{c.sub}</p>
              </div>
            </Glass>
          ))}
        </div>
      </div>

      {/* The standard — every one of these is a thing other apps get wrong */}
      <div className="mt-9 px-5">
        <SectionTitle label="The Trubit standard" />
        <div className="grid grid-cols-2 gap-3">
          {STANDARDS.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ delay: i * 0.07, duration: 0.5, ease: [0.22, 0.9, 0.25, 1] }}
              >
                <Glass sheen sheenDelay={i * 0.8} whileHover={{ y: -4 }} className="h-full p-4">
                  <Icon className="size-4 text-white" />
                  <p className="mt-3 text-white">{s.title}</p>
                  <p className="mt-1 text-white/40">{s.sub}</p>
                </Glass>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Filters + list */}
      <div className="mt-9 px-5">
        <SectionTitle label={`${list.length} places around you`} />
        <div className="scrollbar-none -mx-5 mb-5 flex gap-2 overflow-x-auto px-5">
          {FILTERS.map((f) => (
            <Chip key={f} active={filters.includes(f)} onClick={() => toggleFilter(f)}>
              {f}
            </Chip>
          ))}
        </div>

        {list.length === 0 ? (
          <Glass className="p-8 text-center">
            <p className="text-white">Nothing matches those filters.</p>
            <p className="mt-1 text-white/45">Try loosening one of them.</p>
          </Glass>
        ) : (
          <div className="space-y-5">
            {list.map((r, i) => (
              <div key={r.id} className="relative">
                {boostedIds.has(r.id) && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-2 flex items-center gap-1.5 text-amber-400/80"
                  >
                    <Zap className="size-3" />
                    <span className="text-[10px] tracking-[0.2em] uppercase">Promoted</span>
                  </motion.div>
                )}
                <RestaurantCard restaurant={r} onOpen={onOpenRestaurant} index={i} />
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 flex flex-col items-center gap-3 py-6 text-center">
          <TrubitMark className="h-9 text-white/40" />
          <p className="tracking-[0.3em] text-white/25 uppercase">Trubit</p>
          <p className="max-w-[16rem] text-white/20">
            Zero commission. Restaurants keep what they earn, you pay what the food costs.
          </p>
        </div>
      </div>
    </div>
  );
}

function Proof({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 px-3 py-4 text-center">
      <p className="text-white">{value}</p>
      <p className="mt-1 text-white/40">{label}</p>
    </div>
  );
}
