import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import DashboardShell from '../components/DashboardShell';
import { useTabPersistence } from '../hooks/useTabPersistence';
import OverviewTab from '../modules/faculty/OverviewTab';
import MarkAttendanceTab from '../modules/faculty/MarkAttendanceTab';
import AttendanceRecordsTab from '../modules/faculty/AttendanceRecordsTab';
import LeaveApprovalsTab from '../modules/faculty/LeaveApprovalsTab';
import LeaveLogsTab from '../modules/faculty/LeaveLogsTab';
import CorrectionsTab from '../modules/faculty/CorrectionsTab';
import StaffProfileTab from '../modules/profile/StaffProfileTab';
import StudentSubjectMappingTab from '../modules/faculty/StudentSubjectMappingTab';
import StudentMappingDetailsTab from '../modules/faculty/StudentMappingDetailsTab';

const FacultyDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useTabPersistence('track_faculty_tab', 'overview');

  useEffect(() => { if (!user) navigate('/login'); }, [user, navigate]);
  if (!user) return null;

  const titles = {
    overview: 'Faculty Overview',
    mark: 'Mark Attendance',
    records: 'Attendance Records',
    leaves: 'Leave Approvals',
    leaveLogs: 'Leave Logs',
    corrections: 'Corrections Queue',
    mapping: 'Student-Semester-Subject Mapping',
    mappingDetails: 'Mapping Details',
    profile: 'Profile',
  };

  const isLocked = user && !user.isVerified;

  return (
    <DashboardShell role="FACULTY" activeTab={activeTab} onTabChange={setActiveTab} headerTitle={titles[activeTab]} isLocked={isLocked}>
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'mark' && <MarkAttendanceTab />}
      {activeTab === 'records' && <AttendanceRecordsTab />}
      {activeTab === 'leaves' && <LeaveApprovalsTab />}
      {activeTab === 'leaveLogs' && <LeaveLogsTab />}
      {activeTab === 'corrections' && <CorrectionsTab />}
      {activeTab === 'mapping' && <StudentSubjectMappingTab />}
      {activeTab === 'mappingDetails' && <StudentMappingDetailsTab />}
      {activeTab === 'profile' && <StaffProfileTab />}
    </DashboardShell>
  );
};

export default FacultyDashboard;
