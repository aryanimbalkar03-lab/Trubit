import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingBag, ChevronRight, ChevronDown, Mic } from "lucide-react";
import { AppProvider, rupees, useApp, type Order } from "./store/app-store";
import { PlatformProvider, usePlatform, ROLE_LABEL, type Role } from "./store/platform";
import { Aurora, Glass, Sheen, cx } from "./components/glass";
import { TrubitMark } from "./components/Logo";
import { FrameContext } from "./components/frame-context";
import { BottomNav } from "./components/BottomNav";
import { Birdy } from "./components/Birdy";
import { HomeScreen } from "./screens/HomeScreen";
import { SearchScreen } from "./screens/SearchScreen";
import { RestaurantScreen } from "./screens/RestaurantScreen";
import { CartScreen } from "./screens/CartScreen";
import { OrdersScreen } from "./screens/OrdersScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { TrackScreen } from "./screens/TrackScreen";
import { DineInScreen } from "./screens/DineInScreen";
import { InsightsScreen } from "./screens/InsightsScreen";
import { RolePicker } from "./screens/RolePicker";
import { RiderApp, type RiderTab } from "./screens/RiderApp";
import { PartnerApp, type PartnerTab } from "./screens/PartnerApp";

type Route =
  | { name: "tabs" }
  | { name: "restaurant"; id: string }
  | { name: "cart" }
  | { name: "track"; order: Order };

function Splash({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    // Wait exactly 3 seconds as requested, then dismiss splash
    const t = window.setTimeout(onDone, 3000);
    return () => window.clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      className="absolute inset-0 z-50 overflow-hidden bg-black flex items-center justify-center"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <video 
        src="birdy.mp4" 
        autoPlay 
        muted 
        playsInline 
        className="w-full h-full object-cover"
      />
    </motion.div>
  );
}

function CartBar({ onOpen }: { onOpen: () => void }) {
  const { itemCount, subtotal, cartRestaurant } = useApp();
  if (itemCount === 0) return null;

  return (
    <motion.div
      initial={{ y: 90, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 90, opacity: 0 }}
      transition={{ type: "spring", stiffness: 340, damping: 30 }}
      className="pointer-events-none absolute inset-x-0 bottom-[5.6rem] z-40 px-5"
    >
      <Glass
        whileTap={{ scale: 0.98 }}
        onClick={onOpen}
        whileHover={{ y: -3 }}
        className="pointer-events-auto flex cursor-pointer items-center gap-4 bg-white/[0.08] p-4"
      >
        <Sheen duration={2.8} repeatDelay={3.2} />
        <div className="relative">
          <ShoppingBag className="size-5 text-white" />
          <motion.span
            key={itemCount}
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            className="absolute -top-2 -right-2 grid size-4 place-items-center rounded-full bg-white text-[10px] text-black"
          >
            {itemCount}
          </motion.span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-white">
            {itemCount} item{itemCount > 1 ? "s" : ""} · {rupees(subtotal)}
          </p>
          <p className="truncate text-white/45">{cartRestaurant?.name}</p>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-white px-4 py-2 text-black">
          View bag <ChevronRight className="size-4" />
        </span>
      </Glass>
    </motion.div>
  );
}

/** Switch hats without signing up twice. Always one tap from anywhere. */
function HatSwitcher({ onSwitch }: { onSwitch: (r: Role) => void }) {
  const { role, roles } = usePlatform();
  const [open, setOpen] = useState(false);
  if (!role) return null;

  return (
    <div className="pointer-events-none absolute top-5 right-5 z-40 flex flex-col items-end gap-2">
      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={() => setOpen(!open)}
        className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/12 bg-black/60 px-3 py-1.5 backdrop-blur-2xl"
      >
        <TrubitMark className="h-4 text-white" />
        <span className="text-white/70">{ROLE_LABEL[role].split(" ")[0]}</span>
        <ChevronDown className={cx("size-3.5 text-white/40 transition-transform", open && "rotate-180")} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="pointer-events-auto w-60 overflow-hidden rounded-2xl border border-white/12 bg-black/85 p-1.5 backdrop-blur-2xl"
          >
            {(["user", "rider", "partner"] as Role[]).map((r) => (
              <button
                key={r}
                onClick={() => {
                  onSwitch(r);
                  setOpen(false);
                }}
                className={cx(
                  "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors",
                  r === role ? "bg-white text-black" : "text-white/65 hover:bg-white/[0.07]",
                )}
              >
                <span>{ROLE_LABEL[r]}</span>
                <span className={cx("text-[10px]", r === role ? "text-black/50" : "text-white/30")}>
                  {roles.includes(r) ? "joined" : "join"}
                </span>
              </button>
            ))}
            <p className="px-3 py-2 text-white/25">
              One account, all three. Nothing to sign up for again.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Shell() {
  const { role, setRole } = usePlatform();
  const [splash, setSplash] = useState(true);
  const [tabs, setTabs] = useState<Record<Role, string>>({
    user: "home",
    rider: "shift",
    partner: "dash",
  });
  const [route, setRoute] = useState<Route>({ name: "tabs" });
  const [birdy, setBirdy] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [frame, setFrame] = useState<HTMLElement | null>(null);

  const tab = role ? tabs[role] : "home";

  const go = (next: Route) => {
    setRoute(next);
    scrollRef.current?.scrollTo({ top: 0 });
  };

  const openRestaurant = (id: string) => {
    import('./lib/telemetry').then(({ trackEvent }) => trackEvent('view_restaurant', { restaurant_id: id }));
    go({ name: "restaurant", id });
  };
  const backToTabs = () => go({ name: "tabs" });

  const switchTab = (t: string) => {
    if (role) setTabs((p) => ({ ...p, [role]: t }));
    go({ name: "tabs" });
  };

  const switchRole = (r: Role) => {
    setRole(r);
    go({ name: "tabs" });
  };

  const overlay = route.name !== "tabs";
  const key =
    route.name === "tabs"
      ? `${role}-tab-${tab}`
      : route.name === "restaurant"
        ? `rest-${route.id}`
        : route.name === "track"
          ? `track-${route.order.id}`
          : "cart";

  return (
    <FrameContext.Provider value={frame}>
    <div className="trubit relative size-full overflow-hidden bg-neutral-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1c1c1c,#000000_60%)]" />

      <div className="relative flex size-full items-center justify-center sm:p-6">
        <div
          ref={setFrame}
          className="relative h-full w-full max-w-[26rem] overflow-hidden bg-black sm:h-[min(880px,100%)] sm:rounded-[2.75rem] sm:border sm:border-white/12 sm:shadow-[0_40px_120px_-20px_rgba(0,0,0,1)]"
        >
          <Aurora />

          <div
            ref={scrollRef}
            className="scrollbar-none relative h-full overflow-y-auto overscroll-contain"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={key}
                initial={{ opacity: 0, y: overlay ? 20 : 10, scale: overlay ? 0.98 : 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.99 }}
                transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
                className="min-h-full transition-colors duration-300"
              >
                {!role ? (
                  <RolePicker />
                ) : role === "rider" ? (
                  <RiderApp tab={tab as RiderTab} />
                ) : role === "partner" ? (
                  <PartnerApp tab={tab as PartnerTab} />
                ) : route.name === "restaurant" ? (
                  <RestaurantScreen
                    restaurantId={route.id}
                    onBack={backToTabs}
                    scrollRef={scrollRef}
                  />
                ) : route.name === "cart" ? (
                  <CartScreen
                    onBack={backToTabs}
                    onBrowse={() => switchTab("home")}
                    onPlaced={(order) => go({ name: "track", order })}
                  />
                ) : route.name === "track" ? (
                  <TrackScreen
                    order={route.order}
                    onAddItems={openRestaurant}
                    onClose={() => switchTab("orders")}
                  />
                ) : tab === "home" ? (
                  <HomeScreen
                    onOpenRestaurant={openRestaurant}
                    onSearch={() => switchTab("search")}
                  />
                ) : tab === "search" ? (
                  <SearchScreen onBack={() => switchTab("home")} onOpenRestaurant={openRestaurant} />
                ) : tab === "dinein" ? (
                  <DineInScreen onOpenRestaurant={openRestaurant} />
                ) : tab === "insights" ? (
                  <InsightsScreen onOpenRestaurant={openRestaurant} />
                ) : tab === "orders" ? (
                  <OrdersScreen
                    onTrack={(order) => go({ name: "track", order })}
                    onOpenRestaurant={openRestaurant}
                  />
                ) : (
                  <ProfileScreen onOpenRestaurant={openRestaurant} />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {route.name === "tabs" && <HatSwitcher onSwitch={switchRole} />}

          <AnimatePresence>
            {role === "user" && route.name !== "cart" && route.name !== "track" && (
              <CartBar key="cartbar" onOpen={() => go({ name: "cart" })} />
            )}
          </AnimatePresence>

          {/* Birdy sits above the nav on the user's side only — riders and
              kitchens have their own tools and don't need a mood search. */}
          <AnimatePresence>
            {role === "user" && route.name === "tabs" && !birdy && (
              <motion.button
                key="birdy-fab"
                initial={{ opacity: 0, scale: 0.6, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.6, y: 12 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 420, damping: 26 }}
                onClick={() => setBirdy(true)}
                className="absolute right-4 bottom-28 z-40 grid size-14 place-items-center overflow-hidden rounded-full bg-white text-black shadow-[0_0_40px_-6px_rgba(255,255,255,0.6)]"
                aria-label="Ask Birdy"
              >
                <motion.span
                  className="absolute inset-0 rounded-full border border-white/60"
                  animate={{ scale: [1, 1.45], opacity: [0.5, 0] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
                />
                <Mic className="relative size-5" />
              </motion.button>
            )}
          </AnimatePresence>

          <Birdy
            open={birdy}
            onClose={() => setBirdy(false)}
            onOpenRestaurant={(id) => {
              setBirdy(false);
              openRestaurant(id);
            }}
            onOpenCart={() => {
              setBirdy(false);
              go({ name: "cart" });
            }}
          />

          {role && route.name === "tabs" && (
            <BottomNav role={role} tab={tab} onChange={switchTab} />
          )}

          <AnimatePresence>{splash && <Splash onDone={() => setSplash(false)} />}</AnimatePresence>
        </div>
      </div>
    </div>
    </FrameContext.Provider>
  );
}

export default function App() {
  return (
    <AppProvider>
      <PlatformProvider>
        <Shell />
      </PlatformProvider>
    </AppProvider>
  );
}
