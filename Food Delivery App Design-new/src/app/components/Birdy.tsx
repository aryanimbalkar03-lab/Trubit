import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, CornerDownLeft, Sparkles } from "lucide-react";
import { Sheet } from "./Sheet";
import { Glass, GlassButton, Chip, cx } from "./glass";
import { TrubitMark } from "./Logo";
import { FoodImage } from "./FoodImage";
import { StockPill } from "./StockPill";
import { rupees, listedElsewhere, useApp } from "../store/app-store";
import { usePlatform } from "../store/platform";
import { CITY, RESTAURANTS, distanceKm, type Dish } from "../data/catalog";

/* ------------------------------------------------------------------ *
 * Birdy — say how you feel, not what you want.
 *
 * Speech goes through the browser's own SpeechRecognition (no audio ever
 * leaves the device, no key, no cloud). Where that isn't available Birdy
 * degrades to typing, which is the same pipeline underneath.
 * ------------------------------------------------------------------ */

type Mood = {
  id: string;
  words: string[];
  says: string;
  /** cuisine / category words to match against the menu */
  wants: string[];
  maxSpice?: number;
  minProtein?: number;
  maxKcal?: number;
  vegOnly?: boolean;
};

const MOODS: Mood[] = [
  {
    id: "sad",
    words: ["sad", "down", "low", "rough day", "bad day", "tired", "exhausted", "stressed"],
    says: "Rough one. Warm, soft, no chewing required — comfort first.",
    wants: ["ramen", "noodle", "biryani", "dal", "pasta", "shake", "cheesecake", "soup"],
  },
  {
    id: "happy",
    words: ["happy", "great", "celebrat", "promoted", "good news", "excited"],
    says: "Then we're going somewhere worth it. Signature plates only.",
    wants: ["omakase", "wagyu", "ribeye", "truffle", "tasting", "pavlova"],
  },
  {
    id: "hungry",
    words: ["starving", "very hungry", "famished", "so hungry", "empty"],
    says: "Volume, fast, hot. Nothing dainty.",
    wants: ["burger", "biryani", "pizza", "fried rice", "noodles", "fries"],
  },
  {
    id: "light",
    words: ["light", "healthy", "clean", "gym", "diet", "fit", "salad", "protein"],
    says: "Keeping it clean. High protein, kilocalories in check.",
    wants: ["bowl", "berry", "cauliflower", "avocado", "toast", "yoghurt"],
    minProtein: 14,
    maxKcal: 520,
  },
  {
    id: "spicy",
    words: ["spicy", "heat", "chilli", "chili", "hot food", "fiery"],
    says: "Heat it is. Bringing the chilli-forward end of the menu.",
    wants: ["chilli", "diavola", "rogan", "basil", "piccante", "garlic"],
  },
  {
    id: "sweet",
    words: ["sweet", "dessert", "sugar", "cake", "chocolate"],
    says: "Straight to the sweet end. No arguments.",
    wants: ["cheesecake", "cupcake", "tiramisu", "gulab", "pavlova", "shake"],
  },
  {
    id: "veg",
    words: ["veg", "vegetarian", "no meat", "plant"],
    says: "Vegetarian only, filtered hard.",
    wants: [],
    vegOnly: true,
  },
  {
    id: "cheap",
    words: ["broke", "cheap", "budget", "tight", "payday", "save"],
    says: "Tight budget, no problem — best value per rupee, nothing padded.",
    wants: [],
  },
];

/** Pull "under 400", "₹300", "500 rupees" out of speech. */
function budgetFrom(text: string) {
  const m = text.match(/(?:under|below|within|max|upto|up to|₹|rs\.?)\s*(\d{2,5})/i)
    ?? text.match(/(\d{2,5})\s*(?:rupees|rs|bucks)/i);
  return m ? Number(m[1]) : null;
}

/** Pull "within 2 km" out of speech. */
function radiusFrom(text: string) {
  const m = text.match(/(\d+(?:\.\d+)?)\s*(?:km|kilometre|kilometer)/i);
  return m ? Number(m[1]) : null;
}

type Result = Dish & { restaurantId: string; restaurantName: string; km: number; score: number };

export function Birdy({
  open,
  onClose,
  onOpenRestaurant,
}: {
  open: boolean;
  onClose: () => void;
  onOpenRestaurant: (id: string) => void;
}) {
  const { addItem } = useApp();
  const { effective, availableOf, reserve, track } = usePlatform();

  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [typed, setTyped] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [budget, setBudget] = useState(500);
  const [radius, setRadius] = useState(4);
  const [supported, setSupported] = useState(true);
  const recRef = useRef<any>(null);

  useEffect(() => {
    const SR =
      (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-IN";
    rec.onresult = (e: any) => {
      const text = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join(" ");
      setHeard(text);
      if (e.results[e.results.length - 1].isFinal) setSubmitted(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => {
      setListening(false);
      setSupported(false);
    };
    recRef.current = rec;
    return () => rec.abort?.();
  }, []);

  // Speech can carry the budget and the radius too — honour them.
  useEffect(() => {
    if (!submitted) return;
    const b = budgetFrom(submitted);
    if (b) setBudget(b);
    const r = radiusFrom(submitted);
    if (r) setRadius(r);
  }, [submitted]);

  const toggleMic = () => {
    if (!supported) return;
    if (listening) {
      recRef.current?.stop();
      setListening(false);
    } else {
      setHeard("");
      setSubmitted("");
      try {
        recRef.current?.start();
        setListening(true);
      } catch {
        setSupported(false);
      }
    }
  };

  const mood = useMemo(() => {
    const t = submitted.toLowerCase();
    if (!t) return null;
    return MOODS.find((m) => m.words.some((w) => t.includes(w))) ?? null;
  }, [submitted]);

  const results = useMemo<Result[]>(() => {
    if (!submitted) return [];
    const t = submitted.toLowerCase();
    const out: Result[] = [];

    RESTAURANTS.forEach((r) => {
      const km = distanceKm(CITY, r);
      if (km > radius) return;
      r.menu.forEach((raw) => {
        const dish = effective(raw);
        if (dish.price > budget) return;
        if (mood?.vegOnly && !dish.veg) return;
        if (mood?.maxKcal && dish.nutrition.kcal > mood.maxKcal) return;
        if (mood?.minProtein && dish.nutrition.protein < mood.minProtein) return;

        let score = 0;
        const hay = `${dish.name} ${dish.desc} ${r.cuisines.join(" ")}`.toLowerCase();
        mood?.wants.forEach((w) => {
          if (hay.includes(w)) score += 12;
        });
        // direct words the person actually said
        t.split(/\s+/)
          .filter((w) => w.length > 3)
          .forEach((w) => {
            if (hay.includes(w)) score += 8;
          });
        if (mood?.id === "cheap") score += Math.round((budget - dish.price) / 25);
        if (mood?.id === "spicy") score += dish.spice * 6;
        if (dish.bestseller) score += 4;
        score += Math.max(0, 6 - km * 1.2);
        score += r.rating;
        if (availableOf(dish) === 0) score -= 30;

        out.push({ ...dish, restaurantId: r.id, restaurantName: r.name, km, score });
      });
    });

    return out.sort((a, b) => b.score - a.score).slice(0, 8);
  }, [submitted, budget, radius, mood, effective, availableOf]);

  const send = () => {
    if (!typed.trim()) return;
    setSubmitted(typed.trim());
    setHeard(typed.trim());
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="space-y-5 px-5 pt-1 pb-8">
        {/* Birdy's face */}
        <div className="flex items-center gap-3">
          <motion.div
            animate={listening ? { y: [0, -4, 0] } : {}}
            transition={{ duration: 0.9, repeat: Infinity }}
          >
            <TrubitMark flying={listening} className="h-11 text-white" />
          </motion.div>
          <div className="min-w-0">
            <p className="text-white">Birdy</p>
            <p className="text-white/40">
              {listening
                ? "Listening…"
                : mood
                  ? mood.says
                  : "Tell me how you're feeling. Not what you want."}
            </p>
          </div>
        </div>

        {/* Mic */}
        <div className="flex flex-col items-center gap-3 py-2">
          <motion.button
            onClick={toggleMic}
            whileTap={{ scale: 0.92 }}
            disabled={!supported}
            className={cx(
              "relative grid size-20 place-items-center rounded-full border transition-colors duration-300",
              listening
                ? "border-white bg-white text-black"
                : "border-white/20 bg-white/[0.06] text-white disabled:opacity-40",
            )}
          >
            {listening && (
              <>
                <motion.span
                  className="absolute inset-0 rounded-full bg-white/25"
                  animate={{ scale: [1, 1.7], opacity: [0.6, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
                />
                <motion.span
                  className="absolute inset-0 rounded-full bg-white/20"
                  animate={{ scale: [1, 1.7], opacity: [0.6, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut", delay: 0.8 }}
                />
              </>
            )}
            {supported ? <Mic className="relative size-7" /> : <MicOff className="relative size-7" />}
          </motion.button>

          <AnimatePresence mode="wait">
            {heard && (
              <motion.p
                key={heard}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="max-w-[18rem] text-center text-white/70"
              >
                “{heard}”
              </motion.p>
            )}
          </AnimatePresence>

          {!supported && (
            <p className="text-center text-white/35">
              This browser has no on-device speech engine. Type it instead — same result.
            </p>
          )}
        </div>

        {/* Type fallback, always available */}
        <div className="flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.05] px-4 py-3">
          <Sparkles className="size-4 shrink-0 text-white/40" />
          <input
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="“had a rough day, under 400, within 2 km”"
            className="min-w-0 flex-1 bg-transparent text-white placeholder:text-white/30 outline-none"
          />
          <button onClick={send} className="shrink-0 text-white/50">
            <CornerDownLeft className="size-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {["Had a rough day", "Starving, under 300", "Something light and high protein", "Broke till payday"].map(
            (s) => (
              <Chip
                key={s}
                onClick={() => {
                  setTyped(s);
                  setSubmitted(s);
                  setHeard(s);
                }}
              >
                {s}
              </Chip>
            ),
          )}
        </div>

        {/* Constraints Birdy is working under, always visible and editable */}
        <Glass className="space-y-4 p-5">
          <Slider
            label="Budget per dish"
            value={rupees(budget)}
            min={100}
            max={2000}
            step={50}
            v={budget}
            onChange={setBudget}
          />
          <Slider
            label="How far you'll go"
            value={`${radius} km`}
            min={1}
            max={8}
            step={0.5}
            v={radius}
            onChange={setRadius}
          />
        </Glass>

        {/* Results */}
        {submitted && (
          <div className="space-y-3">
            <p className="tracking-[0.22em] text-white/40 uppercase">
              {results.length ? `${results.length} matches` : "Nothing fits"}
            </p>
            {results.length === 0 && (
              <Glass className="p-6 text-center">
                <p className="text-white">Nothing within {radius} km under {rupees(budget)}.</p>
                <p className="mt-1 text-white/45">Widen either dial and I'll look again.</p>
              </Glass>
            )}
            {results.map((r, i) => (
              <motion.div
                key={`${r.restaurantId}-${r.id}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Glass sheen sheenDelay={i * 0.4} className="flex gap-3 p-3">
                  <FoodImage
                    angles={r.angles}
                    alt={r.name}
                    className="size-20 shrink-0 rounded-2xl"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-white">{r.name}</p>
                    <p className="truncate text-white/40">
                      {r.restaurantName} · {r.km} km
                    </p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-white">{rupees(r.price)}</span>
                      <span className="text-white/30 line-through">
                        {rupees(listedElsewhere(r.price))}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2">
                      <StockPill dish={r} />
                      <span className="text-white/35">{r.nutrition.kcal} kcal</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col justify-between">
                    <GlassButton
                      variant="solid"
                      className="px-4 py-2"
                      onClick={() => {
                        const res = reserve(r, 1);
                        if (res.ok) {
                          addItem(r, r.restaurantId);
                          track(r.id, "adds");
                        }
                      }}
                      disabled={availableOf(r) === 0}
                    >
                      Add
                    </GlassButton>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenRestaurant(r.restaurantId);
                      }}
                      className="text-white/40"
                    >
                      Menu
                    </button>
                  </div>
                </Glass>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Sheet>
  );
}

function Slider({
  label,
  value,
  v,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: string;
  v: number;
  min: number;
  max: number;
  step: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-white/50">{label}</span>
        <span className="text-white">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={v}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-white"
      />
    </div>
  );
}
