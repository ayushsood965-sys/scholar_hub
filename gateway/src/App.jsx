import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './Landing';
import Acknowledgements from './Acknowledgements';
import RepositoryDepartments from './RepositoryDepartments';
import RepositoryDepartmentDetail from './RepositoryDepartmentDetail';
import RepositoryProfile from './RepositoryProfile';
import NotFound from './NotFound';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/acknowledgements" element={<Acknowledgements />} />
        <Route path="/discovery" element={<RepositoryDepartments />} />
        <Route path="/discovery/department/:code" element={<RepositoryDepartmentDetail />} />
        <Route path="/discovery/profile/:username" element={<RepositoryProfile />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
