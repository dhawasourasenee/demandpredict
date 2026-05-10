import type { CalculationInput } from "@foc/shared";

import { runActorSync } from "./apifyClient.js";
import { collectMockSignals } from "./collectSignals.js";
import type { RawSignal } from "./types.js";

const REGION_TO_CC: Record<string, string> = {
  us: "us",
  usa: "us",
  "united states": "us",
  uk: "gb",
  gb: "gb",
  "united kingdom": "gb",
  in: "in",
  india: "in",
  de: "de",
  germany: "de",
  fr: "fr",
  france: "fr",
  jp: "jp",
  japan: "jp",
  au: "au",
  australia: "au",
  ca: "ca",
  canada: "ca",
  es: "es",
  it: "it",
  br: "br",
  nl: "nl",
  se: "se",
  mx: "mx",
  kr: "kr",
};

function countryForRegion(region: string | undefined): string {
  const key = String(region ?? "").trim().toLowerCase();
  if (!key) return "us";
  const tokens = key.replaceAll(",", " ").split(/\s+/).filter(Boolean);
  for (const token of tokens.reverse()) {
    if (REGION_TO_CC[token]) return REGION_TO_CC[token];
  }
  if (REGION_TO_CC[key]) return REGION_TO_CC[key];
  return REGION_TO_CC[key.slice(0, 2)] ?? "us";
}

function mockSignalsAsTool(
  inp: CalculationInput,
  requestId: string,
  sourceType: "instagram" | "web",
  limit: number,
): RawSignal[] {
  return collectMockSignals(inp, requestId).slice(0, Math.max(1, Math.min(25, limit))).map((s) => ({
    ...s,
    source_type: sourceType,
    title: `[mock-${sourceType}] ${s.title}`,
  }));
}

function parseIsoDay(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number") {
    const millis = value > 10_000_000_000 ? value : value * 1000;
    const d = new Date(millis);
    return Number.isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
  }
  const text = String(value).trim();
  if (!text) return undefined;
  const d = new Date(text.replace("Z", "+00:00"));
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return text.length >= 10 ? text.slice(0, 10) : undefined;
}

function str(value: unknown): string {
  return typeof value === "string" ? value : value === undefined || value === null ? "" : String(value);
}

function instagramEngagementHeuristic(item: Record<string, unknown>): number {
  const raw =
    item.likesCount ?? item.likes ?? item.likesCountApprox ?? item.engagementScore ?? 0;
  const likes = Number(raw);
  const safeLikes = Number.isFinite(likes) ? likes : 0;
  return Math.min(100, Math.max(28, 38 + Math.min(54, safeLikes ** 0.42 / 120)));
}

export async function runInstagramActor(
  hashtag: string,
  region: string | undefined,
  maxResults: number,
  inp: CalculationInput,
  requestId: string,
): Promise<RawSignal[]> {
  const ht = hashtag.replace(/^#/, "").trim() || inp.item.replaceAll(/\s+/g, "");
  const limit = Math.max(5, Math.min(50, Number(maxResults || 20)));
  const token = process.env.APIFY_TOKEN?.trim() ?? "";
  if (!token) return mockSignalsAsTool(inp, requestId, "instagram", limit);

  void region;
  const actor = process.env.APIFY_ACTOR_INSTAGRAM?.trim() || "apify/instagram-hashtag-scraper";
  const rows = await runActorSync(actor, { hashtags: [ht], resultsLimit: limit }, token, 120);

  return rows.slice(0, limit).map((item, idx) => {
    const caption = str(item.caption ?? item.text).trim();
    const rawHashtags = item.hashtags ?? item.hashtag ?? [];
    const kws = Array.isArray(rawHashtags)
      ? rawHashtags.slice(0, 24).map((x) => str(x).replace(/^#/, "").trim()).filter(Boolean)
      : str(rawHashtags).split(/\s+/).map((x) => x.replace(/^#/, "").trim()).filter(Boolean);
    const owner = str(item.ownerUsername ?? item.owner ?? item.username) || "?";
    const url = str(item.url ?? item.postUrl ?? item.link ?? item.instagramUrl).trim();
    const titleCaption = caption.slice(0, 80) + (caption.length > 80 ? "..." : "");
    return {
      source_type: "instagram",
      title: (`@${owner} ${titleCaption}`).trim() || `Instagram post #${ht}`,
      url: url || `https://www.instagram.com/explore/tags/${ht}/`,
      snippet: caption.slice(0, 600) || `Instagram post #${ht}`,
      published_at: parseIsoDay(item.timestamp ?? item.date ?? item.postedAt),
      trend_keywords: [...new Set([ht, ...kws, inp.item, inp.category])].slice(0, 24),
      relevance_score: instagramEngagementHeuristic(item) - idx * 0.5,
    };
  });
}

function flattenGoogleItems(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.flatMap((row) => {
    const organic = row.organicResults;
    if (Array.isArray(organic)) {
      return organic.filter((x): x is Record<string, unknown> => !!x && typeof x === "object");
    }
    return [row];
  });
}

export async function runWebActor(
  query: string,
  region: string | undefined,
  dateRangeDays: number,
  maxResults: number,
  inp: CalculationInput,
  requestId: string,
): Promise<RawSignal[]> {
  const q = query.trim() || `${inp.item} ${inp.category} trend`;
  const limit = Math.max(5, Math.min(30, Number(maxResults || 10)));
  void dateRangeDays;

  const token = process.env.APIFY_TOKEN?.trim() ?? "";
  if (!token) return mockSignalsAsTool(inp, requestId, "web", limit);

  const actor = process.env.APIFY_ACTOR_WEB?.trim() || "apify/google-search-scraper";
  const payload = {
    queries: q,
    maxPagesPerQuery: 1,
    resultsPerPage: limit,
    countryCode: countryForRegion(region || inp.region),
  };
  const rows = flattenGoogleItems(await runActorSync(actor, payload, token, 120));

  return rows.slice(0, limit).map((item, rank) => {
    const title = str(item.title ?? item.pageTitle).trim() || "Web result";
    const url = str(item.url ?? item.link).trim();
    const desc = str(item.description ?? item.snippet ?? item.text).trim();
    return {
      source_type: "web",
      title: title.slice(0, 280),
      url: url || `https://example.invalid/web/${requestId}/${rank}`,
      snippet: desc.slice(0, 600),
      published_at: parseIsoDay(item.date ?? item.publishedTime),
      trend_keywords: [inp.item, inp.category, q.split(/\s+/)[0] ?? ""].filter(Boolean).slice(0, 24),
      relevance_score: Math.max(20, 100 - rank * 5),
    };
  });
}
