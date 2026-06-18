import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import DashboardShell from '../components/DashboardShell';
import OverviewTab from '../modules/hod/OverviewTab';
import PolicyConfigTab from '../modules/hod/PolicyConfigTab';
import MasterDataTab from '../modules/hod/MasterDataTab';
import DefaultersTab from '../modules/hod/DefaultersTab';
import ApprovalsTab from '../modules/hod/ApprovalsTab';
import AuditTab from '../modules/hod/AuditTab';

const HodDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { if (!user) navigate('/login'); }, [user, navigate]);
  if (!user) return null;

  const titles = {
    overview: 'Department Overview',
    policies: 'Policy Configuration',
    master: 'Master Data Management',
    defaulters: 'Defaulters & Warnings',
    approvals: 'Leave & Correction Approvals',
    audit: 'Audit Trail',
  };

  return (
    <DashboardShell role="HOD" activeTab={activeTab} onTabChange={setActiveTab} headerTitle={titles[activeTab]}>
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'policies' && <PolicyConfigTab />}
      {activeTab === 'master' && <MasterDataTab />}
      {activeTab === 'defaulters' && <DefaultersTab />}
      {activeTab === 'approvals' && <ApprovalsTab />}
      {activeTab === 'audit' && <AuditTab />}
    </DashboardShell>
  );
};

export default HodDashboard;
