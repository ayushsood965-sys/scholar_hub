import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import useApi from '../hooks/useApi';
import DashboardShell from '../components/DashboardShell';
import { useTabPersistence } from '../hooks/useTabPersistence';
import OverviewTab from '../modules/student/OverviewTab';
import AttendanceTab from '../modules/student/AttendanceTab';
import LeaveTab from '../modules/student/LeaveTab';
import CorrectionsTab from '../modules/student/CorrectionsTab';
import ProfileTab from '../modules/student/ProfileTab';
import ProfileOnboardingModal from '../components/ProfileOnboardingModal';
import SkeletonLoader from '../components/ui/SkeletonLoader';

const StudentDashboard = () => {
  const { user, fetchMe } = useContext(AuthContext);
  const navigate = useNavigate();
  const api = useApi();
  
  const [activeTab, setActiveTab] = useTabPersistence('track_student_tab', 'overview');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [thesis, setThesis] = useState(null);
  const [loadingThesis, setLoadingThesis] = useState(true);

  const fetchThesis = async () => {
    try {
      setLoadingThesis(true);
      const res = await api.get('/thesis/me');
      setThesis(res.data.thesis);
    } catch (err) {
      setThesis(null);
    } finally {
      setLoadingThesis(false);
    }
  };

  useEffect(() => {
    if (fetchMe) {
      fetchMe();
    }
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      fetchThesis();
      if (!user.profileCompleted) {
        setShowOnboarding(true);
      }
    }
  }, []);

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

  // Lock condition:
  // Locked to Profile page if student is not verified yet
  const isLocked = !user.isVerified;

  if (loadingThesis) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px', background: 'var(--color-bg)' }}>
        <div className="premium-preloader-spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(26, 90, 59, 0.1)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Syncing academic record...</p>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <DashboardShell
        role="STUDENT"
        activeTab={activeTab}
        onTabChange={setActiveTab}
        headerTitle={tabTitles[activeTab]}
        isLocked={isLocked}
      >
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'attendance' && <AttendanceTab />}
        {activeTab === 'leave' && <LeaveTab />}
        {activeTab === 'corrections' && <CorrectionsTab />}
        {activeTab === 'profile' && <ProfileTab thesis={thesis} onRefreshThesis={fetchThesis} />}
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
