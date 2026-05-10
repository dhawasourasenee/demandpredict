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
  adoption_stage?: string;
  mix_assortment_context?: string;
};

export type EvidenceItem = {
  source: string;
  summary: string;
  why_it_matters: string;
  signal_strength: string;
  source_channel?: string;
};

export type RiskItem = {
  type: string;
  description: string;
  severity?: "low" | "medium" | "high";
};

export type RelatedOpportunity = {
  category: string;
  reason: string;
  momentum: string;
  tag?: string;
  tag_variant?: "green" | "blue" | "gold" | "neutral";
};

export type FinalRecommendation = {
  headline?: string;
  summary: string;
  recommended_actions: string[];
  avoid: string[];
  commercial_outlook: string;
};

export type ReportMetadata = {
  sources_overview: string;
  retail_signals: string;
  confidence_note: string;
};

export type FinancialSummary = {
  currency_symbol: string;
  average_selling_price: number;
  average_selling_price_caption: string;
  planned_units: number;
  planned_units_caption: string;
  planned_mix_percent: number;
  planned_mix_caption: string;
  recommended_mix_percent: number;
  recommended_mix_caption: string;
  opportunity_gap_percent: number;
  opportunity_gap_caption: string;
  incremental_revenue: number;
  incremental_revenue_compact: string;
  incremental_revenue_caption: string;
};

export type TrendScoreBar = {
  key: string;
  label: string;
  score: number;
  tone: "positive" | "caution" | "neutral";
};

export type AssortmentDashboard = {
  adoption_stage: string;
  mix_context_line: string;
  planned_mix_percent: number;
  recommended_mix_percent: number;
  gap_percent: number;
  opportunity_summary: string;
  incremental_explanation: string;
  calculation_formula: string;
};

export type MomentumTrendPoint = {
  date: string;
  index_value: number;
};

export type MomentumTrendline = {
  title: string;
  subtitle: string;
  points: MomentumTrendPoint[];
};

export type OpportunityReport = {
  garment_analysis: GarmentAnalysis;
  trend_analysis: TrendAnalysis;
  opportunity_analysis: OpportunityAnalysis;
  evidence_summary: EvidenceItem[];
  risks: RiskItem[];
  related_opportunities: RelatedOpportunity[];
  final_recommendation: FinalRecommendation;
  report_metadata?: ReportMetadata;
  financial_summary?: FinancialSummary;
  trend_score_bars?: TrendScoreBar[];
  assortment_dashboard?: AssortmentDashboard;
  momentum_trendline?: MomentumTrendline;
};
