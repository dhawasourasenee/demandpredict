type Props = {
  onFile: (file: File) => void;
};

export function LandingUpload({ onFile }: Props) {
  return (
    <div className="card" style={{ maxWidth: 640, margin: "0 auto" }}>
      <div style={{ padding: "2.5rem 2rem" }}>
        <p
          className="app-tagline"
          style={{ textAlign: "center", marginBottom: "1.25rem" }}
        >
          AI-powered fashion assortment opportunity engine
        </p>
        <label className="upload-zone" style={{ display: "block", position: "relative" }}>
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
            <div style={{ fontFamily: "var(--serif)", fontSize: "1.35rem" }}>
              Upload a garment image
            </div>
            <div style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
              to evaluate market opportunity
            </div>
            <div className="upload-hint">
              Supported: sketches · product images · runway references · CAD renders ·
              mannequin shots
            </div>
          </div>
        </label>
      </div>
    </div>
  );
}
