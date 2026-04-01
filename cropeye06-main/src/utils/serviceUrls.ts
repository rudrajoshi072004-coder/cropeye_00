/**
 * Centralized service base URLs.
 *
 * IMPORTANT:
 * - In local dev, always prefer the VITE_DEV_* URLs from env.
 * - In production, keep current behavior (Render proxy paths, etc.) and do not
 *   change backend base URL logic in `src/api.ts`.
 */
export function getEventsBaseUrl(): string {
  const devUrl = (import.meta.env.VITE_DEV_EVENTS_API_URL as string | undefined)?.trim();

  // Local dev: use env override if present, otherwise fall back to known Railway URL.
  if (import.meta.env.DEV) {
    return devUrl && devUrl.length > 0
      ? devUrl.replace(/\/+$/, "")
      : "https://cropeye-grapes-events-production.up.railway.app";
  }

  // Production: use explicit override if provided; otherwise use same-origin proxy.
  const prodOverride = (import.meta.env.VITE_GRAPES_EVENTS_BASE_URL as string | undefined)?.trim();
  if (prodOverride && prodOverride.length > 0) return prodOverride.replace(/\/+$/, "");

  if (typeof window !== "undefined") return `${window.location.origin}/events`;
  return "/events";
}

