import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  ShoppingBag,
  Ticket,
  Home,
  Briefcase,
  Wallet,
  CreditCard,
  Banknote,
  Check,
  Plus,
  Minus,
  Timer,
  Utensils,
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Glass, GlassButton, Divider, PriceTag, Sheen, cx } from "../components/glass";
import { TrubitMark } from "../components/Logo";
import { MoneySplit } from "../components/MoneySplit";
import { listedElsewhere, rupees, useApp, type Order } from "../store/app-store";
import { usePlatform } from "../store/platform";

const ADDRESSES = [
  { id: "home", label: "Home", icon: Home, line: "42, Ashwood Residency, Indiranagar" },
  { id: "work", label: "Work", icon: Briefcase, line: "Level 8, Monolith Tower, Koramangala" },
];

const PAYMENTS = [
  { id: "upi", label: "UPI", sub: "Pay by any UPI app", icon: Wallet },
  { id: "card", label: "Card", sub: "Visa •••• 4471", icon: CreditCard },
  { id: "cod", label: "Cash", sub: "Pay on delivery", icon: Banknote },
];

export function CartScreen({
  onBack,
  onPlaced,
  onBrowse,
}: {
  onBack: () => void;
  onPlaced: (order: Order) => void;
  onBrowse: () => void;
}) {
  const { cart, cartRestaurant, subtotal, addItem, removeItem, placeOrder, cutlery, setCutlery } =
    useApp();
  const { confirmHolds, track } = usePlatform();
  const [addressId, setAddressId] = useState("home");
  const [paymentId, setPaymentId] = useState("upi");
  const [couponApplied, setCouponApplied] = useState(true);
  const [placing, setPlacing] = useState(false);

  const discount = couponApplied ? Math.min(Math.round(subtotal * 0.5), 120) : 0;
  const delivery = subtotal >= 499 ? 0 : 39;
  const taxes = Math.round((subtotal - discount) * 0.05);
  const total = Math.max(subtotal - discount + delivery + taxes, 0);

  // What this exact bag would have cost on a commission-charging aggregator.
  const elsewhereSubtotal = cart.reduce((s, l) => s + listedElsewhere(l.dish.price) * l.qty, 0);
  const elsewhereTotal = elsewhereSubtotal + 39 + Math.round(elsewhereSubtotal * 0.05);
  const saved = Math.max(elsewhereTotal - total, 0);
  const promisedMins = (cartRestaurant?.etaMins ?? 30) + 5;

  if (cart.length === 0) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-8 py-24 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 240, damping: 20 }}
          className="grid size-24 place-items-center rounded-full border border-white/12 bg-white/[0.04] backdrop-blur-2xl"
        >
          <ShoppingBag className="size-9 text-white/60" />
        </motion.div>
        <h2 className="mt-7 text-white">Your bag is empty</h2>
        <p className="mt-2 text-white/45">
          Good food is one tap away. Browse restaurants around you.
        </p>
        <GlassButton variant="solid" className="mt-7 px-8" onClick={onBrowse}>
          Browse restaurants
        </GlassButton>
      </div>
    );
  }

  const handlePlace = () => {
    setPlacing(true);
    const order: Order = {
      id: `TRB-${Math.floor(1000 + Math.random() * 8999)}`,
      restaurantId: cartRestaurant?.id ?? "",
      restaurantName: cartRestaurant?.name ?? "Trubit Kitchen",
      lines: cart,
      total,
      placedAt: Date.now(),
      status: "live",
      promisedMins: (cartRestaurant?.etaMins ?? 30) + 5,
      cutlery,
    };
    window.setTimeout(() => {
      /* Holds become real stock only here. Until this moment the units were
         only parked for you, so an abandoned bag frees them for the queue. */
      confirmHolds(cart.map((l) => l.dish.id));
      cart.forEach((l) => track(l.dish.id, "orders", l.dish.price * l.qty));
      placeOrder(order);
      setPlacing(false);
      onPlaced(order);
    }, 900);
  };

  return (
    <div className="pb-48">
      <div className="sticky top-0 z-30 flex items-center gap-3 bg-gradient-to-b from-black via-black/90 to-transparent px-5 pt-6 pb-4 backdrop-blur-xl">
        <button
          onClick={onBack}
          className="grid size-10 place-items-center rounded-full border border-white/12 bg-white/[0.05] backdrop-blur-xl"
          aria-label="Back"
        >
          <ArrowLeft className="size-4 text-white" />
        </button>
        <h2 className="text-white">Your bag</h2>
      </div>

      <div className="space-y-5 px-5">
        {/* Items */}
        <Glass className="p-5">
          <p className="text-white">{cartRestaurant?.name}</p>
          <p className="mt-0.5 text-white/40">
            Arriving in {cartRestaurant?.etaMins ?? 30}–{(cartRestaurant?.etaMins ?? 30) + 8} minutes
          </p>
          <Divider className="my-4" />
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {cart.map((line) => (
                <motion.div
                  key={line.dish.id}
                  layout
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16, height: 0 }}
                  className="flex items-center gap-3"
                >
                  <div className="size-14 shrink-0 overflow-hidden rounded-xl border border-white/10">
                    <ImageWithFallback
                      src={line.dish.image}
                      alt={line.dish.name}
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-white">{line.dish.name}</p>
                    <PriceTag
                      size="sm"
                      price={rupees(line.dish.price)}
                      elsewhere={rupees(listedElsewhere(line.dish.price))}
                    />
                  </div>
                  <div className="flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.06] px-1">
                    <button
                      onClick={() => removeItem(line.dish.id)}
                      className="grid size-7 place-items-center rounded-full text-white"
                      aria-label="Remove one"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-5 text-center text-white">{line.qty}</span>
                    <button
                      onClick={() => addItem(line.dish, cartRestaurant?.id ?? "")}
                      className="grid size-7 place-items-center rounded-full text-white"
                      aria-label="Add one"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <span className="w-16 shrink-0 text-right text-white">
                    {rupees(line.dish.price * line.qty)}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Glass>

        {/* The promise — an ETA you can hold us to */}
        <Glass sheen className="p-5">
          <div className="flex items-center gap-2 text-white/45">
            <Timer className="size-4" />
            <span className="tracking-[0.22em] uppercase">The on-time promise</span>
          </div>
          <p className="mt-3 text-white">
            Delivered within {promisedMins} minutes, or {rupees(60)} back — automatically.
          </p>
          <p className="mt-1 text-white/40">
            No form, no chat, no asking. The credit lands the moment we miss it.
          </p>
        </Glass>

        {/* Cutlery — off by default, unlike everywhere else */}
        <Glass className="flex items-center gap-3 p-4">
          <Utensils className="size-4 shrink-0 text-white" />
          <div className="min-w-0 flex-1">
            <p className="text-white">Send cutlery</p>
            <p className="text-white/40">Off by default — saves plastic, nothing added to bill</p>
          </div>
          <button
            onClick={() => setCutlery(!cutlery)}
            role="switch"
            aria-checked={cutlery}
            aria-label="Send cutlery"
            className={cx(
              "relative h-6 w-11 shrink-0 rounded-full border transition-colors duration-300",
              cutlery ? "border-white bg-white" : "border-white/25 bg-white/[0.06]",
            )}
          >
            <motion.span
              layout
              transition={{ type: "spring", stiffness: 500, damping: 32 }}
              className={cx(
                "absolute top-0.5 rounded-full",
                cutlery ? "right-0.5 bg-black" : "left-0.5 bg-white/70",
              )}
              style={{ height: "1.125rem", width: "1.125rem" }}
            />
          </button>
        </Glass>

        {/* Coupon */}
        <Glass
          whileTap={{ scale: 0.99 }}
          onClick={() => setCouponApplied((c) => !c)}
          className="flex cursor-pointer items-center gap-3 p-4"
        >
          <Ticket className="size-4 shrink-0 text-white" />
          <div className="min-w-0 flex-1">
            <p className="text-white">TRUBIT50</p>
            <p className="text-white/40">50% off up to ₹120</p>
          </div>
          <span
            className={cx(
              "grid size-6 shrink-0 place-items-center rounded-full border transition-colors",
              couponApplied ? "border-white bg-white text-black" : "border-white/30",
            )}
          >
            {couponApplied && <Check className="size-3.5" />}
          </span>
        </Glass>

        {/* Address */}
        <Glass className="p-5">
          <p className="tracking-[0.22em] text-white/45 uppercase">Delivery address</p>
          <div className="mt-4 space-y-3">
            {ADDRESSES.map((a) => {
              const Icon = a.icon;
              const active = addressId === a.id;
              return (
                <button
                  key={a.id}
                  onClick={() => setAddressId(a.id)}
                  className={cx(
                    "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors",
                    active ? "border-white/50 bg-white/[0.08]" : "border-white/10",
                  )}
                >
                  <Icon className="size-4 shrink-0 text-white/70" />
                  <div className="min-w-0 flex-1">
                    <p className="text-white">{a.label}</p>
                    <p className="truncate text-white/40">{a.line}</p>
                  </div>
                  <span
                    className={cx(
                      "size-4 shrink-0 rounded-full border transition-colors",
                      active ? "border-[5px] border-white" : "border-white/30",
                    )}
                  />
                </button>
              );
            })}
          </div>
        </Glass>

        {/* Payment */}
        <Glass className="p-5">
          <p className="tracking-[0.22em] text-white/45 uppercase">Payment method</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {PAYMENTS.map((p) => {
              const Icon = p.icon;
              const active = paymentId === p.id;
              return (
                <motion.button
                  key={p.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setPaymentId(p.id)}
                  className={cx(
                    "rounded-2xl border px-3 py-4 text-center transition-colors",
                    active ? "border-white bg-white text-black" : "border-white/10 text-white/70",
                  )}
                >
                  <Icon className="mx-auto size-5" />
                  <p className="mt-2">{p.label}</p>
                </motion.button>
              );
            })}
          </div>
          <p className="mt-3 text-white/40">{PAYMENTS.find((p) => p.id === paymentId)?.sub}</p>
        </Glass>

        {/* Bill */}
        <Glass className="p-5">
          <p className="tracking-[0.22em] text-white/45 uppercase">Bill details</p>
          <div className="mt-4 space-y-3">
            <Row label="Item total" value={rupees(subtotal)} />
            {discount > 0 && <Row label="TRUBIT50 discount" value={`− ${rupees(discount)}`} />}
            <Row label="Delivery fee" value={delivery === 0 ? "Free" : rupees(delivery)} />
            <Row label="Taxes & charges" value={rupees(taxes)} />
            <Divider className="my-1" />
            <div className="flex items-center justify-between text-white">
              <span>To pay</span>
              <span>{rupees(total)}</span>
            </div>
          </div>
        </Glass>

        {/* The comparison that makes the case */}
        <Glass sheen className="p-5">
          <div className="flex items-center gap-2 text-white/45">
            <TrubitMark className="h-5 text-white/70" />
            <span className="tracking-[0.22em] uppercase">Why it costs less</span>
          </div>
          <div className="mt-4 flex items-end gap-4">
            <div className="flex-1">
              <p className="text-white/40">On other apps</p>
              <p className="mt-1 text-white/35 line-through">{rupees(elsewhereTotal)}</p>
            </div>
            <div className="flex-1 text-right">
              <p className="text-white/40">On Trubit</p>
              <p className="mt-1 text-white">{rupees(total)}</p>
            </div>
          </div>
          <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-white/[0.08]">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-white"
              initial={{ width: "100%" }}
              animate={{ width: `${Math.round((total / Math.max(elsewhereTotal, 1)) * 100)}%` }}
              transition={{ duration: 1.1, ease: [0.22, 0.9, 0.25, 1], delay: 0.2 }}
            />
          </div>
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="mt-4 text-white"
          >
            You keep {rupees(saved)} on this order.
          </motion.p>
          <p className="mt-1 text-white/40">
            No restaurant commission, no inflated menu, no platform fee.
          </p>
        </Glass>

        <MoneySplit total={total} />
      </div>

      {/* Pay bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-[26rem] px-5 pb-6">
        <Glass className="flex items-center gap-4 p-3 pl-5">
          <Sheen duration={3.2} repeatDelay={4} />
          <div className="min-w-0 flex-1">
            <p className="text-white">{rupees(total)}</p>
            <p className="truncate text-white/40">Saving {rupees(saved)}</p>
          </div>
          <GlassButton
            variant="solid"
            disabled={placing}
            onClick={handlePlace}
            className="min-w-[9.5rem] px-6"
          >
            {placing ? (
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                Placing…
              </motion.span>
            ) : (
              "Place order"
            )}
          </GlassButton>
        </Glass>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-white/55">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
