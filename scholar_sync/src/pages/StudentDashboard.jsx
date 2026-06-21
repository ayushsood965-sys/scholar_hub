import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Book, Flag, FileText, Calendar, User, LogOut, Bell, ClipboardList, CheckCircle2, Clock, Upload, Lock, Award, Edit, File, Layers, Plus, AlertCircle, BookOpen, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { ThesisContext } from '../context/ThesisContext';
import { useToast } from '../context/ToastContext';
import ProfileOnboardingModal from '../components/ProfileOnboardingModal';
import NotificationPanel from '../components/NotificationPanel';
import axios from 'axios';
import { API_BASE_URL, API_URL } from '../config';
import ThemeToggle from '../components/ThemeToggle';

const API = API_URL;
const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const formatMonthYear = (val) => {
  if (!val) return '-';
  const parts = val.split('-');
  if (parts.length !== 2) return val;
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (monthIdx >= 0 && monthIdx < 12) {
    return `${months[monthIdx]} ${year}`;
  }
  return val;
};

const MilestoneTimeline = ({ thesis, milestones = [] }) => {
  const [drcMeetings, setDrcMeetings] = useState([]);
  const [racSessions, setRacSessions] = useState([]);

  const currentStatus = thesis?.status || 'REGISTRATION_PENDING';

  useEffect(() => {
    if (thesis?._id && currentStatus === 'SYNOPSIS_PENDING') {
      axios.get(`${API}/lifecycle/drc/thesis/${thesis._id}`, getAuthHeader())
        .then(res => {
          if (Array.isArray(res.data)) {
            setDrcMeetings(res.data);
          }
        })
        .catch(() => {});
    }
    if (thesis?._id && currentStatus === 'ACTIVE_RESEARCH') {
      axios.get(`${API}/lifecycle/rac/thesis/${thesis._id}`, getAuthHeader())
        .then(res => {
          if (Array.isArray(res.data)) {
            setRacSessions(res.data);
          }
        })
        .catch(() => {});
    }
  }, [thesis?._id, currentStatus]);

  const PHASES = [
    { key: 'REGISTRATION_PENDING', label: 'Registration', desc: 'Awaiting Verification' },
    { key: 'COURSEWORK', label: 'Coursework', desc: 'Clearing Exams' },
    { key: 'SYNOPSIS_PENDING', label: 'Synopsis Approval', desc: 'DRC Evaluation' },
    { key: 'ACTIVE_RESEARCH', label: 'Active Research', desc: 'RAC & Progress' },
    { key: 'PRE_SUBMISSION', label: 'Pre-Submission', desc: 'Colloquium & Seminars' },
    { key: 'SUBMITTED', label: 'Thesis Submission', desc: 'Evaluation Board' },
    { key: 'AWARDED', label: 'Degree Awarded', desc: 'Convocation' }
  ];

  const currentStep = PHASES.findIndex(p => p.key === currentStatus);
  let activeStepIndex = currentStep === -1 ? 0 : currentStep;
  if (currentStep === -1 && ['THESIS_SUBMITTED', 'PENDING_SUPERVISOR', 'PENDING_HOD', 'SUBMITTED'].includes(currentStatus)) {
    activeStepIndex = PHASES.findIndex(p => p.key === 'SUBMITTED');
  }

  const renderSubStepSection = (title, steps) => {
    return (
      <div style={{ marginTop: '24px', borderTop: '1px solid #E2E8F0', paddingTop: '20px' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>📋</span> {title}
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {steps.map((step, idx) => {
            const isSuccess = step.status === 'SUCCESS';
            const isDanger = step.status === 'DANGER';
            const isWarning = step.status === 'WARNING';
            
            let bg = '#F1F5F9';
            let border = '#CBD5E1';
            let color = '#475569';
            let icon = '⚪';

            if (isSuccess) {
              bg = '#ECFDF5';
              border = '#A7F3D0';
              color = '#047857';
              icon = '✅';
            } else if (isDanger) {
              bg = '#FEF2F2';
              border = '#FCA5A5';
              color = '#B91C1C';
              icon = '❌';
            } else if (isWarning) {
              bg = '#FFFBEB';
              border = '#FDE68A';
              color = '#B45309';
              icon = '⏳';
            }

            return (
              <div 
                key={idx} 
                style={{ 
                  background: bg, 
                  border: `1px solid ${border}`, 
                  borderRadius: '10px', 
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  transition: 'transform 0.2s',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '1rem' }}>{icon}</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color }}>{step.label}</span>
                </div>
                <p style={{ fontSize: '0.72rem', color: '#64748B', margin: 0, lineHeight: 1.4 }}>
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDetailedSubProgression = () => {
    if (currentStatus === 'SYNOPSIS_PENDING') {
      const synopsis = milestones?.find(m => m.type === 'SYNOPSIS');
      
      const step1Uploaded = synopsis && ['SUBMITTED', 'PENDING_HOD', 'REVISION_REQUIRED', 'APPROVED'].includes(synopsis.status);
      const step2Approved = synopsis?.status === 'APPROVED';
      const step2PendingHOD = synopsis?.status === 'PENDING_HOD';
      const step2Revision = synopsis?.status === 'REVISION_REQUIRED';
      const step2Submitted = synopsis?.status === 'SUBMITTED';

      const latestDrc = drcMeetings[0];
      const activeDrc = latestDrc?.status === 'SCHEDULED' ? latestDrc : null;
      const drcApproved = latestDrc?.status === 'APPROVED';
      const drcRevision = latestDrc?.status === 'REVISION_REQUIRED';

      const step3Scheduled = drcMeetings.length > 0;
      const step3AwaitingSchedule = step2Approved && !step3Scheduled;

      const step4Approved = drcApproved;
      const step4Revision = drcRevision;
      const step4Scheduled = !!activeDrc;

      const subSteps = [
        {
          label: 'Synopsis Document Drafted',
          desc: step1Uploaded 
            ? 'Research title, abstract, and proposal PDF uploaded.' 
            : 'Prepare your draft synopsis and upload for advisor review.',
          status: step1Uploaded ? 'SUCCESS' : 'PENDING'
        },
        {
          label: 'Supervisor Sign-off',
          desc: step2Approved 
            ? 'Approved by Supervisor & HOD.' 
            : step2PendingHOD 
            ? 'Approved by Supervisor. Awaiting HOD Final Approval.'
            : step2Revision 
            ? `Correction needed: "${synopsis.comments?.[synopsis.comments.length - 1]?.text || 'Check remarks'}"`
            : step2Submitted 
            ? 'Awaiting your supervisor\'s review and evaluation.' 
            : 'Awaiting synopsis document upload.',
          status: (step2Approved || step2PendingHOD) ? 'SUCCESS' : step2Revision ? 'DANGER' : step2Submitted ? 'WARNING' : 'PENDING'
        },
        {
          label: 'DRC Meeting Scheduling',
          desc: drcApproved || drcRevision
            ? 'DRC evaluation session successfully concluded.'
            : activeDrc 
            ? `Scheduled: ${new Date(activeDrc.scheduledDate).toLocaleDateString()} at ${activeDrc.scheduledTime} in ${activeDrc.venue}.` 
            : step3AwaitingSchedule 
            ? 'Supervisor approved! HOD will schedule the DRC evaluation board shortly.' 
            : 'Awaiting supervisor approval before committee scheduling.',
          status: (drcApproved || drcRevision || activeDrc) ? 'SUCCESS' : step3AwaitingSchedule ? 'WARNING' : 'PENDING'
        },
        {
          label: 'DRC Panel Evaluation',
          desc: drcApproved 
            ? 'Synopsis officially approved by the Departmental Research Committee!' 
            : drcRevision 
            ? `Panel revisions required: "${drcMeetings.find(m => m.status === 'REVISION_REQUIRED')?.remarks || 'Check feedback'}"`
            : activeDrc 
            ? 'Awaiting presentation defense and grading outcome.' 
            : 'DRC evaluation panel will convene after scheduling.',
          status: drcApproved ? 'SUCCESS' : drcRevision ? 'DANGER' : activeDrc ? 'WARNING' : 'PENDING'
        }
      ];

      return renderSubStepSection("Research Synopsis & DRC Progression Details", subSteps);
    }

    if (currentStatus === 'ACTIVE_RESEARCH') {
      const reports = milestones?.filter(m => m.type === '6_MONTH_REPORT' || m.type === 'PROGRESS_REPORT') || [];
      const approvedCount = reports.filter(r => r.status === 'APPROVED').length;
      
      const subSteps = [
        {
          label: 'Research Advisor Allocation',
          desc: thesis.supervisorId ? `Supervisor: ${thesis.supervisorId.name}.` : 'Supervisor allocation pending verification.',
          status: thesis.supervisorId ? 'SUCCESS' : 'WARNING'
        },
        {
          label: 'Periodic RAC Evaluations',
          desc: racSessions.length > 0 
            ? `Concluded ${racSessions.filter(r => r.status === 'SATISFACTORY').length} RAC review panels successfully.`
            : 'Schedule your periodic RAC progress evaluation within 6 months.',
          status: racSessions.some(r => r.status === 'SATISFACTORY') ? 'SUCCESS' : 'WARNING'
        },
        {
          label: 'Progress Reports Deliverables',
          desc: reports.length > 0 
            ? `Cleared ${approvedCount} of ${reports.length} scheduled progress reports.` 
            : 'No progress reports assigned yet.',
          status: approvedCount > 0 ? 'SUCCESS' : 'PENDING'
        }
      ];

      return renderSubStepSection("Active Research & RAC Progression Details", subSteps);
    }

    if (currentStatus === 'PRE_SUBMISSION') {
      const preMilestone = milestones?.find(m => m.type === 'PRE_SUBMISSION');
      const uploaded = preMilestone && ['SUBMITTED', 'REVISION_REQUIRED', 'APPROVED'].includes(preMilestone.status);
      const approved = preMilestone?.status === 'APPROVED';
      const revision = preMilestone?.status === 'REVISION_REQUIRED';
      const submitted = preMilestone?.status === 'SUBMITTED';

      const subSteps = [
        {
          label: 'Pre-Submission Seminar Defense',
          desc: 'Seminar successfully cleared in front of department experts.',
          status: 'SUCCESS'
        },
        {
          label: 'Package Upload (Publications & Rough Draft)',
          desc: uploaded 
            ? 'Draft package uploaded successfully.' 
            : 'Upload draft thesis, plagiarism certificate, and publication proofs.',
          status: uploaded ? 'SUCCESS' : 'PENDING'
        },
        {
          label: 'Advisor Final Sign-off',
          desc: approved 
            ? 'Approved by advisor. Ready for digital sign-off and dispatch.' 
            : revision 
            ? `Revisions required: "${preMilestone.comments?.[preMilestone.comments.length - 1]?.text || 'Check feedback'}"`
            : submitted 
            ? 'Under evaluation by your Research Advisor.' 
            : 'Awaiting package upload for supervisor signature.',
          status: approved ? 'SUCCESS' : revision ? 'DANGER' : submitted ? 'WARNING' : 'PENDING'
        }
      ];

      return renderSubStepSection("Pre-Submission Progression Details", subSteps);
    }

    if (['THESIS_SUBMITTED', 'PENDING_SUPERVISOR', 'PENDING_HOD', 'SUBMITTED', 'AWARDED'].includes(currentStatus)) {
      const isDispatched = !!thesis.dispatchDate;
      const isVivaScheduled = thesis.vivaStatus === 'SCHEDULED';
      const isVivaSuccessful = thesis.vivaStatus === 'SUCCESSFUL';
      const isVivaUnsuccessful = thesis.vivaStatus === 'UNSUCCESSFUL';
      const isAwarded = thesis.status === 'AWARDED';

      const subSteps = [
        {
          label: 'Thesis Dispatch to External Examiners',
          desc: isDispatched 
            ? `Dispatched on ${new Date(thesis.dispatchDate).toLocaleDateString()} via ${thesis.dispatchMethod} ${thesis.dispatchTrackingNumber ? `(Ref: ${thesis.dispatchTrackingNumber})` : ''}.`
            : 'Awaiting thesis examiner dispatch by HOD/Admin.',
          status: isDispatched ? 'SUCCESS' : 'WARNING'
        },
        {
          label: 'Viva-Voce Oral Defense',
          desc: isVivaSuccessful
            ? `Passed defense colloquium successfully! Panel Remarks: "${thesis.vivaRemarks || 'Satisfactory'}"`
            : isVivaScheduled
            ? `Defense Scheduled: ${new Date(thesis.vivaDate).toLocaleDateString()} at ${thesis.vivaTime} in ${thesis.vivaVenue}.`
            : isVivaUnsuccessful
            ? `Revisions required: "${thesis.vivaRemarks || 'Check notes'}"`
            : 'Awaiting assessment clearance from external examiners.',
          status: isVivaSuccessful ? 'SUCCESS' : isVivaScheduled ? 'WARNING' : isVivaUnsuccessful ? 'DANGER' : 'PENDING'
        },
        {
          label: 'Degree Award Clearance',
          desc: isAwarded 
            ? `Ph.D. degree officially awarded by Academic Council on ${thesis.awardedAt ? new Date(thesis.awardedAt).toLocaleDateString() : 'N/A'}.`
            : 'Awaiting defense completion and board approval.',
          status: isAwarded ? 'SUCCESS' : 'PENDING'
        }
      ];

      return renderSubStepSection("Degree Award & Evaluation Progression Details", subSteps);
    }

    return null;
  };

  return (
    <div className="card" style={{ padding: '24px 20px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0', marginBottom: '16px' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>🎓 Ph.D. Research Progression Timeline</span>
      </h3>
      
      {/* Horizontal timeline bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', overflowX: 'auto', paddingBottom: '10px', gap: '12px' }}>
        {/* Connecting background line */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '6%',
          right: '6%',
          height: '4px',
          background: '#E2E8F0',
          zIndex: 1
        }} />
        
        {/* Active colored line */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '6%',
          width: `${(activeStepIndex / (PHASES.length - 1)) * 88}%`,
          height: '4px',
          background: 'linear-gradient(90deg, #10B981 0%, #3B82F6 100%)',
          zIndex: 2,
          transition: 'width 0.4s ease'
        }} />

        {PHASES.map((phase, idx) => {
          const isCompleted = idx < activeStepIndex;
          const isActive = idx === activeStepIndex;
          const isPending = idx > activeStepIndex;

          return (
            <div key={phase.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: '95px', textAlign: 'center', zIndex: 3 }}>
              {/* Step indicator circle */}
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isCompleted ? '#10B981' : isActive ? '#3B82F6' : '#FFFFFF',
                border: isCompleted ? 'none' : isActive ? '4px solid #DBEAFE' : '2px solid #CBD5E1',
                color: isCompleted || isActive ? '#FFFFFF' : '#64748B',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                boxShadow: isActive ? '0 0 0 4px rgba(59, 130, 246, 0.15)' : 'none',
                transition: 'all 0.3s ease',
                marginBottom: '10px'
              }}>
                {isCompleted ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                ) : (
                  idx + 1
                )}
              </div>

              {/* Title & Desc */}
              <div style={{ fontSize: '0.78rem', fontWeight: isActive ? 800 : 600, color: isActive ? '#1E3A8A' : isCompleted ? '#10B981' : '#475569', marginBottom: '3px' }}>
                {phase.label}
              </div>
              <div style={{ fontSize: '0.68rem', color: isActive ? '#3B82F6' : '#94A3B8', fontWeight: isActive ? 600 : 400 }}>
                {phase.desc}
              </div>
              {isActive && (
                <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 6px', background: '#DBEAFE', color: '#1E40AF', borderRadius: '4px', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Current Phase
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Dynamic Detailed Sub-Progression Checklist */}
      {renderDetailedSubProgression()}
    </div>
  );
};

const Sidebar = ({ activeTab, setActiveTab, isVerified, thesis, milestones }) => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const items = [
    { key: 'overview', label: 'Dashboard', Icon: Home },
    { key: 'profile', label: 'Profile', Icon: User },
    { key: 'thesis', label: 'My Thesis', Icon: Book },
    { key: 'workspace', label: 'Workspace', Icon: Flag },
    { key: 'rac', label: 'RAC Progress', Icon: Layers },
    { key: 'sixMonthReports', label: '6-Month Reports', Icon: Calendar },
    { key: 'chapterDrafts', label: 'Chapter Drafts', Icon: FileText },
    { key: 'publications', label: 'Research Outputs', Icon: Award },
    { key: 'preSubmission', label: 'Pre-Submission', Icon: ClipboardList },
    { key: 'finalSubmission', label: 'Final Submission', Icon: BookOpen },
    { key: 'meetings', label: 'Meetings', Icon: Calendar },
    { key: 'documents', label: 'Documents', Icon: FileText },
    { key: 'changes', label: 'Request Changes', Icon: Edit },
    { key: 'certificates', label: 'Certificates', Icon: Award },
  ];
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <img src="/hpu_logo.png" alt="HPU Logo" style={{ width: 42, height: 42, objectFit: 'contain' }} />
        </div>
        <h2>ScholarHub</h2>
      </div>
      <div className="sidebar-nav" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 160px)' }}>
        {items.map(({ key, label, Icon }) => {
          const disabled = (() => {
            if (key === 'overview' || key === 'profile') return false;
            if (!thesis || thesis.status === 'REGISTRATION_PENDING') return true;
            
            const status = thesis.status;
            if (key === 'thesis' || key === 'workspace' || key === 'certificates') {
              return !['COURSEWORK', 'SYNOPSIS_PENDING', 'ACTIVE_RESEARCH', 'PRE_SUBMISSION', 'THESIS_SUBMITTED', 'PENDING_SUPERVISOR', 'PENDING_HOD', 'SUBMITTED', 'AWARDED'].includes(status);
            }
            if ([
              'rac', 
              'sixMonthReports', 
              'chapterDrafts', 
              'publications', 
              'meetings', 
              'documents', 
              'changes'
            ].includes(key)) {
              return !['ACTIVE_RESEARCH', 'PRE_SUBMISSION', 'THESIS_SUBMITTED', 'PENDING_SUPERVISOR', 'PENDING_HOD', 'SUBMITTED', 'AWARDED'].includes(status);
            }
            if (key === 'preSubmission') {
              const hasPreMilestone = milestones && milestones.some(m => m.type === 'PRE_SUBMISSION');
              return !(['ACTIVE_RESEARCH', 'PRE_SUBMISSION', 'THESIS_SUBMITTED', 'PENDING_SUPERVISOR', 'PENDING_HOD', 'SUBMITTED', 'AWARDED'].includes(status) || hasPreMilestone);
            }
            if (key === 'finalSubmission') {
              const hasFinalMilestone = milestones && milestones.some(m => m.type === 'FINAL_SUBMISSION');
              return !(['PRE_SUBMISSION', 'THESIS_SUBMITTED', 'PENDING_SUPERVISOR', 'PENDING_HOD', 'SUBMITTED', 'AWARDED'].includes(status) || hasFinalMilestone);
            }
            return true;
          })();

          return (
            <button 
              key={key} 
              className={`nav-item ${activeTab === key ? 'active' : ''}`} 
              onClick={() => { if (!disabled) { setActiveTab(key); document.body.classList.remove('sidebar-mobile-open'); } }}
              disabled={disabled}
              style={{ 
                background: 'none', 
                border: 'none', 
                width: '100%', 
                cursor: disabled ? 'not-allowed' : 'pointer', 
                textAlign: 'left',
                opacity: disabled ? 0.45 : 1,
                pointerEvents: disabled ? 'none' : 'auto'
              }}
            >
              <Icon className="nav-icon" /> {label} {disabled && '🔒'}
            </button>
          );
        })}
      </div>
      <div className="sidebar-bottom">
        <button className="nav-item" onClick={() => { logout(); navigate('/'); }}
          style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left', color: '#F87171' }}>
          <LogOut className="nav-icon" /> Logout
        </button>
      </div>
    </div>
  );
};

const Header = ({ title }) => {
  const { user } = useContext(AuthContext);
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useContext(NotificationContext);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const handleOutsideClick = () => setShowDropdown(false);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  const handleItemClick = (e, notifId) => {
    e.stopPropagation();
    markAsRead(notifId);
  };

  const handleMarkAll = (e) => {
    e.stopPropagation();
    markAllAsRead();
  };

  const getAccentColor = (type) => {
    if (type === 'WELCOME') return '#7C3AED';
    if (type === 'PROFILE_INCOMPLETE') return '#EF4444';
    if (type === 'PENDING_ACTION') return '#D97706';
    if (type === 'SUCCESSFUL_ACTION') return '#10B981';
    return '#3B82F6';
  };

  return (
    <div className="header">
      <button 
        className="mobile-menu-toggle" 
        onClick={() => document.body.classList.toggle('sidebar-mobile-open')}
        style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '8px' }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
      </button>
      <div className="header-title">{title}</div>
      <div className="header-actions">
        <ThemeToggle style={{ marginRight: '8px', color: '#475569' }} />
        {/* Bell Popover Container */}
        <div style={{ position: 'relative' }}>
          <button 
            onClick={toggleDropdown}
            className="notification-bell"
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              position: 'relative', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '8px',
              borderRadius: '50%',
              transition: 'background-color 0.2s',
              color: '#475569'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F1F5F9'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span 
                className="notification-badge" 
                style={{ 
                  position: 'absolute', 
                  top: '2px', 
                  right: '2px', 
                  background: '#EF4444', 
                  color: 'white', 
                  fontSize: '9px', 
                  fontWeight: 'bold', 
                  borderRadius: '50%', 
                  width: '18px', 
                  height: '18px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '2px solid white'
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Floating Dropdown */}
          {showDropdown && (
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: '45px',
                right: '0',
                width: '340px',
                background: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                zIndex: 99999,
                overflow: 'hidden',
                textAlign: 'left'
              }}
            >
              {/* Dropdown Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #F1F5F9', background: '#FAFAFA' }}>
                <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🔔</span> Recent Notifications
                </span>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAll}
                    style={{ background: 'none', border: 'none', color: '#10B981', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Scrollable List */}
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94A3B8', fontSize: '0.8rem' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🍃</div>
                    <p style={{ margin: 0, fontWeight: 600 }}>All Caught Up!</p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.72rem' }}>No notifications to show.</p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const dotColor = getAccentColor(n.type);
                    return (
                      <div 
                        key={n._id}
                        onClick={(e) => handleItemClick(e, n._id)}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid #F1F5F9',
                          background: n.read ? 'white' : '#F8FAFC',
                          cursor: 'pointer',
                          display: 'flex',
                          gap: '10px',
                          alignItems: 'flex-start',
                          transition: 'background-color 0.2s',
                          position: 'relative'
                        }}
                      >
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: dotColor, marginTop: '5px', flexShrink: 0 }} />
                        
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: n.read ? 600 : 800, color: '#1E293B', lineHeight: 1.2 }}>
                              {n.title}
                            </span>
                            <span style={{ fontSize: '0.62rem', color: '#94A3B8', flexShrink: 0 }}>
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#64748B', lineHeight: 1.3 }}>
                            {n.message}
                          </p>
                        </div>

                        {!n.read && (
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444', alignSelf: 'center', marginLeft: 'auto' }} />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="user-profile">
          {user?.avatarUrl ? (
            <img src={`${API_BASE_URL}${user.avatarUrl}`} alt="Student" className="user-avatar" style={{ objectFit: 'cover' }} />
          ) : (
            <svg viewBox="0 0 100 100" className="user-avatar" style={{ width: 36, height: 36, borderRadius: '50%', background: '#e2e8f0', display: 'block' }}>
              <circle cx="50" cy="35" r="20" fill="#94a3b8" />
              <path d="M15 85c0-13.8 11.2-25 25-25h20c13.8 0 25 11.2 25 25z" fill="#94a3b8" />
            </svg>
          )}
          <div className="user-info"><span className="user-name">{user?.name || 'Student'}</span><span className="user-dept">SCHOLAR</span></div>
        </div>
      </div>
    </div>
  );
};

// ── Enrollment Form (no thesis yet) ──
const EnrollmentForm = ({ onSubmit }) => {
  const { user } = useContext(AuthContext);
  const toast = useToast();
  const [form, setForm] = useState({ 
    enrollmentNumber: '', 
    department: user?.department || '', 
    title: '', 
    abstract: '' 
  });
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API}/departments`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDepts(data);
          if (data.length > 0 && !form.department) {
            setForm(prev => ({ ...prev, department: data[0].name }));
          }
        }
      })
      .catch(() => {});
  }, []);

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = async e => {
    e.preventDefault(); 
    setLoading(true);
    try { 
      await onSubmit({
        ...form,
        department: user?.department || form.department
      }); 
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Error'); 
    } finally { 
      setLoading(false); 
    }
  };
  return (
    <div className="card" style={{ maxWidth: 700, margin: '0 auto' }}>
      <h3 className="card-title">Complete Enrollment</h3>
      <p style={{ color: '#6b7280', marginBottom: 24 }}>You must complete your thesis registration before accessing the research portal.</p>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Enrollment Number *</label>
            <input className="form-input" name="enrollmentNumber" value={form.enrollmentNumber} onChange={handle} placeholder="e.g., 2024-CS-001" required />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Department *</label>
            <select className="form-input" name="department" value={form.department} disabled style={{ background: '#F1F5F9', color: '#64748B' }}>
              <option value={user?.department || ''}>{user?.department || 'N/A'}</option>
            </select>
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Tentative Research Title *</label>
          <input className="form-input" name="title" value={form.title} onChange={handle} placeholder="e.g., AI-Driven Solutions for Healthcare" required />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Research Abstract *</label>
          <textarea className="form-input" name="abstract" value={form.abstract} onChange={handle} rows="5" placeholder="Brief summary of your proposed research..." required />
        </div>
        <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }} disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Registration'}
        </button>
      </form>
    </div>
  );
};

// ── Waiting Room ──
const WaitingRoom = ({ thesis }) => (
  <div className="card" style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', padding: 48 }}>
    <Clock size={64} color="#F59E0B" style={{ margin: '0 auto 16px' }} />
    <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>Awaiting Admin Verification</h3>
    <p style={{ color: '#6b7280', marginBottom: 24 }}>Your registration has been submitted. The admin will verify your enrollment and assign a supervisor. All uploads are locked until verification is complete.</p>
    <div style={{ background: '#FEF3C7', borderRadius: 12, padding: 16, textAlign: 'left' }}>
      <div style={{ fontWeight: 600, marginBottom: 8, color: '#92400E' }}>Submitted Details:</div>
      <div style={{ fontSize: '0.9rem', color: '#78350F' }}>
        <div>📋 Enrollment: <strong>{thesis.enrollmentNumber}</strong></div>
        <div>🏛 Department: <strong>{thesis.department}</strong></div>
        <div>📌 Title: <strong>{thesis.title}</strong></div>
      </div>
    </div>
    <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#6b7280', fontSize: '0.85rem' }}>
      <Lock size={16} /> Uploads disabled until admin verification
    </div>
  </div>
);

// ── Coursework Phase ──
const CourseworkPhase = ({ thesis }) => {
  const { submitCourseworkDetails, fetchMyThesis } = useContext(ThesisContext);
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [shake, setShake] = useState(false);
  const cardRef = React.useRef(null);

  // Row state helper
  const createEmptyRow = () => ({ subjectName: '', subjectCode: '', marksObtained: '', maxMarks: '', examinationMonthYear: '' });

  const [researchEthics, setResearchEthics] = useState(
    thesis.courseworkDetails?.researchEthics?.length > 0
      ? thesis.courseworkDetails.researchEthics
      : [createEmptyRow()]
  );
  const [researchMethodology, setResearchMethodology] = useState(
    thesis.courseworkDetails?.researchMethodology?.length > 0
      ? thesis.courseworkDetails.researchMethodology
      : [createEmptyRow()]
  );
  const [elective, setElective] = useState(
    thesis.courseworkDetails?.elective?.length > 0
      ? thesis.courseworkDetails.elective
      : [createEmptyRow()]
  );
  const [others, setOthers] = useState(
    thesis.courseworkDetails?.others?.length > 0
      ? thesis.courseworkDetails.others
      : [createEmptyRow()]
  );

  const handleRowChange = (section, index, field, value) => {
    const setters = {
      researchEthics: setResearchEthics,
      researchMethodology: setResearchMethodology,
      elective: setElective,
      others: setOthers
    };
    const getters = {
      researchEthics,
      researchMethodology,
      elective,
      others
    };
    const setter = setters[section];
    const getter = getters[section];
    if (setter && getter) {
      const updated = [...getter];
      updated[index] = { ...updated[index], [field]: value };
      setter(updated);
    }
  };

  const addRow = (section) => {
    const setters = {
      researchEthics: setResearchEthics,
      researchMethodology: setResearchMethodology,
      elective: setElective,
      others: setOthers
    };
    const getters = {
      researchEthics,
      researchMethodology,
      elective,
      others
    };
    const setter = setters[section];
    const getter = getters[section];
    if (setter && getter) {
      setter([...getter, createEmptyRow()]);
    }
  };

  const removeRow = (section, index) => {
    const setters = {
      researchEthics: setResearchEthics,
      researchMethodology: setResearchMethodology,
      elective: setElective,
      others: setOthers
    };
    const getters = {
      researchEthics,
      researchMethodology,
      elective,
      others
    };
    const setter = setters[section];
    const getter = getters[section];
    if (setter && getter) {
      if (getter.length > 1) {
        setter(getter.filter((_, i) => i !== index));
      } else if (section === 'others') {
        setter([createEmptyRow()]);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Pre-validation
    const checkSection = (sectionRows, name, isOptional = false) => {
      for (const row of sectionRows) {
        if (isOptional && !row.subjectName.trim() && !row.subjectCode.trim() && !row.marksObtained && !row.maxMarks) {
          continue;
        }
        if (!row.subjectName.trim()) {
          throw new Error(`Subject Name is required in all active rows of ${name}.`);
        }
        const obtained = Number(row.marksObtained);
        const max = Number(row.maxMarks);
        if (isNaN(obtained) || obtained < 0) {
          throw new Error(`Valid Marks Obtained is required in ${name}.`);
        }
        if (isNaN(max) || max <= 0) {
          throw new Error(`Valid Maximum Marks (greater than 0) is required in ${name}.`);
        }
        if (obtained > max) {
          throw new Error(`Marks Obtained (${obtained}) cannot exceed Maximum Marks (${max}) in ${name}.`);
        }
        if (!row.examinationMonthYear) {
          throw new Error(`Examination Month & Year is required in ${name}.`);
        }
      }
    };

    try {
      checkSection(researchEthics, 'Research and Publication Ethics');
      checkSection(researchMethodology, 'Research Methodology');
      checkSection(elective, 'Discipline-Specific Elective Course');
      checkSection(others, 'Others', true);

      if (!proofFile && !thesis.courseworkUploadProof) {
        throw new Error('Upload Proof is required.');
      }

      await submitCourseworkDetails({
        researchEthics,
        researchMethodology,
        elective,
        others,
        proof: proofFile
      });
      toast.success('Coursework details submitted successfully!');
      fetchMyThesis();
    } catch (err) {
      const errMsg = err.message || err.response?.data?.message || 'Failed to submit coursework details.';
      setError(errMsg);
      toast.error(errMsg);
      setShake(true);
      setTimeout(() => setShake(false), 500);
      if (cardRef.current) {
        cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper to resolve HOD/supervisor status styles
  const getStatusBanner = () => {
    if (thesis.courseworkStatus === 'PENDING_FACULTY') {
      return (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF', padding: 16, borderRadius: 12, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Clock size={24} />
          <div>
            <div style={{ fontWeight: 600 }}>Submitted & Awaiting Supervisor Approval</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Your coursework details have been forwarded to your supervisor ({thesis.supervisorId?.name || 'Assigned Guide'}) for review.</div>
          </div>
        </div>
      );
    }
    if (thesis.courseworkStatus === 'PENDING_HOD') {
      return (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E', padding: 16, borderRadius: 12, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Clock size={24} />
          <div>
            <div style={{ fontWeight: 600 }}>Supervisor Approved & Awaiting HOD Clearance</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Approved by supervisor! Currently pending final verification by the Head of Department.</div>
          </div>
        </div>
      );
    }
    if (thesis.courseworkStatus === 'REJECTED') {
      return (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: 16, borderRadius: 12, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertCircle size={24} />
          <div>
            <div style={{ fontWeight: 600 }}>Coursework Revision Required</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Your supervisor or HOD returned your submission for correction. Please review details, modify if necessary, and resubmit.</div>
          </div>
        </div>
      );
    }
    return (
      <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534', padding: 16, borderRadius: 12, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <CheckCircle2 size={24} />
        <div>
          <div style={{ fontWeight: 600 }}>Coursework Phase Active</div>
          <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>{thesis.supervisorId?.name || 'Assigned Guide'} has been assigned as your supervisor. Please enter your coursework marks.</div>
        </div>
      </div>
    );
  };

  const renderReadOnlySection = (title, items) => {
    if (!items || items.length === 0) return null;
    return (
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#374151', marginBottom: 8, borderBottom: '1px solid #E5E7EB', paddingBottom: 4 }}>{title}</h4>
        <div style={{ background: '#F9FAFB', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#F3F4F6', color: '#4B5563', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px' }}>Subject Name</th>
                <th style={{ padding: '8px 12px' }}>Subject Code</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Marks Obtained</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Max Marks</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Exam Month & Year</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
                  <td style={{ padding: '8px 12px', color: '#1F2937' }}>{row.subjectName}</td>
                  <td style={{ padding: '8px 12px', color: '#1F2937' }}>{row.subjectCode || '-'}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: '#1F2937' }}>{row.marksObtained}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: '#1F2937' }}>{row.maxMarks}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: '#1F2937' }}>{formatMonthYear(row.examinationMonthYear)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderEditableSection = (title, section, items) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '2px solid #E2E8F0', paddingBottom: 6 }}>
        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>{title}</h4>
      </div>

      {/* Row Table Headers */}
      <div style={{ display: 'flex', gap: 12, padding: '0 12px 6px 12px', borderBottom: '1px solid #E2E8F0', marginBottom: 8, fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
        <div style={{ flex: 2 }}>Subject Name</div>
        <div style={{ flex: 1.5 }}>Subject Code</div>
        <div style={{ flex: 1, textAlign: 'center' }}>Obtained</div>
        <div style={{ flex: 1, textAlign: 'center' }}>Max Marks</div>
        <div style={{ flex: 1.5, textAlign: 'center' }}>Exam Month & Year</div>
        {(items.length > 1 || section === 'others') && <div style={{ width: 24 }} />}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((row, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ flex: 2 }}>
              <input
                className="form-input"
                style={{ padding: '6px 12px', fontSize: '0.88rem' }}
                placeholder="Subject Name"
                value={row.subjectName}
                onChange={(e) => handleRowChange(section, idx, 'subjectName', e.target.value)}
                required={section !== 'others'}
              />
            </div>
            <div style={{ flex: 1.5 }}>
              <input
                className="form-input"
                style={{ padding: '6px 12px', fontSize: '0.88rem' }}
                placeholder="Code (optional)"
                value={row.subjectCode}
                onChange={(e) => handleRowChange(section, idx, 'subjectCode', e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <input
                type="number"
                className="form-input"
                style={{ padding: '6px 12px', fontSize: '0.88rem', textAlign: 'center' }}
                placeholder="Obtained"
                value={row.marksObtained}
                onChange={(e) => handleRowChange(section, idx, 'marksObtained', e.target.value)}
                min="0"
                required={section !== 'others'}
              />
            </div>
            <div style={{ flex: 1 }}>
              <input
                type="number"
                className="form-input"
                style={{ padding: '6px 12px', fontSize: '0.88rem', textAlign: 'center' }}
                placeholder="Max Marks"
                value={row.maxMarks}
                onChange={(e) => handleRowChange(section, idx, 'maxMarks', e.target.value)}
                min="1"
                required={section !== 'others'}
              />
            </div>
            <div style={{ flex: 1.5 }}>
              <input
                type="month"
                className="form-input"
                style={{ padding: '6px 12px', fontSize: '0.88rem', color: row.examinationMonthYear ? 'inherit' : '#94A3B8' }}
                value={row.examinationMonthYear}
                onChange={(e) => handleRowChange(section, idx, 'examinationMonthYear', e.target.value)}
                required={section !== 'others'}
              />
            </div>
            {(items.length > 1 || section === 'others') && (
              <button
                type="button"
                style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: 4 }}
                onClick={() => removeRow(section, idx)}
                title="Remove Row"
              >
                🗑️
              </button>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 12 }}>
        <button 
          type="button" 
          onClick={() => addRow(section)} 
          style={{ 
            padding: '6px 12px', 
            fontSize: '0.75rem', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 4,
            background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
            border: '1px solid #BFDBFE',
            color: '#1E40AF',
            borderRadius: '6px',
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(59, 130, 246, 0.05)'
          }}
        >
          <Plus size={14} /> Add Row
        </button>
      </div>
    </div>
  );

  const isPending = thesis.courseworkStatus === 'PENDING_FACULTY' || thesis.courseworkStatus === 'PENDING_HOD';

  return (
    <div ref={cardRef} className={`card ${shake ? 'shake-on-error' : ''}`} style={{ maxWidth: 700, margin: '0 auto', padding: 32 }}>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .shake-on-error {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, borderBottom: '2px solid #F3F4F6', paddingBottom: 16 }}>
        <BookOpen size={36} color="#3B82F6" />
        <div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>Doctoral Coursework Clearance</h3>
          <p style={{ color: '#6b7280', fontSize: '0.88rem', margin: '4px 0 0' }}>Enter exam results for Research Methodology, Research Analysis, and Electives for verification.</p>
        </div>
      </div>

      {getStatusBanner()}

      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '12px 16px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 20 }}>
          {error}
        </div>
      )}

      {isPending ? (
        <div>
          {renderReadOnlySection('Research and Publication Ethics', thesis.courseworkDetails?.researchEthics || [])}
          {renderReadOnlySection('Research Methodology', thesis.courseworkDetails?.researchMethodology || [])}
          {renderReadOnlySection('Discipline-Specific Elective Course', thesis.courseworkDetails?.elective || [])}
          {thesis.courseworkDetails?.others?.length > 0 && renderReadOnlySection('Others', thesis.courseworkDetails?.others || [])}
          
          {thesis.courseworkUploadProof && (
            <div style={{ marginTop: 20, padding: '12px 16px', background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>Upload Proof:</span>
              <a 
                href={`${API_BASE_URL}${thesis.courseworkUploadProof}`} 
                target="_blank" 
                rel="noreferrer" 
                style={{ fontSize: '0.85rem', fontWeight: 800, color: '#2563EB', textDecoration: 'underline' }}
              >
                View Uploaded Proof
              </a>
            </div>
          )}

          <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#6B7280', fontSize: '0.85rem', background: '#F9FAFB', padding: 12, borderRadius: 8 }}>
            <Lock size={16} /> Coursework details are locked while approval is pending.
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {renderEditableSection('Research and Publication Ethics', 'researchEthics', researchEthics)}
          {renderEditableSection('Research Methodology', 'researchMethodology', researchMethodology)}
          {renderEditableSection('Discipline-Specific Elective Course', 'elective', elective)}
          {renderEditableSection('Others (Optional)', 'others', others)}

          <div style={{ marginTop: 24, padding: 20, background: '#F8FAFC', borderRadius: 16, border: '2px dashed #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <label style={{ display: 'block', fontSize: '0.95rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>Upload Proof *</label>
            <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block' }}>
              <button 
                type="button" 
                style={{ 
                  background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                  color: 'white',
                  padding: '8px 20px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)'
                }}
              >
                📁 {proofFile ? 'Change File' : 'Select Proof Document'}
              </button>
              <input 
                type="file" 
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setProofFile(e.target.files[0])}
                required={!thesis.courseworkUploadProof}
                style={{ 
                  position: 'absolute', 
                  fontSize: '100px', 
                  opacity: 0, 
                  right: 0, 
                  top: 0, 
                  cursor: 'pointer' 
                }}
              />
            </div>
            {proofFile && (
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#059669', background: '#ECFDF5', padding: '4px 12px', borderRadius: '12px' }}>
                Selected: {proofFile.name} ({(proofFile.size / 1024 / 1024).toFixed(2)} MB)
              </div>
            )}
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748B', textAlign: 'center' }}>
              Please upload documentary proof such as the official gazette notification of results or marksheets.
            </p>
            {thesis.courseworkUploadProof && (
              <div style={{ marginTop: 4, fontSize: '0.8rem', color: '#475569' }}>
                Existing proof: <a href={`${API_BASE_URL}${thesis.courseworkUploadProof}`} target="_blank" rel="noreferrer" style={{ color: '#2563EB', fontWeight: 700, textDecoration: 'underline' }}>View uploaded file</a>
              </div>
            )}
          </div>

          <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', fontSize: '0.95rem' }}
            >
              {loading ? 'Submitting...' : '✓ Submit Coursework Details'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

// ── Synopsis Phase ──
const SynopsisPhase = ({ thesis, milestones, onSubmit }) => {
  const synopsisMilestone = milestones.find(m => m.type === 'SYNOPSIS');
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState(thesis.title || '');
  const [abstract, setAbstract] = useState(thesis.abstract || '');
  const [loading, setLoading] = useState(false);
  const [drcMeetings, setDrcMeetings] = useState([]);

  useEffect(() => {
    if (synopsisMilestone && synopsisMilestone.status === 'APPROVED') {
      axios.get(`${API}/lifecycle/drc/thesis/${thesis._id}`, getAuthHeader())
        .then(res => setDrcMeetings(res.data))
        .catch(() => {});
    }
  }, [thesis._id, synopsisMilestone]);

  if (!synopsisMilestone) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 32, color: '#6b7280' }}>
        ⏳ Generating synopsis milestone... Please refresh.
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return toast.warning('Please select a synopsis document');
    if (!title.trim()) return toast.warning('Please enter your finalized research title');
    if (!abstract.trim()) return toast.warning('Please enter your finalized research abstract');
    setLoading(true);
    try {
      await onSubmit(synopsisMilestone._id, file, title, abstract);
      toast.success('Synopsis and finalized research outline submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 className="card-title">Synopsis Submission</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Current status info banner */}
        {(() => {
          let bg = '#F3F4F6';
          let border = '#E2E8F0';
          let color = '#4B5563';
          let label = 'Awaiting Synopsis';

          if (synopsisMilestone.status === 'PENDING') {
            bg = '#FFFBEB';
            border = '#FDE68A';
            color = '#D97706';
            label = 'Synopsis Upload Unlocked';
          } else if (synopsisMilestone.status === 'SUBMITTED') {
            bg = '#EFF6FF';
            border = '#BFDBFE';
            color = '#2563EB';
            label = 'Synopsis Submitted & Under Review';
          } else if (synopsisMilestone.status === 'PENDING_HOD') {
            bg = '#FFFBEB';
            border = '#FDE68A';
            color = '#D97706';
            label = 'Pending HOD Approval & DRC Pending';
          } else if (synopsisMilestone.status === 'APPROVED') {
            if (thesis.status === 'SYNOPSIS_PENDING') {
              bg = '#FFFBEB';
              border = '#FDE68A';
              color = '#D97706';
              label = 'Synopsis Approved (DRC Pending at HOD)';
            } else {
              bg = '#ECFDF5';
              border = '#A7F3D0';
              color = '#059669';
              label = 'Approved & Verified';
            }
          } else if (synopsisMilestone.status === 'REVISION_REQUIRED') {
            bg = '#FEF2F2';
            border = '#FCA5A5';
            color = '#DC2626';
            label = 'Correction Needed';
          }

          return (
            <div style={{ background: bg, border: `1px solid ${border}`, padding: 16, borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: '#1E293B' }}>Current Lifecycle Status:</span>
                <span style={{ fontWeight: 800, color: color, textTransform: 'uppercase' }}>
                  {label}
                </span>
              </div>
              {synopsisMilestone.comments?.length > 0 && (
                <div style={{ marginTop: 12, padding: 12, background: 'rgba(255, 255, 255, 0.7)', borderRadius: 6 }}>
                  <div style={{ fontWeight: 600, color: '#991B1B', marginBottom: 4 }}>Faculty Feedback / Directives:</div>
                  {synopsisMilestone.comments.map((c, idx) => (
                    <div key={idx} style={{ fontSize: '0.85rem', color: '#7F1D1D', fontStyle: 'italic', marginBottom: 2 }}>
                      "{c.text}" — {c.authorName}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* Synopsis submission form */}
        {synopsisMilestone.status === 'PENDING' || synopsisMilestone.status === 'REVISION_REQUIRED' ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>Finalized Thesis Title *</label>
              <input type="text" className="form-input" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Update or finalize your research title" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>Finalized Research Abstract *</label>
              <textarea className="form-input" value={abstract} onChange={e => setAbstract(e.target.value)} required rows="5" placeholder="Provide a detailed finalized abstract summarizing methodology and expected contributions." />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>Synopsis Document (PDF/Word) *</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 4 }}>
                <label 
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: 8, 
                    padding: '8px 16px', 
                    background: '#F1F5F9', 
                    color: '#475569', 
                    border: '1px solid #CBD5E1', 
                    borderRadius: 8, 
                    cursor: 'pointer', 
                    fontSize: '0.85rem', 
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = '#E2E8F0'; }}
                  onMouseOut={e => { e.currentTarget.style.background = '#F1F5F9'; }}
                >
                  <Upload size={16} />
                  {file ? file.name : 'Choose file...'}
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx" 
                    onChange={e => setFile(e.target.files[0])} 
                    style={{ display: 'none' }} 
                    required 
                  />
                </label>
                {file && (
                  <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>
                    Selected ✓
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.75rem', color: '#6B7280', marginTop: 6 }}>Please ensure your document includes introduction, literature survey, proposed methodology, and references.</p>
            </div>
            
            <div style={{ background: '#F3F4F6', borderRadius: 8, padding: 12, fontSize: '0.8rem', color: '#4B5563' }}>
              ℹ️ <strong>Ph.D. Regulation Notice:</strong> Your synopsis will be automatically run through Turnitin/URKUND for plagiarism checks. Ensure similarity is strictly below 10% before submitting.
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ alignSelf: 'flex-start', padding: '8px 20px' }}>
              {loading ? 'Submitting...' : 'Submit Research Synopsis'}
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#F9FAFB', padding: 16, borderRadius: 8, color: '#374151' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#4B5563', marginBottom: 4 }}>RESEARCH ABSTRACT</div>
              <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>{thesis.abstract}</div>
              {synopsisMilestone.documentUrl && (
                <a href={`${API_BASE_URL}${synopsisMilestone.documentUrl}`} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 12, color: '#0284C7', fontWeight: 600 }}>View Submitted Synopsis</a>
              )}
            </div>

            {synopsisMilestone.status === 'APPROVED' && (
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 16, borderRadius: 10 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1E293B', marginBottom: 8 }}>
                  📆 Departmental Research Committee (DRC) Review
                </div>
                {drcMeetings.length === 0 ? (
                  <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: '1.1rem' }}>⏳</span>
                    <span>Synopsis approved by your supervisor! HOD will schedule the official DRC meeting for final evaluation shortly.</span>
                  </div>
                ) : (
                  drcMeetings.map(drc => (
                    <div key={drc._id} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0F172A' }}>DRC Session Schedule</span>
                        <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700, background: drc.status === 'APPROVED' ? '#D1FAE5' : drc.status === 'REVISION_REQUIRED' ? '#FEE2E2' : '#FEF3C7', color: drc.status === 'APPROVED' ? '#065F46' : drc.status === 'REVISION_REQUIRED' ? '#991B1B' : '#92400E' }}>
                          {drc.status}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: '0.8rem', color: '#475569' }}>
                        <div><strong>Date:</strong> {new Date(drc.scheduledDate).toLocaleDateString()}</div>
                        <div><strong>Time:</strong> {drc.scheduledTime}</div>
                        <div style={{ gridColumn: 'span 2' }}><strong>Venue:</strong> {drc.venue}</div>
                        {drc.committeeMembers && <div style={{ gridColumn: 'span 2' }}><strong>Committee:</strong> {drc.committeeMembers}</div>}
                        {drc.agenda && <div style={{ gridColumn: 'span 2' }}><strong>Agenda:</strong> {drc.agenda}</div>}
                        {drc.remarks && <div style={{ gridColumn: 'span 2', background: '#FFFBEB', padding: 6, borderRadius: 6, color: '#92400E', borderLeft: '3px solid #F59E0B', marginTop: 4 }}><strong>Committee Feedback:</strong> {drc.remarks}</div>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Milestone Upload Card ──
const MilestoneCard = ({ milestone, onSubmit, isLocked }) => {
  const toast = useToast();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const statusColor = { PENDING: '#D97706', SUBMITTED: '#3B82F6', APPROVED: '#059669', REVISION_REQUIRED: '#DC2626' };
  const statusBg = { PENDING: '#FEF3C7', SUBMITTED: '#DBEAFE', APPROVED: '#D1FAE5', REVISION_REQUIRED: '#FEE2E2' };

  const handleSubmit = async () => {
    if (!file) return toast.warning('Please select a file');
    setLoading(true);
    try { await onSubmit(milestone._id, file); setFile(null); }
    catch (e) { toast.error(e.response?.data?.message || 'Upload failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 700, color: '#111827' }}>{milestone.title}</div>
          <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 4 }}>Type: {milestone.type}</div>
          {milestone.dueDate && <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>Due: {new Date(milestone.dueDate).toLocaleDateString()}</div>}
        </div>
        <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600, background: statusBg[milestone.status], color: statusColor[milestone.status] }}>
          {milestone.status}
        </span>
      </div>

      {milestone.comments?.length > 0 && (
        <div style={{ marginTop: 12, padding: 10, background: '#FEF3C7', borderRadius: 8 }}>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#92400E', marginBottom: 4 }}>Supervisor Feedback:</div>
          {milestone.comments.map((c, i) => <div key={i} style={{ fontSize: '0.85rem', color: '#78350F' }}>"{c.text}" — {c.authorName}</div>)}
        </div>
      )}

      {!isLocked && (milestone.status === 'PENDING' || milestone.status === 'REVISION_REQUIRED') && (
        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="file" accept=".pdf,.doc,.docx" onChange={e => setFile(e.target.files[0])} style={{ flex: 1, fontSize: '0.85rem' }} />
          <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ padding: '6px 16px' }}>
            <Upload size={14} style={{ marginRight: 4 }} />{loading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      )}
      {milestone.documentUrl && (
        <div style={{ marginTop: 8 }}>
          <a href={`${API_BASE_URL}${milestone.documentUrl}`} target="_blank" rel="noreferrer" style={{ color: '#10B981', fontSize: '0.85rem' }}>📄 View Submitted Document</a>
        </div>
      )}
    </div>
  );
};

// ── Active Research Phase ──
const ActiveResearch = ({ thesis, milestones, onSubmit, setActiveTab }) => {
  const reports = milestones.filter(m => m.type === '6_MONTH_REPORT' || m.type === 'PROGRESS_REPORT');
  const approvedCount = reports.filter(r => r.status === 'APPROVED').length;
  const submittedCount = reports.filter(r => r.status === 'SUBMITTED').length;
  const pendingCount = reports.filter(r => r.status === 'PENDING' || r.status === 'REVISION_REQUIRED').length;

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="card-title">Research Timeline</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
          {[{ label: 'Start Date', value: thesis.startDate ? new Date(thesis.startDate).toLocaleDateString() : 'N/A' },
            { label: 'Supervisor', value: thesis.supervisorId?.name || 'N/A' },
            { label: 'Department', value: thesis.department }].map(({ label, value }) => (
            <div key={label} style={{ background: '#F0FDF4', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{label}</div>
              <div style={{ fontWeight: 600, color: '#111827' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Reports Summary */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          📊 6-Month Progress Reports
        </h3>
        <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: 20, lineHeight: 1.5 }}>
          Your periodic 6-month progress reports are managed in the dedicated <strong>6-Month Reports</strong> section. Below is a summary of your current progress.
        </p>

        {reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: '#64748B', background: '#F8FAFC', borderRadius: 12 }}>
            ⏳ No progress report milestones assigned yet. They will be auto-generated based on your research timeline.
          </div>
        ) : (
          <div>
            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
              <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: 16, borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#065F46' }}>{approvedCount}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#065F46' }}>Approved</div>
              </div>
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: 16, borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1D4ED8' }}>{submittedCount}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1D4ED8' }}>Under Review</div>
              </div>
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: 16, borderRadius: 12, textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#D97706' }}>{pendingCount}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#D97706' }}>Pending</div>
              </div>
            </div>

            {/* Report List Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {reports.map(r => {
                const statusColors = {
                  APPROVED: { bg: '#D1FAE5', color: '#065F46' },
                  SUBMITTED: { bg: '#DBEAFE', color: '#1D4ED8' },
                  PENDING: { bg: '#FEF3C7', color: '#D97706' },
                  REVISION_REQUIRED: { bg: '#FEE2E2', color: '#991B1B' }
                };
                const sc = statusColors[r.status] || statusColors.PENDING;
                return (
                  <div key={r._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1E293B' }}>{r.title}</div>
                      {r.dueDate && <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 2 }}>Due: {new Date(r.dueDate).toLocaleDateString()}</div>}
                    </div>
                    <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700, background: sc.bg, color: sc.color }}>
                      {r.status === 'REVISION_REQUIRED' ? 'REVISION' : r.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigate to 6-Month Reports */}
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => setActiveTab('sixMonthReports')}
            className="btn-primary"
            style={{ background: '#133A26', padding: '10px 24px', fontSize: '0.85rem', display: 'flex', gap: 8, alignItems: 'center', borderRadius: 10 }}
          >
            📄 Go to 6-Month Reports to Submit
          </button>
        </div>
      </div>

      {/* Synopsis milestone if present */}
      {milestones.filter(m => m.type === 'SYNOPSIS').map(m => (
        <div key={m._id} className="card" style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 700, color: '#111827' }}>{m.title}</div>
              <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 4 }}>Type: {m.type}</div>
            </div>
            <span style={{ padding: '4px 10px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600, background: '#D1FAE5', color: '#059669' }}>
              {m.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Pre-Submission Phase ──
const PreSubmission = ({ thesis, milestones = [], onSubmit, user }) => {
  const toast = useToast();
  const preMilestone = milestones.find(m => m.type === 'PRE_SUBMISSION');
  const finalMilestone = milestones.find(m => m.type === 'FINAL_SUBMISSION');
  
  const [fileThesis, setFileThesis] = useState(null);
  const [filePlagiarism, setFilePlagiarism] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [fileFinalThesis, setFileFinalThesis] = useState(null);
  const [submittingFinal, setSubmittingFinal] = useState(false);

  // States for pre-submission eligibility checklist
  const [pubs, setPubs] = useState([]);
  const [fetchingChecklist, setFetchingChecklist] = useState(false);

  useEffect(() => {
    if (!preMilestone && thesis?._id) {
      setFetchingChecklist(true);
      axios.get(`${API}/publications/thesis/${thesis._id}`, getAuthHeader())
        .then(res => setPubs(res.data))
        .catch(() => {})
        .finally(() => setFetchingChecklist(false));
    }
  }, [preMilestone, thesis?._id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fileThesis) return toast.warning('Please upload the rough thesis PDF.');
    if (!filePlagiarism) return toast.warning('Please upload the plagiarism clearance certificate PDF.');

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('document', fileThesis);
      formData.append('plagiarism', filePlagiarism);

      await axios.post(`${API_URL}/milestones/${preMilestone._id}/submit`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Pre-Submission package submitted successfully!');
      setFileThesis(null);
      setFilePlagiarism(null);
      if (onSubmit) await onSubmit();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error submitting package.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (!fileFinalThesis) return toast.warning('Please upload your final thesis PDF.');
    if (!finalMilestone) return toast.error('Final submission milestone not found.');

    setSubmittingFinal(true);
    try {
      const formData = new FormData();
      formData.append('document', fileFinalThesis);

      await axios.post(`${API_URL}/milestones/${finalMilestone._id}/submit`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Final Ph.D. thesis uploaded successfully! Awaiting supervisor digital sign-off.');
      setFileFinalThesis(null);
      if (onSubmit) await onSubmit();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error uploading final thesis.');
    } finally {
      setSubmittingFinal(false);
    }
  };

  const semStatus = thesis.preSubmissionSeminar?.status || 'NOT_SCHEDULED';
  const isPending = preMilestone?.status === 'PENDING';
  const isRevision = preMilestone?.status === 'REVISION_REQUIRED';
  const isSubmitted = preMilestone?.status === 'SUBMITTED' || preMilestone?.status === 'PENDING_HOD';
  const isApproved = preMilestone?.status === 'APPROVED';

  // Checklist verification calculations
  const scholar = user || {};
  const hasMphil = scholar.profile?.qualifications?.mphil?.done === true && scholar.isVerified === true;
  const requiredMonths = hasMphil ? 18 : 36;
  const admissionDate = scholar.profile?.admissionDate ? new Date(scholar.profile.admissionDate) : null;
  const referenceDate = admissionDate && !isNaN(admissionDate.getTime()) ? admissionDate : (thesis.startDate ? new Date(thesis.startDate) : new Date());
  const diffMs = new Date() - referenceDate;
  const diffMonths = Math.max(0, diffMs / (1000 * 60 * 60 * 24 * 30.4375));
  const timeCleared = diffMonths >= requiredMonths;

  const reports = milestones.filter(m => m.type === '6_MONTH_REPORT' || m.type === 'PROGRESS_REPORT') || [];
  const approvedReports = reports.filter(r => r.status === 'APPROVED').length;
  const requiredReportsCount = hasMphil ? 3 : 6;
  const reportsCleared = approvedReports >= requiredReportsCount;

  const journals = pubs.filter(p => p.type === 'JOURNAL' && p.status === 'VERIFIED').length;
  const conferences = pubs.filter(p => p.type === 'CONFERENCE' && p.status === 'VERIFIED').length;
  const pubsCleared = journals >= 2 && conferences >= 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Overview Banner */}
      <div className="card" style={{ 
        padding: 24, 
        borderRadius: 16, 
        background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.08) 0%, rgba(249, 115, 22, 0.03) 100%)', 
        border: '1px solid rgba(234, 88, 12, 0.15)' 
      }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 800, color: 'var(--color-text, #0F172A)', display: 'flex', alignItems: 'center', gap: 8 }}>
          🎓 Pre-Submission Colloquium & Thesis Defense
        </h4>
        <p style={{ color: 'var(--color-text-secondary, #475569)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
          The Pre-Submission phase requires you to upload your rough thesis draft and Turnitin plagiarism clearance report for Supervisor and HOD evaluation. 
          Upon successful draft verification, HOD will schedule your Pre-Submission Seminar. Once cleared, you will proceed to the final submission.
        </p>
      </div>

      {/* 1. Prerequisites Check (If preMilestone not generated) */}
      {!preMilestone && (
        <div className="card" style={{ borderLeft: '4px solid #EF4444' }}>
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#DC2626' }}>
            🔒 Pre-Submission Prerequisites Locked
          </h3>
          <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: 16 }}>
            You must satisfy the following research timeline, progress report, and publication criteria to unlock rough draft submission:
          </p>

          {fetchingChecklist ? (
            <div style={{ padding: 12, color: '#64748B', fontSize: '0.85rem' }}>⏳ Checking eligibility criteria...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Research Duration */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: timeCleared ? '#ECFDF5' : '#FEF2F2', borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: timeCleared ? '#065F46' : '#991B1B' }}>Research Time Elapsed</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>Required: {requiredMonths} months ({hasMphil ? 'M.Phil Holder' : 'Regular Ph.D.'}) | Current: {diffMonths.toFixed(1)} months</div>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: timeCleared ? '#059669' : '#DC2626' }}>{timeCleared ? '✓ Cleared' : '⏳ Pending'}</span>
              </div>

              {/* Progress Reports */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: reportsCleared ? '#ECFDF5' : '#FEF2F2', borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: reportsCleared ? '#065F46' : '#991B1B' }}>Approved Progress Reports</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>Required: {requiredReportsCount} approved reports | Current: {approvedReports} approved</div>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: reportsCleared ? '#059669' : '#DC2626' }}>{reportsCleared ? '✓ Cleared' : '⏳ Pending'}</span>
              </div>

              {/* Research Outputs */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: pubsCleared ? '#ECFDF5' : '#FEF2F2', borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: pubsCleared ? '#065F46' : '#991B1B' }}>Research Publications</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>Required: 2 verified journals & 2 verified conferences | Current: {journals} journals, {conferences} conferences</div>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: pubsCleared ? '#059669' : '#DC2626' }}>{pubsCleared ? '✓ Cleared' : '⏳ Pending'}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Draft submission form (Rough Thesis Draft + Plagiarism Certificate) */}
      {preMilestone && (isPending || isRevision) && (
        <div className="card" style={{
          padding: '28px',
          borderRadius: '20px',
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: '0 8px 32px rgba(15, 23, 42, 0.04)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Subtle background glow */}
          <div style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(234, 88, 12, 0.08) 0%, rgba(234, 88, 12, 0) 70%)',
            pointerEvents: 'none'
          }} />

          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📤</span> Submit Rough Thesis Draft & Plagiarism Report
          </h3>
          {isRevision && (
            <div style={{ padding: 14, background: '#FEE2E2', borderLeft: '4px solid #EF4444', borderRadius: 8, color: '#991B1B', fontSize: '0.85rem', marginBottom: 16 }}>
              <strong>⚠️ Revision Required:</strong>
              <div style={{ marginTop: 4 }}>
                {preMilestone.comments?.length > 0
                  ? `"${preMilestone.comments[preMilestone.comments.length - 1].text}" — ${preMilestone.comments[preMilestone.comments.length - 1].authorName}`
                  : 'Supervisor/HOD has requested corrections.'}
              </div>
            </div>
          )}
          <p style={{ color: 'var(--color-text-secondary, #64748B)', fontSize: '0.85rem', marginBottom: 20 }}>
            Please upload your complete rough thesis draft and Turnitin plagiarism clearance report. Once submitted, your Supervisor and HOD will review them.
          </p>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '4px' }}>
              {/* File 1: Rough Thesis Draft */}
              <div 
                style={{
                  border: fileThesis ? '2px solid rgba(16, 185, 129, 0.4)' : '2px dashed rgba(234, 88, 12, 0.25)',
                  borderRadius: '16px',
                  padding: '30px 20px',
                  textAlign: 'center',
                  background: fileThesis 
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)' 
                    : 'linear-gradient(135deg, rgba(234, 88, 12, 0.03) 0%, rgba(255, 255, 255, 0) 100%)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.01)',
                  backdropFilter: 'blur(8px)',
                }}
                onClick={() => document.getElementById('thesis-file-input').click()}
                onMouseEnter={e => {
                  if (!fileThesis) {
                    e.currentTarget.style.borderColor = '#EA580C';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(234, 88, 12, 0.06)';
                  }
                }}
                onMouseLeave={e => {
                  if (!fileThesis) {
                    e.currentTarget.style.borderColor = 'rgba(234, 88, 12, 0.25)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.01)';
                  }
                }}
              >
                <input 
                  id="thesis-file-input"
                  type="file" 
                  accept=".pdf" 
                  onChange={e => setFileThesis(e.target.files[0])} 
                  style={{ display: 'none' }} 
                  required={!fileThesis}
                />
                
                {fileThesis ? (
                  <>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: '#ECFDF5',
                      color: '#10B981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 10px rgba(16, 185, 129, 0.15)'
                    }}>
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {fileThesis.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: '2px' }}>
                        {(fileThesis.size / (1024 * 1024)).toFixed(2)} MB • PDF Document
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setFileThesis(null);
                        document.getElementById('thesis-file-input').value = '';
                      }}
                      style={{
                        padding: '4px 10px',
                        background: '#FEF2F2',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#EF4444',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                      onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}
                    >
                      <X size={12} /> Remove
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: '#FFF7ED',
                      color: '#EA580C',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 10px rgba(234, 88, 12, 0.08)'
                    }}>
                      <Upload size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1F2937' }}>Rough Thesis Draft (PDF) *</div>
                      <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: '6px', lineHeight: 1.4 }}>
                        Click to browse or drag file here<br />Required for supervisor review
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* File 2: Plagiarism Clearance Report */}
              <div 
                style={{
                  border: filePlagiarism ? '2px solid rgba(16, 185, 129, 0.4)' : '2px dashed rgba(234, 88, 12, 0.25)',
                  borderRadius: '16px',
                  padding: '30px 20px',
                  textAlign: 'center',
                  background: filePlagiarism 
                    ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(16, 185, 129, 0.02) 100%)' 
                    : 'linear-gradient(135deg, rgba(234, 88, 12, 0.03) 0%, rgba(255, 255, 255, 0) 100%)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.01)',
                  backdropFilter: 'blur(8px)',
                }}
                onClick={() => document.getElementById('plagiarism-file-input').click()}
                onMouseEnter={e => {
                  if (!filePlagiarism) {
                    e.currentTarget.style.borderColor = '#EA580C';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(234, 88, 12, 0.06)';
                  }
                }}
                onMouseLeave={e => {
                  if (!filePlagiarism) {
                    e.currentTarget.style.borderColor = 'rgba(234, 88, 12, 0.25)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.01)';
                  }
                }}
              >
                <input 
                  id="plagiarism-file-input"
                  type="file" 
                  accept=".pdf" 
                  onChange={e => setFilePlagiarism(e.target.files[0])} 
                  style={{ display: 'none' }} 
                  required={!filePlagiarism}
                />
                
                {filePlagiarism ? (
                  <>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: '#ECFDF5',
                      color: '#10B981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 10px rgba(16, 185, 129, 0.15)'
                    }}>
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {filePlagiarism.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: '2px' }}>
                        {(filePlagiarism.size / (1024 * 1024)).toFixed(2)} MB • PDF Document
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setFilePlagiarism(null);
                        document.getElementById('plagiarism-file-input').value = '';
                      }}
                      style={{
                        padding: '4px 10px',
                        background: '#FEF2F2',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#EF4444',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                      onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}
                    >
                      <X size={12} /> Remove
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: '#FFF7ED',
                      color: '#EA580C',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 10px rgba(234, 88, 12, 0.08)'
                    }}>
                      <Upload size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1F2937' }}>Plagiarism Report (PDF) *</div>
                      <div style={{ fontSize: '0.72rem', color: '#6B7280', marginTop: '6px', lineHeight: 1.4 }}>
                        Click to browse or drag file here<br />Official Turnitin certificate
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button 
                type="submit" 
                disabled={submitting} 
                style={{
                  background: submitting 
                    ? 'var(--color-neutral-300, #CBD5E1)' 
                    : 'linear-gradient(135deg, #FF6B35 0%, #EA580C 100%)',
                  color: '#FFFFFF',
                  padding: '12px 28px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  boxShadow: submitting 
                    ? 'none' 
                    : '0 4px 14px rgba(234, 88, 12, 0.3), inset 0 -2px 0 rgba(0,0,0,0.1)',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  outline: 'none',
                }}
                onMouseEnter={e => {
                  if (!submitting) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(234, 88, 12, 0.4), inset 0 -2px 0 rgba(0,0,0,0.1)';
                  }
                }}
                onMouseLeave={e => {
                  if (!submitting) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(234, 88, 12, 0.3), inset 0 -2px 0 rgba(0,0,0,0.1)';
                  }
                }}
                onMouseDown={e => {
                  if (!submitting) {
                    e.currentTarget.style.transform = 'translateY(1px)';
                  }
                }}
                onMouseUp={e => {
                  if (!submitting) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
              >
                <Upload size={16} />
                {submitting ? 'Uploading Package...' : 'Upload & Submit Pre-Submission Package'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Draft Submitted & Awaiting Review */}
      {preMilestone && isSubmitted && (
        <div className="card">
          <h3 className="card-title">⏳ Draft Under Evaluation</h3>
          <div style={{ textAlign: 'center', padding: '24px 16px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, color: '#1E40AF', marginBottom: 16 }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>⏳</div>
            <h4 style={{ margin: '0 0 6px 0', fontWeight: 700 }}>Draft Submitted Successfully</h4>
            <p style={{ fontSize: '0.85rem', margin: 0, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.4 }}>
              Your rough draft thesis and plagiarism report are under review. Faculty Supervisor must verify them first, followed by HOD final sign-off.
            </p>
          </div>
          <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 14, border: '1px solid #E2E8F0', fontSize: '0.85rem' }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Uploaded Files:</div>
            {preMilestone.documentUrl && (
              <div style={{ marginBottom: 6 }}>
                <a href={`${API_BASE_URL}${preMilestone.documentUrl}`} target="_blank" rel="noreferrer" style={{ color: '#EA580C', textDecoration: 'underline', fontWeight: 600 }}>
                  📄 Rough Thesis Draft
                </a>
              </div>
            )}
            {preMilestone.plagiarismReportUrl && (
              <div>
                <a href={`${API_BASE_URL}${preMilestone.plagiarismReportUrl}`} target="_blank" rel="noreferrer" style={{ color: '#EA580C', textDecoration: 'underline', fontWeight: 600 }}>
                  📄 Plagiarism Clearance Report
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Draft Approved & Awaiting Seminar Schedule */}
      {preMilestone && isApproved && semStatus === 'NOT_SCHEDULED' && (
        <div className="card">
          <h3 className="card-title">📅 Seminar Scheduling Pending</h3>
          <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#065F46', fontWeight: 800 }}>
              ✅ Thesis Draft & Plagiarism Certificate Approved
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#065F46', margin: 0, lineHeight: 1.5 }}>
              Your complete rough thesis draft and Turnitin report have been approved by both the Faculty Supervisor and HOD. 
              The HOD of the department has been notified to schedule your Pre-Submission Seminar defense colloquium.
            </p>
          </div>
          <div style={{ background: '#F8FAFC', borderRadius: 8, padding: 14, border: '1px solid #E2E8F0', fontSize: '0.85rem' }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>Approved Files:</div>
            {preMilestone.documentUrl && (
              <div style={{ marginBottom: 6 }}>
                <a href={`${API_BASE_URL}${preMilestone.documentUrl}`} target="_blank" rel="noreferrer" style={{ color: '#10B981', textDecoration: 'underline', fontWeight: 600 }}>
                  📄 Approved Thesis Draft
                </a>
              </div>
            )}
            {preMilestone.plagiarismReportUrl && (
              <div>
                <a href={`${API_BASE_URL}${preMilestone.plagiarismReportUrl}`} target="_blank" rel="noreferrer" style={{ color: '#10B981', textDecoration: 'underline', fontWeight: 600 }}>
                  📄 Approved Plagiarism Clearance Certificate
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. Seminar Scheduled */}
      {semStatus === 'SCHEDULED' && (
        <div className="card">
          <h3 className="card-title">📆 Pre-Submission Seminar Confirmed</h3>
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#92400E', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>📆</span> Seminar Schedule Details:
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.85rem', color: '#78350F' }}>
              <div><strong>Date:</strong> {thesis.preSubmissionSeminar.scheduledDate ? new Date(thesis.preSubmissionSeminar.scheduledDate).toLocaleDateString() : 'TBD'}</div>
              <div><strong>Time:</strong> {thesis.preSubmissionSeminar.scheduledTime || 'TBD'}</div>
              <div style={{ gridColumn: 'span 2' }}><strong>Venue:</strong> {thesis.preSubmissionSeminar.venue || 'TBD'}</div>
              <div style={{ gridColumn: 'span 2' }}><strong>Committee/Panel:</strong> {thesis.preSubmissionSeminar.committeeMembers || 'TBD'}</div>
              {thesis.preSubmissionSeminar.remarks && <div style={{ gridColumn: 'span 2', background: 'white', padding: 10, borderRadius: 6, border: '1px solid #FCD34D', marginTop: 6 }}><strong>Remarks:</strong> {thesis.preSubmissionSeminar.remarks}</div>}
            </div>
            <div style={{ marginTop: 16, fontSize: '0.8rem', color: '#92400E', fontStyle: 'italic', borderTop: '1px solid #FDE68A', paddingTop: 10 }}>
              * Please attend the seminar defense offline at the scheduled time. The outcome clearance will be recorded in this portal by the HOD.
            </div>
          </div>
        </div>
      )}

      {/* 6. Seminar Uncleared */}
      {semStatus === 'UNCLEARED' && (
        <div className="card">
          <h3 className="card-title" style={{ color: '#DC2626' }}>⚠️ Seminar Outcome: Uncleared</h3>
          <div style={{ padding: 14, background: '#FEE2E2', borderLeft: '4px solid #EF4444', borderRadius: 8, color: '#991B1B', fontSize: '0.85rem', marginBottom: 16 }}>
            <strong>⚠️ Seminar Defense Evaluated as Unsatisfactory</strong>
            <div style={{ marginTop: 4 }}><strong>HOD Feedback Remarks:</strong> {thesis.preSubmissionSeminar.outcomeRemarks || 'None'}</div>
            <div style={{ marginTop: 6, color: '#7F1D1D' }}>Please discuss the corrections with your supervisor. HOD will reschedule the seminar defense in this portal once ready.</div>
          </div>
        </div>
      )}

      {/* 7. Seminar Cleared -> Notification */}
      {semStatus === 'CLEARED' && (
        <div className="card">
          <h3 className="card-title" style={{ color: '#059669' }}>🎉 Seminar Outcome: Cleared</h3>
          <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 12, padding: 20 }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#065F46', fontWeight: 800 }}>
              🎉 Pre-Submission Seminar Successfully Cleared!
            </h4>
            <p style={{ fontSize: '0.85rem', color: '#065F46', margin: 0, lineHeight: 1.5 }}>
              Your seminar colloquium has been evaluated as satisfactory. You have transitioned to the next phase: <strong>Thesis Submission</strong>.
            </p>
            <p style={{ fontSize: '0.85rem', color: '#065F46', margin: '8px 0 0 0', lineHeight: 1.5 }}>
              Please navigate to the <strong>Final Submission</strong> tab in the sidebar to upload your final bound thesis document.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Final Thesis Submission Phase ──
const FinalSubmission = ({ thesis, milestones = [], onSubmit, user }) => {
  const toast = useToast();
  const finalMilestone = milestones.find(m => m.type === 'FINAL_SUBMISSION');
  const [fileFinalThesis, setFileFinalThesis] = useState(null);
  const [submittingFinal, setSubmittingFinal] = useState(false);

  if (!finalMilestone) {
    return (
      <div className="card" style={{ padding: 24, textAlign: 'center', color: '#64748B' }}>
        ⏳ Final bound thesis submission is locked. You must clear the Pre-Submission Seminar first.
      </div>
    );
  }

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (!fileFinalThesis) return toast.warning('Please upload your final thesis PDF.');

    setSubmittingFinal(true);
    try {
      const formData = new FormData();
      formData.append('document', fileFinalThesis);

      await axios.post(`${API_URL}/milestones/${finalMilestone._id}/submit`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Final Ph.D. thesis uploaded successfully! Awaiting supervisor digital sign-off.');
      setFileFinalThesis(null);
      if (onSubmit) await onSubmit();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error uploading final thesis.');
    } finally {
      setSubmittingFinal(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card" style={{ 
        padding: 24, 
        borderRadius: 16, 
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(37, 99, 235, 0.03) 100%)', 
        border: '1px solid rgba(59, 130, 246, 0.15)' 
      }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 800, color: 'var(--color-text, #0F172A)', display: 'flex', alignItems: 'center', gap: 8 }}>
          📚 Final Submission and Defense
        </h4>
        <p style={{ color: 'var(--color-text-secondary, #475569)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
          This tab displays all activities related to your final bound thesis submission, supervisor and HOD sign-offs, external examiner reviews, and public viva-voce defense.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Step 1: Student Final Thesis Upload */}
        <div className="card" style={{ borderLeft: '4px solid #3B82F6', padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800 }}>Step 1: Student Final Thesis Upload</h4>
            <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700, background: finalMilestone.status === 'PENDING' ? '#FEF3C7' : '#D1FAE5', color: finalMilestone.status === 'PENDING' ? '#D97706' : '#065F46' }}>
              {finalMilestone.status === 'PENDING' ? 'Awaiting Upload' : 'Uploaded'}
            </span>
          </div>

          {(finalMilestone.status === 'PENDING' || finalMilestone.status === 'REVISION_REQUIRED') ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
              <p style={{ color: 'var(--color-text-secondary, #64748B)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
                Please compile and upload your absolute final, hard-bound equivalent Ph.D. thesis document here. Ensure that all corrections, suggestions, and feedback received from the expert panel during your offline defense colloquium are fully incorporated.
              </p>
              {finalMilestone.comments?.length > 0 && (
                <div style={{ padding: 10, background: '#FEF2F2', borderLeft: '3px solid #EF4444', borderRadius: 6, fontSize: '0.8rem', color: '#991B1B' }}>
                  <strong>Correction Required:</strong> "{finalMilestone.comments[finalMilestone.comments.length - 1].text}"
                </div>
              )}
              <form onSubmit={handleFinalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-secondary, #475569)', marginBottom: 6 }}>
                    Final Hard-Bound Equivalent Thesis (PDF format only) *
                  </label>
                  <input type="file" required accept=".pdf" className="form-input" onChange={e => setFileFinalThesis(e.target.files[0])} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                  <button type="submit" className="btn-primary" disabled={submittingFinal} style={{ background: '#EA580C', padding: '10px 24px', display: 'flex', gap: 8, alignItems: 'center' }}>
                    {submittingFinal ? 'Uploading Final Thesis...' : '🚀 Submit Final Thesis Package'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.82rem', marginTop: 8 }}>
              <div><strong>Uploaded On:</strong> {new Date(finalMilestone.submittedAt || finalMilestone.updatedAt).toLocaleString()}</div>
              {finalMilestone.documentUrl && (
                <div style={{ marginTop: 4 }}>
                  <a href={`${API_BASE_URL}${finalMilestone.documentUrl}`} target="_blank" rel="noreferrer" className="btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', fontSize: '0.75rem', color: '#EA580C', borderColor: '#FDBA74' }}>
                    📄 View Submitted Final Bound Thesis PDF
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Supervisor Digital Sign-off */}
        {finalMilestone.status !== 'PENDING' && (
          <div className="card" style={{ borderLeft: `4px solid ${['PENDING_HOD', 'APPROVED', 'SUBMITTED', 'AWARDED'].includes(finalMilestone.status) ? '#10B981' : finalMilestone.status === 'REVISION_REQUIRED' ? '#EF4444' : '#3B82F6'}`, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800 }}>Step 2: Supervisor Digital Sign-off</h4>
              <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700, background: ['PENDING_HOD', 'APPROVED', 'SUBMITTED', 'AWARDED'].includes(finalMilestone.status) ? '#D1FAE5' : finalMilestone.status === 'REVISION_REQUIRED' ? '#FEE2E2' : '#DBEAFE', color: ['PENDING_HOD', 'APPROVED', 'SUBMITTED', 'AWARDED'].includes(finalMilestone.status) ? '#065F46' : finalMilestone.status === 'REVISION_REQUIRED' ? '#991B1B' : '#1E40AF' }}>
                {['PENDING_HOD', 'APPROVED', 'SUBMITTED', 'AWARDED'].includes(finalMilestone.status) ? 'Approved' : finalMilestone.status === 'REVISION_REQUIRED' ? 'Corrections Requested' : 'Pending Approval'}
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: 6 }}>
              {finalMilestone.comments?.filter(c => c.text?.toLowerCase().includes('supervisor')).map((c, i) => (
                <div key={i} style={{ marginTop: 4 }}><strong>{c.authorName}:</strong> "{c.text}" <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>({new Date(c.createdAt).toLocaleDateString()})</span></div>
              )) || 'Awaiting supervisor signature review.'}
            </div>
          </div>
        )}

        {/* Step 3: HOD Final Digital Sign-off */}
        {finalMilestone.status !== 'PENDING' && ['PENDING_HOD', 'APPROVED', 'SUBMITTED', 'AWARDED'].includes(finalMilestone.status) && (
          <div className="card" style={{ borderLeft: `4px solid ${['APPROVED', 'SUBMITTED', 'AWARDED'].includes(finalMilestone.status) ? '#10B981' : '#3B82F6'}`, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800 }}>Step 3: HOD Final Digital Sign-off</h4>
              <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700, background: ['APPROVED', 'SUBMITTED', 'AWARDED'].includes(finalMilestone.status) ? '#D1FAE5' : '#DBEAFE', color: ['APPROVED', 'SUBMITTED', 'AWARDED'].includes(finalMilestone.status) ? '#065F46' : '#1E40AF' }}>
                {['APPROVED', 'SUBMITTED', 'AWARDED'].includes(finalMilestone.status) ? 'Approved' : 'Pending HOD Approval'}
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: 6 }}>
              {['APPROVED', 'SUBMITTED', 'AWARDED'].includes(finalMilestone.status) ? 'HOD digitally signed off final thesis package.' : 'Awaiting HOD final verification and clearance.'}
            </div>
          </div>
        )}

        {/* Step 4: Dispatch Tracking */}
        {finalMilestone.status !== 'PENDING' && ['APPROVED', 'SUBMITTED', 'AWARDED'].includes(finalMilestone.status) && (
          <div className="card" style={{ borderLeft: `4px solid ${thesis.dispatchDate ? '#10B981' : '#F59E0B'}`, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800 }}>Step 4: External Evaluation Dispatch Tracking</h4>
              <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700, background: thesis.dispatchDate ? '#D1FAE5' : '#FEF3C7', color: thesis.dispatchDate ? '#065F46' : '#92400E' }}>
                {thesis.dispatchDate ? 'Dispatched' : 'Awaiting Dispatch'}
              </span>
            </div>
            {thesis.dispatchDate ? (
              <div style={{ fontSize: '0.82rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', marginTop: 8 }}>
                <div><strong>Dispatch Date:</strong> {new Date(thesis.dispatchDate).toLocaleDateString()}</div>
                <div><strong>Method:</strong> {thesis.dispatchMethod}</div>
                <div style={{ gridColumn: 'span 2' }}><strong>Tracking Reference:</strong> {thesis.dispatchTrackingNumber || 'None'}</div>
              </div>
            ) : (
              <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: 6 }}>
                Your signed-off thesis is being prepared for dispatch to external evaluators by HOD/Academic Branch.
              </div>
            )}
          </div>
        )}

        {/* Step 5: External Evaluation Results */}
        {thesis.dispatchDate && (
          <div className="card" style={{ borderLeft: `4px solid ${thesis.externalEvaluationStatus === 'SUCCESSFUL' ? '#10B981' : thesis.externalEvaluationStatus === 'FAILED' ? '#EF4444' : '#F59E0B'}`, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800 }}>Step 5: External Examiner Evaluation Results</h4>
              <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700, background: thesis.externalEvaluationStatus === 'SUCCESSFUL' ? '#D1FAE5' : thesis.externalEvaluationStatus === 'FAILED' ? '#FEE2E2' : '#FEF3C7', color: thesis.externalEvaluationStatus === 'SUCCESSFUL' ? '#065F46' : thesis.externalEvaluationStatus === 'FAILED' ? '#991B1B' : '#92400E' }}>
                {thesis.externalEvaluationStatus === 'SUCCESSFUL' ? 'Successful' : thesis.externalEvaluationStatus === 'FAILED' ? 'Failed / Rejected' : 'Awaiting Reports'}
              </span>
            </div>
            {thesis.externalEvaluationStatus !== 'PENDING' ? (
              <div style={{ fontSize: '0.82rem', marginTop: 8 }}>
                <div><strong>Evaluation Concluded:</strong> {thesis.externalEvaluationLoggedAt ? new Date(thesis.externalEvaluationLoggedAt).toLocaleString() : 'N/A'}</div>
                {thesis.externalEvaluationRemarks && (
                  <div style={{ marginTop: 6, background: '#F8FAFC', padding: 8, borderRadius: 6, border: '1px solid #E2E8F0', fontStyle: 'italic' }}>
                    "{thesis.externalEvaluationRemarks}"
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: 6 }}>
                Awaiting evaluation reports from external examiners.
              </div>
            )}
          </div>
        )}

        {/* Step 6: Viva-Voce Oral Defense */}
        {thesis.externalEvaluationStatus === 'SUCCESSFUL' && (
          <div className="card" style={{ borderLeft: `4px solid ${thesis.vivaStatus === 'SUCCESSFUL' ? '#10B981' : thesis.vivaStatus === 'UNSUCCESSFUL' ? '#EF4444' : thesis.vivaStatus === 'SCHEDULED' ? '#3B82F6' : '#94A3B8'}`, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800 }}>Step 6: Viva-Voce oral defense colloquium</h4>
              <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700, background: thesis.vivaStatus === 'SUCCESSFUL' ? '#D1FAE5' : thesis.vivaStatus === 'UNSUCCESSFUL' ? '#FEE2E2' : thesis.vivaStatus === 'SCHEDULED' ? '#DBEAFE' : '#E2E8F0', color: thesis.vivaStatus === 'SUCCESSFUL' ? '#065F46' : thesis.vivaStatus === 'UNSUCCESSFUL' ? '#991B1B' : thesis.vivaStatus === 'SCHEDULED' ? '#1E40AF' : '#475569' }}>
                {thesis.vivaStatus === 'SUCCESSFUL' ? 'Passed / Successful' : thesis.vivaStatus === 'UNSUCCESSFUL' ? 'Corrections Required' : thesis.vivaStatus === 'SCHEDULED' ? 'Scheduled' : 'Awaiting Schedule'}
              </span>
            </div>
            {thesis.vivaStatus !== 'NOT_SCHEDULED' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: '0.82rem', marginTop: 8 }}>
                <div><strong>Date:</strong> {thesis.vivaDate ? new Date(thesis.vivaDate).toLocaleDateString() : 'N/A'}</div>
                <div><strong>Time:</strong> {thesis.vivaTime}</div>
                <div><strong>Venue:</strong> {thesis.vivaVenue}</div>
                <div><strong>Board Panel:</strong> {thesis.vivaPanel || 'None'}</div>
                {thesis.vivaRemarks && (
                  <div style={{ gridColumn: 'span 2', background: '#F8FAFC', padding: 8, borderRadius: 6, border: '1px solid #E2E8F0', marginTop: 6, fontStyle: 'italic' }}>
                    "{thesis.vivaRemarks}"
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: 6 }}>
                Awaiting scheduling of the final viva defense.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Submitted (Read-Only) ──
const SubmittedView = ({ thesis }) => {
  const isAwarded = thesis.status === 'AWARDED';
  
  const steps = [
    {
      title: '📤 Thesis Submission Package',
      desc: `Your final Ph.D. thesis was digitally signed-off by your Supervisor and submitted on ${thesis.submittedAt ? new Date(thesis.submittedAt).toLocaleDateString() : new Date().toLocaleDateString()}. Your account is locked.`,
      status: 'SUCCESS'
    },
    {
      title: '📬 Dispatch to External University Examiners',
      desc: thesis.dispatchDate 
        ? `Dispatched on ${new Date(thesis.dispatchDate).toLocaleDateString()} via ${thesis.dispatchMethod} ${thesis.dispatchTrackingNumber ? `(Ref: ${thesis.dispatchTrackingNumber})` : ''}. Examiner evaluation is in progress.`
        : 'Your thesis is being verified by the HOD and Academic Branch for official examiner dispatch.',
      status: thesis.dispatchDate ? 'SUCCESS' : 'WARNING'
    },
    {
      title: '🎓 Viva-Voce Defense Colloquium',
      desc: thesis.vivaStatus === 'SUCCESSFUL'
        ? `Passed defense colloquium successfully! Panel Remarks: "${thesis.vivaRemarks || 'Satisfactory'}"`
        : thesis.vivaStatus === 'SCHEDULED'
        ? `Defense Scheduled: ${new Date(thesis.vivaDate).toLocaleDateString()} at ${thesis.vivaTime} in ${thesis.vivaVenue}. External Expert panel will evaluate.`
        : thesis.vivaStatus === 'UNSUCCESSFUL'
        ? `Corrections required: "${thesis.vivaRemarks || 'Check notes'}"`
        : 'Awaiting clearance and positive reports from external university examiners.',
      status: thesis.vivaStatus === 'SUCCESSFUL' ? 'SUCCESS' : thesis.vivaStatus === 'SCHEDULED' ? 'WARNING' : thesis.vivaStatus === 'UNSUCCESSFUL' ? 'DANGER' : 'PENDING'
    },
    {
      title: '📜 Degree Award Clearance',
      desc: isAwarded 
        ? `Ph.D. degree officially awarded by the Academic Council on ${thesis.awardedAt ? new Date(thesis.awardedAt).toLocaleDateString() : 'N/A'}! Congratulations!`
        : 'Degree award clearance by Himachal Pradesh University Academic Council.',
      status: isAwarded ? 'SUCCESS' : 'PENDING'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 750, margin: '0 auto' }}>
      <div className="card" style={{ display: 'flex', gap: 16, alignItems: 'center', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(37, 99, 235, 0.03) 100%)', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: 16, padding: 24 }}>
        <div style={{ fontSize: '3rem' }}>🚀</div>
        <div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text, #0F172A)' }}>
            {isAwarded ? '🎓 Ph.D. Degree Officially Awarded!' : '📚 Thesis in External Evaluation Phase'}
          </h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary, #475569)', lineHeight: 1.4 }}>
            {isAwarded 
              ? 'Congratulations, Doctor! Your Ph.D. degree has been officially awarded and cleared by the university board.'
              : 'Your final thesis package has been locked. View the current external assessment and Viva-Voce progression timeline below.'}
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: '28px 24px' }}>
        <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: 24, color: 'var(--color-text, #0F172A)' }}>📋 Ph.D. Degree Evaluation Progression</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'relative' }}>
          {/* Vertical timeline line */}
          <div style={{ position: 'absolute', top: 8, bottom: 8, left: 15, width: 2, background: 'var(--color-border, #E2E8F0)' }} />

          {steps.map((step, idx) => {
            const isSuccess = step.status === 'SUCCESS';
            const isWarning = step.status === 'WARNING';
            const isDanger = step.status === 'DANGER';
            
            let bgCircle = 'var(--color-bg, #F1F5F9)';
            let borderCircle = 'var(--color-border, #CBD5E1)';
            let textColor = 'var(--color-text-secondary, #64748B)';
            let iconText = '⚪';

            if (isSuccess) {
              bgCircle = '#10B981';
              borderCircle = '#10B981';
              textColor = '#10B981';
              iconText = '✓';
            } else if (isWarning) {
              bgCircle = '#F59E0B';
              borderCircle = '#F59E0B';
              textColor = '#D97706';
              iconText = '⏳';
            } else if (isDanger) {
              bgCircle = '#EF4444';
              borderCircle = '#EF4444';
              textColor = '#EF4444';
              iconText = '⚠️';
            }

            return (
              <div key={idx} style={{ display: 'flex', gap: 16, position: 'relative', zIndex: 1 }}>
                {/* Timeline Circle */}
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: bgCircle,
                  border: `2px solid ${borderCircle}`,
                  color: isSuccess ? 'white' : 'var(--color-text, #475569)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.8rem',
                  flexShrink: 0
                }}>
                  {iconText}
                </div>

                {/* Content Box */}
                <div style={{
                  flex: 1,
                  background: isSuccess ? 'rgba(16, 185, 129, 0.03)' : isWarning ? 'rgba(245, 158, 11, 0.03)' : 'var(--color-bg, #F8FAFC)',
                  border: `1px solid ${isSuccess ? 'rgba(16, 185, 129, 0.1)' : isWarning ? 'rgba(245, 158, 11, 0.1)' : 'var(--color-border, #E2E8F0)'}`,
                  borderRadius: 12,
                  padding: '14px 18px'
                }}>
                  <div style={{ fontWeight: 800, fontSize: '0.88rem', color: isSuccess ? '#065F46' : isWarning ? '#B45309' : 'var(--color-text, #1F2937)' }}>
                    {step.title}
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--color-text-secondary, #475569)', lineHeight: 1.4 }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── Awarded ──
const AwardedView = ({ thesis }) => (
  <SubmittedView thesis={thesis} />
);

// ── Overview (status summary) ──
const OverviewPage = ({ thesis, milestones, setActiveTab, user }) => {
  const [drcMeetings, setDrcMeetings] = useState([]);
  const [publications, setPublications] = useState([]);

  useEffect(() => {
    if (thesis) {
      axios.get(`${API}/lifecycle/drc/thesis/${thesis._id}`, getAuthHeader())
        .then(res => setDrcMeetings(res.data))
        .catch(() => {});
      axios.get(`${API}/lifecycle/publications/thesis/${thesis._id}`, getAuthHeader())
        .then(res => setPublications(res.data))
        .catch(() => {});
    }
  }, [thesis]);

  const synopsisMilestone = milestones.find(m => m.type === 'SYNOPSIS');
  const isSynopsisRevision = thesis.status === 'SYNOPSIS_PENDING' && synopsisMilestone?.status === 'REVISION_REQUIRED';

  const preMilestone = milestones.find(m => m.type === 'PRE_SUBMISSION');
  const isPreSubmissionRevision = thesis.status === 'PRE_SUBMISSION' && preMilestone?.status === 'REVISION_REQUIRED';

  const getSubmittedNextAction = () => {
    if (!thesis.dispatchDate) {
      return 'Your final thesis package has been signed-off by your Supervisor. HOD and Academic Branch will dispatch it to external examiners shortly.';
    }
    if (thesis.vivaStatus === 'NOT_SCHEDULED') {
      return `Your thesis was dispatched to external examiners on ${new Date(thesis.dispatchDate).toLocaleDateString()} via ${thesis.dispatchMethod} ${thesis.dispatchTrackingNumber ? `(Ref: ${thesis.dispatchTrackingNumber})` : ''}. Examiner assessment is currently in progress.`;
    }
    if (thesis.vivaStatus === 'SCHEDULED') {
      return `Your Viva-Voce defense has been scheduled on ${new Date(thesis.vivaDate).toLocaleDateString()} at ${thesis.vivaTime} in ${thesis.vivaVenue}. Committee: ${thesis.vivaPanel || 'External Board'}. Please prepare your slides and defense presentation.`;
    }
    if (thesis.vivaStatus === 'SUCCESSFUL') {
      return 'Congratulations! You have passed your Viva-Voce defense successfully. HOD/Admin will issue the final Ph.D. degree award clearance shortly.';
    }
    if (thesis.vivaStatus === 'UNSUCCESSFUL') {
      return `Defense revisions required: "${thesis.vivaRemarks || 'Check panel feedback'}". HOD/Admin will re-schedule your defense session once ready.`;
    }
    return 'Your final thesis is under review by external examiners. Updates will be visible here shortly.';
  };

  const statusMap = {
    REGISTRATION_PENDING: { label: 'Awaiting Admin Verification', color: '#D97706', bg: '#FEF3C7', progress: 10, nextAction: 'Wait for HOD to verify your enrollment and assign a department supervisor.' },
    COURSEWORK: { label: 'Coursework Phase', color: '#3B82F6', bg: '#DBEAFE', progress: 25, nextAction: 'Focus on completing your doctoral coursework syllabus and clear your coursework exams.' },
    SYNOPSIS_PENDING: isSynopsisRevision ? {
      label: 'Synopsis Correction Needed',
      color: '#DC2626',
      bg: '#FEE2E2',
      progress: 40,
      nextAction: `Your supervisor requested corrections. Feedback: "${synopsisMilestone.comments?.[synopsisMilestone.comments.length - 1]?.text || 'Please check supervisor comments.'}". Go to "Research Synopsis" to re-upload your revised proposal.`
    } : {
      label: 'Synopsis Submission',
      color: '#8B5CF6',
      bg: '#EDE9FE',
      progress: 40,
      nextAction: 'Upload your research synopsis proposal PDF. Ensure similarity indexing is within permissible limits.'
    },
    ACTIVE_RESEARCH: { label: 'Active Research', color: '#059669', bg: '#D1FAE5', progress: 65, nextAction: 'Submit periodic 6-month progress reports to your Research Advisory Committee (RAC) and publish research papers.' },
    PRE_SUBMISSION: isPreSubmissionRevision ? {
      label: 'Thesis Revision Required',
      color: '#DC2626',
      bg: '#FEE2E2',
      progress: 85,
      nextAction: `Your supervisor requested thesis revisions. Feedback: "${preMilestone.comments?.[preMilestone.comments.length - 1]?.text || 'Please check supervisor comments.'}". Go to "Pre-Submission Package" to re-upload your revised package.`
    } : {
      label: 'Pre-Submission',
      color: '#EA580C',
      bg: '#FED7AA',
      progress: 85,
      nextAction: 'Prepare for your pre-submission seminar and defense colloquium in front of department experts.'
    },
    SUBMITTED: { 
      label: thesis.vivaStatus === 'SUCCESSFUL' ? 'Defense Concluded' : thesis.vivaStatus === 'SCHEDULED' ? 'Defense Scheduled' : 'Under Evaluation', 
      color: '#6B7280', 
      bg: '#F3F4F6', 
      progress: 95, 
      nextAction: getSubmittedNextAction() 
    },
    AWARDED: { label: 'Degree Awarded 🎓', color: '#059669', bg: '#D1FAE5', progress: 100, nextAction: 'Congratulations! Your Ph.D. degree has been officially awarded by the Academic Council.' },
  };

  const s = statusMap[thesis.status] || statusMap['REGISTRATION_PENDING'];
  const activeDrc = drcMeetings.find(m => m.status === 'SCHEDULED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* 1. Milestone Timeline */}
      <MilestoneTimeline thesis={thesis} milestones={milestones} />

      {/* 2. DRC Scheduled Reminder Callout (if active) */}
      {activeDrc && (
        <div style={{
          background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
          borderLeft: '5px solid #F59E0B',
          borderRadius: '12px',
          padding: '16px 20px',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
          display: 'flex',
          gap: '16px',
          alignItems: 'center'
        }}>
          <div style={{ width: '40px', height: '40px', background: '#FEF3C7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#92400E', fontSize: '0.9rem' }}>⚠️ Upcoming Meeting: {activeDrc.title || 'DRC Meeting'} Scheduled!</div>
            <div style={{ fontSize: '0.8rem', color: '#B45309', marginTop: '4px' }}>
              <strong>Date:</strong> {new Date(activeDrc.scheduledDate).toLocaleDateString()} | <strong>Time:</strong> {activeDrc.scheduledTime} | <strong>Venue:</strong> {activeDrc.venue}
            </div>
            {activeDrc.agenda && (
              <div style={{ fontSize: '0.78rem', color: '#B45309', fontStyle: 'italic', marginTop: '2px' }}>
                Agenda: {activeDrc.agenda}
              </div>
            )}
          </div>
        </div>
      )}

      {thesis.status === 'ACTIVE_RESEARCH' && (
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.02) 100%)', 
          border: '1px solid rgba(59, 130, 246, 0.15)',
          padding: 20,
          borderRadius: 16
        }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-text, #0F172A)', display: 'flex', alignItems: 'center', gap: 8 }}>
            🎯 Pre-Submission Seminar Eligibility Checklist
          </h4>
          <p style={{ color: 'var(--color-text-secondary, #475569)', fontSize: '0.82rem', lineHeight: 1.4, margin: '0 0 16px 0' }}>
            Before scheduling your Pre-Submission Seminar and submitting your rough thesis, you must fulfill the institutional milestones below.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Prerequisite 1: Time */}
            {(() => {
              const admDate = user?.profile?.admissionDate ? new Date(user.profile.admissionDate) : null;
              const refDate = admDate && !isNaN(admDate.getTime()) ? admDate : (thesis.startDate ? new Date(thesis.startDate) : null);
              const diffMs = refDate ? (new Date() - refDate) : 0;
              const hasMphil = user?.profile?.qualifications?.mphil?.done === true;
              const requiredYears = hasMphil ? 1.5 : 3;
              const diffYears = Math.min(requiredYears, +(diffMs / (1000 * 60 * 60 * 24 * 365.25)).toFixed(2));
              const isTimeMet = diffYears >= requiredYears;
              return (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface, #ffffff)', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--color-border, #E2E8F0)' }}>
                  <div style={{ fontSize: '0.82rem' }}>
                    <strong>⏳ Minimum Research Duration:</strong> {diffYears} / {requiredYears} Years {hasMphil ? '(M.Phil Holder)' : ''}
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isTimeMet ? '#065F46' : '#D97706' }}>
                    {isTimeMet ? '✅ Eligible' : '⏳ Time Remaining'}
                  </span>
                </div>
              );
            })()}

            {/* Prerequisite 2: Reports */}
            {(() => {
              const reports = milestones.filter(m => m.type === '6_MONTH_REPORT');
              const approvedReports = reports.filter(r => r.status === 'APPROVED').length;
              const hasMphil = user?.profile?.qualifications?.mphil?.done === true;
              const requiredReportsCount = hasMphil ? 3 : 6;
              const isReportsMet = approvedReports >= requiredReportsCount;
              return (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface, #ffffff)', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--color-border, #E2E8F0)' }}>
                  <div style={{ fontSize: '0.82rem' }}>
                    <strong>📄 Progress Reports:</strong> {approvedReports} / {requiredReportsCount} Semester Reports Approved {hasMphil ? '(M.Phil Holder)' : ''}
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isReportsMet ? '#065F46' : '#D97706' }}>
                    {isReportsMet ? '✅ All Approved' : '⏳ Pending Reviews'}
                  </span>
                </div>
              );
            })()}

            {/* Prerequisite 3: Publications */}
            {(() => {
              const journalsCount = publications.filter(p => p.type === 'JOURNAL' && p.status === 'VERIFIED').length;
              const conferencesCount = publications.filter(p => p.type === 'CONFERENCE' && p.status === 'VERIFIED').length;
              const isPubsMet = journalsCount >= 2 && conferencesCount >= 2;
              return (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-surface, #ffffff)', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--color-border, #E2E8F0)' }}>
                  <div style={{ fontSize: '0.82rem' }}>
                    <strong>📚 Publications Log:</strong> Journals: {journalsCount}/2 | Conferences: {conferencesCount}/2
                  </div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isPubsMet ? '#065F46' : '#D97706' }}>
                    {isPubsMet ? '✅ Complete' : '⏳ Prerequisites Locked'}
                  </span>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* 3. Main Dashboard Body (Grid layout) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20 }}>
        {/* Left Hand: Ph.D. Profile Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <NotificationPanel user={user} onTabChange={setActiveTab} />
          <div className="card" style={{ padding: '24px', background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: '16px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
              📝 Ph.D. Research Overview
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              {[
                ['SH no.', user?.profile?.shNo || '—'],
                ['Enrollment Number', thesis.enrollmentNumber],
                ['Research Department', thesis.department],
                ['Research Advisor', thesis.supervisorId?.name || 'Awaiting Allocation'],
                ['Assigned Co-Supervisor', thesis.coSupervisorId?.name || 'None Assigned']
              ].map(([k, v]) => (
                <div key={k} style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #F1F5F9' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>{k}</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#0F172A' }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ background: '#F0FDF4', borderRadius: '12px', padding: '16px', border: '1px solid #DCFCE7' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', marginBottom: '4px' }}>Next Action Required</div>
              <div style={{ fontSize: '0.82rem', color: '#15803D', lineHeight: 1.5 }}>{s.nextAction}</div>
            </div>
          </div>

          {/* Audit Log Card */}
          {thesis.auditLog && thesis.auditLog.length > 0 && (
            <div className="card" style={{ padding: '24px', background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>
                📜 Progression History
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {thesis.auditLog.slice().reverse().map((log, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3B82F6', marginTop: '6px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1E293B' }}>{log.action.replace(/_/g, ' ')}</div>
                      {log.note && <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>{log.note}</div>}
                      <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '2px' }}>
                        {new Date(log.timestamp).toLocaleDateString()} at {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Hand Column: Stats & Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Key Metrics Card */}
          <div className="card" style={{ padding: '24px', background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>
              📊 Academic Metrics
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ padding: '16px', background: '#EFF6FF', borderRadius: '12px', textAlign: 'center', border: '1px solid #DBEAFE' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#1E40AF' }}>{publications.length}</div>
                <div style={{ fontSize: '0.7rem', color: '#1E40AF', fontWeight: 600 }}>Publications</div>
              </div>
              <div style={{ padding: '16px', background: '#ECFDF5', borderRadius: '12px', textAlign: 'center', border: '1px solid #D1FAE5' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#065F46' }}>
                  {milestones.filter(m => m.status === 'APPROVED').length} / {milestones.length || 1}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#065F46', fontWeight: 600 }}>Milestones Approved</div>
              </div>
            </div>
          </div>

          {/* Quick Actions Nav */}
          <div className="card" style={{ padding: '24px', background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>
              ⚡ Quick Navigation
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { key: 'sixMonthReports', label: '📄 Submit 6-Month Progress Report' },
                { key: 'rac', label: '📆 Submit RAC Progress Report' },
                { key: 'publications', label: '🏆 Log Research Output' },
                { key: 'profile', label: '👤 Complete/Edit Profile Details' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    textAlign: 'left',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#334155',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.borderColor = '#CBD5E1'; }}
                  onMouseOut={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Recent Deliverables list */}
          {milestones.length > 0 && (
            <div className="card" style={{ padding: '24px', background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>
                📂 Recent Deliverables
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {milestones.slice(0, 3).map(m => (
                  <div key={m._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid #F1F5F9' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1E293B' }}>{m.title}</div>
                      <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '2px' }}>Type: {m.type}</div>
                    </div>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: 12,
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      background: m.status === 'APPROVED' ? '#D1FAE5' : m.status === 'REVISION_REQUIRED' ? '#FEE2E2' : '#FEF3C7',
                      color: m.status === 'APPROVED' ? '#065F46' : m.status === 'REVISION_REQUIRED' ? '#991B1B' : '#92400E'
                    }}>
                      {m.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Profile Tab ──
// ── GNUMS Ph.D. Lifecycle components ──
const RACProgressTab = ({ thesis }) => {
  const toast = useToast();
  const [racs, setRacs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentRemarks, setStudentRemarks] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);

  const fetchRACs = async () => {
    try {
      const res = await axios.get(`${API}/lifecycle/rac/thesis/${thesis._id}`, getAuthHeader());
      setRacs(res.data);
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => { fetchRACs(); }, []);

  const handleReportUpload = async (racId) => {
    try {
      const formData = new FormData();
      if (attachedFile) {
        formData.append('document', attachedFile);
      }
      formData.append('studentRemarks', studentRemarks);

      await axios.put(`${API}/lifecycle/rac/${racId}/report`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      toast.success('RAC progress remarks & document updated successfully!');
      setUploadingId(null);
      setStudentRemarks('');
      setAttachedFile(null);
      fetchRACs();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Submission failed.');
    }
  };

  return (
    <div className="card">
      <h3 className="card-title">Research Advisory Committee (RAC) Progress</h3>
      <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: 20 }}>
        Track scheduled RAC reviews, upload mandatory periodic progress reports, and view evaluation remarks from the doctoral committee.
      </p>
      {loading ? (
        <div className="premium-preloader-container" style={{ padding: '20px' }}>
          <div className="premium-preloader-spinner" style={{ width: '40px', height: '40px', borderWidth: '3px', marginBottom: '12px' }}></div>
          <div className="premium-preloader-text" style={{ fontSize: '0.85rem' }}>Loading reviews...</div>
        </div>
      ) : racs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '36px', color: '#64748B', background: '#F8FAFC', borderRadius: 8 }}>
          No RAC sessions have been scheduled by your HOD yet.
        </div>
      ) : (
        <div className="file-list">
          <div className="file-header">
            <div style={{ flex: 1 }}>Session</div>
            <div style={{ flex: 2 }}>Scheduled Date</div>
            <div style={{ flex: 2 }}>Committee</div>
            <div style={{ flex: 1.5 }}>Status</div>
            <div style={{ flex: 2 }}>Remarks</div>
            <div style={{ flex: 2, textAlign: 'center' }}>Action</div>
          </div>
          {racs.map(r => (
            <div key={r._id} className="file-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <div style={{ flex: 1, fontWeight: 700, color: '#1E3A8A' }}>RAC-{r.racNumber}</div>
                <div style={{ flex: 2, fontSize: '0.9rem' }}>{new Date(r.scheduledDate).toLocaleDateString()}</div>
                <div style={{ flex: 2, fontSize: '0.85rem', color: '#475569' }}>{r.committeeMembers || 'Pending Formation'}</div>
                <div style={{ flex: 1.5 }}>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600,
                    background: r.status === 'SATISFACTORY' ? '#D1FAE5' : r.status === 'UNSATISFACTORY' ? '#FEE2E2' : '#FEF3C7',
                    color: r.status === 'SATISFACTORY' ? '#065F46' : r.status === 'UNSATISFACTORY' ? '#991B1B' : '#D97706'
                  }}>
                    {r.status === 'SATISFACTORY' ? 'CLEARED' : r.status === 'UNSATISFACTORY' ? 'REJECTED' : r.status}
                  </span>
                </div>
                <div style={{ flex: 2, fontSize: '0.85rem', color: '#475569' }}>{r.remarks || '—'}</div>
                <div style={{ flex: 2, display: 'flex', justifyContent: 'center' }}>
                  {r.status === 'SCHEDULED' ? (
                    <button 
                      onClick={() => {
                        const nextId = uploadingId === r._id ? null : r._id;
                        setUploadingId(nextId);
                        setStudentRemarks('');
                        setAttachedFile(null);
                      }}
                      className="btn-primary" 
                      style={{ padding: '6px 12px', fontSize: '0.75rem', background: '#2563EB' }}
                    >
                      Action
                    </button>
                  ) : r.progressReportUrl ? (
                    <a href={`${API_BASE_URL}${r.progressReportUrl}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#2563EB', fontWeight: 600, textDecoration: 'underline' }}>
                      📄 View Report
                    </a>
                  ) : '—'}
                </div>
              </div>
              {(r.submissions && r.submissions.length > 0) || r.progressReportUrl || r.studentRemarks ? (
                <div style={{ width: '100%', marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6, alignSelf: 'flex-start' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Uploaded Reports & Remarks History:</span>
                  <div style={{ width: '100%', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', background: '#ffffff', borderRadius: 8, overflow: 'hidden', border: '1px solid #E2E8F0', minWidth: 500 }}>
                      <thead>
                        <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>
                          <th style={{ padding: '8px 12px', fontWeight: 700, color: '#475569', width: '15%' }}>Submission</th>
                          <th style={{ padding: '8px 12px', fontWeight: 700, color: '#475569', width: '25%' }}>Date & Time</th>
                          <th style={{ padding: '8px 12px', fontWeight: 700, color: '#475569', width: '25%' }}>Attached File</th>
                          <th style={{ padding: '8px 12px', fontWeight: 700, color: '#475569', width: '35%' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {r.submissions && r.submissions.length > 0 ? (
                          r.submissions.map((sub, idx) => (
                            <tr key={sub._id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                              <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1E3A8A' }}>#{idx + 1}</td>
                              <td style={{ padding: '8px 12px', color: '#64748B' }}>{new Date(sub.uploadedAt).toLocaleString()}</td>
                              <td style={{ padding: '8px 12px' }}>
                                {sub.progressReportUrl ? (
                                  <a href={`${API_BASE_URL}${sub.progressReportUrl}`} target="_blank" rel="noreferrer" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'underline' }}>
                                    📄 View File
                                  </a>
                                ) : (
                                  <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>No file</span>
                                )}
                              </td>
                              <td style={{ padding: '8px 12px', color: '#334155' }}>
                                {sub.studentRemarks || <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>No remarks</span>}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1E3A8A' }}>#1</td>
                            <td style={{ padding: '8px 12px', color: '#64748B' }}>—</td>
                            <td style={{ padding: '8px 12px' }}>
                              {r.progressReportUrl ? (
                                <a href={`${API_BASE_URL}${r.progressReportUrl}`} target="_blank" rel="noreferrer" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'underline' }}>
                                  📄 View File
                                </a>
                              ) : (
                                <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>No file</span>
                              )}
                            </td>
                            <td style={{ padding: '8px 12px', color: '#334155' }}>
                              {r.studentRemarks || <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>No remarks</span>}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
              {uploadingId === r._id && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#F8FAFC', padding: 16, borderRadius: 10, border: '1px dashed #CBD5E1', marginTop: 4 }}>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: 250 }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Remarks (Optional)</label>
                      <input 
                        type="text" 
                        placeholder="please enter the remarks and hit submit." 
                        className="form-input" 
                        value={studentRemarks} 
                        onChange={e => setStudentRemarks(e.target.value)} 
                        style={{ width: '100%', fontSize: '0.85rem' }} 
                      />
                    </div>
                    <div style={{ minWidth: 200 }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Attach File (Optional)</label>
                      <input 
                        type="file" 
                        className="form-input" 
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" 
                        onChange={e => setAttachedFile(e.target.files[0])} 
                        style={{ width: '100%', fontSize: '0.85rem', padding: '4px' }} 
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={() => { setUploadingId(null); setStudentRemarks(''); setAttachedFile(null); }} className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>Cancel</button>
                    <button onClick={() => handleReportUpload(r._id)} className="btn-primary" style={{ background: '#059669', padding: '6px 16px', fontSize: '0.75rem' }}>Submit</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ResearchOutputsTab = ({ thesis }) => {
  const toast = useToast();
  const [pubs, setPubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ 
    title: '', 
    journalName: '', 
    issn: '', 
    publicationDate: '', 
    paperLink: '', 
    type: 'JOURNAL',
    doiUrl: '',
    iprType: '',
    itemStatus: ''
  });

  const fetchPubs = async () => {
    try {
      const res = await axios.get(`${API}/publications/thesis/${thesis._id}`, getAuthHeader());
      setPubs(res.data);
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => { fetchPubs(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.journalName.trim()) {
      return toast.warning(form.type === 'IPR' ? 'Please enter IPR title and office details.' : 'Please enter paper title and publisher details.');
    }
    if (!file) return toast.warning('Please upload a PDF proof document.');
    
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('thesisId', thesis._id);
      formData.append('title', form.title);
      formData.append('journalName', form.journalName);
      formData.append('issn', form.issn);
      formData.append('publicationDate', form.publicationDate);
      formData.append('paperLink', form.paperLink || form.doiUrl || '');
      formData.append('type', form.type);
      if (form.type === 'IPR') formData.append('iprType', form.iprType);
      formData.append('itemStatus', form.itemStatus);
      formData.append('doiUrl', form.doiUrl);
      formData.append('document', file);

      await axios.post(`${API}/publications`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success(`${form.type === 'IPR' ? 'IPR' : 'Scientific Publication'} logged successfully & pending verification!`);
      setShowForm(false);
      setForm({ title: '', journalName: '', issn: '', publicationDate: '', paperLink: '', type: 'JOURNAL', doiUrl: '', iprType: '', itemStatus: '' });
      setFile(null);
      fetchPubs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error logging research output.');
    } finally {
      setSubmitting(false);
    }
  };

  const verifiedJournals = pubs.filter(p => p.type === 'JOURNAL' && p.status === 'VERIFIED').length;
  const verifiedConferences = pubs.filter(p => p.type === 'CONFERENCE' && p.status === 'VERIFIED').length;
  const loggedPatents = pubs.filter(p => p.type === 'PATENT' || p.type === 'IPR').length;

  const isIPR = form.type === 'PATENT' || form.type === 'IPR';
  const isConf = form.type === 'CONFERENCE';
  
  const titleLabel = isIPR ? 'IPR / Patent Title *' : isConf ? 'Presentation/Paper Title *' : 'Paper Title *';
  const titlePlaceholder = isIPR ? 'e.g. System and Method for Adaptive Threat Detection' : 'e.g. A Deep Learning Approach to Cybersecurity';
  const journalLabel = isIPR ? 'IPR Office / Issuing Organization *' : isConf ? 'Conference Name & Location *' : 'Journal / Publisher *';
  const journalPlaceholder = isIPR ? 'e.g. Indian Patent Office (IPO) / Copyright Office' : isConf ? 'e.g. IEEE ICC 2026, Paris' : 'e.g. IEEE Transactions on Forensics';
  const issnLabel = isIPR ? 'IPR / Application Number' : 'ISSN / ISBN';
  const issnPlaceholder = isIPR ? 'e.g. 202611012345' : 'e.g. 1549-3652';
  const dateLabel = isIPR ? 'Date of Filing / Award *' : isConf ? 'Date of Presentation *' : 'Date of Acceptance/Print *';
  const linkLabel = isIPR ? 'IPR URL / Link' : 'Paper/Publisher Link';
  const linkPlaceholder = isIPR ? 'e.g. https://ipindiaservices.gov.in/...' : 'e.g. https://ieeexplore.ieee.org/document/...';
  const doiLabel = isIPR ? 'IPR ID / App Ref Number' : 'DOI URL / Number';
  const doiPlaceholder = isIPR ? 'e.g. PAT/2026/7890' : 'e.g. 10.1109/TIFS.2026.12345';
  const proofLabel = isIPR ? 'Upload IPR Proof / Certificate (PDF format) *' : isConf ? 'Upload Proof of Presentation (PDF format) *' : 'Upload Proof of Acceptance (PDF format) *';
  const typeLabel = isIPR ? 'Research Output Type *' : 'Publication / Presentation Type *';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Target Progress Summary widget */}
      <div className="card" style={{ 
        padding: 24, 
        borderRadius: 16, 
        background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.08) 0%, rgba(16, 185, 129, 0.03) 100%)', 
        border: '1px solid rgba(16, 185, 129, 0.15)' 
      }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-text, #0F172A)', display: 'flex', alignItems: 'center', gap: 8 }}>
          🏆 Pre-Submission Research Output Prerequisites
        </h4>
        <p style={{ color: 'var(--color-text-secondary, #475569)', fontSize: '0.82rem', lineHeight: 1.4, margin: '0 0 16px 0' }}>
          To unlock the Pre-Submission Seminar phase, you are required to have published at least 2 papers in verified peer-reviewed journals (UGC-CARE listed) and presented at least 2 papers at scientific conferences. Intellectual Property Rights (IPRs) can be logged optionally to build your doctoral research outputs portfolio.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div style={{ 
            background: 'var(--color-surface, #ffffff)', 
            border: '1px solid var(--color-border, #E2E8F0)',
            padding: 16, 
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #64748B)' }}>Journal Publications</span>
              <span style={{ 
                fontSize: '0.72rem', 
                fontWeight: 700, 
                padding: '2px 8px', 
                borderRadius: 12, 
                background: verifiedJournals >= 2 ? '#D1FAE5' : '#FEF3C7',
                color: verifiedJournals >= 2 ? '#065F46' : '#D97706'
              }}>
                {verifiedJournals >= 2 ? 'COMPLETED' : 'IN PROGRESS'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text, #0F172A)' }}>{verifiedJournals}</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary, #64748B)', fontWeight: 500 }}>/ 2 required</span>
            </div>
            <div style={{ width: '100%', height: 6, background: 'var(--color-bg, #F1F5F9)', borderRadius: 3, overflow: 'hidden', marginTop: 4 }}>
              <div style={{ width: `${Math.min((verifiedJournals / 2) * 100, 100)}%`, height: '100%', background: verifiedJournals >= 2 ? '#10B981' : '#F59E0B', borderRadius: 3 }} />
            </div>
          </div>

          <div style={{ 
            background: 'var(--color-surface, #ffffff)', 
            border: '1px solid var(--color-border, #E2E8F0)',
            padding: 16, 
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #64748B)' }}>Conference Presentations</span>
              <span style={{ 
                fontSize: '0.72rem', 
                fontWeight: 700, 
                padding: '2px 8px', 
                borderRadius: 12, 
                background: verifiedConferences >= 2 ? '#D1FAE5' : '#FEF3C7',
                color: verifiedConferences >= 2 ? '#065F46' : '#D97706'
              }}>
                {verifiedConferences >= 2 ? 'COMPLETED' : 'IN PROGRESS'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text, #0F172A)' }}>{verifiedConferences}</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary, #64748B)', fontWeight: 500 }}>/ 2 required</span>
            </div>
            <div style={{ width: '100%', height: 6, background: 'var(--color-bg, #F1F5F9)', borderRadius: 3, overflow: 'hidden', marginTop: 4 }}>
              <div style={{ width: `${Math.min((verifiedConferences / 2) * 100, 100)}%`, height: '100%', background: verifiedConferences >= 2 ? '#10B981' : '#F59E0B', borderRadius: 3 }} />
            </div>
          </div>

          <div style={{ 
            background: 'var(--color-surface, #ffffff)', 
            border: '1px solid var(--color-border, #E2E8F0)',
            padding: 16, 
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #64748B)' }}>Intellectual Property Rights (IPRs)</span>
              <span style={{ 
                fontSize: '0.72rem', 
                fontWeight: 700, 
                padding: '2px 8px', 
                borderRadius: 12, 
                background: '#DBEAFE',
                color: '#1E40AF'
              }}>
                OPTIONAL
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-text, #0F172A)' }}>{loggedPatents}</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary, #64748B)', fontWeight: 500 }}>uploaded</span>
            </div>
            <div style={{ width: '100%', height: 6, background: 'var(--color-bg, #F1F5F9)', borderRadius: 3, overflow: 'hidden', marginTop: 4 }}>
              <div style={{ width: '100%', height: '100%', background: '#3B82F6', borderRadius: 3 }} />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h3 className="card-title" style={{ margin: 0 }}>Research Outputs Log</h3>
            <p style={{ color: 'var(--color-text-secondary, #64748B)', fontSize: '0.85rem', marginTop: 4 }}>
              Log and track peer-reviewed journal papers, scientific conference presentations, and Intellectual Property Rights (IPRs) completed during your active Ph.D. tenure.
            </p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary" style={{ background: 'var(--color-primary, #059669)', display: 'flex', gap: 6, alignItems: 'center' }}>
            <Plus size={16} /> Log Research Output
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} style={{ background: 'var(--color-bg, #F8FAFC)', padding: 20, borderRadius: 12, border: '1px solid var(--color-border, #E2E8F0)', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h4 style={{ margin: 0, color: 'var(--color-text, #0F172A)' }}>Log New Research Output</h4>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>{typeLabel}</label>
              <select className="form-input" required value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ maxWidth: '400px' }}>
                <option value="JOURNAL">Journal Publication</option>
                <option value="CONFERENCE">Conference Presentation</option>
                <option value="IPR">Intellectual Property Rights (IPR)</option>
              </select>
            </div>

            {form.type === 'IPR' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>IPR Type *</label>
                  <select className="form-input" required value={form.iprType || ''} onChange={e => setForm({ ...form, iprType: e.target.value })} style={{ width: '100%' }}>
                    <option value="">-- Select IPR Type --</option>
                    <option value="Patent">Patent</option>
                    <option value="Copyright">Copyright</option>
                    <option value="Trademark">Trademark</option>
                    <option value="Design Registration">Design Registration</option>
                    <option value="Geographical Indication">Geographical Indication</option>
                    <option value="Trade Secret">Trade Secret</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>IPR Status *</label>
                  <select className="form-input" required value={form.itemStatus || ''} onChange={e => setForm({ ...form, itemStatus: e.target.value })} style={{ width: '100%' }}>
                    <option value="">-- Select Status --</option>
                    <option value="Filed">Filed</option>
                    <option value="Published">Published</option>
                    <option value="Granted/Issued">Granted / Issued / Awarded</option>
                  </select>
                </div>
              </div>
            )}
            
            {form.type !== 'IPR' && (
              <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Publication Status *</label>
                  <select className="form-input" required value={form.itemStatus || ''} onChange={e => setForm({ ...form, itemStatus: e.target.value })} style={{ maxWidth: '400px' }}>
                    <option value="">-- Select Status --</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Published/Presented">Published / Presented</option>
                  </select>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>{titleLabel}</label>
                <input type="text" className="form-input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder={titlePlaceholder} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>{journalLabel}</label>
                <input type="text" className="form-input" required value={form.journalName} onChange={e => setForm({ ...form, journalName: e.target.value })} placeholder={journalPlaceholder} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>{issnLabel}</label>
                <input type="text" className="form-input" value={form.issn} onChange={e => setForm({ ...form, issn: e.target.value })} placeholder={issnPlaceholder} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>{dateLabel}</label>
                <input type="date" className="form-input" required value={form.publicationDate} onChange={e => setForm({ ...form, publicationDate: e.target.value })} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>{linkLabel}</label>
                <input type="text" className="form-input" value={form.paperLink} onChange={e => setForm({ ...form, paperLink: e.target.value })} placeholder={linkPlaceholder} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>{doiLabel}</label>
                <input type="text" className="form-input" value={form.doiUrl} onChange={e => setForm({ ...form, doiUrl: e.target.value })} placeholder={doiPlaceholder} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>{proofLabel}</label>
              <input type="file" className="form-input" required accept=".pdf" onChange={e => setFile(e.target.files[0])} />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline" style={{ padding: '8px 16px' }}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={submitting} style={{ background: '#133A26', padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 6 }}>
                {submitting ? 'Submitting...' : 'Submit Log'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="premium-preloader-container" style={{ padding: '20px' }}>
            <div className="premium-preloader-spinner" style={{ width: '40px', height: '40px', borderWidth: '3px', marginBottom: '12px' }}></div>
            <div className="premium-preloader-text" style={{ fontSize: '0.85rem' }}>Loading research outputs...</div>
          </div>
        ) : pubs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px', color: 'var(--color-text-secondary, #64748B)', background: 'var(--color-bg, #F8FAFC)', borderRadius: 8 }}>
            No research outputs logged yet.
          </div>
        ) : (
          <div className="file-list" style={{ overflowX: 'auto' }}>
            <div className="file-header" style={{ minWidth: 700 }}>
              <div style={{ flex: 2.2 }}>Title</div>
              <div style={{ flex: 1.5 }}>Journal/Publisher/Office</div>
              <div style={{ flex: 1 }}>Type</div>
              <div style={{ flex: 1 }}>Date</div>
              <div style={{ flex: 1 }}>Status</div>
              <div style={{ flex: 1.8, textAlign: 'center' }}>Links & Proof</div>
            </div>
            {pubs.map(p => (
              <div key={p._id} className="file-item" style={{ minWidth: 700, flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <div style={{ flex: 2.2, fontWeight: 700, color: 'var(--color-text, #1E293B)' }}>{p.title}</div>
                  <div style={{ flex: 1.5, fontSize: '0.9rem' }}>{p.journalName}</div>
                  <div style={{ flex: 1 }}>
                    <span style={{ 
                      padding: '2px 6px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 700,
                      background: p.type === 'JOURNAL' ? 'rgba(59, 130, 246, 0.1)' : p.type === 'CONFERENCE' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: p.type === 'JOURNAL' ? '#2563EB' : p.type === 'CONFERENCE' ? '#7C3AED' : '#059669'
                    }}>
                      {p.type === 'IPR' && p.iprType ? `IPR: ${p.iprType}` : p.type === 'PATENT' ? 'IPR: Patent' : p.type}
                    </span>
                    {p.itemStatus && <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary, #64748B)', marginTop: 4, fontWeight: 600 }}>{p.itemStatus}</div>}
                  </div>
                  <div style={{ flex: 1, fontSize: '0.85rem' }}>{new Date(p.publicationDate).toLocaleDateString()}</div>
                  <div style={{ flex: 1 }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600,
                      background: p.status === 'VERIFIED' ? '#D1FAE5' : p.status === 'REJECTED' ? '#FEE2E2' : '#FEF3C7',
                      color: p.status === 'VERIFIED' ? '#065F46' : p.status === 'REJECTED' ? '#991B1B' : '#D97706'
                    }}>
                      {p.status}
                    </span>
                  </div>
                  <div style={{ flex: 1.8, display: 'flex', gap: 12, justifyContent: 'center' }}>
                    {p.paperLink && <a href={p.paperLink} target="_blank" rel="noreferrer" title={p.type === 'PATENT' || p.type === 'IPR' ? 'View IPR URL' : 'View Publisher Page'} style={{ fontSize: '0.82rem', color: '#2563EB', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}><File size={16} /> Link</a>}
                    {p.documentUrl && <a href={`${API_BASE_URL}${p.documentUrl}`} target="_blank" rel="noreferrer" title="View Proof PDF" style={{ fontSize: '0.82rem', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}><Upload size={16} /> PDF</a>}
                  </div>
                </div>
                {p.remarks && (
                  <div style={{ background: 'var(--color-bg, #F8FAFC)', borderLeft: '3px solid var(--color-border, #CBD5E1)', padding: '6px 12px', borderRadius: 6, fontSize: '0.8rem', color: 'var(--color-text-secondary, #475569)', marginTop: 4 }}>
                    <strong>Supervisor Feedback:</strong> "{p.remarks}"
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const MeetingsTab = ({ thesis }) => {
  const toast = useToast();
  const [meetingsSubTab, setMeetingsSubTab] = useState('guidance');
  const [meetings, setMeetings] = useState([]);
  const [drcMeetings, setDrcMeetings] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drcLoading, setDrcLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ date: '', time: '', reason: '', attendees: [] });

  const fetchData = async () => {
    try {
      const [mRes, fRes] = await Promise.all([
        axios.get(`${API}/meetings/me`, getAuthHeader()),
        axios.get(`${API}/auth/faculty`, getAuthHeader())
      ]);
      setMeetings(mRes.data);
      // Filter faculty by department, excluding students, and making sure inactive aren't displayed
      const deptFaculty = fRes.data.filter(f => f.department === thesis.department && f.isActive);
      setFaculty(deptFaculty);
    } catch (err) {
      toast.error('Failed to load meeting details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDrcMeetings = async () => {
    setDrcLoading(true);
    try {
      const res = await axios.get(`${API}/lifecycle/drc/thesis/${thesis._id}`, getAuthHeader());
      setDrcMeetings(res.data);
    } catch (err) {
      toast.error('Failed to load DRC meetings.');
    } finally {
      setDrcLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchDrcMeetings();
  }, []);

  const handleCheckboxChange = (facultyId) => {
    const isSelected = form.attendees.includes(facultyId);
    if (isSelected) {
      setForm(prev => ({ ...prev, attendees: prev.attendees.filter(id => id !== facultyId) }));
    } else {
      setForm(prev => ({ ...prev, attendees: [...prev.attendees, facultyId] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.date || !form.time || !form.reason.trim()) {
      return toast.warning('Please enter date, suggested time, and reason.');
    }

    setSubmitting(true);
    try {
      await axios.post(`${API}/meetings`, form, getAuthHeader());
      toast.success('Meeting request submitted successfully to HOD for approval.');
      setShowModal(false);
      setForm({ date: '', time: '', reason: '', attendees: [] });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error scheduling meeting.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusStyle = (status) => {
    if (status === 'APPROVED') return { bg: '#ECFDF5', text: '#059669', border: 'rgba(16, 185, 129, 0.2)' };
    if (status === 'REJECTED') return { bg: '#FEF2F2', text: '#DC2626', border: 'rgba(239, 68, 68, 0.2)' };
    return { bg: '#FFFBEB', text: '#D97706', border: 'rgba(245, 158, 11, 0.2)' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Sub-tab bar */}
      <div style={{
        display: 'flex',
        background: 'var(--color-bg, #F1F5F9)',
        padding: '4px',
        borderRadius: '10px',
        gap: '4px',
        width: 'fit-content',
        border: '1px solid var(--color-border, #E2E8F0)',
        boxSizing: 'border-box'
      }}>
        <button
          type="button"
          onClick={() => setMeetingsSubTab('guidance')}
          style={{
            background: meetingsSubTab === 'guidance' ? '#3B82F6' : 'transparent',
            border: 'none',
            padding: '8px 16px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            borderRadius: '8px',
            color: meetingsSubTab === 'guidance' ? '#ffffff' : 'var(--color-text-secondary, #475569)',
            boxShadow: meetingsSubTab === 'guidance' ? '0 2px 4px rgba(59, 130, 246, 0.2)' : 'none',
            transition: 'all 0.2s ease-in-out'
          }}
        >
          Guidance Consultations
        </button>
        <button
          type="button"
          onClick={() => setMeetingsSubTab('drc')}
          style={{
            background: meetingsSubTab === 'drc' ? '#3B82F6' : 'transparent',
            border: 'none',
            padding: '8px 16px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            borderRadius: '8px',
            color: meetingsSubTab === 'drc' ? '#ffffff' : 'var(--color-text-secondary, #475569)',
            boxShadow: meetingsSubTab === 'drc' ? '0 2px 4px rgba(59, 130, 246, 0.2)' : 'none',
            transition: 'all 0.2s ease-in-out'
          }}
        >
          DRC Meetings
        </button>
      </div>

      {meetingsSubTab === 'guidance' ? (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 className="card-title" style={{ margin: 0 }}>Meetings Scheduler Desk</h3>
              <p style={{ color: 'var(--color-text-secondary, #64748B)', fontSize: '0.85rem', marginTop: 4 }}>
                Request custom research guidance and monitoring meetings. All meeting proposals route to your department Head (HOD) for administrative approval.
              </p>
            </div>
            <button onClick={() => setShowModal(true)} className="btn-primary" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <Plus size={16} /> Request Meeting
            </button>
          </div>

          {loading ? (
            <div className="premium-preloader-container" style={{ padding: '32px 20px' }}>
              <div className="premium-preloader-spinner" style={{ width: '40px', height: '40px', borderWidth: '3px', marginBottom: '12px' }}></div>
              <div className="premium-preloader-text" style={{ fontSize: '0.85rem' }}>Loading schedules...</div>
            </div>
          ) : meetings.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#94A3B8' }}>
              <Calendar size={48} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p style={{ margin: 0, fontWeight: 600 }}>No proposed meetings found</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem' }}>Click "Request Meeting" to propose your first consultation session.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {meetings.map((meeting) => {
                const statusStyle = getStatusStyle(meeting.status);
                return (
                  <div
                    key={meeting._id}
                    style={{
                      background: 'var(--color-surface, #ffffff)',
                      border: `1px solid var(--color-border, #E2E8F0)`,
                      borderRadius: 12,
                      padding: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{
                          background: 'var(--color-bg, #F1F5F9)',
                          padding: '8px 12px',
                          borderRadius: 8,
                          textAlign: 'center',
                          border: '1px solid var(--color-border, #E2E8F0)'
                        }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-secondary, #64748B)', textTransform: 'uppercase' }}>
                            {new Date(meeting.date).toLocaleString('default', { month: 'short' })}
                          </div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text, #0F172A)' }}>
                            {new Date(meeting.date).getDate()}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--color-text, #0F172A)' }}>
                            Suggested Time: {meeting.time}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary, #64748B)' }}>
                            Proposed: {new Date(meeting.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: 12,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: statusStyle.bg,
                        color: statusStyle.text,
                        border: `1px solid ${statusStyle.border}`
                      }}>
                        {meeting.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text, #334155)', lineHeight: 1.4 }}>
                      <strong>Agenda:</strong> {meeting.reason}
                    </div>

                    {meeting.invitedAttendees && meeting.invitedAttendees.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary, #64748B)', fontWeight: 600 }}>Invited Attendees:</span>
                        {meeting.invitedAttendees.map(member => {
                          const accepted = meeting.attendees?.some(a => (a._id || a) === member._id);
                          const rejected = meeting.rejectedAttendees?.some(r => (r._id || r) === member._id);
                          let statusText = 'Pending';
                          let badgeBg = 'var(--color-bg, #F1F5F9)';
                          let badgeColor = 'var(--color-text-secondary, #64748B)';
                          if (accepted) {
                            statusText = 'Accepted';
                            badgeBg = '#D1FAE5';
                            badgeColor = '#065F46';
                          } else if (rejected) {
                            statusText = 'Rejected';
                            badgeBg = '#FEE2E2';
                            badgeColor = '#991B1B';
                          }
                          return (
                            <span
                              key={member._id}
                              style={{
                                fontSize: '0.72rem',
                                padding: '2px 8px',
                                background: badgeBg,
                                border: '1px solid var(--color-border, #E2E8F0)',
                                color: badgeColor,
                                borderRadius: 6,
                                fontWeight: 600
                              }}
                            >
                              {member.name} {member.role === 'HOD' ? '(HOD)' : `(${member.subRole || 'Faculty'})`} ({statusText})
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {meeting.remarks && (
                      <div style={{
                        background: meeting.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                        borderLeft: `3px solid ${statusStyle.text}`,
                        padding: '10px 14px',
                        borderRadius: '0 8px 8px 0',
                        fontSize: '0.8rem',
                        color: 'var(--color-text, #334155)',
                        marginTop: 4
                      }}>
                        <strong>HOD Remarks:</strong> "{meeting.remarks}"
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="card">
          <div style={{ marginBottom: 20 }}>
            <h3 className="card-title" style={{ margin: 0 }}>Departmental Research Committee (DRC) Meetings</h3>
            <p style={{ color: 'var(--color-text-secondary, #64748B)', fontSize: '0.85rem', marginTop: 4 }}>
              View evaluation sessions and formal presentations scheduled by the department Head (HOD) for synopsis and periodic research milestones.
            </p>
          </div>

          {drcLoading ? (
            <div className="premium-preloader-container" style={{ padding: '32px 20px' }}>
              <div className="premium-preloader-spinner" style={{ width: '40px', height: '40px', borderWidth: '3px', marginBottom: '12px' }}></div>
              <div className="premium-preloader-text" style={{ fontSize: '0.85rem' }}>Loading DRC schedules...</div>
            </div>
          ) : drcMeetings.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#94A3B8' }}>
              <Calendar size={48} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p style={{ margin: 0, fontWeight: 600 }}>No DRC meetings scheduled yet</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem' }}>When the HOD schedules a DRC evaluation session, it will be displayed here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {drcMeetings.map((drc) => {
                const statusStyle = getStatusStyle(drc.status);
                return (
                  <div
                    key={drc._id}
                    style={{
                      background: 'var(--color-surface, #ffffff)',
                      border: `1px solid var(--color-border, #E2E8F0)`,
                      borderRadius: 12,
                      padding: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <div style={{
                          background: 'var(--color-bg, #F1F5F9)',
                          padding: '8px 12px',
                          borderRadius: 8,
                          textAlign: 'center',
                          border: '1px solid var(--color-border, #E2E8F0)'
                        }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--color-text-secondary, #64748B)', textTransform: 'uppercase' }}>
                            {new Date(drc.scheduledDate).toLocaleString('default', { month: 'short' })}
                          </div>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text, #0F172A)' }}>
                            {new Date(drc.scheduledDate).getDate()}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--color-text, #0F172A)' }}>
                            {drc.title || 'DRC Meeting'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary, #64748B)' }}>
                            Time: {drc.scheduledTime} | Venue: {drc.venue}
                          </div>
                        </div>
                      </div>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: 12,
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        background: statusStyle.bg,
                        color: statusStyle.text,
                        border: `1px solid ${statusStyle.border}`
                      }}>
                        {drc.status}
                      </span>
                    </div>

                    {drc.agenda && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--color-text, #334155)', lineHeight: 1.4 }}>
                        <strong>Agenda:</strong> {drc.agenda}
                      </div>
                    )}

                    {drc.committeeMembers && (
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary, #64748B)', fontWeight: 600 }}>
                        Panel Members: {drc.committeeMembers}
                      </div>
                    )}

                    {drc.remarks && (
                      <div style={{
                        background: drc.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                        borderLeft: `3px solid ${statusStyle.text}`,
                        padding: '10px 14px',
                        borderRadius: '0 8px 8px 0',
                        fontSize: '0.8rem',
                        color: 'var(--color-text, #334155)',
                        marginTop: 4
                      }}>
                        <strong>Committee Remarks:</strong> "{drc.remarks}"
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 99999,
          padding: 16
        }}>
          <form
            onSubmit={handleSubmit}
            style={{
              background: 'var(--color-surface, #ffffff)',
              border: '1px solid var(--color-border, #E2E8F0)',
              borderRadius: 16,
              padding: 24,
              width: '100%',
              maxWidth: 550,
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <h3 style={{ margin: 0, color: 'var(--color-text, #0F172A)', fontWeight: 800 }}>Propose Guidance Consultation Meeting</h3>
            <p style={{ margin: 0, color: 'var(--color-text-secondary, #64748B)', fontSize: '0.8rem', lineHeight: 1.4 }}>
              Propose a schedule for a progress discussion. Administrative HOD validation is required to activate the invitation link.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Suggested Date *</label>
                <input
                  type="date"
                  className="form-input"
                  required
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Suggested Time *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={form.time}
                  onChange={e => setForm({ ...form, time: e.target.value })}
                  placeholder="e.g. 11:30 AM"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Agenda / Discussion Reason *</label>
              <textarea
                className="form-input"
                required
                rows="3"
                value={form.reason}
                onChange={e => setForm({ ...form, reason: e.target.value })}
                placeholder="Explain the purpose of the meeting, e.g. synopsis outline discussion, thesis chapter review..."
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary, #475569)', marginBottom: 6 }}>
                Checklist Department Attendees (faculties / HOD)
              </label>
              {faculty.length === 0 ? (
                <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '4px 0 0 0', fontStyle: 'italic' }}>No registered department faculty members found.</p>
              ) : (
                <div style={{
                  border: '1px solid var(--color-border, #E2E8F0)',
                  borderRadius: 8,
                  maxHeight: 150,
                  overflowY: 'auto',
                  padding: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  background: 'var(--color-bg, #F8FAFC)'
                }}>
                  {faculty.map((member) => (
                    <label
                      key={member._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: '0.8rem',
                        color: 'var(--color-text, #1E293B)',
                        cursor: 'pointer'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={form.attendees.includes(member._id)}
                        onChange={() => handleCheckboxChange(member._id)}
                      />
                      <span>
                        <strong>{member.name}</strong> — {member.role === 'HOD' ? 'Department Head (HOD)' : (member.subRole || 'Faculty')}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowModal(false);
                  setForm({ date: '', time: '', reason: '', attendees: [] });
                }}
                disabled={submitting}
                style={{ padding: '8px 16px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
                style={{ padding: '8px 20px' }}
              >
                {submitting ? 'Submitting...' : 'Submit Proposed Request'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const DocumentsTab = ({ thesis }) => {
  const toast = useToast();
  const [docs, setDocs] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', forwardedTo: '', forwardedRole: '' });

  const fetchData = async () => {
    try {
      const [dRes, fRes] = await Promise.all([
        axios.get(`${API}/additional-documents/me`, getAuthHeader()),
        axios.get(`${API}/auth/faculty`, getAuthHeader())
      ]);
      setDocs(dRes.data);
      // Filter faculty by department, excluding students, and making sure inactive aren't displayed
      const deptFaculty = fRes.data.filter(f => f.department === thesis.department && f.isActive);
      setFaculty(deptFaculty);
    } catch (err) {
      toast.error('Failed to load document details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return toast.warning('Please enter a document title.');
    if (!form.forwardedTo) return toast.warning('Please select a recipient to forward the document.');
    if (!file) return toast.warning('Please select a PDF document to upload.');

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('forwardedTo', form.forwardedTo);
      formData.append('forwardedRole', form.forwardedRole);
      formData.append('document', file);

      await axios.post(`${API}/additional-documents`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Document uploaded and forwarded successfully.');
      setShowForm(false);
      setFile(null);
      setForm({ title: '', description: '', forwardedTo: '', forwardedRole: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error uploading document.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecipientChange = (e) => {
    const val = e.target.value;
    if (!val) {
      setForm(prev => ({ ...prev, forwardedTo: '', forwardedRole: '' }));
      return;
    }
    const [id, role] = val.split(':');
    setForm(prev => ({ ...prev, forwardedTo: id, forwardedRole: role }));
  };

  // Find department HOD
  const hodUser = faculty.find(f => f.role === 'HOD');
  // Supervisor user
  const supervisorUser = thesis.supervisorId;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h3 className="card-title" style={{ margin: 0 }}>Additional Documents Vault</h3>
            <p style={{ color: 'var(--color-text-secondary, #64748B)', fontSize: '0.85rem', marginTop: 4 }}>
              Upload and forward miscellaneous academic documents, drafts, or certificates to your Supervisor or HOD.
            </p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <Plus size={16} /> Upload Document
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            style={{
              background: 'var(--color-bg, #F8FAFC)',
              padding: 20,
              borderRadius: 12,
              border: '1px solid var(--color-border, #E2E8F0)',
              marginBottom: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}
          >
            <h4 style={{ margin: 0, color: 'var(--color-text, #0F172A)' }}>Upload New Document</h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Document Title *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Research Methodology Slides, Progress Presentation"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Forward To Recipient *</label>
                <select
                  className="form-input"
                  required
                  value={form.forwardedTo ? `${form.forwardedTo}:${form.forwardedRole}` : ''}
                  onChange={handleRecipientChange}
                >
                  <option value="">-- Select Recipient --</option>
                  {supervisorUser && (
                    <option value={`${supervisorUser._id}:SUPERVISOR`}>
                      Supervisor (Prof. {supervisorUser.name})
                    </option>
                  )}
                  {hodUser && (
                    <option value={`${hodUser._id}:HOD`}>
                      Head of Department (Prof. {hodUser.name})
                    </option>
                  )}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Document Description / Context</label>
              <textarea
                className="form-input"
                rows="2"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Provide a brief context or notes regarding this uploaded file..."
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Upload File (PDF only) *</label>
              <input
                type="file"
                accept=".pdf"
                required
                onChange={e => setFile(e.target.files[0])}
                style={{ fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 4 }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  setFile(null);
                  setForm({ title: '', description: '', forwardedTo: '', forwardedRole: '' });
                }}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
              >
                {submitting ? 'Uploading...' : 'Submit Document'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="premium-preloader-container" style={{ padding: '32px 20px' }}>
            <div className="premium-preloader-spinner" style={{ width: '40px', height: '40px', borderWidth: '3px', marginBottom: '12px' }}></div>
            <div className="premium-preloader-text" style={{ fontSize: '0.85rem' }}>Loading vault documents...</div>
          </div>
        ) : docs.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94A3B8' }}>
            <FileText size={48} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <p style={{ margin: 0, fontWeight: 600 }}>No uploaded documents found</p>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem' }}>Upload additional files to supervisor or HOD for reviews.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {docs.map((doc) => (
              <div
                key={doc._id}
                style={{
                  background: 'var(--color-surface, #ffffff)',
                  border: '1px solid var(--color-border, #E2E8F0)',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 12
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <h4 style={{ margin: 0, fontSize: '0.92rem', color: 'var(--color-text, #0F172A)', fontWeight: 800 }}>{doc.title}</h4>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: 12,
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      background: doc.status === 'REVIEWED' ? '#D1FAE5' : '#FEF3C7',
                      color: doc.status === 'REVIEWED' ? '#065F46' : '#D97706',
                      flexShrink: 0
                    }}>
                      {doc.status}
                    </span>
                  </div>
                  <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary, #64748B)', lineHeight: 1.4 }}>
                    {doc.description || 'No description provided.'}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary, #64748B)' }}>
                    <div>📤 Forwarded Recipient: <strong>{doc.forwardedTo?.name || 'N/A'}</strong> ({doc.forwardedRole})</div>
                    <div style={{ marginTop: 2 }}>📅 Date: {new Date(doc.createdAt).toLocaleDateString()}</div>
                  </div>

                  {doc.remarks && (
                    <div style={{
                      background: 'rgba(16, 185, 129, 0.05)',
                      borderLeft: '3px solid #059669',
                      padding: '8px 10px',
                      borderRadius: '0 6px 6px 0',
                      fontSize: '0.78rem',
                      color: 'var(--color-text, #334155)'
                    }}>
                      <strong>Remarks:</strong> "{doc.remarks}"
                    </div>
                  )}

                  <a
                    href={`${API_BASE_URL}${doc.documentUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#0284C7',
                      textDecoration: 'none',
                      padding: '8px',
                      background: '#F0F9FF',
                      border: '1px solid #BCE4FC',
                      borderRadius: 8,
                      textAlign: 'center',
                      marginTop: 4
                    }}
                  >
                    <FileText size={14} /> View File Proof
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const RequestChangesTab = ({ thesis }) => {
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [faculty, setFaculty] = useState([]);
  const [form, setForm] = useState({ type: 'TITLE_CHANGE', proposedValue: '', reason: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const fetchRequests = async () => {
    try {
      const [rRes, fRes] = await Promise.all([
        axios.get(`${API}/lifecycle/change-requests/thesis/${thesis._id}`, getAuthHeader()),
        axios.get(`${API}/auth/faculty`, getAuthHeader())
      ]);
      setRequests(rRes.data);
      setFaculty(fRes.data);
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.proposedValue) return toast.warning('Please enter proposed value.');
    try {
      await axios.post(`${API}/lifecycle/change-requests`, { ...form, thesisId: thesis._id }, getAuthHeader());
      toast.success('Change request submitted successfully!');
      setShowForm(false);
      setForm({ type: 'TITLE_CHANGE', proposedValue: '', reason: '' });
      fetchRequests();
    } catch (err) {
      toast.error('Error submitting request.');
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h3 className="card-title" style={{ margin: 0 }}>Guide & Title Change Desk</h3>
          <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: 4 }}>
            Propose updates to your registered Thesis Title or assigned Supervisor (Guide) along with supporting academic reasons.
          </p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary" style={{ background: '#059669', display: 'flex', gap: 6, alignItems: 'center' }}>
          <Plus size={16} /> New Request
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: '#F8FAFC', padding: 20, borderRadius: 12, border: '1px solid #E2E8F0', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h4 style={{ margin: 0, color: '#0F172A' }}>Create Academic Modification Request</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Request Type</label>
              <select className="form-input" value={form.type} onChange={e => { setForm({ ...form, type: e.target.value, proposedValue: '' }); setSearchTerm(''); setShowSearchResults(false); }}>
                <option value="TITLE_CHANGE">Thesis Title Modification</option>
                <option value="GUIDE_CHANGE">Supervisor Reallocation</option>
              </select>
            </div>
            <div>
              {form.type === 'TITLE_CHANGE' ? (
                <>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Proposed New Title</label>
                  <input type="text" className="form-input" required placeholder="Enter the exact new thesis topic title..." value={form.proposedValue} onChange={e => setForm({ ...form, proposedValue: e.target.value })} />
                </>
              ) : (
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                    Choose Proposed Research Guide (Active Faculty)
                  </label>
                  {/* Select Box Trigger */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSearchResults(!showSearchResults);
                    }}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      color: form.proposedValue ? '#0F172A' : '#64748B',
                      fontWeight: form.proposedValue ? 600 : 400,
                      userSelect: 'none',
                      transition: 'border-color 0.2s',
                    }}
                    onMouseOver={e => e.currentTarget.style.borderColor = '#94A3B8'}
                    onMouseOut={e => e.currentTarget.style.borderColor = '#CBD5E1'}
                  >
                    <span>
                      {form.proposedValue 
                        ? (() => {
                            const selected = faculty.find(f => f._id === form.proposedValue);
                            return selected 
                              ? `👨‍🏫 ${selected.name} (${selected.department})`
                              : 'Select Faculty Member'
                          })()
                        : 'Choose an active supervisor...'
                      }
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                      {showSearchResults ? '▲' : '▼'}
                    </span>
                  </div>

                  {/* Dropdown panel */}
                  {showSearchResults && (() => {
                    const activeFacultyList = faculty.filter(f => {
                      const isActive = f.isActive !== false;
                      const matchesSearch = 
                        f.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        f.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        f.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        f.specialization?.toLowerCase().includes(searchTerm.toLowerCase());
                      return isActive && matchesSearch;
                    });

                    return (
                      <div 
                        onClick={e => e.stopPropagation()}
                        style={{ 
                          position: 'absolute', 
                          top: '100%', 
                          left: 0, 
                          right: 0, 
                          background: 'white', 
                          border: '1px solid #CBD5E1', 
                          borderRadius: 8, 
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', 
                          zIndex: 99,
                          marginTop: 4,
                          display: 'flex',
                          flexDirection: 'column',
                          overflow: 'hidden'
                        }}
                      >
                        {/* Search input and button inside the dropdown */}
                        <div style={{ padding: '10px 12px', borderBottom: '1px solid #E2E8F0', background: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                              Active Faculty Directory ({activeFacultyList.length} matches)
                            </span>
                            <button 
                              type="button" 
                              onClick={() => setShowSearchResults(false)} 
                              style={{ background: 'none', border: 'none', fontSize: '0.7rem', color: '#EF4444', cursor: 'pointer', fontWeight: 700 }}
                            >
                              Close
                            </button>
                          </div>
                          
                          <div style={{ display: 'flex', gap: 8 }}>
                            <input 
                              type="text" 
                              className="form-input" 
                              placeholder="Type name, department, or specialization..." 
                              value={searchTerm} 
                              onChange={e => setSearchTerm(e.target.value)}
                              style={{ flex: 1, fontSize: '0.82rem', padding: '6px 10px', height: '36px', margin: 0 }}
                              onClick={e => e.stopPropagation()}
                            />
                            <button 
                              type="button" 
                              onClick={() => {
                                // Searching is live as you type, but this button explicitly confirms and handles search
                              }}
                              className="btn-primary" 
                              style={{ background: '#059669', padding: '6px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px', height: '36px' }}
                            >
                              🔍 Search
                            </button>
                          </div>
                        </div>

                        {/* List of active faculties */}
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          {activeFacultyList.length === 0 ? (
                            <div style={{ padding: 16, fontSize: '0.8rem', color: '#64748B', fontStyle: 'italic', textAlign: 'center' }}>
                              No active faculty members found.
                            </div>
                          ) : (
                            activeFacultyList.map(f => (
                              <div 
                                key={f._id} 
                                onClick={() => {
                                  setForm({ ...form, proposedValue: f._id });
                                  setShowSearchResults(false);
                                }}
                                style={{ 
                                  padding: '10px 14px', 
                                  cursor: 'pointer', 
                                  borderBottom: '1px solid #F1F5F9', 
                                  background: form.proposedValue === f._id ? '#EFF6FF' : 'white',
                                  transition: 'background-color 0.2s',
                                  textAlign: 'left'
                                }}
                                onMouseOver={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                                onMouseOut={e => e.currentTarget.style.backgroundColor = form.proposedValue === f._id ? '#EFF6FF' : 'white'}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>{f.name}</span>
                                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#059669', background: '#D1FAE5', padding: '2px 6px', borderRadius: 4 }}>
                                    {f.department}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748B', marginTop: 4 }}>
                                  <span>{f.designation || 'Faculty Supervisor'}</span>
                                  {f.specialization && <span>Focus: {f.specialization}</span>}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Supporting Rationale & Academic Reason</label>
            <textarea className="form-input" required rows={3} placeholder="Please detail the academic ground or scientific reason for this reallocation/change request..." value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowForm(false)} className="btn-outline" style={{ padding: '8px 16px' }}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ background: '#133A26', padding: '8px 16px' }}>Submit Request</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="premium-preloader-container" style={{ padding: '20px' }}>
          <div className="premium-preloader-spinner" style={{ width: '40px', height: '40px', borderWidth: '3px', marginBottom: '12px' }}></div>
          <div className="premium-preloader-text" style={{ fontSize: '0.85rem' }}>Loading requests...</div>
        </div>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '36px', color: '#64748B', background: '#F8FAFC', borderRadius: 8 }}>
          No guide or title modification requests logged yet.
        </div>
      ) : (
        <div className="file-list">
          <div className="file-header">
            <div style={{ flex: 1.5 }}>Type</div>
            <div style={{ flex: 2 }}>Current Value</div>
            <div style={{ flex: 2.5 }}>Proposed Value</div>
            <div style={{ flex: 2.5 }}>Reason</div>
            <div style={{ flex: 1.2 }}>Status</div>
            <div style={{ flex: 2 }}>Remarks</div>
          </div>
          {requests.map(r => (
            <div key={r._id} className="file-item">
              <div style={{ flex: 1.5, fontWeight: 600, fontSize: '0.85rem', color: '#1E3A8A' }}>
                {r.type === 'TITLE_CHANGE' ? '📝 Title Change' : '🤝 Guide Change'}
              </div>
              <div style={{ flex: 2, fontSize: '0.85rem', color: '#64748B' }}>{r.currentValue}</div>
              <div style={{ flex: 2.5, fontSize: '0.85rem', fontWeight: 600 }}>
                {r.type === 'GUIDE_CHANGE' ? (faculty.find(f => f._id === r.proposedValue)?.name || 'New Faculty') : r.proposedValue}
              </div>
              <div style={{ flex: 2.5, fontSize: '0.85rem' }}>{r.reason}</div>
              <div style={{ flex: 1.2 }}>
                <span style={{ 
                  padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600,
                  background: r.status === 'APPROVED' ? '#D1FAE5' : r.status === 'REJECTED' ? '#FEE2E2' : '#FEF3C7',
                  color: r.status === 'APPROVED' ? '#065F46' : r.status === 'REJECTED' ? '#991B1B' : '#D97706'
                }}>
                  {r.status}
                </span>
              </div>
              <div style={{ flex: 2, fontSize: '0.85rem', color: '#475569' }}>{r.remarks || '—'}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CertificatesTab = ({ thesis }) => {
  const [hasVerifiedPubs, setHasVerifiedPubs] = useState(false);
  const [hasVerifiedRacs, setHasVerifiedRacs] = useState(false);

  useEffect(() => {
    axios.get(`${API}/lifecycle/publications/thesis/${thesis._id}`, getAuthHeader())
      .then(res => setHasVerifiedPubs(res.data.some(p => p.status === 'VERIFIED')))
      .catch(() => {});
    axios.get(`${API}/lifecycle/rac/thesis/${thesis._id}`, getAuthHeader())
      .then(res => setHasVerifiedRacs(res.data.some(r => r.status === 'SATISFACTORY')))
      .catch(() => {});
  }, []);

  const certs = [
    {
      type: 'REGISTRATION',
      title: 'Ph.D. Registration Certificate',
      desc: 'Official certificate verifying scholar registration, topic approval, and department affiliation.',
      enabled: thesis.enrollmentVerified
    },
    {
      type: 'COURSEWORK',
      title: 'Course Work Certificate',
      desc: 'Certifies successful completion of all core coursework, assignments, and curriculum exams.',
      enabled: thesis.status !== 'COURSEWORK'
    },
    {
      type: 'PUBLICATIONS',
      title: 'Research Publications Log',
      desc: 'Log certificate validating peer-reviewed articles and research papers published.',
      enabled: hasVerifiedPubs
    },
    {
      type: 'RAC',
      title: 'Research Progress Certificate',
      desc: 'Official certificate verifying satisfactory periodic Research Advisory Committee reviews.',
      enabled: ['SUBMITTED', 'AWARDED'].includes(thesis.status) || hasVerifiedRacs
    }
  ];

  return (
    <div>
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 className="card-title">H.P. University Academic Credentials</h3>
        <p style={{ color: '#64748B', fontSize: '0.85rem' }}>
          Upon formal HOD reviews and supervisor clearances, download official printable registration, coursework, progress, and publication credentials certified by Himachal Pradesh University.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {certs.map(c => (
          <div key={c.type} className="card" style={{ 
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between', opacity: c.enabled ? 1 : 0.65, 
            borderLeft: `6px solid ${c.enabled ? '#059669' : '#CBD5E1'}`, transition: 'all 0.2s' 
          }}>
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: '#0F172A' }}>{c.title}</h4>
              <p style={{ color: '#64748B', fontSize: '0.85rem', margin: '0 0 16px 0', lineHeight: 1.5 }}>{c.desc}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ 
                padding: '4px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600,
                background: c.enabled ? '#D1FAE5' : '#F3F4F6', color: c.enabled ? '#065F46' : '#64748B'
              }}>
                {c.enabled ? '✓ Unlocked' : '🔒 Locked'}
              </span>
              {c.enabled ? (
                <a 
                  href={`${API_URL}/lifecycle/certificates/${thesis._id}/${c.type}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn-primary" 
                  style={{ background: '#059669', fontSize: '0.8rem', padding: '8px 16px', display: 'flex', gap: 6, alignItems: 'center', textDecoration: 'none' }}
                >
                  View / Print
                </a>
              ) : (
                <button disabled className="btn-primary" style={{ background: '#CBD5E1', color: '#64748B', cursor: 'not-allowed', fontSize: '0.8rem', padding: '8px 16px' }}>
                  View / Print
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Phase 5 Active Research Tab views ──
const SixMonthReportsTab = ({ thesis, milestones = [], onSubmit }) => {
  const toast = useToast();
  const reports = milestones.filter(m => m.type === '6_MONTH_REPORT') || [];
  const [file, setFile] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (id) => {
    if (!file) return toast.warning('Please choose a PDF document first.');
    setLoading(true);
    try {
      await onSubmit(id, file);
      toast.success('6-Month Progress Report submitted successfully!');
      setFile(null);
      setUploadingId(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload document.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 className="card-title">6-Month Progress Reports Timeline</h3>
      <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: 24 }}>
        Chronological portal for uploading mandatory periodic progress reports. Track supervisor reviews and advisory committee clearances.
      </p>

      {reports.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748B', background: '#F8FAFC', borderRadius: 12 }}>
          <span>⏳</span> No 6-month progress report milestones assigned yet. Your supervisor/admin will allocate these deliverables.
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: '24px', borderLeft: '3px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {reports.map((report, idx) => {
            const isSubmitted = ['SUBMITTED', 'APPROVED', 'REVISION_REQUIRED'].includes(report.status);
            const isApproved = report.status === 'APPROVED';
            const isRevision = report.status === 'REVISION_REQUIRED';
            const isPending = report.status === 'PENDING';

            let dotBg = '#CBD5E1';
            let titleColor = '#475569';
            if (isApproved) { dotBg = '#10B981'; titleColor = '#065F46'; }
            else if (isRevision) { dotBg = '#EF4444'; titleColor = '#B91C1C'; }
            else if (isSubmitted) { dotBg = '#3B82F6'; titleColor = '#1D4ED8'; }

            return (
              <div key={report._id} style={{ position: 'relative' }}>
                {/* Timeline Dot */}
                <div style={{
                  position: 'absolute',
                  left: '-34px',
                  top: '4px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: dotBg,
                  border: '4px solid #FFFFFF',
                  boxShadow: '0 0 0 2px ' + dotBg
                }} />

                {/* Content Panel */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: titleColor }}>
                        {report.title}
                      </h4>
                      <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                        Due Date: {report.dueDate ? new Date(report.dueDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      background: isApproved ? '#D1FAE5' : isRevision ? '#FEE2E2' : isSubmitted ? '#DBEAFE' : '#FEF3C7',
                      color: isApproved ? '#065F46' : isRevision ? '#991B1B' : isSubmitted ? '#1D4ED8' : '#D97706'
                    }}>
                      {report.status}
                    </span>
                  </div>

                  {/* Document Link */}
                  {report.documentUrl && (
                    <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.85rem' }}>📄</span>
                      <a href={`${API_BASE_URL}${report.documentUrl}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: '#2563EB', fontWeight: 600, textDecoration: 'underline' }}>
                        View Submitted Report
                      </a>
                    </div>
                  )}

                  {/* Comments Panel */}
                  {report.comments?.length > 0 && (
                    <div style={{ marginTop: '16px', padding: '12px', background: '#FFFBEB', borderRadius: '8px', borderLeft: '4px solid #F59E0B' }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#B45309', marginBottom: '6px' }}>Advisory Committee Feedback:</div>
                      {report.comments.map((c, i) => (
                        <div key={i} style={{ fontSize: '0.82rem', color: '#78350F', fontStyle: 'italic', marginBottom: '4px' }}>
                          "{c.text}" — <span style={{ fontWeight: 600 }}>{c.authorName}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Submission Form */}
                  {(isPending || isRevision) && (
                    <div style={{ marginTop: '16px', borderTop: '1px dashed #CBD5E1', paddingTop: '16px' }}>
                      {uploadingId === report._id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Select Progress Report PDF</label>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} style={{ fontSize: '0.85rem' }} />
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => setUploadingId(null)} className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Cancel</button>
                              <button onClick={() => handleUpload(report._id)} className="btn-primary" disabled={loading} style={{ background: '#133A26', padding: '6px 16px', fontSize: '0.8rem' }}>
                                {loading ? 'Submitting...' : 'Upload & Submit'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => { setUploadingId(report._id); setFile(null); }} className="btn-primary" style={{ background: '#133A26', padding: '6px 14px', fontSize: '0.8rem', display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <Upload size={14} /> Submit Report
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ChapterDraftsTab = ({ thesis, milestones = [], onSubmit }) => {
  const toast = useToast();
  const drafts = milestones.filter(m => m.type === 'CHAPTER_DRAFT') || [];
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCreateAndUpload = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return toast.warning('Please enter the chapter title.');
    if (!file) return toast.warning('Please select a PDF document.');
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/milestones/create`, {
        thesisId: thesis._id,
        type: 'CHAPTER_DRAFT',
        title: newTitle.trim(),
        sequence: drafts.length + 1
      }, getAuthHeader());

      await onSubmit(res.data._id, file);

      toast.success('Chapter Draft uploaded successfully!');
      setNewTitle('');
      setFile(null);
      setShowAddForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload chapter draft.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h3 className="card-title" style={{ margin: 0 }}>Chapter Drafts Workspace</h3>
          <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: 4 }}>
            Iteratively submit your PhD thesis chapter drafts for adviser review and track text revisions and approval.
          </p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary" style={{ background: '#059669', display: 'flex', gap: '6px', alignItems: 'center' }}>
          <Plus size={16} /> Upload Draft
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleCreateAndUpload} style={{ background: '#F8FAFC', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h4 style={{ margin: 0, color: '#0F172A' }}>Upload Chapter Draft</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Chapter Title (e.g. Chapter 1: Introduction)</label>
              <input type="text" className="form-input" required value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Chapter 1: Literature Review" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Chapter Document Proof (PDF)</label>
              <input type="file" accept=".pdf" required onChange={e => setFile(e.target.files[0])} style={{ fontSize: '0.85rem', marginTop: '6px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowAddForm(false)} className="btn-outline" style={{ padding: '8px 16px' }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ background: '#133A26', padding: '8px 16px' }}>
              {loading ? 'Submitting...' : 'Upload & Submit Draft'}
            </button>
          </div>
        </form>
      )}

      {drafts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '36px', color: '#64748B', background: '#F8FAFC', borderRadius: 8 }}>
          No chapter drafts uploaded yet. Complete your outline and upload the first draft!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {drafts.map(d => (
            <div key={d._id} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>{d.title}</h4>
                  <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#64748B' }}>
                    Uploaded at: {d.submittedAt ? new Date(d.submittedAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <span style={{
                  padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700,
                  background: d.status === 'APPROVED' ? '#D1FAE5' : d.status === 'REVISION_REQUIRED' ? '#FEE2E2' : d.status === 'SUBMITTED' ? '#DBEAFE' : '#FEF3C7',
                  color: d.status === 'APPROVED' ? '#065F46' : d.status === 'REVISION_REQUIRED' ? '#991B1B' : d.status === 'SUBMITTED' ? '#1D4ED8' : '#D97706'
                }}>
                  {d.status}
                </span>
              </div>

              {d.documentUrl && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span>📄</span>
                  <a href={`${API_BASE_URL}${d.documentUrl}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: '#2563EB', fontWeight: 600, textDecoration: 'underline' }}>
                    View Uploaded Chapter
                  </a>
                </div>
              )}

              {d.comments?.length > 0 && (
                <div style={{ marginTop: '16px', padding: '12px', background: '#FFFBEB', borderRadius: '8px', borderLeft: '4px solid #F59E0B' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#B45309', marginBottom: '6px' }}>Supervisor Feedback:</div>
                  {d.comments.map((c, i) => (
                    <div key={i} style={{ fontSize: '0.82rem', color: '#78350F', fontStyle: 'italic', marginBottom: '4px' }}>
                      "{c.text}" — <span style={{ fontWeight: 600 }}>{c.authorName}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


const ProfileTab = () => {
  const { user, updateProfile, uploadAvatar, uploadProfileDocument, fetchMe } = useContext(AuthContext);
  const { thesis, createThesis, fetchMyThesis } = useContext(ThesisContext);
  const toast = useToast();
  const [subTab, setSubTab] = useState('general'); // general | academic | guide
  const [loading, setLoading] = useState(false);

  // Fetch fresh user data from server on mount to avoid stale localStorage cache
  useEffect(() => {
    fetchMe();
  }, []);
  const [registering, setRegistering] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState('');
  const [selectedFileNames, setSelectedFileNames] = useState({});
  const [editModes, setEditModes] = useState({
    general: false,
    class10: false,
    class12: false,
    graduation: false,
    postGraduation: false,
    mphil: false,
    netJrf: false,
    fellowships: false
  });
  // Common ERP fields
  const [dob, setDob] = useState(user?.profile?.dob ? user.profile.dob.split('T')[0] : '');
  const [gender, setGender] = useState(user?.profile?.gender || '');
  const [category, setCategory] = useState(user?.profile?.category || '');
  const [fatherName, setFatherName] = useState(user?.profile?.fatherName || '');
  const [motherName, setMotherName] = useState(user?.profile?.motherName || '');
  const [nationality, setNationality] = useState(user?.profile?.nationality || 'Indian');
  const [admissionDate, setAdmissionDate] = useState(user?.profile?.admissionDate ? user.profile.admissionDate.split('T')[0] : '');
  const [enrollmentNumber, setEnrollmentNumber] = useState(user?.profile?.enrollmentNumber || '');
  const [phdMode, setPhdMode] = useState(user?.profile?.phdMode || '');
  const [specialization, setSpecialization] = useState(user?.profile?.specialization || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.profile?.phoneNumber || '');
  const [address, setAddress] = useState(user?.profile?.address || '');
  const [areaOfInterest, setAreaOfInterest] = useState(user?.profile?.areaOfInterest || '');
  const [academicBackground, setAcademicBackground] = useState(user?.profile?.academicBackground || '');
  const [thesisTitle, setThesisTitle] = useState(user?.profile?.thesisTitle || '');
  const [thesisSummary, setThesisSummary] = useState(user?.profile?.thesisSummary || '');
  const [thesisKeywords, setThesisKeywords] = useState(user?.profile?.thesisKeywords || '');
  // Class 10
  const [class10Roll, setClass10Roll] = useState(user?.profile?.qualifications?.class10?.rollNo || '');
  const [class10Board, setClass10Board] = useState(user?.profile?.qualifications?.class10?.board || '');
  const [class10School, setClass10School] = useState(user?.profile?.qualifications?.class10?.school || '');
  const [class10Marks, setClass10Marks] = useState(user?.profile?.qualifications?.class10?.marksObtained || '');
  const [class10Total, setClass10Total] = useState(user?.profile?.qualifications?.class10?.totalMarks || '');
  const [class10Percentage, setClass10Percentage] = useState(user?.profile?.qualifications?.class10?.percentage || '');

  // Class 12
  const [class12Roll, setClass12Roll] = useState(user?.profile?.qualifications?.class12?.rollNo || '');
  const [class12Board, setClass12Board] = useState(user?.profile?.qualifications?.class12?.board || '');
  const [class12School, setClass12School] = useState(user?.profile?.qualifications?.class12?.school || '');
  const [class12Marks, setClass12Marks] = useState(user?.profile?.qualifications?.class12?.marksObtained || '');
  const [class12Total, setClass12Total] = useState(user?.profile?.qualifications?.class12?.totalMarks || '');
  const [class12Percentage, setClass12Percentage] = useState(user?.profile?.qualifications?.class12?.percentage || '');

  // Graduation
  const [gradRoll, setGradRoll] = useState(user?.profile?.qualifications?.graduation?.rollNo || '');
  const [gradDegree, setGradDegree] = useState(user?.profile?.qualifications?.graduation?.degree || '');
  const [gradCollege, setGradCollege] = useState(user?.profile?.qualifications?.graduation?.college || '');
  const [gradUniversity, setGradUniversity] = useState(user?.profile?.qualifications?.graduation?.university || '');
  const [gradMarks, setGradMarks] = useState(user?.profile?.qualifications?.graduation?.marksObtained || '');
  const [gradTotal, setGradTotal] = useState(user?.profile?.qualifications?.graduation?.totalMarks || '');
  const [gradPercentage, setGradPercentage] = useState(user?.profile?.qualifications?.graduation?.percentage || '');

  // Post Graduation
  const [pgRoll, setPgRoll] = useState(user?.profile?.qualifications?.postGraduation?.rollNo || '');
  const [pgDegree, setPgDegree] = useState(user?.profile?.qualifications?.postGraduation?.degree || '');
  const [pgCollege, setPgCollege] = useState(user?.profile?.qualifications?.postGraduation?.college || '');
  const [pgUniversity, setPgUniversity] = useState(user?.profile?.qualifications?.postGraduation?.university || '');
  const [pgMarks, setPgMarks] = useState(user?.profile?.qualifications?.postGraduation?.marksObtained || '');
  const [pgTotal, setPgTotal] = useState(user?.profile?.qualifications?.postGraduation?.totalMarks || '');
  const [pgPercentage, setPgPercentage] = useState(user?.profile?.qualifications?.postGraduation?.percentage || '');

  // NET JRF
  const [mphilDone, setMphilDone] = useState(
    user?.profile?.qualifications?.mphil?.done === true ? 'YES' : 
    user?.profile?.qualifications?.mphil?.done === false ? 'NO' : ''
  );
  const [mphilUniversity, setMphilUniversity] = useState(user?.profile?.qualifications?.mphil?.university || '');
  const [mphilPassingYear, setMphilPassingYear] = useState(user?.profile?.qualifications?.mphil?.passingYear || '');
  const [mphilTotalMarks, setMphilTotalMarks] = useState(user?.profile?.qualifications?.mphil?.totalMarks || '');
  const [mphilMarksObtained, setMphilMarksObtained] = useState(user?.profile?.qualifications?.mphil?.marksObtained || '');
  const [mphilPercentage, setMphilPercentage] = useState(user?.profile?.qualifications?.mphil?.percentage || '');

  const [netJrfQualified, setNetJrfQualified] = useState(
    user?.profile?.qualifications?.netJrf?.qualified === true ? 'YES' : 
    user?.profile?.qualifications?.netJrf?.qualified === false ? 'NO' : ''
  );
  const [netJrfCertNumber, setNetJrfCertNumber] = useState(user?.profile?.qualifications?.netJrf?.certNumber || '');
  const [netJrfRoll, setNetJrfRoll] = useState(user?.profile?.qualifications?.netJrf?.rollNo || '');
  const [netJrfRank, setNetJrfRank] = useState(user?.profile?.qualifications?.netJrf?.rank || '');
  const [netJrfScore, setNetJrfScore] = useState(user?.profile?.qualifications?.netJrf?.score || '');
  const [netJrfIssueDate, setNetJrfIssueDate] = useState(user?.profile?.qualifications?.netJrf?.issueDate ? user.profile.qualifications.netJrf.issueDate.split('T')[0] : '');

  // Other Exam
  const [fellowships, setFellowships] = useState(user?.profile?.qualifications?.fellowships || []);

  // Guide Selection
  const [preferredGuideId, setPreferredGuideId] = useState(user?.profile?.preferredGuideId || '');
  const [faculties, setFaculties] = useState([]);

  useEffect(() => {
    if (user?.profile) {
      setDob(user.profile.dob ? user.profile.dob.split('T')[0] : '');
      setGender(user.profile.gender || '');
      setCategory(user.profile.category || '');
      setFatherName(user.profile.fatherName || '');
      setMotherName(user.profile.motherName || '');
      setNationality(user.profile.nationality || 'Indian');
      setAdmissionDate(user.profile.admissionDate ? user.profile.admissionDate.split('T')[0] : '');
      setEnrollmentNumber(user.profile.enrollmentNumber || '');
      setPhdMode(user.profile.phdMode || '');
      setSpecialization(user.profile.specialization || '');
      setPhoneNumber(user.profile.phoneNumber || '');
      setAddress(user.profile.address || '');
      setAreaOfInterest(user.profile.areaOfInterest || '');
      setAcademicBackground(user.profile.academicBackground || '');
      setPreferredGuideId(user.profile.preferredGuideId || '');
      setThesisTitle(user.profile.thesisTitle || '');
      setThesisSummary(user.profile.thesisSummary || '');
      setThesisKeywords(user.profile.thesisKeywords || '');
      const q = user.profile.qualifications;
      setClass10Roll(q?.class10?.rollNo || '');
      setClass10Board(q?.class10?.board || '');
      setClass10School(q?.class10?.school || '');
      setClass10Marks(q?.class10?.marksObtained || '');
      setClass10Total(q?.class10?.totalMarks || '');
      setClass10Percentage(q?.class10?.percentage || '');

      // Class 12
      setClass12Roll(q?.class12?.rollNo || '');
      setClass12Board(q?.class12?.board || '');
      setClass12School(q?.class12?.school || '');
      setClass12Marks(q?.class12?.marksObtained || '');
      setClass12Total(q?.class12?.totalMarks || '');
      setClass12Percentage(q?.class12?.percentage || '');

      // Graduation
      setGradRoll(q?.graduation?.rollNo || '');
      setGradDegree(q?.graduation?.degree || '');
      setGradCollege(q?.graduation?.college || '');
      setGradUniversity(q?.graduation?.university || '');
      setGradMarks(q?.graduation?.marksObtained || '');
      setGradTotal(q?.graduation?.totalMarks || '');
      setGradPercentage(q?.graduation?.percentage || '');

      // Post Graduation
      setPgRoll(q?.postGraduation?.rollNo || '');
      setPgDegree(q?.postGraduation?.degree || '');
      setPgCollege(q?.postGraduation?.college || '');
      setPgUniversity(q?.postGraduation?.university || '');
      setPgMarks(q?.postGraduation?.marksObtained || '');
      setPgTotal(q?.postGraduation?.totalMarks || '');
      setPgPercentage(q?.postGraduation?.percentage || '');

      // NET JRF
      setMphilDone(
        q?.mphil?.done === true ? 'YES' : 
        q?.mphil?.done === false ? 'NO' : ''
      );
      setMphilUniversity(q?.mphil?.university || '');
      setMphilPassingYear(q?.mphil?.passingYear || '');
      setMphilTotalMarks(q?.mphil?.totalMarks || '');
      setMphilMarksObtained(q?.mphil?.marksObtained || '');
      setMphilPercentage(q?.mphil?.percentage || '');

      setNetJrfQualified(
        q?.netJrf?.qualified === true ? 'YES' : 
        q?.netJrf?.qualified === false ? 'NO' : ''
      );
      setNetJrfCertNumber(q?.netJrf?.certNumber || '');
      setNetJrfRoll(q?.netJrf?.rollNo || '');
      setNetJrfRank(q?.netJrf?.rank || '');
      setNetJrfScore(q?.netJrf?.score || '');
      setNetJrfIssueDate(q?.netJrf?.issueDate ? q.netJrf.issueDate.split('T')[0] : '');

      // Other
      setFellowships(q?.fellowships || []);

      // Initialize editModes based on if database has values
      setEditModes(prev => ({
        general: prev.general || !user?.profile?.dob,
        class10: prev.class10 || !q?.class10?.rollNo,
        class12: prev.class12 || !q?.class12?.rollNo,
        graduation: prev.graduation || !q?.graduation?.rollNo,
        postGraduation: prev.postGraduation || !q?.postGraduation?.rollNo,
        netJrf: prev.netJrf || q?.netJrf?.qualified === undefined || (q?.netJrf?.qualified === true && !q?.netJrf?.rollNo),
        fellowships: prev.fellowships || !q?.fellowships
      }));
    } else {
      setEditModes({
        general: true,
        class10: true,
        class12: true,
        graduation: true,
        postGraduation: true,
        netJrf: true,
        other: true
      });
    }
  }, [user]);

  useEffect(() => {
    axios.get(`${API_URL}/auth/faculty`, getAuthHeader())
      .then(res => {
        if (Array.isArray(res.data)) {
          // Only show faculties registered in scholar's department
          const deptFac = res.data.filter(f => f.department === user?.department);
          setFaculties(deptFac);
        }
      })
      .catch(err => console.error('Error fetching department faculty:', err));
  }, [user?.department]);

  const isGeneralInfoComplete = () => {
    return !!(
      dob && dob.trim() &&
      gender && gender.trim() &&
      category && category.trim() &&
      nationality && nationality.trim() &&
      fatherName && fatherName.trim() &&
      motherName && motherName.trim() &&
      phoneNumber && phoneNumber.trim() &&
      address && address.trim() &&
      enrollmentNumber && enrollmentNumber.trim() &&
      admissionDate && admissionDate.trim() &&
      phdMode && phdMode.trim() &&
      specialization && specialization.trim() &&
      areaOfInterest && areaOfInterest.trim() &&
      thesisTitle && thesisTitle.trim() &&
      thesisSummary && thesisSummary.trim() &&
      thesisKeywords && thesisKeywords.trim()
    );
  };

  const isAcademicQualificationsComplete = () => {
    const q = user?.profile?.qualifications;
    if (!q) return false;

    // Check roll numbers, marks, board/school/college/university, percentages, and certificates
    const class10Ok = !!(class10Roll && class10Board && class10School && class10Marks && class10Total && class10Percentage && q?.class10?.certificateUrl);
    const class12Ok = !!(class12Roll && class12Board && class12School && class12Marks && class12Total && class12Percentage && q?.class12?.certificateUrl);
    const gradOk = !!(gradRoll && gradDegree && gradCollege && gradUniversity && gradMarks && gradTotal && gradPercentage && q?.graduation?.certificateUrl);
    const pgOk = !!(pgRoll && pgDegree && pgCollege && pgUniversity && pgMarks && pgTotal && pgPercentage && q?.postGraduation?.certificateUrl);

    if (!class10Ok || !class12Ok || !gradOk || !pgOk) return false;

    if (mphilDone === 'YES') {
      const mphilOk = !!(mphilUniversity && mphilPassingYear && mphilTotalMarks && mphilMarksObtained && mphilPercentage && q?.mphil?.certificateUrl);
      if (!mphilOk) return false;
    }

    if (netJrfQualified === 'YES') {
      const netJrfOk = !!(netJrfCertNumber && netJrfRoll && netJrfRank && netJrfScore && netJrfIssueDate && q?.netJrf?.certificateUrl);
      if (!netJrfOk) return false;
    }

    return true;
  };


  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarLoading(true);
    const res = await uploadAvatar(file);
    setAvatarLoading(false);
    if (res.success) {
      toast.success('Profile picture updated successfully!');
    } else {
      toast.error('Failed to upload profile picture: ' + res.message);
    }
  };

  const handleDocUpload = async (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFileNames(prev => ({ ...prev, [docType]: file.name }));
    setUploadingDoc(docType);
    const res = await uploadProfileDocument(file, docType);
    setUploadingDoc('');
    if (res.success) {
      toast.success(`${docType.replace(/([A-Z])/g, ' $1').toUpperCase()} Certificate uploaded successfully!`);
    } else {
      toast.error(`Upload failed: ${res.message}`);
    }
  };

  const handleSaveAcademicDetails = async (e) => {
    e.preventDefault();
    const q = user?.profile?.qualifications;
    const missing = [];
    if (!q?.class10?.rollNo || !q?.class10?.certificateUrl) missing.push('Class 10 Details & Certificate');
    if (!q?.class12?.rollNo || !q?.class12?.certificateUrl) missing.push('Class 12 Details & Certificate');
    if (!q?.graduation?.rollNo || !q?.graduation?.certificateUrl) missing.push('Graduation Details & Certificate');
    if (!q?.postGraduation?.rollNo || !q?.postGraduation?.certificateUrl) missing.push('Post Graduation Details & Certificate');
    
    if (mphilDone === 'YES') {
      if (!q?.mphil?.university || !q?.mphil?.certificateUrl) {
        missing.push('M.Phil Details & Certificate');
      }
    }
    
    if (netJrfQualified === 'YES') {
      if (!q?.netJrf?.rollNo || !q?.netJrf?.certificateUrl) {
        missing.push('NET JRF Details & Certificate');
      }
    }
    
    if (missing.length > 0) {
      toast.error(`Please save all required academic qualifications and upload their certificates first: ${missing.join(', ')}`);
      return;
    }
    
    await handleUpdate(e);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    const cleanedPhone = phoneNumber.trim().replace(/[\s\-()]/g, '');
    const indianPhoneRegex = /^(\+91|91|0)?[6-9]\d{9}$/;
    if (!indianPhoneRegex.test(cleanedPhone)) {
      toast.error('Please enter a valid 10-digit Indian phone number (starts with 6-9).');
      setLoading(false);
      return;
    }

    const payload = {
      dob,
      gender,
      category,
      fatherName,
      motherName,
      nationality,
      admissionDate,
      enrollmentNumber,
      phdMode,
      specialization,
      phoneNumber,
      address,
      areaOfInterest,
      academicBackground,
      preferredGuideId,
      thesisTitle,
      thesisSummary,
      thesisKeywords,
      qualifications: {
        class10: {
          rollNo: class10Roll,
          board: class10Board,
          school: class10School,
          marksObtained: class10Marks,
          totalMarks: class10Total,
          percentage: class10Percentage,
          certificateUrl: user?.profile?.qualifications?.class10?.certificateUrl
        },
        class12: {
          rollNo: class12Roll,
          board: class12Board,
          school: class12School,
          marksObtained: class12Marks,
          totalMarks: class12Total,
          percentage: class12Percentage,
          certificateUrl: user?.profile?.qualifications?.class12?.certificateUrl
        },
        graduation: {
          rollNo: gradRoll,
          degree: gradDegree,
          college: gradCollege,
          university: gradUniversity,
          marksObtained: gradMarks,
          totalMarks: gradTotal,
          percentage: gradPercentage,
          certificateUrl: user?.profile?.qualifications?.graduation?.certificateUrl
        },
        postGraduation: {
          rollNo: pgRoll,
          degree: pgDegree,
          college: pgCollege,
          university: pgUniversity,
          marksObtained: pgMarks,
          totalMarks: pgTotal,
          percentage: pgPercentage,
          certificateUrl: user?.profile?.qualifications?.postGraduation?.certificateUrl
        },
        mphil: {
          done: mphilDone === 'YES',
          university: mphilUniversity,
          passingYear: mphilPassingYear,
          totalMarks: mphilTotalMarks,
          marksObtained: mphilMarksObtained,
          percentage: mphilPercentage,
          certificateUrl: user?.profile?.qualifications?.mphil?.certificateUrl
        },
        netJrf: {
          qualified: netJrfQualified === 'YES',
          certNumber: netJrfCertNumber,
          rollNo: netJrfRoll,
          rank: netJrfRank,
          score: netJrfScore,
          issueDate: netJrfIssueDate,
          certificateUrl: user?.profile?.qualifications?.netJrf?.certificateUrl
        },
        fellowships: fellowships.map((f, i) => ({
          ...f,
          certificateUrl: user?.profile?.qualifications?.fellowships?.[i]?.certificateUrl || f.certificateUrl || ''
        }))
      }
    };

    const res = await updateProfile(payload);
    setLoading(false);
    if (res.success) {
      let msg = 'PhD Scholar profile details updated successfully!';
      if (subTab === 'general') {
        msg = 'General Information saved successfully!';
        setEditModes(prev => ({ ...prev, general: false }));
      } else if (subTab === 'academic') {
        msg = 'Academic details saved successfully!';
      } else if (subTab === 'guide') {
        msg = 'Preferred guide details saved successfully!';
      }
      toast.success(msg);
    } else {
      toast.error('Failed to update profile: ' + res.message);
    }
  };

  const saveSection = async (sectionKey) => {
    setLoading(true);
    let sectionData = {};
    
    if (sectionKey === 'class10') {
      if (!class10Roll.trim() || !class10Board.trim() || !class10School.trim() || !class10Marks.trim() || !class10Total.trim() || !class10Percentage.trim()) {
        toast.error('Please fill in all Class 10 details before saving.');
        setLoading(false);
        return;
      }
      sectionData = {
        rollNo: class10Roll,
        board: class10Board,
        school: class10School,
        marksObtained: class10Marks,
        totalMarks: class10Total,
        percentage: class10Percentage,
        certificateUrl: user?.profile?.qualifications?.class10?.certificateUrl
      };
    } else if (sectionKey === 'class12') {
      if (!class12Roll.trim() || !class12Board.trim() || !class12School.trim() || !class12Marks.trim() || !class12Total.trim() || !class12Percentage.trim()) {
        toast.error('Please fill in all Class 12 details before saving.');
        setLoading(false);
        return;
      }
      sectionData = {
        rollNo: class12Roll,
        board: class12Board,
        school: class12School,
        marksObtained: class12Marks,
        totalMarks: class12Total,
        percentage: class12Percentage,
        certificateUrl: user?.profile?.qualifications?.class12?.certificateUrl
      };
    } else if (sectionKey === 'graduation') {
      if (!gradRoll.trim() || !gradDegree.trim() || !gradCollege.trim() || !gradUniversity.trim() || !gradMarks.trim() || !gradTotal.trim() || !gradPercentage.trim()) {
        toast.error('Please fill in all Graduation details before saving.');
        setLoading(false);
        return;
      }
      sectionData = {
        rollNo: gradRoll,
        degree: gradDegree,
        college: gradCollege,
        university: gradUniversity,
        marksObtained: gradMarks,
        totalMarks: gradTotal,
        percentage: gradPercentage,
        certificateUrl: user?.profile?.qualifications?.graduation?.certificateUrl
      };
    } else if (sectionKey === 'postGraduation') {
      if (!pgRoll.trim() || !pgDegree.trim() || !pgCollege.trim() || !pgUniversity.trim() || !pgMarks.trim() || !pgTotal.trim() || !pgPercentage.trim()) {
        toast.error('Please fill in all Post Graduation details before saving.');
        setLoading(false);
        return;
      }
      sectionData = {
        rollNo: pgRoll,
        degree: pgDegree,
        college: pgCollege,
        university: pgUniversity,
        marksObtained: pgMarks,
        totalMarks: pgTotal,
        percentage: pgPercentage,
        certificateUrl: user?.profile?.qualifications?.postGraduation?.certificateUrl
      };
    } else if (sectionKey === 'mphil') {
      if (mphilDone === 'YES') {
        if (!mphilUniversity.trim() || !mphilPassingYear.trim() || !mphilTotalMarks.trim() || !mphilMarksObtained.trim() || !mphilPercentage.trim()) {
          toast.error('Please fill in all M.Phil details before saving.');
          setLoading(false);
          return;
        }
      }
      sectionData = {
        done: mphilDone === 'YES',
        university: mphilUniversity,
        passingYear: mphilPassingYear,
        totalMarks: mphilTotalMarks,
        marksObtained: mphilMarksObtained,
        percentage: mphilPercentage,
        certificateUrl: user?.profile?.qualifications?.mphil?.certificateUrl
      };
    } else if (sectionKey === 'netJrf') {
      if (netJrfQualified === 'YES') {
        if (!netJrfCertNumber.trim() || !netJrfRoll.trim() || !netJrfRank.trim() || !netJrfScore.trim() || !netJrfIssueDate.trim()) {
          toast.error('Please fill in all NET JRF details before saving.');
          setLoading(false);
          return;
        }
      }
      sectionData = {
        qualified: netJrfQualified === 'YES',
        certNumber: netJrfCertNumber,
        rollNo: netJrfRoll,
        rank: netJrfRank,
        score: netJrfScore,
        issueDate: netJrfIssueDate,
        certificateUrl: user?.profile?.qualifications?.netJrf?.certificateUrl
      };
    } else if (sectionKey === 'fellowships') {
      sectionData = fellowships.map((f, i) => ({
        ...f,
        certificateUrl: user?.profile?.qualifications?.fellowships?.[i]?.certificateUrl || f.certificateUrl || ''
      }));
    }

    const payload = {
      ...user?.profile,
      qualifications: {
        ...user?.profile?.qualifications,
        [sectionKey]: sectionData
      }
    };

    const res = await updateProfile(payload);
    setLoading(false);
    if (res.success) {
      const prettyName = sectionKey === 'netJrf' ? 'NET JRF' : sectionKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      toast.success(`${prettyName} details saved successfully!`);
      setEditModes(prev => ({ ...prev, [sectionKey]: false }));
    } else {
      toast.error(`Failed to save details: ${res.message}`);
    }
  };

  const getDocBadge = (docType, certUrl) => {
    if (uploadingDoc === docType) {
      return <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '12px', background: '#FEF3C7', color: '#D97706', fontWeight: 600 }}>Uploading...</span>;
    }
    if (certUrl) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '12px', background: '#D1FAE5', color: '#059669', fontWeight: 600 }}>✓ Uploaded</span>
          <a 
            href={`${API_BASE_URL}${certUrl}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            style={{ 
              fontSize: '0.75rem', 
              color: '#2563EB', 
              fontWeight: 600, 
              textDecoration: 'none', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '4px',
              background: '#EFF6FF',
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid #BFDBFE'
            }}
          >
            <FileText size={12} /> View File
          </a>
        </div>
      );
    }
    if (docType === 'other') {
      return <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '12px', background: '#F3F4F6', color: '#6B7280', fontWeight: 600 }}>Optional</span>;
    }
    if (docType.startsWith('fellowship_')) {
      return <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '12px', background: '#F3F4F6', color: '#6B7280', fontWeight: 600 }}>Optional</span>;
    }
    return <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '12px', background: '#F3F4F6', color: '#6B7280', fontWeight: 600 }}>Pending Upload</span>;
  };

  const getUploadButton = (docType, certUrl) => {
    const isUploaded = !!certUrl;
    const currentSelectedName = selectedFileNames[docType];
    let displayFileName = '';
    if (currentSelectedName) {
      displayFileName = currentSelectedName;
    } else if (certUrl) {
      const parts = certUrl.split('/');
      displayFileName = parts[parts.length - 1];
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          gap: '6px', 
          background: !!thesis ? '#9CA3AF' : isUploaded ? '#D97706' : '#4B5563', 
          color: 'white', 
          padding: '8px 12px', 
          borderRadius: '6px', 
          fontSize: '0.75rem', 
          fontWeight: 600, 
          cursor: !!thesis ? 'not-allowed' : 'pointer', 
          textAlign: 'center',
          transition: 'all 0.2s',
          boxShadow: !thesis && isUploaded ? '0 2px 4px rgba(217, 119, 6, 0.2)' : 'none'
        }}>
          {isUploaded ? '✓ Certificate Uploaded' : '📤 Upload Certificate (PDF)'}
          {!thesis && <input type="file" accept=".pdf,image/*" onChange={e => handleDocUpload(e, docType)} style={{ display: 'none' }} />}
        </label>
        {displayFileName && (
          <div style={{ fontSize: '0.7rem', color: '#4B5563', fontStyle: 'italic', wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>📄 File:</span>
            <span style={{ fontWeight: 600 }}>{displayFileName}</span>
          </div>
        )}
      </div>
    );
  };

  const handleProfileRegistrationSubmit = async () => {
    // 1. General & ERP Details check
    if (
      !dob || !gender || !category || !fatherName || !motherName || !nationality || 
      !admissionDate || !enrollmentNumber || !phdMode || !specialization || 
      !phoneNumber || !address || !areaOfInterest ||
      !thesisTitle || !thesisSummary || !thesisKeywords
    ) {
      toast.error('please fill in all the details before submitting the form.');
      return;
    }

    // 2. Qualifications check (Class 10, 12, Graduation, Post-Graduation details and certificates)
    const q = user?.profile?.qualifications;
    if (
      !class10Roll || !class10Board || !class10School || !class10Marks || !class10Total || !class10Percentage || !q?.class10?.certificateUrl ||
      !class12Roll || !class12Board || !class12School || !class12Marks || !class12Total || !class12Percentage || !q?.class12?.certificateUrl ||
      !gradRoll || !gradDegree || !gradCollege || !gradUniversity || !gradMarks || !gradTotal || !gradPercentage || !q?.graduation?.certificateUrl ||
      !pgRoll || !pgDegree || !pgCollege || !pgUniversity || !pgMarks || !pgTotal || !pgPercentage || !q?.postGraduation?.certificateUrl
    ) {
      toast.error('please fill in all the details before submitting the form.');
      return;
    }

    // 3. NET JRF details & certificate check if qualified
    if (mphilDone === 'YES') {
      if (!mphilUniversity || !mphilPassingYear || !mphilTotalMarks || !mphilMarksObtained || !mphilPercentage || !q?.mphil?.certificateUrl) {
        toast.error('please fill in all the details before submitting the form.');
        return;
      }
    }

    if (netJrfQualified === 'YES') {
      if (!netJrfCertNumber || !netJrfRoll || !netJrfRank || !netJrfScore || !netJrfIssueDate || !q?.netJrf?.certificateUrl) {
        toast.error('please fill in all the details before submitting the form.');
        return;
      }
    }

    // 4. Preferred Guide preference check
    if (!preferredGuideId) {
      toast.error('please fill in all the details before submitting the form.');
      return;
    }

    const isConfirmed = window.confirm(
      "⚠️ PROFILE SUBMISSION WARNING ⚠️\n\n" +
      "Please check all information and uploaded certificates properly before submitting your profile for HOD approval.\n\n" +
      "Once you submit this profile, all fields will be locked to read-only mode and you will not be able to modify any details during HOD verification.\n\n" +
      "Are you absolutely sure you want to submit your profile for HOD approval now?"
    );

    if (!isConfirmed) {
      return;
    }

    try {
      setRegistering(true);

      // Save guide preference and other details to server before submission
      const cleanedPhone = phoneNumber.trim().replace(/[\s\-()]/g, '');
      const indianPhoneRegex = /^(\+91|91|0)?[6-9]\d{9}$/;
      if (!indianPhoneRegex.test(cleanedPhone)) {
        toast.error('Please enter a valid 10-digit Indian phone number (starts with 6-9).');
        setRegistering(false);
        return;
      }

      const payload = {
        dob,
        gender,
        category,
        fatherName,
        motherName,
        nationality,
        admissionDate,
        enrollmentNumber,
        phdMode,
        specialization,
        phoneNumber,
        address,
        areaOfInterest,
        academicBackground,
        preferredGuideId,
        thesisTitle,
        thesisSummary,
        thesisKeywords,
        qualifications: {
          class10: {
            rollNo: class10Roll,
            board: class10Board,
            school: class10School,
            marksObtained: class10Marks,
            totalMarks: class10Total,
            percentage: class10Percentage,
            certificateUrl: user?.profile?.qualifications?.class10?.certificateUrl
          },
          class12: {
            rollNo: class12Roll,
            board: class12Board,
            school: class12School,
            marksObtained: class12Marks,
            totalMarks: class12Total,
            percentage: class12Percentage,
            certificateUrl: user?.profile?.qualifications?.class12?.certificateUrl
          },
          graduation: {
            rollNo: gradRoll,
            degree: gradDegree,
            college: gradCollege,
            university: gradUniversity,
            marksObtained: gradMarks,
            totalMarks: gradTotal,
            percentage: gradPercentage,
            certificateUrl: user?.profile?.qualifications?.graduation?.certificateUrl
          },
          postGraduation: {
            rollNo: pgRoll,
            degree: pgDegree,
            college: pgCollege,
            university: pgUniversity,
            marksObtained: pgMarks,
            totalMarks: pgTotal,
            percentage: pgPercentage,
            certificateUrl: user?.profile?.qualifications?.postGraduation?.certificateUrl
          },
          mphil: {
            done: mphilDone === 'YES',
            university: mphilUniversity,
            passingYear: mphilPassingYear,
            totalMarks: mphilTotalMarks,
            marksObtained: mphilMarksObtained,
            percentage: mphilPercentage,
            certificateUrl: user?.profile?.qualifications?.mphil?.certificateUrl
          },
          netJrf: {
            qualified: netJrfQualified === 'YES',
            certNumber: netJrfCertNumber,
            rollNo: netJrfRoll,
            rank: netJrfRank,
            score: netJrfScore,
            issueDate: netJrfIssueDate,
            certificateUrl: user?.profile?.qualifications?.netJrf?.certificateUrl
          },
          fellowships: fellowships.map((f, i) => ({
            ...f,
            certificateUrl: user?.profile?.qualifications?.fellowships?.[i]?.certificateUrl || f.certificateUrl || ''
          }))
        }
      };

      const res = await updateProfile(payload);
      if (!res.success) {
        toast.error('Failed to save guide preference before submission: ' + res.message);
        setRegistering(false);
        return;
      }

      await createThesis({});
      await fetchMyThesis();
      toast.success('Your PhD Profile and registration details have been successfully submitted to the HOD for verification and supervisor assignment!');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to submit registration.');
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 850, margin: '0 auto', padding: '24px' }}>
      {/* Dynamic Profile Registration Status Banner */}
      {!thesis ? (
        <div style={{
          background: '#EFF6FF',
          border: '1px solid #BFDBFE',
          borderLeft: '4px solid #3B82F6',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '0.85rem',
          color: '#1E3A8A',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>ℹ️ Ph.D. Profile Verification Pending Submission</div>
          <div>Please fill out your complete profile information: <strong>General Info</strong>, <strong>Qualifications (with certificates)</strong>, and <strong>Preferred Guide Selection</strong>. Once completed, click the green <strong>🚀 Submit PhD Profile for HOD Registration Approval</strong> button at the very bottom!</div>
        </div>
      ) : thesis.status === 'REGISTRATION_PENDING' ? (
        <div style={{
          background: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderLeft: '4px solid #D97706',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '0.85rem',
          color: '#78350F',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>⏳ Ph.D. Profile Submitted & Awaiting Approval</div>
          <div>Your academic profile has been forwarded to the HOD of {thesis.department} for verification and supervisor assignment. You will be notified once verified!</div>
        </div>
      ) : (
        <div style={{
          background: '#ECFDF5',
          border: '1px solid #A7F3D0',
          borderLeft: '4px solid #059669',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '0.85rem',
          color: '#065F46',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>✅ Ph.D. Profile Registration Verified & Approved</div>
          <div>Your academic background, certificates, and enrollment parameters are officially approved and locked. Your supervisor assignment is complete!</div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #E5E7EB' }}>
        {user?.avatarUrl ? (
          <img 
            src={`${API_BASE_URL}${user.avatarUrl}`} 
            alt="Avatar Preview" 
            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #133A26', background: '#F8FAFC' }} 
          />
        ) : (
          <svg viewBox="0 0 100 100" style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#e2e8f0', display: 'block', border: '3px solid #133A26' }}>
            <circle cx="50" cy="35" r="20" fill="#133A26" />
            <path d="M15 85c0-13.8 11.2-25 25-25h20c13.8 0 25 11.2 25 25z" fill="#133A26" />
          </svg>
        )}
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#111827', margin: 0 }}>{user?.name}</h2>
          <p style={{ fontSize: '0.85rem', color: '#6B7280', margin: '4px 0 12px' }}>Ph.D. Scholar • {user?.department}</p>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#133A26', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
            {avatarLoading ? 'Uploading...' : '📷 Change Profile Picture'}
            <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} disabled={avatarLoading} />
          </label>
        </div>
      </div>

      {/* Internal Navigation Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #F3F4F6', gap: '16px', marginBottom: '24px' }}>
        <button 
          onClick={() => setSubTab('general')}
          style={{ 
            padding: '10px 16px', 
            fontSize: '0.9rem', 
            fontWeight: 600, 
            background: 'none', 
            border: 'none', 
            borderBottom: subTab === 'general' ? '3px solid #133A26' : '3px solid transparent', 
            color: subTab === 'general' ? '#133A26' : '#6B7280', 
            cursor: 'pointer', 
            transition: 'all 0.2s' 
          }}
        >
          👤 General Information
        </button>
        {(thesis || isGeneralInfoComplete()) ? (
          <button 
            onClick={() => setSubTab('academic')}
            style={{ 
              padding: '10px 16px', 
              fontSize: '0.9rem', 
              fontWeight: 600, 
              background: 'none', 
              border: 'none', 
              borderBottom: subTab === 'academic' ? '3px solid #133A26' : '3px solid transparent', 
              color: subTab === 'academic' ? '#133A26' : '#6B7280', 
              cursor: 'pointer', 
              transition: 'all 0.2s' 
            }}
          >
            🎓 Academic Qualifications
          </button>
        ) : (
          <button 
            disabled
            style={{ 
              padding: '10px 16px', 
              fontSize: '0.9rem', 
              fontWeight: 600, 
              background: 'none', 
              border: 'none', 
              borderBottom: '3px solid transparent', 
              color: '#9CA3AF', 
              cursor: 'not-allowed', 
              opacity: 0.6
            }}
            title="Complete and save General Information to unlock"
          >
            🔒 Academic Qualifications
          </button>
        )}
        {(thesis || (isGeneralInfoComplete() && isAcademicQualificationsComplete())) ? (
          <button 
            onClick={() => setSubTab('guide')}
            style={{ 
              padding: '10px 16px', 
              fontSize: '0.9rem', 
              fontWeight: 600, 
              background: 'none', 
              border: 'none', 
              borderBottom: subTab === 'guide' ? '3px solid #133A26' : '3px solid transparent', 
              color: subTab === 'guide' ? '#133A26' : '#6B7280', 
              cursor: 'pointer', 
              transition: 'all 0.2s' 
            }}
          >
            🤝 Preferred Guide Preference
          </button>
        ) : (
          <button 
            disabled
            style={{ 
              padding: '10px 16px', 
              fontSize: '0.9rem', 
              fontWeight: 600, 
              background: 'none', 
              border: 'none', 
              borderBottom: '3px solid transparent', 
              color: '#9CA3AF', 
              cursor: 'not-allowed', 
              opacity: 0.6
            }}
            title="Complete and save all Academic Qualifications to unlock"
          >
            🔒 Preferred Guide Preference
          </button>
        )}
      </div>

      <form onSubmit={subTab === 'academic' ? handleSaveAcademicDetails : handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* --- Tab 1: General Information --- */}
        {subTab === 'general' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#133A26', margin: 0 }}>Personal Details</h3>
              {!editModes.general && (
                <button
                  type="button"
                  disabled={!!thesis}
                  onClick={() => !thesis && setEditModes(prev => ({ ...prev, general: true }))}
                  style={{ background: !!thesis ? '#9CA3AF' : '#3B82F6', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: !!thesis ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: !!thesis ? 'none' : '0 2px 4px rgba(59, 130, 246, 0.15)', transition: 'all 0.2s' }}
                >
                  ✏️ Edit General Info
                </button>
              )}
            </div>

            {!editModes.general ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', fontSize: '0.85rem' }}>
                  <div style={{ gridColumn: 'span 2', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px', marginBottom: '4px' }}>
                    <h4 style={{ margin: 0, color: '#133A26', fontSize: '0.95rem', fontWeight: 700 }}>Personal Details</h4>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Full Name</span>
                    <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{user?.name || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>University Email</span>
                    <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{user?.username || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Date of Birth</span>
                    <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{dob || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Gender</span>
                    <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{gender || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Social Category</span>
                    <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{category || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Nationality</span>
                    <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{nationality || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Father's Name</span>
                    <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{fatherName || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Mother's Name</span>
                    <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{motherName || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Phone Number</span>
                    <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{phoneNumber || '—'}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Residential Address</span>
                    <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{address || '—'}</strong>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '20px', fontSize: '0.85rem' }}>
                  <div style={{ gridColumn: 'span 2', borderBottom: '1px solid #BBF7D0', paddingBottom: '8px', marginBottom: '4px' }}>
                    <h4 style={{ margin: 0, color: '#133A26', fontSize: '0.95rem', fontWeight: 700 }}>Thesis & Research Details</h4>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>SH no.</span>
                    <strong style={{ color: '#059669', fontSize: '0.9rem', fontWeight: 700 }}>{user?.profile?.shNo || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Enrollment Number</span>
                    <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{enrollmentNumber || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Date of Admission</span>
                    <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{admissionDate || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Ph.D. Mode</span>
                    <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{phdMode || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Specialization</span>
                    <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{specialization || '—'}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Area of Research Interest</span>
                    <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{areaOfInterest || '—'}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Thesis Title</span>
                    <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{thesisTitle || '—'}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Thesis Summary / Abstract</span>
                    <strong style={{ color: '#334155', fontSize: '0.88rem', fontWeight: 500, display: 'block', whiteSpace: 'pre-wrap', lineHeight: 1.5, marginTop: 4 }}>{thesisSummary || '—'}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Keywords</span>
                    <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{thesisKeywords || '—'}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div style={{ borderBottom: '2px solid #E5E7EB', paddingBottom: '8px', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, color: '#133A26', fontSize: '1rem', fontWeight: 700 }}>Personal Details</h4>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Full Name</label>
                    <input type="text" className="form-input" value={user?.name} disabled style={{ background: '#F1F5F9', color: '#64748B' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>University Email (ID)</label>
                    <input type="text" className="form-input" value={user?.username} disabled style={{ background: '#F1F5F9', color: '#64748B' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Date of Birth <span style={{ color: '#EF4444' }}>*</span></label>
                    <input type="date" className="form-input" value={dob} onChange={e => setDob(e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Gender <span style={{ color: '#EF4444' }}>*</span></label>
                    <select className="form-input" value={gender} onChange={e => setGender(e.target.value)} required>
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Social Category <span style={{ color: '#EF4444' }}>*</span></label>
                    <select className="form-input" value={category} onChange={e => setCategory(e.target.value)} required>
                      <option value="">Select Category...</option>
                      <option value="General">General / Unreserved</option>
                      <option value="OBC">OBC (Other Backward Classes)</option>
                      <option value="SC">SC (Scheduled Caste)</option>
                      <option value="ST">ST (Scheduled Tribe)</option>
                      <option value="EWS">EWS (Economically Weaker Section)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Nationality <span style={{ color: '#EF4444' }}>*</span></label>
                    <input type="text" className="form-input" placeholder="e.g. Indian" value={nationality} onChange={e => setNationality(e.target.value)} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Father's Name <span style={{ color: '#EF4444' }}>*</span></label>
                    <input type="text" className="form-input" placeholder="Father's full name" value={fatherName} onChange={e => setFatherName(e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Mother's Name <span style={{ color: '#EF4444' }}>*</span></label>
                    <input type="text" className="form-input" placeholder="Mother's full name" value={motherName} onChange={e => setMotherName(e.target.value)} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Phone Number (Indian Format) <span style={{ color: '#EF4444' }}>*</span></label>
                    <input type="text" className="form-input" placeholder="Enter 10-digit mobile number" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Full Residential Address <span style={{ color: '#EF4444' }}>*</span></label>
                    <input type="text" className="form-input" placeholder="Street, City, State, ZIP" value={address} onChange={e => setAddress(e.target.value)} required />
                  </div>
                </div>

                <div style={{ borderBottom: '2px solid #E5E7EB', paddingBottom: '8px', marginTop: '16px', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, color: '#133A26', fontSize: '1rem', fontWeight: 700 }}>Thesis & Research Details</h4>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>SH no. (Auto Generated)</label>
                    <input type="text" className="form-input" value={user?.profile?.shNo || '—'} disabled style={{ background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0', cursor: 'not-allowed' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>University Enrollment Number <span style={{ color: '#EF4444' }}>*</span></label>
                    <input type="text" className="form-input" placeholder="Enter enrollment number" value={enrollmentNumber} onChange={e => setEnrollmentNumber(e.target.value)} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Date of Admission <span style={{ color: '#EF4444' }}>*</span></label>
                    <input type="date" className="form-input" value={admissionDate} onChange={e => setAdmissionDate(e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Mode of Ph.D. <span style={{ color: '#EF4444' }}>*</span></label>
                    <select className="form-input" value={phdMode} onChange={e => setPhdMode(e.target.value)} required>
                      <option value="">Select Mode...</option>
                      <option value="Full-time">Full-time Regular</option>
                      <option value="Part-time">Part-time / Sponsored</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Area of Specialization <span style={{ color: '#EF4444' }}>*</span></label>
                    <input type="text" className="form-input" placeholder="e.g. Machine Learning, Structural Bio" value={specialization} onChange={e => setSpecialization(e.target.value)} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Area of Research Interest <span style={{ color: '#EF4444' }}>*</span></label>
                    <input type="text" className="form-input" placeholder="Specific research title domain" value={areaOfInterest} onChange={e => setAreaOfInterest(e.target.value)} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Thesis Title <span style={{ color: '#EF4444' }}>*</span></label>
                    <input type="text" className="form-input" placeholder="Enter final or tentative thesis title" value={thesisTitle} onChange={e => setThesisTitle(e.target.value)} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Thesis Summary / Abstract <span style={{ color: '#EF4444' }}>*</span></label>
                    <textarea className="form-input" rows={4} placeholder="Write a short summary/abstract of your thesis..." value={thesisSummary} onChange={e => setThesisSummary(e.target.value)} required style={{ fontFamily: 'inherit' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Keywords <span style={{ color: '#EF4444' }}>*</span></label>
                    <input type="text" className="form-input" placeholder="e.g. Deep Learning, Image Segmentation, Healthcare (comma separated)" value={thesisKeywords} onChange={e => setThesisKeywords(e.target.value)} required />
                  </div>
                </div>

                {user?.profile?.dob && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setEditModes(prev => ({ ...prev, general: false }))}
                      style={{ background: '#6B7280', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* --- Tab 2: Academic Qualifications --- */}
        {subTab === 'academic' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Class 10 Card */}
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', background: '#F9FAFB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>Class 10 (Secondary) Details</h4>
                {getDocBadge('class10', user?.profile?.qualifications?.class10?.certificateUrl)}
              </div>
              
              {!editModes.class10 ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '8px', padding: '16px', fontSize: '0.85rem', marginBottom: '16px' }}>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Roll Number</span>
                      <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{class10Roll || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Board of Examination</span>
                      <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{class10Board || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>School Name</span>
                      <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{class10School || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Marks Obtained / Total</span>
                      <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{class10Marks || '0'} / {class10Total || '0'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Percentage (%)</span>
                      <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{class10Percentage || '0%'}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5E7EB', paddingTop: '12px' }}>
                    <div>
                      {getUploadButton('class10', user?.profile?.qualifications?.class10?.certificateUrl)}
                    </div>
                    <button
                      type="button"
                      disabled={!!thesis}
                      onClick={() => !thesis && setEditModes(prev => ({ ...prev, class10: true }))}
                      style={{ background: !!thesis ? '#9CA3AF' : '#3B82F6', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: !!thesis ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: !!thesis ? 'none' : '0 2px 4px rgba(59, 130, 246, 0.15)', transition: 'all 0.2s' }}
                    >
                      ✏️ Edit Class 10 Details
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Roll Number</label>
                      <input type="text" className="form-input" placeholder="Roll No" value={class10Roll} onChange={e => setClass10Roll(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Board of Examination</label>
                      <input type="text" className="form-input" placeholder="e.g. CBSE, ICSE" value={class10Board} onChange={e => setClass10Board(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>School Name</label>
                      <input type="text" className="form-input" placeholder="School Name" value={class10School} onChange={e => setClass10School(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', alignItems: 'flex-end' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Marks Obtained</label>
                      <input type="number" step="0.01" className="form-input" placeholder="Marks" value={class10Marks} onChange={e => setClass10Marks(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Total Marks</label>
                      <input type="number" step="0.01" className="form-input" placeholder="Total" value={class10Total} onChange={e => setClass10Total(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Percentage (%)</label>
                      <input type="text" className="form-input" placeholder="e.g. 92.5%" value={class10Percentage} onChange={e => setClass10Percentage(e.target.value)} />
                    </div>
                    <div>
                      {getUploadButton('class10', user?.profile?.qualifications?.class10?.certificateUrl)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E5E7EB' }}>
                    {user?.profile?.qualifications?.class10?.rollNo && (
                      <button
                        type="button"
                        onClick={() => setEditModes(prev => ({ ...prev, class10: false }))}
                        style={{ background: '#6B7280', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => saveSection('class10')}
                      disabled={loading}
                      style={{ background: '#059669', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)', transition: 'all 0.2s' }}
                    >
                      💾 Save Class 10 Details
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Class 12 Card */}
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', background: '#F9FAFB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>Class 12 (Higher Secondary) Details</h4>
                {getDocBadge('class12', user?.profile?.qualifications?.class12?.certificateUrl)}
              </div>
              
              {!editModes.class12 ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '8px', padding: '16px', fontSize: '0.85rem', marginBottom: '16px' }}>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Roll Number</span>
                      <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{class12Roll || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Board of Examination</span>
                      <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{class12Board || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>School/College Name</span>
                      <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{class12School || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Marks Obtained / Total</span>
                      <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{class12Marks || '0'} / {class12Total || '0'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Percentage (%)</span>
                      <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{class12Percentage || '0%'}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5E7EB', paddingTop: '12px' }}>
                    <div>
                      {getUploadButton('class12', user?.profile?.qualifications?.class12?.certificateUrl)}
                    </div>
                    <button
                      type="button"
                      disabled={!!thesis}
                      onClick={() => !thesis && setEditModes(prev => ({ ...prev, class12: true }))}
                      style={{ background: !!thesis ? '#9CA3AF' : '#3B82F6', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: !!thesis ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: !!thesis ? 'none' : '0 2px 4px rgba(59, 130, 246, 0.15)', transition: 'all 0.2s' }}
                    >
                      ✏️ Edit Class 12 Details
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Roll Number</label>
                      <input type="text" className="form-input" placeholder="Roll No" value={class12Roll} onChange={e => setClass12Roll(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Board of Examination</label>
                      <input type="text" className="form-input" placeholder="e.g. CBSE, State Board" value={class12Board} onChange={e => setClass12Board(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>School/College Name</label>
                      <input type="text" className="form-input" placeholder="School/College Name" value={class12School} onChange={e => setClass12School(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', alignItems: 'flex-end' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Marks Obtained</label>
                      <input type="number" step="0.01" className="form-input" placeholder="Marks" value={class12Marks} onChange={e => setClass12Marks(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Total Marks</label>
                      <input type="number" step="0.01" className="form-input" placeholder="Total" value={class12Total} onChange={e => setClass12Total(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Percentage (%)</label>
                      <input type="text" className="form-input" placeholder="e.g. 88.2%" value={class12Percentage} onChange={e => setClass12Percentage(e.target.value)} />
                    </div>
                    <div>
                      {getUploadButton('class12', user?.profile?.qualifications?.class12?.certificateUrl)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E5E7EB' }}>
                    {user?.profile?.qualifications?.class12?.rollNo && (
                      <button
                        type="button"
                        onClick={() => setEditModes(prev => ({ ...prev, class12: false }))}
                        style={{ background: '#6B7280', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => saveSection('class12')}
                      disabled={loading}
                      style={{ background: '#059669', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)', transition: 'all 0.2s' }}
                    >
                      💾 Save Class 12 Details
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Graduation Card */}
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', background: '#F9FAFB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>Graduation Details</h4>
                {getDocBadge('graduation', user?.profile?.qualifications?.graduation?.certificateUrl)}
              </div>
              
              {!editModes.graduation ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '8px', padding: '16px', fontSize: '0.85rem', marginBottom: '16px' }}>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Roll No / Enroll No</span>
                      <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{gradRoll || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Degree</span>
                      <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{gradDegree || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>College Name</span>
                      <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{gradCollege || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>University Name</span>
                      <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{gradUniversity || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>CGPA / Marks Obtained / Scale</span>
                      <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{gradMarks || '0'} / {gradTotal || '0'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Percentage / CGPA (%)</span>
                      <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{gradPercentage || '—'}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5E7EB', paddingTop: '12px' }}>
                    <div>
                      {getUploadButton('graduation', user?.profile?.qualifications?.graduation?.certificateUrl)}
                    </div>
                    <button
                      type="button"
                      disabled={!!thesis}
                      onClick={() => !thesis && setEditModes(prev => ({ ...prev, graduation: true }))}
                      style={{ background: !!thesis ? '#9CA3AF' : '#3B82F6', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: !!thesis ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: !!thesis ? 'none' : '0 2px 4px rgba(59, 130, 246, 0.15)', transition: 'all 0.2s' }}
                    >
                      ✏️ Edit Graduation Details
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Roll No / Enroll No</label>
                      <input type="text" className="form-input" placeholder="Roll No" value={gradRoll} onChange={e => setGradRoll(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Degree (e.g. B.Tech, B.Sc)</label>
                      <input type="text" className="form-input" placeholder="e.g. B.Tech CSE" value={gradDegree} onChange={e => setGradDegree(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>College Name</label>
                      <input type="text" className="form-input" placeholder="College Name" value={gradCollege} onChange={e => setGradCollege(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>University Name</label>
                      <input type="text" className="form-input" placeholder="University" value={gradUniversity} onChange={e => setGradUniversity(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', alignItems: 'flex-end' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>CGPA / Marks Obtained</label>
                      <input type="number" step="0.01" className="form-input" placeholder="Marks" value={gradMarks} onChange={e => setGradMarks(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Total Max Marks / Scale</label>
                      <input type="number" step="0.01" className="form-input" placeholder="Total scale" value={gradTotal} onChange={e => setGradTotal(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Percentage / CGPA (%)</label>
                      <input type="text" className="form-input" placeholder="e.g. 8.4 CGPA" value={gradPercentage} onChange={e => setGradPercentage(e.target.value)} />
                    </div>
                    <div>
                      {getUploadButton('graduation', user?.profile?.qualifications?.graduation?.certificateUrl)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E5E7EB' }}>
                    {user?.profile?.qualifications?.graduation?.rollNo && (
                      <button
                        type="button"
                        onClick={() => setEditModes(prev => ({ ...prev, graduation: false }))}
                        style={{ background: '#6B7280', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => saveSection('graduation')}
                      disabled={loading}
                      style={{ background: '#059669', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)', transition: 'all 0.2s' }}
                    >
                      💾 Save Graduation Details
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Post Graduation Card */}
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', background: '#F9FAFB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>Post-Graduation Details</h4>
                {getDocBadge('postGraduation', user?.profile?.qualifications?.postGraduation?.certificateUrl)}
              </div>
              
              {!editModes.postGraduation ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '8px', padding: '16px', fontSize: '0.85rem', marginBottom: '16px' }}>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Roll No / Enroll No</span>
                      <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{pgRoll || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Degree</span>
                      <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{pgDegree || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>College Name</span>
                      <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{pgCollege || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>University Name</span>
                      <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{pgUniversity || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>CGPA / Marks Obtained / Scale</span>
                      <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{pgMarks || '0'} / {pgTotal || '0'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Percentage / CGPA (%)</span>
                      <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{pgPercentage || '—'}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5E7EB', paddingTop: '12px' }}>
                    <div>
                      {getUploadButton('postGraduation', user?.profile?.qualifications?.postGraduation?.certificateUrl)}
                    </div>
                    <button
                      type="button"
                      disabled={!!thesis}
                      onClick={() => !thesis && setEditModes(prev => ({ ...prev, postGraduation: true }))}
                      style={{ background: !!thesis ? '#9CA3AF' : '#3B82F6', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: !!thesis ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: !!thesis ? 'none' : '0 2px 4px rgba(59, 130, 246, 0.15)', transition: 'all 0.2s' }}
                    >
                      ✏️ Edit Post-Graduation Details
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Roll No / Enroll No</label>
                      <input type="text" className="form-input" placeholder="Roll No" value={pgRoll} onChange={e => setPgRoll(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>PG Degree (e.g. M.Tech, M.Sc)</label>
                      <input type="text" className="form-input" placeholder="e.g. M.Tech CSE" value={pgDegree} onChange={e => setPgDegree(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>College Name</label>
                      <input type="text" className="form-input" placeholder="College Name" value={pgCollege} onChange={e => setPgCollege(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>University Name</label>
                      <input type="text" className="form-input" placeholder="University" value={pgUniversity} onChange={e => setPgUniversity(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', alignItems: 'flex-end' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>CGPA / Marks Obtained</label>
                      <input type="number" step="0.01" className="form-input" placeholder="Marks" value={pgMarks} onChange={e => setPgMarks(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Total Max Marks / Scale</label>
                      <input type="number" step="0.01" className="form-input" placeholder="Total scale" value={pgTotal} onChange={e => setPgTotal(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Percentage / CGPA (%)</label>
                      <input type="text" className="form-input" placeholder="e.g. 9.1 CGPA" value={pgPercentage} onChange={e => setPgPercentage(e.target.value)} />
                    </div>
                    <div>
                      {getUploadButton('postGraduation', user?.profile?.qualifications?.postGraduation?.certificateUrl)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E5E7EB' }}>
                    {user?.profile?.qualifications?.postGraduation?.rollNo && (
                      <button
                        type="button"
                        onClick={() => setEditModes(prev => ({ ...prev, postGraduation: false }))}
                        style={{ background: '#6B7280', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => saveSection('postGraduation')}
                      disabled={loading}
                      style={{ background: '#059669', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)', transition: 'all 0.2s' }}
                    >
                      💾 Save Post-Graduation Details
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* M.Phil Qualifications */}
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', background: '#F9FAFB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>M.Phil Details</h4>
                {getDocBadge('mphil', user?.profile?.qualifications?.mphil?.certificateUrl)}
              </div>
              
              {!editModes.mphil ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '8px', padding: '16px', fontSize: '0.85rem', marginBottom: '16px' }}>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Completed M.Phil?</span>
                      <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{mphilDone || 'NO'}</strong>
                    </div>
                    {mphilDone === 'YES' && (
                      <>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>University/Institution</span>
                          <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{mphilUniversity || '—'}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Passing Year</span>
                          <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{mphilPassingYear || '—'}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Marks Obtained</span>
                          <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{mphilMarksObtained || '—'}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Total Marks</span>
                          <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{mphilTotalMarks || '—'}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Percentage</span>
                          <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{mphilPercentage || '—'}%</strong>
                        </div>
                      </>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5E7EB', paddingTop: '12px' }}>
                    <div>
                      {mphilDone === 'YES' && getUploadButton('mphil', user?.profile?.qualifications?.mphil?.certificateUrl)}
                    </div>
                    <button
                      type="button"
                      disabled={!!thesis}
                      onClick={() => !thesis && setEditModes(prev => ({ ...prev, mphil: true }))}
                      style={{ background: !!thesis ? '#9CA3AF' : '#3B82F6', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: !!thesis ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: !!thesis ? 'none' : '0 2px 4px rgba(59, 130, 246, 0.15)', transition: 'all 0.2s' }}
                    >
                      ✏️ Edit M.Phil Details
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Have you completed M.Phil?</label>
                      <select className="form-input" value={mphilDone} onChange={e => setMphilDone(e.target.value)}>
                        <option value="">Select option...</option>
                        <option value="NO">No</option>
                        <option value="YES">Yes</option>
                      </select>
                    </div>
                    {mphilDone === 'YES' && (
                      <>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>University / Institution</label>
                          <input type="text" className="form-input" placeholder="e.g. Delhi University" value={mphilUniversity} onChange={e => setMphilUniversity(e.target.value)} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Passing Year</label>
                          <input type="text" className="form-input" placeholder="e.g. 2022" value={mphilPassingYear} onChange={e => setMphilPassingYear(e.target.value)} />
                        </div>
                      </>
                    )}
                  </div>
                  {mphilDone === 'YES' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', alignItems: 'flex-end' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Marks Obtained</label>
                        <input type="number" className="form-input" placeholder="Marks Obtained" value={mphilMarksObtained} onChange={e => {
                          setMphilMarksObtained(e.target.value);
                          if (mphilTotalMarks) {
                            setMphilPercentage(((parseFloat(e.target.value) / parseFloat(mphilTotalMarks)) * 100).toFixed(2));
                          }
                        }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Total Marks</label>
                        <input type="number" className="form-input" placeholder="Total Marks" value={mphilTotalMarks} onChange={e => {
                          setMphilTotalMarks(e.target.value);
                          if (mphilMarksObtained) {
                            setMphilPercentage(((parseFloat(mphilMarksObtained) / parseFloat(e.target.value)) * 100).toFixed(2));
                          }
                        }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Percentage (%)</label>
                        <input type="text" className="form-input" placeholder="Percentage" value={mphilPercentage} readOnly />
                      </div>
                      <div>
                        {getUploadButton('mphil', user?.profile?.qualifications?.mphil?.certificateUrl)}
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E5E7EB' }}>
                    {user?.profile?.qualifications?.mphil?.university && (
                      <button
                        type="button"
                        onClick={() => setEditModes(prev => ({ ...prev, mphil: false }))}
                        style={{ background: '#6B7280', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => saveSection('mphil')}
                      disabled={loading}
                      style={{ background: '#059669', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)', transition: 'all 0.2s' }}
                    >
                      💾 Save M.Phil Details
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* NET JRF Qualifications */}
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', background: '#F9FAFB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>National Entrance Examinations (NET / JRF / GATE)</h4>
                {getDocBadge('netJrf', user?.profile?.qualifications?.netJrf?.certificateUrl)}
              </div>
              
              {!editModes.netJrf ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '8px', padding: '16px', fontSize: '0.85rem', marginBottom: '16px' }}>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Qualified NET JRF?</span>
                      <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{netJrfQualified}</strong>
                    </div>
                    {netJrfQualified === 'YES' && (
                      <>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Award Letter Number</span>
                          <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{netJrfCertNumber || '—'}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Roll Number</span>
                          <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{netJrfRoll || '—'}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>All India Rank (AIR)</span>
                          <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{netJrfRank || '—'}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Normalized Score</span>
                          <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{netJrfScore || '—'}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Certificate Issue Date</span>
                          <strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{netJrfIssueDate || '—'}</strong>
                        </div>
                      </>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5E7EB', paddingTop: '12px' }}>
                    <div>
                      {netJrfQualified === 'YES' && getUploadButton('netJrf', user?.profile?.qualifications?.netJrf?.certificateUrl)}
                    </div>
                    <button
                      type="button"
                      disabled={!!thesis}
                      onClick={() => !thesis && setEditModes(prev => ({ ...prev, netJrf: true }))}
                      style={{ background: !!thesis ? '#9CA3AF' : '#3B82F6', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: !!thesis ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: !!thesis ? 'none' : '0 2px 4px rgba(59, 130, 246, 0.15)', transition: 'all 0.2s' }}
                    >
                      ✏️ Edit NET JRF Details
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Have you qualified NET JRF?</label>
                      <select className="form-input" value={netJrfQualified} onChange={e => setNetJrfQualified(e.target.value)}>
                        <option value="">Select option...</option>
                        <option value="NO">No</option>
                        <option value="YES">Yes</option>
                      </select>
                    </div>
                    {netJrfQualified === 'YES' && (
                      <>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Certification / Award Letter Number</label>
                          <input type="text" className="form-input" placeholder="Cert Number" value={netJrfCertNumber} onChange={e => setNetJrfCertNumber(e.target.value)} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Roll Number / Reg Number</label>
                          <input type="text" className="form-input" placeholder="Roll No" value={netJrfRoll} onChange={e => setNetJrfRoll(e.target.value)} />
                        </div>
                      </>
                    )}
                  </div>
                  {netJrfQualified === 'YES' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', alignItems: 'flex-end' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>All India Rank (AIR)</label>
                        <input type="text" className="form-input" placeholder="AIR Rank" value={netJrfRank} onChange={e => setNetJrfRank(e.target.value)} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Normalized Score / Percentile</label>
                        <input type="text" className="form-input" placeholder="Score" value={netJrfScore} onChange={e => setNetJrfScore(e.target.value)} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Date of Certificate Issue</label>
                        <input type="date" className="form-input" value={netJrfIssueDate} onChange={e => setNetJrfIssueDate(e.target.value)} />
                      </div>
                      <div>
                        {getUploadButton('netJrf', user?.profile?.qualifications?.netJrf?.certificateUrl)}
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #E5E7EB' }}>
                    {user?.profile?.qualifications?.netJrf?.rollNo && (
                      <button
                        type="button"
                        onClick={() => setEditModes(prev => ({ ...prev, netJrf: false }))}
                        style={{ background: '#6B7280', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => saveSection('netJrf')}
                      disabled={loading}
                      style={{ background: '#059669', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)', transition: 'all 0.2s' }}
                    >
                      💾 Save NET JRF Details
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Fellowships Card */}
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', background: '#F9FAFB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>National & International Fellowships (Optional)</h4>
              </div>
              
              {!editModes.fellowships ? (
                <div>
                  {fellowships.length > 0 ? fellowships.map((f, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: '8px', padding: '16px', fontSize: '0.85rem', marginBottom: '16px' }}>
                      <div><span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Fellowship Type</span><strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{f.type === 'Other' ? f.otherType : f.type || '—'}</strong></div>
                      <div><span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Awarding Body</span><strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{f.awardingBody || '—'}</strong></div>
                      <div><span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Award Date</span><strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{f.awardDate || '—'}</strong></div>
                      <div><span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Reference No. / ID</span><strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{f.referenceNo || '—'}</strong></div>
                      <div><span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Duration</span><strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{f.duration || '—'}</strong></div>
                      <div><span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Amount</span><strong style={{ color: '#0F172A', fontSize: '0.9rem' }}>{f.amount || '—'}</strong></div>
                      <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                        {getUploadButton(`fellowship_${i}`, user?.profile?.qualifications?.fellowships?.[i]?.certificateUrl)}
                      </div>
                    </div>
                  )) : (
                    <div style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '16px' }}>No fellowships added.</div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #E5E7EB', paddingTop: '12px' }}>
                    <button
                      type="button"
                      disabled={!!thesis}
                      onClick={() => !thesis && setEditModes(prev => ({ ...prev, fellowships: true }))}
                      style={{ background: !!thesis ? '#9CA3AF' : '#3B82F6', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: !!thesis ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
                    >
                      ✏️ Edit / Add Fellowships
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {fellowships.map((f, i) => (
                    <div key={i} style={{ background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <strong style={{ color: '#1E293B', fontSize: '0.9rem' }}>Fellowship #{i + 1}</strong>
                        <button type="button" onClick={() => { const updated = [...fellowships]; updated.splice(i, 1); setFellowships(updated); }} style={{ background: '#EF4444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}>Remove</button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Fellowship Type</label>
                          <select className="form-input" value={f.type || ''} onChange={e => { const updated = [...fellowships]; updated[i].type = e.target.value; setFellowships(updated); }}>
                            <option value="">Select Fellowship...</option>
                            <option value="DST INSPIRE">DST INSPIRE</option>
                            <option value="CSIR NET JRF">CSIR NET JRF</option>
                            <option value="UGC NET JRF">UGC NET JRF</option>
                            <option value="NFSC">NFSC</option>
                            <option value="RGNF">RGNF</option>
                            <option value="PMRF">PMRF</option>
                            <option value="Fulbright">Fulbright</option>
                            <option value="DAAD">DAAD</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        {f.type === 'Other' && (
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Please Specify Fellowship</label>
                            <input type="text" className="form-input" value={f.otherType || ''} onChange={e => { const updated = [...fellowships]; updated[i].otherType = e.target.value; setFellowships(updated); }} />
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Awarding Body</label>
                          <input type="text" className="form-input" value={f.awardingBody || ''} onChange={e => { const updated = [...fellowships]; updated[i].awardingBody = e.target.value; setFellowships(updated); }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Award Date</label>
                          <input type="date" className="form-input" value={f.awardDate || ''} onChange={e => { const updated = [...fellowships]; updated[i].awardDate = e.target.value; setFellowships(updated); }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Reference No. / ID</label>
                          <input type="text" className="form-input" value={f.referenceNo || ''} onChange={e => { const updated = [...fellowships]; updated[i].referenceNo = e.target.value; setFellowships(updated); }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Duration</label>
                          <input type="text" className="form-input" placeholder="e.g. 5 Years" value={f.duration || ''} onChange={e => { const updated = [...fellowships]; updated[i].duration = e.target.value; setFellowships(updated); }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Amount</label>
                          <input type="text" className="form-input" placeholder="e.g. 31,000/month" value={f.amount || ''} onChange={e => { const updated = [...fellowships]; updated[i].amount = e.target.value; setFellowships(updated); }} />
                        </div>
                      </div>
                      <div style={{ marginTop: '12px' }}>
                        {getUploadButton(`fellowship_${i}`, user?.profile?.qualifications?.fellowships?.[i]?.certificateUrl)}
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setFellowships([...fellowships, { type: '', otherType: '', awardingBody: '', awardDate: '', referenceNo: '', amount: '', duration: '' }])} style={{ background: '#F1F5F9', color: '#334155', border: '1px dashed #CBD5E1', padding: '8px 16px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', width: '100%', marginBottom: '16px' }}>+ Add More Fellowships</button>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '12px', borderTop: '1px solid #E5E7EB' }}>
                    <button
                      type="button"
                      onClick={() => { setFellowships(user?.profile?.qualifications?.fellowships || []); setEditModes(prev => ({ ...prev, fellowships: false })); }}
                      style={{ background: '#6B7280', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => saveSection('fellowships')}
                      disabled={loading}
                      style={{ background: '#059669', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      💾 Save Fellowships
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* --- Tab 3: Preferred Guide Selection --- */}
        {subTab === 'guide' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#133A26', margin: '0 0 8px 0' }}>Advisor & Guide Preference of {user?.department}</h3>
            <p style={{ fontSize: '0.85rem', color: '#4B5563', margin: '0 0 12px 0' }}>
              Please select your preferred guide for Ph.D. supervision from the list of registered faculty members in your department. 
              This selection acts as your institutional preference for thesis allotment.
            </p>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>Preferred supervisor / Guide</label>
              <select 
                className="form-input" 
                value={preferredGuideId} 
                onChange={e => setPreferredGuideId(e.target.value)}
                disabled={!!thesis}
              >
                <option value="">Select Preferred Guide...</option>
                {faculties.map(fac => (
                  <option key={fac._id} value={fac._id}>
                    {fac.name} ({fac.subRole === 'HOD' ? 'HOD / ' : ''}Faculty)
                  </option>
                ))}
              </select>
            </div>

            {preferredGuideId && (
              <div style={{ padding: '16px', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px', marginTop: '12px' }}>
                <span style={{ fontSize: '0.85rem', color: '#065F46', fontWeight: 600 }}>
                  ✓ You have selected <strong>{faculties.find(f => f._id === preferredGuideId)?.name}</strong> as your preferred guide. 
                  This preference will be recorded and audited during your DRC enrollment clearance.
                </span>
              </div>
            )}
          </div>
        )}
        <div style={{ display: 'flex', gap: '16px', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #E5E7EB' }}>
          {/* If thesis is submitted and pending, show pending badge */}
          {thesis && thesis.status === 'REGISTRATION_PENDING' && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', color: '#D97706', fontSize: '0.85rem', fontWeight: 700, padding: '10px 16px' }}>
              ⏳ Awaiting HOD Verification
            </div>
          )}

          {/* Onboarding mode (no thesis submitted yet) */}
          {!thesis && (
            <>
              {/* General Tab Bottom Buttons */}
              {subTab === 'general' && (
                <>
                  {editModes.general ? (
                    <button 
                      type="submit" 
                      disabled={loading} 
                      className="btn-primary" 
                      style={{ flex: 1, background: '#1F2937', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                      {loading ? 'Saving Changes...' : '💾 Save General Info'}
                    </button>
                  ) : (
                    isGeneralInfoComplete() && (
                      <button 
                        type="button"
                        onClick={() => setSubTab('academic')}
                        className="btn-primary" 
                        style={{ flex: 1, background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)' }}
                      >
                        Move to next step: Academic Qualifications ➔
                      </button>
                    )
                  )}
                </>
              )}

              {/* Academic Tab Bottom Buttons */}
              {subTab === 'academic' && (
                isAcademicQualificationsComplete() && (
                  <button 
                    type="button"
                    onClick={() => setSubTab('guide')}
                    className="btn-primary" 
                    style={{ flex: 1, background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)' }}
                  >
                    Move to next step: Preferred Guide Selection ➔
                  </button>
                )
              )}

              {/* Guide Tab Bottom Buttons */}
              {subTab === 'guide' && (
                <>
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="btn-primary" 
                    style={{ flex: 1, background: '#1F2937', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    {loading ? 'Saving Changes...' : '💾 Save Guide Preference'}
                  </button>
                  <button 
                    type="button"
                    disabled={registering || !preferredGuideId}
                    onClick={handleProfileRegistrationSubmit}
                    className="btn-primary" 
                    style={{ 
                      flex: 1.2, 
                      background: preferredGuideId ? '#059669' : '#9CA3AF', 
                      color: 'white',
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '8px', 
                      border: 'none', 
                      cursor: preferredGuideId ? 'pointer' : 'not-allowed',
                      boxShadow: preferredGuideId ? '0 4px 6px -1px rgba(16, 185, 129, 0.2)' : 'none' 
                    }}
                    title={!preferredGuideId ? "Please select a preferred supervisor/guide to enable submission" : ""}
                  >
                    {registering ? 'Submitting...' : '🚀 Submit PhD Profile for HOD Approval'}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </form>
    </div>
  );
};

// ── All Milestone Records Component ──
const AllMilestonesRecords = ({ thesis, milestones = [], user }) => {
  const [drcMeetings, setDrcMeetings] = useState([]);
  const [racSessions, setRacSessions] = useState([]);
  const [expandedPhase, setExpandedPhase] = useState(null);

  useEffect(() => {
    if (thesis?._id) {
      axios.get(`${API}/lifecycle/drc/thesis/${thesis._id}`, getAuthHeader())
        .then(res => {
          if (Array.isArray(res.data)) setDrcMeetings(res.data);
        })
        .catch(() => {});

      axios.get(`${API}/lifecycle/rac/thesis/${thesis._id}`, getAuthHeader())
        .then(res => {
          if (Array.isArray(res.data)) setRacSessions(res.data);
        })
        .catch(() => {});
    }
  }, [thesis?._id]);

  const currentStatus = thesis?.status || 'REGISTRATION_PENDING';

  const PHASES = [
    { key: 'REGISTRATION_PENDING', label: 'Registration & Enrollment', desc: 'Admission details, tentative topic and guide preference verification.' },
    { key: 'COURSEWORK', label: 'Doctoral Coursework Clearance', desc: 'Mandatory exams in Research Methodology, Research Analysis, and Electives.' },
    { key: 'SYNOPSIS_PENDING', label: 'Research Synopsis & DRC Approval', desc: 'Presentation and approval of synopsis before the Departmental Research Committee.' },
    { key: 'ACTIVE_RESEARCH', label: 'Active Research & Progress Reviews', desc: 'Periodic progress reports and RAC evaluation panels.' },
    { key: 'PRE_SUBMISSION', label: 'Pre-Submission Colloquium', desc: 'Expert panel defense, plagiarism similarity clearance and rough draft review.' },
    { key: 'SUBMITTED', label: 'Thesis Evaluation & Viva-Voce', desc: 'External examiner review process and final oral defense.' },
    { key: 'AWARDED', label: 'Degree Conferral', desc: 'Final audit clearance and official Ph.D. degree award resolution.' }
  ];

  const currentStepIdx = PHASES.findIndex(p => p.key === currentStatus);
  const activeStepIdx = currentStepIdx === -1 ? 0 : currentStepIdx;

  const toggleExpand = (idx) => {
    setExpandedPhase(expandedPhase === idx ? null : idx);
  };

  const getStatusColor = (idx) => {
    if (idx < activeStepIdx) return { border: '#10B981', bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981', badge: 'COMPLETED' };
    if (idx === activeStepIdx) return { border: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)', text: '#3B82F6', badge: 'IN PROGRESS' };
    return { border: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)', text: '#6B7280', badge: 'LOCKED' };
  };

  const renderReadOnlySection = (title, items) => {
    if (!items || items.length === 0) return null;
    return (
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-primary, #374151)', marginBottom: 8, borderBottom: '1px solid var(--color-border, #E5E7EB)', paddingBottom: 4 }}>{title}</h4>
        <div style={{ background: 'var(--color-bg, #F9FAFB)', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--color-border, #E5E7EB)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--color-sidebar, #F3F4F6)', color: 'var(--color-text-secondary, #4B5563)', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px' }}>Subject Name</th>
                <th style={{ padding: '8px 12px' }}>Subject Code</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Marks Obtained</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Max Marks</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Exam Month & Year</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--color-border, #E5E7EB)' }}>
                  <td style={{ padding: '8px 12px', color: 'var(--color-text-primary, #1F2937)' }}>{row.subjectName}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--color-text-primary, #1F2937)' }}>{row.subjectCode || '-'}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--color-text-primary, #1F2937)' }}>{row.marksObtained}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--color-text-primary, #1F2937)' }}>{row.maxMarks}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--color-text-primary, #1F2937)' }}>{formatMonthYear(row.examinationMonthYear)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <style>{`
        .milestone-record-header:hover {
          background: rgba(59, 130, 246, 0.04) !important;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {/* Subpage Header card */}
      <div className="card" style={{ 
        padding: 24, 
        borderRadius: 16, 
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)', 
        border: '1px solid rgba(59, 130, 246, 0.15)' 
      }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary, #0F172A)' }}>
          📜 Ph.D. Milestone Progression Records
        </h3>
        <p style={{ color: 'var(--color-text-secondary, #475569)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
          Here is a detailed, audited historical ledger of all your academic milestones. Click on any milestone phase card to view grades, supervisor reviews, scheduled committee meetings, file attachments, and feedback.
        </p>
      </div>

      {/* Accordion / Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {PHASES.map((phase, idx) => {
          const { border, bg, text, badge } = getStatusColor(idx);
          const isExpanded = expandedPhase === idx;
          const isLocked = badge === 'LOCKED';

          return (
            <div 
              key={phase.key}
              style={{
                background: 'var(--color-surface, #FFFFFF)',
                border: `1px solid ${isExpanded ? '#3B82F6' : 'var(--color-border, #E2E8F0)'}`,
                borderLeft: `6px solid ${border}`,
                borderRadius: '16px',
                boxShadow: isExpanded ? '0 10px 25px -5px rgba(0,0,0,0.06)' : '0 2px 8px rgba(0,0,0,0.02)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                overflow: 'hidden'
              }}
            >
              {/* Card Header clickable bar */}
              <div 
                onClick={() => !isLocked && toggleExpand(idx)}
                style={{
                  padding: '20px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  background: isExpanded ? 'rgba(59, 130, 246, 0.02)' : 'transparent',
                  userSelect: 'none'
                }}
                className="milestone-record-header"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '80%' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: border,
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    flexShrink: 0
                  }}>
                    {idx + 1}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-text-primary, #0F172A)' }}>
                      {phase.label}
                    </h4>
                    <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--color-text-secondary, #64748B)' }}>
                      {phase.desc}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.03em',
                    background: bg,
                    color: text
                  }}>
                    {badge}
                  </span>
                  {!isLocked && (
                    <span style={{ 
                      color: 'var(--color-text-muted, #94A3B8)',
                      transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                      fontSize: '10px',
                      display: 'inline-block'
                    }}>
                      ▼
                    </span>
                  )}
                </div>
              </div>

              {/* Collapsible Panel Content */}
              {isExpanded && !isLocked && (
                <div style={{
                  padding: '20px 24px 24px 72px',
                  borderTop: '1px solid var(--color-border, #F1F5F9)',
                  background: 'var(--color-bg, rgba(248, 250, 252, 0.3))',
                  animation: 'fadeIn 0.25s ease-out'
                }}>
                  <div>
                    {phase.key === 'REGISTRATION_PENDING' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 30px', fontSize: '0.85rem' }}>
                        <div>
                          <div style={{ color: 'var(--color-text-secondary, #64748B)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: 4 }}>Enrollment Number</div>
                          <strong style={{ color: 'var(--color-text-primary, #0F172A)' }}>{thesis.enrollmentNumber || 'N/A'}</strong>
                        </div>
                        <div>
                          <div style={{ color: 'var(--color-text-secondary, #64748B)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: 4 }}>Registration Date</div>
                          <strong style={{ color: 'var(--color-text-primary, #0F172A)' }}>{thesis.startDate ? new Date(thesis.startDate).toLocaleDateString() : new Date(thesis.createdAt).toLocaleDateString()}</strong>
                        </div>
                        <div>
                          <div style={{ color: 'var(--color-text-secondary, #64748B)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: 4 }}>Department</div>
                          <strong style={{ color: 'var(--color-text-primary, #0F172A)' }}>{thesis.department}</strong>
                        </div>
                        <div>
                          <div style={{ color: 'var(--color-text-secondary, #64748B)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: 4 }}>Assigned Guide</div>
                          <strong style={{ color: 'var(--color-text-primary, #0F172A)' }}>{thesis.supervisorId?.name || 'Pending Supervisor Assignment'}</strong>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <div style={{ color: 'var(--color-text-secondary, #64748B)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: 4 }}>Tentative Research Topic</div>
                          <strong style={{ color: 'var(--color-text-primary, #0F172A)', lineHeight: 1.4 }}>{thesis.title || 'N/A'}</strong>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <div style={{ color: 'var(--color-text-secondary, #64748B)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: 4 }}>Research Abstract Outline</div>
                          <p style={{ color: 'var(--color-text-primary, #334155)', margin: '4px 0 0', lineHeight: 1.5 }}>{thesis.abstract || 'N/A'}</p>
                        </div>
                      </div>
                    )}

                    {phase.key === 'COURSEWORK' && (
                      <div>
                        {thesis.courseworkDetails ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {thesis.courseworkDetails.researchEthics?.length > 0 && 
                              renderReadOnlySection('Research and Publication Ethics', thesis.courseworkDetails.researchEthics)}
                            {thesis.courseworkDetails.researchMethodology?.length > 0 && 
                              renderReadOnlySection('Research Methodology', thesis.courseworkDetails.researchMethodology)}
                            {thesis.courseworkDetails.elective?.length > 0 && 
                              renderReadOnlySection('Discipline-Specific Elective Course', thesis.courseworkDetails.elective)}
                            {thesis.courseworkDetails.others?.length > 0 && 
                              renderReadOnlySection('Others', thesis.courseworkDetails.others)}

                            {thesis.courseworkUploadProof && (
                              <div style={{ marginTop: 8, padding: '10px 14px', background: 'var(--color-bg, #F9FAFB)', borderRadius: 8, border: '1px solid var(--color-border, #E5E7EB)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)' }}>Upload Proof:</span>
                                <a 
                                  href={`${API_BASE_URL}${thesis.courseworkUploadProof}`} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  style={{ fontSize: '0.82rem', fontWeight: 800, color: '#2563EB', textDecoration: 'underline' }}
                                >
                                  View Uploaded Proof
                                </a>
                              </div>
                            )}
                            
                            <div style={{ 
                              background: 'rgba(16, 185, 129, 0.15)', 
                              border: '1px solid rgba(16, 185, 129, 0.3)', 
                              borderRadius: '8px', 
                              padding: '12px 16px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              fontSize: '0.82rem',
                              color: '#10B981',
                              alignSelf: 'flex-start'
                            }}>
                              <span>✓</span> 
                              <span>Coursework results successfully verified and locked on HOD Clearance.</span>
                            </div>
                          </div>
                        ) : (
                          <div style={{ color: 'var(--color-text-secondary, #64748B)', fontSize: '0.85rem', fontStyle: 'italic' }}>
                            Coursework details have not been submitted or verification is pending.
                          </div>
                        )}
                      </div>
                    )}

                    {phase.key === 'SYNOPSIS_PENDING' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ background: 'var(--color-bg, #F8FAFC)', padding: 16, borderRadius: 8, border: '1px solid var(--color-border, #E2E8F0)' }}>
                          <div style={{ color: 'var(--color-text-secondary, #64748B)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: 4 }}>Approved Research Topic</div>
                          <strong style={{ color: 'var(--color-text-primary, #0F172A)', display: 'block', fontSize: '0.9rem', marginBottom: 12 }}>{thesis.title}</strong>
                          
                          <div style={{ color: 'var(--color-text-secondary, #64748B)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: 4 }}>Synopsis Document Proposal</div>
                          {thesis.synopsisUrl || milestones.find(m => m.type === 'SYNOPSIS')?.documentUrl ? (
                            <a 
                              href={`${API_BASE_URL}${thesis.synopsisUrl || milestones.find(m => m.type === 'SYNOPSIS')?.documentUrl}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#0284C7', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'underline', marginTop: 4 }}
                            >
                              📄 View Submitted Proposal Synopsis PDF
                            </a>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: '#EF4444' }}>No synopsis document uploaded.</span>
                          )}
                        </div>

                        {/* DRC evaluation details */}
                        <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 8, padding: 16 }}>
                          <h5 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: 800, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>📆</span> Departmental Research Committee (DRC) Evaluation
                          </h5>
                          {drcMeetings.length === 0 ? (
                            <div style={{ fontSize: '0.8rem', color: '#fbbf24' }}>
                              No DRC evaluation sessions scheduled.
                            </div>
                          ) : (
                            drcMeetings.map((drc, idx) => (
                              <div key={idx} style={{ borderBottom: idx < drcMeetings.length - 1 ? '1px dashed rgba(245, 158, 11, 0.3)' : 'none', paddingBottom: idx < drcMeetings.length - 1 ? 12 : 0, marginBottom: idx < drcMeetings.length - 1 ? 12 : 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Session Allotment Result</span>
                                  <span style={{ background: drc.status === 'APPROVED' ? '#D1FAE5' : '#FEE2E2', color: drc.status === 'APPROVED' ? '#065F46' : '#991B1B', padding: '2px 8px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 700 }}>
                                    {drc.status}
                                  </span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: '0.8rem', color: '#fbbf24' }}>
                                  <div>Date: <strong>{new Date(drc.scheduledDate).toLocaleDateString()}</strong></div>
                                  <div>Time: <strong>{drc.scheduledTime}</strong></div>
                                  <div style={{ gridColumn: 'span 2' }}>Venue: <strong>{drc.venue}</strong></div>
                                  {drc.committeeMembers && <div style={{ gridColumn: 'span 2' }}>Committee: <strong>{drc.committeeMembers}</strong></div>}
                                  {drc.remarks && (
                                    <div style={{ gridColumn: 'span 2', background: 'var(--color-surface, #FFFFFF)', padding: 8, borderRadius: 6, borderLeft: '3px solid #D97706', marginTop: 4 }}>
                                      Committee Remarks: <em>"{drc.remarks}"</em>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {phase.key === 'ACTIVE_RESEARCH' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* RAC Sessions */}
                        <div style={{ background: 'var(--color-bg, #F8FAFC)', border: '1px solid var(--color-border, #E2E8F0)', borderRadius: 8, padding: 16 }}>
                          <h5 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-primary, #1E293B)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>📊</span> Research Advisory Committee (RAC) Progress Reviews
                          </h5>
                          {racSessions.length === 0 ? (
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary, #64748B)', fontStyle: 'italic' }}>
                              No RAC progress reviews recorded yet. Reviews occur at 6-month intervals.
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {racSessions.map((rac, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--color-surface, #FFFFFF)', border: '1px solid var(--color-border, #E2E8F0)', borderRadius: 6 }}>
                                  <div>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary, #334155)' }}>RAC Session #{idx + 1}</span>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary, #94A3B8)', marginTop: 2 }}>
                                      Date: {new Date(rac.scheduledDate).toLocaleDateString()} | Committee: {rac.committeeMembers || 'Guide & Panel'}
                                    </div>
                                  </div>
                                  <span style={{
                                    background: rac.status === 'SATISFACTORY' ? '#D1FAE5' : '#FEE2E2',
                                    color: rac.status === 'SATISFACTORY' ? '#065F46' : '#991B1B',
                                    padding: '2px 8px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 700
                                  }}>
                                    {rac.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 6-Month Progress Reports */}
                        <div style={{ background: 'var(--color-bg, #F8FAFC)', border: '1px solid var(--color-border, #E2E8F0)', borderRadius: 8, padding: 16 }}>
                          <h5 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-primary, #1E293B)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>📅</span> 6-Month Progress Reports History
                          </h5>
                          {milestones.filter(m => m.type === '6_MONTH_REPORT' || m.type === 'PROGRESS_REPORT').length === 0 ? (
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary, #64748B)', fontStyle: 'italic' }}>
                              No progress report milestones generated yet.
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {milestones.filter(m => m.type === '6_MONTH_REPORT' || m.type === 'PROGRESS_REPORT').map((rep) => (
                                <div key={rep._id} style={{ padding: 12, background: 'var(--color-surface, #FFFFFF)', border: '1px solid var(--color-border, #E2E8F0)', borderRadius: 6 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                    <strong style={{ fontSize: '0.8rem', color: 'var(--color-text-primary, #1E293B)' }}>{rep.title}</strong>
                                    <span style={{
                                      background: rep.status === 'APPROVED' ? '#D1FAE5' : rep.status === 'SUBMITTED' ? '#DBEAFE' : '#FEF3C7',
                                      color: rep.status === 'APPROVED' ? '#065F46' : rep.status === 'SUBMITTED' ? '#1D4ED8' : '#D97706',
                                      padding: '2px 8px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 700
                                    }}>
                                      {rep.status}
                                    </span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--color-text-secondary, #64748B)' }}>
                                    <span>Due Date: {new Date(rep.dueDate).toLocaleDateString()}</span>
                                    {rep.documentUrl && (
                                      <a href={`${API_BASE_URL}${rep.documentUrl}`} target="_blank" rel="noreferrer" style={{ color: '#0284C7', fontWeight: 600 }}>
                                        View Uploaded Report
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {phase.key === 'PRE_SUBMISSION' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ background: 'var(--color-bg, #F8FAFC)', border: '1px solid var(--color-border, #E2E8F0)', borderRadius: 8, padding: 16 }}>
                          <h5 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-primary, #1E293B)' }}>
                            Pre-Submission Package Documents
                          </h5>
                          {milestones.find(m => m.type === 'PRE_SUBMISSION') ? (
                            (() => {
                              const preM = milestones.find(m => m.type === 'PRE_SUBMISSION');
                              return (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                    <span style={{ color: 'var(--color-text-secondary, #64748B)' }}>Submission Status:</span>
                                    <strong style={{ color: '#3B82F6' }}>{preM.status}</strong>
                                  </div>
                                  {preM.documentUrl && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                                      <span>📄</span>
                                      <a href={`${API_BASE_URL}${preM.documentUrl}`} target="_blank" rel="noreferrer" style={{ color: '#2563EB', fontWeight: 700 }}>
                                        View Rough Thesis Draft Complete
                                      </a>
                                    </div>
                                  )}
                                  {preM.plagiarismReportUrl && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem' }}>
                                      <span>📊</span>
                                      <a href={`${API_BASE_URL}${preM.plagiarismReportUrl}`} target="_blank" rel="noreferrer" style={{ color: '#10B981', fontWeight: 700 }}>
                                        View Plagiarism Clearance Certificate
                                      </a>
                                    </div>
                                  )}
                                </div>
                              );
                            })()
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary, #64748B)', fontStyle: 'italic' }}>Pre-submission package not uploaded.</span>
                          )}
                        </div>
                      </div>
                    )}

                    {phase.key === 'SUBMITTED' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ background: 'var(--color-bg, #F8FAFC)', border: '1px solid var(--color-border, #E2E8F0)', borderRadius: 8, padding: 16 }}>
                          <h5 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-primary, #1E293B)' }}>
                            Thesis Board Evaluation Dispatch Tracking
                          </h5>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', fontSize: '0.8rem', color: 'var(--color-text-primary, #334155)' }}>
                            <div>Dispatch Status: <strong>{thesis.dispatchDate ? 'DISPATCHED TO EXAMINERS' : 'AWAITING DISPATCH'}</strong></div>
                            {thesis.dispatchDate && (
                              <>
                                <div>Dispatch Date: <strong>{new Date(thesis.dispatchDate).toLocaleDateString()}</strong></div>
                                <div>Shipping Method: <strong>{thesis.dispatchMethod || 'N/A'}</strong></div>
                                <div>Tracking Reference: <strong>{thesis.dispatchTrackingNumber || 'N/A'}</strong></div>
                              </>
                            )}
                          </div>
                        </div>

                        <div style={{ background: 'var(--color-bg, #F8FAFC)', border: '1px solid var(--color-border, #E2E8F0)', borderRadius: 8, padding: 16 }}>
                          <h5 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-primary, #1E293B)' }}>
                            Viva-Voce Oral Defense Examination
                          </h5>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', fontSize: '0.8rem', color: 'var(--color-text-primary, #334155)' }}>
                            <div>Defense Status: <strong>{thesis.vivaStatus || 'AWAITING EVALUATION BOARD REPORT'}</strong></div>
                            {thesis.vivaDate && (
                              <>
                                <div>Date Scheduled: <strong>{new Date(thesis.vivaDate).toLocaleDateString()}</strong></div>
                                <div>Time / Venue: <strong>{thesis.vivaTime} / {thesis.vivaVenue || 'N/A'}</strong></div>
                              </>
                            )}
                            {thesis.vivaRemarks && (
                              <div style={{ gridColumn: 'span 2', background: 'var(--color-surface, #FFFFFF)', padding: 10, borderLeft: '4px solid #10B981', borderRadius: 6 }}>
                                Panel Remarks: <strong>"{thesis.vivaRemarks}"</strong>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {phase.key === 'AWARDED' && (
                      <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 8, padding: 16 }}>
                        <h5 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', fontWeight: 800, color: '#10B981', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>🏆</span> Ph.D. Degree Conferred Successfully!
                        </h5>
                        <div style={{ fontSize: '0.8rem', color: '#10B981', display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div>Academic Senate Approval Date: <strong>{thesis.awardedAt ? new Date(thesis.awardedAt).toLocaleDateString() : 'N/A'}</strong></div>
                          {thesis.notificationNumber && <div>Award Notification Number: <strong>{thesis.notificationNumber}</strong></div>}
                          <div>Clearance Status: <strong>Library, Department, and Admin Clearances COMPLETED</strong></div>
                          
                          <div style={{ marginTop: 12, borderTop: '1px solid rgba(16, 185, 129, 0.3)', paddingTop: 8 }}>
                            🎉 <strong>HPU Academic Council congratulates Dr. {user?.name}!</strong> Your doctorate degree is formally awarded.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Main Dashboard ──
const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [milestonesSubTab, setMilestonesSubTab] = useState('active');
  const { user } = useContext(AuthContext);
  const { thesis, milestones, loading, fetchMyThesis, submitMilestone } = useContext(ThesisContext);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(user && !user.profileCompleted);

  useEffect(() => { 
    fetchMyThesis(); 
  }, []);

  useEffect(() => {
    if (thesis && thesis.status !== 'REGISTRATION_PENDING') {
      setActiveTab('overview');
    }
  }, [thesis]);

  const titles = { 
    overview: 'Student Dashboard', 
    thesis: 'My Thesis', 
    rac: 'RAC Progress', 
    publications: 'Research Outputs', 
    sixMonthReports: '6-Month Progress Reports',
    chapterDrafts: 'Chapter Drafts Workspace',
    preSubmission: 'Pre-Submission Package',
    changes: 'Request Changes', 
    certificates: 'Certificates', 
    workspace: 'Workspace', 
    documents: 'Documents', 
    meetings: 'Meetings', 
    profile: 'Profile' 
  };

  const renderStatusContent = () => {
    if (loading) {
      return (
        <div className="premium-preloader-container">
          <div className="premium-preloader-spinner"></div>
          <div className="premium-preloader-text">Fetching your research records...</div>
        </div>
      );
    }

    if (!thesis) {
      if (activeTab === 'profile') return <ProfileTab />;
      return (
        <div className="card" style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', padding: 48 }}>
          <ClipboardList size={64} color="#9CA3AF" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>Ph.D. Profile Registration Required</h3>
          <p style={{ color: '#6b7280', marginBottom: 24 }}>Please complete all required details in the **Profile** tab and click **Submit PhD Profile for HOD Approval** to register and unlock the student portal features.</p>
          <button className="btn-primary" onClick={() => setActiveTab('profile')}>Go to Profile Tab</button>
        </div>
      );
    }

    if (thesis.status === 'REGISTRATION_PENDING') {
      if (activeTab === 'profile') return <ProfileTab />;
      return <WaitingRoom thesis={thesis} />;
    }

    switch (activeTab) {
      case 'overview': return <OverviewPage thesis={thesis} milestones={milestones} setActiveTab={setActiveTab} user={user} />;
      case 'rac': return <RACProgressTab thesis={thesis} />;
      case 'publications': return <ResearchOutputsTab thesis={thesis} />;
      case 'preSubmission': return <PreSubmission thesis={thesis} milestones={milestones} onSubmit={fetchMyThesis} user={user} />;
      case 'finalSubmission': return <FinalSubmission thesis={thesis} milestones={milestones} onSubmit={fetchMyThesis} user={user} />;
      case 'sixMonthReports': return <SixMonthReportsTab thesis={thesis} milestones={milestones} onSubmit={submitMilestone} />;
      case 'chapterDrafts': return <ChapterDraftsTab thesis={thesis} milestones={milestones} onSubmit={submitMilestone} />;
      case 'changes': return <RequestChangesTab thesis={thesis} />;
      case 'certificates': return <CertificatesTab thesis={thesis} />;
      case 'meetings': return <MeetingsTab thesis={thesis} />;
      case 'documents': return <DocumentsTab thesis={thesis} />;
      case 'workspace':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <MilestoneTimeline thesis={thesis} milestones={milestones} />
            
            {/* Custom Sub Tab Selector for Milestones */}
            <div style={{
              display: 'flex',
              background: 'var(--color-bg, #F1F5F9)',
              padding: '6px',
              borderRadius: '12px',
              gap: '8px',
              maxWidth: '450px',
              margin: '8px 0',
              border: '1px solid var(--color-border, #E2E8F0)',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
            }} className="milestone-tabs-container">
              <button 
                onClick={() => setMilestonesSubTab('active')}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: milestonesSubTab === 'active' ? 'var(--color-surface, #FFFFFF)' : 'transparent',
                  color: milestonesSubTab === 'active' ? 'var(--color-primary, #1A5A3B)' : 'var(--color-text-secondary, #64748B)',
                  boxShadow: milestonesSubTab === 'active' ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                🎯 Active Task Workspace
              </button>
              <button 
                onClick={() => setMilestonesSubTab('records')}
                style={{
                  flex: 1,
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: milestonesSubTab === 'records' ? 'var(--color-surface, #FFFFFF)' : 'transparent',
                  color: milestonesSubTab === 'records' ? 'var(--color-primary, #1A5A3B)' : 'var(--color-text-secondary, #64748B)',
                  boxShadow: milestonesSubTab === 'records' ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none'
                }}
              >
                📜 All Milestone Records
              </button>
            </div>

            {milestonesSubTab === 'active' ? (
              (() => {
                if (thesis.status === 'COURSEWORK') return <CourseworkPhase thesis={thesis} />;
                if (thesis.status === 'SYNOPSIS_PENDING') return <SynopsisPhase thesis={thesis} milestones={milestones} onSubmit={submitMilestone} />;
                if (thesis.status === 'ACTIVE_RESEARCH') return <ActiveResearch thesis={thesis} milestones={milestones} onSubmit={submitMilestone} setActiveTab={setActiveTab} />;
                if (thesis.status === 'PRE_SUBMISSION') return <PreSubmission thesis={thesis} milestones={milestones} onSubmit={submitMilestone} user={user} />;
                if (['THESIS_SUBMITTED', 'PENDING_SUPERVISOR', 'PENDING_HOD', 'SUBMITTED'].includes(thesis.status)) {
                  const finalM = milestones.find(m => m.type === 'FINAL_SUBMISSION');
                  if (finalM && finalM.status === 'APPROVED') {
                    return <SubmittedView thesis={thesis} />;
                  }
                  return <FinalSubmission thesis={thesis} milestones={milestones} onSubmit={submitMilestone} user={user} />;
                }
                if (thesis.status === 'AWARDED') return <SubmittedView thesis={thesis} />;
                return <div className="card" style={{ padding: 32, color: '#6b7280' }}>No milestones yet.</div>;
              })()
            ) : (
              <AllMilestonesRecords thesis={thesis} milestones={milestones} user={user} />
            )}
          </div>
        );
      case 'thesis':
        if (['THESIS_SUBMITTED', 'PENDING_SUPERVISOR', 'PENDING_HOD', 'SUBMITTED'].includes(thesis.status)) {
          const finalM = milestones.find(m => m.type === 'FINAL_SUBMISSION');
          if (finalM && finalM.status === 'APPROVED') {
            return <SubmittedView thesis={thesis} />;
          }
        }
        if (thesis.status === 'AWARDED') return <AwardedView thesis={thesis} />;
        return (
          <div className="card">
            <h3 className="card-title">Thesis Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {[['Title', thesis.title],['Enrollment', thesis.enrollmentNumber],['Department', thesis.department],['Status', thesis.status],['Supervisor', thesis.supervisorId?.name || 'Pending'],['Start Date', thesis.startDate ? new Date(thesis.startDate).toLocaleDateString() : 'N/A']].map(([k, v]) => (
                <div key={k}><div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: 4 }}>{k}</div><div style={{ fontWeight: 600, color: '#111827' }}>{v}</div></div>
              ))}
            </div>
          </div>
        );
      case 'profile': return <ProfileTab />;
      default: return <div className="card"><h3 className="card-title">{titles[activeTab]}</h3><p style={{ color: '#6b7280', marginTop: 8 }}>Content coming soon.</p></div>;
    }
  };
  return (
    <div className="app-container">
      <div className="mobile-overlay" onClick={() => document.body.classList.remove('sidebar-mobile-open')} />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isVerified={thesis && thesis.status !== 'REGISTRATION_PENDING'} thesis={thesis} milestones={milestones} />
      <div className="main-content" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Floating warning banner */}
        {user && !user.profileCompleted && (
          <div style={{
            background: '#FEE2E2',
            color: '#DC2626',
            padding: '12px 24px',
            textAlign: 'center',
            fontSize: '0.9rem',
            fontWeight: 600,
            borderBottom: '1px solid #FCA5A5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            zIndex: 999
          }}>
            <span>⚠️ Please complete your profile first before proceeding further.</span>
            <button 
              onClick={() => setIsOnboardingOpen(true)}
              style={{
                background: '#DC2626',
                color: 'white',
                border: 'none',
                padding: '4px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Complete Profile
            </button>
          </div>
        )}
        
        <Header title={titles[activeTab] || 'Dashboard'} />
        <div className="dashboard-area" style={{ flex: 1 }}>
          <div className="welcome-banner">
            <div><span className="welcome-text">Welcome, {user?.name || 'Scholar'}!</span><span className="welcome-subtext"> | Ph.D. Scholar Portal</span></div>
            <div className="brand-text">HPU ScholarSync</div>
          </div>
          {renderStatusContent()}
        </div>
      </div>
      <ProfileOnboardingModal 
        isOpen={isOnboardingOpen} 
        onClose={() => setIsOnboardingOpen(false)} 
        onGo={() => { setActiveTab('profile'); setIsOnboardingOpen(false); }} 
      />
    </div>
  );
};

export default StudentDashboard;
