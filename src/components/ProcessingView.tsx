import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Brain, CheckCircle, Sparkle } from "@phosphor-icons/react";

const STAGES = [
  "parsing garment…",
  "detecting category…",
  "analyzing styling…",
  "collecting live trend signals…",
  "evaluating opportunity…",
  "generating recommendation…",
] as const;

const QUIPS = [
  "still life → structured json → buyer poetry",
  "cross-checking the runway against your doors",
  "translating pixels into plan math",
  "one more pass on evidence links…",
] as const;

type Props = {
  active: boolean;
};

export function ProcessingView({ active }: Props) {
  const [idx, setIdx] = useState(0);
  const [quip, setQuip] = useState(0);

  useEffect(() => {
    if (!active) {
      setIdx(0);
      return;
    }
    const id = window.setInterval(() => {
      setIdx((i) => Math.min(i + 1, STAGES.length - 1));
    }, 2800);
    return () => window.clearInterval(id);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => {
      setQuip((q) => (q + 1) % QUIPS.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, [active]);

  useEffect(() => {
    if (active) {
      setIdx(0);
      setQuip(0);
    }
  }, [active]);

  return (
    <motion.div
      className="processing-notion"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 28 }}
    >
      <div className="processing-notion-orbit" aria-hidden>
        <motion.div
          className="processing-notion-sparkle"
          animate={{ rotate: [0, 12, -8, 0], scale: [1, 1.06, 1] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkle size={44} weight="duotone" />
        </motion.div>
        <motion.div
          className="processing-notion-brain"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Brain size={36} weight="thin" />
        </motion.div>
      </div>

      <h2 className="processing-notion-title">running your analysis</h2>

      <AnimatePresence mode="wait">
        <motion.p
          key={quip}
          className="processing-notion-quip"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
        >
          {QUIPS[quip]}
        </motion.p>
      </AnimatePresence>

      <div className="processing-notion-bar-track">
        <motion.div
          className="processing-notion-bar-fill"
          initial={{ scaleX: 0.1 }}
          animate={{
            scaleX: Math.max(0.12, (idx + 1) / STAGES.length),
          }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
          style={{ transformOrigin: "left center" }}
        />
      </div>

      <ul className="processing-notion-list">
        {STAGES.map((label, i) => {
          const done = i < idx;
          const current = i === idx;
          return (
            <motion.li
              key={label}
              className={`processing-notion-item${done ? " done" : ""}${current ? " active" : ""}`}
              initial={false}
              animate={{
                opacity: done || current ? 1 : 0.45,
                x: current ? 4 : 0,
              }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              {done ? (
                <CheckCircle className="processing-notion-check" size={18} weight="fill" aria-hidden />
              ) : (
                <span className="processing-notion-dot" aria-hidden />
              )}
              <span>{label}</span>
            </motion.li>
          );
        })}
      </ul>

      <p className="processing-notion-foot">
        models are reading the still and your plan — usually under a minute.
      </p>
    </motion.div>
  );
}
