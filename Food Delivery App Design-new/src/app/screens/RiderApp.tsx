import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bike,
  Power,
  IndianRupee,
  MapPin,
  Package,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Umbrella,
  ChevronRight,
  Star,
  Wallet,
  X,
} from "lucide-react";
import { Glass, GlassButton, Divider, Sheen, cx } from "../components/glass";
import { DarkMap, type Marker } from "../components/DarkMap";
import { Field } from "../components/Field";
import { TrubitMark } from "../components/Logo";
import { CITY, RESTAURANTS } from "../data/catalog";
import { rupees } from "../store/app-store";
import { jobPay, usePlatform, type RiderJob } from "../store/platform";
import { RiderProfileSchema, safeParse } from "../lib/validation";

type RiderTab = "shift" | "job" | "earnings" | "profile";

/* ------------------------------------------------------------------ *
 * Rider onboarding — four fields, no document limbo.
 * ------------------------------------------------------------------ */
function RiderOnboarding() {
  const { onboardRider } = usePlatform();
  const [name, setName] = useState("");
  const [vehicle, setVehicle] = useState<"cycle" | "scooter" | "bike">("scooter");
  const [city, setCity] = useState("Bengaluru");
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleOnboard = () => {
    const res = safeParse(RiderProfileSchema, { name: name.trim(), vehicle, city });
    if (!res.success) {
      setErrors(res.errors);
      return;
    }
    setErrors({});
    if (agreed) onboardRider(res.data);
  };

  return (
    <div className="space-y-6 px-5 pt-10 pb-32">
      <div>
        <TrubitMark flying className="h-14 text-white" />
        <h1 className="mt-5 text-white">Ride with Trubit</h1>
        <p className="mt-2 text-white/45">
          Four fields. No deposit, no joining fee, no one holding your documents.
        </p>
      </div>

      <Glass className="space-y-4 p-5">
        <div>
          <Field label="Your name" value={name} onChange={setName} placeholder="As on your ID" />
          {errors.name && <p className="mt-1 text-[11px] text-red-400">{errors.name}</p>}
        </div>
        <div>
          <p className="mb-2 text-white/50">What do you ride?</p>
          <div className="grid grid-cols-3 gap-2">
            {(["cycle", "scooter", "bike"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setVehicle(v)}
                className={cx(
                  "rounded-xl border py-2.5 capitalize transition-colors duration-300",
                  vehicle === v
                    ? "border-white bg-white text-black"
                    : "border-white/12 bg-white/[0.05] text-white/60",
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Field label="City" value={city} onChange={setCity} placeholder="City" />
          {errors.city && <p className="mt-1 text-[11px] text-red-400">{errors.city}</p>}
        </div>
      </Glass>

      <Glass className="space-y-3 p-5">
        <p className="text-white">What you're agreeing to — in full</p>
        {[
          "₹35 base per trip, plus ₹9 per kilometre, measured door to door.",
          "100% of every tip. Trubit never touches a tip, ever.",
          "Rain, heat and night allowances are automatic, not requested.",
          "You can go offline mid-shift with no penalty and no rating hit.",
          "Rejecting an order does not lower your score. There is no score for that.",
        ].map((t) => (
          <div key={t} className="flex gap-2.5">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-white/60" />
            <p className="text-white/50">{t}</p>
          </div>
        ))}
        <button
          onClick={() => setAgreed(!agreed)}
          className="mt-2 flex items-center gap-3 text-white/60"
        >
          <span
            className={cx(
              "grid size-5 place-items-center rounded-md border",
              agreed ? "border-white bg-white text-black" : "border-white/25",
            )}
          >
            {agreed && <CheckCircle2 className="size-3.5" />}
          </span>
          I've read all five and I agree
        </button>
      </Glass>

      <GlassButton
        variant="solid"
        className="w-full py-4"
        disabled={!name.trim() || !agreed}
        onClick={handleOnboard}
      >
        Start riding <ChevronRight className="size-4" />
      </GlassButton>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Offer card — 20 seconds, full pay breakdown before you decide.
 * ------------------------------------------------------------------ */
function OfferCard({ job }: { job: RiderJob }) {
  const { acceptJob, declineJob } = usePlatform();
  const [left, setLeft] = useState(20);

  useEffect(() => {
    const t = window.setInterval(() => setLeft((n) => n - 1), 1000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (left <= 0) declineJob(job.id);
  }, [left, job.id, declineJob]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
    >
      <Glass sheen className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-white">{job.restaurantName}</p>
            <p className="mt-0.5 truncate text-white/40">{job.dropAddress}</p>
          </div>
          <div className="relative grid size-11 shrink-0 place-items-center">
            <svg viewBox="0 0 44 44" className="absolute inset-0 -rotate-90">
              <circle cx="22" cy="22" r="19" stroke="rgba(255,255,255,0.12)" strokeWidth="3" fill="none" />
              <motion.circle
                cx="22"
                cy="22"
                r="19"
                stroke="#fff"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={119}
                animate={{ strokeDashoffset: 119 * (1 - left / 20) }}
                transition={{ duration: 1, ease: "linear" }}
              />
            </svg>
            <span className="text-white">{Math.max(left, 0)}</span>
          </div>
        </div>

        <Divider className="my-4" />

        <div className="grid grid-cols-3 gap-2">
          <Stat label="Distance" value={`${job.distanceKm} km`} />
          <Stat label="Items" value={`${job.items}`} />
          <Stat label="You earn" value={rupees(jobPay(job))} />
        </div>

        <div className="mt-4 space-y-1.5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
          <PayRow label="Base" value={job.basePay} />
          <PayRow label={`Distance · ${job.distanceKm} km × ₹9`} value={job.distancePay} />
          {job.surgePay > 0 && <PayRow label="Demand surge" value={job.surgePay} />}
          {job.tip > 0 && <PayRow label="Tip (100% yours)" value={job.tip} />}
          <Divider className="my-2" />
          <PayRow label="Total" value={jobPay(job)} bold />
        </div>

        <div className="mt-4 flex gap-3">
          <GlassButton variant="outline" className="px-5" onClick={() => declineJob(job.id)}>
            <X className="size-4" /> Pass
          </GlassButton>
          <GlassButton variant="solid" className="flex-1" onClick={() => acceptJob(job.id)}>
            Accept · {rupees(jobPay(job))}
          </GlassButton>
        </div>
      </Glass>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ *
 * Active job — pickup → picked → delivering → done, on the dark map.
 * ------------------------------------------------------------------ */
const STAGES: { key: RiderJob["stage"]; label: string; cta: string }[] = [
  { key: "pickup", label: "Head to the kitchen", cta: "I've arrived" },
  { key: "picked", label: "Collect the order", cta: "Order collected" },
  { key: "delivering", label: "Ride to the customer", cta: "Delivered" },
];

function ActiveJob({ job }: { job: RiderJob }) {
  const { advanceJob } = usePlatform();
  const restaurant = RESTAURANTS.find((r) => r.id === job.restaurantId) ?? RESTAURANTS[0];
  const idx = STAGES.findIndex((s) => s.key === job.stage);
  const stage = STAGES[Math.max(idx, 0)];

  const drop = { lat: CITY.lat - 0.012, lng: CITY.lng + 0.008 };
  const rider =
    job.stage === "delivering"
      ? { lat: (restaurant.lat + drop.lat) / 2, lng: (restaurant.lng + drop.lng) / 2 }
      : restaurant;

  const markers: Marker[] = [
    { ...restaurant, id: "r", kind: "restaurant", label: restaurant.name },
    { id: "d", ...drop, kind: "pin", label: "Drop" },
    { id: "me", ...rider, kind: "rider" },
  ];

  return (
    <div className="space-y-5 pb-40">
      <DarkMap
        markers={markers}
        route={[restaurant, drop]}
        className="h-72 w-full"
        center={{ lat: (restaurant.lat + drop.lat) / 2, lng: (restaurant.lng + drop.lng) / 2 }}
      />

      <div className="space-y-5 px-5">
        <Glass sheen className="p-5">
          <p className="tracking-[0.22em] text-white/40 uppercase">Step {idx + 1} of 3</p>
          <h2 className="mt-1 text-white">{stage.label}</h2>

          <div className="mt-4 flex gap-1.5">
            {STAGES.map((s, i) => (
              <motion.span
                key={s.key}
                className="h-1 flex-1 rounded-full bg-white/15"
                animate={{ backgroundColor: i <= idx ? "#fff" : "rgba(255,255,255,0.15)" }}
              />
            ))}
          </div>

          <Divider className="my-4" />

          <Line icon={Package} label={restaurant.name} sub={`${job.items} items · ${job.id}`} />
          <Line icon={MapPin} label={job.dropAddress} sub={`${job.distanceKm} km away`} />

          <GlassButton
            variant="solid"
            className="mt-5 w-full py-4"
            onClick={() => advanceJob(job.id)}
          >
            {stage.cta}
          </GlassButton>
        </Glass>

        <Glass className="p-5">
          <p className="text-white">This trip pays {rupees(jobPay(job))}</p>
          <div className="mt-3 space-y-1.5">
            <PayRow label="Base" value={job.basePay} />
            <PayRow label="Distance" value={job.distancePay} />
            {job.surgePay > 0 && <PayRow label="Surge" value={job.surgePay} />}
            {job.tip > 0 && <PayRow label="Tip" value={job.tip} />}
          </div>
          <p className="mt-3 text-white/35">
            Paid to your account the moment you mark it delivered. No weekly hold.
          </p>
        </Glass>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Shift screen
 * ------------------------------------------------------------------ */
function ShiftScreen() {
  const { riderOnline, setOnline, shiftStartedAt, offers, todayEarnings, rider } = usePlatform();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!shiftStartedAt) return setElapsed(0);
    const t = window.setInterval(
      () => setElapsed(Math.floor((Date.now() - shiftStartedAt) / 1000)),
      1000,
    );
    return () => window.clearInterval(t);
  }, [shiftStartedAt]);

  const hh = String(Math.floor(elapsed / 3600)).padStart(2, "0");
  const mm = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  const markers: Marker[] = [
    ...RESTAURANTS.map<Marker>((r) => ({
      id: r.id,
      lat: r.lat,
      lng: r.lng,
      kind: "restaurant",
    })),
    { id: "me", ...CITY, kind: "you" },
    { id: "surge-1", lat: CITY.lat + 0.005, lng: CITY.lng - 0.008, kind: "surge", label: "2.0x" },
    { id: "surge-2", lat: CITY.lat - 0.012, lng: CITY.lng + 0.015, kind: "surge", label: "1.5x" },
  ];

  return (
    <div className="pb-40">
      <div className="px-5 pt-8 pb-5">
        <p className="tracking-[0.22em] text-white/45 uppercase">Rider</p>
        <h1 className="mt-1 text-white">Hey, {rider.name.split(" ")[0] || "rider"}</h1>
      </div>

      <div className="px-5">
        <Glass sheen className="p-5">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => setOnline(!riderOnline)}
              whileTap={{ scale: 0.94 }}
              className={cx(
                "relative grid size-16 shrink-0 place-items-center rounded-full border transition-colors duration-500",
                riderOnline ? "border-white bg-white text-black" : "border-white/20 text-white/60",
              )}
            >
              {riderOnline && (
                <motion.span
                  className="absolute inset-0 rounded-full bg-white/25"
                  animate={{ scale: [1, 1.6], opacity: [0.5, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                />
              )}
              <Power className="relative size-6" />
            </motion.button>
            <div className="min-w-0 flex-1">
              <p className="text-white">{riderOnline ? "You're online" : "You're offline"}</p>
              <p className="mt-0.5 text-white/45">
                {riderOnline
                  ? `Shift running · ${hh}:${mm}:${ss}`
                  : "Tap to start taking orders. Stop any time."}
              </p>
            </div>
          </div>
        </Glass>
      </div>

      <div className="mt-4 px-5">
        <Glass className="flex items-stretch divide-x divide-white/[0.08] p-0">
          <Stat label="Today" value={rupees(todayEarnings)} pad />
          <Stat label="Rating" value={`${rider.rating}`} pad />
          <Stat label="Trips" value={`${rider.totalTrips}`} pad />
        </Glass>
      </div>

      <div className="mt-6 space-y-3 px-5">
        <Glass sheen className="p-4 flex items-center justify-between border border-orange-500/20">
          <div>
            <p className="text-white text-sm font-medium flex items-center gap-2">
              <span className="size-2 rounded-full bg-orange-500 animate-pulse" />
              Surge Zone Nearby
            </p>
            <p className="text-white/50 text-xs mt-0.5">Move to Koramangala for 2x surge pricing.</p>
          </div>
          <div className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-xs font-bold border border-orange-500/30">
            2.0x
          </div>
        </Glass>
      </div>

      <div className="mt-4">
        <DarkMap markers={markers} className="h-56 w-full" zoomOut={1.2} />
      </div>

      <div className="mt-6 space-y-4 px-5">
        <p className="tracking-[0.22em] text-white/40 uppercase">
          {riderOnline ? `${offers.length} live offers` : "Go online to see offers"}
        </p>
        <AnimatePresence mode="popLayout">
          {offers.map((j) => (
            <OfferCard key={j.id} job={j} />
          ))}
        </AnimatePresence>
        {riderOnline && offers.length === 0 && (
          <Glass className="p-8 text-center">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <TrubitMark flying className="mx-auto h-10 text-white/50" />
            </motion.div>
            <p className="mt-4 text-white">Watching for orders near you</p>
            <p className="mt-1 text-white/40">You'll see the full pay before you accept.</p>
          </Glass>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Earnings
 * ------------------------------------------------------------------ */
function EarningsScreen() {
  const { riderLedger, todayEarnings } = usePlatform();
  const week = riderLedger.reduce((s, l) => s + l.amount, 0);
  const avgTrip = 85;
  const tipsPct = 12;

  const bars = useMemo(() => [720, 1180, 940, 1420, 1610, 1290, todayEarnings], [todayEarnings]);
  const peak = Math.max(...bars, 1);

  return (
    <div className="pb-40">
      <div className="px-5 pt-8 pb-5">
        <p className="tracking-[0.22em] text-white/45 uppercase">Earnings</p>
        <h1 className="mt-1 text-white">{rupees(week)}</h1>
        <p className="mt-1 text-white/45">This week, before nothing. There are no deductions.</p>
      </div>

      <div className="px-5">
        <Glass sheen className="p-5">
          <div className="flex h-32 items-end gap-2">
            {bars.map((b, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                animate={{ height: `${(b / peak) * 100}%` }}
                transition={{ delay: i * 0.06, type: "spring", stiffness: 200, damping: 22 }}
                className={cx(
                  "flex-1 rounded-t-lg",
                  i === bars.length - 1 ? "bg-white" : "bg-white/20",
                )}
              />
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
              <span key={i} className="flex-1 text-center text-white/30">
                {d}
              </span>
            ))}
          </div>
        </Glass>
      </div>

      <div className="mt-4 px-5">
        <Glass className="flex items-stretch divide-x divide-white/[0.08] p-0">
          <Stat label="Avg/Trip" value={rupees(avgTrip)} pad />
          <Stat label="Tips" value={`${tipsPct}%`} pad />
          <Stat label="Payout" value="Instant" pad />
        </Glass>
      </div>

      <div className="mt-6 px-5">
        <Glass sheen className="p-5">
          <p className="text-white/50 mb-1 text-sm">Monthly Summary</p>
          <div className="flex justify-between items-end">
            <h2 className="text-2xl text-white">{rupees(18450)}</h2>
            <span className="text-green-400 text-sm flex items-center">↑ 14% vs last month</span>
          </div>
          <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-sm">
            <span className="text-white/60">Rating Breakdown</span>
            <span className="text-white flex gap-2">
              <span>5★: 142</span> <span>4★: 12</span> <span>&lt;3★: 1</span>
            </span>
          </div>
        </Glass>
      </div>

      <div className="mt-4 px-5">
        <Glass className="p-5 border-blue-500/30 bg-blue-500/[0.02]">
          <div className="flex justify-between mb-2">
            <p className="text-white font-medium">Weekend Quest</p>
            <span className="text-blue-400 font-bold">{rupees(100)} bonus</span>
          </div>
          <p className="text-white/60 text-sm mb-3">Complete 5 more trips before midnight.</p>
          <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 w-[60%]" />
          </div>
          <p className="text-right text-white/40 text-xs mt-2">15 / 20 trips</p>
        </Glass>
      </div>

      <div className="mt-6 space-y-3 px-5">
        <p className="tracking-[0.22em] text-white/40 uppercase">Every credit, itemised</p>
        {riderLedger.map((l) => (
          <Glass key={l.id} className="flex items-center gap-3 p-4">
            <IndianRupee className="size-4 shrink-0 text-white/40" />
            <span className="min-w-0 flex-1 truncate text-white/60">{l.label}</span>
            <span className="shrink-0 text-white">{rupees(l.amount)}</span>
          </Glass>
        ))}
      </div>

      <div className="mt-6 px-5">
        <Glass className="space-y-3 p-5">
          <p className="text-white">Guarantees, not gestures</p>
          <Line icon={Umbrella} label="Wet weather" sub="+₹30 per trip, applied automatically" />
          <Line icon={Clock} label="Waiting at the kitchen" sub="+₹2 per minute after 5 minutes" />
          <Line icon={ShieldCheck} label="Accident cover" sub="Active whenever you are online" />
          <Line icon={Wallet} label="Minimum floor" sub="₹120/hour on shift, topped up if trips fall short" />
        </Glass>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function RiderApp({ tab }: { tab: RiderTab }) {
  const { rider, activeJob } = usePlatform();

  if (!rider.onboarded) return <RiderOnboarding />;
  if (tab === "job")
    return activeJob ? (
      <ActiveJob job={activeJob} />
    ) : (
      <div className="grid min-h-[70vh] place-items-center px-8 text-center">
        <div>
          <Bike className="mx-auto size-8 text-white/30" />
          <p className="mt-4 text-white">No active trip</p>
          <p className="mt-1 text-white/40">Accept an offer from your shift screen.</p>
        </div>
      </div>
    );
  if (tab === "earnings") return <EarningsScreen />;
  if (tab === "profile") return <RiderProfileScreen />;
  return <ShiftScreen />;
}

function RiderProfileScreen() {
  const { rider, todayEarnings, setRole } = usePlatform();
  return (
    <div className="space-y-5 px-5 pt-8 pb-40">
      <div>
        <p className="tracking-[0.22em] text-white/45 uppercase">Rider profile</p>
        <h1 className="mt-1 text-white">{rider.name}</h1>
      </div>
      <Glass sheen className="flex items-stretch divide-x divide-white/[0.08] p-0">
        <Stat label="Rating" value={`${rider.rating}`} pad />
        <Stat label="Trips" value={`${rider.totalTrips}`} pad />
        <Stat label="Today" value={rupees(todayEarnings)} pad />
      </Glass>
      <div className="space-y-2">
        <p className="tracking-[0.22em] text-white/40 uppercase text-xs">Performance Metrics</p>
        <Glass className="p-5 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-white/60">Average delivery time</span>
            <span className="text-white">22 mins</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/60">On-time delivery</span>
            <span className="text-green-400">98%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/60">Customer rating</span>
            <span className="text-white flex items-center gap-1">4.9 <Star className="size-3 text-orange-400 fill-orange-400" /> <span className="text-green-400 text-xs ml-1">↑</span></span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-white/60">Acceptance rate</span>
            <div className="text-right">
              <span className="text-orange-400 block">62%</span>
              <span className="text-[10px] text-orange-400/70">Warning: low</span>
            </div>
          </div>
          <div className="pt-2 border-t border-white/10">
            <p className="text-white/50 text-sm">💡 Peak hours insight</p>
            <p className="text-white mt-1 text-sm">You earn 40% more during 7-9 PM.</p>
          </div>
        </Glass>
      </div>

      <Glass className="p-5">
        <Line icon={Bike} label="Vehicle" sub={rider.vehicle} />
        <Line icon={MapPin} label="City" sub={rider.city} />
        <Line
          icon={ShieldCheck}
          label="Verification"
          sub={rider.verified ? "Verified rider" : "Pending"}
        />
      </Glass>

      <GlassButton variant="outline" className="w-full py-4 mt-4" onClick={() => setRole("user")}>
        Order food for yourself <ChevronRight className="size-4 ml-1" />
      </GlassButton>
    </div>
  );
}

/* ---- shared bits ---- */

function Stat({ label, value, pad }: { label: string; value: string; pad?: boolean }) {
  return (
    <div className={cx("flex-1 text-center", pad ? "px-3 py-4" : "")}>
      <p className="text-white">{value}</p>
      <p className="mt-1 text-white/40">{label}</p>
    </div>
  );
}

function PayRow({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className={bold ? "text-white" : "text-white/45"}>{label}</span>
      <span className="text-white">{rupees(value)}</span>
    </div>
  );
}

function Line({
  icon: Icon,
  label,
  sub,
}: {
  icon: typeof Bike;
  label: string;
  sub: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-white/40" />
      <div className="min-w-0">
        <p className="truncate text-white">{label}</p>
        <p className="truncate text-white/40 capitalize">{sub}</p>
      </div>
    </div>
  );
}

export type { RiderTab };
