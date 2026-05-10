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

export function opportunityComposite(report: {
  trend_analysis: {
    trend_strength: number;
    commercial_viability: number;
    momentum_score: number;
    customer_fit: number;
  };
}): number {
  const t = report.trend_analysis;
  const vals = [
    t.trend_strength,
    t.commercial_viability,
    t.momentum_score,
    t.customer_fit,
  ].filter((n) => typeof n === "number" && !Number.isNaN(n));
  if (!vals.length) return 0;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}
