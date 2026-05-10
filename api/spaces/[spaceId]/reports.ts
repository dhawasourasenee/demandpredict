import type { VercelRequest, VercelResponse } from "@vercel/node";
import { attachReportToSpace, getSpace } from "@foc/server";

type AttachBody = { report_id?: string };

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ detail: "Method not allowed" });
  }

  const spaceId =
    typeof req.query.spaceId === "string"
      ? req.query.spaceId
      : Array.isArray(req.query.spaceId)
        ? req.query.spaceId[0]
        : undefined;

  if (!spaceId) {
    return res.status(400).json({ detail: "Missing space id" });
  }

  const body = req.body as AttachBody;
  const reportId = body.report_id?.trim();
  if (!reportId) {
    return res.status(422).json({ detail: "report_id is required" });
  }

  if (!getSpace(spaceId)) {
    return res.status(404).json({ detail: "Space not found" });
  }

  attachReportToSpace(spaceId, reportId);

  return res.status(200).json({ status: "saved", space_id: spaceId, report_id: reportId });
}
