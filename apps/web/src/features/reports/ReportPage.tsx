import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { AppShell } from "@/components/wgsn/AppShell";
import SaveToSpacesModal from "@/features/reports/SaveToSpacesModal";
import TrendChart, { type Pt } from "@/features/reports/TrendChart";
import { createSpace, exportPdf, loadReport, saveReportToSpace } from "@/lib/api";
import { formatDmY, regionLabel, titleCase } from "@/lib/format";

function fmtMoney(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function base64ToBlob(content: string, mime: string) {
  const binary = window.atob(content);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

function RelatedDelta({ idx }: { idx: number }) {
  const cycle = [
    { up: false, v: "-4.2ppt" },
    { up: true, v: "+2.0ppt" },
    { up: true, v: "+1.1ppt" },
    { up: false, v: "-0.6ppt" },
  ];
  const r = cycle[idx % cycle.length];
  return (
    <span className="inline-flex items-center gap-1 font-medium">
      <span className={`text-[10px] ${r.up ? "text-wgsn-green-bright" : "text-red-600"}`}>
        {r.up ? "▲" : "▼"}
      </span>
      {r.v}
    </span>
  );
}

export default function ReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const reportId = id!;
  const [spacesOpen, setSpacesOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["report", reportId],
    queryFn: () => loadReport(reportId),
    enabled: Boolean(reportId),
  });

  const pdfMutation = useMutation({
    mutationFn: () => exportPdf(reportId),
    onSuccess: (data) => {
      const blob = base64ToBlob(data.content_base64, "application/pdf");
      triggerDownload(blob, data.filename);
    },
    onError: (e: Error) => setToast(e.message),
  });

  if (q.isLoading) {
    return (
      <AppShell>
        <div className="py-24 text-center text-sm text-neutral-600">Loading report…</div>
      </AppShell>
    );
  }
  if (q.isError) {
    return (
      <AppShell>
        <div className="py-24 text-center text-sm text-red-700">
          {(q.error as Error).message}
          <Link to="/" className="mt-4 block text-neutral-900 underline">
            Back
          </Link>
        </div>
      </AppShell>
    );
  }

  const data = q.data as Record<string, unknown>;
  const summary = (data.calculation_summary || {}) as Record<string, unknown>;
  const opp = (data.opportunity_estimation || {}) as Record<string, unknown>;
  const reco = (data.recommendation || {}) as Record<string, unknown>;
  const assortment = (data.assortment_analysis || {}) as Record<string, unknown>;
  const trendline = Array.isArray(data.trendline_data) ? (data.trendline_data as Pt[]) : [];
  const evidence = Array.isArray(data.evidence_summary) ? (data.evidence_summary as Record<string, unknown>[]) : [];
  const related = Array.isArray(data.related_opportunities) ? (data.related_opportunities as Record<string, unknown>[]) : [];

  const headline = summary.headline as Record<string, string> | undefined;
  const headlineText = headline
    ? `${titleCase(headline.item)}, ${regionLabel(headline.region)}, ${formatDmY(headline.start)}–${formatDmY(headline.end)}`
    : String(summary.title || "");

  const mode = summary.calculation_mode === "hindsight" ? "hindsight" : "forecast";
  const subtitle = mode === "forecast" ? "Your forecast calculation" : "Your hindsight calculation";

  const chartData = trendline.map((row) => ({ ...row, label: row.period.slice(0, 7) }));
  const itemLabel = headline ? titleCase(headline.item) : "Trend";
  const anyEstimated = trendline.some((r) => r.estimated);

  const planned = Number(summary.planned_mix_percent || 0);
  const recoMix = Number(summary.recommended_mix_percent || 0);
  const diffPp = Math.abs(Number(summary.difference_pp || 0));
  const inc = Number(opp.incremental_opportunity_estimate || 0);
  const incHi = Math.round(inc * 1.052);

  const p1 =
    assortment.status === "under_indexed"
      ? `We project that you are under-indexed for ${itemLabel}. We recommend increasing the mix of ${itemLabel} in your assortment by approximately ${diffPp.toFixed(1)} percentage points versus your planned level, reflecting a directional sales opportunity illustration between $${fmtMoney(inc)} and $${fmtMoney(incHi)} — not guaranteed revenue.`
      : assortment.status === "over_indexed"
        ? `Signals suggest trimming exposure to ${itemLabel} versus your planned mix (${planned.toFixed(1)}%). Rebalance cautiously alongside inventory and margin realities.`
        : String(reco.summary || aiFallbackSummary(itemLabel, planned, recoMix));

  const relNames = related.map((r) => titleCase(String(r.label || ""))).filter(Boolean);
  const p2 =
    relNames.length > 0
      ? `Other high movers in the ${headline ? titleCase(headline.category) : "category"} space include ${relNames.slice(0, 3).join(" and ")}. We recommend calculating the opportunity for these items to optimise your assortment mix.`
      : String(reco.confidence_reasoning || "");

  return (
    <AppShell>
      <div className="border-b border-neutral-200 bg-neutral-50 px-6 py-4">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => pdfMutation.mutate()}
            disabled={pdfMutation.isPending}
            className="inline-flex h-10 items-center gap-2 rounded border border-neutral-900 bg-white px-4 text-sm font-medium text-neutral-900 hover:bg-neutral-100 disabled:opacity-50"
          >
            <span className="text-lg leading-none">↓</span>
            Download PDF
          </button>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex h-10 items-center gap-2 rounded border border-neutral-900 bg-white px-4 text-sm font-medium text-neutral-900 hover:bg-neutral-100"
          >
            <span className="text-lg leading-none">+</span>
            New calculation
          </button>
          <button
            type="button"
            onClick={() => setSpacesOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-black"
          >
            <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4h14v17H6V4zm0 17V4H4v17h2zm9-16v15h5V5h-5z" />
            </svg>
            Save to Spaces
          </button>
        </div>
        {toast && <p className="mx-auto mt-2 max-w-5xl text-right text-xs text-red-600">{toast}</p>}
      </div>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{subtitle}</p>
          <span className="rounded bg-neutral-300 px-2 py-0.5 text-[10px] font-semibold text-white">Beta</span>
          {anyEstimated && (
            <span className="text-[10px] font-medium uppercase text-amber-800">Estimated band</span>
          )}
        </div>

        <div className="mb-10 flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-[28px] font-bold leading-snug tracking-tight text-neutral-900">{headlineText}</h1>
          <button type="button" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-50">
            <span className="sr-only">Edit</span>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M4 21h4l11.5-11.5-4-4L4 17v4z" />
              <path d="M14.5 5.5l4 4" />
            </svg>
          </button>
        </div>

        <div className="mb-8 flex flex-wrap gap-12 border-b border-neutral-200 pb-8">
          <div>
            <p className="text-[34px] font-bold leading-none text-wgsn-green">{planned.toFixed(1)}%</p>
            <p className="mt-2 max-w-[280px] text-sm leading-snug text-neutral-700">
              Your assortment mix (%) · planned for this calculation
            </p>
          </div>
          <div>
            <p className="text-[34px] font-bold leading-none text-wgsn-green">{recoMix.toFixed(1)}%</p>
            <p className="mt-2 max-w-[280px] text-sm leading-snug text-neutral-700">
              Avg. forecast assortment mix (%) within given date range
            </p>
          </div>
          <div>
            <p className="text-[34px] font-bold leading-none text-wgsn-green">
              {(Number(summary.difference_pp || 0) >= 0 ? "+" : "") + Number(summary.difference_pp || 0).toFixed(1)}
              ppt
            </p>
            <p className="mt-2 max-w-[240px] text-sm leading-snug text-neutral-700">Mix gap (forecast − planned)</p>
          </div>
        </div>

        <div className="mb-14 border-b border-neutral-100 pb-10">
          <TrendChart data={chartData} itemLabel={itemLabel} />
        </div>

        <div className="mx-auto mb-14 max-w-2xl rounded-lg bg-white p-8 shadow-card">
          <p className="mb-4 text-[15px] font-medium text-neutral-900">Incremental sales opportunity</p>
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-[52px] font-bold leading-none text-wgsn-green">${fmtMoney(inc)}</span>
            <span className="text-sm text-wgsn-green/90">Approx.</span>
          </div>
          <div className="mt-8 space-y-4 border-t border-neutral-100 pt-4 text-sm">
            <div className="flex justify-between gap-6">
              <span className="text-neutral-800">Additional units needed</span>
              <span className="font-medium text-neutral-900">
                {Number(assortment.additional_units_estimate || 0).toLocaleString()}
              </span>
            </div>
            <hr className="border-neutral-100" />
            <div className="flex justify-between gap-6">
              <span className="text-neutral-800">Percentage of missed opportunity</span>
              <span className="font-medium text-neutral-900">{diffPp.toFixed(1)} ppt</span>
            </div>
          </div>
          <p className="mt-6 text-[11px] leading-relaxed text-neutral-500">{String(opp.disclaimer || "")}</p>
        </div>

        <section className="rounded-lg bg-neutral-100 p-8">
          <div className="mb-6 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-wgsn-green">
              <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 21a2 2 0 010-4 8 11 8 11l-8-14h16l-8 14zm0-17l1.5 3h3l-2 2 2 4h-9l2-4-2-2h3l1.5-3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-900">Recommendation</h2>
              <p className="font-report mt-4 text-[15px] leading-relaxed text-neutral-900">{p1}</p>
              <p className="font-report mt-4 text-[15px] leading-relaxed text-neutral-900">{p2}</p>
              <p className="mt-3 text-[12px] text-neutral-500">{String(reco.confidence_reasoning || "")}</p>
            </div>
          </div>

          <ul className="divide-y divide-neutral-200 rounded-md border border-neutral-200 bg-white">
            {relNames.slice(0, 4).map((name, idx) => (
              <li key={name} className="flex items-center gap-4 px-4 py-4">
                <span className="flex-1 text-sm font-medium text-neutral-900">{name}</span>
                <RelatedDelta idx={idx} />
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-medium text-neutral-900 hover:bg-neutral-100"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-200/80">
                    <svg className="h-3.5 w-3.5 text-neutral-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4}>
                      <rect x="4" y="3" width="16" height="18" rx="1" />
                      <path d="M8 7h3m3 0h3M8 11h9" strokeLinecap="round" />
                    </svg>
                  </span>
                  Calculate Opportunity
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {evidence.length > 0 && (
          <section className="mt-12 border-t border-neutral-200 pt-10">
            <h3 className="mb-4 text-sm font-bold text-neutral-900">Evidence</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {evidence.slice(0, 6).map((ev, idx) => (
                <div key={idx} className="rounded border border-neutral-200 bg-neutral-50 p-3 text-xs">
                  <p className="font-medium text-neutral-900">{String(ev.source_title)}</p>
                  <a className="text-blue-700 underline" href={String(ev.url)} target="_blank" rel="noreferrer">
                    {String(ev.url)}
                  </a>
                  <p className="mt-2 text-neutral-600">{String(ev.snippet)}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <SaveToSpacesModal
        open={spacesOpen}
        onClose={() => setSpacesOpen(false)}
        onSaved={() => setToast("Saved to your space.")}
        createSpaceAttach={async (name, userId) => {
          const s = await createSpace(userId, name);
          await saveReportToSpace(s.space_id, reportId);
        }}
      />
    </AppShell>
  );
}

function aiFallbackSummary(item: string, planned: number, reco: number) {
  return `Directional view for ${item}: planned mix ${planned.toFixed(1)}% vs model-leaning mix near ${reco.toFixed(1)}%. Treat as indicative only.`;
}
