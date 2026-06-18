import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import DashboardShell from '../components/DashboardShell';
import OverviewTab from '../modules/faculty/OverviewTab';
import MarkAttendanceTab from '../modules/faculty/MarkAttendanceTab';
import LeaveApprovalsTab from '../modules/faculty/LeaveApprovalsTab';
import CorrectionsTab from '../modules/faculty/CorrectionsTab';
import TimetableTab from '../modules/faculty/TimetableTab';

const FacultyDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { if (!user) navigate('/login'); }, [user, navigate]);
  if (!user) return null;

  const titles = {
    overview: 'Faculty Overview',
    mark: 'Mark Attendance',
    leaves: 'Leave Approvals',
    corrections: 'Corrections Queue',
    timetable: 'Timetable Master',
  };

  return (
    <DashboardShell role="FACULTY" activeTab={activeTab} onTabChange={setActiveTab} headerTitle={titles[activeTab]}>
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'mark' && <MarkAttendanceTab />}
      {activeTab === 'leaves' && <LeaveApprovalsTab />}
      {activeTab === 'corrections' && <CorrectionsTab />}
      {activeTab === 'timetable' && <TimetableTab />}
    </DashboardShell>
  );
};

export default FacultyDashboard;
