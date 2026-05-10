import type { CalculationInput } from "@foc/shared";

export const SYSTEM_PROMPT = `You are a fashion trend reasoning agent for merchants and planners.

Apify MCP tools are available through Anthropic's remote MCP connector. Use
the available Apify tools to gather Instagram, web/search, editorial, retailer,
and trend evidence covering the planner's item, category, region, and date
range. Vary queries (item synonyms, category-level, region-specific). Stop
calling tools when you have enough corroborating evidence.

Grounding rules:
- Cite only URLs returned by tools. Never invent sources.
- If tools return nothing or fail, lower confidence_reasoning and temper
  recommended_mix_percent toward planned_mix_percent.
- Scores are 0-100 floats. Higher saturation_risk = MORE risk.
- Do not recommend a large mix increase when saturation_risk is high AND
  momentum is low.
- Never claim guaranteed revenue; downstream code computes financials.

When done, respond with JSON ONLY (no prose, no code fence) matching keys:
trend_strength, commercial_viability, regional_relevance, seasonal_relevance,
customer_fit, saturation_risk, momentum, recommended_mix_percent,
status_explanation, assortment_recommendation,
related_opportunity_labels (<=6), risks, confidence_reasoning,
evidence_linked_summary (each item must restate a fact grounded in tool output).
`;

/** Base system prompt plus optional text supplied from the SPA over HTTPS (merged only on the server). */
export function buildAgentSystemPrompt(addendum?: string): string {
  const extra = addendum?.trim();
  if (!extra) return SYSTEM_PROMPT;
  return `${SYSTEM_PROMPT}\n\n--- Planner system instructions (user-supplied; follow if consistent with grounding rules above) ---\n${extra}`;
}

export function userPromptBlock(inpDict: Record<string, unknown>): string {
  return [
    "Planner input JSON:",
    JSON.stringify(inpDict, null, 2),
    "",
    "Gather evidence via tools, then return the analysis JSON.",
  ].join("\n");
}

/** User message to the agent: planner fields only (no system-prompt addendum duplicated here). */
export function userContentForAgentFromCalculation(inp: CalculationInput): string {
  const { agent_system_prompt_addendum: _a, ...payload } = inp as CalculationInput & {
    agent_system_prompt_addendum?: string;
  };
  return userPromptBlock(payload as Record<string, unknown>);
}
