import type { BusinessContext } from "./types";

export function currencySymbol(region: string): string {
  const r = region.toLowerCase();
  if (r.includes("india") || r.includes("inr")) return "₹";
  if (r.includes("uk") || r.includes("britain") || r.includes("gbp")) return "£";
  if (r.includes("eu") || r.includes("europe") || r.includes("eur")) return "€";
  return "$";
}

export function formatMoney(amount: number, ctx: BusinessContext): string {
  const sym = currencySymbol(ctx.region);
  const abs = Math.abs(Math.round(amount));
  const formatted = abs.toLocaleString();
  return `${sym}${formatted}`;
}

export function saturationLabel(score: number): string {
  if (score <= 33) return "Low";
  if (score <= 66) return "Medium";
  return "High";
}

/**
 * Hero "Opportunity score": blends commercial drivers then penalizes saturation.
 * Confidence is shown separately — do not duplicate it here.
 */
export function opportunityComposite(report: {
  trend_analysis: {
    trend_strength: number;
    commercial_viability: number;
    momentum_score: number;
    customer_fit: number;
    regional_relevance: number;
    seasonal_relevance: number;
    saturation_risk: number;
  };
}): number {
  const t = report.trend_analysis;
  const vals = [
    t.trend_strength,
    t.commercial_viability,
    t.momentum_score,
    t.customer_fit,
    t.regional_relevance,
    t.seasonal_relevance,
  ].filter((n) => typeof n === "number" && !Number.isNaN(n));
  if (!vals.length) return 0;
  const base = vals.reduce((a, b) => a + b, 0) / vals.length;
  const sat = Math.max(0, Math.min(100, Number(t.saturation_risk) || 0));
  // Higher saturation = more crowded category → compress opportunity (up to ~half weight at sat=100)
  const saturationFactor = 1 - 0.52 * (sat / 100);
  const blended = base * saturationFactor;
  // Slight stretch from midpoint so scores read more decisive when drivers disagree with saturation
  const decisive = 50 + (blended - 50) * 1.18;
  return Math.max(0, Math.min(100, Math.round(decisive)));
}

/** Hero confidence: mild spread from 50 so mid-range reads less "default". */
export function heroConfidenceScore(raw: number | undefined): number {
  if (raw == null || Number.isNaN(raw)) return 0;
  const x = Math.max(0, Math.min(100, raw));
  return Math.round(50 + (x - 50) * 1.12);
}
