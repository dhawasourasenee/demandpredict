import type { CalculationInput } from "@foc/shared";

const EXTERNAL = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, "");

/** API path without host, e.g. `/calculations`. Same-origin `/api/...` on Vercel. */
export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return EXTERNAL ? `${EXTERNAL}${p}` : `/api${p}`;
}

async function fetchJson(path: string, init?: RequestInit) {
  const res = await fetch(apiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json() as Promise<unknown>;
}

export async function createCalculation(body: CalculationInput) {
  return fetchJson("/calculations", {
    method: "POST",
    body: JSON.stringify(body),
  }) as Promise<{
    calculation_id: string;
    report_id: string;
    status: string;
    /** Optional eager payload; used to hydrate the report without a second fetch. */
    report?: Record<string, unknown>;
  }>;
}

export async function loadReport(reportId: string) {
  return fetchJson(`/reports/${reportId}`) as Promise<Record<string, unknown>>;
}

export async function exportPdf(reportId: string) {
  return fetchJson(`/reports/${reportId}/export-pdf`, { method: "POST" }) as Promise<{
    content_base64: string;
    filename: string;
  }>;
}

export async function createSpace(userId: string, name: string) {
  return fetchJson("/spaces", {
    method: "POST",
    body: JSON.stringify({ user_id: userId, name }),
  }) as Promise<{ space_id: string }>;
}

export async function saveReportToSpace(spaceId: string, reportId: string) {
  return fetchJson(`/spaces/${spaceId}/reports`, {
    method: "POST",
    body: JSON.stringify({ report_id: reportId }),
  });
}
