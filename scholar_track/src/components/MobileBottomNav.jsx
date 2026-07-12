import React, { useState } from "react";
import { Menu, Home, User, LogOut } from "lucide-react";
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
              const isDisabled = isLocked && item.key !== "profile";

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
          className={`mobile-nav-btn ${!menuOpen && activeTab === homeKey ? "active" : ""}`}
          disabled={isLocked && homeKey !== "profile"}
        >
          <Home size={22} />
          <span>Home</span>
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
