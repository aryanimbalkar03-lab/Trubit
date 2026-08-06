import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  ChefHat,
  Bike,
  PackageCheck,
  Phone,
  MessageSquare,
  Receipt,
  X,
  Timer,
  Plus,
  HandCoins,
  Headphones,
} from "lucide-react";
import { Glass, GlassButton, Divider, cx } from "../components/glass";
import { rupees, useApp, type Order } from "../store/app-store";

const STEPS = [
  { id: 0, label: "Order confirmed", sub: "Restaurant accepted your order", icon: Check },
  { id: 1, label: "Preparing", sub: "The kitchen is on it", icon: ChefHat },
  { id: 2, label: "Out for delivery", sub: "Arjun is on the way", icon: Bike },
  { id: 3, label: "Delivered", sub: "Enjoy your meal", icon: PackageCheck },
];

/** Seconds you get to change your mind, no questions and no fee. */
const CANCEL_WINDOW = 60;

export function TrackScreen({
  order,
  onClose,
  onAddItems,
}: {
  order: Order;
  onClose: () => void;
  onAddItems: (restaurantId: string) => void;
}) {
  const { completeOrder, cancelOrder, orders } = useApp();
  // The route holds a snapshot; the store holds the truth.
  const live = orders.find((o) => o.id === order.id) ?? order;
  const [step, setStep] = useState(0);
  const [eta, setEta] = useState(order.promisedMins);
  const [cancelLeft, setCancelLeft] = useState(CANCEL_WINDOW);
  const [support, setSupport] = useState(false);
  const completeRef = useRef(completeOrder);
  completeRef.current = completeOrder;

  const cancelled = live.status === "cancelled";

  useEffect(() => {
    if (cancelled) return;
    if (step >= STEPS.length - 1) {
      completeRef.current(order.id);
      return;
    }
    const t = window.setTimeout(() => {
      setStep((s) => s + 1);
      setEta((e) => Math.max(e - 9, 0));
    }, 4000);
    return () => window.clearTimeout(t);
  }, [step, order.id, cancelled]);

  // The cancel window ticks down in real time and then simply closes.
  useEffect(() => {
    if (cancelLeft <= 0 || cancelled) return;
    const t = window.setTimeout(() => setCancelLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cancelLeft, cancelled]);

  const canCancel = cancelLeft > 0 && step < 2 && !cancelled;
  const canAddItems = step < 2 && !cancelled;

  if (cancelled) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-8 text-center">
        <div className="grid size-20 place-items-center rounded-full border border-white/12 bg-white/[0.04]">
          <X className="size-8 text-white/60" />
        </div>
        <h2 className="mt-6 text-white">Order cancelled</h2>
        <p className="mt-2 text-white/45">
          Fully refunded to your original payment method. Nothing was charged.
        </p>
        <GlassButton variant="solid" className="mt-7 px-8" onClick={onClose}>
          Back to Trubit
        </GlassButton>
      </div>
    );
  }

  return (
    <div className="pb-32">
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <div>
          <p className="tracking-[0.22em] text-white/45 uppercase">Order {order.id}</p>
          <h2 className="mt-1 text-white">{order.restaurantName}</h2>
        </div>
        <button
          onClick={onClose}
          className="grid size-10 place-items-center rounded-full border border-white/12 bg-white/[0.05] backdrop-blur-xl"
          aria-label="Close"
        >
          <X className="size-4 text-white" />
        </button>
      </div>

      <div className="space-y-5 px-5">
        {/* Change your mind — a real window, not a support ticket */}
        <AnimatePresence>
          {canCancel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 0.9, 0.25, 1] }}
            >
              <Glass className="flex items-center gap-4 p-4">
                <CountdownRing seconds={cancelLeft} total={CANCEL_WINDOW} />
                <div className="min-w-0 flex-1">
                  <p className="text-white">Changed your mind?</p>
                  <p className="text-white/40">
                    Cancel free for {cancelLeft}s — full refund, no reason needed
                  </p>
                </div>
                <GlassButton
                  variant="outline"
                  className="shrink-0 px-4 py-2"
                  onClick={() => cancelOrder(order.id)}
                >
                  Cancel
                </GlassButton>
              </Glass>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live map-ish panel */}
        <Glass className="relative h-56">
          <MapCanvas step={step} />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent p-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <p className="text-white">
                  {step >= 3 ? "Delivered" : `Arriving in ${eta} minutes`}
                </p>
                <p className="mt-0.5 text-white/50">{STEPS[step].sub}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </Glass>

        {/* The promise, tracked live */}
        <Glass sheen className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-white/45">
              <Timer className="size-4" />
              <span className="tracking-[0.22em] uppercase">On-time promise</span>
            </div>
            <span className="shrink-0 text-white/50">{order.promisedMins} min</span>
          </div>
          <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-white/[0.08]">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-white"
              animate={{ width: `${Math.min((step / (STEPS.length - 1)) * 100, 100)}%` }}
              transition={{ duration: 1, ease: [0.22, 0.9, 0.25, 1] }}
            />
          </div>
          <p className="mt-3 text-white/45">
            {step >= STEPS.length - 1
              ? `Delivered on time. Promise kept.`
              : `${eta} minutes left. Miss it and ${rupees(60)} is credited automatically.`}
          </p>
        </Glass>

        {/* Add to an order already placed — impossible on other apps */}
        {canAddItems && (
          <GlassButton className="w-full" onClick={() => onAddItems(order.restaurantId)}>
            <Plus className="size-4" /> Forgot something? Add to this order
          </GlassButton>
        )}

        {/* Rider */}
        <Glass sheen className="flex items-center gap-4 p-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-full border border-white/15 bg-white/[0.06] text-white">
            AR
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white">Arjun R.</p>
            <p className="text-white/40">Your delivery partner · 4.9 ★</p>
          </div>
          <button
            className="grid size-10 place-items-center rounded-full border border-white/15 bg-white/[0.06]"
            aria-label="Message rider"
          >
            <MessageSquare className="size-4 text-white" />
          </button>
          <button
            className="grid size-10 place-items-center rounded-full bg-white text-black"
            aria-label="Call rider"
          >
            <Phone className="size-4" />
          </button>
        </Glass>

        {/* Timeline */}
        <Glass className="p-5">
          <div className="relative">
            <div className="absolute top-2 bottom-2 left-[1.15rem] w-px bg-white/12" />
            <motion.div
              className="absolute top-2 left-[1.15rem] w-px bg-white"
              animate={{ height: `${(step / (STEPS.length - 1)) * 100}%` }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              style={{ maxHeight: "calc(100% - 1rem)" }}
            />
            <div className="space-y-7">
              {STEPS.map((s) => {
                const done = s.id <= step;
                const Icon = s.icon;
                return (
                  <div key={s.id} className="relative flex items-center gap-4">
                    <motion.div
                      animate={{ scale: s.id === step ? [1, 1.12, 1] : 1 }}
                      transition={{ duration: 1.6, repeat: s.id === step ? Infinity : 0 }}
                      className={cx(
                        "z-10 grid size-9 shrink-0 place-items-center rounded-full border transition-colors",
                        done ? "border-white bg-white text-black" : "border-white/20 bg-black text-white/40",
                      )}
                    >
                      <Icon className="size-4" />
                    </motion.div>
                    <div>
                      <p className={done ? "text-white" : "text-white/40"}>{s.label}</p>
                      <p className="text-white/35">{s.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Glass>

        {/* Bill summary */}
        <Glass className="p-5">
          <div className="flex items-center gap-2 text-white/45">
            <Receipt className="size-4" />
            <span className="tracking-[0.22em] uppercase">Order summary</span>
          </div>
          <div className="mt-4 space-y-2">
            {order.lines.map((l) => (
              <div key={l.dish.id} className="flex items-center justify-between text-white/60">
                <span className="truncate pr-3">
                  {l.qty} × {l.dish.name}
                </span>
                <span className="shrink-0">{rupees(l.dish.price * l.qty)}</span>
              </div>
            ))}
            <Divider className="my-3" />
            <div className="flex items-center justify-between text-white">
              <span>Paid</span>
              <span>{rupees(order.total)}</span>
            </div>
          </div>
        </Glass>

        {/* Fair pay, shown not claimed */}
        <Glass className="flex items-start gap-3 p-5">
          <HandCoins className="mt-0.5 size-4 shrink-0 text-white" />
          <div className="min-w-0">
            <p className="text-white">Arjun earns {rupees(Math.max(Math.round(order.total * 0.14), 45))} on this trip</p>
            <p className="mt-1 text-white/40">
              Paid per delivery with a floor, plus full rain and distance pay. No ratings-based
              penalties.
            </p>
          </div>
        </Glass>

        {/* Support that is a person */}
        <Glass className="p-5">
          <div className="flex items-center gap-2 text-white/45">
            <Headphones className="size-4" />
            <span className="tracking-[0.22em] uppercase">Support</span>
          </div>
          <p className="mt-3 text-white">A human answers in under 60 seconds.</p>
          <p className="mt-1 text-white/40">
            No chatbot loop. Missing or wrong item gets refunded on the spot.
          </p>
          <AnimatePresence mode="wait">
            {support ? (
              <motion.div
                key="connected"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.06] p-3"
              >
                <span className="relative grid size-9 shrink-0 place-items-center rounded-full bg-white text-black">
                  MP
                  <motion.span
                    className="absolute inset-0 rounded-full border border-white"
                    animate={{ scale: [1, 1.5], opacity: [0.7, 0] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                  />
                </span>
                <div className="min-w-0">
                  <p className="text-white">Meera P. connected</p>
                  <p className="text-white/40">Bengaluru support · answered in 11s</p>
                </div>
              </motion.div>
            ) : (
              <GlassButton key="cta" className="mt-4 w-full" onClick={() => setSupport(true)}>
                Talk to a person
              </GlassButton>
            )}
          </AnimatePresence>
        </Glass>

        <GlassButton className="w-full" onClick={onClose}>
          Back to Trubit
        </GlassButton>
      </div>
    </div>
  );
}

function CountdownRing({ seconds, total }: { seconds: number; total: number }) {
  const r = 18;
  const circumference = 2 * Math.PI * r;
  return (
    <div className="relative size-12 shrink-0">
      <svg viewBox="0 0 44 44" className="size-full -rotate-90">
        <circle cx="22" cy="22" r={r} stroke="rgba(255,255,255,0.12)" strokeWidth="3" fill="none" />
        <motion.circle
          cx="22"
          cy="22"
          r={r}
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: circumference * (1 - seconds / total) }}
          transition={{ duration: 0.9, ease: "linear" }}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-white">{seconds}</span>
    </div>
  );
}

function MapCanvas({ step }: { step: number }) {
  const progress = [0.05, 0.25, 0.62, 1][step] ?? 1;
  // Sampled points along the delivery route for each stage.
  const rider = [
    { x: 44, y: 199 },
    { x: 112, y: 178 },
    { x: 236, y: 105 },
    { x: 360, y: 50 },
  ][step] ?? { x: 360, y: 50 };
  return (
    <div className="absolute inset-0 bg-[#0a0a0a]">
      {/* grid streets */}
      <svg className="absolute inset-0 size-full" viewBox="0 0 400 240" preserveAspectRatio="none">
        {Array.from({ length: 9 }).map((_, i) => (
          <line
            key={`h${i}`}
            x1="0"
            y1={i * 30}
            x2="400"
            y2={i * 30}
            stroke="white"
            strokeOpacity="0.06"
          />
        ))}
        {Array.from({ length: 14 }).map((_, i) => (
          <line
            key={`v${i}`}
            x1={i * 30}
            y1="0"
            x2={i * 30}
            y2="240"
            stroke="white"
            strokeOpacity="0.06"
          />
        ))}
        <path
          d="M40 200 C 120 200, 130 120, 200 120 S 300 60, 360 50"
          fill="none"
          stroke="white"
          strokeOpacity="0.18"
          strokeWidth="2"
          strokeDasharray="6 6"
        />
        <motion.path
          d="M40 200 C 120 200, 130 120, 200 120 S 300 60, 360 50"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: progress }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
        />
        <circle cx="40" cy="200" r="5" fill="white" fillOpacity="0.55" />
        <circle cx="360" cy="50" r="5" fill="white" />
        <motion.g
          animate={{ x: rider.x, y: rider.y }}
          transition={{ duration: 1.4, ease: "easeInOut" }}
        >
          <motion.circle
            r="12"
            fill="white"
            fillOpacity="0.18"
            animate={{ r: [10, 18, 10], fillOpacity: [0.22, 0, 0.22] }}
            transition={{ duration: 1.9, repeat: Infinity }}
          />
          <circle r="6" fill="white" />
        </motion.g>
      </svg>
    </div>
  );
}
