import type { CalculationInput } from "@foc/shared";

import type { ClaudeTrendAnalysis } from "./claudeSchema.js";
import type { RawSignal } from "./types.js";

export type TrendPoint = {
  period: string;
  trend_index: number;
  confidence_low: number;
  confidence_high: number;
  planned_mix_overlay: number;
  recommended_window_low: number;
  recommended_window_high: number;
  estimated: boolean;
};

function monthSeries(startIso: string, endIso: string): Date[] {
  const [sy, sm] = startIso.split("-").map(Number);
  const [ey, em] = endIso.split("-").map(Number);
  let d = new Date(Date.UTC(sy!, sm! - 1, 1));
  const end = new Date(Date.UTC(ey!, em! - 1, 1));
  const out: Date[] = [];
  while (d <= end && out.length < 24) {
    out.push(new Date(d));
    if (d.getUTCMonth() === 11) {
      d = new Date(Date.UTC(d.getUTCFullYear() + 1, 0, 1));
    } else {
      d = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1));
    }
  }
  return out.length ? out : [new Date()];
}

function signalIndexByMonth(signals: RawSignal[]): Record<string, number[]> {
  const buckets: Record<string, number[]> = {};
  for (const s of signals) {
    if (!s.published_at) continue;
    const dt = new Date(s.published_at.replace("Z", "+00:00"));
    if (Number.isNaN(dt.getTime())) continue;
    const key = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}`;
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(Number(s.relevance_score ?? 50));
  }
  return buckets;
}

function mean(arr: number[]): number {
  if (!arr.length) return 50;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function buildTrendline(
  inp: CalculationInput,
  signals: RawSignal[],
  ai: ClaudeTrendAnalysis,
  scoringRecommended: number,
): { points: TrendPoint[]; estimated: boolean } {
  const months = monthSeries(inp.date_range.start, inp.date_range.end);
  const buckets = signalIndexByMonth(signals);
  const byM: Record<string, number> = {};
  for (const [k, v] of Object.entries(buckets)) {
    byM[k] = mean(v);
  }
  const estimated = Object.keys(byM).length < 2;

  const points: TrendPoint[] = [];
  let lastVal = ai.momentum;
  for (const d of months) {
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    if (key in byM) lastVal = byM[key]!;
    else if (estimated) lastVal = Math.max(20, Math.min(100, lastVal + (ai.momentum - 55) * 0.05));

    const low = Math.max(
      0,
      lastVal - 8 - (estimated ? 15 : 8),
    );
    const high = Math.min(100, lastVal + 8 + (estimated ? 12 : 8));

    const recLow = Math.max(0, scoringRecommended - 4);
    const recHigh = Math.min(100, scoringRecommended + 4);

    points.push({
      period: d.toISOString().slice(0, 10),
      trend_index: Math.round(lastVal * 100) / 100,
      confidence_low: Math.round(low * 100) / 100,
      confidence_high: Math.round(high * 100) / 100,
      planned_mix_overlay: inp.planned_mix_percent,
      recommended_window_low: Math.round(recLow * 100) / 100,
      recommended_window_high: Math.round(recHigh * 100) / 100,
      estimated,
    });
  }
  return { points, estimated };
}
