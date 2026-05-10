import type { CalculationInput } from "@foc/shared";

import type { ClaudeTrendAnalysis } from "./claudeSchema.js";
import { heuristicAnalysis, inferTrends } from "./claude.js";
import { focLog } from "./log.js";
import type { RawSignal } from "./types.js";

/**
 * Claude-only trend pass (Anthropic Messages API). Apify remote MCP tooling is disabled for predictable latency on serverless.
 */
export async function runTrendAgent(
  inp: CalculationInput,
  requestId: string,
  opts?: { systemAddendum?: string },
): Promise<{ analysis: ClaudeTrendAnalysis; signals: RawSignal[] }> {
  void opts;
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim() ?? "";
  focLog("runTrendAgent_start", { requestId, hasApiKey: Boolean(apiKey) });

  if (!apiKey) {
    focLog("runTrendAgent_heuristic_no_key", { requestId });
    return { analysis: heuristicAnalysis(inp, []), signals: [] };
  }

  try {
    const analysis = await inferTrends(inp, [], apiKey);
    focLog("runTrendAgent_ok", { requestId });
    return { analysis, signals: [] };
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    focLog("runTrendAgent_claude_failed", { requestId, err: err.slice(0, 500) });
    throw e;
  }
}
