import type { CalculationInput } from "@foc/shared";

export type ExpandResult = {
  main_query: string;
  trend_query: string;
  retailer_query: string;
  social_query: string;
  adjacent_query: string;
  regional_query: string;
  seasonal_query: string;
  all_queries: string[];
};

function seasonToken(dateEnd: string): string {
  const parts = dateEnd.split("-");
  if (parts.length < 2) return "";
  const month = Number(parts[1]);
  const yearShort = parts[0].length >= 2 ? parts[0].slice(-2) : "";
  const season = month >= 1 && month <= 8 ? "SS" : "AW";
  return yearShort ? `${season}${yearShort}` : season;
}

export function expandQueries(inp: CalculationInput): ExpandResult {
  const m = inp.market;
  const { item, category, region: regionRaw } = inp;
  const region = regionRaw.trim();
  const season = seasonToken(inp.date_range.end);

  const base = `${m} ${item} trend ${region}`;
  const seasonal = season ? `${base} ${season}`.trim() : base;

  const retailer = `${m} mass market ${category} ${item} retailer assortment ${region}`;
  const social = `${item} ${m}wear tiktok instagram trend`;
  const adjacent = `adjacent styles to ${item} ${category} ${m}`;
  const regional = `${item} adoption ${region} ${m} consumer`;

  const allQ = new Set([
    seasonal,
    `${m} tailored ${item} trend`,
    `oversized ${item} ${m}wear`,
    `${m} ${category} commercial trend ${region}`,
    retailer.trim(),
    social.trim(),
    adjacent.trim(),
    regional.trim(),
  ]);

  return {
    main_query: seasonal,
    trend_query: `${m} ${item} fashion editorial trend`,
    retailer_query: retailer,
    social_query: social,
    adjacent_query: adjacent,
    regional_query: regional,
    seasonal_query: season ? `${season} ${m} ${item}` : `${m} ${item}`,
    all_queries: [...allQ].sort(),
  };
}
