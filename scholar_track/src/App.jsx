import React, { useEffect, Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Landing from "./Landing";
import ProtectedRoute from "./components/ProtectedRoute";
import InstallPrompt from "./components/InstallPrompt";
import NotFound from "./pages/NotFound";

// Lazy loaded page components for code splitting & initial bundle optimization
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const VerifyEmailPending = lazy(() => import("./pages/VerifyEmailPending"));
const VerifyEmailCallback = lazy(() => import("./pages/VerifyEmailCallback"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AuthBridge = lazy(() => import("./pages/AuthBridge"));
const LogoutBridge = lazy(() => import("./pages/LogoutBridge"));
const StudentDashboard = lazy(() => import("./pages/StudentDashboard"));
const FacultyDashboard = lazy(() => import("./pages/FacultyDashboard"));
const HodDashboard = lazy(() => import("./pages/HodDashboard"));
const SuperAdminDashboard = lazy(() => import("./pages/SuperAdminDashboard"));
const About = lazy(() => import("./pages/About"));
const Policies = lazy(() => import("./pages/Policies"));
const DeveloperProfile = lazy(() => import("./pages/DeveloperProfile"));

const PreloaderFallback = () => (
  <div className="premium-preloader-container" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
    <div className="premium-preloader-spinner" />
    <div className="premium-preloader-text" style={{ marginTop: '16px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Loading attendance portal...</div>
  </div>
);

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App = () => {
  useEffect(() => {
    const addTableLabels = () => {
      const tables = document.querySelectorAll('table');
      tables.forEach(table => {
        if (table.classList.contains('no-responsive')) return;
        const headers = [];
        const ths = table.querySelectorAll('thead th, tr:first-child th');
        ths.forEach(th => {
          headers.push(th.textContent.trim());
        });
        
        const trs = table.querySelectorAll('tbody tr, tr');
        trs.forEach(tr => {
          if (tr.querySelector('th')) return;
          const tds = tr.querySelectorAll('td');
          tds.forEach((td, idx) => {
            if (headers[idx] && !td.getAttribute('data-label')) {
              td.setAttribute('data-label', headers[idx]);
            }
          });
        });
      });
    };

    addTableLabels();

    const observer = new MutationObserver(() => {
      addTableLabels();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <InstallPrompt />
      <Suspense fallback={<PreloaderFallback />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email-pending" element={<VerifyEmailPending />} />
          <Route path="/verify-email" element={<VerifyEmailCallback />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/auth-bridge" element={<AuthBridge />} />
          <Route path="/logout-bridge" element={<LogoutBridge />} />
          <Route path="/about" element={<About />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/ayush-sood" element={<DeveloperProfile />} />

          {/* Protected Dashboard Routes */}
          <Route
            path="/student-dashboard"
            element={
              <ProtectedRoute allowedRoles={["STUDENT"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty-dashboard"
            element={
              <ProtectedRoute allowedRoles={["FACULTY"]}>
                <FacultyDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/hod-dashboard"
            element={
              <ProtectedRoute allowedRoles={["HOD", "ADMIN"]}>
                <HodDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-dashboard"
            element={
              <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback Catch-All */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
