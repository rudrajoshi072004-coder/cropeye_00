import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import App from "../App";
import CommonSpinner from "../components/CommanSpinner";
import {
  getAuthToken,
  getUserRole,
  clearAllLocalStorage,
  setAuthData,
  isValidToken,
} from "../utils/auth";
import { getCurrentUser } from "../api";
import { initializeTokenRefresh } from "../utils/tokenManager";
import { useAppContext } from "../context/AppContext";
import {
  prefetchAllData,
  prefetchFarmerProfile,
  prefetchFieldOfficerAgroStats,
} from "../services/prefetchService";
import { GATEWAY_URL } from "../utils/gatewayAuth";

export type UserRole =
  | "manager"
  | "admin"
  | "fieldofficer"
  | "farmer"
  | "owner";

const getGatewayOrigin = () => {
  try {
    return new URL(GATEWAY_URL).origin;
  } catch {
    return GATEWAY_URL;
  }
};

const isOnGatewayPath = () => {
  try {
    return window.location.pathname.startsWith("/login");
  } catch {
    return false;
  }
};

const getGatewayLoginUrl = (logout = false) => {
  const base = getGatewayOrigin().replace(/\/+$/, "");
  const url = `${base}/login/`;
  return logout ? `${url}?logout=1` : url;
};

const bootstrapTokensFromUrl = () => {
  try {
    const url = new URL(window.location.href);
    const access = url.searchParams.get("access");
    const refresh = url.searchParams.get("refresh");
    const industry = url.searchParams.get("industry");
    if (access && refresh) {
      localStorage.setItem("access_token", access);
      localStorage.setItem("refresh_token", refresh);
      if (industry) localStorage.setItem("industry_type", industry);
      url.searchParams.delete("access");
      url.searchParams.delete("refresh");
      url.searchParams.delete("industry");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
  } catch {
    // ignore malformed URL
  }
};

const AppRoutesContent: React.FC = () => {
  const { clearAppStateOnLogout, setCached } = useAppContext();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    let checkInProgress = false;

    const checkAuth = async () => {
      if (checkInProgress) return;
      checkInProgress = true;

      try {
        bootstrapTokensFromUrl();
        const token = getAuthToken();
        const savedRole = getUserRole() as UserRole | null;

        if (!token) {
          if (isMounted) setLoading(false);
          if (window.location.origin !== getGatewayOrigin() || !isOnGatewayPath()) {
            window.location.assign(getGatewayLoginUrl(true));
          }
          checkInProgress = false;
          return;
        }

        if (window.location.pathname === "/login") {
          if (window.location.origin !== getGatewayOrigin() || !isOnGatewayPath()) {
            window.location.assign(getGatewayLoginUrl(true));
          }
          checkInProgress = false;
          return;
        }

        await validateToken(token, (savedRole || "farmer") as UserRole);
      } catch (error) {
        console.error("Auth check error:", error);
        if (isMounted) {
          setLoading(false);
        }
      } finally {
        checkInProgress = false;
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated && userRole) {
      const cleanup = initializeTokenRefresh();
      return cleanup;
    }
  }, [isAuthenticated, userRole]);

  const validateToken = async (token: string, role: UserRole) => {
    const currentPath = window.location.pathname;
    if (currentPath === "/login") {
      if (window.location.origin !== getGatewayOrigin() || !isOnGatewayPath()) {
        window.location.assign(getGatewayLoginUrl(true));
      }
      setLoading(false);
      return;
    }

    try {
      if (!token || token.trim() === "") {
        handleLogout();
        return;
      }

      if (!isValidToken(token)) {
        handleLogout();
        return;
      }

      const response = await getCurrentUser();
      const userData = response.data;

      let normalizedRole: UserRole;

      const roleMap: { [key: number]: UserRole } = {
        1: "farmer",
        2: "fieldofficer",
        3: "manager",
        4: "owner",
      };

      if (
        userData.role &&
        typeof userData.role === "object" &&
        userData.role.name
      ) {
        normalizedRole = userData.role.name.toLowerCase() as UserRole;
      } else if (
        userData.role &&
        typeof userData.role === "object" &&
        userData.role.id
      ) {
        normalizedRole = roleMap[userData.role.id] || "farmer";
      } else if (userData.role && typeof userData.role === "string") {
        normalizedRole = userData.role.toLowerCase() as UserRole;
      } else if (userData.role_id && typeof userData.role_id === "number") {
        normalizedRole = roleMap[userData.role_id] || "farmer";
      } else {
        const roleId = userData.role || userData.role_id;
        if (typeof roleId === "number") {
          normalizedRole = roleMap[roleId] || "farmer";
        } else {
          handleLogout();
          return;
        }
      }

      if (
        normalizedRole &&
        ["manager", "admin", "fieldofficer", "farmer", "owner"].includes(
          normalizedRole
        )
      ) {
        if (normalizedRole === "farmer") {
          await prefetchFarmerProfile(setCached);
        }

        setUserRole(normalizedRole);
        setIsAuthenticated(true);

        setAuthData(token, normalizedRole, {
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          email: userData.email || "",
          username: userData.username || "",
          id: userData.id || "",
        });

        triggerPrefetch(normalizedRole, userData?.id);
      } else {
        handleLogout();
      }
    } catch (error: any) {
      const status = error.response?.status;

      if (status === 401 || status === 403) {
        handleLogout();
        return;
      }

      if (!error.response || error.code === "ECONNABORTED" || error.message?.includes("Network Error")) {
        setUserRole(role);
        setIsAuthenticated(true);
        setLoading(false);
        return;
      }

      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const triggerPrefetch = (role: UserRole | null, userId?: number) => {
    if (role === "fieldofficer" && userId) {
      prefetchFieldOfficerAgroStats(setCached, userId).catch((err) => {
        console.warn("Field officer prefetch failed (non-critical):", err);
      });
    }

    prefetchAllData(setCached, null, role)
      .then((result) => {
        console.log("Pre-fetch result:", result);
      })
      .catch((err) => {
        console.warn("Pre-fetch failed (non-critical):", err);
      });
  };

  const handleLogout = () => {
    clearAppStateOnLogout();
    clearAllLocalStorage();

    setUserRole(null);
    setIsAuthenticated(false);

    if (window.location.origin !== getGatewayOrigin() || !isOnGatewayPath()) {
      window.location.assign(getGatewayLoginUrl(true));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <CommonSpinner />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<div />} />

      <Route
        path="/dashboard"
        element={
          isAuthenticated && userRole ? (
            <App userRole={userRole} onLogout={handleLogout} />
          ) : (
            <div />
          )
        }
      />

      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <div />
          )
        }
      />

      <Route
        path="*"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <div />
          )
        }
      />
    </Routes>
  );
};

const AppRoutes: React.FC = () => {
  return (
    <Router basename={import.meta.env.BASE_URL}>
      <AppRoutesContent />
    </Router>
  );
};

export default AppRoutes;
