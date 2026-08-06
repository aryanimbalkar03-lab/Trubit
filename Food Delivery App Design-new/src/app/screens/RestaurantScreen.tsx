import { useEffect, useMemo, useState, type ReactNode, type RefObject } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import {
  ArrowLeft,
  Heart,
  Share2,
  Star,
  Clock,
  MapPin,
  BadgePercent,
  TrendingDown,
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Glass, Chip, Divider, cx } from "../components/glass";
import { DishRow } from "../components/pieces";
import { DishSheet } from "../components/DishSheet";
import { RESTAURANTS, type Dish } from "../data/catalog";
import { listedElsewhere, rupees, useApp } from "../store/app-store";
import { usePlatform } from "../store/platform";

export function RestaurantScreen({
  restaurantId,
  onBack,
  scrollRef,
}: {
  restaurantId: string;
  onBack: () => void;
  scrollRef: RefObject<HTMLDivElement | null>;
}) {
  const restaurant = RESTAURANTS.find((r) => r.id === restaurantId) ?? RESTAURANTS[0];
  const { favourites, toggleFav } = useApp();
  const fav = favourites.includes(restaurant.id);
  const [dietary, setDietary] = useState<"all" | "veg" | "nonveg">("all");
  const [inspecting, setInspecting] = useState<Dish | null>(null);
  const { track } = usePlatform();

  /* Every dish the menu actually put in front of you counts as an
     impression. That denominator is what makes the kitchen's click-through
     number honest rather than flattering. */
  useEffect(() => {
    restaurant.menu.forEach((d) => track(d.id, "impressions"));
  }, [restaurant.id]);

  const { scrollY } = useScroll({ container: scrollRef });
  const coverY = useTransform(scrollY, [0, 300], [0, 90]);
  const coverScale = useTransform(scrollY, [0, 300], [1, 1.18]);
  const titleOpacity = useTransform(scrollY, [120, 200], [0, 1]);

  const sections = useMemo(() => {
    const filtered = restaurant.menu.filter((m) =>
      dietary === "all" ? true : dietary === "veg" ? m.veg : !m.veg,
    );
    const order: string[] = [];
    const map = new Map<string, typeof filtered>();
    filtered.forEach((m) => {
      if (!map.has(m.category)) {
        map.set(m.category, []);
        order.push(m.category);
      }
      map.get(m.category)!.push(m);
    });
    return order.map((k) => ({ title: k, items: map.get(k)! }));
  }, [restaurant, dietary]);

  return (
    <div className="pb-44">
      {/* Floating top bar */}
      <div className="fixed inset-x-0 top-0 z-40 mx-auto flex max-w-[26rem] items-center gap-3 px-5 pt-6 pb-3">
        <button
          onClick={onBack}
          className="grid size-10 shrink-0 place-items-center rounded-full border border-white/15 bg-black/50 backdrop-blur-xl"
          aria-label="Back"
        >
          <ArrowLeft className="size-4 text-white" />
        </button>
        <motion.p style={{ opacity: titleOpacity }} className="min-w-0 flex-1 truncate text-white">
          {restaurant.name}
        </motion.p>
        <button
          onClick={() => toggleFav(restaurant.id)}
          className="grid size-10 shrink-0 place-items-center rounded-full border border-white/15 bg-black/50 backdrop-blur-xl"
          aria-label="Favourite"
        >
          <Heart className={cx("size-4", fav ? "fill-white text-white" : "text-white/80")} />
        </button>
        <button
          className="grid size-10 shrink-0 place-items-center rounded-full border border-white/15 bg-black/50 backdrop-blur-xl"
          aria-label="Share"
        >
          <Share2 className="size-4 text-white/80" />
        </button>
      </div>

      {/* Cover */}
      <div className="relative h-72 overflow-hidden">
        <motion.div style={{ y: coverY, scale: coverScale }} className="absolute inset-0">
          <ImageWithFallback
            src={restaurant.cover}
            alt={restaurant.name}
            className="size-full object-cover"
          />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/40" />
      </div>

      <div className="relative -mt-20 px-5">
        <Glass sheen className="p-5">
          <h1 className="text-white">{restaurant.name}</h1>
          <p className="mt-1 text-white/45">{restaurant.cuisines.join(" • ")}</p>

          <div className="mt-4 flex items-stretch gap-4">
            <Stat icon={<Star className="size-3.5" />} value={String(restaurant.rating)} label={`${restaurant.ratingCount} ratings`} />
            <Divider className="h-auto w-px bg-white/10" />
            <Stat icon={<Clock className="size-3.5" />} value={`${restaurant.etaMins}m`} label="Delivery time" />
            <Divider className="h-auto w-px bg-white/10" />
            <Stat icon={<MapPin className="size-3.5" />} value={`${restaurant.distanceKm}km`} label="Distance" />
          </div>

          {restaurant.offer && (
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-dashed border-white/20 bg-white/[0.04] px-4 py-3">
              <BadgePercent className="size-4 shrink-0 text-white" />
              <div className="min-w-0">
                <p className="truncate text-white">{restaurant.offer}</p>
                <p className="text-white/40">Applied automatically at checkout</p>
              </div>
            </div>
          )}

          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.05] px-4 py-3">
            <TrendingDown className="size-4 shrink-0 text-white" />
            <div className="min-w-0">
              <p className="text-white">Direct pricing, 0% commission</p>
              <p className="text-white/40">
                Same menu costs about {rupees(listedElsewhere(restaurant.priceForTwo))} for two
                elsewhere
              </p>
            </div>
          </div>
        </Glass>
      </div>

      {/* Dietary filter */}
      <div className="mt-7 px-5">
        <div className="flex gap-2">
          <Chip active={dietary === "all"} onClick={() => setDietary("all")}>
            Everything
          </Chip>
          <Chip active={dietary === "veg"} onClick={() => setDietary("veg")}>
            Veg only
          </Chip>
          <Chip active={dietary === "nonveg"} onClick={() => setDietary("nonveg")}>
            Non-veg
          </Chip>
        </div>
      </div>

      {/* Menu */}
      <div className="mt-6 px-5">
        {sections.length === 0 && (
          <Glass className="p-8 text-center">
            <p className="text-white">Nothing on the menu matches that.</p>
          </Glass>
        )}
        {sections.map((section, si) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: si * 0.06 }}
            className="mt-7 first:mt-0"
          >
            <div className="flex items-center gap-3">
              <p className="tracking-[0.22em] text-white/50 uppercase">{section.title}</p>
              <span className="text-white/25">{section.items.length}</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <div className="mt-1 divide-y divide-white/[0.07]">
              {section.items.map((dish) => (
                <DishRow
                  key={dish.id}
                  dish={dish}
                  restaurantId={restaurant.id}
                  onInspect={() => setInspecting(dish)}
                />
              ))}
            </div>
          </motion.div>
        ))}

        <p className="mt-12 text-center text-white/25">
          {rupees(restaurant.priceForTwo)} for two · Prices include all taxes
        </p>
      </div>

      <DishSheet
        dish={inspecting}
        restaurantId={restaurant.id}
        onClose={() => setInspecting(null)}
      />
    </div>
  );
}

function Stat({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  return (
    <div className="flex-1">
      <div className="flex items-center gap-1.5 text-white">
        {icon}
        <span>{value}</span>
      </div>
      <p className="mt-0.5 text-white/40">{label}</p>
    </div>
  );
}
