import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import DashboardShell from '../components/DashboardShell';
import OverviewTab from '../modules/faculty/OverviewTab';
import MarkAttendanceTab from '../modules/faculty/MarkAttendanceTab';
import AttendanceRecordsTab from '../modules/faculty/AttendanceRecordsTab';
import LeaveApprovalsTab from '../modules/faculty/LeaveApprovalsTab';
import CorrectionsTab from '../modules/faculty/CorrectionsTab';
import StaffProfileTab from '../modules/profile/StaffProfileTab';

const FacultyDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { if (!user) navigate('/login'); }, [user, navigate]);
  if (!user) return null;

  const titles = {
    overview: 'Faculty Overview',
    mark: 'Mark Attendance',
    records: 'Attendance Records',
    leaves: 'Leave Approvals',
    corrections: 'Corrections Queue',
    profile: 'Profile',
  };

  const isLocked = user && !user.isVerified;

  return (
    <DashboardShell role="FACULTY" activeTab={activeTab} onTabChange={setActiveTab} headerTitle={titles[activeTab]} isLocked={isLocked}>
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'mark' && <MarkAttendanceTab />}
      {activeTab === 'records' && <AttendanceRecordsTab />}
      {activeTab === 'leaves' && <LeaveApprovalsTab />}
      {activeTab === 'corrections' && <CorrectionsTab />}
      {activeTab === 'profile' && <StaffProfileTab />}
    </DashboardShell>
  );
};

export default FacultyDashboard;
