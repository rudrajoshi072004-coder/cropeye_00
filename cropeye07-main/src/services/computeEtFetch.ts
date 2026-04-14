/** In-flight dedupe for SEF compute-et POSTs (same plot + body → single network request, one JSON parse). */
const inflight = new Map<string, Promise<unknown>>();

function cacheKey(plotName: string, body: BodyInit | null | undefined): string {
  if (body == null || body === "") return `compute-et:${plotName}:empty`;
  if (typeof body === "string") return `compute-et:${plotName}:${body}`;
  return `compute-et:${plotName}:${String(body)}`;
}

export function fetchComputeEtJson(
  plotName: string,
  init: RequestInit = {}
): Promise<unknown> {
  const key = cacheKey(plotName, init.body ?? null);
  const existing = inflight.get(key);
  if (existing) return existing;

  const url = `https://sef-cropeye.up.railway.app/plots/${plotName}/compute-et/`;
  const pending = (async () => {
    const response = await fetch(url, init);
    if (!response.ok) {
      const txt = await response.text().catch(() => "");
      throw new Error(
        `HTTP ${response.status} ${response.statusText}${txt ? ` - ${txt}` : ""}`
      );
    }
    return response.json();
  })();

  inflight.set(key, pending);
  pending.finally(() => inflight.delete(key));
  return pending;
}
