/**
 * Centralized service base URLs.
 *
 * IMPORTANT:
 * - Default base is `/api/events` (Vite dev proxy + nginx upstream on deploy).
 * - Override with VITE_GRAPES_EVENTS_BASE_URL or VITE_DEV_EVENTS_API_URL when needed.
 */
export function getEventsBaseUrl(): string {
  // Explicit override wins in any environment.
  const prodOverride = (import.meta.env.VITE_GRAPES_EVENTS_BASE_URL as string | undefined)?.trim();
  if (prodOverride && prodOverride.length > 0) return prodOverride.replace(/\/+$/, "");

  // Optional dev override (e.g. full URL for special testing).
  const devUrl = (import.meta.env.VITE_DEV_EVENTS_API_URL as string | undefined)?.trim();
  if (devUrl && devUrl.length > 0) return devUrl.replace(/\/+$/, "");

  // Same-origin in dev (Vite `vite.config.ts`) and production (nginx `location /api/events/`).
  // Avoids browser CORS to Railway when the SPA is served from one host.
  return "/api/events";
}

