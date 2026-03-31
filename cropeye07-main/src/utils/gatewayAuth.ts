import { clearAllLocalStorage, getAuthToken } from "./auth";

export const GATEWAY_URL =
  (import.meta.env.VITE_GATEWAY_URL as string | undefined) ||
  (typeof window !== "undefined" ? window.location.origin : "http://localhost:5173");

const getGatewayOrigin = () => {
  try {
    return new URL(GATEWAY_URL).origin;
  } catch {
    return GATEWAY_URL;
  }
};

export function requireGatewayAuth(): void {
  const token = getAuthToken();
  if (!token) {
    if (window.location.origin !== getGatewayOrigin()) {
      window.location.assign(`${GATEWAY_URL}/login`);
    }
  }
}

export function gatewayLogout(): void {
  clearAllLocalStorage();
  if (window.location.origin !== getGatewayOrigin()) {
    window.location.assign(`${GATEWAY_URL}/login?logout=1`);
  }
}

