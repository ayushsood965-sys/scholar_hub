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
import LogoutBridge from './pages/LogoutBridge';
import ProtectedRoute from './components/ProtectedRoute';
import UtilityAction from './components/UtilityAction';
import ErrorBoundary from './components/ErrorBoundary';

// Premium landing pages
import ResearchLabsPage from './pages/ResearchLabsPage';
import PublicationsPage from './pages/PublicationsPage';
import FundingPage from './pages/FundingPage';
import EventsPage from './pages/EventsPage';
import CollaboratePage from './pages/CollaboratePage';

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
        <Route path="/logout-bridge" element={<LogoutBridge />} />
        <Route path="/workflow" element={<WorkflowPage />} />
        <Route path="/labs" element={<ResearchLabsPage />} />
        <Route path="/collaborate" element={<CollaboratePage />} />
        <Route path="/publications" element={<PublicationsPage />} />
        <Route path="/funding" element={<FundingPage />} />
        <Route path="/events" element={<EventsPage />} />
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
