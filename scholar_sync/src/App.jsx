import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './Landing';
import StudentDashboard from './pages/StudentDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import GenericPage from './pages/GenericPage';
import Login from './pages/Login';
import Signup from './pages/Signup';
import WorkflowPage from './pages/WorkflowPage';
import ProtectedRoute from './components/ProtectedRoute';
import UtilityAction from './components/UtilityAction';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
        <Route path="/" element={<Landing />} />
        
        {/* Protected Dashboard Routes */}
        <Route path="/student-dashboard" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />
        <Route path="/faculty-dashboard" element={<ProtectedRoute allowedRoles={['FACULTY']}><FacultyDashboard /></ProtectedRoute>} />
        <Route path="/admin-dashboard" element={<ProtectedRoute allowedRoles={['ADMIN', 'HOD']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/super-dashboard" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><SuperAdminDashboard /></ProtectedRoute>} />
        
        {/* Auth & Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/workflow" element={<WorkflowPage />} />
        <Route path="/labs" element={<GenericPage title="Research Labs" description="Discover and explore departmental research labs." />} />
        <Route path="/collaborate" element={<GenericPage title="Collaborate" description="Find collaborators for your next big project." />} />
        <Route path="/publications" element={<GenericPage title="Publications" description="Access research papers, journals, and publications." />} />
        <Route path="/funding" element={<GenericPage title="Funding" description="Manage grants and explore funding opportunities." />} />
        <Route path="/events" element={<GenericPage title="Events" description="Stay updated with university and community events." />} />
        <Route path="/about" element={<GenericPage title="About" description="Learn more about the ScholarSync platform." />} />
        <Route path="/search" element={<GenericPage title="Search Results" description="Global search directory results." />} />

        {/* System Administration & Utility Hooks */}
        <Route path="/clear-all" element={<UtilityAction type="clear" />} />
        <Route path="/seed" element={<UtilityAction type="seed" />} />
        <Route path="/seed-users" element={<UtilityAction type="seed-users" />} />
      </Routes>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
