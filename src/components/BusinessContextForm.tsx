import { useState } from "react";
import type { BusinessContext } from "../lib/types";

const defaultContext: BusinessContext = {
  market: "women",
  target_customer: "mass",
  region: "india",
  season: "SS26",
  average_selling_price: 200,
  planned_assortment_mix_percent: 30,
  planned_units: 300,
  expected_sell_through_percent: 68,
};

type Props = {
  imagePreviewUrl: string | null;
  onBack: () => void;
  onSubmit: (ctx: BusinessContext) => void;
};

export function BusinessContextForm({
  imagePreviewUrl,
  onBack,
  onSubmit,
}: Props) {
  const [ctx, setCtx] = useState<BusinessContext>(defaultContext);

  return (
    <div className="card" style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ padding: "2rem" }}>
        <h2
          style={{
            fontFamily: "var(--serif)",
            fontSize: "1.5rem",
            fontWeight: 400,
            margin: "0 0 0.25rem",
          }}
        >
          Business context
        </h2>
        <p style={{ color: "var(--text-muted)", margin: "0 0 1.5rem", fontSize: "0.9rem" }}>
          Assortment inputs only. Category and attributes are inferred from the image.
        </p>

        {imagePreviewUrl ? (
          <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
            <img
              src={imagePreviewUrl}
              alt="Uploaded garment"
              className="preview-thumb"
            />
          </div>
        ) : null}

        <form
          className="grid-form"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(ctx);
          }}
        >
          <div>
            <label className="label" htmlFor="market">
              Market
            </label>
            <input
              id="market"
              className="input"
              value={ctx.market}
              onChange={(e) => setCtx({ ...ctx, market: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="target_customer">
              Target customer
            </label>
            <input
              id="target_customer"
              className="input"
              value={ctx.target_customer}
              onChange={(e) =>
                setCtx({ ...ctx, target_customer: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="region">
              Region
            </label>
            <input
              id="region"
              className="input"
              value={ctx.region}
              onChange={(e) => setCtx({ ...ctx, region: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="season">
              Season
            </label>
            <input
              id="season"
              className="input"
              value={ctx.season}
              onChange={(e) => setCtx({ ...ctx, season: e.target.value })}
              placeholder="e.g. SS26, FA26, AW26"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="asp">
              Average selling price (ASP)
            </label>
            <input
              id="asp"
              className="input"
              type="number"
              min={0}
              step={1}
              value={ctx.average_selling_price}
              onChange={(e) =>
                setCtx({
                  ...ctx,
                  average_selling_price: Number(e.target.value),
                })
              }
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="mix">
              Planned assortment mix (%)
            </label>
            <input
              id="mix"
              className="input"
              type="number"
              min={0}
              max={100}
              step={1}
              value={ctx.planned_assortment_mix_percent}
              onChange={(e) =>
                setCtx({
                  ...ctx,
                  planned_assortment_mix_percent: Number(e.target.value),
                })
              }
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="units">
              Planned units
            </label>
            <input
              id="units"
              className="input"
              type="number"
              min={0}
              step={1}
              value={ctx.planned_units}
              onChange={(e) =>
                setCtx({ ...ctx, planned_units: Number(e.target.value) })
              }
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="sellthrough">
              Sell-through expectation (%)
            </label>
            <input
              id="sellthrough"
              className="input"
              type="number"
              min={0}
              max={100}
              step={1}
              value={ctx.expected_sell_through_percent}
              onChange={(e) =>
                setCtx({
                  ...ctx,
                  expected_sell_through_percent: Number(e.target.value),
                })
              }
              required
            />
          </div>

          <div
            style={{
              gridColumn: "1 / -1",
              display: "flex",
              gap: "0.75rem",
              justifyContent: "flex-end",
              marginTop: "0.5rem",
            }}
          >
            <button type="button" className="btn btn-ghost" onClick={onBack}>
              Back
            </button>
            <button type="submit" className="btn">
              Run intelligence
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
