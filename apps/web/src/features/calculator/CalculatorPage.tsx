import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select } from "@foc/ui";
import { calculationInputSchema, type CalculationInput } from "@foc/shared";
import { useMemo, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { CATEGORY_ITEMS, CATEGORY_KEYS } from "@/features/calculator/category-options";
import { createCalculation } from "@/lib/api";

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
      planned_mix_percent: 14.6,
      planned_units: 300,
      expected_sell_through_percent: 68,
    }),
    [],
  );

  const form = useForm<CalculationInput>({
    resolver: zodResolver(calculationInputSchema),
    defaultValues,
  });

  const category = form.watch("category");
  const items = CATEGORY_ITEMS[category] || CATEGORY_ITEMS.jackets;

  const mutation = useMutation({
    mutationFn: (body: CalculationInput) => createCalculation(body),
    onSuccess: (data) => {
      setStatusMsg("Grounding + reasoning complete. Opening report…");
      navigate(`/reports/${data.report_id}`);
    },
    onError: (err: Error) => {
      setStatusMsg(err.message || "Calculation failed");
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    setStatusMsg("Collecting live-style evidence, then running trend reasoning…");
    mutation.mutate(values);
  });

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10">
      <header className="space-y-2">
        <Badge>AI Fashion Opportunity Calculator</Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          Should this SKU set earn more or less space?
        </h1>
        <p className="max-w-3xl text-sm text-zinc-600">
          Enter your planned assortment. The backend expands fashion-native queries, grounds mock or live Apify
          evidence, reasons with Claude when configured, and returns an approximate opportunity view—never a revenue
          guarantee.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Planning inputs</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={onSubmit}>
            <Field label="Calculation type">
              <Select {...form.register("calculation_type")}>
                <option value="forecast">Forecast</option>
                <option value="hindsight">Hindsight</option>
              </Select>
            </Field>
            <Field label="Market">
              <Select {...form.register("market")}>
                <option value="women">Women</option>
                <option value="men">Men</option>
              </Select>
            </Field>
            <Field label="Department">
              <Select {...form.register("department")}>
                <option value="apparel">Apparel</option>
                <option value="footwear">Footwear</option>
                <option value="accessories">Accessories</option>
              </Select>
            </Field>
            <Field label="Customer type">
              <Select {...form.register("customer_type")}>
                <option value="early">Early</option>
                <option value="mass">Mass</option>
                <option value="late">Late</option>
              </Select>
            </Field>
            <Field label="Region">
              <Select {...form.register("region")}>
                <option value="US">US</option>
                <option value="EMEA">EMEA</option>
                <option value="APAC">APAC</option>
              </Select>
            </Field>
            <Field label="Date range start">
              <Input type="date" {...form.register("date_range.start")} />
            </Field>
            <Field label="Date range end">
              <Input type="date" {...form.register("date_range.end")} />
            </Field>
            <Field label="Category">
              <Select
                {...form.register("category", {
                  onChange: (e) => {
                    const nextCat = e.target.value;
                    const nextItems = CATEGORY_ITEMS[nextCat] || CATEGORY_ITEMS.jackets;
                    form.setValue("category", nextCat);
                    form.setValue("item", nextItems[0] || "blazer");
                  },
                })}
              >
                {CATEGORY_KEYS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Item">
              <Select {...form.register("item")}>
                {items.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="ASP (average selling price)">
              <Input type="number" step="0.01" {...form.register("asp", { valueAsNumber: true })} />
            </Field>
            <Field label="Planned mix %">
              <Input
                type="number"
                step="0.1"
                {...form.register("planned_mix_percent", { valueAsNumber: true })}
              />
            </Field>
            <Field label="Planned units">
              <Input type="number" {...form.register("planned_units", { valueAsNumber: true })} />
            </Field>
            <Field label="Expected sell-through %">
              <Input
                type="number"
                step="0.1"
                {...form.register("expected_sell_through_percent", {
                  valueAsNumber: true,
                })}
              />
            </Field>

            <div className="md:col-span-2 flex flex-col gap-2">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Grounding signals + reasoning…" : "Calculate opportunity"}
              </Button>
              {statusMsg && <p className="text-xs text-zinc-600">{statusMsg}</p>}
              {form.formState.errors["root"]?.message && (
                <p className="text-xs text-red-600">{form.formState.errors["root"].message}</p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
