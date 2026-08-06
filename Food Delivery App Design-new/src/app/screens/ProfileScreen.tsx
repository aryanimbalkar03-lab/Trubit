import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Heart,
  MapPin,
  Wallet,
  Ticket,
  Bell,
  HelpCircle,
  Settings,
  ChevronRight,
  Crown,
  Plus,
  Trash2,
  Check,
  Edit2
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Glass, Divider, GlassButton, cx } from "../components/glass";
import { Sheet } from "../components/Sheet";
import { Field } from "../components/Field";
import { RESTAURANTS } from "../data/catalog";
import { TrubitWordmark } from "../components/Logo";
import { rupees, savingsOn, useApp } from "../store/app-store";
import { AddressSchema, UserProfileSchema, safeParse } from "../lib/validation";

const MENU = [
  { id: "addresses", label: "Saved addresses", sub: "Home, Work", icon: MapPin },
  { id: "payments", label: "Payments", sub: "UPI, Visa •••• 4471", icon: Wallet },
  { id: "coupons", label: "Coupons & offers", sub: "3 available", icon: Ticket },
  { id: "notifications", label: "Notifications", sub: "Order & offer alerts", icon: Bell },
  { id: "help", label: "Help centre", sub: "24×7 support", icon: HelpCircle },
  { id: "settings", label: "Settings", sub: "Preferences, privacy", icon: Settings },
];

export function ProfileScreen({ onOpenRestaurant }: { onOpenRestaurant: (id: string) => void }) {
  const { favourites, orders, toggleFav, address } = useApp();
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({ name: "Ananya Kapoor", phone: "+91 98991 12420", email: "" });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

  // Address Form State
  const [addresses, setAddresses] = useState([
    { id: "1", label: "Home", line1: "42, Ashwood Residency, Indiranagar", city: "Bengaluru", pincode: "560038" }
  ]);
  const [addingAddress, setAddingAddress] = useState(false);
  const [addrForm, setAddrForm] = useState({ label: "Home", line1: "", city: "", pincode: "" });
  const [addrErrors, setAddrErrors] = useState<Record<string, string>>({});

  // Payment State
  const [payments] = useState([
    { id: "1", type: "upi", label: "ananya@okaxis", default: true },
    { id: "2", type: "card", label: "Visa", last4: "4471", default: false }
  ]);

  // Notifications State
  const [notifs, setNotifs] = useState({ orders: true, offers: false, birdy: true });

  // Settings State
  const [diet, setDiet] = useState<"any" | "veg" | "vegan">("any");

  const favRestaurants = RESTAURANTS.filter((r) => favourites.includes(r.id));
  const lifetimeSaved = orders.reduce(
    (sum, o) => sum + o.lines.reduce((s, l) => s + savingsOn(l.dish.price) * l.qty, 0),
    0,
  );

  return (
    <div className="pb-40">
      <div className="px-5 pt-8">
        <Glass sheen className="p-6 cursor-pointer" onClick={() => setActiveModal("profile")}>
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="grid size-16 shrink-0 place-items-center rounded-full border border-white/15 bg-white text-black">
                <span className="tracking-[0.06em]">{profileForm.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'AK'}</span>
              </div>
              <div className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full border border-black bg-white/20 backdrop-blur-md">
                <Edit2 className="size-3 text-white" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-white text-lg font-medium">{profileForm.name}</p>
              <p className="text-white/50 text-sm mt-0.5">{profileForm.phone}</p>
            </div>
            <ChevronRight className="size-5 shrink-0 text-white/30" />
          </div>

          <div className="mt-6 flex items-stretch gap-4">
            <Metric value={String(orders.length)} label="Orders" />
            <Divider className="h-auto w-px bg-white/10" />
            <Metric value={String(favourites.length)} label="Favourites" />
            <Divider className="h-auto w-px bg-white/10" />
            <Metric value={rupees(lifetimeSaved)} label="Saved" />
          </div>
        </Glass>
      </div>

      {/* Membership */}
      <div className="mt-5 px-5">
        <Glass className="relative overflow-hidden p-6">
          <motion.div
            className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 skew-x-[-20deg] bg-white/10 blur-xl"
            animate={{ x: ["0%", "400%"] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 2 }}
          />
          <div className="relative flex items-center gap-4">
            <Crown className="size-6 shrink-0 text-white" />
            <div className="min-w-0 flex-1">
              <p className="text-white">Trubit Noir</p>
              <p className="text-white/45">Free delivery, priority riders, ₹0 surge</p>
            </div>
            <ChevronRight className="size-4 shrink-0 text-white/50" />
          </div>
        </Glass>
      </div>

      {/* Favourites */}
      {favRestaurants.length > 0 && (
        <div className="mt-9">
          <div className="mb-4 flex items-center gap-2 px-5 text-white/45">
            <Heart className="size-4" />
            <span className="tracking-[0.22em] uppercase">Favourites</span>
          </div>
          <div className="scrollbar-none flex gap-4 overflow-x-auto px-5 pb-2">
            {favRestaurants.map((r) => (
              <Glass
                key={r.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => onOpenRestaurant(r.id)}
                className="h-36 w-40 shrink-0 cursor-pointer"
              >
                <ImageWithFallback
                  src={r.image}
                  alt={r.name}
                  className="absolute inset-0 size-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFav(r.id);
                  }}
                  className="absolute top-2 right-2 grid size-8 place-items-center rounded-full border border-white/15 bg-black/40 backdrop-blur-xl"
                  aria-label="Remove favourite"
                >
                  <Heart className="size-3.5 fill-white text-white" />
                </button>
                <div className="relative flex h-full items-end p-3">
                  <p className="line-clamp-2 text-white">{r.name}</p>
                </div>
              </Glass>
            ))}
          </div>
        </div>
      )}

      {/* Menu */}
      <div className="mt-9 px-5">
        <Glass className="divide-y divide-white/[0.07]">
          {MENU.map((m, i) => {
            const Icon = m.icon;
            return (
              <motion.button
                key={m.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                whileTap={{ backgroundColor: "rgba(255,255,255,0.06)" }}
                onClick={() => setActiveModal(m.id)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left"
              >
                <Icon className="size-4 shrink-0 text-white/70" />
                <div className="min-w-0 flex-1">
                  <p className="text-white">{m.label}</p>
                  <p className="truncate text-white/40">{m.sub}</p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-white/30" />
              </motion.button>
            );
          })}
        </Glass>

        <div className="mt-10 flex flex-col items-center gap-2">
          <TrubitWordmark className="text-white/25" />
          <p className="text-white/20">v1.0.0 · 0% commission, always</p>
        </div>
      </div>

      {/* Modals */}
      <Sheet open={activeModal === "profile"} onClose={() => setActiveModal(null)}>
        <div className="px-5 pb-8 pt-2 space-y-6">
          <h2 className="text-xl text-white font-medium">Edit Profile</h2>
          <div className="space-y-4">
            <Field label="Full Name" value={profileForm.name} onChange={(v) => setProfileForm({ ...profileForm, name: v })} />
            {profileErrors.name && <p className="text-red-400 text-sm mt-1">{profileErrors.name}</p>}
            
            <Field label="Phone Number" value={profileForm.phone} onChange={(v) => setProfileForm({ ...profileForm, phone: v })} numeric />
            {profileErrors.phone && <p className="text-red-400 text-sm mt-1">{profileErrors.phone}</p>}
            
            <Field label="Email (Optional)" value={profileForm.email} onChange={(v) => setProfileForm({ ...profileForm, email: v })} />
            {profileErrors.email && <p className="text-red-400 text-sm mt-1">{profileErrors.email}</p>}
          </div>
          <GlassButton
            variant="solid"
            className="w-full"
            onClick={() => {
              const res = safeParse(UserProfileSchema, profileForm);
              if (res.success) {
                setProfileErrors({});
                setActiveModal(null);
              } else {
                setProfileErrors(res.errors);
              }
            }}
          >
            Save Changes
          </GlassButton>
        </div>
      </Sheet>

      <Sheet open={activeModal === "addresses"} onClose={() => { setActiveModal(null); setAddingAddress(false); }}>
        <div className="px-5 pb-8 pt-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl text-white font-medium">Saved Addresses</h2>
            {!addingAddress && (
              <button onClick={() => setAddingAddress(true)} className="text-white/70 flex items-center gap-1 text-sm bg-white/10 px-3 py-1.5 rounded-full">
                <Plus className="size-3.5" /> Add New
              </button>
            )}
          </div>
          
          <AnimatePresence mode="wait">
            {addingAddress ? (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4">
                <div className="flex gap-2">
                  {["Home", "Work", "Other"].map(l => (
                    <button
                      key={l}
                      onClick={() => setAddrForm({ ...addrForm, label: l as any })}
                      className={cx("flex-1 py-2 rounded-xl border text-sm transition-colors", addrForm.label === l ? "bg-white text-black border-white" : "border-white/20 text-white/70")}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <div>
                  <Field label="Address Line 1" value={addrForm.line1} onChange={(v) => setAddrForm({ ...addrForm, line1: v })} />
                  {addrErrors.line1 && <p className="text-red-400 text-sm mt-1">{addrErrors.line1}</p>}
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Field label="City" value={addrForm.city} onChange={(v) => setAddrForm({ ...addrForm, city: v })} />
                    {addrErrors.city && <p className="text-red-400 text-sm mt-1">{addrErrors.city}</p>}
                  </div>
                  <div className="w-1/3">
                    <Field label="Pincode" value={addrForm.pincode} numeric onChange={(v) => setAddrForm({ ...addrForm, pincode: v })} />
                    {addrErrors.pincode && <p className="text-red-400 text-sm mt-1">{addrErrors.pincode}</p>}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <GlassButton variant="outline" className="flex-1" onClick={() => setAddingAddress(false)}>Cancel</GlassButton>
                  <GlassButton
                    variant="solid"
                    className="flex-1"
                    onClick={() => {
                      const res = safeParse(AddressSchema, { ...addrForm, id: Date.now().toString() });
                      if (res.success) {
                        setAddresses([...addresses, res.data]);
                        setAddingAddress(false);
                        setAddrForm({ label: "Home", line1: "", city: "", pincode: "" });
                        setAddrErrors({});
                      } else {
                        setAddrErrors(res.errors);
                      }
                    }}
                  >
                    Save
                  </GlassButton>
                </div>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {addresses.map(a => (
                  <Glass key={a.id} className="p-4 flex gap-4 items-start">
                    <div className="mt-1"><MapPin className="size-5 text-white/50" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium">{a.label}</p>
                      <p className="text-white/50 text-sm mt-0.5 truncate">{a.line1}</p>
                      <p className="text-white/40 text-sm">{a.city} • {a.pincode}</p>
                    </div>
                    <button onClick={() => setAddresses(addresses.filter(x => x.id !== a.id))} className="p-2 text-white/30 hover:text-red-400">
                      <Trash2 className="size-4" />
                    </button>
                  </Glass>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Sheet>

      <Sheet open={activeModal === "payments"} onClose={() => setActiveModal(null)}>
        <div className="px-5 pb-8 pt-2">
          <h2 className="text-xl text-white font-medium mb-6">Payment Methods</h2>
          <div className="space-y-3">
            {payments.map(p => (
              <Glass key={p.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/10 p-2 rounded-lg"><Wallet className="size-5 text-white" /></div>
                  <div>
                    <p className="text-white">{p.label} {p.last4 && `•••• ${p.last4}`}</p>
                    {p.default && <p className="text-xs text-white/40 mt-0.5">Default</p>}
                  </div>
                </div>
              </Glass>
            ))}
          </div>
          <GlassButton variant="outline" className="w-full mt-6">
            <Plus className="size-4" /> Add Payment Method
          </GlassButton>
        </div>
      </Sheet>

      <Sheet open={activeModal === "notifications"} onClose={() => setActiveModal(null)}>
        <div className="px-5 pb-8 pt-2">
          <h2 className="text-xl text-white font-medium mb-6">Notifications</h2>
          <Glass className="divide-y divide-white/10">
            {[
              { id: 'orders', title: "Order Updates", desc: "Live tracking & rider status" },
              { id: 'offers', title: "Offers & Promos", desc: "Discounts and flash sales" },
              { id: 'birdy', title: "Birdy Suggestions", desc: "Smart meal recommendations" }
            ].map((n) => (
              <div key={n.id} className="flex items-center justify-between p-4">
                <div className="pr-4">
                  <p className="text-white">{n.title}</p>
                  <p className="text-white/40 text-sm mt-0.5">{n.desc}</p>
                </div>
                <Toggle 
                  active={notifs[n.id as keyof typeof notifs]} 
                  onChange={(v) => setNotifs({ ...notifs, [n.id]: v })} 
                />
              </div>
            ))}
          </Glass>
        </div>
      </Sheet>

      <Sheet open={activeModal === "settings"} onClose={() => setActiveModal(null)}>
        <div className="px-5 pb-8 pt-2">
          <h2 className="text-xl text-white font-medium mb-6">Settings</h2>
          
          <h3 className="text-white/50 text-sm mb-3 uppercase tracking-wider">Dietary Preference</h3>
          <div className="flex gap-2 mb-8">
            {[
              { id: 'any', label: "Anything" },
              { id: 'veg', label: "Veg Only" },
              { id: 'vegan', label: "Vegan" }
            ].map(d => (
              <button
                key={d.id}
                onClick={() => setDiet(d.id as any)}
                className={cx(
                  "flex-1 py-3 rounded-xl border text-sm transition-all relative overflow-hidden",
                  diet === d.id ? "border-white text-white bg-white/10" : "border-white/20 text-white/50"
                )}
              >
                {diet === d.id && (
                  <motion.div layoutId="diet-active" className="absolute inset-0 bg-white/10" />
                )}
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {diet === d.id && <Check className="size-3.5" />}
                  {d.label}
                </span>
              </button>
            ))}
          </div>

          <GlassButton variant="outline" className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50">
            Log out
          </GlassButton>
        </div>
      </Sheet>
    </div>
  );
}

function Toggle({ active, onChange }: { active: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!active)}
      className={cx(
        "relative flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-300",
        active ? "bg-white" : "bg-white/20"
      )}
    >
      <motion.div
        animate={{ x: active ? 22 : 4 }}
        className={cx("size-5 rounded-full", active ? "bg-black" : "bg-white")}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex-1">
      <p className="text-white">{value}</p>
      <p className="mt-0.5 text-white/40">{label}</p>
    </div>
  );
}
