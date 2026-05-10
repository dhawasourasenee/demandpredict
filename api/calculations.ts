import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ detail: "Method not allowed" });
  }

  try {
    const [{ runCalculation, focLog }, { calculationInputSchema }] = await Promise.all([
      import("@foc/server"),
      import("@foc/shared"),
    ]);

    focLog("api_calculations_post_start", {});

    const parsed = calculationInputSchema.safeParse(req.body);
    if (!parsed.success) {
      focLog("api_calculations_validation_failed", {});
      return res.status(422).json({
        detail: "Invalid input",
        issues: parsed.error.flatten(),
      });
    }

    const t0 = Date.now();
    const out = await runCalculation(parsed.data);
    focLog("api_calculations_ok", {
      ms: Date.now() - t0,
      calculation_id: out.calculationId,
      report_id: out.reportId,
    });

    return res.status(200).json({
      calculation_id: out.calculationId,
      report_id: out.reportId,
      status: "complete",
      report: out.report,
    });
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    console.error(
      JSON.stringify({
        svc: "foc",
        ts: new Date().toISOString(),
        evt: "api_calculations_error",
        err: err.slice(0, 900),
      }),
    );
    return res.status(500).json({ detail: "Internal server error" });
  }
}
