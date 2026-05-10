import Anthropic from "@anthropic-ai/sdk";
import type { Message } from "@anthropic-ai/sdk/resources/messages/messages.js";
import type { CalculationInput } from "@foc/shared";

import { claudeTrendAnalysisSchema, type ClaudeTrendAnalysis } from "./claudeSchema.js";
import { focLog } from "./log.js";
import { SYSTEM_PROMPT, userContentForAgentFromCalculation } from "./prompts.js";
import type { RawSignal } from "./types.js";

function regionHintScore(region: string): number {
  const r = region.trim().toUpperCase();
  if (["US", "USA", "NAM", "NORTH AMERICA"].some((k) => r.includes(k))) return 70;
  if (["EMEA", "EUROPE", "UNITED KINGDOM"].some((k) => r.includes(k)) || (r.includes("UK") && region.includes("/")))
    return 65;
  if (["APAC", "ASIA", "PACIFIC", "INDIA", "SOUTH ASIA", "SEA", "ASEAN"].some((k) => r.includes(k))) return 60;
  return 62;
}

function extractJsonBlob(text: string): unknown {
  let stripped = text.trim();
  if (stripped.startsWith("```")) {
    stripped = stripped.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  }
  return JSON.parse(stripped) as unknown;
}

function coerceObject(input: unknown): Record<string, unknown> {
  return input && typeof input === "object" ? (input as Record<string, unknown>) : {};
}

function numField(input: unknown): number | undefined {
  const n = Number(input);
  return Number.isFinite(n) ? n : undefined;
}

function strField(input: unknown): string {
  return typeof input === "string" ? input : input === undefined || input === null ? "" : String(input);
}

/** Map SYSTEM_PROMPT "full report" shape → scores used by the pipeline. */
function analysisFromFullReport(input: unknown): ClaudeTrendAnalysis | undefined {
  const root = coerceObject(input);
  const trendScores = coerceObject(root.trend_scores);
  const summary = coerceObject(root.calculation_summary);
  const assortment = coerceObject(root.assortment_analysis);
  const recommendation = coerceObject(root.recommendation);
  const confidence = coerceObject(root.confidence);
  const related = Array.isArray(root.related_opportunities) ? root.related_opportunities : [];
  const evidence = Array.isArray(root.evidence_summary) ? root.evidence_summary : [];

  const data = {
    trend_strength: numField(trendScores.trend_strength ?? trendScores.trend_strength_score),
    commercial_viability: numField(trendScores.commercial_viability ?? trendScores.commercial_viability_score),
    regional_relevance: numField(trendScores.regional_relevance ?? trendScores.regional_relevance_score),
    seasonal_relevance: numField(trendScores.seasonal_relevance ?? trendScores.seasonal_relevance_score),
    customer_fit: numField(trendScores.customer_fit ?? trendScores.customer_fit_score),
    saturation_risk: numField(trendScores.saturation_risk ?? trendScores.saturation_risk_score),
    momentum: numField(trendScores.momentum ?? trendScores.momentum_score),
    recommended_mix_percent: numField(
      summary.recommended_mix_percent ??
        summary.recommended_assortment_mix_percent ??
        assortment.recommended_mix_percent ??
        assortment.recommended_assortment_mix_percent,
    ),
    status_explanation: strField(assortment.notes ?? assortment.status_explanation ?? recommendation.summary),
    assortment_recommendation: strField(recommendation.summary ?? assortment.assortment_recommendation),
    related_opportunity_labels: related
      .map((item) => strField(coerceObject(item).label ?? coerceObject(item).name ?? item))
      .filter(Boolean)
      .slice(0, 6),
    risks: Array.isArray(root.risks) ? root.risks.map((x) => strField(x)).filter(Boolean) : [],
    confidence_reasoning: strField(
      recommendation.confidence_reasoning ?? confidence.reasoning ?? confidence.summary ?? confidence.level,
    ),
    evidence_linked_summary: evidence
      .map((item) => {
        const obj = coerceObject(item);
        return strField(obj.snippet ?? obj.summary ?? obj.source_title ?? item);
      })
      .filter(Boolean),
  };

  if (
    data.trend_strength === undefined ||
    data.commercial_viability === undefined ||
    data.regional_relevance === undefined ||
    data.seasonal_relevance === undefined ||
    data.customer_fit === undefined ||
    data.saturation_risk === undefined ||
    data.momentum === undefined ||
    data.recommended_mix_percent === undefined
  ) {
    return undefined;
  }

  return claudeTrendAnalysisSchema.parse(data);
}

function parseModelJson(data: unknown): ClaudeTrendAnalysis {
  const direct = claudeTrendAnalysisSchema.safeParse(data);
  if (direct.success) return direct.data;
  const fromReport = analysisFromFullReport(data);
  if (fromReport) return fromReport;
  return claudeTrendAnalysisSchema.parse(data);
}

const COERCE_SYSTEM = `You output ONE minified JSON object only (no markdown, no prose).
Keys (all required): trend_strength, commercial_viability, regional_relevance, seasonal_relevance, customer_fit, saturation_risk, momentum, recommended_mix_percent — each a number 0–100.
Also: status_explanation (string), assortment_recommendation (string), related_opportunity_labels (string array), risks (string array), confidence_reasoning (string), evidence_linked_summary (string array).
Use the user brief and the broken assistant JSON only as context; fix into valid complete JSON.`;

/** Enough headroom for nested "full report" JSON from SYSTEM_PROMPT (truncation → invalid JSON). */
const PRIMARY_MAX_TOKENS = 8192;
const COERCE_MAX_TOKENS = 8192;

function textContent(msg: Message): string {
  const block = msg.content.find((c: { type: string }) => c.type === "text");
  return block && typeof block === "object" && "text" in block ? String((block as { text: string }).text) : "";
}

export function heuristicAnalysis(inp: CalculationInput, signals: RawSignal[]): ClaudeTrendAnalysis {
  const avgRel =
    signals.length > 0
      ? signals.reduce((s, x) => s + (x.relevance_score ?? 0), 0) / signals.length
      : 45;

  const ct = inp.customer_type;
  let viability = avgRel + (ct === "mass" || ct === "all" ? 8 : 0);
  const trendStrength = Math.min(100, avgRel + 5);
  const regional = regionHintScore(inp.region);
  const seasonal = Math.min(92, 55 + viability * 0.25);

  let saturation = Math.max(25, 85 - viability * 0.45 + (inp.planned_mix_percent > 22 ? 30 : 0));
  let momentum = Math.min(92, Math.max(38, trendStrength * 0.8 - saturation * 0.35));

  let rec = inp.planned_mix_percent + (momentum - 55) * 0.35;
  if (saturation > 70 && momentum < 50) rec = Math.min(rec, inp.planned_mix_percent + 2);

  const recommended = Math.min(95, Math.max(5, rec));

  const statusExplanation =
    `Momentum sits near ${Math.round(momentum * 10) / 10} with saturation risk ${Math.round(saturation * 10) / 10}. ` +
    `Compared to planned mix ${Math.round(inp.planned_mix_percent * 100) / 100}%, a move toward ` +
    `${Math.round(recommended * 100) / 100}% is suggested only as an approximate directional view.`;

  const oppMap: [string, string][] = [
    ["Harrington jacket", "utility outerwear"],
    ["Anorak", "sport outdoor"],
    ["Cropped blazer", "novelty tailoring"],
    ["Utility jacket", "workwear crossover"],
    ["Soft tailoring separates", "quiet luxury tailoring"],
    ["Elevated officewear", "workleisure hybrids"],
  ];

  const ctx = `${inp.category} ${inp.item}`;
  const opp: string[] = [];
  for (const [label, kw] of oppMap) {
    if (kw && !ctx.includes(kw)) opp.push(label);
    if (opp.length >= 5) break;
  }

  const risks = [
    "Live consumer demand may diverge from editorial and retailer listing signals.",
    "Trend momentum is not a guarantee of SKU-level commercial performance.",
    "Regional adoption curves differ; extrapolate cautiously beyond the grounded region signals.",
  ];

  return claudeTrendAnalysisSchema.parse({
    trend_strength: Math.min(100, trendStrength),
    commercial_viability: Math.min(100, viability),
    regional_relevance: regional,
    seasonal_relevance: seasonal,
    customer_fit: ct === "early" ? 62 : ct === "mass" ? 70 : ct === "all" ? 66 : 60,
    saturation_risk: Math.min(100, saturation),
    momentum,
    recommended_mix_percent: recommended,
    status_explanation: statusExplanation,
    assortment_recommendation: [
      `Treat ${inp.item} as an illustrative opportunity adjustment vs planned mix`,
      "pending stronger live evidence ingestion.",
    ].join(" "),
    related_opportunity_labels: opp.slice(0, 6),
    risks,
    confidence_reasoning:
      `Confidence is moderated by heuristic / partial evidence (${signals.length} snippets). ` +
      "Increase confidence when attaching live retailer or social corroboration.",
    evidence_linked_summary: signals.slice(0, 4).map((s) => {
      const sn = s.snippet;
      return sn.length > 200 ? `${sn.slice(0, 200)}…` : sn;
    }),
  });
}

export async function inferTrends(
  inp: CalculationInput,
  signals: RawSignal[],
  apiKey: string,
): Promise<ClaudeTrendAnalysis> {
  if (!apiKey.trim()) return heuristicAnalysis(inp, signals);

  const client = new Anthropic({ apiKey });
  const model = process.env.CLAUDE_MODEL?.trim() || "claude-sonnet-4-6";
  void signals;
  const userPrompt = userContentForAgentFromCalculation(inp);

  const tPrimary = Date.now();
  focLog("inferTrends_primary_start", {
    model,
    user_chars: userPrompt.length,
  });

  const first = await client.messages.create({
    model,
    max_tokens: PRIMARY_MAX_TOKENS,
    temperature: 0.2,
    stream: false,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const rawText = textContent(first);
  const stopPrimary = "stop_reason" in first ? String((first as { stop_reason?: unknown }).stop_reason) : undefined;
  focLog("inferTrends_primary_done", {
    ms: Date.now() - tPrimary,
    assistant_chars: rawText.length,
    stop_reason: stopPrimary,
    parse_attempt: true,
  });

  try {
    const data = extractJsonBlob(rawText);
    const parsed = parseModelJson(data);
    focLog("inferTrends_parsed_primary", { truncated: stopPrimary === "max_tokens" });
    return parsed;
  } catch (parseErr) {
    focLog("inferTrends_retry_coerce_json", {
      err: parseErr instanceof Error ? parseErr.message.slice(0, 200) : String(parseErr),
    });
    const tFix = Date.now();
    const fix = await client.messages.create({
      model,
      max_tokens: COERCE_MAX_TOKENS,
      temperature: 0,
      stream: false,
      system: COERCE_SYSTEM,
      messages: [
        { role: "user", content: userPrompt },
        { role: "assistant", content: rawText.slice(0, 24_000) },
        { role: "user", content: "The assistant JSON was truncated or invalid. Output the single flat JSON object only." },
      ],
    });
    const txt2 = textContent(fix);
    const stopFix = "stop_reason" in fix ? String((fix as { stop_reason?: unknown }).stop_reason) : undefined;
    focLog("inferTrends_coerce_done", {
      ms: Date.now() - tFix,
      assistant_chars: txt2.length,
      stop_reason: stopFix,
    });
    try {
      const data2 = extractJsonBlob(txt2);
      const out = parseModelJson(data2);
      focLog("inferTrends_parsed_coerce", { truncated: stopFix === "max_tokens" });
      return out;
    } catch (e2) {
      const msg = e2 instanceof Error ? e2.message : String(e2);
      focLog("inferTrends_coerce_parse_failed", { err: msg.slice(0, 240) });
      return heuristicAnalysis(inp, []);
    }
  }
}
