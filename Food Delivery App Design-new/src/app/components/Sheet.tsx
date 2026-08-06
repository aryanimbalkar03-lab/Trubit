import { motion, AnimatePresence } from "motion/react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Sheen, cx } from "./glass";
import { useFrame } from "./frame-context";

/** Drag-to-dismiss bottom sheet, constrained to the phone frame. */
export function Sheet({
  open,
  onClose,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  const frame = useFrame();

  const content = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34, mass: 0.7 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.45 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 600) onClose();
            }}
            className={cx(
              "absolute inset-x-0 bottom-0 z-50 flex max-h-[88%] flex-col overflow-hidden rounded-t-[2rem] border-t border-white/15 bg-[#0b0b0b]/95 backdrop-blur-3xl",
              className,
            )}
          >
            <Sheen duration={3.4} repeatDelay={6} />
            <div className="relative flex shrink-0 items-center justify-between px-5 pt-3 pb-1">
              <span className="mx-auto h-1 w-10 rounded-full bg-white/25" />
              <button
                onClick={onClose}
                className="absolute top-3 right-4 grid size-8 place-items-center rounded-full border border-white/12 bg-white/[0.06]"
                aria-label="Close"
              >
                <X className="size-3.5 text-white" />
              </button>
            </div>
            <div className="scrollbar-none relative min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return frame ? createPortal(content, frame) : content;
}
