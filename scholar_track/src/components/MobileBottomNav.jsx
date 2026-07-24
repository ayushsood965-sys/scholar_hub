import React, { useState } from "react";
import { Menu, Home, User, LogOut, Globe, Download } from "lucide-react";
import { isStandaloneApp } from "./InstallPrompt";
import "./MobileBottomNav.css";

const MobileBottomNav = ({
  activeTab,
  onTabChange,
  navItems = [],
  isLocked = false,
  onLogout,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  // Find the first navigation item (excluding section headers and profile) to treat as Home
  const homeItem = navItems.find((item) => item.key && item.key !== "profile" && !item.kind);
  const homeKey = homeItem ? homeItem.key : "overview";

  const handleTabClick = (key) => {
    if (isLocked && key !== "profile") return;
    onTabChange(key);
    setMenuOpen(false);
  };

  return (
    <>
      {/* Full menu items when toggled */}
      {menuOpen && (
        <div className="mobile-menu-overlay">
          <div className="mobile-menu-header">
            <h3>Navigation Menu</h3>
          </div>
          <div className="mobile-menu-list">
            <button
              onClick={() => {
                sessionStorage.setItem("allow_landing", "true");
                window.location.href = "/?view=home";
              }}
              className="mobile-menu-item visit-home-btn"
              style={{
                background: "rgba(16, 185, 129, 0.14)",
                color: "#10B981",
                fontWeight: 700,
                marginBottom: "8px",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 16px",
                borderRadius: "10px",
                width: "100%",
                cursor: "pointer",
              }}
            >
              <Globe className="mobile-menu-item-icon" size={20} style={{ color: "#10B981" }} />
              <span className="mobile-menu-item-label">Visit Home Page</span>
            </button>

            {!isStandaloneApp() && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  window.dispatchEvent(new CustomEvent('trigger-pwa-install-modal'));
                }}
                className="mobile-menu-item install-app-btn"
                style={{
                  background: "rgba(99, 102, 241, 0.14)",
                  color: "#6366f1",
                  fontWeight: 700,
                  marginBottom: "10px",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  width: "100%",
                  cursor: "pointer",
                }}
              >
                <Download className="mobile-menu-item-icon" size={20} style={{ color: "#6366f1" }} />
                <span className="mobile-menu-item-label">📲 Install Mobile App</span>
              </button>
            )}

            {navItems.map((item, idx) => {
              if (item.kind === "section") {
                return (
                  <div key={`sec-${idx}`} className="mobile-menu-section">
                    {item.label}
                  </div>
                );
              }
              const Icon = item.icon || item.Icon || Home;
              const isItemActive = activeTab === item.key;
              const isDisabled = isLocked && item.key !== "profile" && item.key !== "overview";

              return (
                <button
                  key={item.key}
                  onClick={() => !isDisabled && handleTabClick(item.key)}
                  className={`mobile-menu-item ${isItemActive ? "active" : ""} ${isDisabled ? "disabled" : ""}`}
                  disabled={isDisabled}
                >
                  <Icon className="mobile-menu-item-icon" size={20} />
                  <span className="mobile-menu-item-label">{item.label}</span>
                  {isDisabled && <span className="lock-badge">🔒</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Fixed bottom navigation bar */}
      <div className="mobile-bottom-nav">
        {/* Menu Toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className={`mobile-nav-btn ${menuOpen ? "active" : ""}`}
        >
          <Menu size={22} />
          <span>Menu</span>
        </button>

        {/* Home */}
        <button
          onClick={() => handleTabClick(homeKey)}
          className={`mobile-nav-btn ${!menuOpen && activeTab === homeKey ? "active" : ""} ${isLocked && homeKey !== "profile" && homeKey !== "overview" ? "disabled" : ""}`}
          disabled={isLocked && homeKey !== "profile" && homeKey !== "overview"}
        >
          <Home size={22} />
          <span>Home {isLocked && homeKey !== "profile" && homeKey !== "overview" && " 🔒"}</span>
        </button>

        {/* Profile */}
        <button
          onClick={() => handleTabClick("profile")}
          className={`mobile-nav-btn ${!menuOpen && activeTab === "profile" ? "active" : ""}`}
        >
          <User size={22} />
          <span>Profile</span>
        </button>

        {/* Logout */}
        <button onClick={onLogout} className="mobile-nav-btn logout-btn">
          <LogOut size={22} />
          <span>Logout</span>
        </button>
      </div>
    </>
  );
};

export default MobileBottomNav;
