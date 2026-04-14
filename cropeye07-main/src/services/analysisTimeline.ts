/** GET https://cropeye-database-production.up.railway.app/analysis_timeline?plot_name=... */

const TIMELINE_PATH = "/analysis_timeline";

export interface TimelineBucket {
  growth_dates: string[];
  water_uptake_dates: string[];
  soil_moisture_dates: string[];
  pest_detection_dates: string[];
}

export interface AnalysisTimelineResponse {
  plot_name: string;
  timeline: TimelineBucket[];
}

export type MapAnalysisLayer = "Growth" | "Water Uptake" | "Soil Moisture" | "PEST";

const LAYER_TO_KEY: Record<MapAnalysisLayer, keyof TimelineBucket> = {
  Growth: "growth_dates",
  "Water Uptake": "water_uptake_dates",
  "Soil Moisture": "soil_moisture_dates",
  PEST: "pest_detection_dates",
};

/**
 * Dev: Vite proxies `/api/analysis-timeline` → cropeye-database (no CORS).
 * Prod: browser calls this URL directly — the database host must allow your site’s origin (CORS),
 * or set `VITE_ANALYSIS_TIMELINE_BASE_URL` to a same-origin path your host proxies (e.g. `/api/analysis-timeline`).
 */
export function getAnalysisTimelineBaseUrl(): string {
  const fromEnv = (import.meta.env.VITE_ANALYSIS_TIMELINE_BASE_URL as string | undefined)?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (import.meta.env.DEV) return "/api/analysis-timeline";
  return "https://cropeye-database-production.up.railway.app";
}

export async function fetchAnalysisTimeline(
  plotName: string,
): Promise<AnalysisTimelineResponse | null> {
  const trimmed = plotName?.trim();
  if (!trimmed) return null;
  const url = `${getAnalysisTimelineBaseUrl()}${TIMELINE_PATH}?plot_name=${encodeURIComponent(trimmed)}`;
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") || "";
    // If production routing returns the SPA HTML (index.html), don't treat it as a valid timeline.
    if (!ct.toLowerCase().includes("application/json")) {
      // Read a small snippet to help debugging in the UI error state.
      const snippet = await res.text().catch(() => "");
      throw new Error(
        `Timeline endpoint returned non-JSON (content-type: ${ct || "unknown"}). ` +
          `This usually means your production host is serving index.html for "${TIMELINE_PATH}" ` +
          `because a proxy/rewrite is missing or VITE_ANALYSIS_TIMELINE_BASE_URL is wrong. ` +
          (snippet ? `First bytes: ${JSON.stringify(snippet.slice(0, 120))}` : ""),
      );
    }
    const data = (await res.json()) as AnalysisTimelineResponse;
    if (data?.timeline && Array.isArray(data.timeline)) return data;
    return null;
  } catch {
    return null;
  }
}

function collectDatesForLayer(
  timeline: TimelineBucket[] | undefined,
  layer: MapAnalysisLayer,
): Set<string> {
  const key = LAYER_TO_KEY[layer];
  const set = new Set<string>();
  if (!timeline?.length) return set;
  for (const bucket of timeline) {
    const arr = bucket[key];
    if (!Array.isArray(arr)) continue;
    for (const raw of arr) {
      if (typeof raw !== "string") continue;
      const day = raw.split("T")[0].trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(day)) set.add(day);
    }
  }
  return set;
}

/** Unique analysis dates for the layer, sorted oldest → newest. */
export function sortedRebinDatesForLayer(
  timeline: TimelineBucket[] | undefined,
  layer: MapAnalysisLayer,
): string[] {
  const set = collectDatesForLayer(timeline, layer);
  return [...set].sort();
}

/** Latest calendar date that appears in any layer’s rebin lists (for a single shared map `end_date` on load). */
export function latestRebinDateAcrossAllLayers(
  timeline: TimelineBucket[] | undefined,
): string {
  if (!timeline?.length) return "";
  let best = "";
  const layers: MapAnalysisLayer[] = ["Growth", "Water Uptake", "Soil Moisture", "PEST"];
  for (const layer of layers) {
    const dates = sortedRebinDatesForLayer(timeline, layer);
    const last = dates[dates.length - 1];
    if (last && last > best) best = last;
  }
  return best;
}
