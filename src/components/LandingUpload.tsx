type Props = {
  onFile: (file: File) => void;
};

export function LandingUpload({ onFile }: Props) {
  return (
    <div className="card landing-card-constrain">
      <div className="page-card-inner">
        <p className="landing-kicker">ai-powered · vision + live signals</p>
        <h1 className="landing-title">
          drop a garment still — we’ll chart the{" "}
          <span className="text-accent-em">commercial story</span>
        </h1>
        <p className="landing-sub">buying-room narrative, not another sterile dashboard.</p>
        <label className="upload-zone upload-zone-wrap">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              e.target.value = "";
            }}
          />
          <div>
            <div className="landing-upload-callout">upload a garment image</div>
            <div className="landing-upload-meta">
              sketches, product, runway, cad, mannequin — all welcome
            </div>
            <div className="upload-hint">
              we read silhouette, wash, archetype, and trend tension against your plan.
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}
