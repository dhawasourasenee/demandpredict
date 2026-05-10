import type { BusinessContext, OpportunityReport } from "./types";

function apiBase(): string {
  return (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");
}

export async function analyzeGarmentOpportunity(
  imageBase64: string,
  imageMime: string,
  businessContext: BusinessContext
): Promise<OpportunityReport> {
  const base = apiBase();
  const url = `${base}/api/analyze`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image_base64: imageBase64,
      image_mime: imageMime,
      context: businessContext,
    }),
  });

  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = extractErrorDetail(data);
    throw new Error(detail || `Request failed (${res.status})`);
  }

  if (!data || typeof data !== "object" || !("report" in data)) {
    throw new Error("Invalid response shape from API");
  }

  return (data as { report: OpportunityReport }).report;
}

function extractErrorDetail(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const d = data as { detail?: unknown };
  if (typeof d.detail === "string") return d.detail;
  if (Array.isArray(d.detail)) {
    return d.detail.map((x) => JSON.stringify(x)).join("; ");
  }
  return "";
}

export function fileToBase64(file: File): Promise<{
  base64: string;
  mime: string;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Could not read file"));
        return;
      }
      const comma = result.indexOf(",");
      const base64 = comma >= 0 ? result.slice(comma + 1) : result;
      const mime = file.type || "image/jpeg";
      resolve({ base64, mime });
    };
    reader.onerror = () => reject(reader.error ?? new Error("File read failed"));
    reader.readAsDataURL(file);
  });
}
