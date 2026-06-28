import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clock, AlertCircle, Calendar, MessageSquare, Plus, ExternalLink, CalendarRange, Clock3 } from 'lucide-react';
import useApi from '../../hooks/useApi';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { useToast } from '../../context/ToastContext';

// Primitives & Modules
import TrendLineChart from '../../components/ui/TrendLineChart';
import CourseCard from '../../components/ui/CourseCard';
import TargetWidget from '../../components/ui/TargetWidget';
import AttendanceCalendar from '../../components/ui/AttendanceCalendar';
import CourseDetailView from './CourseDetailView';
import ProgressRing from '../../components/ui/ProgressRing';

const OverviewTab = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const api = useApi();
  const toast = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/attendance/dashboard/student');
        setStats(res.data);
      } catch (err) {
        toast.error('Failed to load student stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [api, toast]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <SkeletonLoader count={1} height={120} />
        <div className="grid-3">
          <SkeletonLoader count={1} height={140} />
          <SkeletonLoader count={1} height={140} />
          <SkeletonLoader count={1} height={140} />
        </div>
        <div className="grid-2">
          <SkeletonLoader count={1} height={300} />
          <SkeletonLoader count={1} height={300} />
        </div>
      </div>
    );
  }

  const safeStats = stats || {
    name: 'Student',
    semesterName: 'N/A',
    degreeName: 'N/A',
    overallPercentage: 0,
    presentDays: 0,
    totalExpectedClasses: 0,
    isDefaulter: false,
    isWarning: false,
    minRequiredPercentage: 75,
    consecutiveClassesToAttend: 0,
    subjectWiseAttendance: [],
    leaveRequests: [],
    targetWidget: {
      currentPercentage: 0,
      requiredPercentage: 75,
      safeAbsencesRemaining: 0,
      classesToRecover: 0,
      totalRemainingClasses: 0,
      isRecoverable: true,
      formula: ''
    },
    calendarMonths: [],
    weeklyTrend: [],
    upcomingClasses: [],
    isPhD: false
  };

  const isPhD = safeStats.isPhD;

  const getStatusColor = () => {
    if (safeStats.isDefaulter) return '#EF4444';
    if (safeStats.isWarning) return '#F59E0B';
    return '#10B981';
  };

  return (
    <div className="overview-tab" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-tag">STUDENT OVERVIEW</div>
        <h2 className="welcome-title">Welcome back, {safeStats.name}</h2>
        <p className="welcome-subtitle">
          Semester: {safeStats.semesterName || 'N/A'} | {safeStats.degreeName || 'N/A'}
        </p>
      </div>

      {/* Top Rollup Section */}
      <div className="grid-3">
        {/* Overall Progress Ring Card */}
        <motion.div 
          className="clay-card" 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px' }}
        >
          <ProgressRing 
            percentage={safeStats.overallPercentage} 
            size={120} 
            strokeWidth={8} 
            label="Overall" 
          />
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Classes: <strong>{safeStats.presentDays}</strong> attended / {safeStats.totalExpectedClasses} held
            </span>
          </div>
        </motion.div>

        {/* Target Projections Widget */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <TargetWidget targetWidget={safeStats.targetWidget} />
        </motion.div>

        {/* Warning Indicator Card */}
        <motion.div 
          className="clay-card" 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }}
          style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: `6px solid ${getStatusColor()}` }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Academic Standing
            </span>
            <h3 style={{ margin: '8px 0', fontSize: '1.8rem', fontWeight: '800', color: getStatusColor(), fontFamily: 'Outfit' }}>
              {safeStats.isDefaulter ? 'DEFAULTER' : safeStats.isWarning ? 'WARNING' : 'GOOD'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              {safeStats.isDefaulter 
                ? `Your attendance is below the mandatory minimum of ${safeStats.minRequiredPercentage}%. Action is required immediately.` 
                : safeStats.isWarning 
                  ? `You are approaching the attendance limit. Attend regular classes to stay safe.` 
                  : `Keep it up! Your attendance is well within the required institutional guidelines.`
              }
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <div style={{ padding: '6px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} style={{ color: 'var(--color-primary)' }} />
              Required: {safeStats.minRequiredPercentage}%
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Body Grid */}
      <div className="grid-2" style={{ gridTemplateColumns: isPhD ? '1fr' : '1.3fr 0.7fr', gap: '24px' }}>
        {/* Left Hand: Course Cards or PhD Calendar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {isPhD ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontWeight: '600' }}>PhD Check-in Log</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Daily biometric tracking</span>
              </div>
              <AttendanceCalendar calendarMonths={safeStats.calendarMonths} />
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontWeight: '600' }}>Enrolled Courses</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Click card to view details</span>
              </div>
              {safeStats.subjectWiseAttendance.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }} className="glass-panel">
                  No courses currently mapped for this semester.
                </div>
              ) : (
                <div className="grid-2" style={{ gap: '16px' }}>
                  {safeStats.subjectWiseAttendance.map(course => (
                    <CourseCard 
                      key={course.timetableSlotId} 
                      course={course} 
                      onClick={() => setSelectedCourse(course)} 
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Weekly Trend Chart */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)', fontWeight: '600' }}>Attendance Trend</h3>
            <TrendLineChart data={safeStats.weeklyTrend} height={200} color="var(--color-primary)" />
          </div>
        </div>

        {/* Right Hand Sidebar (For non-PhD, displays Leaves & Upcoming) */}
        {!isPhD && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Upcoming Classes */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock3 size={18} style={{ color: 'var(--color-primary)' }} />
                Upcoming Classes
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {safeStats.upcomingClasses.length === 0 ? (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' }}>
                    No upcoming classes scheduled.
                  </span>
                ) : (
                  safeStats.upcomingClasses.slice(0, 4).map((cls, idx) => (
                    <div key={idx} style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-primary)' }}>{cls.subjectName}</strong>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          {cls.subjectCode} • {cls.facultyName}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--color-primary)', background: 'rgba(26,90,59,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                        {cls.startTime}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Leave Tracker */}
            <div className="glass-panel" style={{ padding: '20px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarRange size={18} style={{ color: 'var(--color-primary)' }} />
                Recent Leaves
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {safeStats.leaveRequests.length === 0 ? (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' }}>
                    No leaves applied recently.
                  </span>
                ) : (
                  safeStats.leaveRequests.map(leave => {
                    const badgeClass = leave.status === 'APPROVED' ? 'badge-success' : leave.status === 'REJECTED' ? 'badge-danger' : 'badge-warning';
                    return (
                      <div key={leave._id} style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{leave.leaveType}</strong>
                          <span className={`badge ${badgeClass}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                            {leave.status?.replace('PENDING_', '')}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          <span>{new Date(leave.startDate).toLocaleDateString()} to {new Date(leave.endDate).toLocaleDateString()}</span>
                          <span>{leave.totalDays} Day(s)</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Course Detail Modal */}
      <AnimatePresence>
        {selectedCourse && (
          <CourseDetailView 
            course={selectedCourse} 
            calendarMonths={safeStats.calendarMonths} 
            onClose={() => setSelectedCourse(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default OverviewTab;
