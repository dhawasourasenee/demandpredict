import { motion } from "framer-motion";
import {
  Calculator,
  ChartLineUp,
  FlowerTulip,
} from "@phosphor-icons/react";

type Props = {
  onFile: (file: File) => void;
};

const tileHover = {
  whileHover: {
    y: -5,
    transition: { type: "spring" as const, stiffness: 420, damping: 22 },
  },
};

const tileSpring = {
  type: "spring" as const,
  stiffness: 380,
  damping: 28,
};

function mosaicDateParts() {
  const now = new Date();
  const weekday = now
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase();
  const day = String(now.getDate()).padStart(2, "0");
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const start = new Date(now.getFullYear(), 0, 1);
  const dayOfYear =
    Math.floor((now.getTime() - start.getTime()) / 86400000) + 1;
  return { weekday, day, month, dayOfYear };
}

export function LandingUpload({ onFile }: Props) {
  const { weekday, day, month, dayOfYear } = mosaicDateParts();

  return (
    <div className="landing-mosaic">
      <motion.section
        className="mosaic-tile mosaic-tile-hero"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...tileSpring, delay: 0 }}
        {...tileHover}
      >
        <p className="landing-kicker">
          <FlowerTulip className="mosaic-icon" size={22} weight="thin" aria-hidden />
          <span>ai-powered · vision + live signals</span>
        </p>
        <h1 className="landing-title">
          drop a garment still — we’ll chart the full opportunity story.
        </h1>
        <p className="landing-lede-accent">
          <span className="text-accent-em">commercial clarity</span>
          <span className="landing-lede-accent-rest">
            {" "}
            without the spreadsheet fog.
          </span>
        </p>
        <p className="landing-sub">
          buying-room narrative, layered like a mood board — not another sterile
          dashboard.
        </p>
      </motion.section>

      <motion.section
        className="mosaic-tile mosaic-tile-tilt"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...tileSpring, delay: 0.06 }}
        {...tileHover}
      >
        <div className="mosaic-tilt-inner">
          <div className="mosaic-drop-card">
            <div className="mosaic-date-row">
              <div className="mosaic-date-left">
                <FlowerTulip className="mosaic-icon" size={20} weight="thin" aria-hidden />
                <span>
                  {weekday}, {day}.{month}
                </span>
              </div>
              <span className="mosaic-counter">{dayOfYear}/365</span>
            </div>
            <div className="mosaic-lavender-panel">
              <div className="landing-upload-callout">
                how was your runway day? drop the still. 🌷
              </div>
              <label className="upload-zone upload-zone-wrap">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onFile(f);
                    e.target.value = "";
                  }}
                />
                <div>
                  <div className="landing-upload-callout mosaic-upload-h2">
                    upload a garment image
                  </div>
                  <div className="landing-upload-meta mosaic-upload-meta">
                    sketches, product, runway, cad, mannequin — all welcome
                  </div>
                  <div className="upload-hint mosaic-upload-hint">
                    we read silhouette, wash, archetype, and trend tension against your
                    plan.
                  </div>
                </div>
              </label>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section
        className="mosaic-tile mosaic-tile-feature"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...tileSpring, delay: 0.12 }}
        {...tileHover}
      >
        <p className="mosaic-feature-eyebrow">search-backed signals</p>
        <h2 className="mosaic-feature-title">live trend tension</h2>
        <p className="mosaic-feature-body">
          momentum, saturation, and regional fit scored like a buyer’s sticky notes —
          evidence-first, never generic.
        </p>
        <ChartLineUp className="mosaic-feature-icon" size={40} weight="thin" aria-hidden />
      </motion.section>

      <motion.section
        className="mosaic-tile mosaic-tile-feature"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...tileSpring, delay: 0.18 }}
        {...tileHover}
      >
        <p className="mosaic-feature-eyebrow">plan-aware math</p>
        <h2 className="mosaic-feature-title">assortment + revenue gap</h2>
        <p className="mosaic-feature-body">
          mix, units, and sell-through drive incremental revenue — reconciled to your
          season and door count.
        </p>
        <Calculator className="mosaic-feature-icon" size={40} weight="thin" aria-hidden />
      </motion.section>
    </div>
  );
}
