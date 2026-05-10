import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runCalculation } from "@foc/server";
import { calculationInputSchema } from "@foc/shared";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ detail: "Method not allowed" });
  }

  try {
    const parsed = calculationInputSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(422).json({
        detail: "Invalid input",
        issues: parsed.error.flatten(),
      });
    }

    const out = await runCalculation(parsed.data);

    return res.status(200).json({
      calculation_id: out.calculationId,
      report_id: out.reportId,
      status: "complete",
      report: out.report,
    });
  } catch (e) {
    console.error("calculations_handler_error", e);
    return res.status(500).json({ detail: "Internal server error" });
  }
}
