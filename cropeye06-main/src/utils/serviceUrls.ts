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

const GRAPES_MAIN_PROD =
  "https://cropeye-grapes-main-production.up.railway.app";

/**
 * NPK / required-n / analyze-npk (cropeye-grapes-main-production).
 * - Dev: `/api/grapes-main` → Vite proxy (avoids CORS).
 * - Prod: same-origin `/api/grapes-main` if nginx maps it; else direct Railway (matches legacy Fertilizer).
 */
export function getGrapesMainBaseUrl(): string {
  const override = (import.meta.env.VITE_GRAPES_MAIN_BASE_URL as string | undefined)?.trim();
  if (override && override.length > 0) return override.replace(/\/+$/, "");
  const dev = (import.meta.env.VITE_DEV_GRAPES_MAIN_URL as string | undefined)?.trim();
  if (dev && dev.length > 0) return dev.replace(/\/+$/, "");
  if (import.meta.env.DEV) return "/api/grapes-main";
  return GRAPES_MAIN_PROD.replace(/\/+$/, "");
}

const GRAPES_ADMIN_PROD =
  "https://cropeye-grapes-admin-production.up.railway.app";

/**
 * Grapes admin (schedule, etc.) — `GET /grapes-schedule/{plot_name}`.
 * - Dev: `/api/dev-plot` → Vite proxy (avoids CORS).
 * - Prod: direct Railway unless `VITE_GRAPES_ADMIN_BASE_URL` is set (or same-origin proxy if added later).
 */
export function getGrapesAdminBaseUrl(): string {
  const override = (import.meta.env.VITE_GRAPES_ADMIN_BASE_URL as string | undefined)?.trim();
  if (override && override.length > 0) return override.replace(/\/+$/, "");
  const dev = (import.meta.env.VITE_DEV_GRAPES_ADMIN_URL as string | undefined)?.trim();
  if (dev && dev.length > 0) return dev.replace(/\/+$/, "");
  if (import.meta.env.DEV) return "/api/dev-plot";
  return GRAPES_ADMIN_PROD.replace(/\/+$/, "");
}

/**
 * Notifications service — `GET /api/notifications/`.
 * - Dev/Prod default: same-origin `/api/backend` (proxied by Vite/nginx).
 * - Override: `VITE_NOTIFICATIONS_BASE_URL`
 * - Override: VITE_NOTIFICATIONS_BASE_URL
 */
export function getNotificationsBaseUrl(): string {
  const override = (import.meta.env.VITE_NOTIFICATIONS_BASE_URL as string | undefined)?.trim();
  if (override && override.length > 0) return override.replace(/\/+$/, "");
  return "/api/backend";
}
