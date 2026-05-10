import { useEffect, useState } from "react";

const STAGES = [
  "Parsing garment…",
  "Detecting category…",
  "Analyzing styling…",
  "Collecting live trend signals…",
  "Evaluating opportunity…",
  "Generating recommendation…",
] as const;

type Props = {
  active: boolean;
};

export function ProcessingView({ active }: Props) {
  const [idx, setIdx] = useState(0);

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
    if (active) setIdx(0);
  }, [active]);

  return (
    <div className="card" style={{ maxWidth: 520, margin: "0 auto" }}>
      <div style={{ padding: "2rem" }}>
        <h2
          style={{
            fontFamily: "var(--serif)",
            fontSize: "1.35rem",
            fontWeight: 400,
            margin: "0 0 1.25rem",
          }}
        >
          Processing
        </h2>
        <ul className="processing-list">
          {STAGES.map((label, i) => {
            const done = i < idx;
            const current = i === idx;
            return (
              <li
                key={label}
                className={`processing-item${done ? " done" : ""}${current ? " active" : ""}`}
              >
                <span className="dot" aria-hidden />
                {label}
              </li>
            );
          })}
        </ul>
        <p
          style={{
            fontSize: "0.8rem",
            color: "var(--text-dim)",
            margin: "1.25rem 0 0",
          }}
        >
          Models are evaluating the image and your assortment context. This may take
          a minute.
        </p>
      </div>
    </div>
  );
}
