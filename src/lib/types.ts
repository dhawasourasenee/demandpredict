export type BusinessContext = {
  market: string;
  target_customer: string;
  region: string;
  season: string;
  average_selling_price: number;
  planned_assortment_mix_percent: number;
  planned_units: number;
  expected_sell_through_percent: number;
};

export type GarmentAnalysis = {
  category: string;
  subcategory: string;
  fit: string;
  silhouette: string;
  fabric_direction: string;
  wash_or_color: string;
  style_signals: string[];
  fashion_archetype: string;
  target_positioning: string;
};

export type TrendAnalysis = {
  trend_strength: number;
  commercial_viability: number;
  regional_relevance: number;
  seasonal_relevance: number;
  customer_fit: number;
  momentum_score: number;
  saturation_risk: number;
  confidence_score: number;
};

export type OpportunityAnalysis = {
  status: string;
  opportunity_gap_percent: number;
  recommended_mix_percent: number;
  incremental_sales_opportunity: number;
  recommended_units: number;
  assortment_recommendation: string;
  priority_level: string;
};

export type EvidenceItem = {
  source: string;
  summary: string;
  why_it_matters: string;
  signal_strength: string;
};

export type RiskItem = {
  type: string;
  description: string;
};

export type RelatedOpportunity = {
  category: string;
  reason: string;
  momentum: string;
};

export type FinalRecommendation = {
  summary: string;
  recommended_actions: string[];
  avoid: string[];
  commercial_outlook: string;
};

export type OpportunityReport = {
  garment_analysis: GarmentAnalysis;
  trend_analysis: TrendAnalysis;
  opportunity_analysis: OpportunityAnalysis;
  evidence_summary: EvidenceItem[];
  risks: RiskItem[];
  related_opportunities: RelatedOpportunity[];
  final_recommendation: FinalRecommendation;
};
