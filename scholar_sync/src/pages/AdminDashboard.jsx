import React, { useState, useContext, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Home, Users, FileText, BarChart2, Settings, LogOut, Bell, CheckCircle2, User, GraduationCap, ShieldCheck, Clock, XCircle, Layers, Award, Edit, File, Plus, Calendar, Search, BookOpen } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { ThesisContext } from '../context/ThesisContext';
import { useToast } from '../context/ToastContext';
import axios from 'axios';
import { API_BASE_URL, API_URL } from '../config';
import { useTabPersistence } from '../hooks/useTabPersistence';
import ProfileOnboardingModal from '../components/ProfileOnboardingModal';
import NotificationPanel from '../components/NotificationPanel';
import ThemeToggle from '../components/ThemeToggle';
import UnifiedScholarModal from '../components/UnifiedScholarModal';
import PublicConfigTab from '../components/PublicConfigTab';
import DetailedReportsTab from '../components/DetailedReportsTab';
import ScholarSearchTab from '../components/ScholarSearchTab';

const API = API_URL;
const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });



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
            <img src={`${API_BASE_URL}${user.avatarUrl}`} alt="Admin" className="user-avatar" style={{ objectFit: 'cover' }} />
          ) : (
            <svg viewBox="0 0 100 100" className="user-avatar" style={{ width: 36, height: 36, borderRadius: '50%', background: '#e2e8f0', display: 'block' }}>
              <circle cx="50" cy="35" r="20" fill="#94a3b8" />
              <path d="M15 85c0-13.8 11.2-25 25-25h20c13.8 0 25 11.2 25 25z" fill="#94a3b8" />
            </svg>
          )}
          <div className="user-info"><span className="user-name">{user?.name || 'Admin'}</span><span className="user-dept">{user?.role || 'ADMIN'}</span></div>
        </div>
      </div>
    </div>
  );
};

const resolveDetailedStatus = (status, synopsisStatus, finalSubStatus, subRole, preSubMilestoneStatus, preSubSeminarStatus) => {
  if (status === 'REGISTRATION_PENDING') return { text: 'Awaiting Verification', color: '#D97706', bg: '#FFF3CD' };
  if (status === 'COURSEWORK') return { text: 'Coursework Phase', color: '#0284C7', bg: '#E0F2FE' };
  if (status === 'SYNOPSIS_PENDING') {
    if (synopsisStatus === 'SUBMITTED') {
      if (subRole === 'HOD') {
        return { text: 'Synopsis Pending Upload', color: '#7C3AED', bg: '#EDE9FE' };
      }
      return { text: 'Synopsis Submitted (Under Review)', color: '#2563EB', bg: '#DBEAFE' };
    }
    if (synopsisStatus === 'PENDING_HOD') return { text: 'Pending HOD Approval & DRC Pending', color: '#D97706', bg: '#FFFBEB' };
    if (synopsisStatus === 'APPROVED') return { text: 'Synopsis Approved (DRC Pending at HOD)', color: '#059669', bg: '#D1FAE5' };
    if (synopsisStatus === 'REVISION_REQUIRED') return { text: 'Synopsis Correction Needed', color: '#DC2626', bg: '#FEE2E2' };
    return { text: 'Synopsis Pending Upload', color: '#7C3AED', bg: '#EDE9FE' };
  }
  if (status === 'ACTIVE_RESEARCH') return { text: 'Active Research', color: '#059669', bg: '#D1FAE5' };
  if (status === 'PRE_SUBMISSION') {
    if (finalSubStatus === 'SUBMITTED') return { text: 'Thesis Submitted (Awaiting Review)', color: '#2563EB', bg: '#DBEAFE' };
    if (finalSubStatus === 'REVISION_REQUIRED') return { text: 'Thesis Revision Required', color: '#DC2626', bg: '#FEE2E2' };
    
    if (preSubMilestoneStatus === 'SUBMITTED') {
      return { text: 'Thesis Draft & Plagiarism Report Submitted (Pending Faculty Review)', color: '#2563EB', bg: '#DBEAFE' };
    }
    if (preSubMilestoneStatus === 'PENDING_HOD') {
      return { text: 'Draft Approved by Supervisor (Pending HOD Sign-off)', color: '#D97706', bg: '#FFF3CD' };
    }
    if (preSubMilestoneStatus === 'REVISION_REQUIRED') {
      return { text: 'Thesis Draft Correction Needed', color: '#DC2626', bg: '#FEE2E2' };
    }
    if (preSubSeminarStatus === 'SCHEDULED') {
      return { text: 'Pre-Submission Seminar Scheduled', color: '#7C3AED', bg: '#EDE9FE' };
    }
    if (preSubSeminarStatus === 'CLEARED') {
      return { text: 'Pre-Submission Seminar Cleared', color: '#059669', bg: '#D1FAE5' };
    }
    if (preSubSeminarStatus === 'UNCLEARED') {
      return { text: 'Pre-Submission Seminar Uncleared (Unsatisfactory)', color: '#DC2626', bg: '#FEE2E2' };
    }
    if (preSubMilestoneStatus === 'APPROVED') {
      return { text: 'Draft Approved (Awaiting Seminar Schedule)', color: '#D97706', bg: '#FFFBEB' };
    }

    return { text: 'Pre-Submission Phase', color: '#D97706', bg: '#FFF3CD' };
  }
  if (status === 'SUBMITTED') {
    if (finalSubStatus === 'SUBMITTED') {
      return { text: 'Final Thesis Submitted (Pending Sign-off)', color: '#2563EB', bg: '#DBEAFE' };
    }
    if (finalSubStatus === 'REVISION_REQUIRED') {
      return { text: 'Final Thesis Revision Required', color: '#DC2626', bg: '#FEE2E2' };
    }
    if (finalSubStatus === 'APPROVED') {
      return { text: 'Thesis Approved (Under Evaluation)', color: '#10B981', bg: '#ECFDF5' };
    }
    return { text: 'Thesis Submission Phase (Awaiting Upload)', color: '#D97706', bg: '#FFFBEB' };
  }
  if (status === 'AWARDED') return { text: 'Degree Awarded! 🎉', color: '#10B981', bg: '#ECFDF5' };
  return { text: status?.replace(/_/g, ' '), color: '#374151', bg: '#F3F4F6' };
};

const STATUS_COLOR = { REGISTRATION_PENDING: '#D97706', COURSEWORK: '#3B82F6', SYNOPSIS_PENDING: '#8B5CF6', ACTIVE_RESEARCH: '#059669', PRE_SUBMISSION: '#EA580C', SUBMITTED: '#6B7280', AWARDED: '#10B981' };
const STATUS_BG = {
  REGISTRATION_PENDING: '#FFF3CD',
  COURSEWORK: '#E0F2FE',
  SYNOPSIS_PENDING: '#EDE9FE',
  ACTIVE_RESEARCH: '#D1FAE5',
  PRE_SUBMISSION: '#FFE8D6',
  SUBMITTED: '#F3F4F6',
  AWARDED: '#ECFDF5',
};

// ── Scholar Detail Modal ──
const ScholarDetail = ({ thesisId, onClose, onAction }) => {
  const toast = useToast();
  const { user } = useContext(AuthContext);
  const { transferScholar } = useContext(ThesisContext);
  const [data, setData] = useState(null);
  const [faculty, setFaculty] = useState([]);
  const [selSupervisor, setSelSupervisor] = useState('');
  const [auditNote, setAuditNote] = useState('');
  const [loading, setLoading] = useState(false);

  // Transfer variables
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [allHods, setAllHods] = useState([]);

  // Accordion open-close states
  const [accordionOpen, setAccordionOpen] = useState({
    general: true,
    academic: false,
    guide: false,
    timeline: false,
    milestones: false
  });

  const toggleSection = (section) => {
    setAccordionOpen(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // DRC variables
  const [drcMeetings, setDrcMeetings] = useState([]);
  const [showDrcSchedule, setShowDrcSchedule] = useState(false);
  const [drcForm, setDrcForm] = useState({ scheduledDate: '', scheduledTime: '', venue: '', committeeMembers: '', agenda: '' });
  const [showDrcResult, setShowDrcResult] = useState(false);
  const [selectedDrc, setSelectedDrc] = useState(null);
  const [drcResultForm, setDrcResultForm] = useState({ status: 'APPROVED', remarks: '' });

  // Pre-Submission variables
  const [showPreSubSchedule, setShowPreSubSchedule] = useState(false);
  const [preSubForm, setPreSubForm] = useState({ scheduledDate: '', scheduledTime: '', venue: '', committeeMembers: '' });
  const [preSubResultForm, setPreSubResultForm] = useState({ status: 'SUCCESSFUL', remarks: '' });
  const [showPreSubResult, setShowPreSubResult] = useState(false);

  const handlePreSubScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!preSubForm.scheduledDate || !preSubForm.scheduledTime || !preSubForm.venue) {
      return toast.warning('Please fill in Date, Time, and Venue');
    }
    setLoading(true);
    try {
      await axios.put(`${API}/thesis/${thesisId}/schedule-seminar`, preSubForm, getAuthHeader());
      toast.success('Pre-Submission Seminar scheduled successfully!');
      setShowPreSubSchedule(false);
      setPreSubForm({ scheduledDate: '', scheduledTime: '', venue: '', committeeMembers: '' });
      const r = await axios.get(`${API}/thesis/${thesisId}`, getAuthHeader());
      setData(r.data);
      if (onAction) onAction(thesisId, 'refresh_list');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule seminar');
    } finally {
      setLoading(false);
    }
  };

  const handlePreSubResultSubmit = async (e) => {
    e.preventDefault();
    if (!preSubResultForm.remarks.trim()) {
      return toast.warning('Please enter MoM / Committee Remarks.');
    }
    setLoading(true);
    try {
      if (preSubResultForm.status === 'SUCCESSFUL') {
        await axios.put(`${API}/thesis/${thesisId}/seminar`, { remarks: preSubResultForm.remarks }, getAuthHeader());
        toast.success('Pre-Submission Seminar cleared successfully! Scholar moved to PRE_SUBMISSION.');
      } else {
        const preMilestone = milestones.find(m => m.type === 'PRE_SUBMISSION');
        await axios.put(`${API}/milestones/${preMilestone._id}/review`, {
          action: 'REVISION',
          comment: preSubResultForm.remarks
        }, getAuthHeader());
        toast.success('Pre-Submission Package reverted to student for corrections.');
      }
      setShowPreSubResult(false);
      setPreSubResultForm({ status: 'SUCCESSFUL', remarks: '' });
      const r = await axios.get(`${API}/thesis/${thesisId}`, getAuthHeader());
      setData(r.data);
      if (onAction) onAction(thesisId, 'refresh_list');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record outcome');
    } finally {
      setLoading(false);
    }
  };

  // Phase 6 variables
  const [dispatchForm, setDispatchForm] = useState({ dispatchDate: '', dispatchMethod: 'Speed Post', dispatchTrackingNumber: '' });
  const [showDispatchForm, setShowDispatchForm] = useState(false);
  const [showVivaScheduleForm, setShowVivaScheduleForm] = useState(false);
  const [vivaForm, setVivaForm] = useState({ vivaDate: '', vivaTime: '', vivaVenue: '', vivaPanel: '' });
  const [showVivaOutcomeForm, setShowVivaOutcomeForm] = useState(false);
  const [vivaOutcomeForm, setVivaOutcomeForm] = useState({ vivaStatus: 'SUCCESSFUL', remarks: '' });

  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    if (!dispatchForm.dispatchDate || !dispatchForm.dispatchMethod) {
      return toast.warning('Please fill in Dispatch Date and Method');
    }
    setLoading(true);
    try {
      await axios.put(`${API}/thesis/${thesisId}/dispatch`, dispatchForm, getAuthHeader());
      toast.success('Examiner dispatch details logged successfully!');
      setShowDispatchForm(false);
      const r = await axios.get(`${API}/thesis/${thesisId}`, getAuthHeader());
      setData(r.data);
      if (onAction) onAction(thesisId, 'refresh_list');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to log dispatch details');
    } finally {
      setLoading(false);
    }
  };

  const handleVivaScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!vivaForm.vivaDate || !vivaForm.vivaTime || !vivaForm.vivaVenue) {
      return toast.warning('Please fill in Date, Time, and Venue');
    }
    setLoading(true);
    try {
      await axios.put(`${API}/thesis/${thesisId}/schedule-viva`, vivaForm, getAuthHeader());
      toast.success('Viva-Voce defense scheduled successfully!');
      setShowVivaScheduleForm(false);
      const r = await axios.get(`${API}/thesis/${thesisId}`, getAuthHeader());
      setData(r.data);
      if (onAction) onAction(thesisId, 'refresh_list');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule Viva-Voce');
    } finally {
      setLoading(false);
    }
  };

  const handleVivaOutcomeSubmit = async (e) => {
    e.preventDefault();
    if (!vivaOutcomeForm.remarks.trim()) {
      return toast.warning('Please enter evaluation remarks');
    }
    setLoading(true);
    try {
      await axios.put(`${API}/thesis/${thesisId}/record-viva`, vivaOutcomeForm, getAuthHeader());
      toast.success('Viva-Voce defense outcome recorded successfully!');
      setShowVivaOutcomeForm(false);
      const r = await axios.get(`${API}/thesis/${thesisId}`, getAuthHeader());
      setData(r.data);
      if (onAction) onAction(thesisId, 'refresh_list');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record Viva-Voce outcome');
    } finally {
      setLoading(false);
    }
  };

  const fetchDrcMeetings = async () => {
    try {
      const res = await axios.get(`${API}/lifecycle/drc/thesis/${thesisId}`, getAuthHeader());
      setDrcMeetings(res.data);
    } catch (err) {}
  };

  const [publications, setPublications] = useState([]);

  useEffect(() => {
    axios.get(`${API}/thesis/${thesisId}`, getAuthHeader()).then(r => {
      setData(r.data);
      if (r.data?.thesis?.supervisorId) {
        setSelSupervisor(r.data.thesis.supervisorId._id || r.data.thesis.supervisorId);
      }
    });
    axios.get(`${API}/auth/faculty`, getAuthHeader()).then(r => setFaculty(r.data)).catch(() => {});
    axios.get(`${API}/publications/thesis/${thesisId}`, getAuthHeader()).then(r => setPublications(r.data)).catch(() => {});
    fetchDrcMeetings();
  }, [thesisId]);

  useEffect(() => {
    if (showTransferModal && data?.thesis?.department) {
      axios.get(`${API}/auth/faculty`, getAuthHeader())
        .then(r => {
          // Filter to verified HODs and Faculty in the same department, excluding current supervisor
          const currentSupervisorId = data.thesis.supervisorId?._id || data.thesis.supervisorId;
          const eligible = r.data.filter(f => f.isVerified && f.department === data.thesis.department && f._id !== currentSupervisorId);
          setAllHods(eligible);
        })
        .catch(() => {});
    }
  }, [showTransferModal, data?.thesis?.department, data?.thesis?.supervisorId]);

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!transferTargetId) return toast.warning('Please select a verified supervisor to transfer this scholar to.');
    setTransferLoading(true);
    try {
      await transferScholar(thesisId, transferTargetId);
      toast.success('Supervision transferred successfully within the department!');
      setShowTransferModal(false);
      onClose(); // Close details modal to refresh views
      if (onAction) onAction(thesisId, 'refresh_list');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to transfer supervision.');
    } finally {
      setTransferLoading(false);
    }
  };

  const act = async (action, payload = {}) => {
    setLoading(true);
    try {
      await onAction(thesisId, action, payload);
      const r = await axios.get(`${API}/thesis/${thesisId}`, getAuthHeader());
      setData(r.data);
      if (r.data?.thesis?.supervisorId) {
        setSelSupervisor(r.data.thesis.supervisorId._id || r.data.thesis.supervisorId);
      }
      fetchDrcMeetings();
      axios.get(`${API}/publications/thesis/${thesisId}`, getAuthHeader()).then(r => setPublications(r.data)).catch(() => {});
    }
    catch (e) { toast.error(e.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  const handleDrcScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!drcForm.scheduledDate || !drcForm.scheduledTime || !drcForm.venue) {
      return toast.warning('Please fill in Date, Time, and Venue');
    }
    setLoading(true);
    try {
      await axios.post(`${API}/lifecycle/drc/schedule`, { thesisId, ...drcForm }, getAuthHeader());
      toast.success('DRC meeting scheduled successfully!');
      setShowDrcSchedule(false);
      setDrcForm({ scheduledDate: '', scheduledTime: '', venue: '', committeeMembers: '', agenda: '' });
      fetchDrcMeetings();
      const r = await axios.get(`${API}/thesis/${thesisId}`, getAuthHeader());
      setData(r.data);
      if (onAction) onAction(thesisId, 'refresh_list');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule DRC meeting');
    } finally {
      setLoading(false);
    }
  };

  const handleDrcResultSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDrc) return;
    setLoading(true);
    try {
      await axios.put(`${API}/lifecycle/drc/${selectedDrc._id}/result`, drcResultForm, getAuthHeader());
      toast.success(`DRC meeting successfully marked as ${drcResultForm.status}!`);
      setShowDrcResult(false);
      setSelectedDrc(null);
      setDrcResultForm({ status: 'APPROVED', remarks: '' });
      fetchDrcMeetings();
      const r = await axios.get(`${API}/thesis/${thesisId}`, getAuthHeader());
      setData(r.data);
      if (onAction) onAction(thesisId, 'refresh_list');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record DRC result');
    } finally {
      setLoading(false);
    }
  };

  const ChevronIcon = ({ isOpen }) => (
    <svg 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease', color: 'var(--color-text-secondary, #64748B)' }}
    >
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
  );

  if (!data) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
        <div style={{ background: 'var(--color-surface, #ffffff)', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
          <div className="premium-preloader-container" style={{ padding: '0' }}>
            <div className="premium-preloader-spinner"></div>
            <div className="premium-preloader-text">Loading candidate profile...</div>
          </div>
        </div>
      </div>
    );
  }

  const { thesis, milestones } = data;
  const profile = thesis.scholarId?.profile || {};
  const qualifications = profile.qualifications || {};

  return (
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      background: 'rgba(0,0,0,0.6)', 
      backdropFilter: 'blur(4px)', 
      zIndex: 99999, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      overflow: 'hidden', 
      padding: '20px',
      pointerEvents: 'auto'
    }}>
      <div style={{ 
        background: 'var(--color-surface, #ffffff)', 
        color: 'var(--color-text, #1f2937)',
        borderRadius: 24, 
        padding: '28px 32px', 
        width: '95%', 
        maxWidth: 850, 
        height: 'min(820px, 92vh)', 
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, alignItems: 'center', borderBottom: '1px solid var(--color-border, #E2E8F0)', paddingBottom: 16, flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--color-text, #0F172A)', display: 'flex', alignItems: 'center', gap: 10 }}>
              🎓 Scholar Profile: {thesis.scholarId?.name || 'Academic Scholar'}
              <span style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: 20, background: 'var(--color-bg, #F1F5F9)', color: 'var(--color-text-secondary, #475569)', fontWeight: 700 }}>
                {thesis.enrollmentNumber}
              </span>
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--color-text-secondary, #64748B)', fontWeight: 500 }}>
              Department of {thesis.department} | Specialized Specialization: {profile.specialization || 'General'}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {/* Show Transfer button if current user is HOD, scholar belongs to this department, and thesis is not submitted/awarded */}
            {user.role === 'HOD' && thesis.department === user.department && !['SUBMITTED', 'AWARDED'].includes(thesis.status) && (
              <button
                onClick={() => setShowTransferModal(true)}
                className="btn-outline"
                style={{ borderColor: '#F59E0B', color: '#B45309', padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3v18"/><path d="m10 18-7 3 7 3"/><path d="M7 21h10"/><path d="m14 6 7-3-7-3"/><path d="M17 3H7"/></svg>
                Transfer
              </button>
            )}

            <button 
              onClick={onClose} 
              style={{ 
                background: 'var(--color-bg, #F1F5F9)', 
                border: 'none', 
                borderRadius: '50%', 
                width: 32, 
                height: 32, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: 'pointer',
                color: 'var(--color-text, #475569)',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#E2E8F0'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'var(--color-bg, #F1F5F9)'}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>

        {/* Transfer Modal overlay */}
        {showTransferModal && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.95)', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 16 }}>
            <form onSubmit={handleTransferSubmit} style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: 24, borderRadius: 12, width: '400px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#92400E', marginBottom: 8 }}>Transfer Supervision</div>
              <p style={{ fontSize: '0.8rem', color: '#B45309', marginBottom: 16 }}>
                Warning: This action will permanently transfer this scholar's supervision to another verified faculty or HOD within the department of {thesis.department}.
              </p>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#92400E', display: 'block', marginBottom: 4 }}>Select New Supervisor</label>
                <select 
                  className="form-input" 
                  value={transferTargetId} 
                  onChange={(e) => setTransferTargetId(e.target.value)} 
                  required
                  style={{ width: '100%', padding: '8px', fontSize: '0.9rem', borderColor: '#FCD34D' }}
                >
                  <option value="">-- Select Verified Faculty/HOD --</option>
                  {allHods.map(f => (
                    <option key={f._id} value={f._id}>{f.name} ({f.role === 'HOD' || f.subRole === 'HOD' ? 'HOD' : 'Faculty'})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline" onClick={() => setShowTransferModal(false)} style={{ borderColor: '#F59E0B', color: '#B45309' }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={transferLoading} style={{ background: '#D97706' }}>
                  {transferLoading ? 'Transferring...' : 'Confirm Transfer'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Scrollable Profile Body */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px', display: 'flex', flexDirection: 'column', gap: 16 }} className="custom-scrollbar">
          
          {/* ACCORDION 1: General & Personal Information */}
          <div style={{ border: '1px solid var(--color-border, #E2E8F0)', borderRadius: 12, overflow: 'hidden', background: 'var(--color-surface, #ffffff)', flexShrink: 0 }}>
            <button 
              type="button"
              onClick={() => toggleSection('general')}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 20px',
                background: 'var(--color-bg, #F8FAFC)',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                color: 'var(--color-text, #1E293B)',
                fontWeight: 700,
                fontSize: '0.9rem',
                outline: 'none',
                transition: 'background 0.2s'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                📂 1. General & Personal Information
              </span>
              <ChevronIcon isOpen={accordionOpen.general} />
            </button>
            {accordionOpen.general && (
              <div style={{ padding: '20px 24px', borderTop: '1px solid var(--color-border, #E2E8F0)', background: 'var(--color-surface, #ffffff)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                  {[
                    ['Date of Birth', profile.dob ? new Date(profile.dob).toLocaleDateString() : '—'],
                    ['Gender', profile.gender || '—'],
                    ['Category', profile.category || '—'],
                    ['Nationality', profile.nationality || 'Indian'],
                    ['Contact Phone', profile.phoneNumber || '—'],
                    ['Academic Email', thesis.scholarId?.email || thesis.scholarId?.username || '—'],
                    ["Father's Name", profile.fatherName || '—'],
                    ["Mother's Name", profile.motherName || '—'],
                    ['Residential Address', profile.address || '—', true]
                  ].map(([k, v, isSpan]) => (
                    <div key={k} style={{ gridColumn: isSpan ? 'span 2' : 'auto', background: 'var(--color-bg, #F8FAFC)', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--color-border, #E2E8F0)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary, #64748B)', fontWeight: 600, marginBottom: 2 }}>{k}</div>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text, #1F2937)' }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ACCORDION 2: Academic Profile & Credentials */}
          <div style={{ border: '1px solid var(--color-border, #E2E8F0)', borderRadius: 12, overflow: 'hidden', background: 'var(--color-surface, #ffffff)', flexShrink: 0 }}>
            <button 
              type="button"
              onClick={() => toggleSection('academic')}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 20px',
                background: 'var(--color-bg, #F8FAFC)',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                color: 'var(--color-text, #1E293B)',
                fontWeight: 700,
                fontSize: '0.9rem',
                outline: 'none',
                transition: 'background 0.2s'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                🎓 2. Academic Credentials & Board Qualifications
              </span>
              <ChevronIcon isOpen={accordionOpen.academic} />
            </button>
            {accordionOpen.academic && (
              <div style={{ padding: '20px 24px', borderTop: '1px solid var(--color-border, #E2E8F0)', background: 'var(--color-surface, #ffffff)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  
                  {/* Left Column: Post-Graduation and Graduation */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Post-Graduation Card */}
                    <div style={{ border: '1px solid var(--color-border, #E2E8F0)', borderRadius: 12, padding: 16, background: '#F8FAFC' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#1E3A8A', borderBottom: '1px solid #E2E8F0', paddingBottom: 6, marginBottom: 10 }}>🎓 Post Graduation (PG) Details</div>
                      {qualifications.postGraduation?.degree ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem' }}>
                          <div><strong>Degree:</strong> {qualifications.postGraduation.degree}</div>
                          <div><strong>Institution:</strong> {qualifications.postGraduation.college}</div>
                          <div><strong>University:</strong> {qualifications.postGraduation.university}</div>
                          <div><strong>Roll Number:</strong> {qualifications.postGraduation.rollNo || '—'}</div>
                          <div><strong>Score obtained:</strong> {qualifications.postGraduation.marksObtained} / {qualifications.postGraduation.totalMarks} ({qualifications.postGraduation.percentage}%)</div>
                          {qualifications.postGraduation.certificateUrl && (
                            <div style={{ marginTop: 8, borderTop: '1px dashed #CBD5E1', paddingTop: 8 }}>
                              <a 
                                href={`${API_BASE_URL}${qualifications.postGraduation.certificateUrl}`} 
                                target="_blank" 
                                rel="noreferrer" 
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#1E3A8A', fontWeight: 700, textDecoration: 'none', fontSize: '0.78rem' }}
                              >
                                📄 View PG Degree Certificate
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.78rem', color: '#64748B', fontStyle: 'italic' }}>No Post-Graduation details uploaded.</div>
                      )}
                    </div>

                    {/* Graduation Card */}
                    <div style={{ border: '1px solid var(--color-border, #E2E8F0)', borderRadius: 12, padding: 16, background: '#F8FAFC' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#1E3A8A', borderBottom: '1px solid #E2E8F0', paddingBottom: 6, marginBottom: 10 }}>🎓 Graduation (UG) Details</div>
                      {qualifications.graduation?.degree ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem' }}>
                          <div><strong>Degree:</strong> {qualifications.graduation.degree}</div>
                          <div><strong>Institution:</strong> {qualifications.graduation.college}</div>
                          <div><strong>University:</strong> {qualifications.graduation.university}</div>
                          <div><strong>Roll Number:</strong> {qualifications.graduation.rollNo || '—'}</div>
                          <div><strong>Score obtained:</strong> {qualifications.graduation.marksObtained} / {qualifications.graduation.totalMarks} ({qualifications.graduation.percentage}%)</div>
                          {qualifications.graduation.certificateUrl && (
                            <div style={{ marginTop: 8, borderTop: '1px dashed #CBD5E1', paddingTop: 8 }}>
                              <a 
                                href={`${API_BASE_URL}${qualifications.graduation.certificateUrl}`} 
                                target="_blank" 
                                rel="noreferrer" 
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#1E3A8A', fontWeight: 700, textDecoration: 'none', fontSize: '0.78rem' }}
                              >
                                📄 View UG Degree Certificate
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.78rem', color: '#64748B', fontStyle: 'italic' }}>No Graduation details uploaded.</div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Schooling and NET-JRF Exams */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Class 12th & 10th Card */}
                    <div style={{ border: '1px solid var(--color-border, #E2E8F0)', borderRadius: 12, padding: 16, background: '#F8FAFC' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#065F46', borderBottom: '1px solid #E2E8F0', paddingBottom: 6, marginBottom: 10 }}>🏫 Board Schooling Details</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.8rem' }}>
                        {qualifications.class12?.rollNo ? (
                          <div style={{ borderBottom: '1px dashed #CBD5E1', paddingBottom: 8 }}>
                            <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>Class 12th / Higher Secondary</div>
                            <div>Board: {qualifications.class12.board} | School: {qualifications.class12.school}</div>
                            <div>Roll No: {qualifications.class12.rollNo} | Score: {qualifications.class12.marksObtained}/{qualifications.class12.totalMarks} ({qualifications.class12.percentage}%)</div>
                            {qualifications.class12.certificateUrl && (
                              <div style={{ marginTop: 6 }}>
                                <a 
                                  href={`${API_BASE_URL}${qualifications.class12.certificateUrl}`} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#065F46', fontWeight: 700, textDecoration: 'none', fontSize: '0.78rem' }}
                                >
                                  📄 View Class 12 Certificate
                                </a>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.78rem', color: '#64748B', fontStyle: 'italic' }}>No Class 12th data uploaded.</div>
                        )}
                        {qualifications.class10?.rollNo ? (
                          <div>
                            <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>Class 10th / Secondary</div>
                            <div>Board: {qualifications.class10.board} | School: {qualifications.class10.school}</div>
                            <div>Roll No: {qualifications.class10.rollNo} | Score: {qualifications.class10.marksObtained}/{qualifications.class10.totalMarks} ({qualifications.class10.percentage}%)</div>
                            {qualifications.class10.certificateUrl && (
                              <div style={{ marginTop: 6 }}>
                                <a 
                                  href={`${API_BASE_URL}${qualifications.class10.certificateUrl}`} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#065F46', fontWeight: 700, textDecoration: 'none', fontSize: '0.78rem' }}
                                >
                                  📄 View Class 10 Certificate
                                </a>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.78rem', color: '#64748B', fontStyle: 'italic' }}>No Class 10th data uploaded.</div>
                        )}
                      </div>
                    </div>

                    {/* NET-JRF details Card */}
                    <div style={{ border: '1px solid var(--color-border, #E2E8F0)', borderRadius: 12, padding: 16, background: '#F8FAFC' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#B45309', borderBottom: '1px solid #E2E8F0', paddingBottom: 6, marginBottom: 10 }}>📝 National Level Exams (NET / JRF)</div>
                      {qualifications.netJrf?.qualified ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem' }}>
                          <div><strong>NET/JRF Qualified:</strong> <span style={{ color: '#D97706', fontWeight: 800 }}>YES</span></div>
                          <div><strong>Certificate Number:</strong> {qualifications.netJrf.certNumber || '—'}</div>
                          <div><strong>Roll Number:</strong> {qualifications.netJrf.rollNo || '—'}</div>
                          <div><strong>Rank / Score:</strong> Rank {qualifications.netJrf.rank || 'N/A'} | Score {qualifications.netJrf.score || 'N/A'}</div>
                          {qualifications.netJrf.issueDate && <div><strong>Certificate Issue Date:</strong> {new Date(qualifications.netJrf.issueDate).toLocaleDateString()}</div>}
                          {qualifications.netJrf.certificateUrl && (
                            <div style={{ marginTop: 8, borderTop: '1px dashed #CBD5E1', paddingTop: 8 }}>
                              <a 
                                href={`${API_BASE_URL}${qualifications.netJrf.certificateUrl}`} 
                                target="_blank" 
                                rel="noreferrer" 
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#B45309', fontWeight: 700, textDecoration: 'none', fontSize: '0.78rem' }}
                              >
                                📄 View NET-JRF Certificate
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontSize: '0.78rem', color: '#64748B', fontStyle: 'italic' }}>No NET/JRF qualification reported by student.</span>
                          {qualifications.other?.details && <div style={{ fontSize: '0.8rem', background: '#F1F5F9', padding: '6px 10px', borderRadius: 6, marginTop: 4 }}><strong>Other details:</strong> {qualifications.other.details}</div>}
                          {qualifications.other?.certificateUrl && (
                            <div style={{ marginTop: 8, borderTop: '1px dashed #CBD5E1', paddingTop: 8 }}>
                              <a 
                                href={`${API_BASE_URL}${qualifications.other.certificateUrl}`} 
                                target="_blank" 
                                rel="noreferrer" 
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#475569', fontWeight: 700, textDecoration: 'none', fontSize: '0.78rem' }}
                              >
                                📄 View Uploaded Certificate
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ACCORDION 3: Preferred Research Guide Selection */}
          <div style={{ border: '1px solid var(--color-border, #E2E8F0)', borderRadius: 12, overflow: 'hidden', background: 'var(--color-surface, #ffffff)', flexShrink: 0 }}>
            <button 
              type="button"
              onClick={() => toggleSection('guide')}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 20px',
                background: 'var(--color-bg, #F8FAFC)',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                color: 'var(--color-text, #1E293B)',
                fontWeight: 700,
                fontSize: '0.9rem',
                outline: 'none',
                transition: 'background 0.2s'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                👨‍🏫 3. Preferred Supervisor & Research Area
              </span>
              <ChevronIcon isOpen={accordionOpen.guide} />
            </button>
            {accordionOpen.guide && (
              <div style={{ padding: '20px 24px', borderTop: '1px solid var(--color-border, #E2E8F0)', background: 'var(--color-surface, #ffffff)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                {/* Preferred Guide Profile */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary, #64748B)', marginBottom: 6 }}>Scholar Preferred Supervisor Choice</label>
                  {(() => {
                    const prefId = profile.preferredGuideId;
                    const guide = faculty.find(f => f._id === prefId);
                    if (guide) {
                      return (
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '12px 18px', borderRadius: 12, color: '#1E40AF' }}>
                          <span style={{ fontSize: '1.5rem' }}>👨‍🏫</span>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>Prof. {guide.name} ({guide.subRole || 'FACULTY'})</div>
                            <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>Department of {guide.department} | Research Lead. Contact: {guide.username}</div>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div style={{ padding: '10px 14px', background: '#FEF3C7', border: '1px solid #FDE68A', color: '#B45309', borderRadius: 10, fontSize: '0.8rem', fontWeight: 600 }}>
                        ⚠️ Scholar has not logged an official preferred supervisor choice during profile registration.
                      </div>
                    );
                  })()}
                </div>

                {/* Specialization & PhD Mode & Enrollment No */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 12, borderRadius: 10 }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, marginBottom: 2 }}>SH no.</div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#059669' }}>{profile.shNo || 'N/A'}</div>
                  </div>
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 12, borderRadius: 10 }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, marginBottom: 2 }}>University Enrollment No</div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1F2937' }}>{profile.enrollmentNumber || thesis.enrollmentNumber || 'N/A'}</div>
                  </div>
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 12, borderRadius: 10 }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, marginBottom: 2 }}>Admission Date</div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1F2937' }}>{profile.admissionDate ? new Date(profile.admissionDate).toLocaleDateString() : 'N/A'}</div>
                  </div>
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 12, borderRadius: 10 }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, marginBottom: 2 }}>Ph.D. Study Mode</div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1F2937' }}>{profile.phdMode || 'N/A'}</div>
                  </div>
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 12, borderRadius: 10 }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, marginBottom: 2 }}>Specialization</div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1F2937' }}>{profile.specialization || 'N/A'}</div>
                  </div>
                </div>

                {/* Tentative Area of Research */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 14, borderRadius: 12 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Area of Research Interest</div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A' }}>{profile.areaOfInterest || thesis.title || 'N/A'}</div>
                </div>

                {/* Thesis Title */}
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: 14, borderRadius: 12 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#15803D', marginBottom: 4 }}>Thesis Title</div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#14532D' }}>{profile.thesisTitle || thesis.title || 'N/A'}</div>
                </div>

                {/* Thesis Summary */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 14, borderRadius: 12 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Thesis Summary / Abstract</div>
                  <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{profile.thesisSummary || thesis.abstract || 'N/A'}</div>
                </div>

                {/* Keywords */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 14, borderRadius: 12 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Keywords</div>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A' }}>{profile.thesisKeywords || thesis.keywords || 'N/A'}</div>
                </div>

                {/* Research Statement Proposal */}
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 14, borderRadius: 12 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Research Proposal / Academic Profile Statement</div>
                  <div style={{ fontSize: '0.82rem', color: '#334155', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{profile.academicBackground || 'N/A'}</div>
                </div>

              </div>
            )}
          </div>

          {/* DYNAMIC LIFECYCLE TRANSITIONS PANEL */}
          <div style={{ background: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)', border: '1px solid var(--color-border, #E2E8F0)', borderRadius: 16, padding: '20px 24px', flexShrink: 0 }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.92rem', fontWeight: 800, color: '#111827', borderBottom: '1px solid #E2E8F0', paddingBottom: 8 }}>
              ⚙️ PhD Candidate Workspace & Verification Desk
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              
              {/* Row 1: Registration Approval & Supervisor Allocation */}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                {/* 1. Registration Approval */}
                {(!thesis.enrollmentVerified || thesis.status === 'REGISTRATION_PENDING') ? (
                  <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: 14, borderRadius: 12, flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#065F46' }}>Registration Verification Pending</div>
                      <div style={{ fontSize: '0.75rem', color: '#047857', marginTop: 2 }}>Verify student qualifications and register them to Coursework.</div>
                    </div>
                    <button 
                      onClick={() => act('verify')} 
                      disabled={loading} 
                      className="btn-primary" 
                      style={{ padding: '8px 18px', fontSize: '0.82rem', background: '#059669', color: 'white', fontWeight: 700, border: 'none', borderRadius: '8px', cursor: 'pointer' }}
                    >
                      ✓ Approve Registration → COURSEWORK
                    </button>
                  </div>
                ) : (
                  <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '8px 14px', borderRadius: 10, color: '#15803D', fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                    <span>✅</span> Scholar Registration Approved & Verified
                  </div>
                )}

                {/* 2. Allocate Supervisor */}
                {thesis.status !== 'AWARDED' && (
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 12, borderRadius: 12, flex: 1, display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Supervisor Allocation Desk</div>
                      <select 
                        className="form-input" 
                        style={{ padding: '6px 10px', height: 'auto', fontSize: '0.8rem', width: '100%' }} 
                        value={selSupervisor} 
                        onChange={e => setSelSupervisor(e.target.value)} 
                        disabled={!!thesis.supervisorId}
                      >
                        <option value="">Choose department supervisor...</option>
                        {faculty.filter(f => f.department === thesis.department).map(f => <option key={f._id} value={f._id}>Prof. {f.name} ({(f.role === 'HOD' || f.subRole === 'HOD') ? 'HOD' : (f.subRole || 'Supervisor')})</option>)}
                      </select>
                    </div>
                    <button 
                      className="btn-primary" 
                      onClick={() => act('assign', { supervisorId: selSupervisor })} 
                      disabled={!selSupervisor || !!thesis.supervisorId || loading} 
                      style={{ padding: '8px 14px', fontSize: '0.8rem', alignSelf: 'flex-end', background: thesis.supervisorId ? '#059669' : '#3B82F6', fontWeight: 700, opacity: (thesis.supervisorId || !selSupervisor) ? 0.75 : 1 }}
                    >
                      {thesis.supervisorId ? '✓ Allocated' : 'Assign Guide'}
                    </button>
                  </div>
                )}
              </div>

              {/* Row 2: Secondary phase triggers (Coursework Clear, Seminar Clear, Award Degree) */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {thesis.status === 'COURSEWORK' && (
                  <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: 14, borderRadius: 12, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1E40AF' }}>Exams & Coursework Phase</div>
                      <div style={{ fontSize: '0.75rem', color: '#1D4ED8', marginTop: 2 }}>Scholar is completing coursework credits. Click below to confirm exams cleared.</div>
                    </div>
                    <button 
                      onClick={() => act('coursework')} 
                      disabled={loading} 
                      className="btn-primary" 
                      style={{ padding: '8px 18px', fontSize: '0.82rem', background: '#2563EB', fontWeight: 700, borderRadius: '8px' }}
                    >
                      ✓ Clear Coursework → SYNOPSIS
                    </button>
                  </div>
                )}

                {thesis.status === 'ACTIVE_RESEARCH' && (() => {
                  const preMilestone = milestones.find(m => m.type === 'PRE_SUBMISSION');
                  const scheduleComment = preMilestone?.comments?.find(c => c.text.startsWith('Pre-Submission Seminar scheduled'));

                  const verifiedJournalsCount = publications.filter(p => p.type === 'JOURNAL' && p.status === 'VERIFIED').length;
                  const verifiedConferencesCount = publications.filter(p => p.type === 'CONFERENCE' && p.status === 'VERIFIED').length;
                  const cannotClearSeminar = verifiedJournalsCount < 2 || verifiedConferencesCount < 2;

                  return (
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 16, borderRadius: 12, width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1E293B', borderBottom: '1px solid #E2E8F0', paddingBottom: 8 }}>
                        📈 Active Research Monitoring (HOD Desk)
                      </div>
                      


                      {cannotClearSeminar && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', padding: '12px 16px', borderRadius: 10, fontSize: '0.82rem', color: '#EF4444', display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>⚠️ Pre-Submission Prerequisites Locked</span>
                          </div>
                          <div>This scholar does not meet publication prerequisites. At least 2 verified Journal publications and 2 verified Conference presentations are required.</div>
                          <div style={{ marginTop: 2, fontWeight: 700, fontSize: '0.8rem', color: '#B91C1C' }}>
                            Current Progress: Journals: {verifiedJournalsCount}/2 | Conferences: {verifiedConferencesCount}/2
                          </div>
                        </div>
                      )}

                      {(!preMilestone || preMilestone.status === 'PENDING' || preMilestone.status === 'REVISION_REQUIRED') ? (
                        <div style={{ background: '#FFF7ED', border: '1px solid #FFEDD5', padding: 14, borderRadius: 8, width: '100%' }}>
                          <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#C2410C' }}>🔒 Pre-Submission Seminar</div>
                          <div style={{ fontSize: '0.75rem', color: '#EA580C', marginTop: 4 }}>
                            Waiting for scholar to fulfill prerequisites and upload their compiled rough draft thesis & plagiarism clearance certificate.
                          </div>
                        </div>
                      ) : (
                        <div style={{ background: '#FFF7ED', border: '1px solid #FFEDD5', padding: 16, borderRadius: 8, width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #FFEDD5', paddingBottom: 8 }}>
                            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#C2410C' }}>🎯 Pre-Submission Colloquium Review</div>
                            <span style={{ padding: '3px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700, background: '#FFE4E6', color: '#BE123C' }}>
                              PACKAGE UPLOADED
                            </span>
                          </div>

                      {/* Display files */}
                      <div style={{ display: 'flex', gap: 16, background: '#FFFFFF', padding: '10px 14px', borderRadius: 8, border: '1px solid #FFEDD5', fontSize: '0.8rem' }}>
                        {preMilestone.documentUrl && (
                          <a href={`${API_BASE_URL}${preMilestone.documentUrl}`} target="_blank" rel="noreferrer" style={{ color: '#EA580C', fontWeight: 700, textDecoration: 'underline' }}>
                            📄 Rough Thesis Draft
                          </a>
                        )}
                        {preMilestone.plagiarismReportUrl && (
                          <a href={`${API_BASE_URL}${preMilestone.plagiarismReportUrl}`} target="_blank" rel="noreferrer" style={{ color: '#059669', fontWeight: 700, textDecoration: 'underline' }}>
                            📊 Plagiarism Report Certificate
                          </a>
                        )}
                      </div>

                      {/* Scheduled Meeting Details or Scheduling */}
                      {!scheduleComment ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ fontSize: '0.78rem', color: '#C2410C', fontWeight: 600 }}>
                            📅 No seminar has been scheduled for this scholar yet. Please schedule the open offline presentation:
                          </div>
                          {!showPreSubSchedule ? (
                            <button 
                              onClick={() => setShowPreSubSchedule(true)} 
                              className="btn-primary" 
                              disabled={cannotClearSeminar}
                              style={{ background: '#EA580C', padding: '6px 14px', fontSize: '0.78rem', alignSelf: 'flex-start', opacity: cannotClearSeminar ? 0.6 : 1, cursor: cannotClearSeminar ? 'not-allowed' : 'pointer' }}
                            >
                              + Schedule Offline Presentation
                            </button>
                          ) : (
                            <form onSubmit={handlePreSubScheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', boxSizing: 'border-box' }}>
                              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#92400E' }}>Schedule Presentation Details</div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <div>
                                  <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#B45309', display: 'block', marginBottom: 2 }}>Meeting Date</label>
                                  <input type="date" className="form-input" style={{ width: '100%', padding: '4px', fontSize: '0.78rem' }} value={preSubForm.scheduledDate} onChange={e => setPreSubForm({...preSubForm, scheduledDate: e.target.value})} required />
                                </div>
                                <div>
                                  <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#B45309', display: 'block', marginBottom: 2 }}>Meeting Time</label>
                                  <input type="text" className="form-input" style={{ width: '100%', padding: '4px', fontSize: '0.78rem' }} placeholder="e.g. 2:30 PM" value={preSubForm.scheduledTime} onChange={e => setPreSubForm({...preSubForm, scheduledTime: e.target.value})} required />
                                </div>
                              </div>
                              <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#B45309', display: 'block', marginBottom: 2 }}>Venue Location</label>
                                <input type="text" className="form-input" style={{ width: '100%', padding: '4px', fontSize: '0.78rem' }} placeholder="e.g. Conference Hall B" value={preSubForm.venue} onChange={e => setPreSubForm({...preSubForm, venue: e.target.value})} required />
                              </div>
                              <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#B45309', display: 'block', marginBottom: 2 }}>Committee Panel Members</label>
                                <input type="text" className="form-input" style={{ width: '100%', padding: '4px', fontSize: '0.78rem' }} placeholder="e.g. HOD, external experts" value={preSubForm.committeeMembers} onChange={e => setPreSubForm({...preSubForm, committeeMembers: e.target.value})} />
                              </div>
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn-outline" onClick={() => setShowPreSubSchedule(false)} style={{ padding: '3px 8px', fontSize: '0.75rem' }}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={loading || cannotClearSeminar} style={{ padding: '3px 12px', fontSize: '0.75rem', background: '#EA580C', opacity: cannotClearSeminar ? 0.6 : 1, cursor: cannotClearSeminar ? 'not-allowed' : 'pointer' }}>Schedule presentation</button>
                              </div>
                            </form>
                          )}
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div style={{ background: '#FFFBEB', padding: '10px 14px', borderRadius: 8, borderLeft: '4px solid #F59E0B', fontSize: '0.8rem', color: '#92400E' }}>
                            <strong>🔔 Presentation Scheduled:</strong> {scheduleComment.text}
                          </div>

                          {!showPreSubResult ? (
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button 
                                onClick={() => setShowPreSubResult(true)} 
                                className="btn-primary" 
                                disabled={cannotClearSeminar}
                                style={{ background: '#059669', padding: '6px 14px', fontSize: '0.78rem', opacity: cannotClearSeminar ? 0.6 : 1, cursor: cannotClearSeminar ? 'not-allowed' : 'pointer' }}
                              >
                                ✓ Record Expert Seminar Outcome
                              </button>
                              <button 
                                onClick={() => setShowPreSubSchedule(true)} 
                                className="btn-outline" 
                                disabled={cannotClearSeminar}
                                style={{ padding: '6px 14px', fontSize: '0.78rem', border: '1px solid #EA580C', color: '#EA580C', opacity: cannotClearSeminar ? 0.6 : 1, cursor: cannotClearSeminar ? 'not-allowed' : 'pointer' }}
                              >
                                Reschedule Seminar
                              </button>
                            </div>
                          ) : (
                            <form onSubmit={handlePreSubResultSubmit} style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: 12, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 10, width: '100%', boxSizing: 'border-box' }}>
                              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#065F46' }}>Record Pre-Submission Defense Decision</div>
                              <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#047857', display: 'block', marginBottom: 2 }}>Committee Outcome Decision</label>
                                <select className="form-input" style={{ width: '100%', padding: '4px', fontSize: '0.78rem' }} value={preSubResultForm.status} onChange={e => setPreSubResultForm({...preSubResultForm, status: e.target.value})} required>
                                  <option value="SUCCESSFUL">SUCCESSFUL (Clear Candidate to PRE_SUBMISSION)</option>
                                  <option value="UNSUCCESSFUL">UNSUCCESSFUL (Request Revisions on Package)</option>
                                </select>
                              </div>
                              <div>
                                <label style={{ fontSize: '0.7rem', fontWeight: 600, color: '#047857', display: 'block', marginBottom: 2 }}>Minutes of Meeting / Evaluation Remarks</label>
                                <textarea className="form-input" style={{ width: '100%', padding: '4px', resize: 'vertical', fontSize: '0.78rem' }} rows="2" placeholder="Detail notes of presentation defense and recommendations..." value={preSubResultForm.remarks} onChange={e => setPreSubResultForm({...preSubResultForm, remarks: e.target.value})} required />
                              </div>
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn-outline" onClick={() => { setShowPreSubResult(false); }} style={{ padding: '3px 8px', fontSize: '0.75rem' }}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={loading || cannotClearSeminar} style={{ padding: '3px 12px', fontSize: '0.75rem', background: '#059669', opacity: cannotClearSeminar ? 0.6 : 1, cursor: cannotClearSeminar ? 'not-allowed' : 'pointer' }}>Submit Outcome</button>
                              </div>
                            </form>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

                {['SUBMITTED', 'AWARDED'].includes(thesis.status) && (() => {
                  const finalMilestone = milestones.find(m => m.type === 'FINAL_SUBMISSION');
                  return (
                    <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: 18, borderRadius: 14, width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #BFDBFE', paddingBottom: 10 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1E40AF' }}>🏁 Final Evaluation & Viva-Voce Desk (Phase 6)</div>
                        <span style={{ padding: '3px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700, background: thesis.status === 'AWARDED' ? '#D1FAE5' : '#DBEAFE', color: thesis.status === 'AWARDED' ? '#065F46' : '#1D4ED8' }}>
                          {thesis.status === 'AWARDED' ? 'DEGREE AWARDED' : 'AWAITING ASSESSMENT'}
                        </span>
                      </div>

                      {/* Download final thesis */}
                      {finalMilestone && finalMilestone.documentUrl && (
                        <div style={{ background: '#FFFFFF', padding: '10px 14px', borderRadius: 8, border: '1px solid #BFDBFE', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '1.1rem' }}>📄</span>
                          <a href={`${API_BASE_URL}${finalMilestone.documentUrl}`} target="_blank" rel="noreferrer" style={{ color: '#2563EB', fontWeight: 700, textDecoration: 'underline' }}>
                            View Final Complete Hard-bound Thesis PDF
                          </a>
                        </div>
                      )}

                      {/* Step 1: Dispatch to external university examiners */}
                      <div style={{ padding: 12, background: thesis.dispatchDate ? '#ECFDF5' : '#FAFAFA', borderRadius: 10, border: `1px solid ${thesis.dispatchDate ? '#A7F3D0' : '#E2E8F0'}` }}>
                        <div style={{ fontWeight: 700, fontSize: '0.82rem', color: thesis.dispatchDate ? '#047857' : '#374151', display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                          <span>{thesis.dispatchDate ? '✅' : '1️⃣'}</span> Dispatch to External University Examiners
                        </div>
                        
                        {thesis.dispatchDate ? (
                          <div style={{ fontSize: '0.78rem', color: '#065F46', marginTop: 4, lineHeight: 1.4 }}>
                            Dispatched on <strong>{new Date(thesis.dispatchDate).toLocaleDateString()}</strong> via <strong>{thesis.dispatchMethod}</strong> {thesis.dispatchTrackingNumber && `(Ref: ${thesis.dispatchTrackingNumber})`}.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Log dispatch details once the physical/digital thesis is dispatched to external examiners:</div>
                            {!showDispatchForm ? (
                              <button onClick={() => setShowDispatchForm(true)} className="btn-primary" style={{ background: '#357AE8', padding: '4px 10px', fontSize: '0.75rem', alignSelf: 'flex-start' }}>Log Dispatch Details</button>
                            ) : (
                              <form onSubmit={handleDispatchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                  <div>
                                    <label style={{ fontSize: '0.68rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 2 }}>Dispatch Date</label>
                                    <input type="date" className="form-input" style={{ padding: '4px', fontSize: '0.78rem', width: '100%' }} value={dispatchForm.dispatchDate} onChange={e => setDispatchForm({...dispatchForm, dispatchDate: e.target.value})} required />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: '0.68rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 2 }}>Dispatch Method</label>
                                    <select className="form-input" style={{ padding: '4px', fontSize: '0.78rem', width: '100%' }} value={dispatchForm.dispatchMethod} onChange={e => setDispatchForm({...dispatchForm, dispatchMethod: e.target.value})} required>
                                      <option value="Speed Post">Speed Post</option>
                                      <option value="Registered Post">Registered Post</option>
                                      <option value="Courier">Courier</option>
                                      <option value="Digital Portal">Digital Portal</option>
                                      <option value="Hand-carried">Hand-carried</option>
                                    </select>
                                  </div>
                                </div>
                                <div>
                                  <label style={{ fontSize: '0.68rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 2 }}>Tracking No. / Reference Reference</label>
                                  <input type="text" className="form-input" style={{ padding: '4px', fontSize: '0.78rem', width: '100%' }} placeholder="e.g. SP123456789IN" value={dispatchForm.dispatchTrackingNumber} onChange={e => setDispatchForm({...dispatchForm, dispatchTrackingNumber: e.target.value})} />
                                </div>
                                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                  <button type="button" className="btn-outline" onClick={() => setShowDispatchForm(false)} style={{ padding: '2px 6px', fontSize: '0.72rem' }}>Cancel</button>
                                  <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '2px 10px', fontSize: '0.72rem', background: '#3B82F6' }}>Save Details</button>
                                </div>
                              </form>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Step 2: Viva-Voce Defense (Offline) */}
                      {thesis.dispatchDate && (
                        <div style={{ padding: 12, background: thesis.vivaStatus === 'SUCCESSFUL' ? '#ECFDF5' : thesis.vivaStatus === 'SCHEDULED' ? '#FFFBEB' : '#FAFAFA', borderRadius: 10, border: `1px solid ${thesis.vivaStatus === 'SUCCESSFUL' ? '#A7F3D0' : thesis.vivaStatus === 'SCHEDULED' ? '#FDE68A' : '#E2E8F0'}` }}>
                          <div style={{ fontWeight: 700, fontSize: '0.82rem', color: thesis.vivaStatus === 'SUCCESSFUL' ? '#047857' : thesis.vivaStatus === 'SCHEDULED' ? '#B45309' : '#374151', display: 'flex', gap: 6, alignItems: 'center', marginBottom: 4 }}>
                            <span>{thesis.vivaStatus === 'SUCCESSFUL' ? '✅' : '2️⃣'}</span> Offline Viva-Voce Defense Colloquium
                          </div>

                          {thesis.vivaStatus === 'NOT_SCHEDULED' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                              <div style={{ fontSize: '0.75rem', color: '#64748B' }}>Schedule the candidate's final offline Viva-Voce defense once reports are cleared:</div>
                              {!showVivaScheduleForm ? (
                                <button onClick={() => setShowVivaScheduleForm(true)} className="btn-primary" style={{ background: '#8B5CF6', padding: '4px 10px', fontSize: '0.75rem', alignSelf: 'flex-start' }}>Schedule Viva-Voce</button>
                              ) : (
                                <form onSubmit={handleVivaScheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                    <div>
                                      <label style={{ fontSize: '0.68rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 2 }}>Defense Date</label>
                                      <input type="date" className="form-input" style={{ padding: '4px', fontSize: '0.78rem', width: '100%' }} value={vivaForm.vivaDate} onChange={e => setVivaForm({...vivaForm, vivaDate: e.target.value})} required />
                                    </div>
                                    <div>
                                      <label style={{ fontSize: '0.68rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 2 }}>Defense Time</label>
                                      <input type="text" className="form-input" style={{ padding: '4px', fontSize: '0.78rem', width: '100%' }} placeholder="e.g. 11:30 AM" value={vivaForm.vivaTime} onChange={e => setVivaForm({...vivaForm, vivaTime: e.target.value})} required />
                                    </div>
                                  </div>
                                  <div>
                                    <label style={{ fontSize: '0.68rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 2 }}>Venue Location</label>
                                    <input type="text" className="form-input" style={{ padding: '4px', fontSize: '0.78rem', width: '100%' }} placeholder="e.g. Academic Council Hall" value={vivaForm.vivaVenue} onChange={e => setVivaForm({...vivaForm, vivaVenue: e.target.value})} required />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: '0.68rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 2 }}>External Panel Board Members</label>
                                    <input type="text" className="form-input" style={{ padding: '4px', fontSize: '0.78rem', width: '100%' }} placeholder="e.g. Prof. Kumar (External), HOD, Supervisor" value={vivaForm.vivaPanel} onChange={e => setVivaForm({...vivaForm, vivaPanel: e.target.value})} />
                                  </div>
                                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                    <button type="button" className="btn-outline" onClick={() => setShowVivaScheduleForm(false)} style={{ padding: '2px 6px', fontSize: '0.72rem' }}>Cancel</button>
                                    <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '2px 10px', fontSize: '0.72rem', background: '#8B5CF6' }}>Schedule Defense</button>
                                  </div>
                                </form>
                              )}
                            </div>
                          )}

                          {thesis.vivaStatus === 'SCHEDULED' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                              <div style={{ background: '#FFFBEB', padding: '10px 12px', borderRadius: 8, borderLeft: '4px solid #F59E0B', fontSize: '0.78rem', color: '#92400E', lineHeight: 1.4 }}>
                                <strong>🔔 Scheduled Defense:</strong> on {new Date(thesis.vivaDate).toLocaleDateString()} at {thesis.vivaTime} in {thesis.vivaVenue}. Panel: {thesis.vivaPanel || 'N/A'}.
                              </div>
                              {!showVivaOutcomeForm ? (
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button onClick={() => setShowVivaOutcomeForm(true)} className="btn-primary" style={{ background: '#059669', padding: '4px 10px', fontSize: '0.75rem' }}>✓ Record Defense Outcome</button>
                                  <button onClick={() => setShowVivaScheduleForm(true)} className="btn-outline" style={{ border: '1px solid #8B5CF6', color: '#8B5CF6', padding: '4px 10px', fontSize: '0.75rem' }}>Reschedule Defense</button>
                                </div>
                              ) : (
                                <form onSubmit={handleVivaOutcomeSubmit} style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: 12, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                                  <div style={{ fontWeight: 750, fontSize: '0.78rem', color: '#065F46' }}>Record Defense Colloquium Decisions</div>
                                  <div>
                                    <label style={{ fontSize: '0.68rem', fontWeight: 600, color: '#047857', display: 'block', marginBottom: 2 }}>Defense Grade Outcome</label>
                                    <select className="form-input" style={{ padding: '4px', fontSize: '0.78rem', width: '100%' }} value={vivaOutcomeForm.vivaStatus} onChange={e => setVivaOutcomeForm({...vivaOutcomeForm, vivaStatus: e.target.value})} required>
                                      <option value="SUCCESSFUL">SUCCESSFUL (Defense Cleared & Approved)</option>
                                      <option value="UNSUCCESSFUL">UNSUCCESSFUL (Revisions on Defense Required)</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label style={{ fontSize: '0.68rem', fontWeight: 600, color: '#047857', display: 'block', marginBottom: 2 }}>Viva Evaluation Remarks</label>
                                    <textarea className="form-input" style={{ padding: '4px', fontSize: '0.78rem', width: '100%', resize: 'vertical' }} rows="2" placeholder="Record feedback of examiners and defense remarks..." value={vivaOutcomeForm.remarks} onChange={e => setVivaOutcomeForm({...vivaOutcomeForm, remarks: e.target.value})} required />
                                  </div>
                                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                    <button type="button" className="btn-outline" onClick={() => setShowVivaOutcomeForm(false)} style={{ padding: '2px 6px', fontSize: '0.72rem' }}>Cancel</button>
                                    <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '2px 10px', fontSize: '0.72rem', background: '#059669' }}>Save Outcome</button>
                                  </div>
                                </form>
                              )}
                            </div>
                          )}

                          {thesis.vivaStatus === 'SUCCESSFUL' && (
                            <div style={{ fontSize: '0.78rem', color: '#065F46', marginTop: 4, lineHeight: 1.4 }}>
                              Viva-Voce defense concluded successfully on <strong>{new Date(thesis.vivaDate).toLocaleDateString()}</strong>! <br/>
                              Remarks: <em>"{thesis.vivaRemarks || 'Satisfactory'}"</em>
                            </div>
                          )}

                          {thesis.vivaStatus === 'UNSUCCESSFUL' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                              <div style={{ background: '#FEF2F2', borderLeft: '4px solid #EF4444', padding: '10px 12px', borderRadius: 8, fontSize: '0.78rem', color: '#991B1B', lineHeight: 1.4 }}>
                                <strong>⚠️ Defense Revisions Required:</strong> {thesis.vivaRemarks || 'Check panel notes.'}
                              </div>
                              <button onClick={() => setShowVivaScheduleForm(true)} className="btn-outline" style={{ border: '1px solid #EF4444', color: '#EF4444', padding: '4px 10px', fontSize: '0.75rem', alignSelf: 'flex-start' }}>Reschedule New Viva-Voce</button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Step 3: Clear Final Award */}
                      {thesis.status === 'SUBMITTED' && thesis.vivaStatus === 'SUCCESSFUL' && (
                        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: 12, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#065F46' }}>Ph.D. Academic Award Clearance</div>
                            <div style={{ fontSize: '0.72rem', color: '#047857', marginTop: 2 }}>Viva-Voce Defense is Successful! Cleared for Ph.D. degree award.</div>
                          </div>
                          <button 
                            onClick={() => act('award')} 
                            disabled={loading} 
                            className="btn-primary" 
                            style={{ padding: '6px 14px', fontSize: '0.78rem', background: '#059669', fontWeight: 700, borderRadius: '6px' }}
                          >
                            🎓 Award Doctoral Degree
                          </button>
                        </div>
                      )}

                      {thesis.status === 'AWARDED' && (
                        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: 12, borderRadius: 10, display: 'flex', gap: 8, alignItems: 'center', marginTop: 4, color: '#15803D', fontSize: '0.8rem', fontWeight: 700 }}>
                          <span>🎓</span> Ph.D. Degree Officially Awarded & cleared in Himachal Pradesh University Registry.
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Row 3: Department Research Committee (DRC) controls for Synopsis phase */}
              {thesis.status === 'SYNOPSIS_PENDING' && (() => {
                const synopsisMilestone = milestones.find(m => m.type === 'SYNOPSIS');
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', marginTop: 4 }}>
                    {synopsisMilestone?.status !== 'APPROVED' ? (
                      <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '12px 16px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 700 }}>
                        ⚠️ <strong>DRC Scheduling Locked:</strong> Scholar's supervisor must review and digitally approve the Research Synopsis document copy before HOD committee scheduling is enabled.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D', padding: '10px 14px', borderRadius: 10, fontSize: '0.82rem', fontWeight: 700 }}>
                          ✅ Synopsis Approved by Supervisor! Departmental Research Committee (DRC) review is unlocked.
                        </div>

                        {/* DRC Meetings Table */}
                        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 16, borderRadius: 12 }}>
                          <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#334155', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>📆 DRC Meetings Status Desk</span>
                            {!drcMeetings.some(m => m.status === 'SCHEDULED') && !showDrcSchedule && (
                              <button type="button" className="btn-primary" onClick={() => setShowDrcSchedule(true)} style={{ padding: '5px 12px', fontSize: '0.75rem', background: '#3B82F6' }}>+ Schedule Meeting</button>
                            )}
                          </div>

                          {drcMeetings.length === 0 ? (
                            <div style={{ fontSize: '0.8rem', color: '#64748B', fontStyle: 'italic' }}>No Departmental Research Committee scheduled for synopsis yet.</div>
                          ) : (
                            drcMeetings.map((drc, idx) => (
                              <div key={drc._id} style={{ borderBottom: idx < drcMeetings.length - 1 ? '1px solid #E2E8F0' : 'none', paddingBottom: idx < drcMeetings.length - 1 ? 12 : 0, paddingTop: idx > 0 ? 12 : 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>DRC Assessment Panel</span>
                                  <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700, background: drc.status === 'APPROVED' ? '#D1FAE5' : drc.status === 'REVISION_REQUIRED' ? '#FEE2E2' : '#FEF3C7', color: drc.status === 'APPROVED' ? '#065F46' : drc.status === 'REVISION_REQUIRED' ? '#991B1B' : '#D97706' }}>
                                    {drc.status}
                                  </span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: '0.78rem', color: '#475569', margin: '6px 0' }}>
                                  <div><strong>Meeting Date:</strong> {new Date(drc.scheduledDate).toLocaleDateString()}</div>
                                  <div><strong>Time:</strong> {drc.scheduledTime}</div>
                                  <div style={{ gridColumn: 'span 2' }}><strong>Venue Location:</strong> {drc.venue}</div>
                                  {drc.committeeMembers && <div style={{ gridColumn: 'span 2' }}><strong>Committee Panel:</strong> {drc.committeeMembers}</div>}
                                  {drc.agenda && <div style={{ gridColumn: 'span 2' }}><strong>Review Agenda:</strong> {drc.agenda}</div>}
                                  {drc.remarks && <div style={{ gridColumn: 'span 2', background: '#FFFBEB', padding: 8, borderRadius: 8, color: '#92400E', borderLeft: '3px solid #F59E0B', marginTop: 6, fontSize: '0.78rem' }}><strong>MoM Remarks:</strong> {drc.remarks}</div>}
                                </div>

                                {drc.status === 'SCHEDULED' && !showDrcResult && (
                                  <button type="button" className="btn-primary" onClick={() => { setSelectedDrc(drc); setShowDrcResult(true); }} style={{ marginTop: 10, padding: '5px 12px', fontSize: '0.75rem', background: '#059669' }}>📝 Record DRC Outcome</button>
                                )}
                              </div>
                            ))
                          )}
                        </div>

                        {/* DRC Schedule Form */}
                        {showDrcSchedule && (
                          <form onSubmit={handleDrcScheduleSubmit} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 16, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1E293B', borderBottom: '1px solid #E2E8F0', paddingBottom: 6 }}>Schedule DRC Panel Meeting</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                              <div>
                                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Meeting Date</label>
                                <input type="date" className="form-input" style={{ width: '100%', padding: '6px', fontSize: '0.8rem' }} value={drcForm.scheduledDate} onChange={e => setDrcForm({...drcForm, scheduledDate: e.target.value})} required />
                              </div>
                              <div>
                                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Meeting Time</label>
                                <input type="text" className="form-input" style={{ width: '100%', padding: '6px', fontSize: '0.8rem' }} placeholder="e.g. 11:30 AM" value={drcForm.scheduledTime} onChange={e => setDrcForm({...drcForm, scheduledTime: e.target.value})} required />
                              </div>
                            </div>
                            <div>
                              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Venue</label>
                              <input type="text" className="form-input" style={{ width: '100%', padding: '6px', fontSize: '0.8rem' }} placeholder="e.g. HOD Board Room" value={drcForm.venue} onChange={e => setDrcForm({...drcForm, venue: e.target.value})} required />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Committee Panel Members</label>
                              <input type="text" className="form-input" style={{ width: '100%', padding: '6px', fontSize: '0.8rem' }} placeholder="e.g. Dr. A. Sen (HOD), Prof. M. Roy, Dr. S. Ghose" value={drcForm.committeeMembers} onChange={e => setDrcForm({...drcForm, committeeMembers: e.target.value})} />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Agenda / Focus Areas</label>
                              <textarea className="form-input" style={{ width: '100%', padding: '6px', resize: 'vertical', fontSize: '0.8rem' }} rows="2" placeholder="e.g. Feasibility review of candidate's synopsis and guide allocation." value={drcForm.agenda} onChange={e => setDrcForm({...drcForm, agenda: e.target.value})} />
                            </div>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                              <button type="button" className="btn-outline" onClick={() => setShowDrcSchedule(false)} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Cancel</button>
                              <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '4px 14px', fontSize: '0.75rem', background: '#3B82F6' }}>Schedule Event</button>
                            </div>
                          </form>
                        )}

                        {/* DRC Result Grading Form */}
                        {showDrcResult && selectedDrc && (
                          <form onSubmit={handleDrcResultSubmit} style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: 16, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#065F46', borderBottom: '1px solid #A7F3D0', paddingBottom: 6 }}>Record Committee Review Decision</div>
                            <div>
                              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#047857', display: 'block', marginBottom: 4 }}>Committee Outcome Decision</label>
                              <select className="form-input" style={{ width: '100%', padding: '6px', fontSize: '0.8rem' }} value={drcResultForm.status} onChange={e => setDrcResultForm({...drcResultForm, status: e.target.value})} required>
                                <option value="APPROVED">APPROVED (Move Candidate to ACTIVE_RESEARCH)</option>
                                <option value="REVISION_REQUIRED">REVISION REQUIRED (Revert Synopsis to Candidate)</option>
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#047857', display: 'block', marginBottom: 4 }}>Minutes of Meeting / Evaluation remarks</label>
                              <textarea className="form-input" style={{ width: '100%', padding: '6px', resize: 'vertical', fontSize: '0.8rem' }} rows="3" placeholder="Enter comments or required modifications in detail..." value={drcResultForm.remarks} onChange={e => setDrcResultForm({...drcResultForm, remarks: e.target.value})} required />
                            </div>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                              <button type="button" className="btn-outline" onClick={() => { setShowDrcResult(false); setSelectedDrc(null); }} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Cancel</button>
                              <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '4px 14px', fontSize: '0.75rem', background: '#059669' }}>Submit Decision</button>
                            </div>
                          </form>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>
          </div>

          {/* ACCORDION 4: Operational History / Audit Trail */}
          <div style={{ border: '1px solid var(--color-border, #E2E8F0)', borderRadius: 12, overflow: 'hidden', background: 'var(--color-surface, #ffffff)', flexShrink: 0 }}>
            <button 
              type="button"
              onClick={() => toggleSection('timeline')}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 20px',
                background: 'var(--color-bg, #F8FAFC)',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                color: 'var(--color-text, #1E293B)',
                fontWeight: 700,
                fontSize: '0.9rem',
                outline: 'none',
                transition: 'background 0.2s'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                📜 4. Scholar Transition Timeline & Audit Logs
              </span>
              <ChevronIcon isOpen={accordionOpen.timeline} />
            </button>
            {accordionOpen.timeline && (
              <div style={{ padding: '20px 24px', borderTop: '1px solid var(--color-border, #E2E8F0)', background: 'var(--color-surface, #ffffff)' }}>
                <div style={{ maxHeight: 150, overflowY: 'auto', background: '#F8FAFC', borderRadius: 8, padding: 12, border: '1px solid #E2E8F0' }} className="custom-scrollbar">
                  {thesis.auditLog?.length ? (
                    thesis.auditLog.map((l, i) => (
                      <div key={i} style={{ fontSize: '0.8rem', padding: '6px 0', borderBottom: i < thesis.auditLog.length - 1 ? '1px solid #E2E8F0' : 'none' }}>
                        <strong style={{ color: '#1E3A8A' }}>{l.action}</strong> — {l.note} <span style={{ color: '#64748B', fontSize: '0.75rem' }}>({new Date(l.date).toLocaleString()})</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: '#9CA3AF', fontStyle: 'italic' }}>No audit trail recorded.</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <input 
                    className="form-input" 
                    style={{ flex: 1, padding: '6px 12px', fontSize: '0.8rem' }} 
                    placeholder="Enter custom administrative note (e.g. certificates verified, dispatched documents)..." 
                    value={auditNote} 
                    onChange={e => setAuditNote(e.target.value)} 
                  />
                  <button 
                    className="btn-outline" 
                    onClick={() => { act('audit', { action: 'MANUAL_NOTE', note: auditNote }); setAuditNote(''); }} 
                    disabled={!auditNote.trim() || loading} 
                    style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: 600 }}
                  >
                    Add Entry
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ACCORDION 5: Academic Milestones Progress */}
          <div style={{ border: '1px solid var(--color-border, #E2E8F0)', borderRadius: 12, overflow: 'hidden', background: 'var(--color-surface, #ffffff)', flexShrink: 0 }}>
            <button 
              type="button"
              onClick={() => toggleSection('milestones')}
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 20px',
                background: 'var(--color-bg, #F8FAFC)',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                color: 'var(--color-text, #1E293B)',
                fontWeight: 700,
                fontSize: '0.9rem',
                outline: 'none',
                transition: 'background 0.2s'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                📁 5. Complete PhD Milestone History
              </span>
              <ChevronIcon isOpen={accordionOpen.milestones} />
            </button>
            {accordionOpen.milestones && (
              <div style={{ padding: '20px 24px', borderTop: '1px solid var(--color-border, #E2E8F0)', background: 'var(--color-surface, #ffffff)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {milestones?.length > 0 ? (
                  milestones.map(m => (
                    <div key={m._id} style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: 14, background: '#F8FAFC' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1E293B' }}>{m.title}</div>
                        <span style={{ padding: '3px 9px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700, background: m.status === 'APPROVED' ? '#D1FAE5' : m.status === 'SUBMITTED' ? '#DBEAFE' : m.status === 'REVISION_REQUIRED' ? '#FEE2E2' : '#FEF3C7', color: m.status === 'APPROVED' ? '#065F46' : m.status === 'SUBMITTED' ? '#1D4ED8' : m.status === 'REVISION_REQUIRED' ? '#991B1B' : '#D97706' }}>
                          {m.status}
                        </span>
                      </div>
                      {m.documentUrl && (
                        <a href={`${API_BASE_URL}${m.documentUrl}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', color: '#2563EB', fontSize: '0.8rem', fontWeight: 700, marginTop: 4, textDecoration: 'none' }}>
                          📄 Download Submitted File Proof ⬇️
                        </a>
                      )}
                      {m.comments?.length > 0 && (
                        <div style={{ background: '#FFFBEB', borderRadius: 8, padding: 10, marginTop: 8, borderLeft: '3px solid #F59E0B', fontSize: '0.78rem' }}>
                          <div style={{ fontWeight: 700, color: '#B45309', marginBottom: 4 }}>Supervisor Remarks Log:</div>
                          {m.comments.map((c, i) => (
                            <div key={i} style={{ color: '#78350F', marginTop: 2, borderBottom: i < m.comments.length - 1 ? '1px dashed #FDE68A' : 'none', paddingBottom: i < m.comments.length - 1 ? 4 : 0 }}>
                              "{c.text}" — <span style={{ fontWeight: 700 }}>{c.authorName}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '0.8rem', color: '#64748B', fontStyle: 'italic' }}>No academic milestones logged yet.</div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

// ── Overview Page ──
const OverviewPage = ({ theses, onSelectThesis, user, setActiveTab }) => {
  const isHOD = user?.role === 'HOD';
  const counts = {
    total: theses.length,
    pending: theses.filter(t => t.status === 'REGISTRATION_PENDING').length,
    active: theses.filter(t => t.status === 'ACTIVE_RESEARCH').length,
    awarded: theses.filter(t => t.status === 'AWARDED').length
  };
  const awaitingDRC = theses.filter(t => t.status === 'SYNOPSIS_PENDING' && t.synopsisStatus === 'APPROVED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Welcome Banner Card */}
      <div className="card" style={{
        background: isHOD ? 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)' : 'linear-gradient(135deg, #111827 0%, #374151 100%)',
        color: 'white',
        padding: '28px 24px',
        borderRadius: '16px',
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px', color: '#FFFFFF' }}>
          Welcome back, {user?.name || (isHOD ? 'HOD' : 'Admin')}!
        </h2>
        <p style={{ opacity: 0.9, fontSize: '0.85rem', fontWeight: 500, lineHeight: 1.4 }}>
          {isHOD ? (
            `Head of Department — ${user?.department || 'Department of Computer Science Engineering'} Central Console. Manage registration requests, supervisor allocations, RAC sessions, and schedule DRC evaluations.`
          ) : (
            `System Administrator — Master management console. Control platform users, configure database parameters, coordinate academic departments, and track global doctoral tracks.`
          )}
        </p>
      </div>

      {/* Role-Specific Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {[
          { label: 'Total Scholars', value: counts.total, color: '#3B82F6', Icon: GraduationCap, bg: '#EFF6FF', border: '#DBEAFE' },
          { label: 'Awaiting Registration', value: counts.pending, color: '#F59E0B', Icon: Clock, bg: '#FFFBEB', border: '#FEF3C7' },
          { label: 'Active Research', value: counts.active, color: '#10B981', Icon: CheckCircle2, bg: '#ECFDF5', border: '#D1FAE5' },
          { label: 'Degrees Awarded', value: counts.awarded, color: '#8B5CF6', Icon: ShieldCheck, bg: '#F5F3FF', border: '#EDE9FE' }
        ].map(({ label, value, color, Icon, bg, border }) => (
          <div key={label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 16px', background: bg, border: `1px solid ${border}`, borderRadius: '12px' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={24} color={color} />
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color, marginBottom: '2px' }}>{value}</div>
              <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Center Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20 }}>
        {/* Left Side: Main Submissions Overview */}
        <div className="card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📂 Scholars Summary Checklist</span>
          </h3>

          {theses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#94A3B8', fontSize: '0.85rem' }}>
              No scholars currently registered in this department.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {theses.slice(0, 6).map(t => (
                <div
                  key={t._id}
                  onClick={() => onSelectThesis(t._id)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={e => { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseOut={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.transform = 'none'; }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B' }}>{t.scholarId?.name || 'Academic Scholar'}</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', maxWidth: '380px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.title || 'No Research Title Declared'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700, background: STATUS_BG[t.status], color: STATUS_COLOR[t.status] }}>
                      {t.status?.replace('_', ' ')}
                    </span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Quick Alerts & Recommendations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <NotificationPanel user={user} onTabChange={setActiveTab} />
          <div className="card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>
              🔔 Action Needed
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {isHOD ? (
                <>
                  {counts.pending > 0 && (
                    <div style={{ background: '#FFF9E6', borderLeft: '4px solid #F59E0B', padding: '10px 12px', borderRadius: '6px', fontSize: '0.8rem', color: '#B45309' }}>
                      <strong>Registration Verification:</strong> There are {counts.pending} scholar(s) awaiting initial profile review & supervisor assignment.
                    </div>
                  )}
                  {awaitingDRC > 0 && (
                    <div style={{ background: '#EFF6FF', borderLeft: '4px solid #3B82F6', padding: '10px 12px', borderRadius: '6px', fontSize: '0.8rem', color: '#1E40AF' }}>
                      <strong>DRC Meeting Scheduling:</strong> {awaitingDRC} scholar(s) have supervisor synopsis approvals and are ready for official committee evaluation.
                    </div>
                  )}
                  {counts.pending === 0 && awaitingDRC === 0 && (
                    <div style={{ fontSize: '0.8rem', color: '#15803D', background: '#F0FDF4', padding: '10px 12px', borderRadius: '6px', borderLeft: '4px solid #10B981' }}>
                      ✅ Department workflow status is clean. All pending milestones are up to date!
                    </div>
                  )}
                </>
              ) : (
                <>
                  {counts.pending > 0 && (
                    <div style={{ background: '#FFF9E6', borderLeft: '4px solid #F59E0B', padding: '10px 12px', borderRadius: '6px', fontSize: '0.8rem', color: '#B45309' }}>
                      <strong>Pending Verification:</strong> {counts.pending} registration requests require system clearance.
                    </div>
                  )}
                  {counts.pending === 0 && (
                    <div style={{ fontSize: '0.8rem', color: '#15803D', background: '#F0FDF4', padding: '10px 12px', borderRadius: '6px', borderLeft: '4px solid #10B981' }}>
                      ✅ No pending system registrations. System is clean!
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Manage Scholars ──
const ManageScholars = ({ theses, onSelectThesis, onAction, subRole }) => {
  const [filter, setFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [milestoneMap, setMilestoneMap] = useState({});

  const filtered = theses.filter(t =>
    (!filter || t.status === filter) &&
    (!deptFilter || t.department === deptFilter)
  );
  const depts = [...new Set(theses.map(t => t.department))];

  useEffect(() => {
    const fetchCompliance = async () => {
      const activeTheses = theses.filter(t => ['ACTIVE_RESEARCH', 'PRE_SUBMISSION', 'SUBMITTED', 'AWARDED'].includes(t.status));
      const map = {};
      await Promise.all(activeTheses.map(async (t) => {
        try {
          const { data } = await axios.get(`${API}/milestones/${t._id}`, getAuthHeader());
          map[t._id] = data.filter(m => m.type === '6_MONTH_REPORT' && m.status === 'APPROVED');
        } catch (err) {
          console.error(err);
        }
      }));
      setMilestoneMap(map);
    };
    if (theses.length > 0) {
      fetchCompliance();
    }
  }, [theses]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <select className="form-input" style={{ padding: '6px 12px', height: 'auto', flex: 1 }} value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {['REGISTRATION_PENDING','COURSEWORK','SYNOPSIS_PENDING','ACTIVE_RESEARCH','PRE_SUBMISSION','SUBMITTED','AWARDED'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="form-input" style={{ padding: '6px 12px', height: 'auto', flex: 1 }} value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
          <option value="">All Departments</option>
          {depts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      <div className="card documents-card">
        <h3 className="card-title">Scholar Registrations ({filtered.length})</h3>
        <div className="file-list">
          <div className="file-header"><div style={{ flex: 1.5 }}>Scholar</div><div style={{ flex: 1 }}>Dept</div><div style={{ flex: 2 }}>Title</div><div style={{ flex: 1.2 }}>Supervisor</div><div style={{ flex: 1 }}>Status</div><div style={{ flex: 1.4 }}>Action</div></div>
          {filtered.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: '#9CA3AF' }}>No records found.</div>}
          {filtered.map(t => (
            <div key={t._id} className="file-item">
              <div style={{ flex: 1.5, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div className="file-name">{t.scholarId?.name}</div>
                {['ACTIVE_RESEARCH', 'PRE_SUBMISSION', 'SUBMITTED', 'AWARDED'].includes(t.status) && milestoneMap[t._id] && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {milestoneMap[t._id].map(m => (
                      <span 
                        key={m._id} 
                        title={`${m.title} - Approved`}
                        style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: 2, 
                          background: '#D1FAE5', 
                          color: '#065F46', 
                          fontSize: '0.65rem', 
                          fontWeight: 700, 
                          padding: '1px 6px', 
                          borderRadius: 4,
                          border: '1px solid #A7F3D0'
                        }}
                      >
                        S{m.sequence} ✓
                      </span>
                    ))}
                    {milestoneMap[t._id].length === 0 && (
                      <span style={{ fontSize: '0.65rem', color: '#9CA3AF', fontStyle: 'italic' }}>No reports cleared</span>
                    )}
                  </div>
                )}
              </div>
              <div className="file-date" style={{ flex: 1 }}>{t.department}</div>
              <div style={{ flex: 2, fontSize: '0.85rem', color: '#374151' }}>{t.title?.substring(0, 35)}...</div>
              <div style={{ flex: 1.2, fontSize: '0.85rem', color: '#6b7280' }}>{t.supervisorId?.name || '—'}</div>
              <div style={{ flex: 1 }}>
                {(() => {
                  const badge = resolveDetailedStatus(t.status, t.synopsisStatus, t.finalSubStatus, subRole, t.preSubMilestoneStatus, t.preSubmissionSeminar?.status);
                  return (
                    <span style={{ padding: '3px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 600, background: badge.bg, color: badge.color }}>
                      {badge.text}
                    </span>
                  );
                })()}
              </div>
              <div className="file-actions" style={{ flex: 1.4, display: 'flex', gap: 6 }}>
                <button className="btn-action" onClick={() => onSelectThesis(t._id)}>Open</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── External Evaluation ──
const ExternalEvaluation = ({ theses, onAuditLog }) => {
  const submitted = theses.filter(t => t.status === 'SUBMITTED');
  return (
    <div className="card documents-card">
      <h3 className="card-title">External Evaluation Tracker</h3>
      <p style={{ color: '#6b7280', marginBottom: 16, fontSize: '0.9rem' }}>Track submitted theses through the external examiner evaluation process.</p>
      {submitted.length === 0 && <div style={{ textAlign: 'center', padding: 32, color: '#9CA3AF' }}>No submitted theses yet.</div>}
      {submitted.map(t => (
        <div key={t._id} style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{t.scholarId?.name}</div>
          <div style={{ fontSize: '0.85rem', color: '#374151', marginBottom: 12 }}>{t.title}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-outline" onClick={() => onAuditLog(t._id, 'DISPATCHED_TO_EXAMINER', 'Thesis dispatched to external examiner')} style={{ fontSize: '0.8rem', padding: '4px 12px' }}>📤 Mark Dispatched</button>
            <button className="btn-outline" onClick={() => onAuditLog(t._id, 'EXAMINER_REPORT_RECEIVED', 'External examiner report received')} style={{ fontSize: '0.8rem', padding: '4px 12px' }}>📥 Report Received</button>
          </div>
        </div>
      ))}
    </div>
  );
};

// ── Profile Tab ──
const ProfileTab = () => {
  const { user, updateProfile, uploadAvatar } = useContext(AuthContext);
  const [phoneNumber, setPhoneNumber] = useState(user?.profile?.phoneNumber || '');
  const [address, setAddress] = useState(user?.profile?.address || '');
  const [academicBackground, setAcademicBackground] = useState(user?.profile?.academicBackground || '');
  const [areaOfInterest, setAreaOfInterest] = useState(user?.profile?.areaOfInterest || '');
  const [designation, setDesignation] = useState(user?.profile?.designation || '');
  const [specialization, setSpecialization] = useState(user?.profile?.specialization || '');
  const [officeRoom, setOfficeRoom] = useState(user?.profile?.officeRoom || '');
  const [yearsOfService, setYearsOfService] = useState(user?.profile?.yearsOfService || 0);
  const [additionalResponsibilities, setAdditionalResponsibilities] = useState(user?.profile?.additionalResponsibilities || '');

  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarLoading(true);
    setMsg('');
    const res = await uploadAvatar(file);
    setAvatarLoading(false);
    if (res.success) {
      setMsg('Profile picture uploaded successfully!');
    } else {
      setMsg('Failed to upload profile picture: ' + res.message);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    const cleanedPhone = phoneNumber.trim().replace(/[\s\-()]/g, '');
    const indianPhoneRegex = /^(\+91|91|0)?[6-9]\d{9}$/;
    if (!indianPhoneRegex.test(cleanedPhone)) {
      setMsg('Failed to update profile: Please enter a valid 10-digit Indian phone number (starts with 6-9).');
      setLoading(false);
      return;
    }

    const payload = {
      phoneNumber,
      address,
      academicBackground: user.role === 'STUDENT' ? academicBackground : undefined,
      areaOfInterest: user.role === 'STUDENT' ? areaOfInterest : undefined,
      designation: user.role === 'FACULTY' ? designation : undefined,
      specialization: user.role === 'FACULTY' ? specialization : undefined,
      officeRoom: ['FACULTY', 'HOD'].includes(user.role) ? officeRoom : undefined,
      yearsOfService: user.role === 'HOD' ? Number(yearsOfService) : undefined,
      additionalResponsibilities: user.role === 'HOD' ? additionalResponsibilities : undefined,
    };
    const res = await updateProfile(payload);
    setLoading(false);
    if (res.success) {
      setMsg('Profile updated successfully!');
    } else {
      setMsg('Failed to update profile: ' + res.message);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 600, margin: '0 auto' }}>
      <h3 className="card-title" style={{ fontSize: '1.2rem', marginBottom: 16 }}>My Profile & Credentials</h3>

      {/* Profile Picture Upload */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid #E5E7EB' }}>
        {user?.avatarUrl ? (
          <img 
            src={`${API_BASE_URL}${user.avatarUrl}`} 
            alt="Avatar Preview" 
            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #E2E8F0', background: '#F8FAFC' }} 
          />
        ) : (
          <svg viewBox="0 0 100 100" style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#e2e8f0', display: 'block', border: '3px solid #E2E8F0' }}>
            <circle cx="50" cy="35" r="20" fill="#94a3b8" />
            <path d="M15 85c0-13.8 11.2-25 25-25h20c13.8 0 25 11.2 25 25z" fill="#94a3b8" />
          </svg>
        )}
        <div>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#133A26', color: 'white', padding: '8px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
            {avatarLoading ? 'Uploading...' : '📷 Change Profile Picture'}
            <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} disabled={avatarLoading} />
          </label>
          <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748B', marginTop: '6px' }}>JPG, PNG or GIF. Max 5MB.</span>
        </div>
      </div>

      {msg && (
        <div style={{
          padding: 12,
          borderRadius: 8,
          background: msg.includes('successfully') ? '#E8F5E9' : '#FFEBEE',
          color: msg.includes('successfully') ? '#2E7D32' : '#C62828',
          marginBottom: 16,
          fontSize: '0.85rem',
          fontWeight: 600
        }}>
          {msg}
        </div>
      )}
      <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Full Name</label>
            <input type="text" className="form-input" value={user?.name} disabled style={{ background: '#F1F5F9', color: '#64748B' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Username / Email</label>
            <input type="text" className="form-input" value={user?.username} disabled style={{ background: '#F1F5F9', color: '#64748B' }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Role</label>
            <input type="text" className="form-input" value={user?.role} disabled style={{ background: '#F1F5F9', color: '#64748B' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Department</label>
            <input type="text" className="form-input" value={user?.department || 'N/A'} disabled style={{ background: '#F1F5F9', color: '#64748B' }} />
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Phone Number (Indian Format)</label>
          <input type="text" className="form-input" placeholder="Enter 10-digit mobile number e.g. 9876543210" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Address</label>
          <input type="text" className="form-input" value={address} onChange={e => setAddress(e.target.value)} required />
        </div>

        {user?.role === 'HOD' && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Office Room No.</label>
              <input type="text" className="form-input" value={officeRoom} onChange={e => setOfficeRoom(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Years of Service as HOD</label>
              <input type="number" className="form-input" value={yearsOfService} onChange={e => setYearsOfService(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Additional Responsibilities</label>
              <input type="text" className="form-input" value={additionalResponsibilities} onChange={e => setAdditionalResponsibilities(e.target.value)} />
            </div>
          </>
        )}

        <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: 8, background: '#059669' }}>
          {loading ? 'Saving...' : 'Update Details'}
        </button>
      </form>
    </div>
  );
};

// ── Manage Department Users ──
const ManageUsers = () => {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API}/auth/dept-users`, getAuthHeader());
      setUsers(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch department directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleActive = async (userId) => {
    try {
      await axios.put(`${API}/auth/users/${userId}/active`, {}, getAuthHeader());
      setUsers(users.map(u => u._id === userId ? { ...u, isActive: !u.isActive } : u));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle account active status.');
    }
  };

  return (
    <div className="card documents-card">
      <h3 className="card-title">Department Directory & User Access</h3>
      <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: 20 }}>
        Verify profiles and toggle user logins active or disabled to coordinate access boundaries within your department.
      </p>
      
      {error && <div style={{ color: '#DC2626', marginBottom: 16 }}>{error}</div>}
      
      {loading ? (
        <div className="premium-preloader-container">
          <div className="premium-preloader-spinner"></div>
          <div className="premium-preloader-text">Loading department directory...</div>
        </div>
      ) : (
        <div className="file-list">
          <div className="file-header">
            <div style={{ flex: 2 }}>Name</div>
            <div style={{ flex: 1.5 }}>Email Address</div>
            <div style={{ flex: 1 }}>Role</div>
            <div style={{ flex: 1 }}>Profile</div>
            <div style={{ flex: 1 }}>Verification</div>
            <div style={{ flex: 1 }}>Status</div>
            <div style={{ flex: 2.2 }}>Action</div>
          </div>
          {users.map(u => (
            <div key={u._id} className="file-item" style={{ opacity: u.isActive ? 1 : 0.65 }}>
              <div className="file-name" style={{ flex: 2, fontWeight: 600 }}>{u.name}</div>
              <div style={{ flex: 1.5, fontSize: '0.85rem', color: '#64748B' }}>{u.username}</div>
              <div style={{ flex: 1 }}>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: u.role === 'HOD' ? '#FEF3C7' : u.role === 'FACULTY' ? '#DBEAFE' : '#E0F2FE',
                  color: u.role === 'HOD' ? '#D97706' : u.role === 'FACULTY' ? '#1D4ED8' : '#0369A1'
                }}>
                  {u.role}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: u.profileCompleted ? '#D1FAE5' : '#FEF2F2',
                  color: u.profileCompleted ? '#065F46' : '#991B1B'
                }}>
                  {u.profileCompleted ? 'Complete' : 'Incomplete'}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: u.isVerified ? '#D1FAE5' : '#FEF3C7',
                  color: u.isVerified ? '#065F46' : '#D97706'
                }}>
                  {u.isVerified ? 'Verified' : 'Unverified'}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: u.isActive ? '#D1FAE5' : '#F3F4F6',
                  color: u.isActive ? '#065F46' : '#374151'
                }}>
                  {u.isActive ? 'Active' : 'Disabled'}
                </span>
              </div>
              <div style={{ flex: 2.2, display: 'flex', gap: 6, alignItems: 'center' }}>
                <button 
                  onClick={() => handleToggleActive(u._id)}
                  style={{
                    background: u.isActive ? '#DC2626' : '#059669',
                    color: 'white',
                    border: 'none',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {u.isActive ? 'Disable ID' : 'Enable ID'}
                </button>
                {!u.isVerified && (u.role === 'STUDENT' || u.role === 'FACULTY') && (
                  <button 
                    onClick={async () => {
                      try {
                        await axios.put(`${API}/auth/users/${u._id}/verify`, {}, getAuthHeader());
                        toast.success("Account verified successfully!");
                        fetchUsers();
                      } catch (err) {
                        toast.error(err.response?.data?.message || 'Verification failed');
                      }
                    }}
                    style={{
                      background: '#2563EB',
                      color: 'white',
                      border: 'none',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Verify ID
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Faculty Management ──
const ManageFaculty = () => {
  const [faculty, setFaculty] = useState([]);
  useEffect(() => { axios.get(`${API}/auth/faculty`, getAuthHeader()).then(r => setFaculty(r.data)).catch(() => {}); }, []);
  return (
    <div className="card documents-card">
      <h3 className="card-title">Faculty Supervison Directory</h3>
      <div className="file-list">
        <div className="file-header"><div style={{ flex: 2 }}>Name</div><div style={{ flex: 1.5 }}>Department</div><div style={{ flex: 1 }}>Sub-Role</div><div style={{ flex: 1.5 }}>Username</div></div>
        {faculty.map(f => (
          <div key={f._id} className="file-item">
            <div className="file-name" style={{ flex: 2 }}>{f.name}</div>
            <div className="file-date" style={{ flex: 1.5 }}>{f.department || '—'}</div>
            <div style={{ flex: 1 }}><span style={{ padding: '3px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600, background: f.subRole === 'HOD' ? '#FEF3C7' : '#DBEAFE', color: f.subRole === 'HOD' ? '#D97706' : '#1D4ED8' }}>{f.subRole || 'SUPERVISOR'}</span></div>
            <div style={{ flex: 1.5, fontSize: '0.85rem', color: '#6b7280' }}>{f.username}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const getStatusDisplay = (status) => {
  switch (status) {
    case 'DRAFT':
      return { text: 'Draft', color: '#475569', bg: '#E2E8F0', border: '#CBD5E1' };
    case 'PENDING':
      return { text: 'submitted and pending review at supervisor', color: '#D97706', bg: '#FEF3C7', border: '#FDE68A' };
    case 'UNDER_REVIEW_HOD':
      return { text: 'pending approval at HOD', color: '#1D4ED8', bg: '#DBEAFE', border: '#BFDBFE' };
    case 'VERIFIED':
      return { text: 'approved', color: '#065F46', bg: '#D1FAE5', border: '#A7F3D0' };
    case 'REJECTED_BY_SUPERVISOR':
      return { text: 'rejected by supervisor', color: '#991B1B', bg: '#FEE2E2', border: '#FCA5A5' };
    case 'REJECTED_BY_HOD':
      return { text: 'rejected by HOD', color: '#991B1B', bg: '#FEE2E2', border: '#FCA5A5' };
    default:
      return { text: status, color: '#475569', bg: '#E2E8F0', border: '#CBD5E1' };
  }
};

// ── HOD Document Evaluation Modal ──
const HODDocumentEvaluationModal = ({ doc, onClose, onRefresh }) => {
  const toast = useToast();
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReviewAction = async (action) => {
    if (!commentText.trim() && action === 'REVISION') {
      return toast.warning('Remarks and requirements are required to request corrections/reject.');
    }
    setLoading(true);
    try {
      if (doc.docType === 'MILESTONE') {
        await axios.put(`${API}/milestones/${doc._id}/review`, {
          action: action === 'APPROVE' ? 'APPROVE' : 'REVISION',
          comment: commentText.trim()
        }, getAuthHeader());
        toast.success(`Milestone marked: ${action === 'APPROVE' ? 'APPROVED' : 'REVISION REQUIRED'}`);
      } else {
        await axios.put(`${API}/publications/${doc._id}/verify`, {
          status: action === 'APPROVE' ? 'VERIFIED' : 'REJECTED',
          remarks: commentText.trim()
        }, getAuthHeader());
        toast.success(`Publication marked: ${action === 'APPROVE' ? 'VERIFIED' : 'REJECTED'}`);
      }
      onClose();
      onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error processing review.');
    } finally {
      setLoading(false);
    }
  };

  const fileUrl = doc.documentUrl || doc.attachmentUrl;
  const isDocx = fileUrl?.toLowerCase().endsWith('.docx') || fileUrl?.toLowerCase().endsWith('.doc');
  const viewerUrl = fileUrl ? (isDocx ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(API_BASE_URL + fileUrl)}` : `${API_BASE_URL}${fileUrl}`) : '';

  return (
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      background: 'rgba(0,0,0,0.6)', 
      backdropFilter: 'blur(4px)', 
      zIndex: 200000, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      overflow: 'hidden', 
      padding: '20px',
      pointerEvents: 'auto'
    }}>
      <div style={{
        background: 'var(--color-surface, #ffffff)',
        color: 'var(--color-text, #1f2937)',
        borderRadius: 20,
        padding: 24,
        width: '95%',
        maxWidth: 1100,
        height: 'min(720px, 90vh)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        boxSizing: 'border-box',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--color-border, #E2E8F0)', paddingBottom: 12, flexShrink: 0 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--color-text, #0F172A)' }}>
            Reviewing: {doc.scholarName}'s Submission
          </h3>
          <button 
            onClick={onClose} 
            style={{ 
              background: 'var(--color-bg, #F1F5F9)', 
              border: 'none', 
              width: '36px', 
              height: '36px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '1rem', 
              cursor: 'pointer', 
              color: 'var(--color-text, #475569)', 
              transition: 'all 0.2s',
              flexShrink: 0,
              marginLeft: 12
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-border, #E2E8F0)';
              e.currentTarget.style.transform = 'rotate(90deg)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-bg, #F1F5F9)';
              e.currentTarget.style.transform = 'none';
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20, flex: 1, minHeight: 0 }}>
          {/* Left Panel: Document Viewer */}
          <div style={{ background: '#F8FAFC', borderRadius: 12, border: '1px solid var(--color-border, #E2E8F0)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ background: '#F1F5F9', padding: '8px 16px', borderBottom: '1px solid var(--color-border, #E2E8F0)', fontWeight: 600, fontSize: '0.8rem', color: '#475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📄 Document Preview Window</span>
              {fileUrl && <a href={`${API_BASE_URL}${fileUrl}`} target="_blank" rel="noreferrer" style={{ color: '#2563EB', fontWeight: 700 }}>Download Copy ⬇️</a>}
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              {fileUrl ? (
                <>
                  <iframe 
                    src={viewerUrl} 
                    title="Document Previewer" 
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                  {API_BASE_URL.includes('localhost') && (
                    <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, background: 'rgba(254, 243, 199, 0.95)', border: '1px solid #F59E0B', padding: '8px 12px', borderRadius: 8, fontSize: '0.75rem', color: '#92400E' }}>
                      ℹ️ <strong>Local Development Warning:</strong> External Word viewers cannot read local files. Use "Download Copy" above if preview does not load.
                    </div>
                  )}
                </>
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', flexDirection: 'column' }}>
                  <span style={{ fontSize: '2.5rem' }}>⚠️</span>
                  <p style={{ marginTop: 8, fontWeight: 700 }}>No document attachment found</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel: Feedback Form */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '4px 0', overflowY: 'auto' }} className="custom-scrollbar">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--color-bg, #F8FAFC)', padding: 16, borderRadius: 12, border: '1px solid var(--color-border, #E2E8F0)', fontSize: '0.82rem' }}>
                <div><strong>Scholar:</strong> {doc.scholarName} ({doc.enrollmentNumber})</div>
                <div><strong>Deliverable:</strong> {doc.title}</div>
                <div><strong>Type:</strong> {doc.type === 'IPR' && doc.iprType ? `IPR: ${doc.iprType}` : doc.type === 'PATENT' ? 'IPR: Patent' : doc.type || doc.docType}</div>
                {doc.thesisTitle && <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><strong>Thesis:</strong> {doc.thesisTitle}</div>}
                
                {doc.docType === 'PUBLICATION' && (
                  <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--color-border, #E2E8F0)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div><strong>{doc.type === 'PATENT' || doc.type === 'IPR' ? 'IPR Office/Org:' : doc.type === 'CONFERENCE' ? 'Conference Name:' : 'Journal/Publisher:'}</strong> {doc.journalName}</div>
                    <div><strong>{doc.type === 'PATENT' || doc.type === 'IPR' ? 'IPR Number:' : doc.type === 'CONFERENCE' ? 'Location/Venue:' : 'ISSN:'}</strong> {doc.issn || 'N/A'}</div>
                    <div><strong>{doc.type === 'PATENT' || doc.type === 'IPR' ? 'Filing/Award Date:' : 'Date:'}</strong> {doc.publicationDate ? new Date(doc.publicationDate).toLocaleDateString() : 'N/A'}</div>
                    {(doc.type === 'PATENT' || doc.type === 'IPR') && (
                      <>
                        <div><strong>Inventors/Applicants:</strong> {doc.volume || 'N/A'}</div>
                        <div><strong>App/Grant No:</strong> {doc.issue || 'N/A'}</div>
                        <div><strong>Country/Region:</strong> {doc.pages || 'N/A'}</div>
                      </>
                    )}
                    {doc.type === 'JOURNAL' && (
                      <>
                        <div><strong>Indexing:</strong> {doc.indexing || 'N/A'}</div>
                        <div><strong>Volume:</strong> {doc.volume || 'N/A'}</div>
                        <div><strong>Issue:</strong> {doc.issue || 'N/A'}</div>
                        <div><strong>Pages:</strong> {doc.pages || 'N/A'}</div>
                      </>
                    )}
                    {doc.type === 'CONFERENCE' && (
                      <>
                        <div><strong>Indexing:</strong> {doc.indexing || 'N/A'}</div>
                        <div><strong>Organizer:</strong> {doc.volume || 'N/A'}</div>
                      </>
                    )}
                    {doc.doiUrl && <div style={{ wordBreak: 'break-all' }}><strong>{doc.type === 'PATENT' || doc.type === 'IPR' ? 'IPR ID/Ref:' : doc.type === 'CONFERENCE' ? 'Proceedings Link:' : 'DOI:'}</strong> <a href={doc.paperLink || `https://doi.org/${doc.doiUrl}`} target="_blank" rel="noreferrer" style={{ color: '#2563EB', textDecoration: 'underline' }}>{doc.doiUrl}</a></div>}
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary, #475569)', marginBottom: 6 }}>
                  Review Remarks & Requirements
                </label>
                <textarea 
                  className="form-input" 
                  rows="8" 
                  placeholder="Enter detailed feedback, comments, guidelines, or required corrections..." 
                  value={commentText} 
                  onChange={e => setCommentText(e.target.value)}
                  style={{ width: '100%', resize: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, borderTop: '1px solid var(--color-border, #E2E8F0)', paddingTop: 16 }}>
              {doc.docType === 'PUBLICATION' ? doc.status === 'UNDER_REVIEW_HOD' : (doc.status === 'SUBMITTED' || doc.status === 'PENDING') ? (
                <>
                  <button 
                    type="button" 
                    onClick={() => handleReviewAction('REVISION')} 
                    disabled={loading} 
                    className="btn-outline" 
                    style={{ flex: 1, padding: '12px', fontSize: '0.85rem', color: '#DC2626', borderColor: '#FCA5A5', fontWeight: 700 }}
                  >
                    ✗ Request Revision
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleReviewAction('APPROVE')} 
                    disabled={loading} 
                    className="btn-primary" 
                    style={{ flex: 1, padding: '12px', fontSize: '0.85rem', background: '#059669', fontWeight: 700 }}
                  >
                    ✓ Approve Deliverable
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center', width: '100%', padding: '10px', background: '#F1F5F9', borderRadius: 8, fontWeight: 700, color: '#475569', fontSize: '0.85rem' }}>
                  Status: <span style={{ color: doc.status === 'VERIFIED' ? '#059669' : '#DC2626' }}>{getStatusDisplay(doc.status).text}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── HOD Document Review Manager ──
const HODDocumentManager = ({ theses }) => {
  const { user } = useContext(AuthContext);
  const toast = useToast();
  
  const [activeTab, setActiveTab] = useState('chapters');
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  
  const [chapterDrafts, setChapterDrafts] = useState([]);
  const [publications, setPublications] = useState([]);
  const [researchOutputs, setResearchOutputs] = useState([]);

  const fetchAllDocs = async () => {
    setLoading(true);
    try {
      const dept = user?.department;
      if (!dept) return;

      const deptTheses = theses.filter(t => t.department === dept && t.status !== 'REGISTRATION_PENDING');
      
      // Fetch department publications
      let pubs = [];
      try {
        const pubRes = await axios.get(`${API}/publications/department/${dept}`, getAuthHeader());
        pubs = pubRes.data || [];
      } catch (err) {
        console.error("Error fetching department publications", err);
      }

      // Fetch milestones for all department theses
      const allChapterDrafts = [];
      const allResearchOutputs = [];

      await Promise.all(deptTheses.map(async (t) => {
        try {
          const mRes = await axios.get(`${API}/milestones/${t._id}`, getAuthHeader());
          const milestones = mRes.data || [];
          
          milestones.forEach(m => {
            const mWithInfo = {
              ...m,
              scholarName: t.scholarId?.name || 'Academic Scholar',
              enrollmentNumber: t.scholarId?.username || '',
              thesisTitle: t.title,
              thesisId: t._id
            };
            
            if (m.type === 'CHAPTER_DRAFT') {
              allChapterDrafts.push(mWithInfo);
            } else if (m.type === '6_MONTH_REPORT' || m.type === 'SYNOPSIS' || m.type === 'FINAL_SUBMISSION' || m.type === 'PRE_SUBMISSION') {
              allResearchOutputs.push(mWithInfo);
            }
          });
        } catch (err) {
          console.error(`Error fetching milestones for thesis ${t._id}`, err);
        }
      }));

      // Map publications to include scholar details
      const pubsWithInfo = pubs.map(p => {
        const matchingThesis = deptTheses.find(t => t._id === p.thesisId);
        return {
          ...p,
          scholarName: p.scholarId?.name || matchingThesis?.scholarId?.name || 'Academic Scholar',
          enrollmentNumber: p.scholarId?.username || matchingThesis?.scholarId?.username || '',
          thesisTitle: matchingThesis?.title || '',
        };
      });

      // Sort outputs/documents by latest updates
      setChapterDrafts(allChapterDrafts.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)));
      setPublications(pubsWithInfo.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
      setResearchOutputs(allResearchOutputs.sort((a, b) => new Date(b.dueDate || 0) - new Date(a.dueDate || 0)));
    } catch (err) {
      console.error("Error organizing HOD document listings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.department) {
      fetchAllDocs();
    }
  }, [theses, user]);

  const handlePubVerify = async (pubId, status) => {
    setActionLoading(true);
    try {
      await axios.put(`${API}/publications/${pubId}/verify`, { status }, getAuthHeader());
      toast.success(`Publication record successfully ${status === 'VERIFIED' ? 'Verified' : 'Rejected'}!`);
      fetchAllDocs();
    } catch (err) {
      toast.error('Failed to verify publication.');
    } finally {
      setActionLoading(false);
    }
  };

  const pendingChaptersCount = chapterDrafts.filter(c => c.status === 'SUBMITTED').length;
  const pendingPublicationsCount = publications.filter(p => p.status === 'UNDER_REVIEW_HOD').length;
  const pendingReportsCount = researchOutputs.filter(r => r.status === 'SUBMITTED').length;

  return (
    <div className="card" style={{ padding: 24, borderRadius: 16, border: '1px solid #E2E8F0', background: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: 0 }}>Document Review Manager</h3>
          <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: 4 }}>
            Directly review and manage all student uploaded documents, scientific publications, and progress reports in your department.
          </p>
        </div>
        <button onClick={fetchAllDocs} className="btn-outline" style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '8px 16px', fontSize: '0.85rem' }}>
          🔄 Refresh Documents
        </button>
      </div>

      {/* Dynamic Segmented Pill Tabs switcher */}
      <div style={{
        display: 'flex',
        background: 'var(--color-bg, #F1F5F9)',
        padding: '4px',
        borderRadius: '10px',
        gap: '4px',
        width: '100%',
        maxWidth: 600,
        boxSizing: 'border-box',
        border: '1px solid var(--color-border, #E2E8F0)',
        marginTop: 16,
        marginBottom: 24,
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('chapters')}
          style={{
            flex: 1,
            background: activeTab === 'chapters' ? '#10b981' : 'transparent',
            border: 'none',
            padding: '10px 16px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            borderRadius: '8px',
            color: activeTab === 'chapters' ? '#ffffff' : 'var(--color-text-secondary, #475569)',
            boxShadow: activeTab === 'chapters' ? '0 2px 4px rgba(16, 185, 129, 0.2)' : 'none',
            transition: 'all 0.2s ease-in-out',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span>Chapter Drafts</span>
          {pendingChaptersCount > 0 && (
            <span style={{
              background: '#EF4444',
              color: 'white',
              fontSize: '0.72rem',
              fontWeight: 'bold',
              borderRadius: '50%',
              minWidth: '18px',
              height: '18px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 1px 3px rgba(239, 68, 68, 0.4)',
              border: activeTab === 'chapters' ? '1.5px solid #10b981' : '1.5px solid var(--color-bg, #F1F5F9)'
            }}>
              {pendingChaptersCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('publications')}
          style={{
            flex: 1,
            background: activeTab === 'publications' ? '#10b981' : 'transparent',
            border: 'none',
            padding: '10px 16px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            borderRadius: '8px',
            color: activeTab === 'publications' ? '#ffffff' : 'var(--color-text-secondary, #475569)',
            boxShadow: activeTab === 'publications' ? '0 2px 4px rgba(16, 185, 129, 0.2)' : 'none',
            transition: 'all 0.2s ease-in-out',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span>Research Outputs</span>
          {pendingPublicationsCount > 0 && (
            <span style={{
              background: '#EF4444',
              color: 'white',
              fontSize: '0.72rem',
              fontWeight: 'bold',
              borderRadius: '50%',
              minWidth: '18px',
              height: '18px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 1px 3px rgba(239, 68, 68, 0.4)',
              border: activeTab === 'publications' ? '1.5px solid #10b981' : '1.5px solid var(--color-bg, #F1F5F9)'
            }}>
              {pendingPublicationsCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          style={{
            flex: 1,
            background: activeTab === 'reports' ? '#10b981' : 'transparent',
            border: 'none',
            padding: '10px 16px',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer',
            borderRadius: '8px',
            color: activeTab === 'reports' ? '#ffffff' : 'var(--color-text-secondary, #475569)',
            boxShadow: activeTab === 'reports' ? '0 2px 4px rgba(16, 185, 129, 0.2)' : 'none',
            transition: 'all 0.2s ease-in-out',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span>Research Outputs</span>
          {pendingReportsCount > 0 && (
            <span style={{
              background: '#EF4444',
              color: 'white',
              fontSize: '0.72rem',
              fontWeight: 'bold',
              borderRadius: '50%',
              minWidth: '18px',
              height: '18px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 1px 3px rgba(239, 68, 68, 0.4)',
              border: activeTab === 'reports' ? '1.5px solid #10b981' : '1.5px solid var(--color-bg, #F1F5F9)'
            }}>
              {pendingReportsCount}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="premium-preloader-container">
          <div className="premium-preloader-spinner"></div>
          <div className="premium-preloader-text">Loading department uploads...</div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }} className="custom-scrollbar">
          {/* Chapter Drafts Tab */}
          {activeTab === 'chapters' && (
            <div>
              {chapterDrafts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, background: '#F8FAFC', borderRadius: 12, color: '#64748B', fontStyle: 'italic' }}>
                  No chapter drafts uploaded by scholars in your department yet.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #E2E8F0', background: '#F8FAFC' }}>
                      <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Scholar</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Chapter Draft Details</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Thesis Context</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Status</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Supervisor Comments</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chapterDrafts.map(c => (
                      <tr key={c._id} style={{ borderBottom: '1px solid #E2E8F0', transition: 'background-color 0.2s' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 700, color: '#1E293B' }}>{c.scholarName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{c.enrollmentNumber}</div>
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 600 }}>{c.title}</td>
                        <td style={{ padding: '14px 16px', color: '#64748B', maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.thesisTitle}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ 
                            padding: '3px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700, 
                            background: c.status === 'APPROVED' ? '#D1FAE5' : c.status === 'REVISION_REQUIRED' ? '#FEE2E2' : c.status === 'SUBMITTED' ? '#DBEAFE' : '#FEF3C7', 
                            color: c.status === 'APPROVED' ? '#065F46' : c.status === 'REVISION_REQUIRED' ? '#991B1B' : c.status === 'SUBMITTED' ? '#1D4ED8' : '#D97706' 
                          }}>
                            {c.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', maxWidth: 240 }}>
                          {c.comments && c.comments.length > 0 ? (
                            <div style={{ fontSize: '0.8rem', color: '#B45309', background: '#FEF3C7', padding: '6px 10px', borderRadius: 6 }}>
                              "{c.comments[c.comments.length - 1].text}"
                            </div>
                          ) : (
                            <span style={{ color: '#94A3B8', fontStyle: 'italic', fontSize: '0.8rem' }}>No feedback logged</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <button 
                            onClick={() => setSelectedDoc({ ...c, docType: 'MILESTONE' })}
                            className="btn-action" 
                            style={{ background: '#133A26', padding: '6px 14px', fontSize: '0.78rem' }}
                          >
                            Evaluate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Publications Tab */}
          {activeTab === 'publications' && (() => {
            const filteredPublications = publications.filter(p => ['UNDER_REVIEW_HOD', 'VERIFIED', 'REJECTED_BY_HOD'].includes(p.status));
            if (filteredPublications.length === 0) {
              return (
                <div style={{ textAlign: 'center', padding: 40, background: '#F8FAFC', borderRadius: 12, color: '#64748B', fontStyle: 'italic' }}>
                  No scientific publications logged by scholars in your department yet.
                </div>
              );
            }
            return (
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #E2E8F0', background: '#F8FAFC' }}>
                      <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Scholar</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Paper Title</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Journal & Publisher</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>ISSN/DOI</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Status</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Proofs</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPublications.map(p => (
                      <tr key={p._id} style={{ borderBottom: '1px solid #E2E8F0', transition: 'background-color 0.2s' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 700, color: '#1E293B' }}>{p.scholarName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{p.enrollmentNumber}</div>
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 600 }}>{p.title}</td>
                        <td style={{ padding: '14px 16px', color: '#475569' }}>
                          <div>{p.journalName}</div>
                          <span style={{ 
                            fontSize: '0.72rem', 
                            background: p.type === 'PATENT' || p.type === 'IPR' ? '#ECFDF5' : p.type === 'CONFERENCE' ? '#F5F3FF' : '#EFF6FF', 
                            color: p.type === 'PATENT' || p.type === 'IPR' ? '#047857' : p.type === 'CONFERENCE' ? '#6D28D9' : '#1D4ED8', 
                            padding: '2px 6px', 
                            borderRadius: 4, 
                            fontWeight: 700 
                          }}>{p.type === 'IPR' && p.iprType ? `IPR: ${p.iprType}` : p.type === 'PATENT' ? 'IPR: Patent' : p.type || 'JOURNAL'}</span>
                          {p.itemStatus && <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: 4, fontWeight: 600 }}>{p.itemStatus}</div>}
                        </td>
                        <td style={{ padding: '14px 16px', color: '#475569' }}>
                          <div><strong>{p.type === 'PATENT' || p.type === 'IPR' ? 'IPR No:' : 'ISSN:'}</strong> {p.issn || 'N/A'}</div>
                          {p.doiUrl && <div style={{ fontSize: '0.75rem', marginTop: 4 }}><strong>{p.type === 'PATENT' || p.type === 'IPR' ? 'App Number:' : 'DOI:'}</strong> <a href={p.paperLink || `https://doi.org/${p.doiUrl}`} target="_blank" rel="noreferrer" style={{ color: '#2563EB', textDecoration: 'underline' }}>{p.doiUrl}</a></div>}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {(() => {
                            const display = getStatusDisplay(p.status);
                            return (
                              <span style={{ 
                                padding: '3px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700,
                                background: display.bg,
                                color: display.color,
                                border: `1px solid ${display.border}`
                              }}>
                                {display.text}
                              </span>
                            );
                          })()}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {p.paperLink && <a href={p.paperLink} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#2563EB', fontWeight: 600 }}>🔗 {p.type === 'PATENT' || p.type === 'IPR' ? 'View IPR URL' : 'View Article'}</a>}
                            {p.documentUrl && <a href={`${API_BASE_URL}${p.documentUrl}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>📄 {p.type === 'PATENT' || p.type === 'IPR' ? 'View IPR Proof' : 'View Uploaded Proof'}</a>}
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          {p.status === 'UNDER_REVIEW_HOD' ? (
                            <button 
                              onClick={() => setSelectedDoc({ ...p, docType: 'PUBLICATION' })}
                              className="btn-action" 
                              style={{ background: '#133A26', padding: '6px 14px', fontSize: '0.78rem' }}
                            >
                              Evaluate
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary, #64748B)', fontWeight: 600 }}>
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })()}

          {/* Research Outputs Tab */}
          {activeTab === 'reports' && (
            <div>
              {researchOutputs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, background: '#F8FAFC', borderRadius: 12, color: '#64748B', fontStyle: 'italic' }}>
                  No research outputs or progress reports logged by scholars in your department yet.
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #E2E8F0', background: '#F8FAFC' }}>
                      <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Scholar</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Milestone / Report Title</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Milestone Type</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Due Date</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Status</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Supervisor Comments</th>
                      <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {researchOutputs.map(r => (
                      <tr key={r._id} style={{ borderBottom: '1px solid #E2E8F0', transition: 'background-color 0.2s' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 700, color: '#1E293B' }}>{r.scholarName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{r.enrollmentNumber}</div>
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 600 }}>{r.title}</td>
                        <td style={{ padding: '14px 16px', color: '#1E3A8A', fontWeight: 700 }}>{r.type}</td>
                        <td style={{ padding: '14px 16px', color: '#475569' }}>{r.dueDate ? new Date(r.dueDate).toLocaleDateString() : 'N/A'}</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ 
                            padding: '3px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700, 
                            background: r.status === 'APPROVED' ? '#D1FAE5' : r.status === 'REVISION_REQUIRED' ? '#FEE2E2' : r.status === 'SUBMITTED' ? '#DBEAFE' : '#FEF3C7', 
                            color: r.status === 'APPROVED' ? '#065F46' : r.status === 'REVISION_REQUIRED' ? '#991B1B' : r.status === 'SUBMITTED' ? '#1D4ED8' : '#D97706' 
                          }}>
                            {r.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', maxWidth: 240 }}>
                          {r.comments && r.comments.length > 0 ? (
                            <div style={{ fontSize: '0.8rem', color: '#1E3A8A', background: '#EFF6FF', padding: '6px 10px', borderRadius: 6 }}>
                              "{r.comments[r.comments.length - 1].text}"
                            </div>
                          ) : (
                            <span style={{ color: '#94A3B8', fontStyle: 'italic', fontSize: '0.8rem' }}>No feedback logged</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <button 
                            onClick={() => setSelectedDoc({ ...r, docType: 'MILESTONE' })}
                            className="btn-action" 
                            style={{ background: '#133A26', padding: '6px 14px', fontSize: '0.78rem' }}
                          >
                            Evaluate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}

      {selectedDoc && createPortal(
        <HODDocumentEvaluationModal 
          doc={selectedDoc} 
          onClose={() => setSelectedDoc(null)} 
          onRefresh={fetchAllDocs} 
        />,
        document.body
      )}
    </div>
  );
};

// ── RAC Review Modal ──
const RACReviewModal = ({ rac, onClose, onSave }) => {
  const [status, setStatus] = useState(rac.status && rac.status !== 'SCHEDULED' ? rac.status : 'SATISFACTORY');
  const [remarks, setRemarks] = useState(rac.remarks || '');
  const [researchProgress, setResearchProgress] = useState(rac.researchProgress || '');
  const [nextMilestones, setNextMilestones] = useState(rac.nextMilestones || '');
  const [nextMeetingDate, setNextMeetingDate] = useState(rac.nextMeetingDate ? new Date(rac.nextMeetingDate).toISOString().split('T')[0] : '');
  const [committeeChairedBy, setCommitteeChairedBy] = useState(rac.committeeChairedBy || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSave(rac._id, {
      status,
      remarks,
      researchProgress,
      nextMilestones,
      nextMeetingDate: nextMeetingDate || null,
      committeeChairedBy
    });
    setLoading(false);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: 20 }}>
      <div className="card" style={{ maxWidth: 640, width: '100%', padding: '28px 32px', borderRadius: 20, background: 'var(--color-surface, #ffffff)', color: 'var(--color-text, #1f2937)', display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border, #E2E8F0)', paddingBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Evaluate RAC-{rac.racNumber} Meeting Progress</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-secondary, #64748B)' }}>×</button>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: 12, 
          padding: 14, 
          background: 'var(--color-bg, #F8FAFC)', 
          borderRadius: 12, 
          border: '1px solid var(--color-border, #E2E8F0)',
          fontSize: '0.82rem'
        }}>
          <div>
            <span style={{ color: 'var(--color-text-secondary, #64748B)', fontWeight: 600 }}>Scholar Name:</span>
            <div style={{ fontWeight: 700, marginTop: 2, color: 'var(--color-text, #0F172A)' }}>{rac.scholar?.name || 'Academic Scholar'}</div>
          </div>
          <div>
            <span style={{ color: 'var(--color-text-secondary, #64748B)', fontWeight: 600 }}>Scheduled Date:</span>
            <div style={{ fontWeight: 700, marginTop: 2, color: 'var(--color-text, #0F172A)' }}>{new Date(rac.scheduledDate).toLocaleDateString()}</div>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <span style={{ color: 'var(--color-text-secondary, #64748B)', fontWeight: 600 }}>Thesis Topic:</span>
            <div style={{ fontWeight: 700, marginTop: 2, color: 'var(--color-text, #0F172A)', lineHeight: 1.3 }}>{rac.title || 'N/A'}</div>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <span style={{ color: 'var(--color-text-secondary, #64748B)', fontWeight: 600 }}>Assigned Committee Members:</span>
            <div style={{ fontWeight: 700, marginTop: 2, color: 'var(--color-text, #0F172A)' }}>{rac.committeeMembers || 'Pending'}</div>
          </div>
          {(rac.submissions && rac.submissions.length > 0) || rac.progressReportUrl || rac.studentRemarks ? (
            <div style={{ gridColumn: 'span 2', marginTop: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ color: 'var(--color-text-secondary, #64748B)', fontWeight: 600 }}>Candidate Submissions History:</span>
              <div style={{ width: '100%', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', background: '#ffffff', borderRadius: 8, overflow: 'hidden', border: '1px solid #CBD5E1', minWidth: 480 }}>
                  <thead>
                    <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #CBD5E1', textAlign: 'left' }}>
                      <th style={{ padding: '6px 10px', fontWeight: 700, color: '#475569', width: '15%' }}>Submission</th>
                      <th style={{ padding: '6px 10px', fontWeight: 700, color: '#475569', width: '25%' }}>Date & Time</th>
                      <th style={{ padding: '6px 10px', fontWeight: 700, color: '#475569', width: '25%' }}>Attached File</th>
                      <th style={{ padding: '6px 10px', fontWeight: 700, color: '#475569', width: '35%' }}>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rac.submissions && rac.submissions.length > 0 ? (
                      rac.submissions.map((sub, idx) => (
                        <tr key={sub._id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '6px 10px', fontWeight: 600, color: '#1E3A8A' }}>#{idx + 1}</td>
                          <td style={{ padding: '6px 10px', color: '#64748B' }}>{new Date(sub.uploadedAt).toLocaleString()}</td>
                          <td style={{ padding: '6px 10px' }}>
                            {sub.progressReportUrl ? (
                              <a href={`${API_BASE_URL}${sub.progressReportUrl}`} target="_blank" rel="noreferrer" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'underline' }}>
                                📄 View File
                              </a>
                            ) : (
                              <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>No file</span>
                            )}
                          </td>
                          <td style={{ padding: '6px 10px', color: '#334155' }}>
                            {sub.studentRemarks || <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>No remarks</span>}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '6px 10px', fontWeight: 600, color: '#1E3A8A' }}>#1</td>
                        <td style={{ padding: '6px 10px', color: '#64748B' }}>—</td>
                        <td style={{ padding: '6px 10px' }}>
                          {rac.progressReportUrl ? (
                            <a href={`${API_BASE_URL}${rac.progressReportUrl}`} target="_blank" rel="noreferrer" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'underline' }}>
                              📄 View File
                            </a>
                          ) : (
                            <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>No file</span>
                          )}
                        </td>
                        <td style={{ padding: '6px 10px', color: '#334155' }}>
                          {rac.studentRemarks || <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>No remarks</span>}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Committee Recommendation</label>
              <select className="form-input" value={status} onChange={e => setStatus(e.target.value)} required>
                <option value="SATISFACTORY">Give Clearance (Satisfactory)</option>
                <option value="UNSATISFACTORY">Reject (Unsatisfactory)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Committee Chairperson (Chaired By)</label>
              <input type="text" className="form-input" placeholder="e.g. Prof. R. K. Sen" value={committeeChairedBy} onChange={e => setCommitteeChairedBy(e.target.value)} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Research Progress & Methodology Evaluation (Optional)</label>
            <textarea className="form-input" style={{ width: '100%', resize: 'vertical' }} rows="3" placeholder="Detail the candidate's research updates, literature coverage, and experiment design comments..." value={researchProgress} onChange={e => setResearchProgress(e.target.value)} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Milestone Targets for the Next 6 Months (Optional)</label>
            <textarea className="form-input" style={{ width: '100%', resize: 'vertical' }} rows="2" placeholder="List specific targets to achieve before the next RAC session (e.g. complete Chapter 2, publish 1 paper)..." value={nextMilestones} onChange={e => setNextMilestones(e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Proposed Next RAC Session Date</label>
              <input type="date" className="form-input" value={nextMeetingDate} onChange={e => setNextMeetingDate(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>General/Overall Remarks</label>
              <input type="text" className="form-input" placeholder="e.g. Progress is positive, proceed to next semester." value={remarks} onChange={e => setRemarks(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--color-border, #E2E8F0)', paddingTop: 16, marginTop: 8 }}>
            <button type="button" onClick={onClose} className="btn-outline" style={{ padding: '10px 20px' }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '10px 24px', background: '#059669', border: 'none' }}>
              {loading ? 'Submitting...' : 'Submit Evaluation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── PhD Lifecycle Administration console ──
const PhDLifecycleConsole = ({ theses, fetchAllTheses }) => {
  const toast = useToast();
  const [scholars, setScholars] = useState([]);
  const [racs, setRacs] = useState([]);
  const [selectedRAC, setSelectedRAC] = useState(null);
  const { user } = useContext(AuthContext);

  // Form states for scheduling
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [schedForm, setSchedForm] = useState({ thesisId: '', racNumber: 1, scheduledDate: '', committeeMembers: '' });

  const fetchData = async () => {
    try {
      const dept = user?.department;
      if (!dept) return;

      // Filter ACTIVE_RESEARCH theses in HOD's department for RAC scheduling
      const filtered = theses.filter(t => t.department === dept && t.status === 'ACTIVE_RESEARCH');
      setScholars(filtered);

      // Fetch RACs for all scholars in dept
      const allRacs = [];
      for (const t of filtered) {
        const rRes = await axios.get(`${API}/lifecycle/rac/thesis/${t._id}`, getAuthHeader());
        // Attach student details
        rRes.data.forEach(r => { r.scholar = t.scholarId; r.title = t.title; });
        allRacs.push(...rRes.data);
      }
      setRacs(allRacs);
    } catch (err) {}
  };

  useEffect(() => {
    fetchData();
  }, [theses, user]);

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!schedForm.thesisId || !schedForm.scheduledDate) return toast.warning('Please complete the scheduling form.');
    try {
      await axios.post(`${API}/lifecycle/rac/schedule`, schedForm, getAuthHeader());
      toast.success('RAC review meeting scheduled successfully!');
      setShowScheduleForm(false);
      setSchedForm({ thesisId: '', racNumber: 1, scheduledDate: '', committeeMembers: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule RAC.');
    }
  };

  const handleRACGrade = async (racId, payload) => {
    try {
      await axios.put(`${API}/lifecycle/rac/${racId}/result`, payload, getAuthHeader());
      toast.success(`RAC progress successfully graded as ${payload.status}!`);
      fetchData();
    } catch (err) {
      toast.error('Failed to submit grade.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h4 style={{ margin: 0, color: 'var(--color-text, #0F172A)' }}>Doctoral Committee & Periodic RAC Reviews</h4>
        <button onClick={() => setShowScheduleForm(!showScheduleForm)} className="btn-primary" style={{ background: '#059669', display: 'flex', gap: 6, alignItems: 'center' }}>
          <Plus size={16} /> Schedule RAC Review
        </button>
      </div>

      {showScheduleForm && (
        <form onSubmit={handleScheduleSubmit} style={{ background: 'var(--color-bg, #F8FAFC)', padding: 20, borderRadius: 12, border: '1px solid var(--color-border, #E2E8F0)', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h4 style={{ margin: 0 }}>Schedule Research Advisory Committee (RAC) Session</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Select Scholar</label>
              <select className="form-input" required value={schedForm.thesisId} onChange={e => setSchedForm({ ...schedForm, thesisId: e.target.value })}>
                <option value="">Choose scholar...</option>
                {scholars.map(s => <option key={s._id} value={s._id}>{s.scholarId?.name} — {s.title}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>RAC Session Number</label>
              <select className="form-input" value={schedForm.racNumber} onChange={e => setSchedForm({ ...schedForm, racNumber: parseInt(e.target.value) })}>
                {[1,2,3,4,5,6].map(n => <option key={n} value={n}>RAC - {n}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Scheduled Date</label>
              <input type="date" className="form-input" required value={schedForm.scheduledDate} onChange={e => setSchedForm({ ...schedForm, scheduledDate: e.target.value })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Committee Members (Separated by commas)</label>
              <input type="text" className="form-input" placeholder="e.g. Dr. Verma, Prof. Sen, Dr. Kapoor" value={schedForm.committeeMembers} onChange={e => setSchedForm({ ...schedForm, committeeMembers: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => setShowScheduleForm(false)} className="btn-outline" style={{ padding: '8px 16px' }}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ background: '#133A26', padding: '8px 16px' }}>Save Schedule</button>
          </div>
        </form>
      )}

      <div className="file-list">
        <div className="file-header">
          <div style={{ flex: 1.8 }}>Scholar</div>
          <div style={{ flex: 0.8 }}>Session</div>
          <div style={{ flex: 1.2 }}>Date</div>
          <div style={{ flex: 1.5 }}>Report</div>
          <div style={{ flex: 1.2 }}>Status</div>
          <div style={{ flex: 2.2, textAlign: 'center' }}>Grading Actions</div>
        </div>
        {racs.map(r => (
          <div key={r._id} className="file-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <div style={{ flex: 1.8 }}>
                <div style={{ fontWeight: 700 }}>{r.scholar?.name || 'Academic Scholar'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary, #64748B)', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
              </div>
              <div style={{ flex: 0.8, fontWeight: 600, color: '#1E3A8A' }}>RAC-{r.racNumber}</div>
              <div style={{ flex: 1.2, fontSize: '0.85rem' }}>{new Date(r.scheduledDate).toLocaleDateString()}</div>
              <div style={{ flex: 1.5 }}>
                {r.progressReportUrl ? (
                  <a href={`${API_BASE_URL}${r.progressReportUrl}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: '#2563EB', fontWeight: 600, textDecoration: 'underline' }}>
                    📄 View Report
                  </a>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontStyle: 'italic' }}>Pending submission</span>
                )}
              </div>
              <div style={{ flex: 1.2 }}>
                <span style={{ 
                  padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600,
                  background: r.status === 'SATISFACTORY' ? '#D1FAE5' : r.status === 'UNSATISFACTORY' ? '#FEE2E2' : '#FEF3C7',
                  color: r.status === 'SATISFACTORY' ? '#065F46' : r.status === 'UNSATISFACTORY' ? '#991B1B' : '#D97706'
                }}>
                  {r.status === 'SATISFACTORY' ? 'CLEARED' : r.status === 'UNSATISFACTORY' ? 'REJECTED' : r.status}
                </span>
              </div>
              <div style={{ flex: 2.2, display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
                <button 
                  onClick={() => setSelectedRAC(r)}
                  className={r.status === 'SCHEDULED' ? "btn-primary" : "btn-outline"}
                  style={{ 
                    padding: '6px 14px', 
                    fontSize: '0.8rem', 
                    background: r.status === 'SCHEDULED' ? 'var(--color-primary, #059669)' : 'transparent',
                    borderColor: 'var(--color-primary, #059669)',
                    color: r.status === 'SCHEDULED' ? '#ffffff' : 'var(--color-primary, #059669)',
                    border: r.status === 'SCHEDULED' ? 'none' : '1px solid var(--color-primary, #059669)'
                  }}
                >
                  {r.status === 'SCHEDULED' ? 'Review Meeting' : 'Edit Review'}
                </button>
                {r.status !== 'SCHEDULED' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary, #64748B)', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Remarks: {r.remarks || 'None'}</span>
                    <span style={{ fontSize: '0.72rem', color: '#065F46', background: '#D1FAE5', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>Evaluated ✓</span>
                  </div>
                )}
              </div>
            </div>
            {(r.submissions && r.submissions.length > 0) || r.progressReportUrl || r.studentRemarks ? (
              <div style={{ width: '100%', marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6, alignSelf: 'flex-start' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Candidate Submissions History:</span>
                <div style={{ width: '100%', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', background: '#ffffff', borderRadius: 8, overflow: 'hidden', border: '1px solid #CBD5E1', minWidth: 480 }}>
                    <thead>
                      <tr style={{ background: '#F1F5F9', borderBottom: '1px solid #CBD5E1', textAlign: 'left' }}>
                        <th style={{ padding: '6px 10px', fontWeight: 700, color: '#475569', width: '15%' }}>Submission</th>
                        <th style={{ padding: '6px 10px', fontWeight: 700, color: '#475569', width: '25%' }}>Date & Time</th>
                        <th style={{ padding: '6px 10px', fontWeight: 700, color: '#475569', width: '25%' }}>Attached File</th>
                        <th style={{ padding: '6px 10px', fontWeight: 700, color: '#475569', width: '35%' }}>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.submissions && r.submissions.length > 0 ? (
                        r.submissions.map((sub, idx) => (
                          <tr key={sub._id || idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                            <td style={{ padding: '6px 10px', fontWeight: 600, color: '#1E3A8A' }}>#{idx + 1}</td>
                            <td style={{ padding: '6px 10px', color: '#64748B' }}>{new Date(sub.uploadedAt).toLocaleString()}</td>
                            <td style={{ padding: '6px 10px' }}>
                              {sub.progressReportUrl ? (
                                <a href={`${API_BASE_URL}${sub.progressReportUrl}`} target="_blank" rel="noreferrer" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'underline' }}>
                                  📄 View File
                                </a>
                              ) : (
                                <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>No file</span>
                              )}
                            </td>
                            <td style={{ padding: '6px 10px', color: '#334155' }}>
                              {sub.studentRemarks || <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>No remarks</span>}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '6px 10px', fontWeight: 600, color: '#1E3A8A' }}>#1</td>
                          <td style={{ padding: '6px 10px', color: '#64748B' }}>—</td>
                          <td style={{ padding: '6px 10px' }}>
                            {r.progressReportUrl ? (
                              <a href={`${API_BASE_URL}${r.progressReportUrl}`} target="_blank" rel="noreferrer" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'underline' }}>
                                📄 View File
                              </a>
                            ) : (
                              <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>No file</span>
                            )}
                          </td>
                          <td style={{ padding: '6px 10px', color: '#334155' }}>
                            {r.studentRemarks || <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>No remarks</span>}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>
        ))}
        {racs.length === 0 && (
          <div style={{ textAlign: 'center', padding: '36px', color: 'var(--color-text-secondary, #64748B)' }}>No scheduled RAC review meetings found.</div>
        )}
      </div>

      {selectedRAC && createPortal(
        <RACReviewModal 
          rac={selectedRAC} 
          onClose={() => setSelectedRAC(null)} 
          onSave={handleRACGrade} 
        />,
        document.body
      )}
    </div>
  );
};

const HODChangeRequestsTab = ({ user }) => {
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [remarks, setRemarks] = useState({});
  
  // Modal & Searchable Selector States
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [assignedSupervisorId, setAssignedSupervisorId] = useState('');
  const [remarksText, setRemarksText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const fetchAllData = async () => {
    try {
      const [reqRes, facRes] = await Promise.all([
        axios.get(`${API}/lifecycle/change-requests/department/${user?.department}`, getAuthHeader()),
        axios.get(`${API}/auth/faculty`, getAuthHeader())
      ]);
      setRequests(reqRes.data);
      // Show ALL active faculty registered in ANY department
      setFaculty(facRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.department) {
      fetchAllData();
    }
  }, [user?.department]);

  const handleSelectRequest = (r) => {
    setSelectedRequest(r);
    setAssignedSupervisorId(r.proposedValue || '');
    setRemarksText(remarks[r._id] || r.remarks || '');
    setSearchTerm('');
    setShowSearchResults(false);
  };

  const handleReviewInModal = async (status) => {
    if (!remarksText.trim()) {
      toast.warning('Please enter remarks/reasons before submitting your decision.');
      return;
    }

    setBtnLoading(true);
    const isGuideChange = selectedRequest.type === 'GUIDE_CHANGE';
    try {
      const body = { status, remarks: remarksText };
      if (status === 'APPROVED' && isGuideChange) {
        body.proposedValue = assignedSupervisorId || selectedRequest.proposedValue;
      }
      await axios.put(`${API}/lifecycle/change-requests/${selectedRequest._id}/review`, body, getAuthHeader());
      toast.success(`Modification request successfully ${status}!`);
      
      // Update local remarks dictionary
      setRemarks(prev => ({ ...prev, [selectedRequest._id]: remarksText }));
      setSelectedRequest(null);
      fetchAllData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to review request.');
    } finally {
      setBtnLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="premium-preloader-container">
        <div className="premium-preloader-spinner"></div>
        <div className="premium-preloader-text">Loading academic change requests...</div>
      </div>
    );
  }

  const sortedRequests = [...requests].sort((a, b) => (a.status === 'PENDING' ? -1 : 1));

  return (
    <div className="card" style={{ padding: 24, background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
      <h3 className="card-title" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>
        Student Academic Modification Requests
      </h3>
      <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: 20 }}>
        Review, reassign, approve, or reject student requests for Thesis Title modifications and Research Supervisor (Guide) reallocations.
      </p>

      {sortedRequests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748B', background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0', fontStyle: 'italic' }}>
          No academic modification requests logged for your department.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E2E8F0', background: '#F8FAFC' }}>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Scholar</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Request Type</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Current Value</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Proposed Value</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Status</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {sortedRequests.map(r => {
                const isPending = r.status === 'PENDING';
                const isGuideChange = r.type === 'GUIDE_CHANGE';
                const proposedFaculty = faculty.find(f => f._id === r.proposedValue);
                const proposedFacultyName = proposedFaculty ? `${proposedFaculty.name} (${proposedFaculty.department})` : r.proposedValue || 'New Faculty Member';
                
                return (
                  <tr 
                    key={r._id} 
                    style={{ 
                      borderBottom: '1px solid #E2E8F0', 
                      background: isPending ? '#FFFBEB' : 'white',
                      transition: 'background-color 0.2s' 
                    }}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0F172A' }}>
                      <div style={{ fontWeight: 700 }}>{r.scholarId?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 400 }}>{r.scholarId?.username}</div>
                    </td>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: isGuideChange ? '#1E3A8A' : '#047857' }}>
                      {isGuideChange ? '🤝 Supervisor Reallocation' : '📝 Title Modification'}
                    </td>
                    <td style={{ padding: '14px 16px', color: '#475569' }}>{r.currentValue || 'None'}</td>
                    <td style={{ padding: '14px 16px', color: '#0F172A', fontWeight: 600 }}>
                      {isGuideChange ? proposedFacultyName : r.proposedValue}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: 12, 
                        fontSize: '0.7rem', 
                        fontWeight: 700, 
                        background: r.status === 'APPROVED' ? '#ECFDF5' : r.status === 'REJECTED' ? '#FEF2F2' : '#FFFBEB', 
                        color: r.status === 'APPROVED' ? '#065F46' : r.status === 'REJECTED' ? '#991B1B' : '#B45309' 
                      }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <button 
                        onClick={() => handleSelectRequest(r)}
                        className="btn-primary" 
                        style={{ padding: '6px 14px', fontSize: '0.78rem', background: '#3B82F6', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                      >
                        {isPending ? 'Review' : 'View Details'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Popup overlay */}
      {selectedRequest && (() => {
        const isPending = selectedRequest.status === 'PENDING';
        const isGuideChange = selectedRequest.type === 'GUIDE_CHANGE';
        const proposedFaculty = faculty.find(f => f._id === selectedRequest.proposedValue);
        const proposedFacultyName = proposedFaculty ? `${proposedFaculty.name} (${proposedFaculty.department})` : selectedRequest.proposedValue || 'New Faculty Member';

        return (
          <div 
            onClick={() => setSelectedRequest(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
          >
            <div 
              onClick={e => e.stopPropagation()}
              style={{
                background: 'white',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '600px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                animation: 'fadeIn 0.2s ease-out',
                textAlign: 'left'
              }}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #E2E8F0', background: '#FAFAFA' }}>
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📋</span> Review Academic Request
                </span>
                <button 
                  onClick={() => setSelectedRequest(null)}
                  style={{ background: 'none', border: 'none', fontSize: '1.2rem', color: '#64748B', cursor: 'pointer', fontWeight: 700 }}
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
                {/* Scholar Details Banner */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '12px 16px', borderRadius: 10 }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A' }}>{selectedRequest.scholarId?.name}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748B' }}>{selectedRequest.scholarId?.username}</div>
                  </div>
                  <span style={{ 
                    padding: '4px 10px', 
                    borderRadius: 12, 
                    fontSize: '0.72rem', 
                    fontWeight: 700, 
                    background: selectedRequest.status === 'APPROVED' ? '#ECFDF5' : selectedRequest.status === 'REJECTED' ? '#FEF2F2' : '#FFFBEB', 
                    color: selectedRequest.status === 'APPROVED' ? '#065F46' : selectedRequest.status === 'REJECTED' ? '#991B1B' : '#B45309' 
                  }}>
                    {selectedRequest.status}
                  </span>
                </div>

                {/* Info Fields Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', marginBottom: 2 }}>Request Type</strong>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E3A8A' }}>
                      {isGuideChange ? '🤝 Supervisor Reallocation' : '📝 Title Modification'}
                    </span>
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', marginBottom: 2 }}>Current Value</strong>
                    <span style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600 }}>{selectedRequest.currentValue || 'None'}</span>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <strong style={{ display: 'block', fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', marginBottom: 2 }}>Proposed / New Value</strong>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>
                      {isGuideChange ? proposedFacultyName : selectedRequest.proposedValue}
                    </span>
                  </div>
                  <div style={{ gridColumn: 'span 2', borderTop: '1px solid #F1F5F9', paddingTop: 8 }}>
                    <strong style={{ display: 'block', fontSize: '0.72rem', color: '#64748B', textTransform: 'uppercase', marginBottom: 2 }}>Candidate Rationale</strong>
                    <span style={{ fontSize: '0.82rem', color: '#475569', fontStyle: 'italic' }}>"{selectedRequest.reason}"</span>
                  </div>
                </div>

                {/* Form fields */}
                {isPending ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, borderTop: '1px solid #E2E8F0', paddingTop: 16 }}>
                    {isGuideChange && (
                      <div style={{ position: 'relative' }}>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                          Confirm or Reassign Supervisor (Active Institutional Faculty)
                        </label>
                        <div style={{ position: 'relative' }}>
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
                              color: '#0F172A',
                              fontWeight: 600,
                              userSelect: 'none',
                              transition: 'border-color 0.2s',
                            }}
                            onMouseOver={e => e.currentTarget.style.borderColor = '#94A3B8'}
                            onMouseOut={e => e.currentTarget.style.borderColor = '#CBD5E1'}
                          >
                            <span>
                              {assignedSupervisorId 
                                ? (() => {
                                    const selected = faculty.find(f => f._id === assignedSupervisorId);
                                    return selected 
                                      ? `👨‍🏫 ${selected.name} (${selected.department})`
                                      : 'Select Faculty Member';
                                  })()
                                : 'Choose a supervisor...'
                              }
                            </span>
                            <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                              {showSearchResults ? '▲' : '▼'}
                            </span>
                          </div>

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
                                  zIndex: 9999,
                                  marginTop: 4,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  overflow: 'hidden'
                                }}
                              >
                                <div style={{ padding: '10px 12px', borderBottom: '1px solid #E2E8F0', background: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B' }}>
                                      Faculty Directory ({activeFacultyList.length} matches)
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
                                      className="btn-primary" 
                                      style={{ background: '#059669', padding: '6px 14px', fontSize: '0.8rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px', height: '36px' }}
                                    >
                                      🔍 Search
                                    </button>
                                  </div>
                                </div>

                                <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                                  {activeFacultyList.length === 0 ? (
                                    <div style={{ padding: 16, fontSize: '0.8rem', color: '#64748B', fontStyle: 'italic', textAlign: 'center' }}>
                                      No faculty members found.
                                    </div>
                                  ) : (
                                    activeFacultyList.map(f => (
                                      <div 
                                        key={f._id} 
                                        onClick={() => {
                                          setAssignedSupervisorId(f._id);
                                          setShowSearchResults(false);
                                        }}
                                        style={{ 
                                          padding: '10px 14px', 
                                          cursor: 'pointer', 
                                          borderBottom: '1px solid #F1F5F9', 
                                          background: assignedSupervisorId === f._id ? '#EFF6FF' : 'white',
                                          transition: 'background-color 0.2s',
                                          textAlign: 'left'
                                        }}
                                        onMouseOver={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                                        onMouseOut={e => e.currentTarget.style.backgroundColor = assignedSupervisorId === f._id ? '#EFF6FF' : 'white'}
                                      >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>{f.name}</span>
                                          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#059669', background: '#D1FAE5', padding: '2px 6px', borderRadius: 4 }}>
                                            {f.department}
                                          </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748B', marginTop: 4 }}>
                                          <span>{f.designation || 'Faculty Supervisor'}</span>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>HOD Decision Remarks / MoM Context</label>
                      <textarea 
                        className="form-input" 
                        rows="3" 
                        placeholder="Enter the official reason or remarks for HOD approval/rejection..." 
                        value={remarksText} 
                        onChange={e => setRemarksText(e.target.value)} 
                        required 
                      />
                    </div>
                  </div>
                ) : (
                  selectedRequest.remarks && (
                    <div style={{ background: '#F8FAFC', borderLeft: '4px solid #64748B', padding: '12px 16px', fontSize: '0.85rem', color: '#475569', borderRadius: 4, marginTop: 8 }}>
                      <strong>HOD Decision Remarks:</strong> "{selectedRequest.remarks}"
                    </div>
                  )
                )}
              </div>

              {/* Modal Footer */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid #E2E8F0', background: '#FAFAFA' }}>
                <button 
                  type="button" 
                  onClick={() => setSelectedRequest(null)}
                  className="btn-outline"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  {isPending ? 'Cancel' : 'Close'}
                </button>
                
                {isPending && (
                  <>
                    <button 
                      type="button" 
                      onClick={() => handleReviewInModal('REJECTED')} 
                      disabled={btnLoading} 
                      className="btn-outline" 
                      style={{ padding: '8px 16px', fontSize: '0.85rem', borderColor: '#EF4444', color: '#EF4444' }}
                    >
                      ✗ Reject Modification
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleReviewInModal('APPROVED')} 
                      disabled={btnLoading} 
                      className="btn-primary" 
                      style={{ padding: '8px 20px', fontSize: '0.85rem', background: '#059669' }}
                    >
                      ✓ Approve {isGuideChange ? '& Reassign Guide' : 'Title Change'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

// ── Defaulter Tracking Tab ──
const DefaultersTab = () => {
  const toast = useToast();
  const [defaulters, setDefaulters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('dueDate');
  const [sortAsc, setSortAsc] = useState(true);
  const [remindingId, setRemindingId] = useState(null);

  const fetchDefaulters = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/milestones/defaulters`, getAuthHeader());
      setDefaulters(data);
    } catch (err) {
      console.error('Error fetching defaulters', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDefaulters();
  }, []);

  const handleSendReminder = async (id) => {
    setRemindingId(id);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      toast.success('Academic warning notification and email reminder dispatched to scholar!');
    } catch (err) {
      toast.error('Failed to send reminder.');
    } finally {
      setRemindingId(null);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filtered = defaulters.filter(d => {
    const term = searchTerm.toLowerCase();
    return (
      d.scholarName.toLowerCase().includes(term) ||
      d.enrollmentNumber.toLowerCase().includes(term) ||
      d.scholarDepartment.toLowerCase().includes(term) ||
      d.milestoneTitle.toLowerCase().includes(term)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    let valA = a[sortField] || '';
    let valB = b[sortField] || '';
    if (sortField === 'dueDate') {
      valA = new Date(valA);
      valB = new Date(valB);
    } else {
      valA = valA.toString().toLowerCase();
      valB = valB.toString().toLowerCase();
    }
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  return (
    <div className="card" style={{ padding: 24, borderRadius: 16, border: '1px solid #E2E8F0', background: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', margin: 0 }}>Progress Report Defaulters</h3>
          <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: 4 }}>
            Scholars who have missed their bi-annual 6-Month Progress Report submission deadlines.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 16, background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '10px 16px', borderRadius: 10, alignItems: 'center' }}>
          <span style={{ fontSize: '1.5rem' }}>⏰</span>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#991B1B' }}>{defaulters.length}</div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#7F1D1D' }}>Active Defaulters</div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 20, display: 'flex', gap: 12 }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder="Filter by name, department, enrollment no..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)}
          style={{ maxWidth: 400 }}
        />
        <button onClick={fetchDefaulters} className="btn-outline" style={{ display: 'flex', gap: 6, alignItems: 'center', whiteSpace: 'nowrap' }}>
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="premium-preloader-container" style={{ padding: '40px 20px' }}>
          <div className="premium-preloader-spinner" style={{ width: '40px', height: '40px', borderWidth: '3px', marginBottom: '12px' }}></div>
          <div className="premium-preloader-text" style={{ fontSize: '0.85rem' }}>Loading defaulter list...</div>
        </div>
      ) : sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, background: '#F8FAFC', borderRadius: 12, color: '#64748B' }}>
          <span style={{ fontSize: '2rem' }}>🎉</span>
          <p style={{ fontWeight: 700, marginTop: 10, color: '#334155' }}>No Defaulters Found</p>
          <p style={{ fontSize: '0.8rem', marginTop: 2 }}>All scholars in this department are up-to-date with progress reports.</p>
        </div>
      ) : (
        <div className="file-list" style={{ overflowX: 'auto' }}>
          <div className="file-header" style={{ fontWeight: 700, borderBottom: '2px solid #CBD5E1', paddingBottom: 12 }}>
            <div style={{ flex: 1.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => handleSort('scholarName')}>
              Scholar {sortField === 'scholarName' ? (sortAsc ? '▲' : '▼') : ''}
            </div>
            <div style={{ flex: 1.2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => handleSort('enrollmentNumber')}>
              Enrollment No. {sortField === 'enrollmentNumber' ? (sortAsc ? '▲' : '▼') : ''}
            </div>
            <div style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => handleSort('scholarDepartment')}>
              Dept {sortField === 'scholarDepartment' ? (sortAsc ? '▲' : '▼') : ''}
            </div>
            <div style={{ flex: 2 }}>Overdue Report</div>
            <div style={{ flex: 1.2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }} onClick={() => handleSort('dueDate')}>
              Due Date {sortField === 'dueDate' ? (sortAsc ? '▲' : '▼') : ''}
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>Status</div>
            <div style={{ flex: 1, textAlign: 'center' }}>Action</div>
          </div>
          {sorted.map(d => (
            <div key={d._id} className="file-item" style={{ padding: '14px 8px', borderBottom: '1px solid #F1F5F9', alignItems: 'center' }}>
              <div style={{ flex: 1.5, fontWeight: 700, color: '#1E293B' }}>{d.scholarName}</div>
              <div style={{ flex: 1.2, fontSize: '0.85rem', color: '#475569' }}>{d.enrollmentNumber}</div>
              <div style={{ flex: 1, fontSize: '0.85rem', color: '#475569' }}>{d.scholarDepartment}</div>
              <div style={{ flex: 2, fontSize: '0.85rem', fontWeight: 600, color: '#7F1D1D' }}>{d.milestoneTitle}</div>
              <div style={{ flex: 1.2, fontSize: '0.82rem', color: '#475569' }}>
                {new Date(d.dueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </div>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <span style={{ fontSize: '0.72rem', background: '#FEE2E2', color: '#991B1B', padding: '3px 10px', borderRadius: 12, fontWeight: 700 }}>
                  OVERDUE
                </span>
              </div>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <button 
                  onClick={() => handleSendReminder(d._id)} 
                  disabled={remindingId === d._id}
                  className="btn-action" 
                  style={{ background: '#DC2626', display: 'flex', gap: 4, alignItems: 'center', padding: '5px 12px', fontSize: '0.75rem' }}
                >
                  <Bell size={12} /> {remindingId === d._id ? 'Sending...' : 'Remind'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const GlobalTransfersTab = ({ theses, onRefresh }) => {
  const toast = useToast();
  const { transferScholar } = useContext(ThesisContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [allFaculties, setAllFaculties] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  // Modal state
  const [selectedThesis, setSelectedThesis] = useState(null);
  const [targetDept, setTargetDept] = useState('');
  const [targetSupervisor, setTargetSupervisor] = useState('');
  const [targetHod, setTargetHod] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);

  useEffect(() => {
    // Fetch all faculties & departments
    axios.get(`${API}/auth/faculty`, getAuthHeader())
      .then(r => setAllFaculties(r.data))
      .catch(() => {});
    axios.get(`${API}/departments`, getAuthHeader())
      .then(r => setDepartments(r.data))
      .catch(() => {});
  }, []);

  const handleGlobalTransferSubmit = async (e) => {
    e.preventDefault();
    if (!selectedThesis) return;
    
    // Strict validations
    if (!targetDept) {
      return toast.error('Error: New Department is required.');
    }
    if (!targetSupervisor) {
      return toast.error('Error: New Supervisor is required. Leaving the field blank is not allowed.');
    }
    if (!targetHod) {
      return toast.error('Error: New HOD is required. Leaving the field blank is not allowed.');
    }

    setTransferLoading(true);
    try {
      await transferScholar(selectedThesis._id, {
        targetDepartment: targetDept,
        targetSupervisorId: targetSupervisor,
        targetHodId: targetHod
      });
      toast.success('Scholar globally transferred successfully!');
      setSelectedThesis(null);
      setTargetDept('');
      setTargetSupervisor('');
      setTargetHod('');
      if (onRefresh) await onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to globally transfer scholar.');
    } finally {
      setTransferLoading(false);
    }
  };

  // Filter candidates by search term
  const filteredTheses = theses.filter(t => {
    const term = searchTerm.toLowerCase();
    const name = t.scholarId?.name?.toLowerCase() || '';
    const enrollment = t.enrollmentNumber?.toLowerCase() || '';
    const dept = t.department?.toLowerCase() || '';
    const title = t.title?.toLowerCase() || '';
    return name.includes(term) || enrollment.includes(term) || dept.includes(term) || title.includes(term);
  });

  // Find HOD for a department
  const getDeptHOD = (deptName) => {
    const hods = allFaculties.filter(f => f.isVerified && f.department === deptName && (f.role === 'HOD' || f.subRole === 'HOD'));
    if (hods.length === 0) return 'No assigned HOD';
    return hods.map(h => h.name).join(', ');
  };

  // Dropdown filtering based on target department selection
  const eligibleSupervisors = targetDept 
    ? allFaculties.filter(f => f.isVerified && f.department === targetDept)
    : [];

  const eligibleHods = targetDept
    ? allFaculties.filter(f => f.isVerified && f.department === targetDept && (f.role === 'HOD' || f.subRole === 'HOD'))
    : [];

  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h3 className="card-title" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>Global Candidate Transfers</h3>
          <p style={{ fontSize: '0.82rem', color: '#64748B', marginTop: 4 }}>
            As a Super Admin, you can relocate any scholar to another department, manually reassigning a verified Supervisor and HOD.
          </p>
        </div>
        <div style={{ position: 'relative', minWidth: 280 }}>
          <input 
            type="text" 
            placeholder="Search scholar, department, roll..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ width: '100%', padding: '10px 14px', fontSize: '0.85rem', borderRadius: 8 }}
          />
        </div>
      </div>

      <div className="table-container" style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #E2E8F0' }}>
        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
              <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Scholar Name / Enrollment</th>
              <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Department</th>
              <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Current Supervisor</th>
              <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>Current HOD</th>
              <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 700, color: '#475569', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredTheses.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: '#64748B', fontSize: '0.9rem' }}>
                  No scholars found matching your search.
                </td>
              </tr>
            ) : (
              filteredTheses.map(t => (
                <tr key={t._id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'} onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 700, color: '#1E293B' }}>{t.scholarId?.name || 'N/A'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>SH no.: {t.scholarId?.profile?.shNo || '—'} | Roll: {t.enrollmentNumber}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ display: 'inline-block', fontSize: '0.72rem', background: '#EFF6FF', color: '#1E40AF', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
                      {t.department}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 500, color: '#334155' }}>
                      {t.supervisorId?.name ? t.supervisorId.name : <span style={{ color: '#94A3B8', fontStyle: 'italic' }}>Not Allocated</span>}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#475569', fontWeight: 500 }}>
                    {getDeptHOD(t.department)}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <button 
                      onClick={() => {
                        setSelectedThesis(t);
                        setTargetDept('');
                        setTargetSupervisor('');
                        setTargetHod('');
                      }}
                      className="btn-primary"
                      style={{ background: '#7C3AED', padding: '6px 14px', fontSize: '0.75rem', fontWeight: 700, borderRadius: 6, border: 'none', cursor: 'pointer' }}
                    >
                      Global Transfer
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Global Transfer Modal */}
      {selectedThesis && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#ffffff', width: '500px', borderRadius: 16, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }}>
            <div style={{ background: '#7C3AED', color: 'white', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem' }}>Global Scholar Transfer</h4>
              <button 
                onClick={() => setSelectedThesis(null)}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 700 }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleGlobalTransferSubmit} style={{ padding: 24 }}>
              <div style={{ marginBottom: 16, background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>CANDIDATE</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{selectedThesis.scholarId?.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 1 }}>SH no.: {selectedThesis.scholarId?.profile?.shNo || '—'} | Roll: {selectedThesis.enrollmentNumber} | Dept: {selectedThesis.department}</div>
              </div>

              {/* Target Dept Selection */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>Target Department</label>
                <select 
                  className="form-input" 
                  value={targetDept} 
                  onChange={(e) => {
                    setTargetDept(e.target.value);
                    setTargetSupervisor('');
                    setTargetHod('');
                  }}
                  required
                  style={{ width: '100%', padding: '10px' }}
                >
                  <option value="">-- Select Target Department --</option>
                  {departments.map(d => (
                    <option key={d._id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* New Supervisor Selection */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>New Supervisor (Faculty/HOD)</label>
                <select 
                  className="form-input" 
                  value={targetSupervisor} 
                  onChange={(e) => setTargetSupervisor(e.target.value)} 
                  required
                  disabled={!targetDept}
                  style={{ width: '100%', padding: '10px' }}
                >
                  <option value="">{targetDept ? '-- Select Verified Supervisor --' : '-- Select Department First --'}</option>
                  {eligibleSupervisors.map(f => (
                    <option key={f._id} value={f._id}>{f.name} ({f.role === 'HOD' || f.subRole === 'HOD' ? 'HOD' : 'Faculty'})</option>
                  ))}
                </select>
              </div>

              {/* New HOD Selection */}
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 6 }}>New HOD</label>
                <select 
                  className="form-input" 
                  value={targetHod} 
                  onChange={(e) => setTargetHod(e.target.value)} 
                  required
                  disabled={!targetDept}
                  style={{ width: '100%', padding: '10px' }}
                >
                  <option value="">{targetDept ? '-- Select Verified HOD --' : '-- Select Department First --'}</option>
                  {eligibleHods.map(f => (
                    <option key={f._id} value={f._id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn-outline" 
                  onClick={() => setSelectedThesis(null)}
                  style={{ padding: '10px 18px' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={transferLoading}
                  style={{ background: '#7C3AED', padding: '10px 24px', fontWeight: 700, border: 'none', borderRadius: 6, cursor: 'pointer', color: 'white' }}
                >
                  {transferLoading ? 'Transferring...' : 'Execute Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const Sidebar = ({ activeTab, setActiveTab, isVerified }) => {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const items = [
    { key: 'overview', label: user?.role === 'ADMIN' ? 'System Overview' : 'Department Overview', Icon: Home },
    { key: 'profile', label: 'My Profile', Icon: User },
    { key: 'scholars', label: 'Manage Scholars', Icon: GraduationCap },
    ...(user?.role === 'HOD' ? [{ key: 'meetings', label: 'Guidance Meetings', Icon: Calendar }] : []),
    ...(user?.role === 'HOD' ? [{ key: 'coursework_approvals', label: 'Coursework Approvals', Icon: BookOpen }] : []),
    ...(user?.role === 'HOD' || user?.role === 'ADMIN' ? [{ key: 'scholar_search', label: 'Search Scholars', Icon: Search }] : []),
    ...(user?.role === 'HOD' ? [{ key: 'detailed_reports', label: 'Detailed Reports', Icon: FileText }] : []),
    ...(user?.role === 'ADMIN' ? [{ key: 'global_transfers', label: 'Global Transfers', Icon: Layers }] : []),
    { key: 'defaulters', label: 'Defaulter Tracking', Icon: Clock },
    { key: 'requests', label: 'Change Requests', Icon: Edit },
    { key: 'evaluation', label: 'External Evaluation', Icon: FileText },
    { key: 'users', label: 'Manage Users', Icon: Users },
    { key: 'public_config', label: 'Public Portal Config', Icon: Settings },
  ];
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <img src="/hpu_logo.png" alt="HPU Logo" style={{ width: 42, height: 42, objectFit: 'contain' }} />
        </div>
        <h2>Scholar Sync</h2>
      </div>
      <div className="sidebar-nav">
        {items.map(({ key, label, Icon }) => {
          const disabled = !isVerified && key !== 'profile';
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
                opacity: disabled ? 0.45 : 1
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

// ── Meetings Tab Component ──
const MeetingsTab = ({ user }) => {
  const toast = useToast();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState({});

  const fetchMeetings = async () => {
    try {
      const endpoint = user?.role === 'HOD' ? 'dept' : 'faculty';
      const res = await axios.get(`${API}/meetings/${endpoint}`, getAuthHeader());
      
      // Legacy data fix
      const formatted = res.data.map(m => {
        if ((!m.invitedAttendees || m.invitedAttendees.length === 0) && m.attendees && m.attendees.length > 0) {
          m.invitedAttendees = m.attendees;
          if (m.status !== 'APPROVED') {
            m.attendees = [];
          }
        }
        return m;
      });

      setMeetings(formatted);
    } catch (err) {
      toast.error('Failed to load meetings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleRespond = async (meetingId, response) => {
    setBtnLoading(prev => ({ ...prev, [meetingId]: response }));
    try {
      await axios.put(`${API}/meetings/${meetingId}/respond`, { response }, getAuthHeader());
      toast.success(`Meeting request ${response === 'ACCEPT' ? 'accepted' : 'rejected'} successfully.`);
      fetchMeetings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error responding to meeting.');
    } finally {
      setBtnLoading(prev => ({ ...prev, [meetingId]: null }));
    }
  };

  const getStatusStyle = (status) => {
    if (status === 'APPROVED') return { bg: '#ECFDF5', text: '#059669', border: 'rgba(16, 185, 129, 0.2)' };
    if (status === 'REJECTED') return { bg: '#FEF2F2', text: '#DC2626', border: 'rgba(239, 68, 68, 0.2)' };
    return { bg: '#FFFBEB', text: '#D97706', border: 'rgba(245, 158, 11, 0.2)' };
  };

  return (
    <div className="card">
      <div style={{ marginBottom: 20 }}>
        <h3 className="card-title" style={{ margin: 0 }}>Guidance Consultations & Meetings</h3>
        <p style={{ color: 'var(--color-text-secondary, #64748B)', fontSize: '0.85rem', marginTop: 4 }}>
          {user?.role === 'HOD' 
            ? 'Monitor and respond to custom research guidance and consultation meetings proposed by department scholars.'
            : 'Respond to and view custom research guidance and consultation meetings you are invited to.'}
        </p>
      </div>

      {loading ? (
        <div className="premium-preloader-container" style={{ padding: '32px 20px' }}>
          <div className="premium-preloader-spinner" style={{ width: '40px', height: '40px', borderWidth: '3px', marginBottom: '12px' }}></div>
          <div className="premium-preloader-text" style={{ fontSize: '0.85rem' }}>Loading meetings...</div>
        </div>
      ) : meetings.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', color: '#94A3B8' }}>
          <Calendar size={48} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
          <p style={{ margin: 0, fontWeight: 600 }}>No meeting requests found</p>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem' }}>When scholars propose guidance consultation meetings, they will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {meetings.map((meeting) => {
            const statusStyle = getStatusStyle(meeting.status);
            const isInvited = meeting.invitedAttendees?.some(a => (a._id || a) === user._id);
            const hasAccepted = meeting.attendees?.some(a => (a._id || a) === user._id);
            const hasRejected = meeting.rejectedAttendees?.some(r => (r._id || r) === user._id);

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
                        Proposed by: <strong>{meeting.scholarId?.name}</strong> ({meeting.department})
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
                      const acc = meeting.attendees?.some(a => (a._id || a) === member._id);
                      const rej = meeting.rejectedAttendees?.some(r => (r._id || r) === member._id);
                      let memberStatus = 'Pending';
                      let mBg = 'var(--color-bg, #F1F5F9)';
                      let mColor = 'var(--color-text-secondary, #64748B)';
                      if (acc) {
                        memberStatus = 'Accepted';
                        mBg = '#D1FAE5';
                        mColor = '#065F46';
                      } else if (rej) {
                        memberStatus = 'Rejected';
                        mBg = '#FEE2E2';
                        mColor = '#991B1B';
                      }
                      return (
                        <span
                          key={member._id}
                          style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            background: mBg,
                            border: '1px solid var(--color-border, #E2E8F0)',
                            color: mColor,
                            borderRadius: 6,
                            fontWeight: 600
                          }}
                        >
                          {member.name} {member.role === 'HOD' ? '(HOD)' : `(${member.subRole || 'Faculty'})`} ({memberStatus})
                        </span>
                      );
                    })}
                  </div>
                )}

                {isInvited && (
                  <div style={{ display: 'flex', gap: 12, marginTop: 4, alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)' }}>Your Response:</span>
                    
                    <button
                      className="btn-primary"
                      disabled={btnLoading[meeting._id]}
                      onClick={() => handleRespond(meeting._id, 'ACCEPT')}
                      style={{
                        background: hasAccepted ? '#059669' : '#10B981',
                        border: 'none',
                        color: '#ffffff',
                        padding: '6px 12px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        borderRadius: 6,
                        opacity: hasAccepted ? 0.7 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      {hasAccepted ? '✓ You Accepted' : 'Accept'}
                    </button>

                    <button
                      className="btn-outline"
                      disabled={btnLoading[meeting._id]}
                      onClick={() => handleRespond(meeting._id, 'REJECT')}
                      style={{
                        borderColor: hasRejected ? '#991B1B' : '#EF4444',
                        color: hasRejected ? '#991B1B' : '#EF4444',
                        background: 'transparent',
                        padding: '6px 12px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        borderRadius: 6,
                        opacity: hasRejected ? 0.7 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      {hasRejected ? '✗ You Rejected' : 'Reject'}
                    </button>
                  </div>
                )}

                {!isInvited && user?.role === 'HOD' && (
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontStyle: 'italic', marginTop: 4 }}>
                    ℹ️ You are viewing this meeting as HOD (Not invited as attendee).
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Main ──
// ── Main ──
const AdminDashboard = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useTabPersistence('sync_admin_tab', 'overview');
  const [selectedThesisId, setSelectedThesisId] = useState(null);
  const [selectedThesisData, setSelectedThesisData] = useState(null);
  const { allTheses, fetchAllTheses, verifyEnrollment, assignSupervisor, clearCoursework, awardDegree, updateAuditLog, drcApprove, seminarClear, fetchThesisById, reviewMilestone, finalApprove } = useContext(ThesisContext);
  const { user, fetchMe } = useContext(AuthContext);

  const [isOnboardingOpen, setIsOnboardingOpen] = useState(user && !user.profileCompleted);

  const handleTabChange = (tab) => {
    if (tab === 'registration' || tab === 'registrations') {
      setActiveTab('scholars');
    } else if (tab === 'documents') {
      setActiveTab('scholars');
    } else {
      setActiveTab(tab);
    }
  };

  useEffect(() => { 
    fetchAllTheses(); 
    fetchMe();
  }, []);

  // Fetch thesis data when a thesis is selected
  const handleSelectThesis = async (thesisId) => {
    setSelectedThesisId(thesisId);
    try {
      const data = await fetchThesisById(thesisId);
      setSelectedThesisData(data);
    } catch (err) {
      setSelectedThesisId(null);
    }
  };

  const handleClosePanel = () => {
    setSelectedThesisId(null);
    setSelectedThesisData(null);
  };

  const handleReview = async (milestoneId, action, comment) => {
    await reviewMilestone(milestoneId, action, comment);
    const data = await fetchThesisById(selectedThesisId);
    setSelectedThesisData(data);
    fetchAllTheses();
  };

  const handleHODAction = async (fn) => {
    await fn(selectedThesisId);
    const data = await fetchThesisById(selectedThesisId);
    setSelectedThesisData(data);
    fetchAllTheses();
  };

  const handleAction = async (id, action, payload) => {
    if (action === 'verify') await verifyEnrollment(id);
    else if (action === 'assign') await assignSupervisor(id, payload.supervisorId);
    else if (action === 'coursework') await clearCoursework(id);
    else if (action === 'drc') await drcApprove(id);
    else if (action === 'seminar') await seminarClear(id);
    else if (action === 'award') await awardDegree(id);
    else if (action === 'audit') await updateAuditLog(id, payload.action, payload.note);
    await fetchAllTheses();
  };

  const titles = { 
    overview: user?.role === 'ADMIN' ? 'System Overview' : 'Department Overview', 
    scholars: 'Manage Scholars', 
    global_transfers: 'Global Candidate Transfers',
    requests: 'Student Change Requests Desk', 
    lifecycle: 'RAC Reviews', 
    documents: 'Document Review Manager', 
    meetings: 'Guidance Consultations & Meetings',
    users: 'Manage Users', 
    profile: 'My Profile', 
    evaluation: 'External Evaluation', 
    defaulters: 'Progress Report Defaulter Tracking',
    scholar_search: 'Search Scholar Details',
    detailed_reports: 'Detailed Academic Reports',
    public_config: 'Public Portal Config',
    coursework_approvals: 'Coursework Approvals'
  };

  const renderContent = () => {
    if (!user?.isVerified) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: 24 }}>
          <div className="card" style={{ maxWidth: 520, width: '100%', textAlign: 'center', padding: '40px 32px', borderLeft: '8px solid #DC2626', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ width: 64, height: 64, background: '#FEE2E2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <XCircle size={32} color="#DC2626" />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', marginBottom: 12 }}>Account Unverified</h2>
            <p style={{ color: '#4B5563', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 24 }}>
              account is not verified. Please contact HOD of your deaprtment in case of faculty and contact the super admin in case of HOD.
            </p>
            <button 
              onClick={async () => {
                const fresh = await fetchMe();
                if (fresh?.isVerified) {
                  toast.success("Your account has been approved! Reloading dashboard...");
                  window.location.reload();
                } else {
                  toast.warning("Your account is still unverified. Please contact HOD of your department in case of faculty and contact the super admin in case of HOD.");
                }
              }}
              className="btn-primary"
              style={{ background: '#059669', border: 'none', padding: '10px 20px', fontSize: '0.85rem' }}
            >
              🔄 Check Status
            </button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview': return <OverviewPage theses={allTheses} onSelectThesis={handleSelectThesis} user={user} setActiveTab={handleTabChange} />;
      case 'scholars': return <ManageScholars theses={allTheses} onSelectThesis={handleSelectThesis} onAction={handleAction} subRole={user?.role} />;
      case 'coursework_approvals': return <ManageScholars theses={allTheses.filter(t => t.status === 'COURSEWORK' && t.courseworkStatus === 'PENDING_HOD')} onSelectThesis={handleSelectThesis} onAction={handleAction} subRole="HOD" />;
      case 'global_transfers': return <GlobalTransfersTab theses={allTheses} onRefresh={fetchAllTheses} />;
      case 'requests': return <HODChangeRequestsTab user={user} />;
      case 'meetings': return <MeetingsTab user={user} />;
      case 'users': return <ManageUsers />;
      case 'defaulters': return <DefaultersTab />;
      case 'profile': return <ProfileTab />;
      case 'evaluation': return <ExternalEvaluation theses={allTheses} onAuditLog={(id, action, note) => handleAction(id, 'audit', { action, note })} />;
      case 'scholar_search': return <ScholarSearchTab user={user} />;
      case 'detailed_reports': return <DetailedReportsTab user={user} />;
      case 'public_config': return <PublicConfigTab user={user} />;
      default: return <div className="card"><h3 className="card-title">{titles[activeTab]}</h3><p style={{ color: '#6b7280', marginTop: 8 }}>Content coming soon.</p></div>;
    }
  };

  return (
    <div className="app-container">
      <div className="mobile-overlay" onClick={() => document.body.classList.remove('sidebar-mobile-open')} />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isVerified={user?.isVerified} />
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
        
        <Header title={titles[activeTab]} />
        <div className="dashboard-area" style={{ flex: 1 }}>
          <div className="welcome-banner">
            <div><span className="welcome-text">Welcome, {user?.name || 'HOD'}!</span><span className="welcome-subtext"> | {user?.role === 'HOD' ? `${user?.department} HOD Dashboard` : 'System Administration'}</span></div>
            <div className="brand-text">ScholarSync Admin</div>
          </div>
          {renderContent()}
        </div>
      </div>
      {selectedThesisId && selectedThesisData && createPortal(
        <UnifiedScholarModal
          thesis={selectedThesisData.thesis}
          milestones={selectedThesisData.milestones}
          onReview={handleReview}
          onDRC={async () => {
            const data = await fetchThesisById(selectedThesisId);
            setSelectedThesisData(data);
            fetchAllTheses();
          }}
          onSeminar={() => handleHODAction(seminarClear)}
          onFinalApprove={() => handleHODAction(finalApprove)}
          onClearCoursework={() => handleHODAction(clearCoursework)}
          onVerify={() => handleHODAction(verifyEnrollment)}
          onAssign={(supervisorId) => handleHODAction(() => assignSupervisor(selectedThesisId, supervisorId))}

          subRole="HOD"
          onRefresh={async () => {
            const data = await fetchThesisById(selectedThesisId);
            setSelectedThesisData(data);
            fetchAllTheses();
          }}
          onClose={handleClosePanel}
        />,
        document.body
      )}
      <ProfileOnboardingModal 
        isOpen={isOnboardingOpen} 
        onClose={() => setIsOnboardingOpen(false)} 
        onGo={() => { setActiveTab('profile'); setIsOnboardingOpen(false); }} 
      />
    </div>
  );
};

export default AdminDashboard;
