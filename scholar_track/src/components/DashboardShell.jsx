import React, { useContext, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Clock,
  CalendarRange,
  Shield,
  Settings,
  Users,
  FileCheck,
  AlertTriangle,
  BookOpen,
  BarChart3,
  LogOut,
  Bell,
  Menu,
  X,
  ClipboardCheck,
  Gavel,
  Calendar,
  User,
  Building,
  FolderPlus,
  Layers,
  GraduationCap,
  ClipboardList,
  UserCog,
  Mail,
  Globe,
} from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { NotificationContext } from "../context/NotificationContext";
import ThemeToggle from "./ThemeToggle";
import NotificationDropdown from "./NotificationDropdown";
import { SCHOLAR_SYNC_URL } from "../config";
import MobileBottomNav from "./MobileBottomNav";

const roleNavConfig = {
    STUDENT: [
    { key: "overview", icon: Home, label: "Overview" },
    { key: "attendance", icon: Clock, label: "My Attendance" },
    { key: "records", icon: ClipboardList, label: "Attendance Logs" },
    { key: "leave", icon: CalendarRange, label: "Leave Management" },
    { key: "corrections", icon: FileCheck, label: "Corrections" },
    { key: "profile", icon: User, label: "Profile" },
  ],
  FACULTY: [
    { kind: "section", label: "📊 GENERAL" },
    { key: "overview", icon: Home, label: "Overview" },

    { kind: "section", label: "⏰ ATTENDANCE MANAGEMENT" },
    { key: "mark", icon: ClipboardCheck, label: "Mark Attendance" },
    { key: "records", icon: Clock, label: "Attendance Records" },

    { kind: "section", label: "📬 LEAVES & CORRECTIONS" },
    { key: "leaves", icon: CalendarRange, label: "Leave Approvals" },
    { key: "leaveLogs", icon: ClipboardList, label: "Leave Logs" },
    { key: "corrections", icon: FileCheck, label: "Corrections Queue" },
    { key: "correctionLogs", icon: ClipboardList, label: "Correction Logs" },

    { kind: "section", label: "🗺️ ACADEMIC MAPPING" },
    { key: "mapping", icon: Layers, label: "Student Mapping" },
    { key: "mappingDetails", icon: ClipboardList, label: "Mapping Details" },

    { kind: "section", label: "👤 ACCOUNT" },
    { key: "profile", icon: User, label: "Profile" },
  ],
  HOD: [
    { kind: "section", label: "📊 GENERAL" },
    { key: "overview", icon: Home, label: "Department Overview" },

    { kind: "section", label: "📅 TIMETABLE MANAGEMENT" },
    { key: "timetable", icon: Calendar, label: "Timetable Builder" },
    { key: "cloneTimetable", icon: CalendarRange, label: "Clone Timetable" },

    { kind: "section", label: "⚖️ APPROVALS & VERIFICATIONS" },
    { key: "users", icon: ClipboardList, label: "Manage Department Users" },
    { key: "approvals", icon: Gavel, label: "Leave & Correction Queue" },
    { key: "verifyAttendance", icon: ClipboardCheck, label: "Verify Attendance" },
    { key: "students", icon: Users, label: "Verify Student Registration" },

    { kind: "section", label: "📈 ATTENDANCE & DEFAULTERS" },
    { key: "records", icon: Clock, label: "Attendance Records" },
    { key: "defaulters", icon: AlertTriangle, label: "Defaulters" },

    { kind: "section", label: "🗺️ ACADEMIC MAPPING" },
    { key: "mapping", icon: Layers, label: "Student Mapping" },
    { key: "mappingDetails", icon: ClipboardList, label: "Mapping Details" },

    { kind: "section", label: "📋 SYSTEM AUDIT" },
    { key: "audit", icon: BookOpen, label: "Audit Trail" },

    { kind: "section", label: "👤 ACCOUNT" },
    { key: "profile", icon: User, label: "Profile" },
  ],
  SUPER_ADMIN: [
    { kind: "section", label: "📊 SYSTEM OVERVIEW" },
    { key: "overview", icon: Home, label: "System Overview" },

    { kind: "section", label: "🏢 INSTITUTION MANAGEMENT" },
    { key: "univFaculties", icon: Building, label: "University Faculty Master" },
    { key: "departments", icon: Building, label: "Department Master" },

    { kind: "section", label: "📅 ACADEMIC CONFIGURATION" },
    { key: "sessions", icon: CalendarRange, label: "Academic Sessions" },
    { key: "degreeTypes", icon: Settings, label: "Degree Types" },
    { key: "degreeNames", icon: Settings, label: "Degree Names" },
    { key: "semesters", icon: Settings, label: "Semesters" },
    { key: "semesterDegreeMap", icon: Shield, label: "Semester-Degree Map" },

    { kind: "section", label: "⚖️ POLICY & LEAVE CONFIG" },
    { key: "policies", icon: Shield, label: "Policy Configuration" },
    { key: "leaveRules", icon: Settings, label: "Leave Rules" },
    { key: "holidays", icon: Calendar, label: "Holiday Calendar" },
    { key: "categoryGender", icon: Layers, label: "Category & Gender Master" },

    { kind: "section", label: "🎓 SCHOLAR SYNC MANAGERS" },
    { key: "faculty", icon: Users, label: "Faculty Master" },
    { key: "hod", icon: Shield, label: "HOD Master" },

    { kind: "section", label: "📋 SCHOLAR TRACK MANAGERS" },
    { key: "users", icon: ClipboardList, label: "User Verification" },
    { key: "searchEditStudent", icon: UserCog, label: "Search/Edit Student Details" },
    { key: "appInstallLogs", icon: ClipboardList, label: "App Install Logs" },
    { key: "emailLogs", icon: Mail, label: "Email Logs" },

    { kind: "section", label: "👤 ACCOUNT" },
    { key: "profile", icon: UserCog, label: "My Credentials" },
  ],
};

const DashboardShell = ({
  role,
  activeTab,
  onTabChange,
  headerTitle,
  isLocked = false,
  children,
}) => {
  const { user, logout } = useContext(AuthContext);
  const { unreadCount } = useContext(NotificationContext);
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const bellRef = useRef(null);

  React.useEffect(() => {
    if (isLocked && activeTab !== "profile" && activeTab !== "overview") {
      onTabChange("overview");
    }
  }, [isLocked, activeTab, onTabChange]);

  const navItems = roleNavConfig[role] ?? roleNavConfig.STUDENT;

  const handleLogout = () => {
    const origin = localStorage.getItem("login_origin") || "track";
    
    // Clear session for the current origin first
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("login_origin");
    sessionStorage.clear();

    if (origin === "sync") {
      window.location.href = `${SCHOLAR_SYNC_URL}/logout-bridge?toast=Logged%20out%20successfully`;
    } else {
      window.location.href = "/logout-bridge?toast=Logged%20out%20successfully";
    }
  };

  const roleDashMap = {
    STUDENT: "/student-dashboard",
    FACULTY: "/faculty-dashboard",
    HOD: "/hod-dashboard",
    SUPER_ADMIN: "/super-dashboard",
  };

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="sidebar-mobile-overlay"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-logo">
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #A5D6A7, #2E9E5B)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.1rem",
            }}
          >
            📊
          </div>
          <h2>
            Scholar<span>{role === "SUPER_ADMIN" ? "Hub" : "Track"}</span>
          </h2>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            if (item.kind === "section") {
              return (
                <div key={item.label} className="sidebar-section-label">
                  {item.label}
                </div>
              );
            }
            const isDisabled = isLocked && item.key !== "profile" && item.key !== "overview";
            return (
              <button
                key={item.key}
                className={`nav-item ${activeTab === item.key ? "active" : ""} ${isDisabled ? "disabled" : ""}`}
                onClick={() => {
                  if (isDisabled) return;
                  onTabChange(item.key);
                  setSidebarOpen(false);
                }}
                style={
                  isDisabled ? { opacity: 0.4, cursor: "not-allowed" } : {}
                }
              >
                <item.icon className="nav-icon" />
                {item.label}
                {isDisabled && (
                  <span style={{ marginLeft: "auto", fontSize: "0.85rem" }}>
                    🔒
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-user-info">
            <div className="sidebar-avatar">
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div>
              <div className="sidebar-user-name">{user?.name ?? "User"}</div>
              <div className="sidebar-user-role">{role?.replace("_", " ")}</div>
            </div>
          </div>
          <button
            className="nav-item"
            onClick={() => {
              sessionStorage.setItem("allow_landing", "true");
              window.location.href = "/?view=home";
            }}
            style={{ color: "#10B981", marginBottom: "4px" }}
          >
            <Globe className="nav-icon" style={{ color: "#10B981" }} />
            Visit Home Page
          </button>
          <button
            className="nav-item"
            onClick={handleLogout}
            style={{ color: "#EF4444" }}
          >
            <LogOut className="nav-icon" style={{ color: "#EF4444" }} />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        {/* Header */}
        <header className="app-header">
          <div className="header-left">
            <button
              className="header-icon-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ display: "none" }}
              id="mobile-menu-btn"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="header-title">{headerTitle ?? "Dashboard"}</h1>
          </div>

          <div className="header-right">
            <ThemeToggle />

            <div style={{ position: "relative" }} ref={bellRef}>
              <button
                className="header-icon-btn"
                style={{ position: "relative" }}
                onClick={() => setNotificationDropdownOpen(!notificationDropdownOpen)}
              >
                <Bell size={18} />
                {(unreadCount ?? 0) > 0 && (
                  <span className="notification-badge" />
                )}
              </button>
              {notificationDropdownOpen && (
                <NotificationDropdown onClose={() => setNotificationDropdownOpen(false)} />
              )}
            </div>

            <div className="header-avatar">
              {user?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="dashboard-area" style={{ position: "relative" }}>
          {/* Animated Blobs */}
          <div className="liquid-bg-wrapper" style={{ zIndex: 1 }}>
            <div className="liquid-blob blob-1" />
            <div className="liquid-blob blob-2" />
            <div className="liquid-blob blob-3" />
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              style={{ position: "relative", zIndex: 10 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <MobileBottomNav
        activeTab={activeTab}
        onTabChange={onTabChange}
        navItems={navItems}
        isLocked={isLocked}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default DashboardShell;
