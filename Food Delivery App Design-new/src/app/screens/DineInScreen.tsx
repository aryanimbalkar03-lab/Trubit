import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Armchair, Clock, Users, Percent, CheckCircle2, X, MapPin } from "lucide-react";
import { Glass, GlassButton, Chip, Divider, cx } from "../components/glass";
import { Sheet } from "../components/Sheet";
import { FoodImage } from "../components/FoodImage";
import { DarkMap, type Marker } from "../components/DarkMap";
import { CITY, RESTAURANTS, distanceKm, type Restaurant } from "../data/catalog";
import { rupees } from "../store/app-store";
import { usePlatform, type Booking } from "../store/platform";

const SLOTS = ["12:30", "13:15", "19:00", "19:45", "20:30", "21:15", "22:00"];

/**
 * Dine-in. There is no delivery leg to pay for, so the saving is real and we
 * hand all of it to the diner rather than pocketing it as "convenience".
 */
export function DineInScreen({ onOpenRestaurant }: { onOpenRestaurant: (id: string) => void }) {
  const { bookings, book, cancelBooking } = usePlatform();
  const [picking, setPicking] = useState<Restaurant | null>(null);

  const places = useMemo(
    () =>
      RESTAURANTS.filter((r) => r.seats > 0)
        .map((r) => ({ ...r, km: distanceKm(CITY, r) }))
        .sort((a, b) => a.km - b.km),
    [],
  );

  const markers: Marker[] = places.map((r) => ({
    id: r.id,
    lat: r.lat,
    lng: r.lng,
    kind: "restaurant" as const,
    label: r.name.split(" ")[0],
  }));
  markers.push({ id: "me", ...CITY, kind: "you" });

  const live = bookings.filter((b) => b.status !== "cancelled");

  return (
    <div className="pb-40">
      <div className="px-5 pt-8 pb-5">
        <p className="tracking-[0.22em] text-white/45 uppercase">Eat there</p>
        <h1 className="mt-1 text-white">Dine in</h1>
        <p className="mt-2 text-white/45">
          Book a table and the kitchen takes the delivery cost straight off your bill — nobody rode
          anywhere, so nobody should be charged for it.
        </p>
      </div>

      <DarkMap markers={markers} className="h-52 w-full" />

      {live.length > 0 && (
        <div className="mt-5 space-y-3 px-5">
          <p className="tracking-[0.22em] text-white/40 uppercase">Your tables</p>
          {live.map((b) => (
            <Glass key={b.id} sheen className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-white">{b.restaurantName}</p>
                  <p className="mt-0.5 text-white/45">
                    {b.date} · {b.time} · {b.guests} guest{b.guests > 1 ? "s" : ""}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-white px-3 py-1 text-black">
                  {b.offPct}% off
                </span>
              </div>
              <Divider className="my-4" />
              <div className="flex gap-3">
                <GlassButton className="flex-1" onClick={() => onOpenRestaurant(b.restaurantId)}>
                  See menu
                </GlassButton>
                <GlassButton variant="outline" className="px-5" onClick={() => cancelBooking(b.id)}>
                  <X className="size-4" /> Cancel
                </GlassButton>
              </div>
            </Glass>
          ))}
        </div>
      )}

      <div className="mt-6 space-y-4 px-5">
        <p className="tracking-[0.22em] text-white/40 uppercase">{places.length} tables near you</p>
        {places.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Glass sheen sheenDelay={i * 0.4} whileHover={{ y: -4 }} className="overflow-hidden">
              <FoodImage angles={[r.cover, r.image]} alt={r.name} className="h-36 w-full" />
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-white">{r.name}</p>
                    <p className="mt-0.5 truncate text-white/45">{r.cuisines.join(" · ")}</p>
                  </div>
                  <span className="shrink-0 rounded-full border border-white/25 px-3 py-1 text-white">
                    {r.dineInOff}% off
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <Fact icon={MapPin} value={`${r.km} km`} />
                  <Fact icon={Armchair} value={`${r.seats} seats`} />
                  <Fact icon={Percent} value={rupees(Math.round(r.priceForTwo * (1 - r.dineInOff / 100)))} />
                </div>
                <GlassButton variant="solid" className="mt-4 w-full" onClick={() => setPicking(r)}>
                  Book a table
                </GlassButton>
              </div>
            </Glass>
          </motion.div>
        ))}
      </div>

      <Sheet open={Boolean(picking)} onClose={() => setPicking(null)}>
        {picking && (
          <BookingForm
            restaurant={picking}
            onDone={(b) => {
              book(b);
              setPicking(null);
            }}
          />
        )}
      </Sheet>
    </div>
  );
}

function BookingForm({
  restaurant,
  onDone,
}: {
  restaurant: Restaurant;
  onDone: (b: Booking) => void;
}) {
  const [guests, setGuests] = useState(2);
  const [slot, setSlot] = useState(SLOTS[2]);
  const [day, setDay] = useState(0);

  const days = useMemo(
    () =>
      [0, 1, 2, 3].map((n) => {
        const d = new Date(Date.now() + n * 864e5);
        return {
          n,
          label: n === 0 ? "Today" : n === 1 ? "Tomorrow" : d.toLocaleDateString("en-IN", { weekday: "short" }),
          date: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        };
      }),
    [],
  );

  const bill = Math.round((restaurant.priceForTwo / 2) * guests);
  const off = Math.round((bill * restaurant.dineInOff) / 100);

  return (
    <div className="space-y-5 px-5 pt-1 pb-8">
      <div>
        <p className="tracking-[0.22em] text-white/40 uppercase">Book a table</p>
        <h2 className="mt-1 text-white">{restaurant.name}</h2>
      </div>

      <Glass className="space-y-4 p-5">
        <div>
          <p className="mb-2 text-white/50">Guests</p>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 8].map((g) => (
              <Chip key={g} active={guests === g} onClick={() => setGuests(g)}>
                {g}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-white/50">Day</p>
          <div className="flex gap-2">
            {days.map((d) => (
              <button
                key={d.n}
                onClick={() => setDay(d.n)}
                className={cx(
                  "flex-1 rounded-xl border py-2.5 transition-colors duration-300",
                  day === d.n
                    ? "border-white bg-white text-black"
                    : "border-white/12 bg-white/[0.05] text-white/60",
                )}
              >
                <span className="block">{d.label}</span>
                <span className="block opacity-60">{d.date}</span>
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-white/50">Time</p>
          <div className="flex flex-wrap gap-2">
            {SLOTS.map((s) => (
              <Chip key={s} active={slot === s} onClick={() => setSlot(s)}>
                {s}
              </Chip>
            ))}
          </div>
        </div>
      </Glass>

      <Glass className="space-y-2 p-5">
        <p className="text-white">What this saves you</p>
        <Row label={`Typical bill · ${guests} guest${guests > 1 ? "s" : ""}`} value={rupees(bill)} />
        <Row label={`Dine-in discount · ${restaurant.dineInOff}%`} value={`− ${rupees(off)}`} />
        <Row label="Delivery fee" value="₹0 — you're walking in" />
        <Row label="Trubit's cut" value="₹0" />
        <Divider className="my-2" />
        <Row label="You pay about" value={rupees(bill - off)} bold />
        <p className="pt-1 text-white/35">
          No booking fee and no card held. If you don't show, nothing is charged — we just tell the
          kitchen so the table goes back out.
        </p>
      </Glass>

      <GlassButton
        variant="solid"
        className="w-full py-4"
        onClick={() =>
          onDone({
            id: `TBL-${Math.floor(1000 + Math.random() * 8999)}`,
            restaurantId: restaurant.id,
            restaurantName: restaurant.name,
            date: days[day].date,
            time: slot,
            guests,
            status: "confirmed",
            offPct: restaurant.dineInOff,
          })
        }
      >
        <CheckCircle2 className="size-4" /> Confirm {slot} for {guests}
      </GlassButton>
    </div>
  );
}

function Fact({ icon: Icon, value }: { icon: typeof Clock; value: string }) {
  return (
    <div className="flex items-center justify-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] py-2">
      <Icon className="size-3.5 shrink-0 text-white/40" />
      <span className="truncate text-white/70">{value}</span>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className={bold ? "text-white" : "text-white/45"}>{label}</span>
      <span className="shrink-0 text-white">{value}</span>
    </div>
  );
}
