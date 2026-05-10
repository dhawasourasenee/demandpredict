import type { CalculationInput } from "@foc/shared";

import { expandQueries } from "./expandQueries.js";
import type { RawSignal } from "./types.js";

export function collectMockSignals(inp: CalculationInput, requestId: string): RawSignal[] {
  const expanded = expandQueries(inp);
  const now = new Date();
  const baseKw = [inp.item, inp.category, "quiet luxury", "mass retail"];

  const signals: RawSignal[] = [];
  for (let i = 0; i < Math.min(6, expanded.all_queries.length); i += 1) {
    const q = expanded.all_queries[i]!;
    const daysAgo = 3 + i * 5;
    const published = new Date(now.getTime() - daysAgo * 86400000).toISOString().slice(0, 10);
    signals.push({
      source_type: i % 2 === 0 ? "fashion_article" : "search_result",
      title: `Sample coverage: ${q.slice(0, 48)}…`,
      url: `https://example.invalid/evidence/${requestId}/${i}`,
      snippet: [
        `Editorial signal for ${inp.item} in ${inp.market} ${inp.region.trim()}.`,
        "Keywords align with planner context; treat as illustrative mock evidence.",
      ].join(" "),
      published_at: published,
      trend_keywords: [...baseKw],
      relevance_score: 78.0 - i * 3,
    });
  }
  return signals;
}

/** Placeholder expanded queries → mock snippets (no external scrapers wired). */
export function collectSignals(inp: CalculationInput, _ignoredToken: string, requestId: string): RawSignal[] {
  return collectMockSignals(inp, requestId);
}
