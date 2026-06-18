import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import DashboardShell from '../components/DashboardShell';
import OverviewTab from '../modules/admin/OverviewTab';
import SystemPoliciesTab from '../modules/admin/SystemPoliciesTab';
import HolidayCalendarTab from '../modules/admin/HolidayCalendarTab';

const SuperAdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { if (!user) navigate('/login'); }, [user, navigate]);
  if (!user) return null;

  const titles = {
    overview: 'System Overview',
    policies: 'Global Policies',
    holidays: 'Holiday Calendar',
  };

  return (
    <DashboardShell role="SUPER_ADMIN" activeTab={activeTab} onTabChange={setActiveTab} headerTitle={titles[activeTab]}>
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'policies' && <SystemPoliciesTab />}
      {activeTab === 'holidays' && <HolidayCalendarTab />}
    </DashboardShell>
  );
};

export default SuperAdminDashboard;
