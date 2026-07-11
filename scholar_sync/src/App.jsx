import React, { useEffect } from 'react';
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
