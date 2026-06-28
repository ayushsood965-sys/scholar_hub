import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AuthBridge from "./pages/AuthBridge";
import LogoutBridge from "./pages/LogoutBridge";
import StudentDashboard from "./pages/StudentDashboard";
import FacultyDashboard from "./pages/FacultyDashboard";
import HodDashboard from "./pages/HodDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auth-bridge" element={<AuthBridge />} />
        <Route path="/logout-bridge" element={<LogoutBridge />} />

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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
