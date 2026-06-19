import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import DashboardShell from '../components/DashboardShell';
import OverviewTab from '../modules/admin/OverviewTab';
import SessionMasterTab from '../modules/admin/SessionMasterTab';
import DegreeTypeMasterTab from '../modules/admin/DegreeTypeMasterTab';
import DegreeNameMasterTab from '../modules/admin/DegreeNameMasterTab';
import SemesterMasterTab from '../modules/admin/SemesterMasterTab';
import DegreeDeptMappingTab from '../modules/admin/DegreeDeptMappingTab';
import HolidayCalendarTab from '../modules/admin/HolidayCalendarTab';
import DepartmentsTab from '../modules/admin/DepartmentsTab';

const SuperAdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => { if (!user) navigate('/login'); }, [user, navigate]);
  if (!user) return null;

  const titles = {
    overview: 'System Overview',
    sessions: 'Academic Sessions',
    degreeTypes: 'Degree Types',
    degreeNames: 'Degree Names',
    semesters: 'Semesters',
    degreeDeptMap: 'Degree-Department Mapping',
    holidays: 'Holiday Calendar',
    departments: 'Department Master',
  };

  return (
    <DashboardShell role="SUPER_ADMIN" activeTab={activeTab} onTabChange={setActiveTab} headerTitle={titles[activeTab]}>
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'sessions' && <SessionMasterTab />}
      {activeTab === 'degreeTypes' && <DegreeTypeMasterTab />}
      {activeTab === 'degreeNames' && <DegreeNameMasterTab />}
      {activeTab === 'semesters' && <SemesterMasterTab />}
      {activeTab === 'degreeDeptMap' && <DegreeDeptMappingTab />}
      {activeTab === 'holidays' && <HolidayCalendarTab />}
      {activeTab === 'departments' && <DepartmentsTab />}
    </DashboardShell>
  );
};

export default SuperAdminDashboard;
