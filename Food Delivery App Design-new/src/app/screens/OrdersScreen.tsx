import { motion } from "motion/react";
import { RotateCcw, ChevronRight, CircleDot, Timer } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Glass, GlassButton, Divider } from "../components/glass";
import { rupees, savingsOn, useApp, type Order } from "../store/app-store";

const when = (ts: number) => {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.round(hrs / 24)} days ago`;
};

export function OrdersScreen({
  onTrack,
  onOpenRestaurant,
}: {
  onTrack: (order: Order) => void;
  onOpenRestaurant: (id: string) => void;
}) {
  const { orders } = useApp();

  const totalSaved = orders.reduce(
    (sum, o) => sum + o.lines.reduce((s, l) => s + savingsOn(l.dish.price) * l.qty, 0),
    0,
  );
  const totalCredited = orders.reduce((s, o) => s + (o.lateCredit ?? 0), 0);
  const finished = orders.filter((o) => o.status === "delivered");
  const onTimeRate = finished.length
    ? Math.round((finished.filter((o) => !o.lateCredit).length / finished.length) * 100)
    : 100;

  return (
    <div className="pb-40">
      <div className="px-5 pt-8 pb-5">
        <p className="tracking-[0.22em] text-white/45 uppercase">History</p>
        <h1 className="mt-1 text-white">Your orders</h1>
      </div>

      <div className="mb-6 px-5">
        <Glass sheen className="flex items-stretch divide-x divide-white/[0.08] p-0">
          <Tally value={rupees(totalSaved)} label="Saved vs other apps" />
          <Tally value={rupees(totalCredited)} label="Auto-credited to you" />
          <Tally value={`${onTimeRate}%`} label="Delivered on time" />
        </Glass>
      </div>

      <div className="space-y-5 px-5">
        {orders.map((order, i) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <Glass sheen className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-white">{order.restaurantName}</p>
                  <p className="mt-0.5 text-white/40">
                    {order.id} · {when(order.placedAt)}
                  </p>
                </div>
                {order.status === "live" ? (
                  <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-3 py-1 text-black">
                    <CircleDot className="size-3" />
                    Live
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full border border-white/20 px-3 py-1 text-white/60 capitalize">
                    {order.status}
                  </span>
                )}
              </div>

              <Divider className="my-4" />

              <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                  {order.lines.slice(0, 3).map((l) => (
                    <div
                      key={l.dish.id}
                      className="size-11 overflow-hidden rounded-full border-2 border-black"
                    >
                      <ImageWithFallback
                        src={l.dish.image}
                        alt={l.dish.name}
                        className="size-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <p className="min-w-0 flex-1 truncate text-white/55">
                  {order.lines.map((l) => `${l.qty} × ${l.dish.name}`).join(", ")}
                </p>
                <span className="shrink-0 text-white">{rupees(order.total)}</span>
              </div>

              {order.lateCredit && (
                <div className="mt-4 flex items-center gap-2 rounded-2xl border border-dashed border-white/20 px-4 py-3 text-white/70">
                  <Timer className="size-4 shrink-0" />
                  <span>
                    We were late. {rupees(order.lateCredit)} was credited back automatically.
                  </span>
                </div>
              )}

              <div className="mt-5 flex gap-3">
                {order.status === "live" ? (
                  <GlassButton variant="solid" className="flex-1" onClick={() => onTrack(order)}>
                    Track order <ChevronRight className="size-4" />
                  </GlassButton>
                ) : (
                  <GlassButton
                    className="flex-1"
                    onClick={() => onOpenRestaurant(order.restaurantId)}
                  >
                    <RotateCcw className="size-4" /> Reorder
                  </GlassButton>
                )}
                <GlassButton variant="outline" className="px-5">
                  Help
                </GlassButton>
              </div>
            </Glass>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function Tally({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1 px-3 py-4 text-center">
      <p className="text-white">{value}</p>
      <p className="mt-1 text-white/40">{label}</p>
    </div>
  );
}
