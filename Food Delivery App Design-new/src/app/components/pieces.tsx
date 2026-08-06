import { motion, AnimatePresence } from "motion/react";
import { Star, Clock, Minus, Plus, Heart, BadgePercent, TrendingDown, Info } from "lucide-react";
import { Glass, Sheen, PriceTag, cx, VegDot } from "./glass";
import { listedElsewhere, rupees, savingsOn, useApp } from "../store/app-store";
import { usePlatform } from "../store/platform";
import { FoodImage } from "./FoodImage";
import { StockPill } from "./StockPill";
import type { Dish, Restaurant } from "../data/catalog";

const SPRING = { type: "spring", stiffness: 420, damping: 32 } as const;

/**
 * Add / quantity control.
 *
 * Adding takes a hold on real stock before it touches the cart, so the count
 * you saw is the count you get. When nothing is free you are given a queue
 * position instead of a cart line that would fail at checkout.
 */
export function Stepper({ dish, restaurantId }: { dish: Dish; restaurantId: string }) {
  const { qtyOf, addItem, removeItem } = useApp();
  const { reserve, release, availableOf, track, queuePosition } = usePlatform();
  const qty = qtyOf(dish.id);
  const soldOut = availableOf(dish) === 0 && qty === 0;
  const queued = queuePosition(dish.id);

  const tryAdd = () => {
    const res = reserve(dish, qty + 1);
    if (!res.ok) return;
    addItem(dish, restaurantId);
    track(dish.id, "adds");
  };

  const takeAway = () => {
    removeItem(dish.id);
    if (qty <= 1) release(dish.id);
    else reserve(dish, qty - 1);
  };

  if (soldOut) {
    return (
      <div className="relative flex h-10 w-[6.5rem] items-center justify-center rounded-full border border-dashed border-white/25 text-white/50">
        {queued > 0 ? `#${queued} in queue` : "Sold out"}
      </div>
    );
  }

  return (
    <div className="relative h-10 w-[6.5rem]">
      <AnimatePresence initial={false} mode="popLayout">
        {qty === 0 ? (
          <motion.button
            key="add"
            initial={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
            whileTap={{ scale: 0.9 }}
            transition={SPRING}
            onClick={tryAdd}
            className="absolute inset-0 overflow-hidden rounded-full border border-white/25 bg-white/[0.08] tracking-[0.14em] text-white uppercase backdrop-blur-xl"
          >
            <Sheen duration={2.6} repeatDelay={5} />
            <span className="relative">Add</span>
          </motion.button>
        ) : (
          <motion.div
            key="qty"
            initial={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
            transition={SPRING}
            className="absolute inset-0 flex items-center justify-between rounded-full bg-white px-1 text-black shadow-[0_0_24px_-4px_rgba(255,255,255,0.45)]"
          >
            <button
              onClick={takeAway}
              className="grid size-8 place-items-center rounded-full transition-colors hover:bg-black/10"
              aria-label={`Remove one ${dish.name}`}
            >
              <Minus className="size-4" />
            </button>
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={qty}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 10, opacity: 0 }}
                transition={SPRING}
              >
                {qty}
              </motion.span>
            </AnimatePresence>
            <button
              onClick={tryAdd}
              disabled={availableOf(dish) === 0}
              className="grid size-8 place-items-center rounded-full transition-colors hover:bg-black/10 disabled:opacity-30"
              aria-label={`Add one ${dish.name}`}
            >
              <Plus className="size-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DishRow({
  dish: raw,
  restaurantId,
  subtitle,
  onInspect,
}: {
  dish: Dish;
  restaurantId: string;
  subtitle?: string;
  onInspect?: () => void;
}) {
  const { effective, track } = usePlatform();
  const dish = effective(raw);
  return (
    <div className="flex gap-4 py-5">
      <div
        role={onInspect ? "button" : undefined}
        onClick={onInspect}
        className={cx("min-w-0 flex-1", onInspect && "cursor-pointer")}
      >
        <div className="flex items-center gap-2">
          <VegDot veg={dish.veg} />
          {dish.bestseller && (
            <span className="rounded-full border border-white/25 px-2 py-0.5 text-[10px] tracking-[0.18em] text-white/80 uppercase">
              Bestseller
            </span>
          )}
        </div>
        <p className="mt-2 text-white">{dish.name}</p>
        <PriceTag
          className="mt-1"
          price={rupees(dish.price)}
          elsewhere={rupees(listedElsewhere(dish.price))}
        />
        <p className="mt-0.5 text-white/35">You save {rupees(savingsOn(dish.price))}</p>
        <p className="mt-2 line-clamp-2 text-white/40">{subtitle ?? dish.desc}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StockPill dish={raw} />
          <span className="text-white/35">{dish.nutrition.kcal} kcal</span>
        </div>
        {onInspect && (
          <span className="mt-2 inline-flex items-center gap-1 text-white/45 underline underline-offset-4">
            <Info className="size-3" /> Nutrition, allergens &amp; real photos
          </span>
        )}
      </div>
      <div className="relative w-28 shrink-0">
        <motion.div
          whileHover={{ scale: 1.03 }}
          transition={SPRING}
          className="relative h-28 w-28 overflow-hidden rounded-2xl border border-white/12 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.9)]"
        >
          <FoodImage
            angles={dish.angles}
            alt={dish.name}
            className="size-full"
            onInspect={() => track(raw.id, "clicks")}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
          <Sheen duration={3} repeatDelay={7} />
        </motion.div>
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
          <Stepper dish={raw} restaurantId={restaurantId} />
        </div>
      </div>
    </div>
  );
}

export function RestaurantCard({
  restaurant,
  onOpen,
  index = 0,
}: {
  restaurant: Restaurant;
  onOpen: (id: string) => void;
  index?: number;
}) {
  const { favourites, toggleFav } = useApp();
  const fav = favourites.includes(restaurant.id);
  const saving = savingsOn(restaurant.priceForTwo);

  return (
    <motion.div
      initial={{ opacity: 0, y: 28, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{
        delay: Math.min(index * 0.06, 0.36),
        duration: 0.55,
        ease: [0.22, 0.9, 0.25, 1],
      }}
    >
      <Glass
        whileHover={{ y: -4 }}
        whileTap={{ scale: 0.985 }}
        sheen
        sheenDelay={index * 0.5}
        onClick={() => onOpen(restaurant.id)}
        className="cursor-pointer"
      >
        <div className="relative h-44 overflow-hidden">
          <FoodImage
            angles={[restaurant.cover, restaurant.image, ...restaurant.menu.slice(0, 2).map((m) => m.image)]}
            alt={restaurant.name}
            className="absolute inset-0 size-full"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/10" />
          {restaurant.promoted && (
            <span className="absolute top-3 left-3 rounded-full border border-white/25 bg-black/55 px-3 py-1 text-[10px] tracking-[0.18em] text-white/85 uppercase backdrop-blur-xl">
              Promoted
            </span>
          )}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => {
              e.stopPropagation();
              toggleFav(restaurant.id);
            }}
            className="absolute top-3 right-3 grid size-9 place-items-center rounded-full border border-white/15 bg-black/45 backdrop-blur-xl"
            aria-label="Toggle favourite"
          >
            <motion.span animate={{ scale: fav ? [1, 1.35, 1] : 1 }} transition={{ duration: 0.35 }}>
              <Heart className={cx("size-4", fav ? "fill-white text-white" : "text-white/70")} />
            </motion.span>
          </motion.button>
          <div className="absolute right-3 bottom-3 left-3 flex items-end justify-between gap-3">
            {restaurant.offer && (
              <span className="flex min-w-0 items-center gap-2 text-white">
                <BadgePercent className="size-4 shrink-0" />
                <span className="truncate tracking-wide">{restaurant.offer}</span>
              </span>
            )}
            <span className="flex shrink-0 items-center gap-1 rounded-full border border-white/25 bg-black/55 px-2.5 py-1 text-white backdrop-blur-xl">
              <TrendingDown className="size-3.5" />
              0% markup
            </span>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 truncate text-white">{restaurant.name}</p>
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-white px-2 py-0.5 text-black">
              <Star className="size-3 fill-black" />
              {restaurant.rating}
            </span>
          </div>
          <p className="mt-1 truncate text-white/45">{restaurant.cuisines.join(" • ")}</p>
          <div className="mt-3 flex items-center gap-3 text-white/55">
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5" /> {restaurant.etaMins} min
            </span>
            <span className="size-1 rounded-full bg-white/25" />
            <span>{restaurant.distanceKm} km</span>
            <span className="size-1 rounded-full bg-white/25" />
            <PriceTag
              size="sm"
              price={`${rupees(restaurant.priceForTwo)} for two`}
              elsewhere={rupees(listedElsewhere(restaurant.priceForTwo))}
            />
          </div>
          <p className="mt-2 text-white/35">
            About {rupees(saving)} cheaper than on aggregator apps
          </p>
        </div>
      </Glass>
    </motion.div>
  );
}

export function SectionTitle({ label, action }: { label: string; action?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <h2 className="tracking-[0.02em] text-white">{label}</h2>
      {action && <span className="text-white/45">{action}</span>}
    </div>
  );
}
