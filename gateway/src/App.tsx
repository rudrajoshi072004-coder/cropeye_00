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

  // If not redirecting out, render the login page
  return <LoginPage />;
}

export default function App() {
  return (
    <Routes>
      {/* In production, this app is mounted under /login/ (basename). */}
      <Route path="/" element={<LandingRedirect />} />
      {/* Backward compatibility */}
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

