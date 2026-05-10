type Point = { date: string; index_value: number };

type Props = {
  title: string;
  subtitle: string;
  points: Point[];
};

function shortLabel(iso: string): string {
  const d = new Date(iso + "T12:00:00Z");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function MomentumChart({ title, subtitle, points }: Props) {
  if (!points.length) return null;

  const gradId = `momentumArea-${points[0]?.date ?? "chart"}-${points.length}`;

  const w = 640;
  const h = 200;
  const padL = 44;
  const padR = 16;
  const padT = 24;
  const padB = 36;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  const vals = points.map((p) => p.index_value);
  const minY = Math.min(40, Math.min(...vals) - 5);
  const maxY = Math.max(100, Math.max(...vals) + 5);
  const yScale = (v: number) =>
    padT + innerH - ((v - minY) / (maxY - minY)) * innerH;
  const xScale = (i: number) =>
    padL + (i / Math.max(1, points.length - 1)) * innerW;

  const lineD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xScale(i).toFixed(1)} ${yScale(p.index_value).toFixed(1)}`)
    .join(" ");

  const areaD = `${lineD} L ${xScale(points.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${padL.toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;

  const ticks = [minY, minY + (maxY - minY) * 0.25, minY + (maxY - minY) * 0.5, minY + (maxY - minY) * 0.75, maxY].map(
    (v) => Math.round(v)
  );

  return (
    <div className="momentum-chart-wrap">
      <h3 className="momentum-chart-title">{title}</h3>
      <p className="momentum-chart-sub">{subtitle}</p>
      <svg
        className="momentum-chart-svg"
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={title}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(37, 99, 235, 0.22)" />
            <stop offset="100%" stopColor="rgba(37, 99, 235, 0.02)" />
          </linearGradient>
        </defs>

        {ticks.map((tv) => {
          const y = yScale(tv);
          return (
            <g key={tv}>
              <line
                x1={padL}
                y1={y}
                x2={w - padR}
                y2={y}
                stroke="rgba(30,64,175,0.08)"
                strokeWidth={1}
              />
              <text
                x={padL - 8}
                y={y + 4}
                textAnchor="end"
                fill="var(--text-dim)"
                fontSize={10}
                fontFamily="var(--mono)"
              >
                {tv}
              </text>
            </g>
          );
        })}

        <path d={areaD} fill={`url(#${gradId})`} />
        <path
          d={lineD}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2.25}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {points.map((p, i) => (
          <circle
            key={p.date}
            cx={xScale(i)}
            cy={yScale(p.index_value)}
            r={4}
            fill="var(--surface)"
            stroke="var(--accent)"
            strokeWidth={2}
          />
        ))}

        {points.map((p, i) => (
          <text
            key={`lbl-${p.date}`}
            x={xScale(i)}
            y={h - 10}
            textAnchor="middle"
            fill="var(--text-muted)"
            fontSize={9}
            fontFamily="var(--mono)"
          >
            {shortLabel(p.date)}
          </text>
        ))}
      </svg>
    </div>
  );
}
