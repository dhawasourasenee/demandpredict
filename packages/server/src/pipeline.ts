import { randomUUID } from "node:crypto";

import type { CalculationInput } from "@foc/shared";

import { runTrendAgent } from "./claudeAgent.js";
import { processSignals } from "./processSignals.js";
import { buildFinalReportPayload, evidenceCardsFromSignals } from "./reportBuilder.js";
import { computeScores } from "./scoring.js";
import { buildTrendline } from "./trendline.js";
import { putCalculation, putReport } from "./memoryStore.js";

function normalizeInput(raw: CalculationInput): CalculationInput {
  return {
    ...raw,
    region: raw.region.trim(),
    season: raw.season.trim(),
    category: raw.category.trim().toLowerCase(),
    item: raw.item.trim().toLowerCase(),
  };
}

export type RunCalculationResult = {
  calculationId: string;
  reportId: string;
  report: Record<string, unknown>;
};

export async function runCalculation(inp: CalculationInput): Promise<RunCalculationResult> {
  const normalized = normalizeInput(inp);

  const calcId = randomUUID();
  const reportId = randomUUID();
  const requestId = randomUUID();

  const { analysis: ai, signals: collected } = await runTrendAgent(normalized, requestId);
  const processed = processSignals(collected);
  const scores = computeScores(normalized, ai);
  const { points, estimated } = buildTrendline(normalized, processed, ai, scores.recommended_mix_percent);
  const cards = evidenceCardsFromSignals(processed);
  const payload = buildFinalReportPayload(normalized, ai, scores, points, cards, estimated);

  putReport(reportId, payload);
  putCalculation(calcId, "complete", new Date().toISOString());

  return {
    calculationId: calcId,
    reportId,
    report: payload,
  };
}
