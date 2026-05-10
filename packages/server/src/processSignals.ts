import type { RawSignal } from "./types.js";

function publishedDt(value: string | undefined): Date | null {
  if (!value) return null;
  const dt = new Date(value.replace("Z", "+00:00"));
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function urlDedupeKey(url: string): string {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    const path = parsed.pathname.replace(/\/$/, "");
    return `${host}${path}`.toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

export function processSignals(raw: RawSignal[]): RawSignal[] {
  const seen = new Set<string>();
  const cleaned: RawSignal[] = [];
  const now = Date.now();

  const sortedRaw = [...raw].sort((a, b) => {
    const ar = -(a.relevance_score ?? 0);
    const br = -(b.relevance_score ?? 0);
    if (ar !== br) return ar - br;
    return a.url.localeCompare(b.url);
  });

  for (const s of sortedRaw) {
    const dedupe = s.url ? urlDedupeKey(s.url) : `${s.source_type}:${s.snippet}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);

    const pub = publishedDt(s.published_at ?? undefined);
    let rel = Number(s.relevance_score ?? 50);
    if (pub) {
      const ageDays = Math.max(0, (now - pub.getTime()) / 86400000);
      const decay = Math.max(30, 120 - ageDays);
      rel *= Math.min(1, decay / 120);
    }

    cleaned.push({
      source_type: s.source_type,
      title: s.title.trim().slice(0, 280),
      url: s.url.trim(),
      snippet: s.snippet.trim().slice(0, 1200),
      published_at: s.published_at,
      trend_keywords: [...new Set(s.trend_keywords ?? [])].slice(0, 24),
      relevance_score: Math.min(100, Math.max(0, rel)),
    });
  }

  return cleaned;
}
