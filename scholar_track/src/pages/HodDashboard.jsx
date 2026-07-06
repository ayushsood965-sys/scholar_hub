import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import DashboardShell from '../components/DashboardShell';
import { useTabPersistence } from '../hooks/useTabPersistence';
import OverviewTab from '../modules/hod/OverviewTab';
import TimetableTab from '../modules/hod/TimetableTab';
import CloneTimetableTab from '../modules/hod/CloneTimetableTab';
import ApprovalsTab from '../modules/hod/ApprovalsTab';
import DefaultersTab from '../modules/hod/DefaultersTab';
import AuditTab from '../modules/hod/AuditTab';
import StaffProfileTab from '../modules/profile/StaffProfileTab';
import MyStudentsTab from '../modules/hod/MyStudentsTab';
import StudentSubjectMappingTab from '../modules/faculty/StudentSubjectMappingTab';
import StudentMappingDetailsTab from '../modules/faculty/StudentMappingDetailsTab';
import VerifyAttendanceTab from '../modules/hod/VerifyAttendanceTab';
import AttendanceRecordsTab from '../modules/faculty/AttendanceRecordsTab';

const HodDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useTabPersistence('track_hod_tab', 'overview');

  useEffect(() => { if (!user) navigate('/login'); }, [user, navigate]);
  if (!user) return null;

  const titles = {
    overview: 'Department Overview',
    timetable: 'Timetable Builder',
    cloneTimetable: 'Clone Timetable',
    approvals: 'Leave & Correction Queue',
    verifyAttendance: 'Verify Attendance',
    records: 'Attendance Records',
    defaulters: 'Defaulters & Warnings',
    students: 'Verify Student Registration',
    mapping: 'Student-Semester-Subject Mapping',
    mappingDetails: 'Mapping Details',
    audit: 'Audit Trail',
    profile: 'Profile',
  };

  const isLocked = user && !user.isVerified;

  return (
    <DashboardShell role="HOD" activeTab={activeTab} onTabChange={setActiveTab} headerTitle={titles[activeTab]} isLocked={isLocked}>
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'timetable' && <TimetableTab />}
      {activeTab === 'cloneTimetable' && <CloneTimetableTab />}
      {activeTab === 'approvals' && <ApprovalsTab />}
      {activeTab === 'verifyAttendance' && <VerifyAttendanceTab />}
      {activeTab === 'records' && <AttendanceRecordsTab />}
      {activeTab === 'defaulters' && <DefaultersTab />}
      {activeTab === 'students' && <MyStudentsTab />}
      {activeTab === 'audit' && <AuditTab />}
      {activeTab === 'mapping' && <StudentSubjectMappingTab />}
      {activeTab === 'mappingDetails' && <StudentMappingDetailsTab />}
      {activeTab === 'profile' && <StaffProfileTab />}
    </DashboardShell>
  );
};

export default HodDashboard;
