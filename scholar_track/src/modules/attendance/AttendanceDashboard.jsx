import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import StudentAttendanceView from './components/StudentAttendanceView';
import FacultyAttendanceView from './components/FacultyAttendanceView';
import HodAttendanceView from './components/HodAttendanceView';
import AdminAttendanceView from './components/AdminAttendanceView';

const AttendanceDashboard = ({ activeTab }) => {
  const { user } = useContext(AuthContext);

  if (!user) return null;

  switch (user.role) {
    case 'STUDENT':
      return <StudentAttendanceView activeTab={activeTab} />;
    case 'FACULTY':
      return <FacultyAttendanceView activeTab={activeTab} />;
    case 'HOD':
      return <HodAttendanceView activeTab={activeTab} />;
    case 'ADMIN':
    case 'SUPER_ADMIN':
      return <AdminAttendanceView activeTab={activeTab} />;
    default:
      return <div>Access Denied</div>;
  }
};

export default AttendanceDashboard;
