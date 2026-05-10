import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { calculationInputSchema, type CalculationInput } from "@foc/shared";
import { useMemo, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { AppShell, CalcIconCircle, InfoTip } from "@/components/wgsn/AppShell";
import { CATEGORY_ITEMS, CATEGORY_KEYS } from "@/features/calculator/category-options";
import { createCalculation } from "@/lib/api";
import { titleCase } from "@/lib/format";

function FloatingInput({
  label,
  type = "text",
  suffix,
  prefix,
  className = "",
  mutedBg,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, "prefix"> & {
  label: string;
  suffix?: ReactNode;
  prefix?: ReactNode;
  mutedBg?: boolean;
}) {
  return (
    <div className={`relative ${className}`}>
      <label className="absolute left-3 top-0 z-10 -translate-y-1/2 bg-white px-1 text-[11px] text-wgsn-muted">
        {label}
      </label>
      <div
        className={`flex items-center rounded border border-neutral-300 ${mutedBg || type === "number" ? "bg-wgsn-inputbg" : "bg-white"}`}
      >
        {prefix && <span className="pl-3 text-sm text-neutral-600">{prefix}</span>}
        <input
          type={type}
          className={`min-h-[48px] w-full rounded bg-transparent px-3 py-2 text-sm outline-none placeholder:text-neutral-400 ${prefix ? "pl-1" : ""}`}
          {...rest}
        />
        {suffix}
      </div>
    </div>
  );
}

function FloatingSelect({
  label,
  children,
  className = "",
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <div className={`relative ${className}`}>
      <label className="pointer-events-none absolute left-3 top-0 z-10 -translate-y-1/2 bg-white px-1 text-[11px] text-wgsn-muted">
        {label}
      </label>
      <select
        className="h-[52px] w-full appearance-none rounded border border-neutral-300 bg-white py-2 pl-3 pr-9 text-sm font-medium outline-none"
        {...rest}
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">⌄</span>
    </div>
  );
}

function RadioChip({
  name,
  value,
  checked,
  onChange,
  label,
  disabled,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  label: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label
      className={`inline-flex cursor-pointer items-center gap-2 ${disabled ? "cursor-not-allowed opacity-45" : ""}`}
    >
      <span className="relative flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 border-neutral-800 bg-white">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          className="peer sr-only"
        />
        <span className="h-[8px] w-[8px] rounded-full bg-neutral-900 opacity-0 peer-checked:opacity-100" />
      </span>
      <span className="text-[13px] text-neutral-900">{label}</span>
    </label>
  );
}

export default function CalculatorPage() {
  const navigate = useNavigate();
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const defaultValues: CalculationInput = useMemo(
    () => ({
      calculation_type: "forecast",
      market: "women",
      department: "apparel",
      customer_type: "mass",
      region: "US",
      date_range: { start: "2026-01-01", end: "2026-03-31" },
      category: "jackets",
      item: "blazer",
      asp: 130,
      planned_mix_percent: 15.7,
      planned_units: 300,
      expected_sell_through_percent: 68,
    }),
    [],
  );

  const form = useForm<CalculationInput>({
    resolver: zodResolver(calculationInputSchema),
    defaultValues,
  });

  const watchCat = form.watch("category");
  const items = CATEGORY_ITEMS[watchCat] || CATEGORY_ITEMS.jackets;

  const mutation = useMutation({
    mutationFn: (body: CalculationInput) => createCalculation(body),
    onSuccess: (data) => {
      navigate(`/reports/${data.report_id}`);
    },
    onError: (err: Error) => setStatusMsg(err.message || "Calculation failed"),
  });

  const onSubmit = form.handleSubmit((values) => {
    setStatusMsg(null);
    mutation.mutate(values);
  });

  return (
    <AppShell navVariant="calculator">
      <div className="mx-auto max-w-[720px] px-6 pb-16 pt-10">
        <header className="mb-8 flex gap-5">
          <CalcIconCircle />
          <div>
            <p className="text-sm font-medium text-wgsn-muted">Opportunity Calculator</p>
            <h1 className="mt-1 text-[32px] font-bold leading-tight tracking-tight text-neutral-900">
              Calculate your opportunity
            </h1>
            <p className="font-report mt-4 max-w-xl text-[15px] leading-relaxed text-neutral-800">
              Calculate if you have planned the right future assortment, or work out the size of a past opportunity
              you missed. By combining your sales data with WGSN&apos;s trend forecast, you can accurately plan which
              items to invest in and which to decline.
            </p>
          </div>
        </header>

        <aside className="mb-10 flex gap-3 rounded border border-wgsn-callout-border bg-wgsn-callout px-4 py-3">
          <span className="mt-0.5 shrink-0 text-wgsn-green" aria-hidden>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 19V5M4 15l4-4 4 4 8-8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <p className="text-[13px] leading-snug text-neutral-800">
            <span className="font-semibold text-wgsn-green">WGSN Data:</span> Our algorithm incorporates data from
            e-commerce sales, catwalk shows, social media, search queries and customer sentiment to forecast future
            trends with a high level of accuracy.
          </p>
        </aside>

        <form onSubmit={onSubmit} className="space-y-8">
          <section>
            <div className="mb-3 flex items-center gap-2">
              <span className="text-sm font-semibold text-neutral-900">Calculation type</span>
              <InfoTip label="Forecast looks forward from your planned window; hindsight evaluates a past missed opportunity." />
            </div>
            <div className="flex gap-4">
              {(
                [
                  ["forecast", "Forecast calculation"],
                  ["hindsight", "Hindsight calculation"],
                ] as const
              ).map(([val, lbl]) => {
                const sel = form.watch("calculation_type") === val;
                return (
                  <label
                    key={val}
                    className={`flex flex-1 cursor-pointer items-start gap-3 border-2 px-4 py-4 transition-colors ${sel ? "border-wgsn-green bg-[#edf7ed]" : "border-neutral-300 bg-white"}`}
                  >
                    <input
                      type="radio"
                      className="mt-1 h-4 w-4 accent-neutral-900"
                      checked={sel}
                      onChange={() => form.setValue("calculation_type", val)}
                    />
                    <span className="text-sm font-medium leading-snug text-neutral-900">{lbl}</span>
                  </label>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900">Market</h3>
            <div className="flex flex-wrap gap-x-8 gap-y-2">
              <RadioChip
                name="market"
                value="women"
                checked={form.watch("market") === "women"}
                onChange={() => form.setValue("market", "women")}
                label="Women"
              />
              <RadioChip
                name="market"
                value="men"
                checked={false}
                onChange={() => {}}
                label={
                  <>
                    Men <span className="text-wgsn-muted">(coming soon)</span>
                  </>
                }
                disabled
              />
            </div>
          </section>

          <section>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900">Department</h3>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <RadioChip
                name="dept"
                value="apparel"
                checked={form.watch("department") === "apparel"}
                onChange={() => form.setValue("department", "apparel")}
                label="Apparel"
              />
              <RadioChip name="dept" value="footwear" checked={false} onChange={() => {}} disabled label="Footwear (coming soon)" />
              <RadioChip
                name="dept"
                value="accessories"
                checked={false}
                onChange={() => {}}
                disabled
                label="Accessories (coming soon)"
              />
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-sm font-semibold text-neutral-900">Target customer</h3>
              <InfoTip label="Audience maturity versus trend adoption curve." />
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {(
                [
                  ["early", "Early adopter"],
                  ["mass", "Mass"],
                  ["late", "Late adopter"],
                  ["all", "All customers"],
                ] as const
              ).map(([val, lbl]) => (
                <RadioChip
                  key={val}
                  name="cust"
                  value={val}
                  checked={form.watch("customer_type") === val}
                  onChange={() => form.setValue("customer_type", val)}
                  label={lbl}
                />
              ))}
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-sm font-semibold text-neutral-900">Region</h3>
              <InfoTip label="Regional demand and adoption context." />
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-2">
              <RadioChip
                name="region"
                value="US"
                checked={form.watch("region") === "US"}
                onChange={() => form.setValue("region", "US")}
                label="US/NAM"
              />
              <RadioChip
                name="region"
                value="EMEA"
                checked={form.watch("region") === "EMEA"}
                onChange={() => form.setValue("region", "EMEA")}
                label="UK/EMEA"
              />
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center gap-2">
              <h3 className="text-sm font-semibold text-neutral-900">Date range</h3>
              <InfoTip label="Inclusive window used for trending and seasonal fit." />
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <FloatingInput
                label="Start date"
                type="date"
                className="min-w-[160px] flex-1"
                {...form.register("date_range.start")}
              />
              <span className="pb-4 text-neutral-400">—</span>
              <FloatingInput
                label="End date"
                type="date"
                className="min-w-[160px] flex-1"
                {...form.register("date_range.end")}
              />
            </div>
          </section>

          <FloatingSelect
            label="Category"
            {...form.register("category", {
              onChange: (e) => {
                const next = e.target.value;
                const arr = CATEGORY_ITEMS[next] || CATEGORY_ITEMS.jackets;
                form.setValue("item", arr[0] || "blazer");
              },
            })}
          >
            {CATEGORY_KEYS.map((c) => (
              <option key={c} value={c}>
                {titleCase(c)}
              </option>
            ))}
          </FloatingSelect>

          <FloatingSelect label="Item" {...form.register("item")}>
            {items.map((i) => (
              <option key={i} value={i}>
                {titleCase(i)}
              </option>
            ))}
          </FloatingSelect>

          <FloatingInput
            label="Average selling price"
            type="number"
            step="0.01"
            prefix={<span>$</span>}
            mutedBg
            {...form.register("asp", { valueAsNumber: true })}
          />

          <FloatingInput
            label="Planned assortment mix (%)"
            type="number"
            step="0.1"
            mutedBg
            {...form.register("planned_mix_percent", { valueAsNumber: true })}
          />

          <div className="relative">
            <span className="absolute right-3 top-[22px] z-10">
              <InfoTip label="Share of assortment you plan for this style." />
            </span>
            <FloatingInput
              label="Planned units"
              type="number"
              className="pr-10 [&>div:last-child]:pr-10"
              mutedBg
              {...form.register("planned_units", { valueAsNumber: true })}
            />
          </div>

          <div className="relative">
            <span className="absolute right-3 top-[22px] z-10">
              <InfoTip label="Sell-through expectation for the period." />
            </span>
            <FloatingInput
              label="Expected sell-through rate (%)"
              type="number"
              step="0.1"
              className="pr-10 [&>div:last-child]:pr-10"
              mutedBg
              {...form.register("expected_sell_through_percent", { valueAsNumber: true })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              className="h-11 min-w-[100px] rounded border border-neutral-900 bg-white text-sm font-medium text-neutral-900 hover:bg-neutral-50"
              onClick={() => {
                form.reset(defaultValues);
                setStatusMsg(null);
              }}
            >
              Reset
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="h-11 min-w-[140px] rounded bg-neutral-900 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
            >
              {mutation.isPending ? "Calculating…" : "Calculate"}
            </button>
          </div>
          {statusMsg && <p className="text-center text-xs text-red-600">{statusMsg}</p>}
        </form>
      </div>
    </AppShell>
  );
}
