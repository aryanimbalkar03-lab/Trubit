import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Store,
  TrendingUp,
  Eye,
  MousePointerClick,
  ShoppingBag,
  Trophy,
  Plus,
  Minus,
  ImagePlus,
  Check,
  ChevronRight,
  Flame,
  AlertTriangle,
  Percent,
} from "lucide-react";
import { Glass, GlassButton, Chip, Divider, Sheen, cx } from "../components/glass";
import { Sheet } from "../components/Sheet";
import { Field } from "../components/Field";
import { FoodImage } from "../components/FoodImage";
import { TrubitMark } from "../components/Logo";
import { IMAGES, RESTAURANTS, type Dish, type Nutrition } from "../data/catalog";
import { rupees, listedElsewhere } from "../store/app-store";
import { usePlatform } from "../store/platform";

type PartnerTab = "dash" | "menu" | "analytics" | "profile";

/* ------------------------------------------------------------------ *
 * Listing form — everything the diner will eventually read.
 * ------------------------------------------------------------------ */
function PartnerOnboarding() {
  const { onboardPartner } = usePlatform();
  const [f, setF] = useState({
    name: "",
    cuisines: "",
    address: "",
    fssai: "",
    gst: "",
    seats: "0",
  });
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const ready = f.name.trim() && f.address.trim() && f.fssai.trim();

  return (
    <div className="space-y-6 px-5 pt-10 pb-32">
      <div>
        <TrubitMark flying className="h-14 text-white" />
        <h1 className="mt-5 text-white">List your restaurant</h1>
        <p className="mt-2 text-white/45">
          No commission, ever. A flat ₹9 per delivered order covers the rider network. That is the
          entire deal, and it is on this screen so nobody has to find it in a contract.
        </p>
      </div>

      <Glass sheen className="flex items-stretch divide-x divide-white/[0.08] p-0">
        <Metric label="Commission" value="0%" />
        <Metric label="Per order" value="₹9" />
        <Metric label="Payout" value="Daily" />
      </Glass>

      <Glass className="space-y-4 p-5">
        <p className="text-white">The basics</p>
        <Field label="Restaurant name" value={f.name} onChange={set("name")} placeholder="Monochrome Grill House" />
        <Field label="Cuisines" value={f.cuisines} onChange={set("cuisines")} placeholder="American, Burgers, Grill" />
        <Field label="Full address" value={f.address} onChange={set("address")} placeholder="Street, area, city" />
      </Glass>

      <Glass className="space-y-4 p-5">
        <p className="text-white">Compliance</p>
        <Field label="FSSAI licence number" value={f.fssai} onChange={set("fssai")} placeholder="14 digits" />
        <Field label="GSTIN (optional)" value={f.gst} onChange={set("gst")} placeholder="15 characters" />
      </Glass>

      <Glass className="space-y-4 p-5">
        <p className="text-white">Dine-in</p>
        <Field
          label="Seats you can take (0 if delivery only)"
          value={f.seats}
          onChange={set("seats")}
          placeholder="0"
          numeric
        />
        <p className="text-white/35">
          Dine-in orders cost us nothing to fulfil, so we charge you nothing on them. Not ₹9, not
          anything.
        </p>
      </Glass>

      <GlassButton
        variant="solid"
        className="w-full py-4"
        disabled={!ready}
        onClick={() =>
          onboardPartner({
            name: f.name.trim(),
            cuisines: f.cuisines.trim(),
            address: f.address.trim(),
            fssai: f.fssai.trim(),
            gst: f.gst.trim(),
            seats: Number(f.seats) || 0,
          })
        }
      >
        Go live <ChevronRight className="size-4" />
      </GlassButton>
      <p className="text-center text-white/25">
        Next step is your menu, where the nutrition you enter is what diners read.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Dish editor — price, stock, angles, and the nutrition panel that
 * ends up on the customer's dish sheet verbatim.
 * ------------------------------------------------------------------ */
const PHOTO_LIBRARY = Object.values(IMAGES);

function DishEditor({ dish, onClose }: { dish: Dish; onClose: () => void }) {
  const { effective, setOverride } = usePlatform();
  const cur = effective(dish);
  const [price, setPrice] = useState(cur.price);
  const [stock, setStock] = useState(cur.stock);
  const [angles, setAngles] = useState<string[]>(cur.angles);
  const [n, setN] = useState<Nutrition>(cur.nutrition);
  const [allergens, setAllergens] = useState<string[]>(cur.allergens);
  const [picker, setPicker] = useState(false);

  const setNut = (k: keyof Nutrition) => (v: string) =>
    setN((p) => ({ ...p, [k]: Number(v) || 0 }));

  const save = () => {
    setOverride(dish.id, { price, stock, angles, nutrition: n, allergens });
    onClose();
  };

  const toggleAngle = (src: string) =>
    setAngles((p) => (p.includes(src) ? p.filter((x) => x !== src) : [...p, src]));

  return (
    <div className="space-y-5 px-5 pt-1 pb-8">
      <div>
        <p className="tracking-[0.22em] text-white/40 uppercase">Editing</p>
        <h2 className="mt-1 text-white">{dish.name}</h2>
      </div>

      {/* Photos */}
      <Glass className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <p className="text-white">Photos · {angles.length}</p>
          <button onClick={() => setPicker(!picker)} className="flex items-center gap-1.5 text-white/60">
            <ImagePlus className="size-4" /> Add angle
          </button>
        </div>
        <p className="text-white/35">
          The first is the hero. Diners press and hold the card to flick through the rest, so upload
          the cross-section and the in-hand shot too.
        </p>
        <div className="scrollbar-none flex gap-2 overflow-x-auto">
          {angles.map((a, i) => (
            <div key={a} className="relative shrink-0">
              <FoodImage angles={[a]} alt="" className="size-20 rounded-xl" />
              {i === 0 && (
                <span className="absolute top-1 left-1 rounded-full bg-white px-1.5 text-[9px] text-black">
                  Hero
                </span>
              )}
              <button
                onClick={() => toggleAngle(a)}
                className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full border border-white/20 bg-black text-white"
              >
                <Minus className="size-3" />
              </button>
            </div>
          ))}
        </div>
        <AnimatePresence>
          {picker && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-4 gap-2 pt-2">
                {PHOTO_LIBRARY.filter((p) => !angles.includes(p)).map((p) => (
                  <button
                    key={p}
                    onClick={() => toggleAngle(p)}
                    className="relative aspect-square overflow-hidden rounded-lg border border-white/10"
                  >
                    <FoodImage angles={[p]} alt="" className="size-full" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Glass>

      {/* Price + stock */}
      <Glass className="space-y-4 p-5">
        <p className="text-white">Price and availability</p>
        <Field label="Your price (₹)" value={String(price)} onChange={(v) => setPrice(Number(v) || 0)} numeric />
        <p className="text-white/35">
          Diners pay exactly this. On an aggregator the same plate would list at{" "}
          {rupees(listedElsewhere(price))} once commission is loaded on.
        </p>
        <Divider />
        <div>
          <p className="mb-2 text-white/50">Portions you can cook today</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setStock(Math.max(0, stock - 1))}
              className="grid size-9 place-items-center rounded-full border border-white/15 text-white"
            >
              <Minus className="size-4" />
            </button>
            <span className="min-w-10 text-center text-white">{stock}</span>
            <button
              onClick={() => setStock(stock + 1)}
              className="grid size-9 place-items-center rounded-full border border-white/15 text-white"
            >
              <Plus className="size-4" />
            </button>
            <p className="ml-2 min-w-0 flex-1 text-white/35">
              Hit zero and the dish shows as sold out with a queue — never as available.
            </p>
          </div>
        </div>
      </Glass>

      {/* Nutrition */}
      <Glass className="space-y-4 p-5">
        <p className="text-white">Nutrition — shown to every diner</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Serving (g)" value={String(n.servingG)} onChange={setNut("servingG")} numeric />
          <Field label="Calories (kcal)" value={String(n.kcal)} onChange={setNut("kcal")} numeric />
          <Field label="Protein (g)" value={String(n.protein)} onChange={setNut("protein")} numeric />
          <Field label="Carbs (g)" value={String(n.carbs)} onChange={setNut("carbs")} numeric />
          <Field label="Fat (g)" value={String(n.fat)} onChange={setNut("fat")} numeric />
          <Field label="Fibre (g)" value={String(n.fibre)} onChange={setNut("fibre")} numeric />
          <Field label="Sodium (mg)" value={String(n.sodiumMg)} onChange={setNut("sodiumMg")} numeric />
        </div>
        <Divider />
        <p className="text-white/50">Allergens</p>
        <div className="flex flex-wrap gap-2">
          {["Gluten", "Dairy", "Egg", "Nuts", "Soy", "Fish", "Shellfish", "Sesame"].map((a) => (
            <Chip
              key={a}
              active={allergens.includes(a)}
              onClick={() =>
                setAllergens((p) => (p.includes(a) ? p.filter((x) => x !== a) : [...p, a]))
              }
            >
              {a}
            </Chip>
          ))}
        </div>
        <div className="flex gap-2.5 rounded-2xl border border-dashed border-white/20 p-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-white/50" />
          <p className="text-white/45">
            Leaving an allergen off is the one thing we will delist a kitchen for. Diners make
            medical decisions on this panel.
          </p>
        </div>
      </Glass>

      <GlassButton variant="solid" className="w-full py-4" onClick={save}>
        <Check className="size-4" /> Publish changes
      </GlassButton>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Menu manager
 * ------------------------------------------------------------------ */
function MenuScreen() {
  const { partner, effective, availableOf } = usePlatform();
  const restaurant = RESTAURANTS.find((r) => r.id === partner.restaurantId) ?? RESTAURANTS[0];
  const [editing, setEditing] = useState<Dish | null>(null);

  return (
    <div className="pb-40">
      <div className="px-5 pt-8 pb-5">
        <p className="tracking-[0.22em] text-white/45 uppercase">Menu</p>
        <h1 className="mt-1 text-white">{restaurant.menu.length} dishes live</h1>
        <p className="mt-1 text-white/45">Tap any dish to change price, stock, photos or nutrition.</p>
      </div>

      <div className="space-y-3 px-5">
        {restaurant.menu.map((raw, i) => {
          const dish = effective(raw);
          const left = availableOf(raw);
          return (
            <motion.div
              key={dish.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <Glass
                sheen
                sheenDelay={i * 0.3}
                whileTap={{ scale: 0.99 }}
                onClick={() => setEditing(raw)}
                className="flex cursor-pointer gap-3 p-3"
              >
                <FoodImage angles={dish.angles} alt={dish.name} className="size-20 shrink-0 rounded-2xl" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-white">{dish.name}</p>
                  <p className="mt-0.5 text-white/40">
                    {dish.nutrition.kcal} kcal · {dish.angles.length} photos
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-white">{rupees(dish.price)}</span>
                    <span
                      className={cx(
                        "rounded-full border px-2 py-0.5",
                        left === 0
                          ? "border-white/20 text-white/40"
                          : left <= 4
                            ? "border-white/60 text-white"
                            : "border-white/12 text-white/50",
                      )}
                    >
                      {left === 0 ? "Sold out" : `${left} left`}
                    </span>
                  </div>
                </div>
                <ChevronRight className="size-4 shrink-0 self-center text-white/30" />
              </Glass>
            </motion.div>
          );
        })}
      </div>

      <Sheet open={Boolean(editing)} onClose={() => setEditing(null)}>
        {editing && <DishEditor dish={editing} onClose={() => setEditing(null)} />}
      </Sheet>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Analytics — the funnel, the rank, and where you lose people.
 * ------------------------------------------------------------------ */
function AnalyticsScreen() {
  const { partner, funnel, effective } = usePlatform();
  const restaurant = RESTAURANTS.find((r) => r.id === partner.restaurantId) ?? RESTAURANTS[0];

  const rows = useMemo(
    () =>
      restaurant.menu
        .map((raw) => {
          const dish = effective(raw);
          const f = funnel[dish.id];
          return {
            dish,
            ...f,
            ctr: f.impressions ? f.clicks / f.impressions : 0,
            addRate: f.clicks ? f.adds / f.clicks : 0,
            closeRate: f.adds ? f.orders / f.adds : 0,
          };
        })
        .sort((a, b) => b.revenue - a.revenue),
    [restaurant, funnel, effective],
  );

  const totals = rows.reduce(
    (t, r) => ({
      impressions: t.impressions + r.impressions,
      clicks: t.clicks + r.clicks,
      adds: t.adds + r.adds,
      orders: t.orders + r.orders,
      revenue: t.revenue + r.revenue,
    }),
    { impressions: 0, clicks: 0, adds: 0, orders: 0, revenue: 0 },
  );

  // Rank against every other kitchen on revenue-per-impression.
  const rank = useMemo(() => {
    const scored = RESTAURANTS.map((r) => {
      const rev = r.menu.reduce((s, d) => s + (funnel[d.id]?.revenue ?? 0), 0);
      return { id: r.id, rev };
    }).sort((a, b) => b.rev - a.rev);
    return scored.findIndex((s) => s.id === restaurant.id) + 1;
  }, [funnel, restaurant.id]);

  const passedBy = totals.impressions - totals.clicks;
  const bounced = totals.clicks - totals.adds;
  const abandoned = totals.adds - totals.orders;

  const worstCtr = rows.reduce((w, r) => (r.ctr < w.ctr ? r : w), rows[0]);
  const worstClose = rows.reduce((w, r) => (r.closeRate < w.closeRate ? r : w), rows[0]);

  return (
    <div className="pb-40">
      <div className="px-5 pt-8 pb-5">
        <p className="tracking-[0.22em] text-white/45 uppercase">Performance</p>
        <h1 className="mt-1 text-white">{rupees(totals.revenue)}</h1>
        <p className="mt-1 text-white/45">
          Last 30 days · you kept {rupees(totals.revenue - totals.orders * 9)} after our ₹9s
        </p>
      </div>

      <div className="px-5">
        <Glass sheen className="flex items-stretch divide-x divide-white/[0.08] p-0">
          <Metric label="City rank" value={`#${rank}`} />
          <Metric label="Orders" value={`${totals.orders}`} />
          <Metric label="Conversion" value={`${((totals.orders / totals.impressions) * 100).toFixed(1)}%`} />
        </Glass>
      </div>

      {/* The funnel */}
      <div className="mt-5 px-5">
        <Glass className="space-y-4 p-5">
          <p className="text-white">Where people go</p>
          <Funnel
            steps={[
              { icon: Eye, label: "Saw your restaurant", value: totals.impressions },
              { icon: MousePointerClick, label: "Opened it", value: totals.clicks },
              { icon: Plus, label: "Added something", value: totals.adds },
              { icon: ShoppingBag, label: "Paid", value: totals.orders },
            ]}
          />
          <Divider />
          <Leak label="Scrolled past without opening" value={passedBy} of={totals.impressions} />
          <Leak label="Opened, added nothing" value={bounced} of={totals.clicks} />
          <Leak label="Added, never paid" value={abandoned} of={totals.adds} />
        </Glass>
      </div>

      {/* What to fix */}
      <div className="mt-5 px-5">
        <Glass className="space-y-3 p-5">
          <div className="flex items-center gap-2">
            <Flame className="size-4 text-white" />
            <p className="text-white">Two things worth fixing</p>
          </div>
          {worstCtr && (
            <p className="text-white/50">
              <span className="text-white">{worstCtr.dish.name}</span> is shown{" "}
              {worstCtr.impressions.toLocaleString("en-IN")} times but opened by only{" "}
              {(worstCtr.ctr * 100).toFixed(1)}%. That is a photo problem — it has{" "}
              {worstCtr.dish.angles.length} angle{worstCtr.dish.angles.length > 1 ? "s" : ""}.
            </p>
          )}
          {worstClose && (
            <p className="text-white/50">
              <span className="text-white">{worstClose.dish.name}</span> gets added but only{" "}
              {(worstClose.closeRate * 100).toFixed(0)}% of those carts are paid for. At{" "}
              {rupees(worstClose.dish.price)} it is the priciest thing in its section.
            </p>
          )}
        </Glass>
      </div>

      {/* Per-dish table */}
      <div className="mt-5 space-y-3 px-5">
        <p className="tracking-[0.22em] text-white/40 uppercase">Dish by dish</p>
        {rows.map((r, i) => (
          <motion.div
            key={r.dish.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Glass className="p-4">
              <div className="flex items-center gap-3">
                <span className="w-5 shrink-0 text-white/30">{i + 1}</span>
                <FoodImage angles={r.dish.angles} alt={r.dish.name} className="size-12 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-white">{r.dish.name}</p>
                  <p className="text-white/40">
                    {r.orders} orders · {rupees(r.revenue)}
                  </p>
                </div>
                {i === 0 && <Trophy className="size-4 shrink-0 text-white" />}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <Rate label="Open rate" v={r.ctr} />
                <Rate label="Add rate" v={r.addRate} />
                <Rate label="Pay rate" v={r.closeRate} />
              </div>
            </Glass>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function PartnerDash() {
  const { partner, funnel } = usePlatform();
  const restaurant = RESTAURANTS.find((r) => r.id === partner.restaurantId) ?? RESTAURANTS[0];
  const orders = restaurant.menu.reduce((s, d) => s + (funnel[d.id]?.orders ?? 0), 0);
  const revenue = restaurant.menu.reduce((s, d) => s + (funnel[d.id]?.revenue ?? 0), 0);

  return (
    <div className="space-y-5 px-5 pt-8 pb-40">
      <div>
        <p className="tracking-[0.22em] text-white/45 uppercase">Partner</p>
        <h1 className="mt-1 text-white">{partner.name || restaurant.name}</h1>
      </div>

      <Glass sheen className="p-5">
        <p className="text-white/45">What Trubit took from you this month</p>
        <h1 className="mt-2 text-white">{rupees(orders * 9)}</h1>
        <p className="mt-2 text-white/40">
          {orders} orders × ₹9. On a 25% commission that same month would have cost you{" "}
          {rupees(Math.round(revenue * 0.25))}.
        </p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${((orders * 9) / (revenue * 0.25)) * 100}%` }}
            transition={{ duration: 1, ease: [0.22, 0.9, 0.25, 1] }}
            className="h-full rounded-full bg-white"
          />
        </div>
      </Glass>

      <Glass className="flex items-stretch divide-x divide-white/[0.08] p-0">
        <Metric label="Revenue" value={rupees(revenue)} />
        <Metric label="Orders" value={`${orders}`} />
        <Metric label="Commission" value="0%" />
      </Glass>

      <Glass className="space-y-3 p-5">
        <div className="flex items-center gap-2">
          <Percent className="size-4 text-white" />
          <p className="text-white">Your economics, in full</p>
        </div>
        {[
          ["Menu price you set", "100% reaches you"],
          ["Trubit platform fee", "₹9 flat per delivered order"],
          ["Dine-in orders", "₹0 — we do nothing, we charge nothing"],
          ["Rider cost", "Paid by us out of the diner's delivery fee, not your margin"],
          ["Payout schedule", "Daily at 9 AM, no 14-day hold"],
        ].map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-4">
            <span className="text-white/45">{k}</span>
            <span className="shrink-0 text-white">{v}</span>
          </div>
        ))}
      </Glass>

      <Glass className="space-y-3 p-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-white" />
          <p className="text-white">Today</p>
        </div>
        <p className="text-white/45">
          Peak window is 7:40–9:10 PM. Your kitchen accepts in 48 seconds on average — the city
          median is 2m 10s, and that is most of why you rank where you do.
        </p>
      </Glass>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function PartnerApp({ tab }: { tab: PartnerTab }) {
  const { partner } = usePlatform();
  if (!partner.onboarded) return <PartnerOnboarding />;
  if (tab === "menu") return <MenuScreen />;
  if (tab === "analytics") return <AnalyticsScreen />;
  if (tab === "profile") return <PartnerProfileScreen />;
  return <PartnerDash />;
}

function PartnerProfileScreen() {
  const { partner } = usePlatform();
  return (
    <div className="space-y-5 px-5 pt-8 pb-40">
      <div>
        <p className="tracking-[0.22em] text-white/45 uppercase">Restaurant profile</p>
        <h1 className="mt-1 text-white">{partner.name}</h1>
      </div>
      <Glass className="space-y-3 p-5">
        {[
          ["Cuisines", partner.cuisines || "—"],
          ["Address", partner.address || "—"],
          ["FSSAI", partner.fssai || "—"],
          ["GSTIN", partner.gst || "—"],
          ["Dine-in seats", String(partner.seats)],
          ["Commission", "0%"],
        ].map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-4">
            <span className="text-white/45">{k}</span>
            <span className="min-w-0 truncate text-white">{v}</span>
          </div>
        ))}
      </Glass>
      <Glass className="p-5">
        <Store className="size-4 text-white" />
        <p className="mt-3 text-white">Your listing is live</p>
        <p className="mt-1 text-white/40">
          Diners see your menu prices exactly as you set them. Nothing is added on top at checkout.
        </p>
      </Glass>
    </div>
  );
}

/* ---- shared bits ---- */

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 px-3 py-4 text-center">
      <p className="text-white">{value}</p>
      <p className="mt-1 text-white/40">{label}</p>
    </div>
  );
}

function Funnel({
  steps,
}: {
  steps: { icon: typeof Eye; label: string; value: number }[];
}) {
  const top = steps[0].value || 1;
  return (
    <div className="space-y-2.5">
      {steps.map((s, i) => {
        const Icon = s.icon;
        const pct = (s.value / top) * 100;
        return (
          <div key={s.label}>
            <div className="mb-1 flex items-center gap-2">
              <Icon className="size-3.5 shrink-0 text-white/45" />
              <span className="min-w-0 flex-1 truncate text-white/50">{s.label}</span>
              <span className="shrink-0 text-white">{s.value.toLocaleString("en-IN")}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ delay: i * 0.1, duration: 0.8, ease: [0.22, 0.9, 0.25, 1] }}
                className="h-full rounded-full bg-white"
                style={{ opacity: 1 - i * 0.18 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Leak({ label, value, of }: { label: string; value: number; of: number }) {
  const pct = of ? Math.round((value / of) * 100) : 0;
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="min-w-0 text-white/45">{label}</span>
      <span className="shrink-0 text-white">
        {value.toLocaleString("en-IN")} <span className="text-white/35">· {pct}%</span>
      </span>
    </div>
  );
}

function Rate({ label, v }: { label: string; v: number }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-2 py-2 text-center">
      <p className="text-white">{(v * 100).toFixed(0)}%</p>
      <p className="mt-0.5 text-white/35">{label}</p>
    </div>
  );
}

export type { PartnerTab };
