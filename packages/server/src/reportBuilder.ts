import type { CalculationInput } from "@foc/shared";

import type { ClaudeTrendAnalysis } from "./claudeSchema.js";
import type { ScoringOutput } from "./scoring.js";
import type { TrendPoint } from "./trendline.js";
import type { RawSignal } from "./types.js";

function prettyWords(s: string, maxLen?: number): string {
  const out = String(s).split(/\s+/).join(" ").trim().replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase(),
  );
  if (maxLen && out.length > maxLen) return `${out.slice(0, Math.max(0, maxLen - 1))}…`;
  return out;
}

export function evidenceCardsFromSignals(signals: RawSignal[]): Record<string, unknown>[] {
  return signals.map((s) => ({
    source_title: s.title,
    url: s.url,
    date: s.published_at,
    snippet: s.snippet,
    trend_keywords: s.trend_keywords ?? [],
    relevance_score: Math.round(Number(s.relevance_score ?? 0) * 100) / 100,
  }));
}

export function buildFinalReportPayload(
  inp: CalculationInput,
  ai: ClaudeTrendAnalysis,
  scores: ScoringOutput,
  trendline: TrendPoint[],
  evidenceCards: Record<string, unknown>[],
  trendEstimatedFlag: boolean,
): Record<string, unknown> {
  const region = inp.region.trim();
  const label = [
    prettyWords(inp.category),
    prettyWords(inp.item, 140),
    inp.market.charAt(0).toUpperCase() + inp.market.slice(1),
    region,
    `${inp.date_range.start} → ${inp.date_range.end}`,
  ].join(", ");

  return {
    calculation_summary: {
      title: label,
      calculation_mode: inp.calculation_type,
      headline: {
        item: prettyWords(inp.item, 140),
        category: prettyWords(inp.category),
        market: inp.market.charAt(0).toUpperCase() + inp.market.slice(1),
        region,
        start: inp.date_range.start,
        end: inp.date_range.end,
      },
      planned_mix_percent: inp.planned_mix_percent,
      recommended_mix_percent: scores.recommended_mix_percent,
      difference_pp: Math.round((scores.recommended_mix_percent - inp.planned_mix_percent) * 100) / 100,
      confidence_level: scores.ai_confidence_score > 55 ? "medium" : "low",
    },
    trend_scores: {
      trend_strength: ai.trend_strength,
      commercial_viability: ai.commercial_viability,
      regional_relevance: ai.regional_relevance,
      seasonal_relevance: ai.seasonal_relevance,
      customer_fit: ai.customer_fit,
      saturation_risk: ai.saturation_risk,
      momentum: ai.momentum,
    },
    assortment_analysis: {
      status: scores.status,
      opportunity_gap_percent: scores.opportunity_gap_percent,
      additional_units_estimate: scores.additional_units_estimate,
      notes: ai.status_explanation,
    },
    trendline_data: trendline.map((tp) => ({ ...tp })),
    opportunity_estimation: {
      incremental_opportunity_estimate: scores.incremental_opportunity_estimate,
      disclaimer:
        "Approximate INR illustration only—not a revenue guarantee and not sales certainty. " +
        `Trendline is ${trendEstimatedFlag ? "estimated" : "evidence-guided"} (see point flags).`,
    },
    recommendation: {
      summary: ai.assortment_recommendation,
      confidence_score: scores.ai_confidence_score,
      confidence_reasoning: ai.confidence_reasoning,
    },
    related_opportunities: ai.related_opportunity_labels.map((l) => ({ label: l })),
    evidence_summary: evidenceCards,
    risks: ai.risks,
    confidence: {
      score: scores.ai_confidence_score,
      level:
        scores.ai_confidence_score < 46
          ? "low"
          : scores.ai_confidence_score < 72
            ? "medium"
            : "high",
      trend_vs_sales_note:
        "Trend momentum differs from transactional sell-through certainty; rely on receipts where possible.",
    },
  };
}
