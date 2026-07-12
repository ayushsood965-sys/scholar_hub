import React, { useState } from "react";
import { Menu, Home, User, LogOut } from "lucide-react";
import "./MobileBottomNav.css";

const MobileBottomNav = ({
  activeTab,
  setActiveTab,
  navItems = [],
  isVerified,
  thesis,
  milestones,
  onLogout,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  // Find the first navigation item (excluding section headers and profile) to treat as Home
  const homeItem = navItems.find((item) => item.key && item.key !== "profile" && !item.kind);
  const homeKey = homeItem ? homeItem.key : "overview";

  const getIsDisabled = (key) => {
    if (key === "profile") return false;

    // Student (PhD) dashboard specific checks
    if (thesis) {
      if (thesis.status === "REGISTRATION_PENDING" || thesis.status === "REJECTED") return true;
      const status = thesis.status;
      if (key === "overview") return false;
      if (key === "workspace" || key === "certificates") {
        return !["COURSEWORK", "SYNOPSIS_PENDING", "ACTIVE_RESEARCH", "PRE_SUBMISSION", "THESIS_SUBMITTED", "PENDING_SUPERVISOR", "PENDING_HOD", "SUBMITTED", "AWARDED"].includes(status);
      }
      if (key === "coursework") {
        return !["COURSEWORK", "SYNOPSIS_PENDING", "ACTIVE_RESEARCH", "PRE_SUBMISSION", "THESIS_SUBMITTED", "PENDING_SUPERVISOR", "PENDING_HOD", "SUBMITTED", "AWARDED"].includes(status);
      }
      if (key === "synopsis") {
        const hasSynopsisMilestone = milestones && milestones.some((m) => m.type === "SYNOPSIS");
        return !(["SYNOPSIS_PENDING", "ACTIVE_RESEARCH", "PRE_SUBMISSION", "THESIS_SUBMITTED", "PENDING_SUPERVISOR", "PENDING_HOD", "SUBMITTED", "AWARDED"].includes(status) || hasSynopsisMilestone);
      }
      if ([
        "rac",
        "sixMonthReports",
        "chapterDrafts",
        "publications",
        "meetings",
        "documents",
        "changes",
      ].includes(key)) {
        return !["ACTIVE_RESEARCH", "PRE_SUBMISSION", "THESIS_SUBMITTED", "PENDING_SUPERVISOR", "PENDING_HOD", "SUBMITTED", "AWARDED"].includes(status);
      }
      if (key === "preSubmission") {
        const hasPreMilestone = milestones && milestones.some((m) => m.type === "PRE_SUBMISSION");
        return !(["ACTIVE_RESEARCH", "PRE_SUBMISSION", "THESIS_SUBMITTED", "PENDING_SUPERVISOR", "PENDING_HOD", "SUBMITTED", "AWARDED"].includes(status) || hasPreMilestone);
      }
      if (key === "finalSubmission") {
        const isCleared = thesis.preSubmissionSeminar?.status === "CLEARED";
        return !(isCleared || ["THESIS_SUBMITTED", "PENDING_SUPERVISOR", "PENDING_HOD", "SUBMITTED", "AWARDED"].includes(status));
      }
      return true;
    }

    // Faculty, HOD, and Admin dashboards check isVerified
    if (isVerified === false) {
      return key !== "profile";
    }

    return false;
  };

  const handleTabClick = (key) => {
    if (getIsDisabled(key)) return;
    setActiveTab(key);
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
              const isDisabled = getIsDisabled(item.key);

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
          disabled={getIsDisabled(homeKey)}
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
