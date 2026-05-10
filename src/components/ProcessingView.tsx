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
      <div className="page-card-inner">
        <h2 className="processing-title">processing your dossier…</h2>
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
            fontSize: "0.82rem",
            color: "var(--text-dim)",
            margin: "1.25rem 0 0",
            fontFamily: "var(--mono)",
          }}
        >
          models are reading the still and your plan — give it up to a minute.
        </p>
      </div>
    </div>
  );
}
