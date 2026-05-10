import type { CalculationInput } from "@foc/shared";

import type { ClaudeTrendAnalysis } from "./claudeSchema.js";

export type IndexStatus = "under_indexed" | "over_indexed" | "aligned";

export type ScoringOutput = {
  opportunity_gap_percent: number;
  status: IndexStatus;
  incremental_opportunity_estimate: number;
  additional_units_estimate: number;
  recommended_mix_percent: number;
  ai_confidence_score: number;
};

function overallConfidence(inp: CalculationInput, ai: ClaudeTrendAnalysis): number {
  const baseComponents = [
    ai.trend_strength,
    ai.commercial_viability,
    ai.regional_relevance,
    ai.seasonal_relevance,
    ai.customer_fit,
  ];
  let weighted = baseComponents.reduce((a, b) => a + b, 0) / Math.max(1, baseComponents.length);

  const ct = inp.customer_type;
  if (ct === "mass") {
    weighted = weighted * 0.55 + ai.commercial_viability * 0.45;
  } else if (ct === "all") {
    weighted = weighted * 0.58 + ai.commercial_viability * 0.41;
  } else {
    weighted = weighted * 0.62 + ai.customer_fit * 0.38;
  }

  const penalty = ai.saturation_risk * 0.35 + Math.max(0, 60 - ai.momentum) * 0.35;
  const score = Math.max(0, Math.min(100, weighted - penalty * 0.12));
  return Math.round(score * 100) / 100;
}

export function computeScores(inp: CalculationInput, ai: ClaudeTrendAnalysis): ScoringOutput {
  let recommended = Number(ai.recommended_mix_percent);
  let gap = recommended - inp.planned_mix_percent;

  let status: IndexStatus;
  if (gap > 1) status = "under_indexed";
  else if (gap < -1) status = "over_indexed";
  else status = "aligned";

  if (ai.saturation_risk > 75 && ai.momentum < 45) {
    gap = Math.min(gap, Math.max(-1.5, gap));
    recommended = inp.planned_mix_percent + gap;
  }

  const inc =
    Math.abs(gap / 100) *
    inp.planned_units *
    inp.asp *
    (inp.expected_sell_through_percent / 100);

  const addUnits = Math.abs(gap / 100) * inp.planned_units;

  return {
    opportunity_gap_percent: Math.round(gap * 10000) / 10000,
    status,
    incremental_opportunity_estimate: Math.round(inc * 100) / 100,
    additional_units_estimate: Math.round(addUnits * 100) / 100,
    recommended_mix_percent: Math.round(Math.min(100, Math.max(0, recommended)) * 10000) / 10000,
    ai_confidence_score: overallConfidence(inp, ai),
  };
}
