import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  CalendarClock,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  UserMinus,
  FileText,
  GraduationCap,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import useApi from '../../hooks/useApi';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { useToast } from '../../context/ToastContext';
import './OverviewTab.css';

const OverviewTab = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLowAttendance, setShowLowAttendance] = useState(false);
  const [lowAttendanceStudents, setLowAttendanceStudents] = useState([]);
  const [lowAttendanceLoading, setLowAttendanceLoading] = useState(false);
  const api = useApi();
  const toast = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/attendance/dashboard/faculty');
        setStats(res.data);
      } catch (err) {
        toast.error('Failed to load dashboard overview');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [api, toast]);

  const handleViewLowAttendance = useCallback(() => {
    setShowLowAttendance(prev => !prev);
  }, []);

  // Auto-fetch low attendance students on mount
  useEffect(() => {
    let cancelled = false;
    const fetchLowAttendance = async () => {
      setLowAttendanceLoading(true);
      try {
        const res = await api.get('/attendance/dashboard/faculty/low-attendance-students');
        if (!cancelled) setLowAttendanceStudents(res.data);
      } catch (err) {
        if (!cancelled) toast.error('Failed to load low attendance list');
      } finally {
        if (!cancelled) setLowAttendanceLoading(false);
      }
    };
    fetchLowAttendance();
    return () => { cancelled = true; };
  }, [api, toast]);

  if (loading) {
    return (
      <div className="overview-container">
        <SkeletonLoader type="stats" count={4} />
        <div style={{ height: 200 }} className="skeleton skeleton-card" />
      </div>
    );
  }

  const safeStats = stats || {
    name: 'Faculty',
    sessionName: 'No Active Session',
    todayClasses: [],
    markedToday: [],
    nextWeekClasses: [],
    pendingLeavesCount: 0,
    pendingCorrectionsCount: 0,
    lowAttendanceCount: 0,
    managedScholars: 0,
    coursesScheduled: 0,
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date();
  const todayDayName = dayNames[today.getDay()];

  // Group next week classes by date
  const groupedClasses = {};
  for (const cls of safeStats.nextWeekClasses || []) {
    if (!groupedClasses[cls.date]) groupedClasses[cls.date] = [];
    groupedClasses[cls.date].push(cls);
  }

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const formatDayLabel = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00');
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    const tomorrow = new Date(todayDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dTime = d.getTime();
    if (dTime === todayDate.getTime()) return 'Today';
    if (dTime === tomorrow.getTime()) return 'Tomorrow';
    return d.toLocaleDateString('en-IN', { weekday: 'short' });
  };

  const isClassMarked = (classId) => {
    return safeStats.markedToday?.some(m => m.timetableSlotId === classId);
  };

  return (
    <div className="overview-container">
      {/* ─── Welcome Hero ─── */}
      <motion.div
        className="overview-hero animate-in"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="hero-tag">
          <GraduationCap size={14} />
          FACULTY DASHBOARD
        </div>
        <h1 className="hero-title">Welcome back, {safeStats.name}</h1>
        <p className="hero-subtitle">Here's your academic overview and upcoming schedule at a glance.</p>
        {safeStats.sessionName && safeStats.sessionName !== 'No Active Session' && (
          <div className="hero-session-badge">
            <BookOpen size={13} />
            {safeStats.sessionName}
          </div>
        )}
      </motion.div>

      {/* ─── Stats Grid ─── */}
      <div className="overview-stats-grid">
        <motion.div
          className="overview-stat-card accent-green animate-in animate-delay-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="stat-card-top">
            <div className="stat-card-icon icon-green">
              <CalendarDays size={22} />
            </div>
          </div>
          <div className="stat-card-value">{safeStats.nextWeekClasses?.length || 0}</div>
          <div className="stat-card-label">Classes This Week</div>
          <div className="stat-card-hint hint-info">
            <Clock size={11} />
            Next 7 days
          </div>
        </motion.div>

        <motion.div
          className="overview-stat-card accent-blue animate-in animate-delay-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <div className="stat-card-top">
            <div className="stat-card-icon icon-blue">
              <Users size={22} />
            </div>
          </div>
          <div className="stat-card-value">{safeStats.managedScholars || 0}</div>
          <div className="stat-card-label">Managed Scholars</div>
          <div className="stat-card-hint hint-info">
            <GraduationCap size={11} />
            In your department
          </div>
        </motion.div>

        <motion.div
          className="overview-stat-card accent-amber animate-in animate-delay-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="stat-card-top">
            <div className="stat-card-icon icon-amber">
              <FileText size={22} />
            </div>
          </div>
          <div className="stat-card-value">
            {(safeStats.pendingLeavesCount || 0) + (safeStats.pendingCorrectionsCount || 0)}
          </div>
          <div className="stat-card-label">Pending Actions</div>
          <div className="stat-card-hint hint-warning">
            <AlertCircle size={11} />
            {safeStats.pendingLeavesCount || 0} leaves · {safeStats.pendingCorrectionsCount || 0} corrections
          </div>
        </motion.div>

        <motion.div
          className="overview-stat-card accent-red animate-in animate-delay-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
        >
          <div className="stat-card-top">
            <div className="stat-card-icon icon-red">
              <UserMinus size={22} />
            </div>
          </div>
          <div className="stat-card-value">
            {lowAttendanceLoading && lowAttendanceStudents.length === 0 ? (
              <span className="stat-card-spinner" />
            ) : (
              lowAttendanceStudents.length
            )}
          </div>
          <div className="stat-card-label">Low Attendance</div>
          <div className="stat-card-hint hint-danger" style={{ cursor: 'pointer' }} onClick={handleViewLowAttendance}>
            <AlertTriangle size={11} />
            {lowAttendanceLoading && lowAttendanceStudents.length === 0
              ? <><span className="stat-card-spinner" /> Loading students</>
              : lowAttendanceStudents.length > 0
                ? `${lowAttendanceStudents.length} student${lowAttendanceStudents.length > 1 ? 's' : ''} below threshold`
                : 'No students below threshold'}
          </div>
        </motion.div>
      </div>

      {/* ─── Two Column: Today's Schedule + Upcoming Week ─── */}
      <div className="overview-two-col">
        {/* Today's Schedule */}
        <motion.div
          className="overview-section animate-in animate-delay-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="overview-section-header">
            <div className="overview-section-title">
              <div className="overview-section-title-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                <Clock size={18} />
              </div>
              Today's Schedule
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              {todayDayName}
            </span>
          </div>
          <div className="overview-section-body">
            {safeStats.todayClasses?.length > 0 ? (
              <div className="today-schedule-list">
                {safeStats.todayClasses.map((cls, idx) => {
                  const marked = isClassMarked(cls._id);
                  return (
                    <div key={cls._id || idx} className="today-schedule-item">
                      <div className="today-schedule-time">
                        {cls.startTime} – {cls.endTime}
                      </div>
                      <div className="today-schedule-subject">
                        {cls.subjectName}
                      </div>
                      <div className="today-schedule-meta">
                        {cls.degreeNameId?.name ? `${cls.degreeNameId.name} · ` : ''}
                        {cls.semesterId?.name || ''}
                      </div>
                      {marked ? (
                        <span className="upcoming-class-badge badge-marked">
                          <CheckCircle2 size={12} /> Marked
                        </span>
                      ) : (
                        <span className="upcoming-class-badge badge-pending">
                          <Clock size={12} /> Pending
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="overview-empty-state" style={{ padding: '24px 20px' }}>
                <div className="overview-empty-icon">
                  <CalendarClock size={24} />
                </div>
                <div className="overview-empty-title">No classes today</div>
                <div className="overview-empty-desc">You have no classes scheduled for {todayDayName}.</div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Next Week's Classes */}
        <motion.div
          className="overview-section animate-in animate-delay-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <div className="overview-section-header">
            <div className="overview-section-title">
              <div className="overview-section-title-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                <CalendarDays size={18} />
              </div>
              Upcoming Classes
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              Next 7 days
            </span>
          </div>
          <div className="overview-section-body">
            {Object.keys(groupedClasses).length > 0 ? (
              <div className="upcoming-timeline">
                {Object.entries(groupedClasses).map(([date, classes]) => (
                  <div key={date} className="upcoming-day-group">
                    <div className="upcoming-day-label">
                      {formatDayLabel(date)} — {formatDate(date)}
                    </div>
                    {classes.map((cls, idx) => (
                      <div key={cls._id || idx} className="upcoming-class-item">
                        <div className="upcoming-class-time">
                          <span className="upcoming-class-time-start">{cls.startTime}</span>
                          <span className="upcoming-class-time-end">{cls.endTime}</span>
                        </div>
                        <div className="upcoming-class-divider" />
                        <div className="upcoming-class-info">
                          <div className="upcoming-class-subject">{cls.subjectName}</div>
                          <div className="upcoming-class-meta">
                            {cls.degreeNameId?.name ? `${cls.degreeNameId.name} · ` : ''}
                            {cls.semesterId?.name || ''}
                          </div>
                        </div>
                        <span className="upcoming-class-badge badge-pending">
                          <Clock size={11} /> Pending
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="overview-empty-state" style={{ padding: '24px 20px' }}>
                <div className="overview-empty-icon">
                  <CalendarDays size={24} />
                </div>
                <div className="overview-empty-title">No upcoming classes</div>
                <div className="overview-empty-desc">No classes scheduled for the next 7 days.</div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* ─── Pending Actions: Leaves & Corrections ─── */}
      {(safeStats.pendingLeavesCount > 0 || safeStats.pendingCorrectionsCount > 0) && (
        <div className="overview-two-col">
          {/* Pending Leaves */}
          {safeStats.pendingLeavesCount > 0 && (
            <motion.div
              className="overview-section animate-in animate-delay-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <div className="overview-section-header">
                <div className="overview-section-title">
                  <div className="overview-section-title-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                    <FileText size={18} />
                  </div>
                  Pending Leaves
                </div>
                <span className="stat-card-hint hint-info">{safeStats.pendingLeavesCount} pending</span>
              </div>
              <div className="overview-section-body">
                <div className="overview-action-item">
                  <div className="overview-action-avatar" style={{ background: '#3b82f6' }}>S</div>
                  <div className="overview-action-info">
                    <div className="overview-action-name">Student Leave Requests</div>
                    <div className="overview-action-detail">
                      {safeStats.pendingLeavesCount} request{safeStats.pendingLeavesCount > 1 ? 's' : ''} awaiting your review
                    </div>
                  </div>
                  <span className="overview-action-badge badge-leave">Review</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Pending Corrections */}
          {safeStats.pendingCorrectionsCount > 0 && (
            <motion.div
              className="overview-section animate-in animate-delay-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.45 }}
            >
              <div className="overview-section-header">
                <div className="overview-section-title">
                  <div className="overview-section-title-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                    <AlertTriangle size={18} />
                  </div>
                  Pending Corrections
                </div>
                <span className="stat-card-hint hint-warning">{safeStats.pendingCorrectionsCount} pending</span>
              </div>
              <div className="overview-section-body">
                <div className="overview-action-item">
                  <div className="overview-action-avatar" style={{ background: '#f59e0b' }}>C</div>
                  <div className="overview-action-info">
                    <div className="overview-action-name">Attendance Corrections</div>
                    <div className="overview-action-detail">
                      {safeStats.pendingCorrectionsCount} correction{safeStats.pendingCorrectionsCount > 1 ? 's' : ''} need your approval
                    </div>
                  </div>
                  <span className="overview-action-badge badge-correction">Review</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* ─── Low Attendance Section ─── */}
      <motion.div
        className="overview-section animate-in"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <div className="overview-section-header">
          <div className="overview-section-title">
            <div className="overview-section-title-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <UserMinus size={18} />
            </div>
            Low Attendance Students
          </div>
          <button
            className="low-attendance-view-btn"
            onClick={handleViewLowAttendance}
          >
            {showLowAttendance ? (
              <>
                <ChevronUp size={16} /> Hide List
              </>
            ) : (
              <>
                <ChevronDown size={16} /> View List
              </>
            )}
          </button>
        </div>
        <div className="overview-section-body">
          <div className="low-attendance-header">
            <div>
              <div className="low-attendance-count">
                {lowAttendanceLoading && lowAttendanceStudents.length === 0 ? (
                  <span className="stat-card-spinner" />
                ) : (
                  lowAttendanceStudents.length
                )}
              </div>
              <div className="low-attendance-label">
                {lowAttendanceLoading && lowAttendanceStudents.length === 0
                  ? <><span className="stat-card-spinner" /> Loading students</>
                  : lowAttendanceStudents.length > 0
                    ? (lowAttendanceStudents.length > 1 ? 'students are' : 'student is') + ' below the attendance threshold'
                    : 'No students below threshold'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="low-attendance-bar-bg" style={{ width: 120 }}>
                <div
                  className="low-attendance-bar-fill danger"
                  style={{ width: `${lowAttendanceStudents.length > 0 ? Math.min(100, (lowAttendanceStudents.length / Math.max(safeStats.managedScholars, 1)) * 100) : 0}%` }}
                />
              </div>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                {lowAttendanceStudents.length > 0
                  ? ((lowAttendanceStudents.length / Math.max(safeStats.managedScholars, 1)) * 100).toFixed(1) + '%'
                  : '—'}
              </span>
            </div>
          </div>

          <AnimatePresence>
            {showLowAttendance && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{ overflow: 'hidden' }}
              >
                {lowAttendanceLoading ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    Loading...
                  </div>
                ) : lowAttendanceStudents.length > 0 ? (
                  <div className="low-attendance-table">
                    <div className="low-attendance-row low-attendance-row-header">
                      <div className="low-attendance-cell">Student</div>
                      <div className="low-attendance-cell">Enrollment</div>
                      <div className="low-attendance-cell" style={{ textAlign: 'right' }}>Attendance</div>
                    </div>
                    {lowAttendanceStudents.map((s, idx) => (
                      <div key={s.studentId || idx} className="low-attendance-row">
                        <div>
                          <div className="low-attendance-cell-name">{s.name}</div>
                          <div className="low-attendance-cell-enroll">{s.enrollmentNumber}</div>
                          <div className="low-attendance-bar-bg">
                            <div
                              className={`low-attendance-bar-fill ${s.percentage < (s.minRequiredPercentage || 75) ? 'danger' : 'warning'}`}
                              style={{ width: `${Math.min(100, s.percentage)}%` }}
                            />
                          </div>
                        </div>
                        <div />
                        <div className={`low-attendance-cell-percent ${s.percentage < (s.minRequiredPercentage || 75) ? 'danger' : 'warning'}`}>
                          {s.percentage}%
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                    No students below attendance threshold.
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default OverviewTab;
