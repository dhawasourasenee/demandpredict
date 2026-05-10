import { z } from "zod";

export const calculationInputSchema = z.object({
  calculation_type: z.enum(["forecast", "hindsight"]),
  market: z.enum(["women", "men"]),
  department: z.enum(["apparel", "footwear", "accessories"]),
  customer_type: z.enum(["early", "mass", "late"]),
  region: z.enum(["US", "EMEA", "APAC"]),
  date_range: z.object({
    start: z.string(),
    end: z.string(),
  }),
  category: z.string().min(1).max(120),
  item: z.string().min(1).max(120),
  asp: z.number().positive(),
  planned_mix_percent: z.number().min(0).max(100),
  planned_units: z.number().int().positive(),
  expected_sell_through_percent: z.number().min(0).max(100),
});

export type CalculationInput = z.infer<typeof calculationInputSchema>;
