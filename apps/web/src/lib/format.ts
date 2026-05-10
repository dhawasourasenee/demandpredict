/** Display title: e.g. Jackets, Blazer, US/NAM, 1.1.2026–31.3.2026 */
export function titleCase(s: string): string {
  if (!s) return "";
  return s
    .split(/[\s_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function regionLabel(code: string): string {
  if (code === "US") return "US/NAM";
  if (code === "EMEA") return "UK/EMEA";
  if (code === "APAC") return "APAC";
  return code;
}

export function formatDmY(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  return `${d}.${m}.${y}`;
}

/** Build report header line from API summary title or parts */
export function reportHeadlineFromSummary(title: string): string {
  return title.replace(/\s*→\s*/g, " – ").trim();
}
