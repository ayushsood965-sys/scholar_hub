import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './Landing';
import ProtectedRoute from './components/ProtectedRoute';
import UtilityAction from './components/UtilityAction';
import ErrorBoundary from './components/ErrorBoundary';
import InstallPrompt from './components/InstallPrompt';
import NotFound from './pages/NotFound';

// Lazy loaded page components for code splitting & initial bundle optimization
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const FacultyDashboard = lazy(() => import('./pages/FacultyDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const GenericPage = lazy(() => import('./pages/GenericPage'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const VerifyEmailPending = lazy(() => import('./pages/VerifyEmailPending'));
const VerifyEmailCallback = lazy(() => import('./pages/VerifyEmailCallback'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const WorkflowPage = lazy(() => import('./pages/WorkflowPage'));
const LogoutBridge = lazy(() => import('./pages/LogoutBridge'));

// Premium landing pages lazy-loaded
const ResearchLabsPage = lazy(() => import('./pages/ResearchLabsPage'));
const LabDetailPage = lazy(() => import('./pages/LabDetailPage'));
const PublicationsPage = lazy(() => import('./pages/PublicationsPage'));
const FundingPage = lazy(() => import('./pages/FundingPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const CollaboratePage = lazy(() => import('./pages/CollaboratePage'));
const DeveloperProfile = lazy(() => import('./pages/DeveloperProfile'));

const PreloaderFallback = () => (
  <div className="premium-preloader-container" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
    <div className="premium-preloader-spinner"></div>
    <div className="premium-preloader-text" style={{ marginTop: '16px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Loading portal section...</div>
  </div>
);

function App() {
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

    const addFileListLabels = () => {
      const fileLists = document.querySelectorAll('.file-list');
      fileLists.forEach(list => {
        const headers = [];
        const headerDivs = list.querySelectorAll('.file-header > div');
        headerDivs.forEach(div => {
          headers.push(div.textContent.trim());
        });

        if (headers.length === 0) return;

        const items = list.querySelectorAll('.file-item');
        items.forEach(item => {
          const itemDivs = item.querySelectorAll(':scope > div');
          itemDivs.forEach((div, idx) => {
            if (headers[idx] && !div.getAttribute('data-label')) {
              div.setAttribute('data-label', headers[idx]);
            }
          });
        });
      });
    };

    addTableLabels();
    addFileListLabels();

    const observer = new MutationObserver(() => {
      addTableLabels();
      addFileListLabels();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <InstallPrompt />
        <Suspense fallback={<PreloaderFallback />}>
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
            <Route path="/verify-email-pending" element={<VerifyEmailPending />} />
            <Route path="/verify-email" element={<VerifyEmailCallback />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/logout-bridge" element={<LogoutBridge />} />
            <Route path="/workflow" element={<WorkflowPage />} />
            <Route path="/labs" element={<ResearchLabsPage />} />
            <Route path="/labs/:id" element={<LabDetailPage />} />
            <Route path="/collaborate" element={<CollaboratePage />} />
            <Route path="/publications" element={<PublicationsPage />} />
            <Route path="/funding" element={<FundingPage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/ayush-sood" element={<DeveloperProfile />} />
            <Route path="/about" element={<GenericPage title="About" description="Learn more about the ScholarSync platform." />} />
            <Route path="/search" element={<GenericPage title="Search Results" description="Global search directory results." />} />

            {/* System Administration & Utility Hooks */}
            <Route path="/clear-all" element={<UtilityAction type="clear" />} />
            <Route path="/seed" element={<UtilityAction type="seed" />} />
            <Route path="/seed-users" element={<UtilityAction type="seed-users" />} />
            {/* Fallback Catch-All Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
