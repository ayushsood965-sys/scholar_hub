import React, { useEffect } from "react";
import { SCHOLAR_TRACK_URL } from "../config";

const SuperAdminDashboard = () => {
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    const params = new URLSearchParams();
    if (token) params.set("token", token);
    params.set("origin", "sync");
    if (user) {
      try {
        params.set("user", btoa(unescape(encodeURIComponent(user))));
      } catch (err) {
        console.error("Failed to encode user data:", err);
      }
    }
    window.location.replace(
      `${SCHOLAR_TRACK_URL}/auth-bridge?${params.toString()}`,
    );
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "var(--color-bg, #f8fafc)",
        fontFamily: "Inter, sans-serif",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "4px solid var(--color-primary, #1A5A3B)",
          borderTopColor: "transparent",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <h2
        style={{
          color: "var(--text-primary, #1F2937)",
          fontWeight: 700,
          fontSize: "1.2rem",
        }}
      >
        Redirecting to Unified Dashboard
      </h2>
      <p
        style={{ color: "var(--text-secondary, #6B7280)", fontSize: "0.85rem" }}
      >
        Super Admin portal is now consolidated in ScholarTrack.
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default SuperAdminDashboard;
