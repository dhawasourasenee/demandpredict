import { useCallback, useEffect, useState } from "react";
import { LandingUpload } from "./components/LandingUpload";
import { BusinessContextForm } from "./components/BusinessContextForm";
import { ProcessingView } from "./components/ProcessingView";
import { OpportunityReportView } from "./components/OpportunityReport";
import { Article } from "@phosphor-icons/react";
import { EditorialDoodleStrip } from "./components/EditorialDecor";
import { analyzeGarmentOpportunity, fileToBase64 } from "./lib/analyzeApi";
import type { BusinessContext, OpportunityReport } from "./lib/types";

type Step = "upload" | "context" | "processing" | "report";

export default function App() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [context, setContext] = useState<BusinessContext | null>(null);
  const [report, setReport] = useState<OpportunityReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const reset = useCallback(() => {
    setStep("upload");
    setFile(null);
    setContext(null);
    setReport(null);
    setError(null);
  }, []);

  const runAnalysis = useCallback(
    async (ctx: BusinessContext) => {
      if (!file) return;
      setContext(ctx);
      setError(null);
      setStep("processing");
      try {
        const { base64, mime } = await fileToBase64(file);
        const result = await analyzeGarmentOpportunity(base64, mime, ctx);
        setReport(result);
        setStep("report");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Analysis failed");
        setStep("context");
      }
    },
    [file]
  );

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <Article className="header-ph-icon" size={40} weight="thin" aria-hidden />
          <div className="app-header-text">
            <div className="app-header-top">
              <span className="year-pill">{new Date().getFullYear()}</span>
            </div>
            <div className="app-brand">fashion opportunity intelligence</div>
            <div className="app-tagline">assortment opportunity engine — editorial briefings</div>
          </div>
        </div>
      </header>

      <main className="app-main">
        <EditorialDoodleStrip />
        {error ? <div className="error-banner">{error}</div> : null}

        {step === "upload" ? (
          <LandingUpload
            onFile={(f) => {
              setFile(f);
              setStep("context");
            }}
          />
        ) : null}

        {step === "context" && file ? (
          <BusinessContextForm
            imagePreviewUrl={previewUrl}
            onBack={() => {
              setFile(null);
              setStep("upload");
            }}
            onSubmit={runAnalysis}
          />
        ) : null}

        {step === "processing" ? <ProcessingView active /> : null}

        {step === "report" && report && context ? (
          <OpportunityReportView
            context={context}
            report={report}
            imagePreviewUrl={previewUrl}
            onReset={reset}
          />
        ) : null}
      </main>
    </div>
  );
}
