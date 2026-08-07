import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, CornerDownLeft, Sparkles, ShoppingBag, ChevronRight, Volume2 } from "lucide-react";
import { Sheet } from "./Sheet";
import { Glass, GlassButton, Chip, cx, Sheen } from "./glass";
import { TrubitMark } from "./Logo";
import { FoodImage } from "./FoodImage";
import { StockPill } from "./StockPill";
import { Stepper } from "./pieces";
import { rupees, listedElsewhere, useApp } from "../store/app-store";
import { usePlatform } from "../store/platform";
import { CITY, RESTAURANTS, distanceKm, type Dish } from "../data/catalog";
import { sanitizeText, isPayloadSafe, checkRateLimit } from "../lib/security";

/* ------------------------------------------------------------------ *
 * Birdy Text-to-Speech Engine
 * ------------------------------------------------------------------ */
function birdySpeak(text: string, onEnd?: () => void) {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    onEnd?.();
    return;
  }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1.05;
  utter.pitch = 1.15;
  utter.volume = 0.9;
  utter.lang = "en-IN";
  // Try to pick a natural female voice
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v => /female|zira|samantha|google.*in/i.test(v.name) && v.lang.startsWith("en"));
  if (preferred) utter.voice = preferred;
  else {
    const fallback = voices.find(v => v.lang.startsWith("en"));
    if (fallback) utter.voice = fallback;
  }
  if (onEnd) utter.onend = () => onEnd();
  
  // CRITICAL FIX: Keep utterance alive so Chromium garbage collector doesn't destroy it,
  // which prevents onend from firing and freezes the UI in 'speaking' state.
  (window as any).__birdyUtterance = utter;
  
  window.speechSynthesis.speak(utter);
}

/* ------------------------------------------------------------------ *
 * Voice-to-Cart Command Parser
 * Parses voice commands like "add the first one", "add number 2",
 * "add paneer tikka", "add two of the third"
 * ------------------------------------------------------------------ */
type VoiceCartAction = { index: number; qty: number; matchedName?: string } | null;

function parseVoiceCartCommand(
  transcript: string,
  results: { name: string }[]
): VoiceCartAction {
  if (!transcript || results.length === 0) return null;
  const t = transcript.toLowerCase().trim();

  // Must contain an "add" intent
  if (!/\b(add|want|get|order|give|put)\b/.test(t)) return null;

  // Parse quantity words
  const qtyMap: Record<string, number> = {
    one: 1, two: 2, three: 3, four: 4, five: 5,
    "1": 1, "2": 2, "3": 3, "4": 4, "5": 5,
  };
  let qty = 1;
  const qtyMatch = t.match(/\b(one|two|three|four|five|[1-5])\s+(?:of|x)\b/);
  if (qtyMatch) qty = qtyMap[qtyMatch[1]] ?? 1;

  // Parse ordinal references: "the first one", "number 2", "the second"
  const ordinals: Record<string, number> = {
    first: 0, "1st": 0, second: 1, "2nd": 1, third: 2, "3rd": 2,
    fourth: 3, "4th": 3, fifth: 4, "5th": 4, sixth: 5, "6th": 5,
    seventh: 6, "7th": 6, eighth: 7, "8th": 7,
  };

  for (const [word, idx] of Object.entries(ordinals)) {
    if (t.includes(word) && idx < results.length) {
      return { index: idx, qty };
    }
  }

  // Parse "number X"
  const numMatch = t.match(/\bnumber\s+(\d+)\b/);
  if (numMatch) {
    const idx = parseInt(numMatch[1], 10) - 1;
    if (idx >= 0 && idx < results.length) return { index: idx, qty };
  }

  // Fuzzy match against result dish names
  const words = t.split(/\s+/).filter(w => w.length > 2);
  let bestIdx = -1;
  let bestScore = 0;
  results.forEach((r, i) => {
    const name = r.name.toLowerCase();
    let score = 0;
    words.forEach(w => { if (name.includes(w)) score++; });
    if (score > bestScore) { bestScore = score; bestIdx = i; }
  });
  if (bestIdx >= 0 && bestScore >= 1) {
    return { index: bestIdx, qty, matchedName: results[bestIdx].name };
  }

  return null;
}

/** Check if transcript is a "checkout" intent */
function isCheckoutIntent(transcript: string): boolean {
  return /\b(checkout|check out|place order|done|that'?s? (?:all|it)|finish|proceed|go ahead|bag|cart)\b/i.test(transcript);
}

/** Check if transcript is a "yes, more" intent */
function isMoreIntent(transcript: string): boolean {
  return /\b(yes|yeah|more|another|else|also|and|something else|keep going)\b/i.test(transcript);
}
/* ------------------------------------------------------------------ *
 * Speech API Typings
 * ------------------------------------------------------------------ */
interface SpeechRecognitionEvent {
  results: {
    length: number;
    [index: number]: {
      [index: number]: { transcript: string };
      isFinal: boolean;
    };
  };
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onerror: ((this: SpeechRecognition, ev: Event & { error?: string }) => void) | null;
}

interface WindowWithSpeech extends Window {
  SpeechRecognition?: new () => SpeechRecognition;
  webkitSpeechRecognition?: new () => SpeechRecognition;
}

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
    words: ["sad", "down", "low", "rough day", "bad day", "tired", "exhausted", "stressed", "comfort food"],
    says: "Rough one. Warm, soft, no chewing required — comfort first.",
    wants: ["ramen", "noodle", "biryani", "dal", "pasta", "shake", "cheesecake", "soup", "pizza", "mac and cheese"],
  },
  {
    id: "happy",
    words: ["happy", "great", "celebrat", "promoted", "good news", "excited", "celebration"],
    says: "Then we're going somewhere worth it. Signature plates only.",
    wants: ["omakase", "wagyu", "ribeye", "truffle", "tasting", "pavlova", "sushi", "lobster"],
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
    wants: ["bowl", "berry", "cauliflower", "avocado", "toast", "yoghurt", "salad", "grilled"],
    minProtein: 14,
    maxKcal: 520,
  },
  {
    id: "spicy",
    words: ["spicy", "heat", "chilli", "chili", "hot food", "fiery"],
    says: "Heat it is. Bringing the chilli-forward end of the menu.",
    wants: ["chilli", "diavola", "rogan", "basil", "piccante", "garlic", "spicy"],
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
  {
    id: "late",
    words: ["working late", "midnight", "late night", "overtime"],
    says: "Burning the midnight oil. Quick bites coming right up.",
    wants: ["pizza", "wrap", "roll", "sandwich", "burger", "fries"],
  },
  {
    id: "hangover",
    words: ["hangover", "hungover", "greasy", "heavy", "headache"],
    says: "Rough morning? Heavy, greasy comfort to the rescue.",
    wants: ["burger", "pizza", "fries", "bacon", "cheese", "fried"],
  }
];

type ClarificationOption = {
  id: string;
  label: string;
  emoji: string;
  keywords: string[];
  response: string;
  minSpice?: number;
  maxKcal?: number;
};

type ClarificationTree = {
  id: string;
  triggers: string[];
  question: string;
  subtext: string;
  options: ClarificationOption[];
};

const CLARIFICATION_TREES: ClarificationTree[] = [
  {
    id: "spicy",
    triggers: ["spicy", "heat", "chilli", "chili", "hot food", "fiery", "angry", "frustrated", "rage", "mad"],
    question: "I hear that fiery energy! What kind of heat are you craving to hit the spot?",
    subtext: "Narrowing down your spice vibe ensures a guaranteed hit for your palate:",
    options: [
      { id: "indian", label: "Fiery Indian Spice & Masala", emoji: "🌶️", keywords: ["paneer", "tikka", "masala", "curry", "spicy", "rogan", "biryani"], response: "Got it! Bringing out the deep, aromatic fiery Indian spice hits:" },
      { id: "asian", label: "Tingly Asian & Sichuan Noodle", emoji: "🍜", keywords: ["ramen", "noodle", "chilli", "sui", "thai", "asian", "dimsum"], response: "Tingly, warming Asian broth and chilli noodles coming right up:" },
      { id: "bbq", label: "Sweet & Smoky BBQ Heat", emoji: "🍗", keywords: ["bbq", "smoky", "burger", "wings", "piccante", "diavola", "pepper"], response: "Sweet, smoky, savory heat loaded up:" },
      { id: "extreme", label: "Melt My Tongue (Max Spice)", emoji: "🔥", keywords: ["chilli", "diavola", "spicy", "hot", "garlic", "pepper"], minSpice: 2, response: "You asked for it! Maximum heat-rated dishes only:" }
    ],
  },
  {
    id: "comfort",
    triggers: ["sad", "down", "low", "rough day", "bad day", "tired", "exhausted", "stressed", "comfort food", "lonely", "relax", "rain"],
    question: "Long day, huh? Let's get you some comforting soul food to recharge. What sounds best?",
    subtext: "Pick your favorite comforting texture & aroma:",
    options: [
      { id: "soup_broth", label: "Warm Broth & Soothing Soup", emoji: "🍲", keywords: ["ramen", "soup", "khow suey", "noodle", "broth", "dal"], response: "Warm, soothing broth and comfort bowls:" },
      { id: "cheesy_warm", label: "Cheesy Pizza & Italian Pasta", emoji: "🧀", keywords: ["pizza", "cheese", "pasta", "mac and cheese", "burrata", "diavola"], response: "Rich, cheesy, melt-in-your-mouth Italian comfort:" },
      { id: "heavy_burger", label: "Juicy Gourmet Burger & Fries", emoji: "🍔", keywords: ["burger", "fries", "truffle", "bun", "sandwich", "crispy"], response: "Ultimate savory indulgence and comfort:" },
      { id: "sweet_treat", label: "Indulgent Sweet Dessert", emoji: "🍰", keywords: ["cheesecake", "tiramisu", "cake", "shake", "gelato", "chocolate"], response: "Sweet therapy! Handpicked top desserts around you:" }
    ],
  },
  {
    id: "light_gym",
    triggers: ["light", "healthy", "clean", "gym", "diet", "fit", "salad", "protein", "fat loss", "cut", "workout"],
    question: "Gains on your mind! How do you want to fuel your body today?",
    subtext: "Precision nutrition tailored to your workout goals:",
    options: [
      { id: "high_protein", label: "High Protein Muscle Fuel", emoji: "💪", keywords: ["chicken", "grilled", "protein", "egg", "salmon", "bowl", "tuna"], response: "High-protein, performance-optimized meals:" },
      { id: "low_cal", label: "Clean Green & Low-Cal (<450 kcal)", emoji: "🥗", keywords: ["salad", "green", "cauliflower", "avocado", "bowl", "fresh"], maxKcal: 450, response: "Strictly lean, nutrient-dense fresh bowls under 450 kcal:" },
      { id: "refreshing", label: "Smoothies & Superfood Bowls", emoji: "🍓", keywords: ["berry", "bowl", "yoghurt", "fruit", "smoothie", "acai"], response: "Refreshing, energizing superfood dishes:" }
    ],
  },
  {
    id: "sweet",
    triggers: ["sweet", "dessert", "sugar", "cake", "chocolate", "craving sugar", "ice cream", "waffle", "celebrat"],
    question: "Ooh, treating yourself! Which sweet indulgence are we feeling right now?",
    subtext: "Satisfy your cravings with zero disappointment:",
    options: [
      { id: "dark_choc", label: "Rich Dark Chocolate & Fudge", emoji: "🍫", keywords: ["chocolate", "brownie", "tiramisu", "fudge", "truffle"], response: "Decadent, rich chocolate treasures around you:" },
      { id: "creamy_cold", label: "Gelato & Velvety Shakes", emoji: "🍦", keywords: ["shake", "gelato", "cream", "vanilla", "sundae", "cold"], response: "Cold, velvety shakes and frozen gelato treats:" },
      { id: "baked_pastry", label: "Bakery Pastries & Artisan Cake", emoji: "🥧", keywords: ["cheesecake", "cupcake", "tart", "pavlova", "bakery"], response: "Freshly baked artisan pastries and signature cakes:" }
    ],
  },
  {
    id: "general",
    triggers: ["hungry", "food", "dinner", "lunch", "breakfast", "snack", "anything", "eat", "starving", "recommend", "craving"],
    question: "I'm ready to find your next unforgettable meal! Which cuisine or vibe is calling your name?",
    subtext: "Let's dial in the exact flavor profile you're craving:",
    options: [
      { id: "ind", label: "Authentic Indian & Masala", emoji: "🇮🇳", keywords: ["biryani", "masala", "paneer", "rogan", "curry", "tikka", "naan"], response: "Top authentic Indian and spiced flavors in your area:" },
      { id: "ita", label: "Italian Pizza & Rich Pasta", emoji: "🇮🇹", keywords: ["pizza", "pasta", "burrata", "truffle", "italian", "risotto"], response: "Handcrafted pizzas and rich Italian pastas:" },
      { id: "asi", label: "Asian Sushi & Warming Ramen", emoji: "🇯🇵", keywords: ["sushi", "ramen", "dimsum", "dumpling", "thai", "chinese", "miso"], response: "Fresh sushi rolls and aromatic Asian broths:" },
      { id: "amr", label: "Gourmet Burgers & Crispy Wraps", emoji: "🍔", keywords: ["burger", "wrap", "fries", "sandwich", "grill", "cheeseburger"], response: "Juicy, chef-prepared gourmet burgers and wraps:" }
    ],
  }
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
  onOpenCart,
}: {
  open: boolean;
  onClose: () => void;
  onOpenRestaurant: (id: string) => void;
  onOpenCart?: () => void;
}) {
  const { itemCount, subtotal, cartRestaurant, addItem } = useApp();
  const { effective, availableOf, reserve, track } = usePlatform();

  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState("");
  const [typed, setTyped] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [budget, setBudget] = useState(600);
  const [radius, setRadius] = useState(5.0);
  const [supported, setSupported] = useState(true);
  const [isThinking, setIsThinking] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [selectedOption, setSelectedOption] = useState<ClarificationOption | null>(null);
  const [skipClarification, setSkipClarification] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voicePhase, setVoicePhase] = useState<"idle" | "listening" | "clarifying" | "results" | "cart_listen" | "confirmed">("idle");
  const [lastSpoken, setLastSpoken] = useState("");
  const recRef = useRef<SpeechRecognition | null>(null);
  const resultsRef = useRef<Result[]>([]);

  /* ---- Speak helper bound to component lifecycle ---- */
  const speak = useCallback((text: string, onEnd?: () => void) => {
    setSpeaking(true);
    setLastSpoken(text);
    birdySpeak(text, () => {
      setSpeaking(false);
      onEnd?.();
    });
  }, []);

  /* ---- Voice-to-Cart handler ---- */
  const handleVoiceCartAction = useCallback((transcript: string) => {
    const action = parseVoiceCartCommand(transcript, resultsRef.current);
    if (action) {
      const dish = resultsRef.current[action.index];
      if (dish) {
        for (let i = 0; i < action.qty; i++) {
          const res = reserve(dish, 1);
          if (res.ok) {
            addItem(dish, dish.restaurantId);
            track(dish.id, "adds");
          }
        }
        const confirmText = `Added ${action.qty > 1 ? action.qty + " " : ""}${dish.name} to your bag! Would you like anything else, or shall we checkout?`;
        setHeard(confirmText);
        setVoicePhase("confirmed");
        speak(confirmText, () => {
          // Re-listen for more commands
          setVoicePhase("cart_listen");
          try { recRef.current?.start(); setListening(true); } catch {}
        });
      }
      return true;
    }

    if (isCheckoutIntent(transcript)) {
      speak("Opening your bag now!");
      setVoicePhase("idle");
      if (onOpenCart) {
        setTimeout(() => { onClose(); onOpenCart(); }, 600);
      }
      return true;
    }

    if (isMoreIntent(transcript)) {
      speak("Sure! Just tell me the number or name of the dish you want.", () => {
        try { recRef.current?.start(); setListening(true); } catch {}
      });
      return true;
    }

    return false;
  }, [speak, reserve, addItem, track, onOpenCart, onClose]);

  // Refs to access latest state in speech callbacks without recreating recognition
  const voicePhaseRef = useRef(voicePhase);
  useEffect(() => { voicePhaseRef.current = voicePhase; }, [voicePhase]);
  const cartHandlerRef = useRef(handleVoiceCartAction);
  useEffect(() => { cartHandlerRef.current = handleVoiceCartAction; }, [handleVoiceCartAction]);

  useEffect(() => {
    const win = window as WindowWithSpeech;
    const SR = win.SpeechRecognition ?? win.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = "en-IN";
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const text = Array.from({ length: e.results.length }, (_, i) => e.results[i])
        .map((r) => r[0].transcript)
        .join(" ");
      setHeard(text);
      if (e.results[e.results.length - 1].isFinal) {
        const finalText = e.results[e.results.length - 1][0].transcript.trim();
        
        // If we're in cart_listen phase, try to parse as cart command
        const currentPhase = voicePhaseRef.current;
        if (currentPhase === "cart_listen" || currentPhase === "confirmed") {
          const handled = cartHandlerRef.current(finalText);
          if (handled) return;
        }

        // Otherwise, treat as initial mood/food query
        setIsThinking(true);
        setTimeout(() => {
          setSubmitted(text);
          setIsThinking(false);
          setVoicePhase("results");
        }, 800);
      }
    };
    rec.onend = () => {
      setListening(false);
    };
    rec.onerror = (e: Event & { error?: string }) => {
      setListening(false);
      if (e.error === "not-allowed") {
        setErrorMsg("Microphone access denied. Try typing!");
      } else if (e.error !== "no-speech" && e.error !== "aborted") {
        setErrorMsg("Didn't catch that. Try again?");
      }
      setTimeout(() => setErrorMsg(""), 3000);
    };
    recRef.current = rec;
    return () => { rec.abort?.(); window.speechSynthesis?.cancel(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!submitted) return;
    const b = budgetFrom(submitted);
    if (b) setBudget(b);
    const r = radiusFrom(submitted);
    if (r) setRadius(r);
    setSelectedOption(null);
    setSkipClarification(false);
  }, [submitted]);

  const toggleMic = () => {
    if (!supported) return;
    window.speechSynthesis?.cancel();
    setSpeaking(false);
    setErrorMsg("");
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      setVoicePhase("idle");
    } else {
      setHeard("");
      setSubmitted("");
      setSelectedOption(null);
      setSkipClarification(false);
      setVoicePhase("listening");
      // Speak greeting, then start mic ONLY after TTS finishes.
      // If mic starts during TTS, it picks up the voice or times out due to silence.
      speak("Hey! Tell me how you're feeling or what you're craving today.", () => {
        try {
          recRef.current?.start();
          setListening(true);
        } catch {
          setErrorMsg("Microphone error");
        }
      });
    }
  };

  const mood = useMemo(() => {
    const t = submitted.toLowerCase();
    if (!t) return null;
    return MOODS.find((m) => m.words.some((w) => t.includes(w))) ?? null;
  }, [submitted]);

  const activeTree = useMemo(() => {
    if (!submitted) return null;
    const t = submitted.toLowerCase();
    const specific = CLARIFICATION_TREES.find((m) => m.triggers.some((w) => t.includes(w)));
    if (specific) return specific;
    // fallback to general cuisine tree if they typed a long prompt or food intent
    if (t.length >= 3) return CLARIFICATION_TREES.find((m) => m.id === "general") ?? null;
    return null;
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
        if (selectedOption?.minSpice && dish.spice < selectedOption.minSpice) return;
        if (selectedOption?.maxKcal && dish.nutrition.kcal > selectedOption.maxKcal) return;

        let score = 0;
        const hay = `${dish.name} ${dish.desc} ${r.cuisines.join(" ")}`.toLowerCase();
        mood?.wants.forEach((w) => {
          if (hay.includes(w)) score += 12;
        });
        // High-conversion reinforcement when user clarifies their exact craving
        if (selectedOption) {
          selectedOption.keywords.forEach((w) => {
            if (hay.includes(w)) score += 35;
          });
        }
        // direct words the person actually said
        t.split(/\s+/)
          .filter((w) => w.length > 3)
          .forEach((w) => {
            if (hay.includes(w)) score += 8;
          });
        if (mood?.id === "cheap") score += Math.round((budget - dish.price) / 25);
        if (mood?.id === "spicy" || selectedOption?.id === "extreme") score += dish.spice * 8;
        if (dish.bestseller) score += 4;
        score += Math.max(0, 6 - km * 1.2);
        score += r.rating;
        if (availableOf(dish) === 0) score -= 30;

        out.push({ ...dish, restaurantId: r.id, restaurantName: r.name, km, score });
      });
    });

    return out.sort((a, b) => b.score - a.score).slice(0, 8);
  }, [submitted, budget, radius, mood, selectedOption, effective, availableOf]);

  // Keep resultsRef in sync for voice-to-cart handler
  useEffect(() => { resultsRef.current = results; }, [results]);

  // Speak results aloud when they appear (only during voice-initiated flow)
  useEffect(() => {
    if (voicePhase !== "results" && voicePhase !== "clarifying") return;
    if (!submitted || results.length === 0) return;
    if (activeTree && !selectedOption && !skipClarification) return; // wait for clarification

    const top3 = results.slice(0, 3);
    const intro = selectedOption?.response || mood?.says || "Here's what I found for you.";
    const dishList = top3.map((r, i) =>
      `Number ${i + 1}: ${r.name} from ${r.restaurantName}, at ${r.price} rupees.`
    ).join(" ");
    const fullText = `${intro} ${dishList} Say the number or name to add it to your bag.`;

    speak(fullText, () => {
      setVoicePhase("cart_listen");
      try { recRef.current?.start(); setListening(true); } catch {}
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, selectedOption, skipClarification]);

  // Speak clarification questions aloud
  useEffect(() => {
    if (!submitted || !activeTree || selectedOption || skipClarification) return;
    if (voicePhase !== "results") return;
    setVoicePhase("clarifying");
    const optionLabels = activeTree.options.map(o => o.label).join(", or ");
    speak(`${activeTree.question} Your options are: ${optionLabels}. Which one sounds best?`, () => {
      try { recRef.current?.start(); setListening(true); } catch {}
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, activeTree, selectedOption, skipClarification]);

  const send = () => {
    if (!typed.trim()) return;
    const rateCheck = checkRateLimit("birdy_query", 8, 10);
    if (!rateCheck.permitted) {
      setErrorMsg(`Security Shield Throttled: Wait ${rateCheck.tryAgainIn}s before asking again.`);
      return;
    }
    if (!isPayloadSafe(typed)) {
      setErrorMsg("⚠️ Unsafe symbols or malformed syntax detected in input.");
      return;
    }
    const clean = sanitizeText(typed.trim());
    setIsThinking(true);
    setTimeout(() => {
      setSubmitted(clean);
      setHeard(clean);
      setIsThinking(false);
    }, 600);
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <div className="space-y-5 px-5 pt-1 pb-8">
        {/* Birdy's face */}
        <div className="flex items-center gap-3">
          <motion.div
            animate={
              isThinking
                ? { rotate: [0, -10, 10, -10, 10, 0], scale: 1.1 }
                : speaking
                ? { y: [0, -3, 0], scale: 1.05 }
                : results.length > 0 && submitted
                ? { y: [0, -6, 0], scale: 1.1 }
                : listening
                ? { y: [0, -4, 0] }
                : {}
            }
            transition={{ duration: isThinking ? 0.5 : speaking ? 0.6 : 0.9, repeat: isThinking || listening || speaking ? Infinity : 0 }}
          >
            <TrubitMark flying={listening || isThinking || speaking} className="h-11 text-white" />
          </motion.div>
          <div className="min-w-0">
            <p className="text-white font-semibold">Birdy AI Assistant</p>
            <p className="text-sm text-white/70">
              {isThinking
                ? "Analyzing flavor profile and best matches..."
                : speaking
                ? "🔊 Speaking..."
                : voicePhase === "cart_listen"
                ? "🎤 Listening — say a dish name or number to add it..."
                : voicePhase === "confirmed"
                ? "✅ Added to your bag!"
                : listening
                ? "Listening to your craving…"
                : selectedOption
                ? selectedOption.response
                : results.length > 0 && submitted && (!activeTree || skipClarification)
                ? "Here's what I picked for you based on your vibe!"
                : submitted && activeTree && !selectedOption && !skipClarification
                ? "Let's dial in the exact flavor you're feeling:"
                : submitted && results.length === 0
                ? "Hmm, nothing matched. Try adjusting your budget or radius."
                : mood
                ? mood.says
                : "Hey! Tell me your mood or what you're craving today 🐦"}
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
              speaking
                ? "border-purple-400/60 bg-purple-500/20 text-purple-300"
                : listening
                ? "border-white bg-white text-black"
                : "border-white/20 bg-white/[0.06] text-white disabled:opacity-40",
            )}
          >
            {speaking && (
              <>
                <motion.span
                  className="absolute inset-0 rounded-full bg-purple-400/25"
                  animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                />
                <motion.span
                  className="absolute inset-0 rounded-full bg-purple-400/15"
                  animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
                />
              </>
            )}
            {listening && !speaking && (
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
            {speaking
              ? <Volume2 className="relative size-7" />
              : supported
              ? <Mic className="relative size-7" />
              : <MicOff className="relative size-7" />}
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
            {errorMsg && (
              <motion.p
                key="err"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="max-w-[18rem] text-center text-red-400"
              >
                {errorMsg}
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
            placeholder="Tell Birdy what you're craving..."
            className="min-w-0 flex-1 bg-transparent text-white placeholder:text-white/30 outline-none"
          />
          <button onClick={send} className="shrink-0 text-white/50">
            <CornerDownLeft className="size-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 -mx-5 px-5 hide-scrollbar">
          {[
            "🔥 Something spicy",
            "🥗 Light & healthy",
            "🍕 Comfort food",
            "💰 Budget meal",
            "🎉 Celebration",
          ].map((s) => (
            <Chip
              key={s}
              className="whitespace-nowrap flex-shrink-0"
              onClick={() => {
                const plainText = s.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim();
                setTyped(plainText);
                setIsThinking(true);
                setTimeout(() => {
                  setSubmitted(plainText);
                  setHeard(plainText);
                  setIsThinking(false);
                }, 600);
              }}
            >
              {s}
            </Chip>
          ))}
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

        {/* Multi-Turn Conversational Clarification Dialog */}
        {submitted && activeTree && !selectedOption && !skipClarification && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
          >
            <Glass tone="dark" sheen className="border-white/25 bg-neutral-900/95 p-5 shadow-[0_15px_45px_rgba(0,0,0,0.95)]">
              <div className="flex items-start gap-3">
                <div className="grid size-9 shrink-0 place-items-center rounded-2xl bg-white text-black font-bold text-lg shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                  🐦
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white text-base leading-snug">{activeTree.question}</p>
                  <p className="mt-1 text-xs text-white/50">{activeTree.subtext}</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeTree.options.map((opt) => (
                  <motion.button
                    key={opt.id}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    onClick={() => setSelectedOption(opt)}
                    className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.07] p-3.5 text-left transition-all duration-200 hover:border-white/40 hover:bg-white/[0.15] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] cursor-pointer select-none"
                  >
                    <span className="text-2xl shrink-0">{opt.emoji}</span>
                    <span className="font-medium text-sm text-white/90 leading-tight">{opt.label}</span>
                  </motion.button>
                ))}
              </div>

              <div className="mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] font-medium text-amber-300/80">⚡ Boosts cart-to-order relevance</span>
                <button
                  onClick={() => setSkipClarification(true)}
                  className="text-xs font-semibold text-white/60 hover:text-white underline underline-offset-4 cursor-pointer"
                >
                  Skip to all matches →
                </button>
              </div>
            </Glass>
          </motion.div>
        )}

        {/* Active clarification choice indicator */}
        {submitted && selectedOption && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-between rounded-2xl border border-emerald-500/40 bg-emerald-950/50 p-3.5 px-4 shadow-lg backdrop-blur-xl"
          >
            <div className="flex items-center gap-2.5 text-sm text-emerald-300 font-medium truncate">
              <span className="text-lg">{selectedOption.emoji}</span>
              <span className="truncate">Dialed in for: <strong className="text-white font-bold">{selectedOption.label}</strong></span>
            </div>
            <button
              onClick={() => setSelectedOption(null)}
              className="shrink-0 text-xs text-white/70 hover:text-white underline underline-offset-4 cursor-pointer font-bold pl-3"
            >
              Change vibe
            </button>
          </motion.div>
        )}

        {/* Results */}
        {submitted && (!activeTree || selectedOption || skipClarification) && (
          <div className="space-y-3.5 pt-1">
            <div className="flex items-center justify-between px-1">
              <p className="tracking-[0.22em] text-[11px] font-bold text-white/50 uppercase">
                {results.length ? `${results.length} precision matches` : "Nothing fits"}
              </p>
              {selectedOption && <span className="text-[11px] font-medium text-emerald-400">✓ High conversion match</span>}
            </div>
            {results.length === 0 && (
              <Glass className="p-6 text-center">
                <p className="text-white font-medium">Nothing within {radius} km under {rupees(budget)}.</p>
                <p className="mt-1 text-xs text-white/50">Widen either dial above and I'll recalculate instantly.</p>
              </Glass>
            )}
            {results.map((r, i) => (
              <motion.div
                key={`${r.restaurantId}-${r.id}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Glass sheen sheenDelay={i * 0.4} className="flex items-start justify-between gap-3.5 p-4">
                  <FoodImage
                    angles={r.angles}
                    alt={r.name}
                    className="size-20 shrink-0 rounded-2xl shadow-md"
                  />
                  <div className="min-w-0 flex-1 pr-1">
                    <p className="truncate font-bold text-white text-base">{r.name}</p>
                    <p className="truncate text-xs font-medium text-white/50 mt-0.5">
                      {r.restaurantName} · {r.km} km
                    </p>
                    <div className="mt-1.5 flex items-baseline gap-2">
                      <span className="font-semibold text-white">{rupees(r.price)}</span>
                      <span className="text-white/30 line-through text-xs">
                        {rupees(listedElsewhere(r.price))}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StockPill dish={r} />
                      <span className="text-xs text-white/45 font-medium">{r.nutrition.kcal} kcal</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end justify-between gap-3 pt-0.5">
                    <Stepper dish={r} restaurantId={r.restaurantId} />
                    <button
                      onClick={() => {
                        onClose();
                        onOpenRestaurant(r.restaurantId);
                      }}
                      className="text-white/60 text-[11px] font-semibold tracking-wider uppercase hover:text-white transition-colors underline underline-offset-4 cursor-pointer pt-1"
                    >
                      Full Menu →
                    </button>
                  </div>
                </Glass>
              </motion.div>
            ))}
          </div>
        )}

        {/* Live floating cart preview inside Birdy when user adds dishes */}
        <AnimatePresence>
          {itemCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="sticky bottom-3 z-50 pt-2"
            >
              <Glass
                whileTap={{ scale: 0.98 }}
                whileHover={{ y: -2 }}
                onClick={() => {
                  if (onOpenCart) onOpenCart();
                }}
                className="flex cursor-pointer items-center gap-4 border-white/25 bg-neutral-900/95 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.95)]"
              >
                <Sheen duration={2.4} repeatDelay={3.5} />
                <div className="relative flex size-11 items-center justify-center rounded-2xl bg-white text-black">
                  <ShoppingBag className="size-5" />
                  <motion.span
                    key={itemCount}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-black border border-white text-[11px] font-bold text-white"
                  >
                    {itemCount}
                  </motion.span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">
                    {itemCount} item{itemCount > 1 ? "s" : ""} · {rupees(subtotal)}
                  </p>
                  <p className="truncate text-xs text-white/60">{cartRestaurant?.name ?? "Trubit Partner"}</p>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black shadow-[0_0_20px_rgba(255,255,255,0.35)]">
                  View Bag <ChevronRight className="size-4" />
                </span>
              </Glass>
            </motion.div>
          )}
        </AnimatePresence>
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
