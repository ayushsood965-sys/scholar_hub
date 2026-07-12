import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Clock, AlertCircle, Calendar, MessageSquare, Plus, ExternalLink, CalendarRange, Clock3 } from 'lucide-react';
import useApi from '../../hooks/useApi';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { useToast } from '../../context/ToastContext';
import { AuthContext } from '../../context/AuthContext';

const statusTitles = {
  REGISTRATION_PENDING: 'Registration Pending HOD Approval',
  COURSEWORK: 'Coursework Phase',
  SYNOPSIS_PENDING: 'Synopsis Submission Pending',
  ACTIVE_RESEARCH: 'Active Research Phase',
  PRE_SUBMISSION: 'Pre-Submission Seminar Phase',
  THESIS_SUBMITTED: 'Thesis Submitted to Supervisor',
  PENDING_SUPERVISOR: 'Pending Supervisor Review',
  PENDING_HOD: 'Pending HOD Action',
  SUBMITTED: 'Thesis Dispatched for External Review',
  AWARDED: 'Ph.D. Degree Awarded'
};

// Primitives & Modules
import TrendLineChart from '../../components/ui/TrendLineChart';
import CourseCard from '../../components/ui/CourseCard';
import TargetWidget from '../../components/ui/TargetWidget';
import AttendanceCalendar from '../../components/ui/AttendanceCalendar';
import CourseDetailView from './CourseDetailView';
import ProgressRing from '../../components/ui/ProgressRing';
import SafeAbsencesModal from '../../components/ui/SafeAbsencesModal';

const OverviewTab = ({ thesis }) => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isSafeAbsencesOpen, setIsSafeAbsencesOpen] = useState(false);
  const api = useApi();
  const toast = useToast();

  const getResearchPeriodStats = () => {
    const hasSynopsisApproved = !!thesis?.synopsisApprovedDate;
    const startDateStr = thesis?.synopsisApprovedDate || user?.profile?.admissionDate || thesis?.createdAt || null;
    if (!startDateStr) return null;
    
    const start = new Date(startDateStr);
    const today = new Date();
    
    const diffTime = Math.abs(today - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let monthsPassed = (today.getFullYear() - start.getFullYear()) * 12 + (today.getMonth() - start.getMonth());
    if (today.getDate() < start.getDate()) {
      monthsPassed--;
    }
    
    const minRequiredMonths = 36;
    const monthsLeft = Math.max(0, minRequiredMonths - monthsPassed);
    const daysLeft = Math.max(0, (minRequiredMonths * 30.43) - diffDays);
    
    return {
      startDate: start.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      daysPassed: diffDays,
      monthsPassed: monthsPassed,
      monthsLeft: monthsLeft,
      daysLeft: Math.round(daysLeft),
      isExtension: monthsPassed >= minRequiredMonths,
      percentComplete: Math.min(100, Math.round((monthsPassed / minRequiredMonths) * 100)),
      hasSynopsisApproved
    };
  };

  const researchStats = getResearchPeriodStats();

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
    percentage: 0,
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
        {/* Academic Guidelines Card */}
        <motion.div 
          className="clay-card" 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            padding: '24px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px',
            background: 'var(--color-surface, #ffffff)',
            border: '1px solid var(--color-border-solid, #e5e7eb)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--color-border-solid, #e5e7eb)', paddingBottom: '10px' }}>
            <AlertCircle size={18} style={{ color: 'var(--color-primary)' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Outfit' }}>
              Academic Portal Guidelines
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Item 1 */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(26,90,59,0.08)', color: 'var(--color-primary)', flexShrink: 0, marginTop: '2px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>1</span>
              </div>
              <div style={{ fontSize: '0.78rem', lineHeight: '1.4', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '1px' }}>Minimum Attendance</strong>
                Maintain at least <strong style={{ color: 'var(--color-primary)' }}>{safeStats.minRequiredPercentage}%</strong> overall attendance to remain eligible for examinations.
              </div>
            </div>

            {/* Item 2 */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(26,90,59,0.08)', color: 'var(--color-primary)', flexShrink: 0, marginTop: '2px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>2</span>
              </div>
              <div style={{ fontSize: '0.78rem', lineHeight: '1.4', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '1px' }}>Correction Appeals</strong>
                File corrections under the <strong>Corrections</strong> tab within 7 days of an absence. Maximum of 2 attempts are permitted per class slot.
              </div>
            </div>

            {/* Item 3 */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(26,90,59,0.08)', color: 'var(--color-primary)', flexShrink: 0, marginTop: '2px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>3</span>
              </div>
              <div style={{ fontSize: '0.78rem', lineHeight: '1.4', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)', display: 'block', marginBottom: '1px' }}>Medical & Duty Leaves</strong>
                Approved leaves override absences and count as present days. Track status under the <strong>Leave Management</strong> tab.
              </div>
            </div>
          </div>
        </motion.div>

        {isPhD ? (
          <>
            {/* PhD Research Period Widget */}
            <motion.div 
              className="clay-card" 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{ 
                padding: '24px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '16px',
                background: 'var(--color-surface, #ffffff)',
                border: '1px solid var(--color-border-solid, #e5e7eb)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--color-border-solid, #e5e7eb)', paddingBottom: '10px' }}>
                <Clock3 size={18} style={{ color: 'var(--color-primary)' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'Outfit' }}>
                  {researchStats?.hasSynopsisApproved ? 'Active Research Progress' : 'Time since Admission'}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <ProgressRing 
                  percentage={researchStats?.hasSynopsisApproved ? (researchStats?.percentComplete || 0) : 0} 
                  size={70} 
                  strokeWidth={7} 
                  color="var(--color-primary)" 
                />
                <div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'Outfit' }}>
                    {researchStats?.monthsPassed || 0} Months
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {researchStats?.daysPassed || 0} days passed since {researchStats?.hasSynopsisApproved ? 'synopsis approval' : 'admission'}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                {researchStats?.hasSynopsisApproved ? 'DRC Synopsis Approval:' : 'Admission Date:'} <strong>{researchStats?.startDate || 'Awaiting Registration'}</strong>
              </div>
            </motion.div>

            {/* PhD Target/Remaining Time Widget */}
            <motion.div 
              className="clay-card" 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{ 
                padding: '24px', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                background: 'var(--color-surface, #ffffff)',
                border: '1px solid var(--color-border-solid, #e5e7eb)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-sm)',
                borderLeft: '6px solid var(--color-primary)'
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {researchStats?.hasSynopsisApproved ? 'Research Timeline Target' : 'Pre-Research Phase'}
                </span>
                <h3 style={{ margin: '8px 0', fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-primary)', fontFamily: 'Outfit' }}>
                  {researchStats?.hasSynopsisApproved ? (
                    researchStats?.isExtension 
                      ? 'Standard Residency Completed' 
                      : `${researchStats?.monthsLeft || 0} Months Left`
                  ) : (
                    'DRC Approval Pending'
                  )}
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {researchStats?.hasSynopsisApproved ? (
                    researchStats?.isExtension
                      ? 'You have completed the standard 3-year (36 months) research residency period and are currently in the thesis compilation/extension phase.'
                      : `You have completed ${researchStats?.monthsPassed || 0} months of your active research since synopsis approval. The remaining period to meet the standard 3-year minimum active research timeline is ${researchStats?.monthsLeft || 0} months (${researchStats?.daysLeft || 0} days).`
                  ) : (
                    `Your synopsis is awaiting DRC approval. Once approved, your active research period will commence. Currently, ${researchStats?.monthsPassed || 0} months have elapsed since your admission on ${user?.profile?.admissionDate ? new Date(user.profile.admissionDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A'}.`
                  )}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                <span style={{ 
                  fontSize: '0.75rem', 
                  padding: '4px 10px', 
                  borderRadius: '20px', 
                  background: 'rgba(26,90,59,0.08)', 
                  color: 'var(--color-primary)', 
                  fontWeight: '700',
                  fontFamily: 'Outfit'
                }}>
                  STATUS: {thesis?.status ? statusTitles[thesis.status] || thesis.status : 'Awaiting Thesis Record'}
                </span>
              </div>
            </motion.div>
          </>
        ) : (
          <>
            {/* Target Projections Widget */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <TargetWidget 
                targetWidget={safeStats.targetWidget} 
                onViewSafeAbsences={() => setIsSafeAbsencesOpen(true)} 
              />
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
          </>
        )}
      </div>

      {/* Main Body Grid */}
      <div className="responsive-overview-grid" style={{ gap: '24px' }}>
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

        {/* Right Hand Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Upcoming Classes (Only for non-PhD) */}
          {!isPhD && (
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
                          {cls.subjectCode} • {cls.facultyName} • {cls.date ? new Date(cls.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : cls.dayOfWeek}
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
          )}

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

      {/* Safe Absences Detail Modal */}
      <AnimatePresence>
        {isSafeAbsencesOpen && (
          <SafeAbsencesModal 
            requiredPercentage={safeStats.targetWidget?.requiredPercentage || 75}
            subjectWiseAttendance={safeStats.subjectWiseAttendance || []}
            onClose={() => setIsSafeAbsencesOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default OverviewTab;
