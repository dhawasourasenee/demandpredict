import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@foc/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { createSpace, exportPdf, loadReport, saveReportToSpace } from "@/lib/api";

type TrendPoint = {
  period: string;
  trend_index: number;
  confidence_low: number;
  confidence_high: number;
  planned_mix_overlay: number;
  recommended_window_low: number;
  recommended_window_high: number;
  estimated: boolean;
};

export default function ReportPage() {
  const { id } = useParams();
  const reportId = id!;
  const [spaceName, setSpaceName] = useState("Holiday review");
  const [userId, setUserId] = useState("demo-user");
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["report", reportId],
    queryFn: () => loadReport(reportId),
    enabled: Boolean(reportId),
  });

  const spaceMutation = useMutation({
    mutationFn: async () => {
      const s = await createSpace(userId, spaceName);
      setSpaceId(s.space_id);
      await saveReportToSpace(s.space_id, reportId);
      return s.space_id;
    },
    onSuccess: () => setBanner("Report saved to your space."),
    onError: (e: Error) => setBanner(e.message),
  });

  const pdfMutation = useMutation({
    mutationFn: () => exportPdf(reportId),
    onSuccess: (data) => {
      const blob = base64ToBlob(data.content_base64, "application/pdf");
      triggerDownload(blob, data.filename);
    },
    onError: (e: Error) => setBanner(e.message),
  });

  if (q.isLoading) {
    return <Status heading="Fetching report..." />;
  }
  if (q.isError) {
    return <Status heading="Could not load report" detail={(q.error as Error).message} />;
  }

  const data = q.data as Record<string, unknown>;
  const summary = (data.calculation_summary || {}) as Record<string, unknown>;
  const opp = (data.opportunity_estimation || {}) as Record<string, unknown>;
  const reco = (data.recommendation || {}) as Record<string, unknown>;
  const confidence = (data.confidence || {}) as Record<string, unknown>;
  const assortment = (data.assortment_analysis || {}) as Record<string, unknown>;
  const trendline = Array.isArray(data.trendline_data) ? (data.trendline_data as TrendPoint[]) : [];
  const evidence = Array.isArray(data.evidence_summary) ? (data.evidence_summary as Record<string, unknown>[]) : [];
  const related = Array.isArray(data.related_opportunities) ? (data.related_opportunities as Record<string, unknown>[]) : [];
  const risks = Array.isArray(data.risks) ? (data.risks as string[]) : [];

  const chartData = trendline.map((row) => ({
    ...row,
    label: row.period.slice(0, 7),
  }));

  const anyEstimated = trendline.some((r) => r.estimated);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <Link to="/" className="text-sm text-zinc-600 underline-offset-4 hover:underline">
          ← Back to calculator
        </Link>
        <Badge>Report</Badge>
      </div>

      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Forecast summary • {String(summary.title || "")}
        </h1>
        <p className="text-sm text-zinc-600">
          Planned mix vs AI-guided mix reflects grounded signals when available—always tempered with confidence bands
          and risk notes.
        </p>
        {banner && <p className="text-xs text-emerald-700">{banner}</p>}
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assortment stance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-zinc-700">
            <Row label="Planned mix %" value={`${summary.planned_mix_percent}%`} />
            <Row label="AI recommended mix %" value={`${summary.recommended_mix_percent}%`} />
            <Row label="Difference (pts)" value={`${summary.difference_pp} pts`} />
            <Row label="Confidence bucket" value={String(summary.confidence_level || "")} />
            <Row label="Indexing status" value={String(assortment.status || "").replace("_", " ")} />
            <Row label="Opportunity gap %" value={`${assortment.opportunity_gap_percent}`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Incremental opportunity (illustrative)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-zinc-700">
            <p className="text-2xl font-semibold text-zinc-900">
              ${fmtNumber(Number(opp.incremental_opportunity_estimate || 0))}
            </p>
            <p className="text-xs leading-relaxed text-zinc-500">{String(opp.disclaimer || "")}</p>
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Model confidence ({String(confidence.level || "")}): reasoning score{" "}
              {String(confidence.score ?? "")}.
              {confidence.trend_vs_sales_note ? ` ${String(confidence.trend_vs_sales_note)}` : ""}
            </div>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Recommendation voiceover</p>
              <p className="leading-relaxed">{String(reco.summary || "")}</p>
              <p className="text-xs text-zinc-500">{String(reco.confidence_reasoning || "")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle>Trend momentum vs assortment overlays</CardTitle>
            {anyEstimated && (
              <span className="text-xs uppercase tracking-wide text-amber-700">Estimated band</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="confidence_high"
                stroke="#fcd34d"
                strokeDasharray="2 4"
                dot={false}
                name="Confidence high"
              />
              <Line
                type="monotone"
                dataKey="confidence_low"
                stroke="#fcd34d"
                strokeDasharray="2 4"
                dot={false}
                name="Confidence low"
              />
              <Line type="monotone" dataKey="trend_index" stroke="#2563eb" name="Trend index" dot={false} />
              <Line
                type="monotone"
                dataKey="planned_mix_overlay"
                stroke="#a855f7"
                strokeDasharray="4 4"
                name="Planned mix overlay"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="recommended_window_high"
                stroke="#22c55e"
                strokeDasharray="2 6"
                name="Rec. window high"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Related opportunities</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {related.map((r, idx) => (
              <Badge key={idx}>{String(r.label)}</Badge>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Risks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-zinc-700">
            {risks.map((r, idx) => (
              <p key={idx}>• {r}</p>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evidence cards</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {evidence.map((ev, idx) => (
            <div key={idx} className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm">
              <p className="font-medium text-zinc-900">{String(ev.source_title)}</p>
              <a className="text-xs text-blue-600 underline" href={String(ev.url)} target="_blank" rel="noreferrer">
                {String(ev.url)}
              </a>
              <p className="mt-2 text-xs text-zinc-600">{String(ev.snippet)}</p>
              <p className="mt-1 text-[11px] text-zinc-500">
                Keywords: {(ev.trend_keywords as string[] | undefined)?.join(", ")}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Save & export</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs uppercase tracking-wide text-zinc-500">User id</label>
            <input
              className="h-10 rounded-md border border-zinc-300 px-3 text-sm"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-xs uppercase tracking-wide text-zinc-500">Space name</label>
            <input
              className="h-10 rounded-md border border-zinc-300 px-3 text-sm"
              value={spaceName}
              onChange={(e) => setSpaceName(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" onClick={() => spaceMutation.mutate()} disabled={spaceMutation.isPending}>
              Save to space
            </Button>
            <Button variant="outline" type="button" onClick={() => pdfMutation.mutate()} disabled={pdfMutation.isPending}>
              Export PDF
            </Button>
          </div>
        </CardContent>
        {spaceId && <p className="px-6 pb-4 text-xs text-zinc-500">Active space id: {spaceId}</p>}
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <span className="text-zinc-500">{label}</span>
      <span className="font-medium text-zinc-900">{value}</span>
    </div>
  );
}

function fmtNumber(n: number) {
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

function Status({ heading, detail }: { heading: string; detail?: string }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-6 text-center text-sm text-zinc-700">
      <div>
        <p className="text-lg font-semibold text-zinc-900">{heading}</p>
        {detail && <p className="mt-2 text-xs text-zinc-600">{detail}</p>}
        <Link to="/" className="mt-4 inline-block underline">
          Back
        </Link>
      </div>
    </div>
  );
}
