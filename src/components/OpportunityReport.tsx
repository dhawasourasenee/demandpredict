import type { ComponentType, ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Article,
  Books,
  ChartLineUp,
  CoinVertical,
  GridFour,
  Percent,
  SealCheck,
  Stack,
  TShirt,
  Warning,
} from "@phosphor-icons/react";
import {
  ChillingDoodle,
  CoffeeDoodle,
  FloatDoodle,
  GroovyDoodle,
  IceCreamDoodle,
  LovingDoodle,
  MeditatingDoodle,
  PlantDoodle,
  ReadingDoodle,
  SittingReadingDoodle,
} from "react-open-doodles";
import type { BusinessContext, OpportunityReport as Report } from "../lib/types";
import {
  currencySymbol,
  formatMoney,
  heroConfidenceScore,
  opportunityComposite,
} from "../lib/format";
import { MomentumChart } from "./MomentumChart";
import { ReportJournalCard } from "./ReportJournalCard";

type PhosphorIcon = ComponentType<{
  size?: number;
  weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
  className?: string;
  "aria-hidden"?: boolean;
}>;

function NotionSectionTitle({
  Icon,
  children,
}: {
  Icon: PhosphorIcon;
  children: ReactNode;
}) {
  return (
    <h2 className="section-title notion-section-title">
      <Icon size={20} weight="regular" className="notion-section-icon" aria-hidden />
      {children}
    </h2>
  );
}

const hoverLift = {
  whileHover: {
    y: -4,
    transition: { type: "spring" as const, stiffness: 420, damping: 26 },
  },
};

const finPop = {
  whileHover: {
    y: -6,
    scale: 1.028,
    transition: { type: "spring" as const, stiffness: 520, damping: 22 },
  },
};

const oppPop = {
  whileHover: {
    y: -7,
    rotate: -0.6,
    transition: { type: "spring" as const, stiffness: 400, damping: 20 },
  },
};

type Props = {
  context: BusinessContext;
  report: Report;
  imagePreviewUrl: string | null;
  onReset: () => void;
};

function gapDescriptor(gap: number): string {
  if (gap > 0) return "Under-indexed";
  if (gap < 0) return "Over-indexed";
  return "In line";
}

function riskSeverityClass(s?: string): string {
  const s0 = (s || "medium").toLowerCase();
  if (s0 === "high") return "risk-badge risk-badge-high";
  if (s0 === "low") return "risk-badge risk-badge-low";
  return "risk-badge risk-badge-medium";
}

function oppTagClass(v?: string): string {
  const x = (v || "neutral").toLowerCase();
  if (x === "green") return "opp-tag opp-tag-green";
  if (x === "blue") return "opp-tag opp-tag-blue";
  if (x === "gold") return "opp-tag opp-tag-gold";
  return "opp-tag opp-tag-neutral";
}

function capitalizeWord(s: string): string {
  const x = s.toLowerCase();
  return x.charAt(0).toUpperCase() + x.slice(1);
}

export function OpportunityReportView({
  context,
  report,
  imagePreviewUrl,
  onReset,
}: Props) {
  const { garment_analysis: g, trend_analysis: t, opportunity_analysis: o } =
    report;
  const oppScore = opportunityComposite(report);
  const gap = o.opportunity_gap_percent;
  const gapPct = gap > 0 ? `+${gap}%` : `${gap}%`;
  const sym = currencySymbol(context.region);
  const fin = report.financial_summary;
  const bars = report.trend_score_bars;
  const asst = report.assortment_dashboard;
  const trendline = report.momentum_trendline;
  const sellThrough = report.sell_through_analysis;

  const marketPoss =
    context.market.length > 0
      ? `${context.market.charAt(0).toUpperCase() + context.market.slice(1)}'s`
      : "";
  const fitPart = g.fit ? `${g.fit.toLowerCase()} ` : "";
  const catPart = (g.category || "garment").toLowerCase();
  const headline = [marketPoss, `${fitPart}${catPart}`.trim()]
    .filter(Boolean)
    .join(" ")
    .trim() || "Garment opportunity";

  const subline = `${context.region} ${context.target_customer} market · ${context.season}`;

  const finCards = fin
    ? [
        {
          label: "Avg selling price",
          value: `${fin.currency_symbol}${fin.average_selling_price.toLocaleString()}`,
          note: fin.average_selling_price_caption,
          reasoning: fin.average_selling_price_reasoning,
          highlight: false,
        },
        {
          label: "Planned units",
          value: String(fin.planned_units),
          note: fin.planned_units_caption,
          reasoning: fin.planned_units_reasoning,
          highlight: false,
        },
        {
          label: "Planned mix",
          value: `${fin.planned_mix_percent}%`,
          note: fin.planned_mix_caption,
          reasoning: fin.planned_mix_reasoning,
          highlight: false,
        },
        {
          label: "Recommended mix",
          value: `${fin.recommended_mix_percent}%`,
          note: fin.recommended_mix_caption,
          reasoning: fin.recommended_mix_reasoning,
          highlight: true,
        },
        {
          label: "Opportunity gap",
          value: `${fin.opportunity_gap_percent > 0 ? "+" : ""}${fin.opportunity_gap_percent}%`,
          note: fin.opportunity_gap_caption,
          reasoning: fin.opportunity_gap_reasoning,
          highlight: true,
        },
        {
          label: "Incremental revenue",
          value: fin.incremental_revenue_compact,
          note: fin.incremental_revenue_caption,
          reasoning: fin.incremental_revenue_reasoning,
          highlight: true,
        },
      ]
    : [
        {
          label: "Avg selling price",
          value: `${sym}${context.average_selling_price}`,
          note: "Per unit",
          highlight: false,
        },
        {
          label: "Planned units",
          value: String(context.planned_units),
          note: `${context.season} forecast`,
          highlight: false,
        },
        {
          label: "Planned mix",
          value: `${context.planned_assortment_mix_percent}%`,
          note: o.mix_assortment_context || "Of assortment",
          highlight: false,
        },
        {
          label: "Recommended mix",
          value: `${o.recommended_mix_percent ?? "—"}%`,
          note: "AI-adjusted target",
          highlight: true,
        },
        {
          label: "Opportunity gap",
          value: gapPct,
          note: gapDescriptor(gap),
          highlight: true,
        },
        {
          label: "Incremental revenue",
          value: formatMoney(o.incremental_sales_opportunity, context),
          note: `At ${context.expected_sell_through_percent}% sell-through`,
          highlight: true,
        },
      ];

  return (
    <div className="report-notion">
      <div className="report-actions">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <button type="button" className="btn btn-ghost" onClick={onReset}>
            new analysis
          </button>
        </motion.div>
      </div>

      <section className="section section-bento section-tight">
        <ReportJournalCard
          tone="lavender"
          doodle={PlantDoodle}
          doodleInk="#4a4e69"
          doodleAccent="#a78bfa"
        >
          <div
            className={`report-bento-hero report-bento-hero--journal${imagePreviewUrl ? "" : " report-bento-hero--no-media"}`}
          >
            {imagePreviewUrl ? (
              <motion.div
                className="hero-bento-media"
                whileHover={{ y: -6, rotate: -1.2, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 380, damping: 22 }}
              >
                <img src={imagePreviewUrl} alt="" className="report-hero-thumb" />
              </motion.div>
            ) : null}
            <div className="hero-bento-main">
              <h1 className="report-title">{headline}</h1>
              <p className="report-sub">{subline}</p>
            </div>
            <div className="header-stats hero-bento-stats">
              <motion.div
                className="stat-block"
                whileHover={{ y: -3, backgroundColor: "rgba(255,255,255,0.5)" }}
                transition={{ type: "spring", stiffness: 450, damping: 24 }}
              >
                <div className="stat-label">Trend status</div>
                <div className="stat-value">{o.status || "—"}</div>
              </motion.div>
              <motion.div
                className="stat-block"
                whileHover={{ y: -3, backgroundColor: "rgba(255,255,255,0.5)" }}
                transition={{ type: "spring", stiffness: 450, damping: 24 }}
              >
                <div className="stat-label">Confidence</div>
                <div className="stat-value">{heroConfidenceScore(t.confidence_score)}</div>
              </motion.div>
              <motion.div
                className="stat-block"
                whileHover={{ y: -3, backgroundColor: "rgba(255,255,255,0.5)" }}
                transition={{ type: "spring", stiffness: 450, damping: 24 }}
              >
                <div className="stat-label">Opportunity score</div>
                <div className="stat-value">{oppScore}</div>
              </motion.div>
            </div>
          </div>
        </ReportJournalCard>
      </section>

      <section className="section section-bento section-tight">
        <ReportJournalCard
          tone="peach"
          doodle={CoffeeDoodle}
          doodleInk="#4a4e69"
          doodleAccent="#fb923c"
        >
          <NotionSectionTitle Icon={CoinVertical}>financial summary</NotionSectionTitle>
          <div className="report-fin-bento">
            {finCards.map((c) => (
              <motion.div
                key={c.label}
                className={`fin-card fin-card-bento${c.highlight ? " fin-card-highlight" : ""}`}
                {...finPop}
              >
              <span className="label">{c.label}</span>
              <p className="fin-card-value">{c.value}</p>
              <p className="fin-card-note">{c.note}</p>
              {"reasoning" in c && c.reasoning ? (
                <p className="fin-card-reasoning">{c.reasoning}</p>
              ) : null}
            </motion.div>
          ))}
          </div>
        </ReportJournalCard>
      </section>

      {sellThrough ? (
        <section className="section section-bento section-tight">
          <ReportJournalCard
            tone="sky"
            doodle={ReadingDoodle}
            doodleInk="#334155"
            doodleAccent="#38bdf8"
          >
            <NotionSectionTitle Icon={Percent}>sell-through analysis</NotionSectionTitle>
            <p className="section-kicker">
              Planner assumption vs AI research-based expectation for this SKU. Incremental revenue in the
              grid above uses your planner sell-through; figures below show the same opportunity at the
              AI-expected rate.
            </p>
            <motion.div
              className="sell-through-panel"
              whileHover={{
                scale: 1.01,
                boxShadow: "0 12px 36px rgba(56, 189, 248, 0.18)",
              }}
              transition={{ type: "spring", stiffness: 380, damping: 24 }}
            >
            <div className="st-metrics">
              <motion.div className="st-metric" {...hoverLift}>
                <span className="label">Planner sell-through</span>
                <p className="st-metric-value">{sellThrough.buyer_assumption_percent}%</p>
              </motion.div>
              <motion.div className="st-metric" {...hoverLift}>
                <span className="label">AI-expected sell-through</span>
                <p className="st-metric-value st-metric-highlight">
                  {sellThrough.final_sell_through_percent}%
                </p>
              </motion.div>
              <motion.div className="st-metric" {...hoverLift}>
                <span className="label">Incremental @ planner ST</span>
                <p className="st-metric-value">
                  {sym}
                  {(sellThrough.planner_incremental_revenue ?? 0).toLocaleString()}
                </p>
              </motion.div>
              <motion.div className="st-metric" {...hoverLift}>
                <span className="label">Incremental @ AI ST</span>
                <p className="st-metric-value">
                  {sellThrough.incremental_revenue_at_ai_st_compact ??
                    `${sym}${(sellThrough.incremental_revenue_at_ai_st ?? 0).toLocaleString()}`}
                </p>
              </motion.div>
            </div>
            {sellThrough.summary ? <p className="st-summary">{sellThrough.summary}</p> : null}
            {sellThrough.reasoning ? (
              <div className="st-reasoning prose">
                {sellThrough.reasoning.split(/\n+/).map((para) => (
                  <p key={para.slice(0, 48)}>{para}</p>
                ))}
              </div>
            ) : null}
            {sellThrough.upside_drivers?.length ? (
              <div className="st-list-block">
                <div className="label">Upside drivers</div>
                <ul className="list-clean">
                  {sellThrough.upside_drivers.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {sellThrough.risk_factors?.length ? (
              <div className="st-list-block">
                <div className="label">Sell-through risks</div>
                <ul className="list-clean">
                  {sellThrough.risk_factors.map((x) => (
                    <li key={x}>{x}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            </motion.div>
          </ReportJournalCard>
        </section>
      ) : null}

      <div className="report-split-band">
      <section className="section section-split section-bento">
        <ReportJournalCard
          tone="peach"
          doodle={FloatDoodle}
          doodleInk="#4a4e69"
          doodleAccent="#f472b6"
        >
          <NotionSectionTitle Icon={ChartLineUp}>trend scores</NotionSectionTitle>
        <div className="trend-bars">
          {(bars && bars.length
            ? bars
            : [
                ["Trend strength", t.trend_strength, "positive"],
                ["Commercial viability", t.commercial_viability, "positive"],
                ["Momentum", t.momentum_score, "positive"],
                [
                  `Regional relevance (${context.region})`,
                  t.regional_relevance,
                  "positive",
                ],
                [
                  `Seasonal relevance (${context.season})`,
                  t.seasonal_relevance,
                  "caution",
                ],
                [
                  `Customer fit (${context.target_customer})`,
                  t.customer_fit,
                  "positive",
                ],
                ["Saturation risk", t.saturation_risk, "caution"],
              ].map(([label, score, tone]) => ({
                key: String(label),
                label: String(label),
                score: Number(score),
                tone: tone as "positive" | "caution" | "neutral",
              }))
          ).map((row) => (
            <motion.div
              key={row.key}
              className="trend-bar-row"
              initial={false}
              whileHover={{ x: 4 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
            >
              <div className="trend-bar-head">
                <span className="trend-bar-label">{row.label}</span>
                <span className="trend-bar-score">{row.score}</span>
              </div>
              <div className="trend-bar-track">
                <div
                  className={`trend-bar-fill trend-bar-${row.tone}`}
                  style={{ width: `${Math.min(100, Math.max(0, row.score))}%` }}
                />
              </div>
            </motion.div>
          ))}
        </div>
        </ReportJournalCard>
      </section>

      <section className="section section-split section-bento">
        <ReportJournalCard
          tone="mint"
          doodle={LovingDoodle}
          doodleInk="#14532d"
          doodleAccent="#34d399"
        >
          <NotionSectionTitle Icon={Stack}>assortment analysis</NotionSectionTitle>
        {asst ? (
          <div className="assortment-dash">
            {asst.adoption_stage ? (
              <div className="adoption-stage">
                <span className="label">Adoption stage</span>
                <p className="adoption-stage-text">{asst.adoption_stage}</p>
              </div>
            ) : null}
            <div className="mix-flow">
              <motion.div className="mix-box" {...hoverLift}>
                <span className="label">Planned mix</span>
                <p className="mix-box-value">{asst.planned_mix_percent}%</p>
              </motion.div>
              <span className="mix-arrow" aria-hidden>
                →
              </span>
              <motion.div className="mix-box mix-box-rec" {...hoverLift}>
                <span className="label">Recommended</span>
                <p className="mix-box-value">{asst.recommended_mix_percent}%</p>
              </motion.div>
            </div>
            <motion.div className="opportunity-callout" {...hoverLift}>
              <p className="opportunity-callout-line">{asst.opportunity_summary}</p>
              <p className="opportunity-callout-line">{asst.incremental_explanation}</p>
              <p className="calc-formula">{asst.calculation_formula}</p>
            </motion.div>
          </div>
        ) : (
          <div className="prose">
            <p>
              <strong>Gap:</strong> {gapPct} ({gapDescriptor(gap)}).{" "}
              <strong>Recommended mix:</strong> {o.recommended_mix_percent}% vs{" "}
              {context.planned_assortment_mix_percent}% planned.
            </p>
          </div>
        )}
        </ReportJournalCard>
      </section>
      </div>

      {trendline && trendline.points?.length ? (
        <section className="section section-bento">
          <ReportJournalCard
            tone="sky"
            doodle={MeditatingDoodle}
            doodleInk="#3730a3"
            doodleAccent="#818cf8"
          >
            <MomentumChart
              title={trendline.title}
              subtitle={trendline.subtitle}
              points={trendline.points}
            />
          </ReportJournalCard>
        </section>
      ) : null}

      <section className="section section-bento">
        <ReportJournalCard
          tone="peach"
          doodle={IceCreamDoodle}
          doodleInk="#4a4e69"
          doodleAccent="#f9a8d4"
        >
          <NotionSectionTitle Icon={TShirt}>ai garment understanding</NotionSectionTitle>
        <div className="attr-grid">
          <div className="attr-block">
            <dl style={{ margin: 0 }}>
              <dt>Category</dt>
              <dd>{g.category || "—"}</dd>
              {g.subcategory ? (
                <>
                  <dt style={{ marginTop: "0.75rem" }}>Subcategory</dt>
                  <dd>{g.subcategory}</dd>
                </>
              ) : null}
              <dt style={{ marginTop: "0.75rem" }}>Fit</dt>
              <dd>{g.fit || "—"}</dd>
              <dt style={{ marginTop: "0.75rem" }}>Silhouette</dt>
              <dd>{g.silhouette || "—"}</dd>
              <dt style={{ marginTop: "0.75rem" }}>Fabric direction</dt>
              <dd>{g.fabric_direction || "—"}</dd>
              <dt style={{ marginTop: "0.75rem" }}>Wash / color</dt>
              <dd>{g.wash_or_color || "—"}</dd>
              <dt style={{ marginTop: "0.75rem" }}>Fashion archetype</dt>
              <dd>{g.fashion_archetype || "—"}</dd>
              <dt style={{ marginTop: "0.75rem" }}>Target positioning</dt>
              <dd>{g.target_positioning || "—"}</dd>
            </dl>
          </div>
          <div>
            <div className="label" style={{ marginBottom: "0.5rem" }}>
              Style signals
            </div>
            <div className="pill-row">
              {(g.style_signals?.length ? g.style_signals : ["—"]).map((s) => (
                <span key={s} className="pill">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
        </ReportJournalCard>
      </section>

      <section className="section section-bento">
        <ReportJournalCard
          tone="lavender"
          doodle={SittingReadingDoodle}
          doodleInk="#4a4e69"
          doodleAccent="#c084fc"
        >
          <NotionSectionTitle Icon={Article}>opportunity narrative</NotionSectionTitle>
          <div className="prose">
          {o.assortment_recommendation
            .split(/\n+/)
            .filter(Boolean)
            .map((para) => (
              <p key={para.slice(0, 40)}>{para}</p>
            ))}
          {!o.assortment_recommendation ? (
            <p>No narrative provided for this run.</p>
          ) : null}
          {o.priority_level ? (
            <p>
              <strong>Priority:</strong> {o.priority_level}
            </p>
          ) : null}
          {o.recommended_units ? (
            <p>
              <strong>Suggested units:</strong> {o.recommended_units}
            </p>
          ) : null}
          </div>
        </ReportJournalCard>
      </section>

      <section className="section section-bento">
        <ReportJournalCard
          tone="mint"
          doodle={GroovyDoodle}
          doodleInk="#14532d"
          doodleAccent="#2dd4bf"
        >
          <NotionSectionTitle Icon={Books}>evidence summary</NotionSectionTitle>
        <p className="section-kicker">
          Evidence is grounded in OpenAI-hosted web search when the API runs with a model that supports
          the Responses API <code className="inline-code">web_search</code> tool.
        </p>
        {report.evidence_summary?.length ? (
          <div className="evidence-grid">
            {report.evidence_summary.map((ev) => (
              <motion.div
                key={ev.source + ev.summary.slice(0, 24)}
                className="evidence-row"
                {...hoverLift}
              >
                <div className="evidence-row-source">
                  <span className="evidence-source-name">{ev.source || "Source"}</span>
                  {ev.source_channel ? (
                    <span className="evidence-channel">{ev.source_channel}</span>
                  ) : null}
                </div>
                <div className="evidence-row-body">
                  <p className="evidence-summary-text">{ev.summary}</p>
                  {ev.why_it_matters ? (
                    <p className="evidence-why">
                      <strong>Why it matters:</strong> {ev.why_it_matters}
                    </p>
                  ) : null}
                  {ev.signal_strength ? (
                    <p className="evidence-signal">Signal: {ev.signal_strength}</p>
                  ) : null}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="prose">No evidence rows returned.</p>
        )}
        </ReportJournalCard>
      </section>

      <section className="section section-bento">
        <ReportJournalCard
          tone="peach"
          doodle={ChillingDoodle}
          doodleInk="#4a4e69"
          doodleAccent="#fb7185"
        >
          <NotionSectionTitle Icon={Warning}>risk assessment</NotionSectionTitle>
        <div className="risk-list">
          {report.risks?.length
            ? report.risks.map((r) => (
                <motion.div
                  key={r.type + r.description.slice(0, 24)}
                  className="risk-item"
                  {...hoverLift}
                >
                  <span className={riskSeverityClass(r.severity)}>
                    {capitalizeWord(r.severity || "medium")}
                  </span>
                  <div className="risk-body">
                    <div className="risk-title">{r.type}</div>
                    <p className="risk-desc">{r.description}</p>
                  </div>
                </motion.div>
              ))
            : "—"}
        </div>
        </ReportJournalCard>
      </section>

      <section className="section section-bento">
        <ReportJournalCard
          tone="lavender"
          doodle={LovingDoodle}
          doodleInk="#4a1d96"
          doodleAccent="#e879f9"
        >
          <NotionSectionTitle Icon={SealCheck}>recommendation</NotionSectionTitle>
          <motion.div
            className="rec-box rec-box-featured"
            whileHover={{
              y: -5,
              boxShadow: "0 16px 40px rgba(232, 121, 249, 0.2)",
            }}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
          >
          {report.final_recommendation.headline ? (
            <h3 className="rec-headline">{report.final_recommendation.headline}</h3>
          ) : null}
          <p className="rec-summary">{report.final_recommendation.summary}</p>
          <div className="label">Prioritize</div>
          <ul className="list-clean">
            {report.final_recommendation.recommended_actions?.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          <div className="label" style={{ marginTop: "1rem" }}>
            Avoid
          </div>
          <ul className="list-clean">
            {report.final_recommendation.avoid?.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          {report.final_recommendation.commercial_outlook ? (
            <>
              <div className="label" style={{ marginTop: "1rem" }}>
                Commercial outlook
              </div>
              <p className="prose" style={{ margin: "0.35rem 0 0" }}>
                {report.final_recommendation.commercial_outlook}
              </p>
            </>
          ) : null}
          </motion.div>
        </ReportJournalCard>
      </section>

      <section className="section section-bento">
        <ReportJournalCard
          tone="sky"
          doodle={FloatDoodle}
          doodleInk="#1e3a5f"
          doodleAccent="#60a5fa"
        >
          <NotionSectionTitle Icon={GridFour}>related opportunities</NotionSectionTitle>
          <div className="opp-card-grid">
            {report.related_opportunities?.length
              ? report.related_opportunities.map((rel) => (
                  <motion.div key={rel.category} className="opp-card" {...oppPop}>
                  <div className="opp-card-title">{rel.category}</div>
                  <p className="opp-card-reason">{rel.reason}</p>
                  <div className="opp-card-footer">
                    <span className={oppTagClass(rel.tag_variant)}>
                      {rel.tag || rel.momentum || "—"}
                    </span>
                  </div>
                  </motion.div>
                ))
              : "—"}
          </div>
        </ReportJournalCard>
      </section>

      {report.report_metadata &&
      (report.report_metadata.sources_overview ||
        report.report_metadata.retail_signals ||
        report.report_metadata.confidence_note) ? (
        <footer className="report-footer">
          {report.report_metadata.sources_overview ? (
            <p>
              <span className="report-footer-label">Sources</span>{" "}
              {report.report_metadata.sources_overview}
            </p>
          ) : null}
          {report.report_metadata.retail_signals ? (
            <p>
              <span className="report-footer-label">Retail signals</span>{" "}
              {report.report_metadata.retail_signals}
            </p>
          ) : null}
          {report.report_metadata.confidence_note ? (
            <p>
              <span className="report-footer-label">Confidence</span>{" "}
              {report.report_metadata.confidence_note}
            </p>
          ) : null}
        </footer>
      ) : null}
    </div>
  );
}
