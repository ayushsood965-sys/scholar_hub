import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import GenericPage from './pages/GenericPage';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import HodDashboard from './pages/HodDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        {/* Core Pages */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Role-Based Protected Dashboards */}
        <Route path="/student-dashboard" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/faculty-dashboard" element={<ProtectedRoute allowedRoles={['FACULTY']}><FacultyDashboard /></ProtectedRoute>} />
        <Route path="/hod-dashboard" element={<ProtectedRoute allowedRoles={['HOD']}><HodDashboard /></ProtectedRoute>} />
        <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/super-dashboard" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><SuperAdminDashboard /></ProtectedRoute>} />

        {/* Feature Shell Routes */}
        <Route 
          path="/track" 
          element={
            <GenericPage 
              title="Track Attendance" 
              description="Biometric check-ins, card swipes, and dynamic QR terminal interface logs will be integrated here." 
            />
          } 
        />
        <Route 
          path="/leaves" 
          element={
            <GenericPage 
              title="Leave Management" 
              description="Submit leave requests, view active statuses, and process pending supervisor approvals." 
            />
          } 
        />
        <Route 
          path="/reports" 
          element={
            <GenericPage 
              title="Reports & Analytics" 
              description="Review monthly logs, check overall percentages, and download defalcation summaries." 
            />
          } 
        />
        <Route 
          path="/about" 
          element={
            <GenericPage 
              title="About ScholarTrack" 
              description="ScholarTrack is a premium, state-of-the-art attendance auditing suite built on the MERN stack with highly responsive layout systems." 
            />
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
