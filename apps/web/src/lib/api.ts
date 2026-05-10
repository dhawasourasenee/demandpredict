import type { CalculationInput } from "@foc/shared";

const EXTERNAL = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, "");

/** API path without host, e.g. `/calculations`. Same-origin `/api/...` on Vercel. */
export function apiUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return EXTERNAL ? `${EXTERNAL}${p}` : `/api${p}`;
}

async function fetchJson(path: string, init?: RequestInit) {
  let res: Response;
  try {
    res = await fetch(apiUrl(path), {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Network error";
    throw new Error(
      `${msg} — If you’re on local dev, run \`pnpm dev:vercel\` in another terminal so /api is served (Vite proxies /api to http://127.0.0.1:3000).`,
    );
  }

  const contentType = res.headers.get("content-type") ?? "";
  const text = await res.text();

  if (!res.ok) {
    throw new Error((text && text.slice(0, 900)) || res.statusText || `HTTP ${res.status}`);
  }

  if (!contentType.includes("application/json")) {
    throw new Error(
      "Expected JSON from the API but got a non-JSON response — often HTML from the SPA. " +
        "Confirm Vercel `api/` functions deploy and `/api/*` isn’t rewritten to index.html incorrectly.",
    );
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new Error(`Invalid JSON from API: ${text.slice(0, 180)}`);
  }
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
