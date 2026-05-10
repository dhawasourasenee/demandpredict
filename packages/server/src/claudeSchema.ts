import { z } from "zod";

export const claudeTrendAnalysisSchema = z.object({
  trend_strength: z.number().min(0).max(100),
  commercial_viability: z.number().min(0).max(100),
  regional_relevance: z.number().min(0).max(100),
  seasonal_relevance: z.number().min(0).max(100),
  customer_fit: z.number().min(0).max(100),
  saturation_risk: z.number().min(0).max(100),
  momentum: z.number().min(0).max(100),
  recommended_mix_percent: z.number().min(0).max(100),
  status_explanation: z.string(),
  assortment_recommendation: z.string(),
  related_opportunity_labels: z
    .array(z.string())
    .default([])
    .transform((a) => a.slice(0, 6)),
  risks: z.array(z.string()).default([]),
  confidence_reasoning: z.string(),
  evidence_linked_summary: z.array(z.string()).default([]),
});

export type ClaudeTrendAnalysis = z.infer<typeof claudeTrendAnalysisSchema>;
