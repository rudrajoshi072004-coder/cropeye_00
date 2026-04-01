/**
 * Centralized service base URLs.
 *
 * IMPORTANT:
 * - In local dev, always prefer the VITE_DEV_* URLs from env.
 * - In production, keep current behavior (Render proxy paths, etc.) and do not
 *   change backend base URL logic in `src/api.ts`.
 */
export function getEventsBaseUrl(): string {
  // Explicit override wins in any environment.
  const prodOverride = (import.meta.env.VITE_GRAPES_EVENTS_BASE_URL as string | undefined)?.trim();
  if (prodOverride && prodOverride.length > 0) return prodOverride.replace(/\/+$/, "");

  // Prefer the same Events URL in local + production (backend connections unchanged).
  const devUrl = (import.meta.env.VITE_DEV_EVENTS_API_URL as string | undefined)?.trim();
  if (devUrl && devUrl.length > 0) return devUrl.replace(/\/+$/, "");

  // Default (unchanged backend)
  return "https://cropeye-grapes-events-production.up.railway.app";
}

