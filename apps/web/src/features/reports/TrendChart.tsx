import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type Pt = {
  period: string;
  trend_index: number;
  confidence_low: number;
  confidence_high: number;
  planned_mix_overlay: number;
  recommended_window_low: number;
  recommended_window_high: number;
  estimated: boolean;
  label?: string;
};

function monthTick(lab: string) {
  const p = lab.split("-");
  if (p.length < 2) return lab;
  const y = Number(p[0]);
  const m = Number(p[1]);
  if (!y || !m) return lab;
  const d = new Date(y, m - 1, 1);
  const mo = d.toLocaleDateString("en-US", { month: "short" });
  if (m === 1) return String(y);
  return mo;
}

type Props = { data: Pt[]; itemLabel: string };

export default function TrendChart({ data, itemLabel }: Props) {
  const yMin = Math.max(
    0,
    Math.min(...data.map((d) => d.confidence_low)) - 1,
  );
  const yMax = Math.min(100, Math.max(...data.map((d) => d.confidence_high)) + 2);

  const mid = Math.max(1, Math.floor(data.length / 5));
  const oppStart = data[mid]?.label;
  const oppEnd = data[data.length - 1]?.label;

  const bandLow =
    data.length > 0
      ? Math.min(...data.map((d) => d.recommended_window_low))
      : 0;
  const bandHigh =
    data.length > 0
      ? Math.max(...data.map((d) => d.recommended_window_high))
      : 100;

  return (
    <div className="w-full px-2">
      <div className="mb-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-neutral-700">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-0.5 w-6 bg-[#1e88e5]" />
          {itemLabel} trendline
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-3 w-5 rounded-sm bg-[#c5cae9] opacity-80" />
          Confidence range
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-3 w-5 rounded-sm bg-[#c8e6c9]" />
          Your opportunity
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-0 w-6 border-t-2 border-dashed border-accent-green" />
          Opportunity floor
        </span>
      </div>
      <div className="h-[340px] w-full">
        <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ececec" vertical={false} />
          <XAxis dataKey="label" tickFormatter={monthTick} tick={{ fill: "#9e9e9e", fontSize: 11 }} axisLine={{ stroke: "#e0e0e0" }} />
          <YAxis
            domain={[Math.floor(yMin), Math.ceil(yMax)]}
            tick={{ fill: "#9e9e9e", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            label={{ value: "Assortment Mix %", angle: -90, position: "insideLeft", style: { fill: "#757575", fontSize: 11 } }}
          />
          <Tooltip
            formatter={(v: number) => [`${typeof v === "number" ? v.toFixed(1) : v}%`, ""]}
            labelFormatter={(lab) => `Period ${lab}`}
            contentStyle={{ fontSize: 12 }}
          />
          {oppStart && oppEnd && (
            <ReferenceArea
              x1={oppStart}
              x2={oppEnd}
              y1={bandLow}
              y2={bandHigh}
              fill="#c8e6c9"
              fillOpacity={0.55}
              strokeOpacity={0}
            />
          )}
          <ReferenceLine y={bandLow} stroke="#2E7D32" strokeDasharray="4 4" strokeOpacity={0.7} />
          <Line
            type="monotone"
            dataKey="confidence_high"
            stroke="#9fa8da"
            strokeWidth={1}
            dot={false}
            strokeOpacity={0.85}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="confidence_low"
            stroke="#9fa8da"
            strokeWidth={1}
            dot={false}
            strokeOpacity={0.85}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="trend_index"
            stroke="#1e88e5"
            strokeWidth={2.5}
            dot={false}
            name={`${itemLabel} trendline`}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="planned_mix_overlay"
            stroke="#7b1fa2"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
