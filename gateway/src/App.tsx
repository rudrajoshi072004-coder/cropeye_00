import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/Login";

function LandingRedirect() {
  // IMPORTANT: Always render login at /login/.
  // Redirecting based on existing tokens prevents users from reaching the login page.
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

