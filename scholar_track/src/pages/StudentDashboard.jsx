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
import AttendanceLogsTab from '../modules/student/AttendanceLogsTab';
import ProfileTab from '../modules/student/ProfileTab';
import StaffProfileTab from '../modules/profile/StaffProfileTab';
import SkeletonLoader from '../components/ui/SkeletonLoader';

const StudentDashboard = () => {
  const { user, fetchMe } = useContext(AuthContext);
  const navigate = useNavigate();
  const api = useApi();
  
  const [activeTab, setActiveTab] = useTabPersistence('track_student_tab', 'overview');
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
    }
  }, []);

  if (!user) return null;

  const tabTitles = {
    overview: 'Profile Overview',
    attendance: 'My Attendance',
    records: 'Attendance Logs',
    leave: 'Leave Management',
    corrections: 'Correction Requests',
    profile: 'My Profile',
  };

  const handleGoToProfile = () => {
    setActiveTab('profile');
  };

  // Lock condition:
  // Locked to Profile page if student is not verified yet
  const isLocked = !user.isVerified;

  if (loadingThesis) {
    return (
      <div className="login-preloader-overlay">
        <div className="login-preloader-container">
          <div className="login-preloader-glow" />
          <div className="login-preloader-ring-wrapper">
            <div className="login-preloader-ring" />
            <img src="/hpu_logo.png" alt="ScholarTrack Logo" className="login-preloader-logo" style={{ objectFit: 'contain' }} />
          </div>
          <div className="login-preloader-text-container">
            <h2 className="login-preloader-title">ScholarTrack</h2>
            <div className="login-preloader-status">
              <span className="status-dot" />
              <span className="status-dot" />
              <span className="status-dot" />
              <span className="login-preloader-text">Syncing academic record</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardShell
      role="STUDENT"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      headerTitle={tabTitles[activeTab]}
      isLocked={isLocked}
    >
      {activeTab === 'overview' && <OverviewTab thesis={thesis} />}
      {activeTab === 'attendance' && <AttendanceTab />}
      {activeTab === 'records' && <AttendanceLogsTab />}
      {activeTab === 'leave' && <LeaveTab />}
      {activeTab === 'corrections' && <CorrectionsTab />}
      {activeTab === 'profile' && (
        user?.profile?.isPhD && thesis && thesis.status !== 'REGISTRATION_PENDING' && thesis.status !== 'REJECTED' ? (
          <StaffProfileTab thesis={thesis} />
        ) : (
          <ProfileTab thesis={thesis} onRefreshThesis={fetchThesis} />
        )
      )}
    </DashboardShell>
  );
};

export default StudentDashboard;
