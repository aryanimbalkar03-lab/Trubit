const fs = require('fs');

const path = 'C:\\Users\\ARYAN NIMBALKAR\\OneDrive\\Documents\\TRUBIT\\Food Delivery App Design-new\\src\\app\\components\\Birdy.tsx';
let content = fs.readFileSync(path, 'utf8');

const lines = content.split(/\r?\n/);

// Block 1: replace lines 15-48 (index 14 to 47)
const block1 = `/* ------------------------------------------------------------------ *
 * Birdy Text-to-Speech Engine — Sequential, No-Echo Design
 *
 * RULES:
 * 1. Never run mic and TTS at the same time (eliminates echo loops).
 * 2. Lock to one voice on first use (no man→woman switching).
 * 3. Always: speak → finish → THEN start mic.
 * ------------------------------------------------------------------ */

let _cachedVoice: SpeechSynthesisVoice | null = null;
let _voiceResolved = false;

function resolveBirdyVoice(): SpeechSynthesisVoice | null {
  if (_voiceResolved) return _cachedVoice;
  const voices = window.speechSynthesis?.getVoices() ?? [];
  if (voices.length === 0) return null; // not loaded yet
  _voiceResolved = true;
  // Prefer a natural English female voice
  _cachedVoice =
    voices.find(v => /female|zira|samantha/i.test(v.name) && v.lang.startsWith("en")) ??
    voices.find(v => /google.*uk/i.test(v.name) && v.lang.startsWith("en")) ??
    voices.find(v => v.lang.startsWith("en-") && v.localService) ??
    voices.find(v => v.lang.startsWith("en")) ??
    null;
  return _cachedVoice;
}

function birdySpeak(text: string, onEnd?: () => void): void {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    onEnd?.();
    return;
  }
  // Always cancel any ongoing speech first
  window.speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1.05;
  utter.pitch = 1.12;
  utter.volume = 0.92;
  utter.lang = "en-IN";

  const voice = resolveBirdyVoice();
  if (voice) utter.voice = voice;

  utter.onend = () => {
    (window as any).__birdyUtterance = null;
    onEnd?.();
  };
  utter.onerror = () => {
    (window as any).__birdyUtterance = null;
    onEnd?.();
  };

  // Prevent Chrome GC from killing the utterance before it finishes
  (window as any).__birdyUtterance = utter;
  window.speechSynthesis.speak(utter);
}

/** Immediately stop Birdy from speaking. */
function birdyShutUp(): void {
  window.speechSynthesis?.cancel();
  (window as any).__birdyUtterance = null;
}`;

// Block 2: replace lines 332-669 (index 331 to 668)
const block2 = `export function Birdy({
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
  // Guards to prevent duplicate speech triggers
  const hasSpokenResultsRef = useRef(false);
  const hasSpokenClarifyRef = useRef(false);

  /* ---- Warm up TTS voices on mount ---- */
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        _voiceResolved = false; // re-resolve when voices change
        resolveBirdyVoice();
      };
    }
  }, []);

  /* ---- Core helpers ---- */
  const stopMic = useCallback(() => {
    try { recRef.current?.stop(); } catch {}
    setListening(false);
  }, []);

  const startMic = useCallback(() => {
    try {
      recRef.current?.start();
      setListening(true);
    } catch {
      setErrorMsg("Microphone error — try again.");
      setTimeout(() => setErrorMsg(""), 3000);
    }
  }, []);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    stopMic(); // NEVER run mic during TTS
    setSpeaking(true);
    setLastSpoken(text);
    birdySpeak(text, () => {
      setSpeaking(false);
      onEnd?.();
    });
  }, [stopMic]);

  /** Speak text, then automatically start mic when done */
  const sayThenListen = useCallback((text: string) => {
    speak(text, () => {
      startMic();
    });
  }, [speak, startMic]);

  /* ---- Voice-to-Cart handler (via ref for stable closure) ---- */
  const handleVoiceCartAction = useCallback((transcript: string): boolean => {
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
        const confirmText = \`Done! Added \${action.qty > 1 ? action.qty + " " : ""}\${dish.name} to your bag. Want anything else, or shall I open checkout?\`;
        setHeard(confirmText);
        setVoicePhase("confirmed");
        sayThenListen(confirmText);
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
      sayThenListen("Sure! Just tell me the number or name of the dish you'd like.");
      return true;
    }

    return false;
  }, [sayThenListen, speak, reserve, addItem, track, onOpenCart, onClose]);

  const cartHandlerRef = useRef(handleVoiceCartAction);
  useEffect(() => { cartHandlerRef.current = handleVoiceCartAction; }, [handleVoiceCartAction]);
  const voicePhaseRef = useRef(voicePhase);
  useEffect(() => { voicePhaseRef.current = voicePhase; }, [voicePhase]);

  /* ---- Initialize SpeechRecognition ONCE ---- */
  useEffect(() => {
    const win = window as WindowWithSpeech;
    const SR = win.SpeechRecognition ?? win.webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }
    const rec = new SR();
    rec.continuous = false;   // one utterance at a time — prevents echo
    rec.interimResults = true;
    rec.lang = "en-IN";

    rec.onresult = (e: SpeechRecognitionEvent) => {
      // Collect just the latest result's transcript
      const lastResult = e.results[e.results.length - 1];
      const text = lastResult[0].transcript;
      setHeard(text);

      if (lastResult.isFinal) {
        const finalText = text.trim();
        if (!finalText) return;

        // If we're in cart phase, try cart actions first
        const phase = voicePhaseRef.current;
        if (phase === "cart_listen" || phase === "confirmed") {
          const handled = cartHandlerRef.current(finalText);
          if (handled) return;
        }

        // Otherwise treat as mood/food query
        setIsThinking(true);
        setTimeout(() => {
          hasSpokenResultsRef.current = false;
          hasSpokenClarifyRef.current = false;
          setSubmitted(finalText);
          setIsThinking(false);
          setVoicePhase("results");
        }, 600);
      }
    };

    rec.onend = () => {
      setListening(false);
    };

    rec.onerror = (e: Event & { error?: string }) => {
      setListening(false);
      if (e.error === "not-allowed") {
        setErrorMsg("Microphone access denied. Please allow mic access and try again.");
      } else if (e.error !== "no-speech" && e.error !== "aborted") {
        setErrorMsg("Didn't catch that — try again?");
      }
      setTimeout(() => setErrorMsg(""), 3000);
    };

    recRef.current = rec;
    return () => { rec.abort?.(); birdyShutUp(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Extract budget/radius from speech ---- */
  useEffect(() => {
    if (!submitted) return;
    const b = budgetFrom(submitted);
    if (b) setBudget(b);
    const r = radiusFrom(submitted);
    if (r) setRadius(r);
    setSelectedOption(null);
    setSkipClarification(false);
  }, [submitted]);

  /* ---- Mic toggle with barge-in ---- */
  const toggleMic = () => {
    if (!supported) return;
    setErrorMsg("");

    if (speaking) {
      // BARGE-IN: User tapped mic while Birdy was speaking → stop her and listen
      birdyShutUp();
      setSpeaking(false);
      startMic();
      return;
    }

    if (listening) {
      // User tapped mic while listening → stop listening
      stopMic();
      setVoicePhase("idle");
      return;
    }

    // Fresh start
    setHeard("");
    setSubmitted("");
    setSelectedOption(null);
    setSkipClarification(false);
    hasSpokenResultsRef.current = false;
    hasSpokenClarifyRef.current = false;
    setVoicePhase("listening");
    sayThenListen("Hey! Tell me how you're feeling or what you're craving today.");
  };

  /* ---- Derived state ---- */
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
        const hay = \`\${dish.name} \${dish.desc} \${r.cuisines.join(" ")}\`.toLowerCase();
        mood?.wants.forEach((w) => {
          if (hay.includes(w)) score += 12;
        });
        if (selectedOption) {
          selectedOption.keywords.forEach((w) => {
            if (hay.includes(w)) score += 35;
          });
        }
        t.split(/\\s+/)
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

  // Keep resultsRef in sync
  useEffect(() => { resultsRef.current = results; }, [results]);

  /* ---- Speak clarification question (triggered once when tree activates) ---- */
  useEffect(() => {
    if (!submitted || !activeTree || selectedOption || skipClarification) return;
    if (voicePhase !== "results") return;
    if (hasSpokenClarifyRef.current) return;
    hasSpokenClarifyRef.current = true;
    setVoicePhase("clarifying");
    const optionLabels = activeTree.options.map(o => o.label).join(", or ");
    sayThenListen(\`\${activeTree.question} Your options are: \${optionLabels}. Which one sounds best?\`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitted, activeTree, selectedOption, skipClarification, voicePhase]);

  /* ---- Speak results (triggered once when results appear) ---- */
  useEffect(() => {
    if (voicePhase !== "results" && voicePhase !== "clarifying") return;
    if (!submitted || results.length === 0) return;
    if (activeTree && !selectedOption && !skipClarification) return; // wait for clarification first
    if (hasSpokenResultsRef.current) return;
    hasSpokenResultsRef.current = true;

    const top3 = results.slice(0, 3);
    const intro = selectedOption?.response || mood?.says || "Here's what I found for you.";
    const dishList = top3.map((r, i) =>
      \`Number \${i + 1}: \${r.name} from \${r.restaurantName}, at \${r.price} rupees.\`
    ).join(" ");
    const fullText = \`\${intro} \${dishList} Say a number or dish name to add it, or tap the mic to interrupt me anytime.\`;

    setVoicePhase("cart_listen");
    sayThenListen(fullText);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results, selectedOption, skipClarification, voicePhase]);

  const send = () => {
    if (!typed.trim()) return;
    const rateCheck = checkRateLimit("birdy_query", 8, 10);
    if (!rateCheck.permitted) {
      setErrorMsg(\`Security Shield Throttled: Wait \${rateCheck.tryAgainIn}s before asking again.\`);
      return;
    }
    if (!isPayloadSafe(typed)) {
      setErrorMsg("⚠️ Unsafe symbols or malformed syntax detected in input.");
      return;
    }
    const clean = sanitizeText(typed.trim());
    setIsThinking(true);
    hasSpokenResultsRef.current = false;
    hasSpokenClarifyRef.current = false;
    setTimeout(() => {
      setSubmitted(clean);
      setHeard(clean);
      setIsThinking(false);
    }, 600);
  };`;

// Replace parts
const part1 = lines.slice(0, 14).join('\n');
const part2 = lines.slice(48, 331).join('\n');
const part3 = lines.slice(669).join('\n');

const result = [part1, block1, part2, block2, part3].join('\n');

fs.writeFileSync(path, result, 'utf8');
console.log('File successfully rewritten');
