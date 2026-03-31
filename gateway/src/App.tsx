import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/Login";
import { getToken, getIndustry } from "./auth/auth";
import { getRedirectURL } from "./config";

function LandingRedirect() {
  useEffect(() => {
    const token = getToken();
    const industry = getIndustry();
    if (!token || !industry) return;
    const dest = getRedirectURL(industry);
    const refresh = localStorage.getItem("refresh_token");
    if (dest && refresh) {
      const u = new URL(dest);
      u.searchParams.set("access", token);
      u.searchParams.set("refresh", refresh);
      u.searchParams.set("industry", industry);
      window.location.assign(u.toString());
    }
  }, []);

  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

