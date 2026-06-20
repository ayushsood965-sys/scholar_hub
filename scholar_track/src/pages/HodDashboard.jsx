import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import DashboardShell from '../components/DashboardShell';
import OverviewTab from '../modules/hod/OverviewTab';
import PolicyConfigTab from '../modules/hod/PolicyConfigTab';
import LeaveRulesTab from '../modules/hod/LeaveRulesTab';
import TimetableTab from '../modules/hod/TimetableTab';
import CloneTimetableTab from '../modules/hod/CloneTimetableTab';
import ApprovalsTab from '../modules/hod/ApprovalsTab';
import DefaultersTab from '../modules/hod/DefaultersTab';
import AuditTab from '../modules/hod/AuditTab';
import StaffProfileTab from '../modules/profile/StaffProfileTab';

const HodDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { if (!user) navigate('/login'); }, [user, navigate]);
  if (!user) return null;

  const titles = {
    overview: 'Department Overview',
    policies: 'Policy Configuration',
    leaveRules: 'Leave Rules',
    timetable: 'Timetable Builder',
    cloneTimetable: 'Clone Timetable',
    approvals: 'Leave & Correction Approvals',
    defaulters: 'Defaulters & Warnings',
    audit: 'Audit Trail',
    profile: 'Profile',
  };

  const isLocked = user && !user.isVerified;

  return (
    <DashboardShell role="HOD" activeTab={activeTab} onTabChange={setActiveTab} headerTitle={titles[activeTab]} isLocked={isLocked}>
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'policies' && <PolicyConfigTab />}
      {activeTab === 'leaveRules' && <LeaveRulesTab />}
      {activeTab === 'timetable' && <TimetableTab />}
      {activeTab === 'cloneTimetable' && <CloneTimetableTab />}
      {activeTab === 'approvals' && <ApprovalsTab />}
      {activeTab === 'defaulters' && <DefaultersTab />}
      {activeTab === 'audit' && <AuditTab />}
      {activeTab === 'profile' && <StaffProfileTab />}
    </DashboardShell>
  );
};

export default HodDashboard;
