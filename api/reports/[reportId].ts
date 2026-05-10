import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ detail: "Method not allowed" });
  }

  const { getReport } = await import("@foc/server");

  const reportId =
    typeof req.query.reportId === "string"
      ? req.query.reportId
      : Array.isArray(req.query.reportId)
        ? req.query.reportId[0]
        : undefined;

  if (!reportId) {
    return res.status(400).json({ detail: "Missing report id" });
  }

  const payload = getReport(reportId);
  if (!payload) {
    return res.status(404).json({
      detail:
        "Report not found. Run a new calculation or open the report from the calculator in this session.",
    });
  }

  return res.status(200).json(payload);
}
