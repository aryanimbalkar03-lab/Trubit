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
import { DarkMap, Marker } from "../components/DarkMap";

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
    const delay = step === 0 ? 8000 : step === 1 ? 12000 : 15000;
    const t = window.setTimeout(() => {
      setStep((s) => s + 1);
      setEta((e) => {
        if (step === 0) return Math.max(e - Math.round(e * 0.15), 0);
        if (step === 1) return Math.max(e - Math.round(e * 0.45), 0);
        return 0;
      });
    }, delay);
    return () => window.clearTimeout(t);
  }, [step, order.id, cancelled]);

  useEffect(() => {
    if (step >= 3 || cancelled || eta <= 0) return;
    const t = window.setTimeout(() => setEta((e) => Math.max(e - 1, 0)), 60000);
    return () => window.clearTimeout(t);
  }, [eta, step, cancelled]);

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
  // Use a central location (like Bangalore as default)
  const center = { lat: 12.9716, lng: 77.5946 };
  
  const restaurant = { lat: 12.965, lng: 77.585 };
  const user = { lat: 12.978, lng: 77.605 };
  
  // Sample path for the delivery route
  const route = [
    restaurant,
    { lat: 12.969, lng: 77.590 },
    { lat: 12.973, lng: 77.592 },
    { lat: 12.976, lng: 77.599 },
    user,
  ];
  
  // Rider position based on step (0 to 3)
  const riderPos = [
    route[0], 
    route[1], 
    route[3], 
    route[4]
  ][step] ?? route[4];

  const markers: Marker[] = [
    { id: "res", lat: restaurant.lat, lng: restaurant.lng, kind: "restaurant" },
    { id: "user", lat: user.lat, lng: user.lng, kind: "you" },
    { id: "rider", lat: riderPos.lat, lng: riderPos.lng, kind: "rider" },
  ];

  return (
    <div className="absolute inset-0 bg-[#0a0a0a]">
      <DarkMap 
        center={center} 
        route={route} 
        markers={markers} 
        zoomOut={1.2} 
        className="w-full h-full" 
      />
    </div>
  );
}
