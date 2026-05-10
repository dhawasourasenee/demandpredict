import Anthropic from "@anthropic-ai/sdk";
import type { MessageParam } from "@anthropic-ai/sdk/resources/messages/messages.js";
import type { CalculationInput } from "@foc/shared";

import { claudeTrendAnalysisSchema, type ClaudeTrendAnalysis } from "./claudeSchema.js";
import { heuristicAnalysis } from "./claude.js";
import { buildAgentSystemPrompt, userContentForAgentFromCalculation } from "./prompts.js";
import type { RawSignal } from "./types.js";

const DEFAULT_APIFY_MCP_URL =
  "https://mcp.apify.com/?tools=apify/instagram-hashtag-scraper,apify/google-search-scraper";
const MCP_BETA = "mcp-client-2025-04-04";

type AnthropicMcpResponse = {
  content: unknown[];
  stop_reason?: string | null;
};

type BetaMessages = {
  create: (params: Record<string, unknown>) => Promise<AnthropicMcpResponse>;
};

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

function record(input: unknown): Record<string, unknown> | undefined {
  return input && typeof input === "object" ? (input as Record<string, unknown>) : undefined;
}

function str(input: unknown): string {
  return typeof input === "string" ? input : input === undefined || input === null ? "" : String(input);
}

function parseJsonMaybe(input: string): unknown {
  const text = input.trim();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

function candidateObjects(input: unknown, out: Record<string, unknown>[] = []): Record<string, unknown>[] {
  const obj = record(input);
  if (obj) {
    out.push(obj);
    for (const value of Object.values(obj)) candidateObjects(value, out);
    return out;
  }
  if (Array.isArray(input)) {
    for (const value of input) candidateObjects(value, out);
  }
  return out;
}

function signalFromCandidate(obj: Record<string, unknown>, idx: number, sourceType: string): RawSignal | undefined {
  const url = str(obj.url ?? obj.link ?? obj.postUrl ?? obj.instagramUrl).trim();
  if (!url || !/^https?:\/\//i.test(url)) return undefined;

  const title =
    str(obj.title ?? obj.pageTitle ?? obj.caption ?? obj.text ?? obj.ownerUsername ?? `MCP source ${idx + 1}`).trim() ||
    `MCP source ${idx + 1}`;
  const snippet = str(obj.description ?? obj.snippet ?? obj.caption ?? obj.text ?? title).trim();
  const rawHashtags = obj.hashtags ?? obj.hashtag ?? [];
  const trendKeywords = Array.isArray(rawHashtags)
    ? rawHashtags.map((x) => str(x).replace(/^#/, "").trim()).filter(Boolean)
    : str(rawHashtags)
        .split(/\s+/)
        .map((x) => x.replace(/^#/, "").trim())
        .filter(Boolean);

  return {
    source_type: sourceType,
    title: title.slice(0, 280),
    url,
    snippet: (snippet || title).slice(0, 1200),
    published_at: str(obj.date ?? obj.publishedTime ?? obj.timestamp ?? obj.postedAt).slice(0, 32) || undefined,
    trend_keywords: [...new Set(trendKeywords)].slice(0, 24),
    relevance_score: Math.max(20, 100 - idx * 4),
  };
}

function extractMcpSignals(content: unknown[]): RawSignal[] {
  const signals: RawSignal[] = [];
  for (const block of content) {
    const b = record(block);
    if (!b || b.type !== "mcp_tool_result") continue;
    const sourceType = str(b.name ?? b.server_name ?? "apify-mcp") || "apify-mcp";
    const resultContent = Array.isArray(b.content) ? b.content : [b.content];
    for (const part of resultContent) {
      const p = record(part);
      const raw = p?.type === "text" ? p.text : part;
      const parsed = typeof raw === "string" ? (parseJsonMaybe(raw) ?? raw) : raw;
      const candidates = candidateObjects(parsed);
      for (const candidate of candidates) {
        const sig = signalFromCandidate(candidate, signals.length, sourceType);
        if (sig) signals.push(sig);
      }
    }
  }
  return signals.slice(0, 50);
}

function betaMessages(client: Anthropic): BetaMessages {
  const maybe = client as unknown as { beta?: { messages?: BetaMessages } };
  if (!maybe.beta?.messages) {
    throw new Error("Installed @anthropic-ai/sdk does not expose beta.messages for remote MCP.");
  }
  return maybe.beta.messages;
}

function mcpRequestParams(
  model: string,
  maxTokens: number,
  temperature: number,
  system: string,
  messages: MessageParam[],
  apifyToken: string,
): Record<string, unknown> {
  const apifyMcpUrl = process.env.APIFY_MCP_URL?.trim() || DEFAULT_APIFY_MCP_URL;
  return {
    model,
    max_tokens: maxTokens,
    temperature,
    stream: false,
    system,
    messages,
    mcp_servers: [
      {
        type: "url",
        name: "apify",
        url: apifyMcpUrl,
        authorization_token: apifyToken,
        tool_configuration: {
          enabled: true,
        },
      },
    ],
    betas: [MCP_BETA],
  };
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

export async function runTrendAgent(
  inp: CalculationInput,
  requestId: string,
  opts?: { systemAddendum?: string },
): Promise<{ analysis: ClaudeTrendAnalysis; signals: RawSignal[] }> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim() ?? "";
  if (!apiKey) return { analysis: heuristicAnalysis(inp, []), signals: [] };
  const apifyToken = process.env.APIFY_TOKEN?.trim() ?? "";
  if (!apifyToken) return { analysis: heuristicAnalysis(inp, []), signals: [] };

  void requestId;
  const client = new Anthropic({ apiKey });
  const beta = betaMessages(client);
  const model = process.env.CLAUDE_MODEL?.trim() || "claude-sonnet-4-6";
  const system = buildAgentSystemPrompt(opts?.systemAddendum);
  const userPrompt = userContentForAgentFromCalculation(inp);
  const messages: MessageParam[] = [{ role: "user", content: userPrompt }];
  const combinedSignals: RawSignal[] = [];
  let analysis: ClaudeTrendAnalysis | undefined;

  const response = await beta.create(
    mcpRequestParams(model, 4096, 0.2, system, messages, apifyToken),
  );
  combinedSignals.push(...extractMcpSignals(response.content));
  const rawText = textFromContent(response.content);
  if (rawText) {
    analysis = await coerceTrendAnalysis(client, model, userPrompt, rawText).catch(() => undefined);
  }

  if (!analysis) {
    const evidenceContext = combinedSignals
      .slice(0, 20)
      .map((s) => `[${s.source_type}] ${s.title}\n${s.url}\n${s.snippet.slice(0, 500)}`)
      .join("\n\n");
    const finale = await client.messages.create({
      model,
      max_tokens: 2500,
      temperature: 0.1,
      stream: false,
      system,
      messages: [
        { role: "user", content: userPrompt },
        {
          role: "user",
          content:
            "Use this Apify MCP evidence gathered by the previous Claude tool-use pass, then respond with the final analysis JSON ONLY (no prose, no markdown code fences), exactly matching the required keys described in the system instructions.\n\n" +
            (evidenceContext || rawText.slice(0, 8000)),
        },
      ],
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
