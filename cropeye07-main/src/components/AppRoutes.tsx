import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import Login from "../components/Login";
import App from "../App";
import CommonSpinner from "../components/CommanSpinner";
import {
  getAuthToken,
  getUserRole,
  clearAuthData,
  clearAllLocalStorage,
  setAuthData,
  isValidToken,
  getUserData,
} from "../utils/auth";
import { getCurrentUser } from "../api";
import { initializeTokenRefresh } from "../utils/tokenManager";
import { useAppContext } from "../context/AppContext";
import { prefetchAllData, prefetchFarmerProfile, prefetchFieldOfficerAgroStats } from "../services/prefetchService";
import { GATEWAY_URL } from "../utils/gatewayAuth";

const getGatewayOrigin = () => {
  try {
    return new URL(GATEWAY_URL).origin;
  } catch {
    return GATEWAY_URL;
  }
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
    // ignore
  }
};

export type UserRole =
  | "manager"
  | "admin"
  | "fieldofficer"
  | "farmer"
  | "owner";

const AppRoutesContent: React.FC = () => {
  const navigate = useNavigate();
  const { clearAppStateOnLogout, setCached } = useAppContext();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check authentication status on app start
    bootstrapTokensFromUrl();
    const token = getAuthToken();
    const savedRole = getUserRole() as UserRole | null;

    // Gateway enforcement: internal login disabled
    if (window.location.pathname === "/login") {
      if (window.location.origin !== getGatewayOrigin()) {
        window.location.assign(`${GATEWAY_URL}/login?logout=1`);
      }
      return;
    }

    if (!token) {
      setLoading(false);
      if (window.location.origin !== getGatewayOrigin()) {
        window.location.assign(`${GATEWAY_URL}/login?logout=1`);
      }
      return;
    }

    if (token) {
      // IMPORTANT: After coming from gateway, role may not be stored yet.
      // Always validate token to fetch role and avoid blank/loop screens.
      validateToken(token, (savedRole || "farmer") as UserRole);
    } else {
      setLoading(false);
    }
  }, []);

  // Initialize token refresh when authenticated
  useEffect(() => {
    if (isAuthenticated && userRole) {
      // Set up automatic token refresh
      const cleanup = initializeTokenRefresh();
      
      // Cleanup on unmount or when authentication changes
      return cleanup;
    }
  }, [isAuthenticated, userRole]);

  const validateToken = async (token: string, role: UserRole) => {
    try {
      // Check if token exists and is valid format
      if (!token || token.trim() === "") {
        handleLogout();
        return;
      }

      // Validate token format before making API call
      if (!isValidToken(token)) {
        handleLogout();
        return;
      }

      // Use the API function to get current user (automatically uses stored token)
      const response = await getCurrentUser();
      const userData = response.data;

      // Handle both string roles and numeric role_id
      let normalizedRole: UserRole;

      // Create role mapping
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
        // If role is an object with name property, use the name
        normalizedRole = userData.role.name.toLowerCase() as UserRole;
      } else if (
        userData.role &&
        typeof userData.role === "object" &&
        userData.role.id
      ) {
        // If role is an object with id property, map the id
        normalizedRole = roleMap[userData.role.id] || "farmer";
      } else if (userData.role && typeof userData.role === "string") {
        // If role is a string, use it directly
        normalizedRole = userData.role.toLowerCase() as UserRole;
      } else if (userData.role_id && typeof userData.role_id === "number") {
        // If role_id is a number, map it to role string
        normalizedRole = roleMap[userData.role_id] || "farmer";
      } else {
        // Fallback: check if role is already a number
        const roleId = userData.role || userData.role_id;
        if (typeof roleId === "number") {
          normalizedRole = roleMap[roleId] || "farmer";
        } else {
          // Invalid role, logout
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
        // For farmer: preload profile before showing dashboard (reduces "Loading farmer profile...")
        if (normalizedRole === "farmer") {
          await prefetchFarmerProfile(setCached);
        }

        setUserRole(normalizedRole);
        setIsAuthenticated(true);

        // Update localStorage with normalized role
        setAuthData(token, normalizedRole, {
          first_name: userData.first_name || "",
          last_name: userData.last_name || "",
          email: userData.email || "",
          username: userData.username || "",
          id: userData.id || "",
        });

        // Pre-fetch complete data on app load (e.g. page refresh with valid token)
        triggerPrefetch(normalizedRole);
      } else {
        // Invalid role, logout
        handleLogout();
      }
    } catch (error: any) {
      const status = error.response?.status;
      const errorMessage = error.response?.data?.detail || error.message;
      
      // Handle 401/403 - Token expired or invalid
      if (status === 401 || status === 403) {
        handleLogout();
        return;
      }
      
      // Handle network errors - keep user logged in with cached credentials
      if (!error.response || error.code === 'ECONNABORTED' || error.message?.includes('Network Error')) {
        setUserRole(role);
        setIsAuthenticated(true);
        setLoading(false);
        return;
      }
      
      // Handle other errors
      // For unknown errors, logout for security
      handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const triggerPrefetch = (role: UserRole | null) => {
    // Pre-fetch all commonly used data on login/app load (non-blocking)
    // Loads complete data and stores in cache for fast representation
    prefetchAllData(setCached, null, role)
      .then((result) => {
        console.log('🚀 Pre-fetch result:', result);
      })
      .catch((err) => {
        console.warn('⚠️ Pre-fetch failed (non-critical):', err);
      });
  };

  const handleLoginSuccess = async (role: UserRole, token: string) => {
    const normalizedRole = role.toLowerCase() as UserRole;

    // Store authentication data using utility function
    setAuthData(token, normalizedRole);

    // Update state
    setUserRole(normalizedRole);
    setIsAuthenticated(true);

    // For farmer: await profile prefetch before navigate so dashboard loads fast (no "Loading farmer profile...")
    if (normalizedRole === "farmer") {
      await prefetchFarmerProfile(setCached);
    }

    // For field officer: await agroStats prefetch so "View Field Plot" shows data instantly (no loading)
    if (normalizedRole === "fieldofficer") {
      const userData = getUserData();
      const fieldOfficerId = userData?.id;
      if (fieldOfficerId) {
        await prefetchFieldOfficerAgroStats(setCached, fieldOfficerId);
      }
    }

    // Pre-fetch rest of data in background (non-blocking)
    triggerPrefetch(normalizedRole);

    navigate("/dashboard");
  };

  const handleLogout = () => {
    // Clear in-memory app state (Soil Analysis, Fertilizer, selected plot, etc.) so next user doesn't see previous data
    clearAppStateOnLogout();
    // Clear ALL localStorage data (auth, cache, etc.)
    clearAllLocalStorage();

    setUserRole(null);
    setIsAuthenticated(false);
    if (window.location.origin !== getGatewayOrigin()) {
      window.location.assign(`${GATEWAY_URL}/login?logout=1`);
    }
  };

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <CommonSpinner />
      </div>
    );
  }

  return (
    <Routes>
      {/* Login Route */}
      <Route
        path="/login"
        element={
          <div />
        }
      />

      {/* Dashboard Route */}
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

      {/* Root Route */}
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

      {/* Catch all route */}
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
