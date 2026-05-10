import { z } from "zod";

export const calculationInputSchema = z.object({
  calculation_type: z.enum(["forecast", "hindsight"]),
  market: z.enum(["women", "men"]),
  department: z.enum(["apparel", "footwear", "accessories"]),
  customer_type: z.enum(["early", "mass", "late", "all"]),
  region: z.string().trim().min(1).max(160),
  season: z.string().trim().min(1).max(80),
  date_range: z.object({
    start: z.string(),
    end: z.string(),
  }),
  category: z.string().trim().min(1).max(800),
  item: z.string().trim().min(1).max(4000),
  asp: z.number().positive(),
  planned_mix_percent: z.number().min(0).max(100),
  planned_units: z.number().int().positive(),
  expected_sell_through_percent: z.number().min(0).max(100),
});

export type CalculationInput = z.infer<typeof calculationInputSchema>;
