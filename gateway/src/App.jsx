import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Landing from './Landing';
import Acknowledgements from './Acknowledgements';
import RepositoryDepartments from './RepositoryDepartments';
import RepositoryDepartmentDetail from './RepositoryDepartmentDetail';
import RepositoryProfile from './RepositoryProfile';
import DeveloperProfile from './DeveloperProfile';
import NotFound from './NotFound';
import { useEffect } from 'react';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/acknowledgements" element={<Acknowledgements />} />
        <Route path="/ayush-sood" element={<DeveloperProfile />} />
        <Route path="/discovery" element={<RepositoryDepartments />} />
        <Route path="/discovery/department/:code" element={<RepositoryDepartmentDetail />} />
        <Route path="/discovery/profile/:username" element={<RepositoryProfile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
