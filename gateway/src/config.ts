export const GATEWAY_URL =
  (import.meta.env.VITE_GATEWAY_URL as string | undefined) ||
  "http://localhost:5173";

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  "https://cropeye-server-flyio.onrender.com/api";

// CRITICAL: Industry mapping must be tolerant to typos like "grapse industry"
export function getRedirectURL(industryName: string | null | undefined): string | null {
  const name = String(industryName || "").toLowerCase().trim();

  const grapesUrl =
    (import.meta.env.VITE_GRAPES_APP_URL as string | undefined) ||
    "http://localhost:3001";
  const sugarcaneUrl =
    (import.meta.env.VITE_SUGARCANE_APP_URL as string | undefined) ||
    "http://localhost:3002";

  // Accept "grapes", "grapse", "grape", "grap..." (common typo variants)
  if (name.includes("grape") || name.includes("graps") || name.includes("grap")) {
    return grapesUrl; // cropeye06 (or /grapes behind a reverse proxy)
  }

  if (name.includes("sugarcane")) {
    return sugarcaneUrl; // cropeye07 (or /sugarcane behind a reverse proxy)
  }

  return null;
}

