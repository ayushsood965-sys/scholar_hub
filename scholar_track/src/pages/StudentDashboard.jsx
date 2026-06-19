import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import DashboardShell from '../components/DashboardShell';
import OverviewTab from '../modules/student/OverviewTab';
import AttendanceTab from '../modules/student/AttendanceTab';
import LeaveTab from '../modules/student/LeaveTab';
import CorrectionsTab from '../modules/student/CorrectionsTab';
import ProfileTab from '../modules/student/ProfileTab';
import ProfileOnboardingModal from '../components/ProfileOnboardingModal';

const StudentDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (!user.profileCompleted) {
      setShowOnboarding(true);
    }
  }, [user, navigate]);

  if (!user) return null;

  const tabTitles = {
    overview: 'Profile Overview',
    attendance: 'My Attendance',
    leave: 'Leave Management',
    corrections: 'Correction Requests',
    profile: 'My Profile',
  };

  const handleGoToProfile = () => {
    setShowOnboarding(false);
    setActiveTab('profile');
  };

  return (
    <>
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
        {activeTab === 'profile' && <ProfileTab />}
      </DashboardShell>

      <ProfileOnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onGo={handleGoToProfile}
      />
    </>
  );
};

export default StudentDashboard;
