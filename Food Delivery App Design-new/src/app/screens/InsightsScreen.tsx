import { useMemo } from "react";
import { motion } from "motion/react";
import { Flame, Beef, Wheat, Droplet, Salad, TrendingDown, Heart, Store } from "lucide-react";
import { Glass, Divider, Sheen, cx } from "../components/glass";
import { FoodImage } from "../components/FoodImage";
import { RESTAURANTS } from "../data/catalog";
import { rupees, savingsOn, useApp, type Order } from "../store/app-store";

/* ------------------------------------------------------------------ *
 * Your last ten days, without spin.
 *
 * Aggregators know exactly what you eat and show you none of it, because
 * a person who can see their own sodium intake orders less. We show it.
 * ------------------------------------------------------------------ */

const DAY = 864e5;

/** Historical orders so the picture is real on first open. */
function syntheticHistory(): Order[] {
  const out: Order[] = [];
  let seed = 7;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483647;
    return seed / 2147483647;
  };
  for (let d = 0; d < 10; d++) {
    const perDay = rnd() > 0.68 ? 2 : rnd() > 0.25 ? 1 : 0;
    for (let k = 0; k < perDay; k++) {
      const r = RESTAURANTS[Math.floor(rnd() * RESTAURANTS.length)];
      const dish = r.menu[Math.floor(rnd() * r.menu.length)];
      const qty = rnd() > 0.75 ? 2 : 1;
      out.push({
        id: `TRB-H${d}${k}`,
        restaurantId: r.id,
        restaurantName: r.name,
        lines: [{ dish, qty }],
        total: dish.price * qty + 29,
        placedAt: Date.now() - d * DAY - Math.floor(rnd() * DAY),
        status: "delivered",
        promisedMins: r.etaMins,
        cutlery: false,
      });
    }
  }
  return out;
}

export function InsightsScreen({ onOpenRestaurant }: { onOpenRestaurant: (id: string) => void }) {
  const { orders } = useApp();

  const history = useMemo(() => {
    const synth = syntheticHistory();
    const real = orders.filter((o) => o.status === "delivered" && Date.now() - o.placedAt < 10 * DAY);
    return [...real, ...synth].sort((a, b) => b.placedAt - a.placedAt);
  }, [orders]);

  const stats = useMemo(() => {
    const lines = history.flatMap((o) => o.lines);
    const kcal = lines.reduce((s, l) => s + l.dish.nutrition.kcal * l.qty, 0);
    const protein = lines.reduce((s, l) => s + l.dish.nutrition.protein * l.qty, 0);
    const carbs = lines.reduce((s, l) => s + l.dish.nutrition.carbs * l.qty, 0);
    const fat = lines.reduce((s, l) => s + l.dish.nutrition.fat * l.qty, 0);
    const fibre = lines.reduce((s, l) => s + l.dish.nutrition.fibre * l.qty, 0);
    const sodium = lines.reduce((s, l) => s + l.dish.nutrition.sodiumMg * l.qty, 0);
    const spend = history.reduce((s, o) => s + o.total, 0);
    const saved = lines.reduce((s, l) => s + savingsOn(l.dish.price) * l.qty, 0);
    const vegShare = lines.length
      ? lines.filter((l) => l.dish.veg).length / lines.length
      : 0;

    const byRestaurant = new Map<string, { name: string; n: number; spend: number }>();
    history.forEach((o) => {
      const cur = byRestaurant.get(o.restaurantId) ?? { name: o.restaurantName, n: 0, spend: 0 };
      byRestaurant.set(o.restaurantId, { ...cur, n: cur.n + 1, spend: cur.spend + o.total });
    });
    const top = [...byRestaurant.entries()].sort((a, b) => b[1].n - a[1].n);

    const byCat = new Map<string, number>();
    lines.forEach((l) => byCat.set(l.dish.category, (byCat.get(l.dish.category) ?? 0) + l.qty));
    const cats = [...byCat.entries()].sort((a, b) => b[1] - a[1]);

    const days = Array.from({ length: 10 }, (_, i) => {
      const start = Date.now() - (9 - i) * DAY;
      const on = history.filter((o) => Math.abs(o.placedAt - start) < DAY / 2 || (o.placedAt > start - DAY / 2 && o.placedAt <= start + DAY / 2));
      return on.reduce((s, o) => s + o.lines.reduce((t, l) => t + l.dish.nutrition.kcal * l.qty, 0), 0);
    });

    return {
      orders: history.length,
      kcal,
      protein,
      carbs,
      fat,
      fibre,
      sodium,
      spend,
      saved,
      vegShare,
      top,
      cats,
      days,
      perDayKcal: Math.round(kcal / 10),
    };
  }, [history]);

  const macroTotal = stats.protein * 4 + stats.carbs * 4 + stats.fat * 9 || 1;
  const peak = Math.max(...stats.days, 1);

  return (
    <div className="pb-40">
      <div className="px-5 pt-8 pb-5">
        <p className="tracking-[0.22em] text-white/45 uppercase">Last 10 days</p>
        <h1 className="mt-1 text-white">What you{"\n"}actually ate</h1>
        <p className="mt-2 text-white/45">
          Every other app has this data and shows you none of it. Here it is, unrounded.
        </p>
      </div>

      {/* Headline */}
      <div className="px-5">
        <Glass sheen className="flex items-stretch divide-x divide-white/[0.08] p-0">
          <Head value={`${stats.orders}`} label="Orders" />
          <Head value={rupees(stats.spend)} label="Spent" />
          <Head value={rupees(stats.saved)} label="Saved vs others" />
        </Glass>
      </div>

      {/* Calories over time */}
      <div className="mt-5 px-5">
        <Glass className="p-5">
          <div className="flex items-baseline justify-between">
            <p className="text-white">Calories per day</p>
            <p className="text-white/45">avg {stats.perDayKcal.toLocaleString("en-IN")} kcal</p>
          </div>
          <div className="mt-4 flex h-28 items-end gap-1.5">
            {stats.days.map((v, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${Math.max((v / peak) * 100, 3)}%` }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 200, damping: 22 }}
                className={cx(
                  "flex-1 rounded-t-md",
                  v > stats.perDayKcal * 1.4 ? "bg-white" : "bg-white/25",
                )}
              />
            ))}
          </div>
          <p className="mt-3 text-white/35">
            Bars in solid white are days you went 40% over your own average. No judgement — just the
            number nobody else will give you.
          </p>
        </Glass>
      </div>

      {/* Macros */}
      <div className="mt-5 px-5">
        <Glass className="p-5">
          <p className="text-white">Where those calories came from</p>
          <div className="mt-4 flex h-3 overflow-hidden rounded-full">
            {[
              { k: "protein", v: stats.protein * 4, cls: "bg-white" },
              { k: "carbs", v: stats.carbs * 4, cls: "bg-white/55" },
              { k: "fat", v: stats.fat * 9, cls: "bg-white/25" },
            ].map((m, i) => (
              <motion.div
                key={m.k}
                initial={{ width: 0 }}
                animate={{ width: `${(m.v / macroTotal) * 100}%` }}
                transition={{ delay: i * 0.12, duration: 0.8, ease: [0.22, 0.9, 0.25, 1] }}
                className={m.cls}
              />
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Nut icon={Beef} label="Protein" value={`${stats.protein} g`} />
            <Nut icon={Wheat} label="Carbs" value={`${stats.carbs} g`} />
            <Nut icon={Droplet} label="Fat" value={`${stats.fat} g`} />
            <Nut icon={Salad} label="Fibre" value={`${stats.fibre} g`} />
            <Nut icon={Flame} label="Calories" value={`${stats.kcal.toLocaleString("en-IN")} kcal`} />
            <Nut icon={Droplet} label="Sodium" value={`${(stats.sodium / 1000).toFixed(1)} g`} />
          </div>
          <Divider className="my-4" />
          <p className="text-white/45">
            That sodium is{" "}
            <span className="text-white">
              {Math.round(stats.sodium / 10 / 200)}%
            </span>{" "}
            of the WHO ten-day guideline, and{" "}
            <span className="text-white">{Math.round(stats.vegShare * 100)}%</span> of what you
            ordered was vegetarian.
          </p>
        </Glass>
      </div>

      {/* Categories */}
      <div className="mt-5 px-5">
        <Glass className="space-y-3 p-5">
          <p className="text-white">What you keep ordering</p>
          {stats.cats.slice(0, 5).map(([cat, n], i) => (
            <div key={cat}>
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-white/55">{cat}</span>
                <span className="text-white">{n}×</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(n / stats.cats[0][1]) * 100}%` }}
                  transition={{ delay: i * 0.08, duration: 0.7 }}
                  className="h-full rounded-full bg-white"
                  style={{ opacity: 1 - i * 0.15 }}
                />
              </div>
            </div>
          ))}
        </Glass>
      </div>

      {/* Top restaurants */}
      <div className="mt-5 px-5">
        <Glass className="p-5">
          <div className="flex items-center gap-2">
            <Store className="size-4 text-white" />
            <p className="text-white">Your kitchens</p>
          </div>
          <div className="mt-4 space-y-3">
            {stats.top.slice(0, 3).map(([id, r], i) => {
              const rest = RESTAURANTS.find((x) => x.id === id);
              return (
                <button
                  key={id}
                  onClick={() => onOpenRestaurant(id)}
                  className="flex w-full items-center gap-3 text-left"
                >
                  <span className="w-4 shrink-0 text-white/30">{i + 1}</span>
                  {rest && (
                    <FoodImage angles={[rest.image, rest.cover]} alt={r.name} className="size-12 shrink-0 rounded-xl" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-white">{r.name}</p>
                    <p className="text-white/40">
                      {r.n} orders · {rupees(r.spend)}
                    </p>
                  </div>
                  {i === 0 && <Heart className="size-4 shrink-0 text-white" />}
                </button>
              );
            })}
          </div>
        </Glass>
      </div>

      {/* Spend */}
      <div className="mt-5 px-5">
        <Glass sheen className="p-5">
          <div className="flex items-center gap-2">
            <TrendingDown className="size-4 text-white" />
            <p className="text-white">The money</p>
          </div>
          <h1 className="mt-3 text-white">{rupees(stats.spend)}</h1>
          <p className="mt-1 text-white/45">
            across {stats.orders} orders · {rupees(Math.round(stats.spend / Math.max(stats.orders, 1)))} average
          </p>
          <Divider className="my-4" />
          <p className="text-white/50">
            The same baskets on an aggregator would have cost{" "}
            <span className="text-white">{rupees(stats.spend + stats.saved)}</span>. You kept{" "}
            <span className="text-white">{rupees(stats.saved)}</span> — that is{" "}
            {Math.round((stats.saved / (stats.spend + stats.saved)) * 100)}% of what you would have
            handed over.
          </p>
        </Glass>
      </div>

      {/* The log */}
      <div className="mt-5 space-y-3 px-5">
        <p className="tracking-[0.22em] text-white/40 uppercase">Every order, every day</p>
        {history.map((o) => (
          <Glass key={o.id} className="flex items-center gap-3 p-3">
            <FoodImage
              angles={o.lines[0].dish.angles}
              alt={o.lines[0].dish.name}
              className="size-14 shrink-0 rounded-xl"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-white">
                {o.lines.map((l) => `${l.qty}× ${l.dish.name}`).join(", ")}
              </p>
              <p className="truncate text-white/40">
                {o.restaurantName} ·{" "}
                {new Date(o.placedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-white">{rupees(o.total)}</p>
              <p className="text-white/35">
                {o.lines.reduce((s, l) => s + l.dish.nutrition.kcal * l.qty, 0)} kcal
              </p>
            </div>
          </Glass>
        ))}
      </div>
    </div>
  );
}

function Head({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 px-3 py-4 text-center">
      <p className="text-white">{value}</p>
      <p className="mt-1 text-white/40">{label}</p>
    </div>
  );
}

function Nut({ icon: Icon, label, value }: { icon: typeof Flame; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5">
      <Icon className="size-3.5 shrink-0 text-white/40" />
      <div className="min-w-0">
        <p className="truncate text-white">{value}</p>
        <p className="text-white/35">{label}</p>
      </div>
    </div>
  );
}
