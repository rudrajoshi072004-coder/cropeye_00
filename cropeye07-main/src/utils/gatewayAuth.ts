import { clearAllLocalStorage, getAuthToken } from "./auth";

export const GATEWAY_URL =
  (import.meta.env.VITE_GATEWAY_URL as string | undefined) ||
  (typeof window !== "undefined"
    ? (import.meta.env.DEV ? "http://localhost:5173" : window.location.origin)
    : "http://localhost:5173");

const getGatewayOrigin = () => {
  try {
    return new URL(GATEWAY_URL).origin;
  } catch {
    return GATEWAY_URL;
  }
};

const getGatewayLoginUrl = (logout = false) => {
  const base = getGatewayOrigin().replace(/\/+$/, "");
  const url = `${base}/login/`;
  return logout ? `${url}?logout=1` : url;
};

const isOnGatewayPath = () => {
  try {
    return window.location.pathname.startsWith("/login");
  } catch {
    return false;
  }
};

export function requireGatewayAuth(): void {
  const token = getAuthToken();
  if (!token) {
    // In prod we serve all apps under same origin, so use pathname check.
    if (window.location.origin !== getGatewayOrigin() || !isOnGatewayPath()) {
      window.location.assign(getGatewayLoginUrl(true));
    }
  }
}

export function gatewayLogout(): void {
  clearAllLocalStorage();
  // Always redirect unless we're already on gateway login.
  if (!isOnGatewayPath()) window.location.assign(getGatewayLoginUrl(true));
}

