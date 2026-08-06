/* ------------------------------------------------------------------ */
/*  Sync Engine — Cross-profile event bus + localStorage persistence  */
/*  Allows orders placed as User to appear in Rider/Partner dashboards*/
/* ------------------------------------------------------------------ */

type Listener = (payload: unknown) => void;

const _listeners = new Map<string, Set<Listener>>();

export function emit(event: string, payload?: unknown) {
  _listeners.get(event)?.forEach((fn) => fn(payload));
}

export function on(event: string, fn: Listener): () => void {
  if (!_listeners.has(event)) _listeners.set(event, new Set());
  _listeners.get(event)!.add(fn);
  return () => {
    _listeners.get(event)?.delete(fn);
  };
}
export { on as subscribe };

/* ------------------------------------------------------------------ */
/*  localStorage helpers with JSON safety                             */
/* ------------------------------------------------------------------ */

const PREFIX = "trubit_";

export function persist<T>(key: string, data: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(data));
  } catch {
    /* quota exceeded — silently skip */
  }
}

export function hydrate<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    /* corrupted — use fallback */
  }
  return fallback;
}

export function clearAll(): void {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(PREFIX)) keys.push(k);
  }
  keys.forEach((k) => localStorage.removeItem(k));
}

/* ------------------------------------------------------------------ */
/*  Known events                                                      */
/* ------------------------------------------------------------------ */

export const EVENTS = {
  /** Fired when a user places an order */
  ORDER_PLACED: "order:placed",
  /** Fired when rider picks up an order */
  ORDER_PICKED_UP: "order:pickedUp",
  /** Fired when order is delivered */
  ORDER_DELIVERED: "order:delivered",
  /** Fired when order is cancelled */
  ORDER_CANCELLED: "order:cancelled",
  /** Fired when partner updates menu */
  MENU_UPDATED: "menu:updated",
  /** Fired when stock changes */
  STOCK_CHANGED: "stock:changed",
  /** Fired when a boost campaign is created */
  BOOST_CREATED: "boost:created",
  /** Fired when profile role switches */
  ROLE_SWITCHED: "role:switched",
} as const;

/* ------------------------------------------------------------------ */
/*  Order lifecycle simulator                                         */
/*  Simulates an order progressing through stages automatically       */
/* ------------------------------------------------------------------ */

interface OrderLifecycle {
  orderId: string;
  timer: ReturnType<typeof setTimeout> | null;
  stage: number;
}

const _activeLifecycles = new Map<string, OrderLifecycle>();

const LIFECYCLE_STAGES = [
  { event: "order:confirmed", delay: 2000 },
  { event: "order:preparing", delay: 8000 },
  { event: "order:pickedUp", delay: 6000 },
  { event: "order:delivered", delay: 10000 },
] as const;

export function startOrderLifecycle(orderId: string): void {
  if (_activeLifecycles.has(orderId)) return;

  const lc: OrderLifecycle = { orderId, timer: null, stage: 0 };
  _activeLifecycles.set(orderId, lc);

  function advance() {
    if (lc.stage >= LIFECYCLE_STAGES.length) {
      _activeLifecycles.delete(orderId);
      return;
    }
    const s = LIFECYCLE_STAGES[lc.stage];
    lc.timer = setTimeout(() => {
      emit(s.event, { orderId });
      lc.stage++;
      advance();
    }, s.delay);
  }
  advance();
}

export function cancelOrderLifecycle(orderId: string): void {
  const lc = _activeLifecycles.get(orderId);
  if (lc?.timer) clearTimeout(lc.timer);
  _activeLifecycles.delete(orderId);
}

/* ------------------------------------------------------------------ */
/*  Ad Boost Engine — manages boost campaigns                        */
/* ------------------------------------------------------------------ */

export interface BoostSlot {
  id: string;
  restaurantId: string;
  tier: "basic" | "premium" | "featured";
  dailyBudget: number;
  spent: number;
  impressions: number;
  clicks: number;
  orders: number;
  durationDays: number;
  daysActive: number;
  startDate: string;
  active: boolean;
}

const _boostStore: BoostSlot[] = hydrate<BoostSlot[]>("boosts", []);

export function getActiveBoosts(): BoostSlot[] {
  return _boostStore.filter((b) => b.active);
}

export function getAllBoosts(): BoostSlot[] {
  return [..._boostStore];
}

export function getBoostForRestaurant(restaurantId: string): BoostSlot | undefined {
  return _boostStore.find((b) => b.restaurantId === restaurantId && b.active);
}

export function createBoost(
  restaurantId: string,
  tier: BoostSlot["tier"],
  dailyBudget: number,
  durationDays: number,
  startDate: string
): BoostSlot {
  const slot: BoostSlot = {
    id: `boost-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    restaurantId,
    tier,
    dailyBudget,
    spent: 0,
    impressions: 0,
    clicks: 0,
    orders: 0,
    durationDays,
    daysActive: 0,
    startDate,
    active: true,
  };
  _boostStore.push(slot);
  persist("boosts", _boostStore);
  emit(EVENTS.BOOST_CREATED, slot);
  return slot;
}

export function recordBoostImpression(restaurantId: string): void {
  const b = getBoostForRestaurant(restaurantId);
  if (!b) return;
  b.impressions++;
  // Cost per impression: ~₹0.10 for basic, ₹0.25 for premium, ₹0.50 for featured
  const cpi = b.tier === "featured" ? 0.5 : b.tier === "premium" ? 0.25 : 0.1;
  b.spent += cpi;
  if (b.spent >= b.dailyBudget) b.active = false;
  persist("boosts", _boostStore);
}

export function recordBoostClick(restaurantId: string): void {
  const b = getBoostForRestaurant(restaurantId);
  if (!b) return;
  b.clicks++;
  persist("boosts", _boostStore);
}

export function recordBoostOrder(restaurantId: string): void {
  const b = getBoostForRestaurant(restaurantId);
  if (!b) return;
  b.orders++;
  persist("boosts", _boostStore);
}

/** Pricing tiers — what Trubit charges per boost */
export const BOOST_PRICING = {
  basic: {
    label: "Basic Boost",
    minBudget: 50,
    description: "Appear in 'Promoted' section on home feed",
    cpi: 0.1,
    features: ["Home feed placement", "Basic analytics"],
  },
  premium: {
    label: "Premium Boost",
    minBudget: 200,
    description: "Top of search results + home feed promotion",
    cpi: 0.25,
    features: ["Search top placement", "Home feed hero", "Detailed analytics", "Audience targeting"],
  },
  featured: {
    label: "Featured Spotlight",
    minBudget: 500,
    description: "Full-width featured card + push notifications to nearby users",
    cpi: 0.5,
    features: [
      "Full-width hero card",
      "Push notifications",
      "Birdy recommendations",
      "Priority support",
      "Real-time analytics",
    ],
  },
} as const;
