import Anthropic from "@anthropic-ai/sdk";
import type { Message } from "@anthropic-ai/sdk/resources/messages/messages.js";
import type { CalculationInput } from "@foc/shared";

import { claudeTrendAnalysisSchema, type ClaudeTrendAnalysis } from "./claudeSchema.js";
import { SYSTEM_PROMPT, userPromptBlock } from "./prompts.js";
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
      `Confidence is moderated by mock or partial evidence counts (${signals.length} snippets). ` +
      "Increase confidence when Apify returns wider retailer and social corroboration.",
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
  const bullets = signals
    .slice(0, 20)
    .map((s) => `[${s.source_type}] ${s.title}: ${s.snippet.slice(0, 400)}`);

  const inpDict = inp as unknown as Record<string, unknown>;
  void bullets;
  const userPrompt = userPromptBlock(inpDict);

  const first = await client.messages.create({
    model,
    max_tokens: 1500,
    temperature: 0.2,
    stream: false,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const rawText = textContent(first);
  try {
    const data = extractJsonBlob(rawText);
    return claudeTrendAnalysisSchema.parse(data);
  } catch {
    const fix = await client.messages.create({
      model,
      max_tokens: 900,
      temperature: 0,
      stream: false,
      system:
        "Rewrite the previous assistant message as VALID JSON ONLY for ClaudeTrendAnalysis keys.",
      messages: [
        { role: "user", content: userPrompt },
        { role: "assistant", content: rawText.slice(0, 8000) },
        { role: "user", content: "Respond with JSON ONLY. No prose." },
      ],
    });
    const txt2 = textContent(fix);
    const data2 = extractJsonBlob(txt2);
    return claudeTrendAnalysisSchema.parse(data2);
  }
}
