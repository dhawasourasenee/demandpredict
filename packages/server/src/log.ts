/** One JSON line per emit — appears in Vercel Runtime Logs. */
export function focLog(evt: string, fields: Record<string, unknown> = {}): void {
  console.log(
    JSON.stringify({
      svc: "foc",
      ts: new Date().toISOString(),
      evt,
      ...fields,
    }),
  );
}
