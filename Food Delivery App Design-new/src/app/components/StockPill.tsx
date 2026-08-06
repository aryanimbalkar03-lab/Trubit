import { useState } from "react";
import { motion } from "motion/react";
import { Users, Clock, ShieldCheck } from "lucide-react";
import { Sheet } from "./Sheet";
import { Glass, cx } from "./glass";
import { usePlatform } from "../store/platform";
import type { Dish } from "../data/catalog";

/**
 * Live availability. This is the honest answer to "four portions left, five
 * hundred people tapping": we show the real number, the real number of people
 * looking at it, and we never let two people believe they hold the same unit.
 */
export function StockPill({ dish, className }: { dish: Dish; className?: string }) {
  const { availableOf, viewers, holdFor } = usePlatform();
  const [open, setOpen] = useState(false);
  const left = availableOf(dish);
  const watching = viewers[dish.id] ?? 0;
  const mine = holdFor(dish.id);

  const tone =
    left === 0 ? "border-white/20 text-white/45" : left <= 4 ? "border-white/60 text-white" : "border-white/15 text-white/55";

  return (
    <>
      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        whileTap={{ scale: 0.94 }}
        className={cx(
          "flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 backdrop-blur-xl",
          tone,
          className,
        )}
      >
        {left === 0 ? (
          <>Sold out today · join queue</>
        ) : (
          <>
            {left <= 4 && (
              <motion.span
                className="size-1.5 rounded-full bg-white"
                animate={{ opacity: [1, 0.25, 1] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              />
            )}
            {left} left
            {watching > 0 && (
              <span className="text-white/40">· {watching} looking</span>
            )}
          </>
        )}
      </motion.button>

      <Sheet open={open} onClose={() => setOpen(false)}>
        <div className="space-y-4 px-5 pt-2 pb-8">
          <div>
            <p className="tracking-[0.22em] text-white/40 uppercase">Live availability</p>
            <h2 className="mt-1 text-white">{dish.name}</h2>
          </div>

          <Glass className="divide-y divide-white/[0.06] p-0">
            <Row icon={ShieldCheck} label="Portions the kitchen can still cook" value={`${left}`} />
            <Row icon={Users} label="People viewing this right now" value={`${watching}`} />
            <Row
              icon={Clock}
              label="Your reservation"
              value={mine ? `${mine.qty} held for 8 min` : "None yet"}
            />
          </Glass>

          <Glass className="space-y-3 p-5">
            <p className="text-white">How we stop overselling</p>
            <Step n={1} text="Tapping Add does not decrement stock — it takes an 8-minute hold on that exact unit. Only a hold can become an order." />
            <Step n={2} text="Everyone else immediately sees the reduced count. If four portions exist, only four holds can ever exist at once." />
            <Step n={3} text="Abandon your cart and the hold expires, returning the portion to the pool. Nothing sits locked forever." />
            <Step n={4} text="Tap when nothing is free and you get a numbered place in the queue, not a fake confirmation. If a hold lapses, the front of the queue is offered it first." />
          </Glass>

          <p className="text-white/35">
            You will never be charged for something a kitchen cannot make. That is the whole point
            of showing you the number.
          </p>
        </div>
      </Sheet>
    </>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <Icon className="size-4 shrink-0 text-white/45" />
      <span className="min-w-0 flex-1 text-white/55">{label}</span>
      <span className="shrink-0 text-white">{value}</span>
    </div>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex gap-3">
      <span className="grid size-5 shrink-0 place-items-center rounded-full border border-white/20 text-[10px] text-white/70">
        {n}
      </span>
      <p className="text-white/50">{text}</p>
    </div>
  );
}
