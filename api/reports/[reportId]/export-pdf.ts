import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildPdfPlaceholder } from "@foc/server";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ detail: "Method not allowed" });
  }

  const reportId =
    typeof req.query.reportId === "string"
      ? req.query.reportId
      : Array.isArray(req.query.reportId)
        ? req.query.reportId[0]
        : undefined;

  if (!reportId) {
    return res.status(400).json({ detail: "Missing report id" });
  }

  const bytes = buildPdfPlaceholder(reportId);
  const b64 = Buffer.from(bytes).toString("base64");

  return res.status(200).json({
    report_id: reportId,
    filename: `opportunity-report-${reportId}.pdf`,
    content_base64: b64,
    note: "Placeholder PDF bytes; replace with fully styled export later.",
  });
}
