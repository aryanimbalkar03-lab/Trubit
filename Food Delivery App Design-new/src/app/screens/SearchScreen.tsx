import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Search, X, TrendingUp } from "lucide-react";
import { FoodImage } from "../components/FoodImage";
import { Glass, Chip, PriceTag } from "../components/glass";
import { RestaurantCard, Stepper, SectionTitle } from "../components/pieces";
import { ALL_DISHES, RESTAURANTS } from "../data/catalog";
import { listedElsewhere, rupees } from "../store/app-store";
import { usePlatform } from "../store/platform";

const TRENDING = ["Truffle burger", "Biryani", "Omakase", "Cheesecake", "Ramen", "Pizza"];

export function SearchScreen({
  onBack,
  onOpenRestaurant,
}: {
  onBack: () => void;
  onOpenRestaurant: (id: string) => void;
}) {
  const { effective, track } = usePlatform();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"restaurants" | "dishes">("restaurants");
  const query = q.trim().toLowerCase();

  const restaurants = useMemo(
    () =>
      query
        ? RESTAURANTS.filter(
            (r) =>
              r.name.toLowerCase().includes(query) ||
              r.cuisines.some((c) => c.toLowerCase().includes(query)) ||
              r.menu.some((m) => m.name.toLowerCase().includes(query)),
          )
        : [],
    [query],
  );

  const dishes = useMemo(
    () =>
      query
        ? ALL_DISHES.filter(
            (d) =>
              d.name.toLowerCase().includes(query) || d.desc.toLowerCase().includes(query),
          )
        : [],
    [query],
  );

  return (
    <div className="pb-40">
      <div className="sticky top-0 z-30 bg-gradient-to-b from-black via-black/90 to-transparent px-5 pt-6 pb-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="grid size-10 shrink-0 place-items-center rounded-full border border-white/12 bg-white/[0.05] backdrop-blur-xl"
            aria-label="Back"
          >
            <ArrowLeft className="size-4 text-white" />
          </button>
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.05] px-4 py-3 backdrop-blur-2xl">
            <Search className="size-4 shrink-0 text-white/50" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Restaurants, dishes, cuisines"
              className="min-w-0 flex-1 bg-transparent text-white placeholder:text-white/35 outline-none"
            />
            {q && (
              <button onClick={() => setQ("")} aria-label="Clear">
                <X className="size-4 text-white/50" />
              </button>
            )}
          </div>
        </div>

        {query && (
          <div className="mt-4 flex gap-2">
            <Chip active={tab === "restaurants"} onClick={() => setTab("restaurants")}>
              Restaurants ({restaurants.length})
            </Chip>
            <Chip active={tab === "dishes"} onClick={() => setTab("dishes")}>
              Dishes ({dishes.length})
            </Chip>
          </div>
        )}
      </div>

      <div className="px-5">
        <AnimatePresence mode="wait">
          {!query ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="mb-4 flex items-center gap-2 text-white/45">
                <TrendingUp className="size-4" />
                <span className="tracking-[0.2em] uppercase">Trending now</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {TRENDING.map((t) => (
                  <Chip key={t} onClick={() => setQ(t)}>
                    {t}
                  </Chip>
                ))}
              </div>

              <div className="mt-10">
                <SectionTitle label="Top rated near you" />
                <div className="space-y-5">
                  {[...RESTAURANTS]
                    .sort((a, b) => b.rating - a.rating)
                    .slice(0, 3)
                    .map((r, i) => (
                      <RestaurantCard
                        key={r.id}
                        restaurant={r}
                        onOpen={onOpenRestaurant}
                        index={i}
                      />
                    ))}
                </div>
              </div>
            </motion.div>
          ) : tab === "restaurants" ? (
            <motion.div
              key="rest"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              {restaurants.length === 0 && <Empty term={q} />}
              {restaurants.map((r, i) => (
                <RestaurantCard key={r.id} restaurant={r} onOpen={onOpenRestaurant} index={i} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="dish"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {dishes.length === 0 && <Empty term={q} />}
              {dishes.map((raw) => {
                const dish = { ...effective(raw), restaurantId: raw.restaurantId, restaurantName: raw.restaurantName };
                return (
                <Glass
                  key={`${dish.restaurantId}-${dish.id}`}
                  sheen
                  whileHover={{ y: -3 }}
                  className="flex gap-4 p-4"
                >
                  <div className="size-20 shrink-0 overflow-hidden rounded-xl border border-white/10">
                    <FoodImage
                      angles={dish.angles}
                      alt={dish.name}
                      className="size-full"
                      onInspect={() => track(dish.id, "clicks")}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-white">{dish.name}</p>
                    <button
                      onClick={() => onOpenRestaurant(dish.restaurantId)}
                      className="mt-0.5 block max-w-full truncate text-left text-white/45 underline underline-offset-4"
                    >
                      {dish.restaurantName}
                    </button>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <PriceTag
                        price={rupees(dish.price)}
                        elsewhere={rupees(listedElsewhere(dish.price))}
                      />
                      <Stepper dish={raw} restaurantId={dish.restaurantId} />
                    </div>
                  </div>
                </Glass>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Empty({ term }: { term: string }) {
  return (
    <Glass className="p-8 text-center">
      <p className="text-white">No results for “{term}”</p>
      <p className="mt-1 text-white/45">Try a different dish or cuisine.</p>
    </Glass>
  );
}
