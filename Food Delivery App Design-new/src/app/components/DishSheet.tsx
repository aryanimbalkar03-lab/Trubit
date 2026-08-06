import { motion } from "motion/react";
import type { ReactNode } from "react";
import { Flame, Leaf, Camera, ShieldAlert, Sprout, Timer, Scale } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Sheet } from "./Sheet";
import { Glass, PriceTag, VegDot, Divider, cx } from "./glass";
import { Stepper } from "./pieces";
import { dishDetail } from "../data/details";
import { listedElsewhere, rupees, savingsOn } from "../store/app-store";
import type { Dish } from "../data/catalog";

export function DishSheet({
  dish,
  restaurantId,
  onClose,
}: {
  dish: Dish | null;
  restaurantId: string;
  onClose: () => void;
}) {
  return (
    <Sheet open={Boolean(dish)} onClose={onClose}>
      {dish && <DishBody dish={dish} restaurantId={restaurantId} />}
    </Sheet>
  );
}

function DishBody({ dish, restaurantId }: { dish: Dish; restaurantId: string }) {
  const d = dishDetail(dish);
  const macros = [
    { label: "Protein", value: d.protein },
    { label: "Carbs", value: d.carbs },
    { label: "Fat", value: d.fat },
  ];
  const macroTotal = macros.reduce((s, m) => s + m.value, 0);

  return (
    <div className="pb-8">
      <div className="relative mx-5 mt-2 h-52 overflow-hidden rounded-3xl border border-white/10">
        <ImageWithFallback src={dish.image} alt={dish.name} className="size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <span className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full border border-white/20 bg-black/55 px-3 py-1 text-white backdrop-blur-xl">
          <Camera className="size-3.5" />
          {d.accuracy}% said it matched this photo
        </span>
      </div>

      <div className="px-5">
        <div className="mt-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <VegDot veg={dish.veg} />
              <span className="tracking-[0.2em] text-white/40 uppercase">
                {dish.veg ? "Vegetarian" : "Contains meat"}
              </span>
            </div>
            <h2 className="mt-2 text-white">{dish.name}</h2>
            <p className="mt-1 text-white/45">{dish.desc}</p>
          </div>
          <div className="shrink-0 text-right">
            <PriceTag
              className="justify-end"
              price={rupees(dish.price)}
              elsewhere={rupees(listedElsewhere(dish.price))}
            />
            <p className="mt-1 text-white/35">save {rupees(savingsOn(dish.price))}</p>
          </div>
        </div>

        {/* Portion facts — no more guessing what you get */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          <Fact icon={<Scale className="size-4" />} value={`${d.grams}g`} label={`Serves ${d.serves}`} />
          <Fact icon={<Flame className="size-4" />} value={`${d.kcal}`} label="kcal" />
          <Fact icon={<Timer className="size-4" />} value={`${d.prepMins}m`} label="Cook time" />
        </div>

        {/* Macros */}
        <Glass className="mt-4 p-5">
          <p className="tracking-[0.22em] text-white/45 uppercase">Nutrition</p>
          <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-white/[0.07]">
            {macros.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ width: 0 }}
                animate={{ width: `${(m.value / macroTotal) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.1 + i * 0.12, ease: [0.22, 0.9, 0.25, 1] }}
                className={cx(
                  "h-full",
                  i === 0 ? "bg-white" : i === 1 ? "bg-white/55" : "bg-white/25",
                )}
              />
            ))}
          </div>
          <div className="mt-3 flex justify-between">
            {macros.map((m) => (
              <span key={m.label} className="text-white/50">
                {m.label} {m.value}g
              </span>
            ))}
          </div>
        </Glass>

        {/* Allergens — legally required in the EU, absent on Indian apps */}
        <Glass className="mt-4 p-5">
          <div className="flex items-center gap-2 text-white/45">
            <ShieldAlert className="size-4" />
            <span className="tracking-[0.22em] uppercase">Allergens</span>
          </div>
          {d.allergens.length === 0 ? (
            <p className="mt-3 text-white">No common allergens declared by the kitchen.</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {d.allergens.map((a) => (
                <span
                  key={a}
                  className="rounded-full border border-white/25 px-3 py-1 text-white/80"
                >
                  {a}
                </span>
              ))}
            </div>
          )}
          <Divider className="my-4" />
          <div className="flex items-center gap-2">
            <span className="tracking-[0.22em] text-white/45 uppercase">Heat</span>
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <Flame
                  key={i}
                  className={cx("size-4", i < d.spice ? "fill-white text-white" : "text-white/20")}
                />
              ))}
              {d.spice === 0 && <span className="text-white/50">Not spicy</span>}
            </div>
          </div>
        </Glass>

        {/* Sourcing */}
        <Glass className="mt-4 flex items-start gap-3 p-5">
          <Sprout className="mt-0.5 size-4 shrink-0 text-white" />
          <div>
            <p className="text-white">Where it comes from</p>
            <p className="mt-1 text-white/45">{d.sourcing}</p>
          </div>
        </Glass>

        {/* Real diner photos, not studio shots */}
        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2 text-white/45">
            <Camera className="size-4" />
            <span className="tracking-[0.22em] uppercase">
              {d.photoCount} photos from real orders
            </span>
          </div>
          <div className="scrollbar-none -mx-5 flex gap-3 overflow-x-auto px-5">
            {d.realPhotos.map((p, i) => (
              <motion.div
                key={`${p}-${i}`}
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.06 }}
                className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-white/10"
              >
                <ImageWithFallback
                  src={p}
                  alt={`Diner photo ${i + 1} of ${dish.name}`}
                  className="size-full object-cover"
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Sustainability */}
        <div className="mt-6 flex items-center gap-2 text-white/35">
          <Leaf className="size-4 shrink-0" />
          <p>Packed in compostable packaging. Cutlery only if you ask for it.</p>
        </div>

        <div className="mt-7 flex items-center gap-4">
          <div className="flex-1">
            <p className="text-white">{rupees(dish.price)}</p>
            <p className="text-white/40">All taxes included</p>
          </div>
          <Stepper dish={dish} restaurantId={restaurantId} />
        </div>
      </div>
    </div>
  );
}

function Fact({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: string;
  label: string;
}) {
  return (
    <Glass className="p-4 text-center">
      <span className="mx-auto flex w-fit text-white/70">{icon}</span>
      <p className="mt-2 text-white">{value}</p>
      <p className="text-white/40">{label}</p>
    </Glass>
  );
}
