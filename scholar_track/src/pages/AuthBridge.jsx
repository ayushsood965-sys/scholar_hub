import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

const AuthBridge = () => {
  const [params] = useSearchParams();

  useEffect(() => {
    const token = params.get("token");
    const userEncoded = params.get("user");
    const origin = params.get("origin") || "track";

    if (token) {
      localStorage.setItem("token", token);
    }

    localStorage.setItem("login_origin", origin);

    if (userEncoded) {
      try {
        const userStr = decodeURIComponent(escape(atob(userEncoded)));
        localStorage.setItem("user", userStr);
      } catch (e) {
        // fallback if base64 fails
      }
    }

    // Full page redirect so AuthContext re-initializes from localStorage
    window.location.href = "/super-dashboard";
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
        Syncing session...
      </h2>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AuthBridge;
