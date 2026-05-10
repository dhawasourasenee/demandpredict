import { motion } from "framer-motion";
import type { ComponentType, CSSProperties, ReactNode } from "react";

export type JournalTone = "lavender" | "mint" | "peach" | "sky";

type DoodleC = ComponentType<{
  ink?: string;
  accent?: string;
  style?: CSSProperties;
  className?: string;
}>;

const journalHover = {
  whileHover: {
    y: -8,
    boxShadow:
      "0 24px 56px rgba(99, 102, 241, 0.16), 0 12px 24px rgba(15, 23, 42, 0.08)",
    borderColor: "rgba(129, 140, 248, 0.45)",
    transition: { type: "spring" as const, stiffness: 360, damping: 26 },
  },
  whileTap: { scale: 0.995 },
  transition: { type: "spring" as const, stiffness: 400, damping: 30 },
};

type Props = {
  children: ReactNode;
  tone?: JournalTone;
  doodle?: DoodleC;
  doodleInk?: string;
  doodleAccent?: string;
  className?: string;
};

export function ReportJournalCard({
  children,
  tone = "lavender",
  doodle: Doodle,
  doodleInk = "#4a4e69",
  doodleAccent = "#818cf8",
  className = "",
}: Props) {
  return (
    <motion.div
      className={`report-journal-card report-journal-card--${tone} ${className}`.trim()}
      initial={false}
      {...journalHover}
    >
      {Doodle ? (
        <div className="report-journal-doodle" aria-hidden>
          <Doodle
            ink={doodleInk}
            accent={doodleAccent}
            style={{ width: 68, height: "auto", maxHeight: 76, display: "block" }}
          />
        </div>
      ) : null}
      <div className="report-journal-inset">{children}</div>
    </motion.div>
  );
}
