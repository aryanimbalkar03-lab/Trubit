import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { RESTAURANTS, type Dish, type Nutrition } from "../data/catalog";

/* ================================================================== *
 * Roles
 * One account, three hats. You pick one to start with and can hold all
 * three at once — a rider orders dinner, a restaurant owner rides a
 * weekend shift. Switching is instant and never asks you to sign up twice.
 * ================================================================== */

export type Role = "user" | "rider" | "partner";

export const ROLE_LABEL: Record<Role, string> = {
  user: "Order food",
  rider: "Ride & earn",
  partner: "List my restaurant",
};

/* ================================================================== *
 * Inventory — the "4 units, 500 taps" problem
 *
 * Stock is never decremented on a tap. Tapping takes a *hold*: a short
 * TTL reservation that is the only thing that can become an order.
 *   available = stock − confirmed − liveHolds
 * If you tap and available is 0 you join a numbered waitlist instead of
 * getting a false "added to cart", and the moment somebody's hold expires
 * the front of the queue is offered the unit. Holds expire after 8 minutes
 * so an abandoned cart cannot keep a dish hostage.
 * ================================================================== */

export const HOLD_TTL_MS = 8 * 60 * 1000;

export type Hold = { dishId: string; qty: number; expiresAt: number };

export type ReserveResult =
  | { ok: true; heldUntil: number }
  | { ok: false; reason: "sold-out"; queuePosition: number };

/* ================================================================== *
 * Rider
 * ================================================================== */

export type RiderJob = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  dropAddress: string;
  distanceKm: number;
  items: number;
  /** What the rider is paid, fully itemised — never a single opaque number. */
  basePay: number;
  distancePay: number;
  surgePay: number;
  tip: number;
  /** pickup → picked → delivering → done */
  stage: "offered" | "pickup" | "picked" | "delivering" | "done";
  offeredAt: number;
  batchWith?: string;
};

export const jobPay = (j: RiderJob) => j.basePay + j.distancePay + j.surgePay + j.tip;

export type RiderProfile = {
  name: string;
  vehicle: "cycle" | "scooter" | "bike";
  city: string;
  verified: boolean;
  onboarded: boolean;
  rating: number;
  totalTrips: number;
};

/* ================================================================== *
 * Partner
 * ================================================================== */

export type MenuOverride = {
  price?: number;
  stock?: number;
  live?: boolean;
  angles?: string[];
  nutrition?: Nutrition;
  allergens?: string[];
};

export type PartnerProfile = {
  restaurantId: string;
  name: string;
  cuisines: string;
  address: string;
  fssai: string;
  gst: string;
  seats: number;
  onboarded: boolean;
  /** Trubit takes nothing. Kept explicit so it can never quietly change. */
  commissionPct: 0;
};

/** The funnel a kitchen actually needs: seen → tapped → added → paid. */
export type DishFunnel = {
  dishId: string;
  impressions: number;
  clicks: number;
  adds: number;
  orders: number;
  revenue: number;
};

/* ================================================================== *
 * Dine-in
 * ================================================================== */

export type Booking = {
  id: string;
  restaurantId: string;
  restaurantName: string;
  date: string;
  time: string;
  guests: number;
  status: "confirmed" | "seated" | "cancelled";
  /** No delivery leg to fund, so the discount is real, not marketing. */
  offPct: number;
};

/* ================================================================== */

type State = {
  role: Role | null;
  roles: Role[];
  /** stock consumed by confirmed orders */
  confirmed: Record<string, number>;
  holds: Hold[];
  waitlist: Record<string, string[]>;
  /** live shoppers looking at the same dish right now — real contention */
  viewers: Record<string, number>;
  rider: RiderProfile;
  riderOnline: boolean;
  shiftStartedAt: number | null;
  jobs: RiderJob[];
  riderLedger: { id: string; label: string; amount: number; at: number }[];
  partner: PartnerProfile;
  overrides: Record<string, MenuOverride>;
  funnel: Record<string, DishFunnel>;
  bookings: Booking[];
};

type Action =
  | { type: "setRole"; role: Role }
  | { type: "joinRole"; role: Role }
  | { type: "hold"; dishId: string; qty: number }
  | { type: "releaseHold"; dishId: string }
  | { type: "expireHolds"; now: number }
  | { type: "confirmHolds"; dishIds: string[] }
  | { type: "joinWaitlist"; dishId: string; who: string }
  | { type: "riderOnline"; online: boolean }
  | { type: "advanceJob"; jobId: string }
  | { type: "acceptJob"; jobId: string }
  | { type: "declineJob"; jobId: string }
  | { type: "pushJob"; job: RiderJob }
  | { type: "onboardRider"; profile: Partial<RiderProfile> }
  | { type: "onboardPartner"; profile: Partial<PartnerProfile> }
  | { type: "setOverride"; dishId: string; patch: MenuOverride }
  | { type: "book"; booking: Booking }
  | { type: "cancelBooking"; id: string }
  | { type: "trackEvent"; dishId: string; event: keyof Omit<DishFunnel, "dishId" | "revenue"> ; revenue?: number };

const ALL = RESTAURANTS.flatMap((r) => r.menu);

/** Plausible seed funnel so the analytics screen is never an empty state. */
const seedFunnel = (): Record<string, DishFunnel> => {
  const out: Record<string, DishFunnel> = {};
  ALL.forEach((dish, i) => {
    const impressions = 900 + ((i * 673) % 5200);
    const clicks = Math.round(impressions * (0.06 + ((i * 17) % 22) / 100));
    const adds = Math.round(clicks * (0.28 + ((i * 11) % 30) / 100));
    const orders = Math.round(adds * (0.42 + ((i * 7) % 35) / 100));
    out[dish.id] = {
      dishId: dish.id,
      impressions,
      clicks,
      adds,
      orders,
      revenue: orders * dish.price,
    };
  });
  return out;
};

const initial: State = {
  role: null,
  roles: [],
  confirmed: {},
  holds: [],
  waitlist: {},
  viewers: Object.fromEntries(ALL.map((dish, i) => [dish.id, (i * 13) % 9])),
  rider: {
    name: "Aarav Mehta",
    vehicle: "scooter",
    city: "Bengaluru",
    verified: false,
    onboarded: false,
    rating: 4.9,
    totalTrips: 1284,
  },
  riderOnline: false,
  shiftStartedAt: null,
  jobs: [],
  riderLedger: [
    { id: "l1", label: "Yesterday · 14 trips", amount: 1420, at: Date.now() - 864e5 },
    { id: "l2", label: "Wet weather allowance", amount: 180, at: Date.now() - 864e5 },
    { id: "l3", label: "Weekly on-time bonus", amount: 500, at: Date.now() - 3 * 864e5 },
  ],
  partner: {
    restaurantId: "r1",
    name: "",
    cuisines: "",
    address: "",
    fssai: "",
    gst: "",
    seats: 0,
    onboarded: false,
    commissionPct: 0,
  },
  overrides: {},
  funnel: seedFunnel(),
  bookings: [],
};

function reducer(state: State, a: Action): State {
  switch (a.type) {
    case "setRole":
      return { ...state, role: a.role, roles: state.roles.includes(a.role) ? state.roles : [...state.roles, a.role] };
    case "joinRole":
      return { ...state, roles: state.roles.includes(a.role) ? state.roles : [...state.roles, a.role] };

    case "hold": {
      const existing = state.holds.find((h) => h.dishId === a.dishId);
      const expiresAt = Date.now() + HOLD_TTL_MS;
      return {
        ...state,
        holds: existing
          ? state.holds.map((h) => (h.dishId === a.dishId ? { ...h, qty: a.qty, expiresAt } : h))
          : [...state.holds, { dishId: a.dishId, qty: a.qty, expiresAt }],
      };
    }
    case "releaseHold":
      return { ...state, holds: state.holds.filter((h) => h.dishId !== a.dishId) };
    case "expireHolds": {
      const live = state.holds.filter((h) => h.expiresAt > a.now);
      return live.length === state.holds.length ? state : { ...state, holds: live };
    }
    case "confirmHolds": {
      const confirmed = { ...state.confirmed };
      a.dishIds.forEach((id) => {
        const h = state.holds.find((x) => x.dishId === id);
        if (h) confirmed[id] = (confirmed[id] ?? 0) + h.qty;
      });
      return {
        ...state,
        confirmed,
        holds: state.holds.filter((h) => !a.dishIds.includes(h.dishId)),
      };
    }
    case "joinWaitlist": {
      const q = state.waitlist[a.dishId] ?? [];
      if (q.includes(a.who)) return state;
      return { ...state, waitlist: { ...state.waitlist, [a.dishId]: [...q, a.who] } };
    }

    case "riderOnline":
      return {
        ...state,
        riderOnline: a.online,
        shiftStartedAt: a.online ? Date.now() : null,
        jobs: a.online ? state.jobs : state.jobs.filter((j) => j.stage !== "offered"),
      };
    case "pushJob":
      return { ...state, jobs: [a.job, ...state.jobs] };
    case "acceptJob":
      return {
        ...state,
        jobs: state.jobs.map((j) => (j.id === a.jobId ? { ...j, stage: "pickup" as const } : j)),
      };
    case "declineJob":
      return { ...state, jobs: state.jobs.filter((j) => j.id !== a.jobId) };
    case "advanceJob": {
      const order: RiderJob["stage"][] = ["offered", "pickup", "picked", "delivering", "done"];
      const job = state.jobs.find((j) => j.id === a.jobId);
      if (!job) return state;
      const next = order[Math.min(order.indexOf(job.stage) + 1, order.length - 1)];
      const done = next === "done" && job.stage !== "done";
      return {
        ...state,
        jobs: state.jobs.map((j) => (j.id === a.jobId ? { ...j, stage: next } : j)),
        riderLedger: done
          ? [
              { id: `p-${job.id}`, label: `Trip ${job.id} · ${job.distanceKm} km`, amount: jobPay(job), at: Date.now() },
              ...state.riderLedger,
            ]
          : state.riderLedger,
        rider: done ? { ...state.rider, totalTrips: state.rider.totalTrips + 1 } : state.rider,
      };
    }

    case "onboardRider":
      return { ...state, rider: { ...state.rider, ...a.profile, onboarded: true, verified: true } };
    case "onboardPartner":
      return { ...state, partner: { ...state.partner, ...a.profile, onboarded: true } };
    case "setOverride":
      return {
        ...state,
        overrides: { ...state.overrides, [a.dishId]: { ...state.overrides[a.dishId], ...a.patch } },
      };

    case "book":
      return { ...state, bookings: [a.booking, ...state.bookings] };
    case "cancelBooking":
      return {
        ...state,
        bookings: state.bookings.map((b) =>
          b.id === a.id ? { ...b, status: "cancelled" as const } : b,
        ),
      };

    case "trackEvent": {
      const f = state.funnel[a.dishId];
      if (!f) return state;
      return {
        ...state,
        funnel: {
          ...state.funnel,
          [a.dishId]: {
            ...f,
            [a.event]: f[a.event] + 1,
            revenue: f.revenue + (a.revenue ?? 0),
          },
        },
      };
    }
    default:
      return state;
  }
}

type Ctx = State & {
  setRole: (r: Role) => void;
  joinRole: (r: Role) => void;
  /** Effective dish after any partner edits. Always use this, never raw catalog. */
  effective: (dish: Dish) => Dish;
  availableOf: (dish: Dish) => number;
  reserve: (dish: Dish, qty: number) => ReserveResult;
  release: (dishId: string) => void;
  confirmHolds: (dishIds: string[]) => void;
  holdFor: (dishId: string) => Hold | undefined;
  queuePosition: (dishId: string) => number;
  setOnline: (online: boolean) => void;
  acceptJob: (id: string) => void;
  declineJob: (id: string) => void;
  advanceJob: (id: string) => void;
  onboardRider: (p: Partial<RiderProfile>) => void;
  onboardPartner: (p: Partial<PartnerProfile>) => void;
  setOverride: (dishId: string, patch: MenuOverride) => void;
  book: (b: Booking) => void;
  cancelBooking: (id: string) => void;
  track: (dishId: string, event: "impressions" | "clicks" | "adds" | "orders", revenue?: number) => void;
  activeJob: RiderJob | undefined;
  offers: RiderJob[];
  todayEarnings: number;
};

const Ctx = createContext<Ctx | null>(null);

const DROPS = [
  "42, Ashwood Residency, Indiranagar",
  "8B, Koramangala 5th Block",
  "Prestige Atrium, HAL 2nd Stage",
  "17, Cooke Town, Wheeler Road",
];

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);

  // Holds are not forever. Sweep expired ones so stock returns to the pool.
  useEffect(() => {
    const t = window.setInterval(() => dispatch({ type: "expireHolds", now: Date.now() }), 5000);
    return () => window.clearInterval(t);
  }, []);

  // While a rider is online, offers arrive. Each is a real, itemised job.
  useEffect(() => {
    if (!state.riderOnline) return;
    let n = 0;
    const push = () => {
      const r = RESTAURANTS[Math.floor(Math.random() * RESTAURANTS.length)];
      const km = Math.round((1.2 + Math.random() * 5.5) * 10) / 10;
      const surge = Math.random() > 0.65 ? 20 + Math.round(Math.random() * 40) : 0;
      dispatch({
        type: "pushJob",
        job: {
          id: `JOB-${1000 + Math.floor(Math.random() * 8999)}`,
          restaurantId: r.id,
          restaurantName: r.name,
          dropAddress: DROPS[n++ % DROPS.length],
          distanceKm: km,
          items: 1 + Math.floor(Math.random() * 4),
          basePay: 35,
          distancePay: Math.round(km * 9),
          surgePay: surge,
          tip: Math.random() > 0.6 ? 20 + Math.round(Math.random() * 40) : 0,
          stage: "offered",
          offeredAt: Date.now(),
        },
      });
    };
    const first = window.setTimeout(push, 1800);
    const t = window.setInterval(push, 16000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(t);
    };
  }, [state.riderOnline]);

  const effective = useCallback(
    (dish: Dish): Dish => {
      const o = state.overrides[dish.id];
      if (!o) return dish;
      return {
        ...dish,
        price: o.price ?? dish.price,
        stock: o.stock ?? dish.stock,
        angles: o.angles ?? dish.angles,
        image: (o.angles ?? dish.angles)[0],
        nutrition: o.nutrition ?? dish.nutrition,
        allergens: o.allergens ?? dish.allergens,
      };
    },
    [state.overrides],
  );

  const value = useMemo<Ctx>(() => {
    const heldOf = (dishId: string) =>
      state.holds.filter((h) => h.dishId === dishId).reduce((s, h) => s + h.qty, 0);

    const availableOf = (dish: Dish) => {
      const d = effective(dish);
      return Math.max(0, d.stock - (state.confirmed[dish.id] ?? 0) - heldOf(dish.id));
    };

    return {
      ...state,
      setRole: (role) => dispatch({ type: "setRole", role }),
      joinRole: (role) => dispatch({ type: "joinRole", role }),
      effective,
      availableOf,
      reserve: (dish, qty) => {
        const mine = state.holds.find((h) => h.dishId === dish.id)?.qty ?? 0;
        const d = effective(dish);
        const free = Math.max(
          0,
          d.stock - (state.confirmed[dish.id] ?? 0) - (heldOf(dish.id) - mine),
        );
        if (qty > free) {
          dispatch({ type: "joinWaitlist", dishId: dish.id, who: "me" });
          const q = state.waitlist[dish.id] ?? [];
          return {
            ok: false,
            reason: "sold-out",
            queuePosition: q.includes("me") ? q.indexOf("me") + 1 : q.length + 1,
          };
        }
        dispatch({ type: "hold", dishId: dish.id, qty });
        return { ok: true, heldUntil: Date.now() + HOLD_TTL_MS };
      },
      release: (dishId) => dispatch({ type: "releaseHold", dishId }),
      confirmHolds: (dishIds) => dispatch({ type: "confirmHolds", dishIds }),
      holdFor: (dishId) => state.holds.find((h) => h.dishId === dishId),
      queuePosition: (dishId) => {
        const q = state.waitlist[dishId] ?? [];
        return q.indexOf("me") + 1;
      },
      setOnline: (online) => dispatch({ type: "riderOnline", online }),
      acceptJob: (id) => dispatch({ type: "acceptJob", jobId: id }),
      declineJob: (id) => dispatch({ type: "declineJob", jobId: id }),
      advanceJob: (id) => dispatch({ type: "advanceJob", jobId: id }),
      onboardRider: (p) => dispatch({ type: "onboardRider", profile: p }),
      onboardPartner: (p) => dispatch({ type: "onboardPartner", profile: p }),
      setOverride: (dishId, patch) => dispatch({ type: "setOverride", dishId, patch }),
      book: (b) => dispatch({ type: "book", booking: b }),
      cancelBooking: (id) => dispatch({ type: "cancelBooking", id }),
      track: (dishId, event, revenue) => dispatch({ type: "trackEvent", dishId, event, revenue }),
      activeJob: state.jobs.find((j) => j.stage !== "offered" && j.stage !== "done"),
      offers: state.jobs.filter((j) => j.stage === "offered"),
      todayEarnings: state.riderLedger
        .filter((l) => Date.now() - l.at < 864e5)
        .reduce((s, l) => s + l.amount, 0),
    };
  }, [state, effective]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlatform() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePlatform must be used inside PlatformProvider");
  return ctx;
}
