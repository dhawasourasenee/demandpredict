const APIFY_RUN_SYNC = "https://api.apify.com/v2/acts/{actorSlug}/run-sync-get-dataset-items";

function slugifyActorId(actorId: string): string {
  return actorId.trim().replace("/", "~");
}

export async function runActorSync(
  actorId: string,
  payload: Record<string, unknown>,
  token: string,
  timeout = 120,
): Promise<Record<string, unknown>[]> {
  const actorSlug = slugifyActorId(actorId);
  const url = new URL(APIFY_RUN_SYNC.replace("{actorSlug}", actorSlug));
  url.searchParams.set("token", token);
  url.searchParams.set("timeout", String(timeout));

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), (timeout + 30) * 1000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Apify actor ${actorId} failed with ${res.status}: ${text.slice(0, 500)}`);
    }
    const body = (await res.json()) as unknown;
    if (Array.isArray(body)) return body.filter((x): x is Record<string, unknown> => !!x && typeof x === "object");
    if (body && typeof body === "object") {
      const obj = body as Record<string, unknown>;
      const arr = obj.items ?? obj.data;
      if (Array.isArray(arr)) {
        return arr.filter((x): x is Record<string, unknown> => !!x && typeof x === "object");
      }
      return [obj];
    }
    return [];
  } finally {
    clearTimeout(timer);
  }
}
