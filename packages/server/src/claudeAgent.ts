import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam, Tool } from "@anthropic-ai/sdk/resources/messages/messages.js";
import type { CalculationInput } from "@foc/shared";

import { runInstagramActor, runWebActor } from "./apifyService.js";
import { claudeTrendAnalysisSchema, type ClaudeTrendAnalysis } from "./claudeSchema.js";
import { heuristicAnalysis } from "./claude.js";
import { SYSTEM_PROMPT, userPromptBlock } from "./prompts.js";
import type { RawSignal } from "./types.js";

const INSTAGRAM_TOOL: Tool = {
  name: "search_instagram_trends",
  description:
    "Search Instagram public posts/hashtags for fashion trend signals. Returns recent posts (caption, hashtags, engagement, date). Use to gauge consumer adoption and visual trend velocity.",
  input_schema: {
    type: "object",
    properties: {
      hashtag: { type: "string", description: "Hashtag without #, e.g. 'utilityjacket'" },
      region: { type: "string" },
      max_results: { type: "integer", minimum: 5, maximum: 50, default: 20 },
    },
    required: ["hashtag"],
  },
};

const WEB_TOOL: Tool = {
  name: "search_web_trends",
  description:
    "Search the public web (editorial, retailer, search results) for fashion trend coverage. Returns title, URL, snippet, publish date.",
  input_schema: {
    type: "object",
    properties: {
      query: { type: "string" },
      region: { type: "string" },
      date_range_days: { type: "integer", minimum: 7, maximum: 365, default: 90 },
      max_results: { type: "integer", minimum: 5, maximum: 30, default: 10 },
    },
    required: ["query"],
  },
};

const TOOLS = [INSTAGRAM_TOOL, WEB_TOOL];

function extractJsonBlob(text: string): unknown {
  let stripped = text.trim();
  if (stripped.startsWith("```")) {
    stripped = stripped.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  }
  return JSON.parse(stripped) as unknown;
}

function textFromContent(content: unknown[]): string {
  return content
    .filter((block): block is { type: "text"; text: string } => {
      return !!block && typeof block === "object" && (block as { type?: unknown }).type === "text";
    })
    .map((block) => block.text)
    .join("\n")
    .trim();
}

async function coerceTrendAnalysis(
  client: Anthropic,
  model: string,
  userPromptOriginal: string,
  assistantRawText: string,
): Promise<ClaudeTrendAnalysis> {
  try {
    return claudeTrendAnalysisSchema.parse(extractJsonBlob(assistantRawText));
  } catch {
    const fix = await client.messages.create({
      model,
      max_tokens: 900,
      temperature: 0,
      stream: false,
      system: "Rewrite the previous assistant message as VALID JSON ONLY for ClaudeTrendAnalysis keys.",
      messages: [
        { role: "user", content: userPromptOriginal },
        { role: "assistant", content: assistantRawText.slice(0, 8000) },
        { role: "user", content: "Respond with JSON ONLY. No prose." },
      ],
    });
    return claudeTrendAnalysisSchema.parse(extractJsonBlob(textFromContent(fix.content)));
  }
}

function obj(input: unknown): Record<string, unknown> {
  return input && typeof input === "object" ? (input as Record<string, unknown>) : {};
}

async function executeToolDispatch(
  name: string,
  toolInput: Record<string, unknown>,
  inp: CalculationInput,
  requestId: string,
  toolUseId: string,
): Promise<{ result: Record<string, unknown>; signals: RawSignal[] }> {
  try {
    let signals: RawSignal[] = [];
    if (name === "search_instagram_trends") {
      const hashtag = String(toolInput.hashtag ?? inp.item.replaceAll(/\s+/g, "")).replace(/^#/, "");
      const region = String(toolInput.region ?? inp.region);
      const maxResults = Number(toolInput.max_results ?? toolInput.maxResults ?? 20);
      signals = await runInstagramActor(hashtag, region, maxResults, inp, requestId);
    } else if (name === "search_web_trends") {
      const query = String(toolInput.query ?? "").trim();
      const region = String(toolInput.region ?? inp.region);
      const dateRangeDays = Number(toolInput.date_range_days ?? toolInput.dateRangeDays ?? 90);
      const maxResults = Number(toolInput.max_results ?? toolInput.maxResults ?? 10);
      signals = await runWebActor(query, region, dateRangeDays, maxResults, inp, requestId);
    } else {
      return {
        result: { type: "tool_result", tool_use_id: toolUseId, is_error: true, content: `Unknown tool: ${name}` },
        signals: [],
      };
    }

    return {
      result: {
        type: "tool_result",
        tool_use_id: toolUseId,
        content: JSON.stringify(signals.slice(0, 25)),
      },
      signals,
    };
  } catch (e) {
    return {
      result: {
        type: "tool_result",
        tool_use_id: toolUseId,
        is_error: true,
        content: e instanceof Error ? e.message.slice(0, 6000) : String(e).slice(0, 6000),
      },
      signals: [],
    };
  }
}

export async function runTrendAgent(
  inp: CalculationInput,
  requestId: string,
): Promise<{ analysis: ClaudeTrendAnalysis; signals: RawSignal[] }> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim() ?? "";
  if (!apiKey) return { analysis: heuristicAnalysis(inp, []), signals: [] };

  const client = new Anthropic({ apiKey });
  const model = process.env.CLAUDE_MODEL?.trim() || "claude-sonnet-4-6";
  const maxIterations = Math.max(1, Number(process.env.AGENT_MAX_ITERATIONS ?? 6));
  const userPrompt = userPromptBlock(inp as unknown as Record<string, unknown>);
  const messages: MessageParam[] = [{ role: "user", content: userPrompt }];
  const combinedSignals: RawSignal[] = [];
  let analysis: ClaudeTrendAnalysis | undefined;

  for (let i = 0; i < maxIterations; i += 1) {
    const response = await client.messages.create({
      model,
      max_tokens: 4096,
      temperature: 0.2,
      stream: false,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      tool_choice: { type: "auto" },
      messages,
    });

    messages.push({ role: "assistant", content: response.content });
    if (response.stop_reason === "tool_use") {
      const toolResults: Record<string, unknown>[] = [];
      for (const block of response.content) {
        if (block.type !== "tool_use") continue;
        const { result, signals } = await executeToolDispatch(
          block.name,
          obj(block.input),
          inp,
          requestId,
          block.id,
        );
        toolResults.push(result);
        combinedSignals.push(...signals);
      }
      if (!toolResults.length) break;
      messages.push({ role: "user", content: toolResults as unknown as MessageParam["content"] });
      continue;
    }

    if (response.stop_reason === "end_turn") {
      const rawText = textFromContent(response.content);
      if (rawText) {
        analysis = await coerceTrendAnalysis(client, model, userPrompt, rawText).catch(() => undefined);
      }
      break;
    }
    break;
  }

  if (!analysis) {
    messages.push({
      role: "user",
      content:
        "You have reached the tool budget for this session. Stop using tools. Respond with the final analysis JSON ONLY (no prose, no markdown code fences), exactly matching the required keys described in the system instructions.",
    });
    const finale = await client.messages.create({
      model,
      max_tokens: 2500,
      temperature: 0.1,
      stream: false,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      tool_choice: { type: "none" },
      messages,
    });
    const rawFinal = textFromContent(finale.content);
    if (rawFinal) {
      analysis = await coerceTrendAnalysis(client, model, userPrompt, rawFinal).catch(() => undefined);
    }
  }

  return {
    analysis: analysis ?? heuristicAnalysis(inp, combinedSignals),
    signals: combinedSignals,
  };
}
