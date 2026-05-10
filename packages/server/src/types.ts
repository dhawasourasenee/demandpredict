export type RawSignal = {
  source_type: string;
  title: string;
  url: string;
  snippet: string;
  published_at?: string;
  trend_keywords: string[];
  relevance_score?: number;
};
