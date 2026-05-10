import type { BusinessContext, OpportunityReport as Report } from "../lib/types";
import { currencySymbol, formatMoney, opportunityComposite } from "../lib/format";
import { MomentumChart } from "./MomentumChart";

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
          highlight: false,
        },
        {
          label: "Planned units",
          value: String(fin.planned_units),
          note: fin.planned_units_caption,
          highlight: false,
        },
        {
          label: "Planned mix",
          value: `${fin.planned_mix_percent}%`,
          note: fin.planned_mix_caption,
          highlight: false,
        },
        {
          label: "Recommended mix",
          value: `${fin.recommended_mix_percent}%`,
          note: fin.recommended_mix_caption,
          highlight: true,
        },
        {
          label: "Opportunity gap",
          value: `${fin.opportunity_gap_percent > 0 ? "+" : ""}${fin.opportunity_gap_percent}%`,
          note: fin.opportunity_gap_caption,
          highlight: true,
        },
        {
          label: "Incremental revenue",
          value: fin.incremental_revenue_compact,
          note: fin.incremental_revenue_caption,
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
    <div className="card" style={{ overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "1rem 1.25rem 0",
          gap: "0.5rem",
        }}
      >
        <button type="button" className="btn btn-ghost" onClick={onReset}>
          New analysis
        </button>
      </div>

      <div className="report-hero">
        <div
          style={{
            display: "flex",
            gap: "1.5rem",
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          {imagePreviewUrl ? (
            <img
              src={imagePreviewUrl}
              alt=""
              style={{
                width: 120,
                height: 120,
                objectFit: "cover",
                border: "1px solid var(--border)",
                borderRadius: 2,
              }}
            />
          ) : null}
          <div style={{ flex: "1 1 240px" }}>
            <h1 className="report-title">{headline}</h1>
            <p className="report-sub">{subline}</p>
            <div className="header-stats">
              <div className="stat-block">
                <div className="stat-label">Trend status</div>
                <div className="stat-value">{o.status || "—"}</div>
              </div>
              <div className="stat-block">
                <div className="stat-label">Confidence</div>
                <div className="stat-value">{t.confidence_score ?? "—"}</div>
              </div>
              <div className="stat-block">
                <div className="stat-label">Opportunity score</div>
                <div className="stat-value">{oppScore}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="section section-tight">
        <h2 className="section-title">Financial summary</h2>
        <div className="fin-summary-grid">
          {finCards.map((c) => (
            <div
              key={c.label}
              className={`fin-card${c.highlight ? " fin-card-highlight" : ""}`}
            >
              <span className="label">{c.label}</span>
              <p className="fin-card-value">{c.value}</p>
              <p className="fin-card-note">{c.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Trend scores</h2>
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
            <div key={row.key} className="trend-bar-row">
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
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Assortment analysis</h2>
        {asst ? (
          <div className="assortment-dash">
            {asst.adoption_stage ? (
              <div className="adoption-stage">
                <span className="label">Adoption stage</span>
                <p className="adoption-stage-text">{asst.adoption_stage}</p>
              </div>
            ) : null}
            <div className="mix-flow">
              <div className="mix-box">
                <span className="label">Planned mix</span>
                <p className="mix-box-value">{asst.planned_mix_percent}%</p>
              </div>
              <span className="mix-arrow" aria-hidden>
                →
              </span>
              <div className="mix-box mix-box-rec">
                <span className="label">Recommended</span>
                <p className="mix-box-value">{asst.recommended_mix_percent}%</p>
              </div>
            </div>
            <div className="opportunity-callout">
              <p className="opportunity-callout-line">{asst.opportunity_summary}</p>
              <p className="opportunity-callout-line">{asst.incremental_explanation}</p>
              <p className="calc-formula">{asst.calculation_formula}</p>
            </div>
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
      </section>

      {trendline && trendline.points?.length ? (
        <section className="section">
          <MomentumChart
            title={trendline.title}
            subtitle={trendline.subtitle}
            points={trendline.points}
          />
        </section>
      ) : null}

      <section className="section">
        <h2 className="section-title">AI garment understanding</h2>
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
      </section>

      <section className="section">
        <h2 className="section-title">Opportunity narrative</h2>
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
      </section>

      <section className="section">
        <h2 className="section-title">Evidence layer</h2>
        {report.evidence_summary?.length ? (
          report.evidence_summary.map((ev) => (
            <div key={ev.source + ev.summary.slice(0, 24)} className="evidence-card">
              <div className="evidence-source">{ev.source || "Source"}</div>
              <p style={{ margin: "0.5rem 0", color: "var(--text)" }}>
                {ev.summary}
              </p>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                <strong style={{ color: "var(--text)" }}>Why it matters:</strong>{" "}
                {ev.why_it_matters}
              </p>
              <p
                style={{
                  margin: "0.65rem 0 0",
                  fontFamily: "var(--mono)",
                  fontSize: "0.65rem",
                  color: "var(--accent)",
                }}
              >
                Signal strength: {ev.signal_strength || "—"}
              </p>
            </div>
          ))
        ) : (
          <p className="prose">No evidence rows returned.</p>
        )}
      </section>

      <section className="section">
        <h2 className="section-title">Risks</h2>
        <ul className="list-clean">
          {report.risks?.length
            ? report.risks.map((r) => (
                <li key={r.type + r.description.slice(0, 20)}>
                  <strong>{r.type}:</strong> {r.description}
                </li>
              ))
            : "—"}
        </ul>
      </section>

      <section className="section">
        <h2 className="section-title">Recommendation</h2>
        <div className="rec-box">
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
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Related opportunities</h2>
        <div className="intel-grid">
          {report.related_opportunities?.length
            ? report.related_opportunities.map((rel) => (
                <div key={rel.category} className="intel-card card-elevated">
                  <div style={{ fontWeight: 600 }}>{rel.category}</div>
                  <p style={{ margin: "0.5rem 0 0", fontSize: "0.88rem", color: "var(--text-muted)" }}>
                    {rel.reason}
                  </p>
                  <p
                    style={{
                      margin: "0.65rem 0 0",
                      fontFamily: "var(--mono)",
                      fontSize: "0.65rem",
                      color: "var(--accent)",
                    }}
                  >
                    {rel.momentum}
                  </p>
                </div>
              ))
            : "—"}
        </div>
      </section>
    </div>
  );
}
