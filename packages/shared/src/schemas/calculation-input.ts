import { z } from "zod";

/** Defaults when fields are omitted, empty, or invalid — keeps API + Claude payload well-formed. */
const D = {
  region: "Not specified",
  season: "Not specified",
  category: "general",
  item: "unspecified",
  dateStart: "2026-01-01",
  dateEnd: "2026-12-31",
  asp: 1,
  planned_mix_percent: 0,
  planned_units: 1,
  expected_sell_through_percent: 50,
} as const;

function trimOrFallback(max: number, fallback: string) {
  return z.preprocess((v: unknown) => {
    if (v === undefined || v === null) return fallback;
    const s = String(v).trim();
    return s.length > 0 ? s.slice(0, max) : fallback;
  }, z.string().max(max));
}

function preprocessDateRange(v: unknown): { start: string; end: string } {
  if (!v || typeof v !== "object") {
    return { start: D.dateStart, end: D.dateEnd };
  }
  const o = v as Record<string, unknown>;
  const rawStart = o.start;
  const rawEnd = o.end;
  const start =
    rawStart === undefined || rawStart === null || String(rawStart).trim() === ""
      ? D.dateStart
      : String(rawStart).trim().slice(0, 32);
  const end =
    rawEnd === undefined || rawEnd === null || String(rawEnd).trim() === ""
      ? D.dateEnd
      : String(rawEnd).trim().slice(0, 32);
  return { start, end };
}

function coercedNumber(def: number, bounds: z.ZodNumber) {
  return z.preprocess((v: unknown) => {
    if (v === undefined || v === null) return def;
    if (typeof v === "number" && Number.isNaN(v)) return def;
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isNaN(n)) return def;
    return n;
  }, bounds);
}

export const calculationInputSchema = z.object({
  calculation_type: z.enum(["forecast", "hindsight"]),
  market: z.enum(["women", "men"]),
  department: z.enum(["apparel", "footwear", "accessories"]),
  customer_type: z.enum(["early", "mass", "late", "all"]),
  region: trimOrFallback(160, D.region),
  season: trimOrFallback(80, D.season),
  date_range: z.preprocess(preprocessDateRange, z.object({ start: z.string(), end: z.string() })),
  category: trimOrFallback(800, D.category),
  item: trimOrFallback(4000, D.item),
  asp: coercedNumber(D.asp, z.number().positive()),
  planned_mix_percent: coercedNumber(D.planned_mix_percent, z.number().min(0).max(100)),
  planned_units: coercedNumber(D.planned_units, z.number().int().positive()),
  expected_sell_through_percent: coercedNumber(
    D.expected_sell_through_percent,
    z.number().min(0).max(100),
  ),
});

export type CalculationInput = z.infer<typeof calculationInputSchema>;
