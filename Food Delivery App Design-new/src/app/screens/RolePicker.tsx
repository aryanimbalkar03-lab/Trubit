import { motion } from "motion/react";
import { UtensilsCrossed, Bike, Store, ArrowRight } from "lucide-react";
import { Glass, Sheen } from "../components/glass";
import { TrubitMark } from "../components/Logo";
import { usePlatform, type Role } from "../store/platform";

const CHOICES: {
  role: Role;
  icon: typeof Bike;
  title: string;
  sub: string;
  proof: string;
}[] = [
  {
    role: "user",
    icon: UtensilsCrossed,
    title: "I want to eat",
    sub: "Order in, or book a table and eat there.",
    proof: "Menu prices, 30–40% below the other apps",
  },
  {
    role: "rider",
    icon: Bike,
    title: "I want to ride",
    sub: "Pick your own shifts. Every rupee itemised.",
    proof: "₹35 base + ₹9/km + surge + 100% of tips",
  },
  {
    role: "partner",
    icon: Store,
    title: "I have a restaurant",
    sub: "List it in minutes. Keep what you earn.",
    proof: "0% commission. Flat ₹9 per order, that's all",
  },
];

export function RolePicker() {
  const { setRole } = usePlatform();

  return (
    <div className="relative flex min-h-full flex-col justify-center px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-10 text-center"
      >
        <TrubitMark flying className="mx-auto h-20 text-white" />
        <h1 className="mt-6 text-white">What brings{"\n"}you to Trubit?</h1>
        <p className="mt-3 text-white/45">
          Pick one to start. You can hold all three — riders order dinner, owners ride weekends.
        </p>
      </motion.div>

      <div className="space-y-4">
        {CHOICES.map((c, i) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.role}
              initial={{ opacity: 0, y: 26, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.15 + i * 0.1, duration: 0.55, ease: [0.22, 0.9, 0.25, 1] }}
            >
              <Glass
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setRole(c.role)}
                className="cursor-pointer p-5"
              >
                <Sheen duration={3.2} repeatDelay={4} delay={i * 0.9} />
                <div className="flex items-center gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-white/12 bg-white/[0.06]">
                    <Icon className="size-5 text-white" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-white">{c.title}</p>
                    <p className="mt-0.5 text-white/45">{c.sub}</p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-white/40" />
                </div>
                <p className="mt-4 border-t border-white/[0.07] pt-3 text-white/35">{c.proof}</p>
              </Glass>
            </motion.div>
          );
        })}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-10 text-center text-white/25"
      >
        One account. Switch hats any time from your profile.
      </motion.p>
    </div>
  );
}
