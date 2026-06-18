import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import DashboardShell from '../components/DashboardShell';
import OverviewTab from '../modules/student/OverviewTab';
import AttendanceTab from '../modules/student/AttendanceTab';
import LeaveTab from '../modules/student/LeaveTab';
import CorrectionsTab from '../modules/student/CorrectionsTab';

const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  if (!user) return null;

  const tabTitles = {
    overview: 'Profile Overview',
    attendance: 'My Attendance',
    leave: 'Leave Management',
    corrections: 'Correction Requests',
  };

  return (
    <DashboardShell
      role="STUDENT"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      headerTitle={tabTitles[activeTab]}
    >
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'attendance' && <AttendanceTab />}
      {activeTab === 'leave' && <LeaveTab />}
      {activeTab === 'corrections' && <CorrectionsTab />}
    </DashboardShell>
  );
};

export default StudentDashboard;
