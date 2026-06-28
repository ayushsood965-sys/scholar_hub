import React, { useState, useContext, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Home, FileText, Users, Calendar, User, LogOut, Bell, CheckCircle2, XCircle, Layers, Award, Upload, ShieldCheck, Edit, AlertTriangle, Plus, Settings, Search, BookOpen } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL, API_URL } from '../config';

const API = API_URL;
const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { ThesisContext } from '../context/ThesisContext';
import { useToast } from '../context/ToastContext';
import ProfileOnboardingModal from '../components/ProfileOnboardingModal';
import NotificationPanel from '../components/NotificationPanel';
import { useTabPersistence } from '../hooks/useTabPersistence';
import ThemeToggle from '../components/ThemeToggle';
import UnifiedScholarModal from '../components/UnifiedScholarModal';
import PublicConfigTab from '../components/PublicConfigTab';
import DetailedReportsTab from '../components/DetailedReportsTab';
import ScholarSearchTab from '../components/ScholarSearchTab';
import { useGridControl } from '../hooks/useGridControl';

const Sidebar = ({ activeTab, setActiveTab, subRole, isVerified }) => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const supervisorItems = [
    { key: 'overview', label: 'Dashboard', Icon: Home },
    { key: 'profile', label: 'Profile', Icon: User },
    { key: 'scholars', label: 'My Scholars', Icon: Users },
    { key: 'coursework_approvals', label: 'Coursework Approvals', Icon: BookOpen },
    { key: 'meetings', label: 'Guidance Meetings', Icon: Calendar },
    { key: 'reviews', label: 'Pending Reviews', Icon: FileText },
    { key: 'defaulters', label: 'Defaulter Scholars', Icon: AlertTriangle },
    { key: 'scholar_search', label: 'Search Scholars', Icon: Search },
    { key: 'detailed_reports', label: 'Detailed Reports', Icon: FileText },
    { key: 'public_config', label: 'Public Portal Config', Icon: Settings },
  ];
  const hodItems = [
    { key: 'overview', label: 'Dashboard', Icon: Home },
    { key: 'profile', label: 'Profile', Icon: User },
    { key: 'registrations', label: 'Registration Requests', Icon: ShieldCheck },
    { key: 'coursework_approvals', label: 'Coursework Approvals', Icon: BookOpen },
    { key: 'dept', label: 'Department Scholars', Icon: Users },
    { key: 'meetings', label: 'Guidance Meetings', Icon: Calendar },
    { key: 'requests', label: 'Change Requests', Icon: Edit },
    { key: 'defaulters', label: 'Defaulter Scholars', Icon: AlertTriangle },
    { key: 'scholar_search', label: 'Search Scholars', Icon: Search },
    { key: 'detailed_reports', label: 'Detailed Reports', Icon: FileText },
    { key: 'public_config', label: 'Public Portal Config', Icon: Settings },
  ];
  const items = subRole === 'HOD' ? hodItems : supervisorItems;
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <img src="/hpu_logo.png" alt="HPU Logo" style={{ width: 42, height: 42, objectFit: 'contain' }} />
        </div>
        <h2>Scholar Sync</h2>
        {subRole && <div style={{ textAlign: 'center', fontSize: '0.7rem', background: subRole === 'HOD' ? '#FEF3C7' : '#DBEAFE', color: subRole === 'HOD' ? '#D97706' : '#1D4ED8', borderRadius: 6, padding: '2px 8px', margin: '4px auto', width: 'fit-content' }}>{subRole}</div>}
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

const Header = ({ title, user }) => {
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
            <img src={`${API_BASE_URL}${user.avatarUrl}`} alt="Faculty" className="user-avatar" style={{ objectFit: 'cover' }} />
          ) : (
            <svg viewBox="0 0 100 100" className="user-avatar" style={{ width: 36, height: 36, borderRadius: '50%', background: '#e2e8f0', display: 'block' }}>
              <circle cx="50" cy="35" r="20" fill="#94a3b8" />
              <path d="M15 85c0-13.8 11.2-25 25-25h20c13.8 0 25 11.2 25 25z" fill="#94a3b8" />
            </svg>
          )}
          <div className="user-info"><span className="user-name">{user?.name || 'Faculty'}</span><span className="user-dept">{user?.subRole || 'FACULTY'}</span></div>
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

// ── Faculty Document Evaluation Modal ──
const FacultyDocumentEvaluationModal = ({ doc, onClose, onRefresh }) => {
  const { user } = useContext(AuthContext);
  const isHod = user?.role === 'HOD' || user?.subRole === 'HOD' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const showEvaluate = doc.docType === 'PUBLICATION'
    ? (isHod ? doc.status === 'UNDER_REVIEW_HOD' : doc.status === 'PENDING')
    : (doc.status === 'SUBMITTED' || doc.status === 'PENDING');
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
        await axios.put(`${API_URL}/milestones/${doc._id}/review`, {
          action: action === 'APPROVE' ? 'APPROVE' : 'REVISION',
          comment: commentText.trim()
        }, getAuthHeader());
        toast.success(`Milestone marked: ${action === 'APPROVE' ? 'APPROVED' : 'REVISION REQUIRED'}`);
      } else {
        await axios.put(`${API_URL}/publications/${doc._id}/verify`, {
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
              {showEvaluate ? (
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
                  Status: <span style={{ color: doc.status === 'VERIFIED' ? '#059669' : doc.status === 'UNDER_REVIEW_HOD' ? '#1D4ED8' : '#DC2626' }}>{getStatusDisplay(doc.status).text}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Thesis Detail + Milestone Review Panel ──
const ThesisReviewPanel = ({ thesis, milestones, onReview, onDRC, onSeminar, onFinalApprove, onClearCoursework, onVerify, onAssign, subRole, onClose, onRefresh, selectedEvalDoc, setSelectedEvalDoc }) => {
  const toast = useToast();
  const { user } = useContext(AuthContext);
  const { transferScholar } = useContext(ThesisContext);
  const [remarks, setRemarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [showProfileDetails, setShowProfileDetails] = useState(false);

  // Transfer variables
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [allFaculties, setAllFaculties] = useState([]);

  // Active Research panel variables
  const [activeResearchTab, setActiveResearchTab] = useState('reports');
  const [publications, setPublications] = useState([]);
  const [pubRemarks, setPubRemarks] = useState({});
  const [pubsLoading, setPubsLoading] = useState(false);

  // Assign Report Form variables
  const [showAssignReportForm, setShowAssignReportForm] = useState(false);
  const [newReportTitle, setNewReportTitle] = useState('');
  const [newReportDueDate, setNewReportDueDate] = useState('');
  const [assigningReport, setAssigningReport] = useState(false);

  // DRC variables
  const [drcMeetings, setDrcMeetings] = useState([]);
  const [showDrcSchedule, setShowDrcSchedule] = useState(false);
  const [drcForm, setDrcForm] = useState({ scheduledDate: '', scheduledTime: '', venue: '', committeeMembers: '', agenda: '', isSynopsisApproval: false });
  const [showDrcResult, setShowDrcResult] = useState(false);
  const [selectedDrc, setSelectedDrc] = useState(null);
  const [drcResultForm, setDrcResultForm] = useState({ status: 'APPROVED', remarks: '', scheduledDate: '', scheduledTime: '', venue: '', committeeMembers: '' });
  const [showOfflineDrc, setShowOfflineDrc] = useState(false);
  const [offlineDrcForm, setOfflineDrcForm] = useState({ conductedDate: '', venue: '', committeeMembers: '', remarks: '', status: 'APPROVED', isSynopsisApproval: false });

  // Seminar scheduling variables
  const [showSeminarSchedule, setShowSeminarSchedule] = useState(false);
  const [seminarForm, setSeminarForm] = useState({ scheduledDate: '', scheduledTime: '', venue: '', committeeMembers: '' });

  // Faculty and assignment variables
  const [faculty, setFaculty] = useState([]);
  const [selSupervisor, setSelSupervisor] = useState(thesis.supervisorId?._id || '');

  const fetchPublications = async () => {
    setPubsLoading(true);
    try {
      const res = await axios.get(`${API}/publications/thesis/${thesis._id}`, getAuthHeader());
      setPublications(res.data);
    } catch (err) {
      console.error(err);
    }
    setPubsLoading(false);
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!transferTargetId) return toast.warning('Please select a faculty member to transfer this scholar to.');
    setTransferLoading(true);
    try {
      await transferScholar(thesis._id, transferTargetId);
      toast.success('Scholar transferred successfully!');
      setShowTransferModal(false);
      onClose(); // Close the modal since we lost supervision
      if (onRefresh) await onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to transfer scholar.');
    } finally {
      setTransferLoading(false);
    }
  };

  useEffect(() => {
    if (showTransferModal && thesis?.department) {
      axios.get(`${API}/auth/faculty`, getAuthHeader())
        .then(r => {
          // Filter to only Verified faculties and HODs in the same department, excluding current supervisor
          const eligible = r.data.filter(f => f.isVerified && f.department === thesis.department && f._id !== user._id);
          setAllFaculties(eligible);
        })
        .catch(() => {});
    }
  }, [showTransferModal, thesis?.department, user._id]);

  const handleVerifyPublication = async (pubId, status) => {
    const rText = pubRemarks[pubId]?.trim() || '';
    if (status === 'REJECTED' && !rText) {
      return toast.warning('Remarks are required to reject a publication log.');
    }
    setLoading(true);
    try {
      await axios.put(`${API}/publications/${pubId}/verify`, {
        status,
        remarks: rText
      }, getAuthHeader());
      toast.success(`Publication marked: ${status}`);
      setPubRemarks(prev => ({ ...prev, [pubId]: '' }));
      fetchPublications();
    } catch (err) {
      toast.error('Failed to update publication status.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignReport = async (e) => {
    e.preventDefault();
    if (!newReportTitle.trim()) return toast.warning('Please enter a progress report title.');
    if (!newReportDueDate) return toast.warning('Please choose a due date.');
    setAssigningReport(true);
    try {
      const reportsCount = milestones.filter(m => m.type === '6_MONTH_REPORT').length;
      await axios.post(`${API}/milestones/create`, {
        thesisId: thesis._id,
        type: '6_MONTH_REPORT',
        title: newReportTitle.trim(),
        sequence: reportsCount + 1,
        dueDate: newReportDueDate
      }, getAuthHeader());
      
      toast.success('New 6-Month Progress Report milestone assigned successfully!');
      setShowAssignReportForm(false);
      setNewReportTitle('');
      setNewReportDueDate('');
      if (onRefresh) await onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign new report milestone.');
    } finally {
      setAssigningReport(false);
    }
  };

  useEffect(() => {
    if (thesis.status === 'ACTIVE_RESEARCH') {
      fetchPublications();
    }
  }, [thesis._id, thesis.status]);

  useEffect(() => {
    if (subRole === 'HOD') {
      axios.get(`${API}/auth/faculty`, getAuthHeader())
        .then(r => setFaculty(r.data.filter(f => f.department === thesis.department)))
        .catch(() => {});
    }
  }, [subRole, thesis.department]);

  const fetchDrcMeetings = async () => {
    try {
      const res = await axios.get(`${API}/lifecycle/drc/thesis/${thesis._id}`, getAuthHeader());
      setDrcMeetings(res.data);
    } catch (err) {}
  };

  useEffect(() => {
    fetchDrcMeetings();
  }, [thesis._id]);

  const act = async (fn) => { setLoading(true); try { await fn(); } catch (e) { toast.error(e.response?.data?.message || 'Error'); } finally { setLoading(false); } };

  const handleDrcScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!drcForm.scheduledDate || !drcForm.scheduledTime || !drcForm.venue) {
      return toast.warning('Please fill in Date, Time, and Venue');
    }
    setLoading(true);
    try {
      await axios.post(`${API}/lifecycle/drc/schedule`, { thesisId: thesis._id, ...drcForm }, getAuthHeader());
      toast.success('DRC meeting scheduled successfully!');
      setShowDrcSchedule(false);
      setDrcForm({ scheduledDate: '', scheduledTime: '', venue: '', committeeMembers: '', agenda: '', isSynopsisApproval: false });
      fetchDrcMeetings();
      if (onDRC) await onDRC();
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
      if (drcResultForm.status === 'RESCHEDULE') {
        if (!drcResultForm.scheduledDate || !drcResultForm.scheduledTime || !drcResultForm.venue) {
          toast.warning('Please fill in Date, Time, and Venue for rescheduling');
          setLoading(false);
          return;
        }
        await axios.put(`${API}/lifecycle/drc/${selectedDrc._id}/reschedule`, {
          scheduledDate: drcResultForm.scheduledDate,
          scheduledTime: drcResultForm.scheduledTime,
          venue: drcResultForm.venue,
          committeeMembers: drcResultForm.committeeMembers,
          remarks: drcResultForm.remarks
        }, getAuthHeader());
        toast.success('DRC meeting rescheduled successfully!');
      } else {
        await axios.put(`${API}/lifecycle/drc/${selectedDrc._id}/result`, {
          status: drcResultForm.status,
          remarks: drcResultForm.remarks
        }, getAuthHeader());
        toast.success(`DRC meeting successfully marked as ${drcResultForm.status}!`);
      }
      setShowDrcResult(false);
      setSelectedDrc(null);
      setDrcResultForm({ status: 'APPROVED', remarks: '', scheduledDate: '', scheduledTime: '', venue: '', committeeMembers: '' });
      fetchDrcMeetings();
      if (onDRC) await onDRC();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process DRC request');
    } finally {
      setLoading(false);
    }
  };

  const handleOfflineDrcSubmit = async (e) => {
    e.preventDefault();
    if (!offlineDrcForm.remarks) {
      return toast.warning('Please enter Remarks / MoM');
    }
    setLoading(true);
    try {
      await axios.post(`${API}/lifecycle/drc/offline`, {
        thesisId: thesis._id,
        conductedDate: offlineDrcForm.conductedDate || new Date(),
        venue: offlineDrcForm.venue || 'Offline Department Room',
        committeeMembers: offlineDrcForm.committeeMembers || 'Department Board',
        remarks: offlineDrcForm.remarks,
        status: offlineDrcForm.status,
        isSynopsisApproval: offlineDrcForm.isSynopsisApproval
      }, getAuthHeader());
      toast.success(`Offline DRC Outcome successfully recorded as ${offlineDrcForm.status}!`);
      setShowOfflineDrc(false);
      setOfflineDrcForm({ conductedDate: '', venue: '', committeeMembers: '', remarks: '', status: 'APPROVED', isSynopsisApproval: false });
      fetchDrcMeetings();
      if (onDRC) await onDRC();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record offline DRC');
    } finally {
      setLoading(false);
    }
  };

  const handleSeminarScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!seminarForm.scheduledDate || !seminarForm.scheduledTime || !seminarForm.venue) {
      return toast.warning('Please fill in Date, Time, and Venue');
    }
    setLoading(true);
    try {
      if (onScheduleSeminar) {
        await onScheduleSeminar(seminarForm);
        toast.success('Pre-Submission Seminar scheduled successfully!');
        setShowSeminarSchedule(false);
        setSeminarForm({ scheduledDate: '', scheduledTime: '', venue: '', committeeMembers: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule seminar');
    } finally {
      setLoading(false);
    }
  };

  const synopsisMilestone = milestones.find(m => m.type === 'SYNOPSIS');
  const finalSubMilestone = milestones.find(m => m.type === 'FINAL_SUBMISSION');
  const isSynopsisPendingUpload = thesis.status === 'SYNOPSIS_PENDING' && (!synopsisMilestone || synopsisMilestone.status === 'PENDING');
  const isFinalPendingUpload = thesis.status === 'PRE_SUBMISSION' && (!finalSubMilestone || finalSubMilestone.status === 'PENDING');
  const pendingMilestones = milestones.filter(m => m.status === 'SUBMITTED' || m.status === 'REVISION_REQUIRED');
  const showProgressTabs = thesis.status !== 'REGISTRATION_PENDING' && thesis.status !== 'COURSEWORK';
  const corePendingMilestones = milestones.filter(m => (m.type === 'SYNOPSIS' || m.type === 'FINAL_SUBMISSION' || m.type === 'PRE_SUBMISSION') && (m.status === 'SUBMITTED' || m.status === 'REVISION_REQUIRED'));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: 20 }}>
      <div style={{
        background: 'var(--color-surface, #ffffff)',
        color: 'var(--color-text, #1f2937)',
        borderRadius: 16,
        padding: '32px 32px 24px 32px',
        width: '100%',
        maxWidth: 800,
        height: '680px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, flexShrink: 0, alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--color-text, #1f2937)', margin: 0 }}>{thesis.scholarId?.name} — {thesis.title?.substring(0, 50)}</h3>
          
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {/* Show Transfer button only if current user is the supervisor and thesis is not submitted/awarded */}
            {thesis.supervisorId?._id === user._id && !['SUBMITTED', 'AWARDED'].includes(thesis.status) && (
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
                  {allFaculties.map(f => (
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
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }} className="custom-scrollbar">

          {/* Collapsible Scholar Profile & Academic Profile */}
          <div style={{
            background: 'var(--color-surface, #ffffff)',
            border: '1px solid var(--color-border, #E2E8F0)',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
          }}>
            <div 
              onClick={() => setShowProfileDetails(!showProfileDetails)}
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                cursor: 'pointer',
                fontWeight: 700,
                color: '#1E293B',
                fontSize: '0.95rem'
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                📁 Scholar Registration & Academic Profile
                {thesis.scholarId?.profileCompleted ? (
                  <span style={{ fontSize: '0.72rem', background: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>Profile Completed</span>
                ) : (
                  <span style={{ fontSize: '0.72rem', background: '#FEE2E2', color: '#991B1B', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>Profile Incomplete</span>
                )}
              </span>
              <span style={{ fontSize: '0.9rem', color: '#64748B' }}>
                {showProfileDetails ? '▲ Collapse' : '▼ Expand Profile Details'}
              </span>
            </div>

            {showProfileDetails && (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                {/* General & ERP Grid */}
                <div>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Personal Details</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', fontSize: '0.8rem', marginBottom: '20px' }}>
                    <div><strong>Email/Username:</strong> <span style={{ color: '#475569' }}>{thesis.scholarId?.username || 'N/A'}</span></div>
                    <div><strong>Mobile:</strong> <span style={{ color: '#475569' }}>{thesis.scholarId?.profile?.phoneNumber || 'N/A'}</span></div>
                    <div><strong>Date of Birth:</strong> <span style={{ color: '#475569' }}>{thesis.scholarId?.profile?.dob ? new Date(thesis.scholarId.profile.dob).toLocaleDateString() : 'N/A'}</span></div>
                    <div><strong>Gender:</strong> <span style={{ color: '#475569' }}>{thesis.scholarId?.profile?.gender || 'N/A'}</span></div>
                    <div><strong>Social Category:</strong> <span style={{ color: '#475569' }}>{thesis.scholarId?.profile?.category || 'N/A'}</span></div>
                    <div><strong>Nationality:</strong> <span style={{ color: '#475569' }}>{thesis.scholarId?.profile?.nationality || 'N/A'}</span></div>
                    <div><strong>Father's Name:</strong> <span style={{ color: '#475569' }}>{thesis.scholarId?.profile?.fatherName || 'N/A'}</span></div>
                    <div><strong>Mother's Name:</strong> <span style={{ color: '#475569' }}>{thesis.scholarId?.profile?.motherName || 'N/A'}</span></div>
                    <div style={{ gridColumn: 'span 2' }}><strong>Address:</strong> <span style={{ color: '#475569' }}>{thesis.scholarId?.profile?.address || 'N/A'}</span></div>
                  </div>

                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', borderTop: '1px solid #F1F5F9', paddingTop: '15px' }}>Thesis & Research Details</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', fontSize: '0.8rem' }}>
                    <div><strong>SH no:</strong> <span style={{ color: '#059669', fontWeight: 700 }}>{thesis.scholarId?.profile?.shNo || 'N/A'}</span></div>
                    <div><strong>University Enrollment No:</strong> <span style={{ color: '#475569', fontWeight: 600 }}>{thesis.scholarId?.profile?.enrollmentNumber || thesis.enrollmentNumber || 'N/A'}</span></div>
                    <div><strong>Department:</strong> <span style={{ color: '#475569' }}>{thesis.scholarId?.department || thesis.department || 'N/A'}</span></div>
                    <div><strong>Admission Date:</strong> <span style={{ color: '#475569' }}>{thesis.scholarId?.profile?.admissionDate ? new Date(thesis.scholarId.profile.admissionDate).toLocaleDateString() : 'N/A'}</span></div>
                    <div><strong>Mode of Ph.D.:</strong> <span style={{ color: '#475569', fontWeight: 600 }}>{thesis.scholarId?.profile?.phdMode || 'N/A'}</span></div>
                    <div><strong>Specialization:</strong> <span style={{ color: '#475569' }}>{thesis.scholarId?.profile?.specialization || 'N/A'}</span></div>
                    <div><strong>Research Interest:</strong> <span style={{ color: '#475569' }}>{thesis.scholarId?.profile?.areaOfInterest || 'N/A'}</span></div>
                    <div style={{ gridColumn: 'span 2' }}><strong>Thesis Title:</strong> <span style={{ color: '#0F172A', fontWeight: 700 }}>{thesis.scholarId?.profile?.thesisTitle || thesis.title || 'N/A'}</span></div>
                    <div style={{ gridColumn: 'span 2' }}><strong>Thesis Summary / Abstract:</strong> <span style={{ color: '#475569', display: 'block', whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>{thesis.scholarId?.profile?.thesisSummary || thesis.abstract || 'N/A'}</span></div>
                    <div style={{ gridColumn: 'span 2' }}><strong>Keywords:</strong> <span style={{ color: '#475569' }}>{thesis.scholarId?.profile?.thesisKeywords || thesis.keywords || 'N/A'}</span></div>
                  </div>
                </div>

                {/* Qualifications */}
                <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>Educational Background & Certifications</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Class 10 */}
                    {thesis.scholarId?.profile?.qualifications?.class10 && (
                      <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.78rem' }}>
                        <div style={{ fontWeight: 700, color: '#1E293B', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Class 10th Standard</span>
                          {thesis.scholarId.profile.qualifications.class10.certificateUrl ? (
                            <a href={`${API_BASE_URL}${thesis.scholarId.profile.qualifications.class10.certificateUrl}`} target="_blank" rel="noreferrer" style={{ color: '#10B981', fontWeight: 600 }}>📄 View Certificate</a>
                          ) : (
                            <span style={{ color: '#94A3B8' }}>Pending Upload</span>
                          )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                          <div><strong>Roll No:</strong> {thesis.scholarId.profile.qualifications.class10.rollNo || 'N/A'}</div>
                          <div><strong>Board:</strong> {thesis.scholarId.profile.qualifications.class10.board || 'N/A'}</div>
                          <div><strong>School:</strong> {thesis.scholarId.profile.qualifications.class10.school || 'N/A'}</div>
                          <div><strong>Marks:</strong> {thesis.scholarId.profile.qualifications.class10.marksObtained}/{thesis.scholarId.profile.qualifications.class10.totalMarks || 'N/A'}</div>
                          <div><strong>Percentage:</strong> {thesis.scholarId.profile.qualifications.class10.percentage}%</div>
                        </div>
                      </div>
                    )}

                    {/* Class 12 */}
                    {thesis.scholarId?.profile?.qualifications?.class12 && (
                      <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.78rem' }}>
                        <div style={{ fontWeight: 700, color: '#1E293B', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Class 12th Standard</span>
                          {thesis.scholarId.profile.qualifications.class12.certificateUrl ? (
                            <a href={`${API_BASE_URL}${thesis.scholarId.profile.qualifications.class12.certificateUrl}`} target="_blank" rel="noreferrer" style={{ color: '#10B981', fontWeight: 600 }}>📄 View Certificate</a>
                          ) : (
                            <span style={{ color: '#94A3B8' }}>Pending Upload</span>
                          )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                          <div><strong>Roll No:</strong> {thesis.scholarId.profile.qualifications.class12.rollNo || 'N/A'}</div>
                          <div><strong>Board:</strong> {thesis.scholarId.profile.qualifications.class12.board || 'N/A'}</div>
                          <div><strong>School:</strong> {thesis.scholarId.profile.qualifications.class12.school || 'N/A'}</div>
                          <div><strong>Marks:</strong> {thesis.scholarId.profile.qualifications.class12.marksObtained}/{thesis.scholarId.profile.qualifications.class12.totalMarks || 'N/A'}</div>
                          <div><strong>Percentage:</strong> {thesis.scholarId.profile.qualifications.class12.percentage}%</div>
                        </div>
                      </div>
                    )}

                    {/* Graduation */}
                    {thesis.scholarId?.profile?.qualifications?.graduation && (
                      <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.78rem' }}>
                        <div style={{ fontWeight: 700, color: '#1E293B', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Graduation Details</span>
                          {thesis.scholarId.profile.qualifications.graduation.certificateUrl ? (
                            <a href={`${API_BASE_URL}${thesis.scholarId.profile.qualifications.graduation.certificateUrl}`} target="_blank" rel="noreferrer" style={{ color: '#10B981', fontWeight: 600 }}>📄 View Certificate</a>
                          ) : (
                            <span style={{ color: '#94A3B8' }}>Pending Upload</span>
                          )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                          <div><strong>Roll No:</strong> {thesis.scholarId.profile.qualifications.graduation.rollNo || 'N/A'}</div>
                          <div><strong>University:</strong> {thesis.scholarId.profile.qualifications.graduation.board || 'N/A'}</div>
                          <div><strong>College:</strong> {thesis.scholarId.profile.qualifications.graduation.school || 'N/A'}</div>
                          <div><strong>Marks:</strong> {thesis.scholarId.profile.qualifications.graduation.marksObtained}/{thesis.scholarId.profile.qualifications.graduation.totalMarks || 'N/A'}</div>
                          <div><strong>Percentage:</strong> {thesis.scholarId.profile.qualifications.graduation.percentage}%</div>
                        </div>
                      </div>
                    )}

                    {/* Post Graduation */}
                    {thesis.scholarId?.profile?.qualifications?.postGraduation && (
                      <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.78rem' }}>
                        <div style={{ fontWeight: 700, color: '#1E293B', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Post Graduation Details</span>
                          {thesis.scholarId.profile.qualifications.postGraduation.certificateUrl ? (
                            <a href={`${API_BASE_URL}${thesis.scholarId.profile.qualifications.postGraduation.certificateUrl}`} target="_blank" rel="noreferrer" style={{ color: '#10B981', fontWeight: 600 }}>📄 View Certificate</a>
                          ) : (
                            <span style={{ color: '#94A3B8' }}>Pending Upload</span>
                          )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                          <div><strong>Roll No:</strong> {thesis.scholarId.profile.qualifications.postGraduation.rollNo || 'N/A'}</div>
                          <div><strong>University:</strong> {thesis.scholarId.profile.qualifications.postGraduation.board || 'N/A'}</div>
                          <div><strong>College:</strong> {thesis.scholarId.profile.qualifications.postGraduation.school || 'N/A'}</div>
                          <div><strong>Marks:</strong> {thesis.scholarId.profile.qualifications.postGraduation.marksObtained}/{thesis.scholarId.profile.qualifications.postGraduation.totalMarks || 'N/A'}</div>
                          <div><strong>Percentage:</strong> {thesis.scholarId.profile.qualifications.postGraduation.percentage}%</div>
                        </div>
                      </div>
                    )}
                    {/* M.Phil Qualification */}
                    {thesis.scholarId?.profile?.qualifications?.mphil && thesis.scholarId.profile.qualifications.mphil.done === true && (
                      <div style={{ background: '#F8FAF5', padding: '10px', borderRadius: '8px', border: '1px solid #D7F3A0', fontSize: '0.78rem' }}>
                        <div style={{ fontWeight: 700, color: '#4D7C0F', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                          <span>M.Phil Qualification</span>
                          {thesis.scholarId.profile.qualifications.mphil.certificateUrl ? (
                            <a href={`${API_BASE_URL}${thesis.scholarId.profile.qualifications.mphil.certificateUrl}`} target="_blank" rel="noreferrer" style={{ color: '#65A30D', fontWeight: 600 }}>📄 M.Phil Certificate</a>
                          ) : (
                            <span style={{ color: '#94A3B8' }}>Pending Proof</span>
                          )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                          <div><strong>University:</strong> {thesis.scholarId.profile.qualifications.mphil.university || 'N/A'}</div>
                          <div><strong>Passing Year:</strong> {thesis.scholarId.profile.qualifications.mphil.passingYear || 'N/A'}</div>
                          <div><strong>Marks:</strong> {thesis.scholarId.profile.qualifications.mphil.marksObtained}/{thesis.scholarId.profile.qualifications.mphil.totalMarks || 'N/A'} ({thesis.scholarId.profile.qualifications.mphil.percentage}%)</div>
                        </div>
                      </div>
                    )}

                    {/* NET JRF */}
                    {thesis.scholarId?.profile?.qualifications?.netJrf && thesis.scholarId.profile.qualifications.netJrf.qualified !== 'No' && (
                      <div style={{ background: '#ECFDF5', padding: '10px', borderRadius: '8px', border: '1px solid #A7F3D0', fontSize: '0.78rem' }}>
                        <div style={{ fontWeight: 700, color: '#065F46', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                          <span>NET / JRF Qualified</span>
                          {thesis.scholarId.profile.qualifications.netJrf.certificateUrl ? (
                            <a href={`${API_BASE_URL}${thesis.scholarId.profile.qualifications.netJrf.certificateUrl}`} target="_blank" rel="noreferrer" style={{ color: '#059669', fontWeight: 600 }}>📄 View NET-JRF Certificate</a>
                          ) : (
                            <span style={{ color: '#047857', opacity: 0.6 }}>Pending Certificate Upload</span>
                          )}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                          <div><strong>Qualified Status:</strong> {thesis.scholarId.profile.qualifications.netJrf.qualified || 'N/A'}</div>
                          <div><strong>Cert No:</strong> {thesis.scholarId.profile.qualifications.netJrf.certificateNo || 'N/A'}</div>
                          <div><strong>Roll No:</strong> {thesis.scholarId.profile.qualifications.netJrf.rollNo || 'N/A'}</div>
                          <div><strong>Rank:</strong> {thesis.scholarId.profile.qualifications.netJrf.rank || 'N/A'}</div>
                          <div><strong>Score:</strong> {thesis.scholarId.profile.qualifications.netJrf.score || 'N/A'}</div>
                          <div><strong>Issue Date:</strong> {thesis.scholarId.profile.qualifications.netJrf.issueDate ? new Date(thesis.scholarId.profile.qualifications.netJrf.issueDate).toLocaleDateString() : 'N/A'}</div>
                        </div>
                      </div>
                    )}
                    {thesis.scholarId?.profile?.qualifications?.fellowships?.length > 0 && (
                      <div style={{ padding: '12px', fontSize: '0.78rem', background: '#F0F9FF', borderColor: '#BAE6FD', border: '1px solid #BAE6FD', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 700, color: '#0369A1', marginBottom: 6 }}>National & International Fellowships</div>
                        {thesis.scholarId.profile.qualifications.fellowships.map((f, i) => (
                          <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, paddingBottom: 8, marginBottom: 8, borderBottom: i !== thesis.scholarId.profile.qualifications.fellowships.length - 1 ? '1px solid #E0F2FE' : 'none' }}>
                            <div><strong>Type:</strong> {f.type === 'Other' ? f.otherType : f.type || 'N/A'}</div>
                            <div><strong>Awarding Body:</strong> {f.awardingBody || 'N/A'}</div>
                            <div><strong>Award Date:</strong> {f.awardDate || 'N/A'}</div>
                            <div><strong>Ref/ID:</strong> {f.referenceNo || 'N/A'}</div>
                            <div><strong>Duration:</strong> {f.duration || 'N/A'}</div>
                            <div><strong>Amount:</strong> {f.amount || 'N/A'}</div>
                            {f.certificateUrl && (
                              <div style={{ gridColumn: 'span 3', marginTop: 4 }}>
                                <a href={`${API_BASE_URL}${f.certificateUrl}`} target="_blank" rel="noreferrer" style={{ color: '#0284C7', fontWeight: 600 }}>📄 View Fellowship Proof</a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {thesis.scholarId?.profile?.qualifications?.otherQuals?.length > 0 && (
                      <div style={{ background: '#F8FAFC', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.78rem' }}>
                        <div style={{ fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>Other Qualifications</div>
                        {thesis.scholarId.profile.qualifications.otherQuals.map((o, idx) => (
                          <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', paddingBottom: '6px', marginBottom: '6px', borderBottom: idx !== thesis.scholarId.profile.qualifications.otherQuals.length - 1 ? '1px solid #E2E8F0' : 'none' }}>
                            <div><strong>Type:</strong> {o.type === 'Other' ? o.otherType : o.type || 'N/A'}</div>
                            <div><strong>Roll:</strong> {o.rollNo || 'N/A'}</div>
                            <div><strong>Board/Univ:</strong> {o.board || 'N/A'}</div>
                            <div><strong>School/Inst:</strong> {o.school || 'N/A'}</div>
                            <div><strong>Marks:</strong> {o.marksObtained}/{o.totalMarks || 'N/A'} ({o.percentage}%)</div>
                            {o.certificateUrl && (
                              <div style={{ gridColumn: 'span 3', marginTop: '2px' }}>
                                <a href={`${API_BASE_URL}${o.certificateUrl}`} target="_blank" rel="noreferrer" style={{ color: '#2563EB', fontWeight: 600 }}>📄 View Proof</a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

        {isSynopsisPendingUpload && (
          <div style={{
            background: '#FFF9E6',
            borderLeft: '4px solid #F59E0B',
            color: '#B45309',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚠️ Synopsis upload is currently pending at the candidate's end. No document has been submitted yet.</span>
          </div>
        )}
        {isFinalPendingUpload && (
          <div style={{
            background: '#FFF9E6',
            borderLeft: '4px solid #F59E0B',
            color: '#B45309',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>⚠️ Final thesis digital upload is currently pending at the candidate's end. No document has been submitted yet.</span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {(() => {
            const synopsisMilestone = milestones.find(m => m.type === 'SYNOPSIS');
            const finalSubMilestone = milestones.find(m => m.type === 'FINAL_SUBMISSION');
            const preSubMilestone = milestones.find(m => m.type === 'PRE_SUBMISSION');
            const badge = resolveDetailedStatus(thesis.status, synopsisMilestone?.status, finalSubMilestone?.status, subRole, preSubMilestone?.status, thesis.preSubmissionSeminar?.status);
            return (
              <span style={{ padding: '4px 12px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600, background: badge.bg, color: badge.color }}>
                {badge.text}
              </span>
            );
          })()}
          {subRole === 'HOD' && (!thesis.enrollmentVerified || thesis.status === 'REGISTRATION_PENDING') && (
            <button className="btn-primary" onClick={() => act(onVerify)} disabled={loading} style={{ padding: '5px 14px', fontSize: '0.85rem', background: '#059669' }}>✓ Verify Enrollment & Move to Coursework</button>
          )}
          {subRole === 'HOD' && thesis.status !== 'AWARDED' && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select className="form-input" style={{ padding: '5px 10px', height: 'auto', fontSize: '0.85rem' }} value={selSupervisor} onChange={e => setSelSupervisor(e.target.value)} disabled={!!thesis.supervisorId}>
                <option value="">Assign Department Supervisor...</option>
                {faculty.filter(f => f.department === thesis.department).map(f => <option key={f._id} value={f._id}>{f.name} ({(f.role === 'HOD' || f.subRole === 'HOD') ? 'HOD' : (f.designation || f.subRole || 'Supervisor')})</option>)}
              </select>
              <button className="btn-primary" onClick={() => act(() => onAssign(selSupervisor))} disabled={!selSupervisor || !!thesis.supervisorId || loading} style={{ padding: '5px 14px', fontSize: '0.85rem', opacity: thesis.supervisorId ? 0.6 : 1, cursor: thesis.supervisorId ? 'not-allowed' : 'pointer' }}>
                {thesis.supervisorId ? '✓ Supervisor Assigned' : 'Assign'}
              </button>
            </div>
          )}
          {thesis.status === 'COURSEWORK' && (
            <button className="btn-primary" onClick={() => act(onClearCoursework)} disabled={loading} style={{ padding: '5px 14px', fontSize: '0.85rem', background: '#3B82F6' }}>✓ Clear Coursework & Unlock Synopsis Upload</button>
          )}
        </div>
        {thesis.status === 'SYNOPSIS_PENDING' && (() => {
            const synopsisMilestone = milestones.find(m => m.type === 'SYNOPSIS');
            const mStatus = synopsisMilestone?.status || 'PENDING';
            
            let bg = '#FFF5F5';
            let border = '#FEB2B2';
            let color = '#C53030';
            let text = "⚠️ Synopsis upload is currently pending at the candidate's end. DRC Scheduling is locked.";

            if (mStatus === 'SUBMITTED') {
              text = '⚠️ Synopsis has been submitted by candidate. Awaiting supervisor provisional approval. DRC Scheduling is locked.';
            } else if (mStatus === 'PENDING_HOD') {
              bg = '#FFFBEB';
              border = '#FDE68A';
              color = '#B45309';
              text = '⏳ Synopsis has been provisionally approved by supervisor. Awaiting HOD final approval. DRC Scheduling remains locked.';
            } else if (mStatus === 'REVISION_REQUIRED') {
              text = '⚠️ Synopsis revision required. Awaiting updated draft from candidate. DRC Scheduling is locked.';
            } else if (mStatus === 'APPROVED') {
              bg = '#F0FDF4';
              border = '#BBF7D0';
              color = '#15803D';
              text = '✅ Synopsis Approved by HOD! Ready for DRC Meeting Scheduling & Review.';
            }

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', marginTop: 8 }}>
                {mStatus !== 'APPROVED' ? (
                  <div style={{ background: bg, border: `1px solid ${border}`, color: color, padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600 }}>
                    {text}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                    <div style={{ background: bg, border: `1px solid ${border}`, color: color, padding: '10px 14px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600 }}>
                      {text}
                    </div>

                    {/* DRC Meetings List */}
                    <div style={{ background: 'var(--color-bg, #f8fafc)', border: '1px solid var(--color-border, #e2e8f0)', padding: 14, borderRadius: 10, width: '100%' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text, #334155)', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>📆 Departmental Research Committee (DRC) Status</span>
                        {subRole === 'HOD' && !showDrcSchedule && !showOfflineDrc && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button type="button" className="btn-primary" onClick={() => {
                              setShowDrcSchedule(true);
                              setShowOfflineDrc(false);
                              setDrcForm({
                                scheduledDate: '',
                                scheduledTime: '',
                                venue: '',
                                committeeMembers: '',
                                agenda: '',
                                isSynopsisApproval: showSynopsisApprovalOption
                              });
                            }} style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#3B82F6' }}>+ Schedule Meeting</button>
                            <button type="button" className="btn-primary" onClick={() => {
                              setShowOfflineDrc(true);
                              setShowDrcSchedule(false);
                              setOfflineDrcForm({
                                conductedDate: '',
                                venue: '',
                                committeeMembers: '',
                                remarks: '',
                                status: 'APPROVED',
                                isSynopsisApproval: showSynopsisApprovalOption
                              });
                            }} style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#059669' }}>+ Record Offline DRC</button>
                          </div>
                        )}
                      </div>

                      {drcMeetings.length === 0 ? (
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted, #64748b)', fontStyle: 'italic' }}>No DRC meeting scheduled yet.</div>
                      ) : (
                        drcMeetings.map((drc, idx) => (
                          <div key={drc._id} style={{ borderBottom: idx < drcMeetings.length - 1 ? '1px solid var(--color-border, #E2E8F0)' : 'none', paddingBottom: idx < drcMeetings.length - 1 ? 10 : 0, paddingTop: idx > 0 ? 10 : 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text, #0F172A)' }}>{drc.title || 'DRC Session'}</span>
                              <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700, background: drc.status === 'APPROVED' ? '#D1FAE5' : drc.status === 'REVISION_REQUIRED' ? '#FEE2E2' : '#FEF3C7', color: drc.status === 'APPROVED' ? '#065F46' : drc.status === 'REVISION_REQUIRED' ? '#991B1B' : '#92400E' }}>
                                {drc.status === 'APPROVED' ? 'Satisfactory' : drc.status === 'REVISION_REQUIRED' ? 'Unsatisfactory' : drc.status}
                              </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: '0.78rem', color: 'var(--color-text-secondary, #475569)' }}>
                              <div><strong>Date:</strong> {new Date(drc.scheduledDate).toLocaleDateString()}</div>
                              <div><strong>Time:</strong> {drc.scheduledTime}</div>
                              <div style={{ gridColumn: 'span 2' }}><strong>Venue:</strong> {drc.venue}</div>
                              {drc.committeeMembers && <div style={{ gridColumn: 'span 2' }}><strong>Committee:</strong> {drc.committeeMembers}</div>}
                              {drc.agenda && <div style={{ gridColumn: 'span 2' }}><strong>Agenda:</strong> {drc.agenda}</div>}
                              {drc.remarks && <div style={{ gridColumn: 'span 2', background: '#FFFBEB', padding: 6, borderRadius: 6, color: '#92400E', borderLeft: '3px solid #F59E0B', marginTop: 4 }}><strong>Remarks:</strong> {drc.remarks}</div>}
                            </div>

                            {subRole === 'HOD' && drc.status === 'SCHEDULED' && !showDrcResult && (
                              <button type="button" className="btn-primary" onClick={() => { setSelectedDrc(drc); setShowDrcResult(true); }} style={{ marginTop: 10, padding: '5px 12px', fontSize: '0.75rem', background: '#059669' }}>📝 Record DRC Outcome</button>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* DRC Schedule Form */}
                    {showDrcSchedule && (
                      <form onSubmit={handleDrcScheduleSubmit} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 16, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1E293B' }}>Schedule DRC Meeting</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <div>
                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Meeting Date</label>
                            <input type="date" className="form-input" style={{ width: '100%', padding: '6px' }} value={drcForm.scheduledDate} onChange={e => setDrcForm({...drcForm, scheduledDate: e.target.value})} required />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Meeting Time</label>
                            <input type="text" className="form-input" style={{ width: '100%', padding: '6px' }} placeholder="e.g. 11:00 AM" value={drcForm.scheduledTime} onChange={e => setDrcForm({...drcForm, scheduledTime: e.target.value})} required />
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <div>
                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Venue</label>
                            <input type="text" className="form-input" style={{ width: '100%', padding: '6px' }} placeholder="e.g. Committee Room 1" value={drcForm.venue} onChange={e => setDrcForm({...drcForm, venue: e.target.value})} required />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Purpose</label>
                            <select className="form-input" style={{ width: '100%', padding: '6px' }} value={drcForm.isSynopsisApproval ? "Synopsis" : "General"} onChange={e => setDrcForm({...drcForm, isSynopsisApproval: e.target.value === "Synopsis"})}>
                              <option value="General">General DRC</option>
                              {showSynopsisApprovalOption && <option value="Synopsis">Synopsis approval</option>}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Committee Panel Members</label>
                          <input type="text" className="form-input" style={{ width: '100%', padding: '6px' }} placeholder="e.g. Dr. A. Sen (HOD), Prof. M. Roy" value={drcForm.committeeMembers} onChange={e => setDrcForm({...drcForm, committeeMembers: e.target.value})} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Agenda / Focus Areas</label>
                          <textarea className="form-input" style={{ width: '100%', padding: '6px', resize: 'vertical' }} rows="2" placeholder="e.g. Synopsis evaluation and research feasibility review." value={drcForm.agenda} onChange={e => setDrcForm({...drcForm, agenda: e.target.value})} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button type="button" className="btn-outline" onClick={() => setShowDrcSchedule(false)} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Cancel</button>
                          <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '4px 14px', fontSize: '0.75rem', background: '#3B82F6' }}>Schedule Event</button>
                        </div>
                      </form>
                    )}

                    {/* Offline DRC Form */}
                    {showOfflineDrc && (
                      <form onSubmit={handleOfflineDrcSubmit} style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: 16, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#065F46' }}>Record Offline Conducted DRC Outcome</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <div>
                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#047857', display: 'block', marginBottom: 4 }}>Date Conducted</label>
                            <input type="date" className="form-input" style={{ width: '100%', padding: '6px' }} value={offlineDrcForm.conductedDate} onChange={e => setOfflineDrcForm({...offlineDrcForm, conductedDate: e.target.value})} required />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#047857', display: 'block', marginBottom: 4 }}>Committee Decision</label>
                            <select className="form-input" style={{ width: '100%', padding: '6px' }} value={offlineDrcForm.status} onChange={e => setOfflineDrcForm({...offlineDrcForm, status: e.target.value})} required>
                              <option value="APPROVED">Satisfactory</option>
                              <option value="REVISION_REQUIRED">Unsatisfactory</option>
                            </select>
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <div>
                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#047857', display: 'block', marginBottom: 4 }}>Venue</label>
                            <input type="text" className="form-input" style={{ width: '100%', padding: '6px' }} placeholder="e.g. Offline Department Office" value={offlineDrcForm.venue} onChange={e => setOfflineDrcForm({...offlineDrcForm, venue: e.target.value})} required />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#047857', display: 'block', marginBottom: 4 }}>Purpose</label>
                            <select className="form-input" style={{ width: '100%', padding: '6px' }} value={offlineDrcForm.isSynopsisApproval ? "Synopsis" : "General"} onChange={e => setOfflineDrcForm({...offlineDrcForm, isSynopsisApproval: e.target.value === "Synopsis"})}>
                              <option value="General">General DRC</option>
                              {showSynopsisApprovalOption && <option value="Synopsis">Synopsis approval</option>}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#047857', display: 'block', marginBottom: 4 }}>Committee Panel Members</label>
                          <input type="text" className="form-input" style={{ width: '100%', padding: '6px' }} placeholder="e.g. Dr. A. Sen (HOD), Prof. M. Roy" value={offlineDrcForm.committeeMembers} onChange={e => setOfflineDrcForm({...offlineDrcForm, committeeMembers: e.target.value})} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#047857', display: 'block', marginBottom: 4 }}>MoM / Committee Remarks</label>
                          <textarea className="form-input" style={{ width: '100%', padding: '6px', resize: 'vertical' }} rows="3" placeholder="Enter offline comments or required modifications..." value={offlineDrcForm.remarks} onChange={e => setOfflineDrcForm({...offlineDrcForm, remarks: e.target.value})} required />
                        </div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button type="button" className="btn-outline" onClick={() => setShowOfflineDrc(false)} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Cancel</button>
                          <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '4px 14px', fontSize: '0.75rem', background: '#059669' }}>Submit Offline Result</button>
                        </div>
                      </form>
                    )}

                    {/* DRC Result Grading Form */}
                    {showDrcResult && selectedDrc && (
                      <form onSubmit={handleDrcResultSubmit} style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: 16, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#065F46' }}>Record DRC Meeting Outcome</div>
                        <div>
                          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#047857', display: 'block', marginBottom: 4 }}>Committee Decision</label>
                          <select className="form-input" style={{ width: '100%', padding: '6px' }} value={drcResultForm.status} onChange={e => setDrcResultForm({...drcResultForm, status: e.target.value})} required>
                            <option value="APPROVED">Satisfactory</option>
                            <option value="REVISION_REQUIRED">Unsatisfactory</option>
                            <option value="RESCHEDULE">RESCHEDULE MEETING (Select New Date/Time/Venue)</option>
                          </select>
                        </div>
                        {drcResultForm.status === 'RESCHEDULE' && (
                          <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                              <div>
                                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#047857', display: 'block', marginBottom: 4 }}>New Date</label>
                                <input type="date" className="form-input" style={{ width: '100%', padding: '6px' }} value={drcResultForm.scheduledDate} onChange={e => setDrcResultForm({...drcResultForm, scheduledDate: e.target.value})} required />
                              </div>
                              <div>
                                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#047857', display: 'block', marginBottom: 4 }}>New Time</label>
                                <input type="text" className="form-input" style={{ width: '100%', padding: '6px' }} placeholder="e.g. 11:30 AM" value={drcResultForm.scheduledTime} onChange={e => setDrcResultForm({...drcResultForm, scheduledTime: e.target.value})} required />
                              </div>
                            </div>
                            <div>
                              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#047857', display: 'block', marginBottom: 4 }}>New Venue</label>
                              <input type="text" className="form-input" style={{ width: '100%', padding: '6px' }} placeholder="e.g. Seminar Hall A" value={drcResultForm.venue} onChange={e => setDrcResultForm({...drcResultForm, venue: e.target.value})} required />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#047857', display: 'block', marginBottom: 4 }}>Committee Panel Members</label>
                              <input type="text" className="form-input" style={{ width: '100%', padding: '6px' }} placeholder="e.g. Dr. A. Sen, Prof. M. Roy, Dr. S. Bose" value={drcResultForm.committeeMembers} onChange={e => setDrcResultForm({...drcResultForm, committeeMembers: e.target.value})} />
                            </div>
                          </>
                        )}
                        <div>
                          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#047857', display: 'block', marginBottom: 4 }}>
                            {drcResultForm.status === 'RESCHEDULE' ? 'Reason for Rescheduling / Remarks' : 'Minutes of Meeting / Remarks'}
                          </label>
                          <textarea className="form-input" style={{ width: '100%', padding: '6px', resize: 'vertical' }} rows="3" placeholder={drcResultForm.status === 'RESCHEDULE' ? 'Provide context for rescheduling...' : 'Enter comments or required modifications...'} value={drcResultForm.remarks} onChange={e => setDrcResultForm({...drcResultForm, remarks: e.target.value})} required />
                        </div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button type="button" className="btn-outline" onClick={() => { setShowDrcResult(false); setSelectedDrc(null); }} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Cancel</button>
                          <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '4px 14px', fontSize: '0.75rem', background: '#059669' }}>
                            {drcResultForm.status === 'RESCHEDULE' ? 'Reschedule Meeting' : 'Submit Decision'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}
              </div>
            );
          })()}
          {subRole === 'HOD' && thesis.status === 'ACTIVE_RESEARCH' && (
            <div style={{
              width: '100%',
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 12,
              padding: 16,
              marginTop: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1E293B' }}>
                Active Research Monitoring (HOD Desk)
              </div>

              {(() => {
                const verifiedJournalsCount = publications.filter(p => p.type === 'JOURNAL' && p.status === 'VERIFIED').length;
                const verifiedConferencesCount = publications.filter(p => p.type === 'CONFERENCE' && p.status === 'VERIFIED').length;
                const cannotClearSeminar = verifiedJournalsCount < 2 || verifiedConferencesCount < 2;
                const preMilestone = milestones.find(m => m.type === 'PRE_SUBMISSION');
                const hasUploadedDocs = preMilestone && preMilestone.status === 'SUBMITTED';

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
                    {cannotClearSeminar && (
                      <div style={{ 
                        background: 'rgba(239, 68, 68, 0.08)', 
                        border: '1px solid rgba(239, 68, 68, 0.25)', 
                        padding: '12px 16px', 
                        borderRadius: 10, 
                        fontSize: '0.82rem', 
                        color: '#EF4444',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4
                      }}>
                        <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>⚠️ Pre-Submission Prerequisites Locked</span>
                        </div>
                        <div>This scholar does not meet publication prerequisites. At least 2 verified Journal publications and 2 verified Conference presentations are required.</div>
                        <div style={{ marginTop: 2, fontWeight: 700, fontSize: '0.8rem', color: '#B91C1C' }}>
                          Current Progress: Journals: {verifiedJournalsCount}/2 | Conferences: {verifiedConferencesCount}/2
                        </div>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                      {hasUploadedDocs && (
                        <button 
                          className="btn-outline" 
                          onClick={() => setShowSeminarSchedule(!showSeminarSchedule)} 
                          style={{ padding: '8px 18px', fontSize: '0.82rem', borderColor: '#3B82F6', color: '#3B82F6', fontWeight: 600 }}
                        >
                          📅 {showSeminarSchedule ? 'Cancel Scheduling' : 'Schedule Seminar'}
                        </button>
                      )}
                      <button 
                        className="btn-primary" 
                        onClick={() => act(onSeminar)} 
                        disabled={loading || cannotClearSeminar || !hasUploadedDocs} 
                        style={{ 
                          padding: '8px 18px', 
                          fontSize: '0.82rem', 
                          background: cannotClearSeminar || !hasUploadedDocs ? '#94A3B8' : '#EA580C', 
                          cursor: cannotClearSeminar || !hasUploadedDocs ? 'not-allowed' : 'pointer',
                          fontWeight: 600,
                          opacity: cannotClearSeminar || !hasUploadedDocs ? 0.7 : 1
                        }}
                      >
                        ✓ Seminar Cleared → Move to Pre-Submission
                      </button>
                    </div>
                    {showSeminarSchedule && hasUploadedDocs && (
                      <form onSubmit={handleSeminarScheduleSubmit} style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', padding: 16, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginTop: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0369A1' }}>Schedule Pre-Submission Seminar</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                          <div>
                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#0284C7', display: 'block', marginBottom: 4 }}>Meeting Date</label>
                            <input type="date" className="form-input" style={{ width: '100%', padding: '6px' }} value={seminarForm.scheduledDate} onChange={e => setSeminarForm({...seminarForm, scheduledDate: e.target.value})} required />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#0284C7', display: 'block', marginBottom: 4 }}>Meeting Time</label>
                            <input type="text" className="form-input" style={{ width: '100%', padding: '6px' }} placeholder="e.g. 11:00 AM" value={seminarForm.scheduledTime} onChange={e => setSeminarForm({...seminarForm, scheduledTime: e.target.value})} required />
                          </div>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#0284C7', display: 'block', marginBottom: 4 }}>Venue</label>
                          <input type="text" className="form-input" style={{ width: '100%', padding: '6px' }} placeholder="e.g. Committee Room 1" value={seminarForm.venue} onChange={e => setSeminarForm({...seminarForm, venue: e.target.value})} required />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#0284C7', display: 'block', marginBottom: 4 }}>Committee Panel Members</label>
                          <input type="text" className="form-input" style={{ width: '100%', padding: '6px' }} placeholder="e.g. Dr. A. Sen (HOD), Prof. M. Roy" value={seminarForm.committeeMembers} onChange={e => setSeminarForm({...seminarForm, committeeMembers: e.target.value})} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                          <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '6px 14px', fontSize: '0.75rem', background: '#0284C7' }}>Schedule Seminar</button>
                        </div>
                      </form>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
          {subRole !== 'HOD' && thesis.status === 'SUBMITTED' && milestones.find(m => m.type === 'FINAL_SUBMISSION' && (m.status === 'SUBMITTED' || m.status === 'APPROVED')) && (
            <button className="btn-primary" onClick={() => act(onFinalApprove)} disabled={loading} style={{ padding: '5px 14px', fontSize: '0.85rem', background: '#8B5CF6' }}>✓ Final Digital Approval → SUBMITTED</button>
          )}

          {/* Core Pending Documents for Review (Synopsis/Final Thesis) rendered at the top level for research phases */}
          {showProgressTabs && corePendingMilestones.length > 0 && (
            <div style={{ borderBottom: '1px solid var(--color-border, #E2E8F0)', paddingBottom: 20, marginBottom: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: 'var(--color-text, #0F172A)' }}>Submitted Documents for Review</div>
              {corePendingMilestones.map(m => (
                <div key={m._id} style={{ border: '1px solid var(--color-border, #E5E7EB)', borderRadius: 12, padding: 16, marginBottom: 12, background: 'var(--color-surface, #ffffff)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-text, #0F172A)' }}>{m.title}</div>
                    <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600, background: m.status === 'APPROVED' ? '#D1FAE5' : m.status === 'REVISION_REQUIRED' ? '#FEE2E2' : '#DBEAFE', color: m.status === 'APPROVED' ? '#065F46' : m.status === 'REVISION_REQUIRED' ? '#991B1B' : '#1D4ED8' }}>{m.status}</span>
                  </div>
                  {m.documentUrl && <a href={`${API_BASE_URL}${m.documentUrl}`} target="_blank" rel="noreferrer" style={{ color: '#10B981', fontSize: '0.85rem', display: 'block', marginBottom: 10, fontWeight: 600 }}>📄 View Submitted Document</a>}
                  {m.comments?.length > 0 && (
                    <div style={{ background: '#FFFBEB', borderLeft: '3px solid #F59E0B', padding: 8, borderRadius: 6, marginBottom: 8, fontSize: '0.82rem', color: '#92400E' }}>
                      Previous feedback: "{m.comments[m.comments.length - 1].text}"
                    </div>
                  )}
                  <textarea 
                    className="form-input" 
                    placeholder="Add remarks (required for revision)..." 
                    rows="2" 
                    value={remarks[m._id] || ''} 
                    onChange={e => setRemarks(r => ({ ...r, [m._id]: e.target.value }))} 
                    style={{ marginBottom: 8, resize: 'vertical' }}
                    disabled={m.status === 'REVISION_REQUIRED'} 
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button 
                      className="btn-primary" 
                      onClick={() => act(() => onReview(m._id, 'APPROVE', remarks[m._id]))} 
                      disabled={loading || m.status === 'REVISION_REQUIRED'} 
                      style={{ 
                        flex: 1, 
                        padding: '6px', 
                        fontSize: '0.85rem',
                        background: '#059669',
                        ...(m.status === 'REVISION_REQUIRED' ? { opacity: 0.5, cursor: 'not-allowed' } : {}) 
                      }}
                    >
                      <CheckCircle2 size={14} style={{ marginRight: 4 }} />Approve
                    </button>
                    <button 
                      onClick={() => act(() => onReview(m._id, 'REVISION', remarks[m._id]))} 
                      disabled={loading || m.status === 'REVISION_REQUIRED'}
                      style={{ 
                        flex: 1, 
                        padding: '6px', 
                        fontSize: '0.85rem', 
                        border: '1px solid #F87171', 
                        color: '#DC2626', 
                        background: 'none', 
                        borderRadius: 6, 
                        cursor: m.status === 'REVISION_REQUIRED' ? 'not-allowed' : 'pointer',
                        ...(m.status === 'REVISION_REQUIRED' ? { opacity: 0.5 } : {}) 
                      }}
                    >
                      <XCircle size={14} style={{ marginRight: 4 }} />Request Revision
                    </button>
                  </div>
                  {m.status === 'REVISION_REQUIRED' && (
                    <div style={{
                      marginTop: '12px',
                      background: '#FEF2F2',
                      border: '1px solid #FCA5A5',
                      borderLeft: '4px solid #EF4444',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: '#991B1B',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      textAlign: 'left'
                    }}>
                      <span>ℹ️ {m.type === 'SYNOPSIS' ? 'Research Synopsis' : m.type === 'PRE_SUBMISSION' ? 'Pre-Submission Package' : m.title || 'Document'} has been sent to candidate for correction. Awaiting updated submission.</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        {showProgressTabs ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, borderTop: '1px solid var(--color-border, #E2E8F0)', paddingTop: 20, marginTop: 12 }}>
            <div style={{
              display: 'flex',
              background: 'var(--color-bg, #F1F5F9)',
              padding: '4px',
              borderRadius: '10px',
              gap: '4px',
              width: '100%',
              boxSizing: 'border-box',
              border: '1px solid var(--color-border, #E2E8F0)',
              marginBottom: 10
            }}>
              <button
                type="button"
                onClick={() => setActiveResearchTab('reports')}
                style={{
                  flex: 1,
                  background: activeResearchTab === 'reports' ? '#10b981' : 'transparent',
                  border: 'none',
                  padding: '8px 12px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  borderRadius: '8px',
                  color: activeResearchTab === 'reports' ? '#ffffff' : 'var(--color-text-secondary, #475569)',
                  boxShadow: activeResearchTab === 'reports' ? '0 2px 4px rgba(16, 185, 129, 0.2)' : 'none',
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                Reports Timeline
              </button>
              <button
                type="button"
                onClick={() => setActiveResearchTab('chapters')}
                style={{
                  flex: 1,
                  background: activeResearchTab === 'chapters' ? '#10b981' : 'transparent',
                  border: 'none',
                  padding: '8px 12px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  borderRadius: '8px',
                  color: activeResearchTab === 'chapters' ? '#ffffff' : 'var(--color-text-secondary, #475569)',
                  boxShadow: activeResearchTab === 'chapters' ? '0 2px 4px rgba(16, 185, 129, 0.2)' : 'none',
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                Chapter Drafts Workspace
              </button>
              <button
                type="button"
                onClick={() => setActiveResearchTab('outputs')}
                style={{
                  flex: 1,
                  background: activeResearchTab === 'outputs' ? '#10b981' : 'transparent',
                  border: 'none',
                  padding: '8px 12px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  borderRadius: '8px',
                  color: activeResearchTab === 'outputs' ? '#ffffff' : 'var(--color-text-secondary, #475569)',
                  boxShadow: activeResearchTab === 'outputs' ? '0 2px 4px rgba(16, 185, 129, 0.2)' : 'none',
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                Research Outputs Vault
              </button>
              <button
                type="button"
                onClick={() => setActiveResearchTab('drc')}
                style={{
                  flex: 1,
                  background: activeResearchTab === 'drc' ? '#10b981' : 'transparent',
                  border: 'none',
                  padding: '8px 12px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  borderRadius: '8px',
                  color: activeResearchTab === 'drc' ? '#ffffff' : 'var(--color-text-secondary, #475569)',
                  boxShadow: activeResearchTab === 'drc' ? '0 2px 4px rgba(16, 185, 129, 0.2)' : 'none',
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                DRC Meetings
              </button>
              <button
                type="button"
                onClick={() => setActiveResearchTab('history')}
                style={{
                  flex: 1,
                  background: activeResearchTab === 'history' ? '#10b981' : 'transparent',
                  border: 'none',
                  padding: '8px 12px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  borderRadius: '8px',
                  color: activeResearchTab === 'history' ? '#ffffff' : 'var(--color-text-secondary, #475569)',
                  boxShadow: activeResearchTab === 'history' ? '0 2px 4px rgba(16, 185, 129, 0.2)' : 'none',
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                History
              </button>
            </div>

            {/* Tab 1: 6-Month Reports */}
            {activeResearchTab === 'reports' && (() => {
              const reports = milestones.filter(m => m.type === '6_MONTH_REPORT');
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text, #1E293B)' }}>Mandatory 6-Month Progress Report Checklist</h4>
                    {!showAssignReportForm && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowAssignReportForm(true);
                          setNewReportTitle(`6-Month Progress Report #${reports.length + 1}`);
                          setNewReportDueDate(new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
                        }}
                        className="btn-primary"
                        style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#059669' }}
                      >
                        + Assign 6-Month Report
                      </button>
                    )}
                  </div>

                  {showAssignReportForm && (
                    <form onSubmit={handleAssignReport} style={{ background: 'var(--color-bg, #F8FAFC)', border: '1px solid var(--color-border, #E2E8F0)', padding: 14, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--color-text, #1E293B)' }}>Assign New Progress Report Milestone</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 10 }}>
                        <div>
                          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', display: 'block', marginBottom: 4 }}>Report Title</label>
                          <input
                            type="text"
                            className="form-input"
                            required
                            style={{ width: '100%', padding: '6px' }}
                            value={newReportTitle}
                            onChange={e => setNewReportTitle(e.target.value)}
                            placeholder="e.g. 6-Month Progress Report #2"
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', display: 'block', marginBottom: 4 }}>Due Date</label>
                          <input
                            type="date"
                            className="form-input"
                            required
                            style={{ width: '100%', padding: '6px' }}
                            value={newReportDueDate}
                            onChange={e => setNewReportDueDate(e.target.value)}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button type="button" onClick={() => setShowAssignReportForm(false)} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={assigningReport} style={{ padding: '4px 14px', fontSize: '0.75rem', background: '#3B82F6' }}>
                          {assigningReport ? 'Assigning...' : 'Assign Milestone'}
                        </button>
                      </div>
                    </form>
                  )}

                  {reports.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-muted, #64748B)', fontSize: '0.85rem' }}>No 6-month progress report milestones assigned to this student. Click the button above to assign one!</div>
                  ) : (
                    reports.map(r => (
                      <div key={r._id} style={{ background: 'var(--color-bg, #F8FAFC)', border: '1px solid var(--color-border, #E2E8F0)', padding: 14, borderRadius: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text, #1E293B)' }}>{r.title}</span>
                          <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700, background: r.status === 'APPROVED' ? '#D1FAE5' : r.status === 'REVISION_REQUIRED' ? '#FEE2E2' : r.status === 'SUBMITTED' ? '#DBEAFE' : '#FEF3C7', color: r.status === 'APPROVED' ? '#065F46' : r.status === 'REVISION_REQUIRED' ? '#991B1B' : r.status === 'SUBMITTED' ? '#1D4ED8' : '#D97706' }}>{r.status}</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary, #64748B)', marginBottom: 8 }}>Due Date: {r.dueDate ? new Date(r.dueDate).toLocaleDateString() : 'N/A'}</div>
                        {r.documentUrl && (
                          <a href={`${API_BASE_URL}${r.documentUrl}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.82rem', color: '#3B82F6', fontWeight: 600, display: 'inline-block', marginBottom: 8 }}>📄 View Submitted Progress Report</a>
                        )}
                        {r.comments?.length > 0 && (
                          <div style={{ background: '#FFFBEB', borderLeft: '3px solid #F59E0B', padding: '6px 10px', borderRadius: 6, fontSize: '0.8rem', color: '#92400E', margin: '8px 0' }}>
                            <strong>Feedback:</strong> {r.comments[r.comments.length - 1].text}
                          </div>
                        )}

                        {r.status === 'SUBMITTED' && (
                          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                            <button 
                              type="button" 
                              onClick={() => setSelectedEvalDoc({
                                ...r,
                                docType: 'MILESTONE',
                                scholarName: thesis.scholarId?.name,
                                enrollmentNumber: thesis.scholarId?.username,
                                thesisTitle: thesis.title
                              })}
                              className="btn-primary" 
                              style={{ padding: '6px 14px', fontSize: '0.8rem', background: '#133A26' }}
                            >
                              Evaluate Report
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              );
            })()}

            {/* Tab 2: Chapter Drafts */}
            {activeResearchTab === 'chapters' && (() => {
              const chapters = milestones.filter(m => m.type === 'CHAPTER_DRAFT');
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {chapters.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-muted, #64748B)', fontSize: '0.85rem' }}>No chapter drafts uploaded by student yet.</div>
                  ) : (
                    chapters.map(c => (
                      <div key={c._id} style={{ background: 'var(--color-bg, #F8FAFC)', border: '1px solid var(--color-border, #E2E8F0)', padding: 14, borderRadius: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text, #1E293B)' }}>{c.title}</span>
                          <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700, background: c.status === 'APPROVED' ? '#D1FAE5' : c.status === 'REVISION_REQUIRED' ? '#FEE2E2' : c.status === 'SUBMITTED' ? '#DBEAFE' : '#FEF3C7', color: c.status === 'APPROVED' ? '#065F46' : c.status === 'REVISION_REQUIRED' ? '#991B1B' : c.status === 'SUBMITTED' ? '#1D4ED8' : '#D97706' }}>{c.status}</span>
                        </div>
                        {c.documentUrl && (
                          <a href={`${API_BASE_URL}${c.documentUrl}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.82rem', color: '#3B82F6', fontWeight: 600, display: 'inline-block', marginBottom: 8 }}>📄 View Chapter Draft</a>
                        )}
                        {c.comments?.length > 0 && (
                          <div style={{ background: '#FFFBEB', borderLeft: '3px solid #F59E0B', padding: '6px 10px', borderRadius: 6, fontSize: '0.8rem', color: '#92400E', margin: '8px 0' }}>
                            <strong>Feedback:</strong> {c.comments[c.comments.length - 1].text}
                          </div>
                        )}

                        {c.status === 'SUBMITTED' && (
                          <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                            <button 
                              type="button" 
                              onClick={() => setSelectedEvalDoc({
                                ...c,
                                docType: 'MILESTONE',
                                scholarName: thesis.scholarId?.name,
                                enrollmentNumber: thesis.scholarId?.username,
                                thesisTitle: thesis.title
                              })}
                              className="btn-primary" 
                              style={{ padding: '6px 14px', fontSize: '0.8rem', background: '#133A26' }}
                            >
                              Evaluate Chapter
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              );
            })()}

            {/* Tab 3: Research Outputs */}
            {activeResearchTab === 'outputs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pubsLoading ? (
                  <div className="premium-preloader-container" style={{ padding: '20px' }}>
                    <div className="premium-preloader-spinner" style={{ width: '40px', height: '40px', borderWidth: '3px', marginBottom: '12px' }}></div>
                    <div className="premium-preloader-text" style={{ fontSize: '0.85rem' }}>Loading publications...</div>
                  </div>
                                ) : (() => {
                  const isSupervisor = thesis.supervisorId && (thesis.supervisorId === user?._id || thesis.supervisorId?._id === user?._id);
                  const filteredPublications = publications.filter(p => {
                    if (isSupervisor) {
                      return p.status !== 'DRAFT';
                    } else if (subRole === 'HOD') {
                      return ['UNDER_REVIEW_HOD', 'VERIFIED', 'REJECTED_BY_HOD'].includes(p.status);
                    } else {
                      return p.status !== 'DRAFT';
                    }
                  });
                  if (filteredPublications.length === 0) {
                    return <div style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-muted, #64748B)', fontSize: '0.85rem' }}>No scientific publications logged in vault.</div>;
                  }
                  return filteredPublications.map(p => (
                    <div key={p._id} style={{ background: 'var(--color-bg, #F8FAFC)', border: '1px solid var(--color-border, #E2E8F0)', padding: 14, borderRadius: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text, #1E293B)' }}>{p.title}</span>
                        {(() => {
                          const display = getStatusDisplay(p.status);
                          return (
                            <span style={{ 
                              padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700,
                              background: display.bg,
                              color: display.color,
                              border: `1px solid ${display.border}`
                            }}>
                              {display.text}
                            </span>
                          );
                        })()}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 10px', fontSize: '0.78rem', color: 'var(--color-text-secondary, #64748B)', margin: '6px 0' }}>
                        <div><strong>{p.type === 'PATENT' || p.type === 'IPR' ? 'IPR Office/Org:' : p.type === 'CONFERENCE' ? 'Conference Name:' : 'Journal/Publisher:'}</strong> {p.journalName}</div>
                        <div><strong>Type:</strong> {p.type === 'IPR' && p.iprType ? `IPR: ${p.iprType}` : p.type === 'PATENT' ? 'IPR: Patent' : p.type} {p.itemStatus && <span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.72rem', marginLeft: 4 }}>({p.itemStatus})</span>}</div>
                        <div><strong>{p.type === 'PATENT' || p.type === 'IPR' ? 'IPR Number:' : p.type === 'CONFERENCE' ? 'Location/Venue:' : 'ISSN:'}</strong> {p.issn || 'N/A'}</div>
                        <div><strong>{p.type === 'PATENT' || p.type === 'IPR' ? 'Filing/Award Date:' : 'Date:'}</strong> {p.publicationDate ? new Date(p.publicationDate).toLocaleDateString() : 'N/A'}</div>

                        {(p.type === 'PATENT' || p.type === 'IPR') && (
                          <>
                            <div><strong>Inventors/Applicants:</strong> {p.volume || 'N/A'}</div>
                            <div><strong>App/Grant No:</strong> {p.issue || 'N/A'}</div>
                            <div><strong>Country/Region:</strong> {p.pages || 'N/A'}</div>
                          </>
                        )}
                        
                        {p.type === 'JOURNAL' && (
                          <>
                            <div><strong>Indexing:</strong> {p.indexing || 'N/A'}</div>
                            <div><strong>Volume:</strong> {p.volume || 'N/A'}</div>
                            <div><strong>Issue:</strong> {p.issue || 'N/A'}</div>
                            <div><strong>Pages:</strong> {p.pages || 'N/A'}</div>
                          </>
                        )}

                        {p.type === 'CONFERENCE' && (
                          <>
                            <div><strong>Indexing:</strong> {p.indexing || 'N/A'}</div>
                            <div><strong>Organizer:</strong> {p.volume || 'N/A'}</div>
                          </>
                        )}
                        
                        {p.doiUrl && <div style={{ gridColumn: 'span 2' }}><strong>{p.type === 'PATENT' || p.type === 'IPR' ? 'IPR ID/Ref:' : p.type === 'CONFERENCE' ? 'Proceedings Link:' : 'DOI:'}</strong> <a href={p.paperLink || `https://doi.org/${p.doiUrl}`} target="_blank" rel="noreferrer" style={{ color: '#2563EB', textDecoration: 'underline' }}>{p.doiUrl}</a></div>}
                      </div>
                      {p.documentUrl && (
                        <a href={`${API_BASE_URL}${p.documentUrl}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.82rem', color: '#3B82F6', fontWeight: 600, display: 'inline-block', marginBottom: 8 }}>
                          {p.type === 'PATENT' || p.type === 'IPR' ? '📄 View IPR Proof' : '📄 View Publication Proof'}
                        </a>
                      )}
                      {p.remarks && (
                        <div style={{ background: '#FFFBEB', borderLeft: '3px solid #F59E0B', padding: '6px 10px', borderRadius: 6, fontSize: '0.8rem', color: '#92400E', margin: '8px 0' }}>
                          <strong>{p.status === 'REJECTED_BY_HOD' ? 'HOD Remarks' : 'Supervisor Remarks'}:</strong> {p.remarks}
                        </div>
                      )}

                      {((p.status === 'PENDING' && isSupervisor) || (p.status === 'UNDER_REVIEW_HOD' && (subRole === 'HOD' || user?.role === 'HOD' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'))) && (
                        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                          <button 
                            type="button" 
                            onClick={() => setSelectedEvalDoc({
                              ...p,
                              docType: 'PUBLICATION',
                              scholarName: thesis.scholarId?.name,
                              enrollmentNumber: thesis.scholarId?.username,
                              thesisTitle: thesis.title
                            })}
                            className="btn-primary" 
                            style={{ padding: '6px 14px', fontSize: '0.8rem', background: '#133A26' }}
                          >
                            Evaluate Publication
                          </button>
                        </div>
                      )}
                    </div>
                  ));
                })()
                }
              </div>
            )}
            {activeResearchTab === 'drc' && (() => {
              const showSynopsisApprovalOption = thesis.status === 'SYNOPSIS_PENDING' && !drcMeetings.some(d => d.isSynopsisApproval && (d.status === 'APPROVED' || d.status === 'SCHEDULED'));
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
                  {/* DRC Meetings List */}
                  <div style={{ background: 'var(--color-bg, #f8fafc)', border: '1px solid var(--color-border, #e2e8f0)', padding: 14, borderRadius: 10, width: '100%' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text, #334155)', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>📆 Departmental Research Committee (DRC) Meetings</span>
                      {subRole === 'HOD' && !showDrcSchedule && !showOfflineDrc && !showDrcResult && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button type="button" className="btn-primary" onClick={() => {
                            setShowDrcSchedule(true);
                            setShowOfflineDrc(false);
                            setDrcForm({
                              scheduledDate: '',
                              scheduledTime: '',
                              venue: '',
                              committeeMembers: '',
                              agenda: '',
                              isSynopsisApproval: showSynopsisApprovalOption
                            });
                          }} style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#3B82F6' }}>+ Schedule Meeting</button>
                          <button type="button" className="btn-primary" onClick={() => {
                            setShowOfflineDrc(true);
                            setShowDrcSchedule(false);
                            setOfflineDrcForm({
                              conductedDate: '',
                              venue: '',
                              committeeMembers: '',
                              remarks: '',
                              status: 'APPROVED',
                              isSynopsisApproval: showSynopsisApprovalOption
                            });
                          }} style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#059669' }}>+ Record Offline DRC</button>
                        </div>
                      )}
                    </div>

                    {drcMeetings.length === 0 ? (
                      <div style={{ padding: 24, textAlign: 'center', fontSize: '0.82rem', color: 'var(--color-text-muted, #64748b)', fontStyle: 'italic' }}>No subsequent DRC meetings scheduled yet.</div>
                    ) : (
                      drcMeetings.map((drc, idx) => (
                        <div key={drc._id} style={{ borderBottom: idx < drcMeetings.length - 1 ? '1px solid var(--color-border, #E2E8F0)' : 'none', paddingBottom: idx < drcMeetings.length - 1 ? 12 : 0, paddingTop: idx > 0 ? 12 : 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text, #0F172A)' }}>
                              {drc.title || 'DRC Meeting'}
                            </span>
                            <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700, background: drc.status === 'APPROVED' ? '#D1FAE5' : drc.status === 'REVISION_REQUIRED' ? '#FEE2E2' : '#FEF3C7', color: drc.status === 'APPROVED' ? '#065F46' : drc.status === 'REVISION_REQUIRED' ? '#991B1B' : '#92400E' }}>
                              {drc.status === 'APPROVED' ? 'Satisfactory' : drc.status === 'REVISION_REQUIRED' ? 'Unsatisfactory' : drc.status}
                            </span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: '0.78rem', color: 'var(--color-text-secondary, #475569)' }}>
                            <div><strong>Date:</strong> {new Date(drc.scheduledDate).toLocaleDateString()}</div>
                            <div><strong>Time:</strong> {drc.scheduledTime}</div>
                            <div style={{ gridColumn: 'span 2' }}><strong>Venue:</strong> {drc.venue}</div>
                            {drc.committeeMembers && <div style={{ gridColumn: 'span 2' }}><strong>Committee:</strong> {drc.committeeMembers}</div>}
                            {drc.agenda && <div style={{ gridColumn: 'span 2' }}><strong>Agenda:</strong> {drc.agenda}</div>}
                            {drc.remarks && <div style={{ gridColumn: 'span 2', background: '#FFFBEB', padding: 6, borderRadius: 6, color: '#92400E', borderLeft: '3px solid #F59E0B', marginTop: 4 }}><strong>Remarks:</strong> {drc.remarks}</div>}
                          </div>

                          {subRole === 'HOD' && drc.status === 'SCHEDULED' && !showDrcResult && (
                            <button type="button" className="btn-primary" onClick={() => { setSelectedDrc(drc); setShowDrcResult(true); }} style={{ marginTop: 10, padding: '5px 12px', fontSize: '0.75rem', background: '#059669' }}>📝 Record DRC Outcome</button>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* DRC Schedule Form */}
                  {showDrcSchedule && (
                    <form onSubmit={handleDrcScheduleSubmit} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 16, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1E293B', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Schedule DRC Meeting</span>
                        <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: '#64748B' }} onClick={() => setShowDrcSchedule(false)}>✕</button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Meeting Date</label>
                          <input type="date" className="form-input" style={{ width: '100%', padding: '6px' }} value={drcForm.scheduledDate} onChange={e => setDrcForm({...drcForm, scheduledDate: e.target.value})} required />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Meeting Time</label>
                          <input type="text" className="form-input" style={{ width: '100%', padding: '6px' }} placeholder="e.g. 11:00 AM" value={drcForm.scheduledTime} onChange={e => setDrcForm({...drcForm, scheduledTime: e.target.value})} required />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Venue</label>
                          <input type="text" className="form-input" style={{ width: '100%', padding: '6px' }} placeholder="e.g. Committee Room 1" value={drcForm.venue} onChange={e => setDrcForm({...drcForm, venue: e.target.value})} required />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Purpose</label>
                          <select className="form-input" style={{ width: '100%', padding: '6px' }} value={drcForm.isSynopsisApproval ? "Synopsis" : "General"} onChange={e => setDrcForm({...drcForm, isSynopsisApproval: e.target.value === "Synopsis"})}>
                            <option value="General">General DRC</option>
                            {showSynopsisApprovalOption && <option value="Synopsis">Synopsis approval</option>}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Committee Panel Members</label>
                        <input type="text" className="form-input" style={{ width: '100%', padding: '6px' }} placeholder="e.g. Dr. A. Sen (HOD), Prof. M. Roy" value={drcForm.committeeMembers} onChange={e => setDrcForm({...drcForm, committeeMembers: e.target.value})} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Agenda / Focus Areas</label>
                        <textarea className="form-input" style={{ width: '100%', padding: '6px', resize: 'vertical' }} rows="2" placeholder="e.g. Research progress evaluation and review." value={drcForm.agenda} onChange={e => setDrcForm({...drcForm, agenda: e.target.value})} />
                      </div>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button type="button" className="btn-outline" onClick={() => setShowDrcSchedule(false)} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '4px 14px', fontSize: '0.75rem', background: '#3B82F6' }}>Schedule Event</button>
                      </div>
                    </form>
                  )}

                  {/* Offline DRC Form */}
                  {showOfflineDrc && (
                    <form onSubmit={handleOfflineDrcSubmit} style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: 16, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#065F46', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Record Offline Conducted DRC Outcome</span>
                        <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: '#047857' }} onClick={() => setShowOfflineDrc(false)}>✕</button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#047857', display: 'block', marginBottom: 4 }}>Date Conducted</label>
                          <input type="date" className="form-input" style={{ width: '100%', padding: '6px' }} value={offlineDrcForm.conductedDate} onChange={e => setOfflineDrcForm({...offlineDrcForm, conductedDate: e.target.value})} required />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#047857', display: 'block', marginBottom: 4 }}>Committee Decision</label>
                          <select className="form-input" style={{ width: '100%', padding: '6px' }} value={offlineDrcForm.status} onChange={e => setOfflineDrcForm({...offlineDrcForm, status: e.target.value})} required>
                            <option value="APPROVED">Satisfactory</option>
                            <option value="REVISION_REQUIRED">Unsatisfactory</option>
                          </select>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#047857', display: 'block', marginBottom: 4 }}>Venue</label>
                          <input type="text" className="form-input" style={{ width: '100%', padding: '6px' }} placeholder="e.g. Offline Department Room" value={offlineDrcForm.venue} onChange={e => setOfflineDrcForm({...offlineDrcForm, venue: e.target.value})} required />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#047857', display: 'block', marginBottom: 4 }}>Purpose</label>
                          <select className="form-input" style={{ width: '100%', padding: '6px' }} value={offlineDrcForm.isSynopsisApproval ? "Synopsis" : "General"} onChange={e => setOfflineDrcForm({...offlineDrcForm, isSynopsisApproval: e.target.value === "Synopsis"})}>
                            <option value="General">General DRC</option>
                            {showSynopsisApprovalOption && <option value="Synopsis">Synopsis approval</option>}
                          </select>
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#047857', display: 'block', marginBottom: 4 }}>Committee Panel Members</label>
                        <input type="text" className="form-input" style={{ width: '100%', padding: '6px' }} placeholder="e.g. Dr. A. Sen (HOD), Prof. M. Roy" value={offlineDrcForm.committeeMembers} onChange={e => setOfflineDrcForm({...offlineDrcForm, committeeMembers: e.target.value})} />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#047857', display: 'block', marginBottom: 4 }}>MoM / Committee Remarks</label>
                        <textarea className="form-input" style={{ width: '100%', padding: '6px', resize: 'vertical' }} rows="3" placeholder="Enter offline comments or required modifications..." value={offlineDrcForm.remarks} onChange={e => setOfflineDrcForm({...offlineDrcForm, remarks: e.target.value})} required />
                      </div>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button type="button" className="btn-outline" onClick={() => setShowOfflineDrc(false)} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '4px 14px', fontSize: '0.75rem', background: '#059669' }}>Submit Offline Result</button>
                      </div>
                    </form>
                  )}

                  {/* DRC Result Grading Form */}
                  {showDrcResult && selectedDrc && (
                    <form onSubmit={handleDrcResultSubmit} style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: 16, borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#065F46', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Record DRC Meeting Outcome ({selectedDrc.title})</span>
                        <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: '#047857' }} onClick={() => { setShowDrcResult(false); setSelectedDrc(null); }}>✕</button>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#047857', display: 'block', marginBottom: 4 }}>Committee Decision</label>
                        <select className="form-input" style={{ width: '100%', padding: '6px' }} value={drcResultForm.status} onChange={e => setDrcResultForm({...drcResultForm, status: e.target.value})} required>
                          <option value="APPROVED">Satisfactory</option>
                          <option value="REVISION_REQUIRED">Unsatisfactory</option>
                          <option value="RESCHEDULE">RESCHEDULE MEETING</option>
                        </select>
                      </div>
                      {drcResultForm.status === 'RESCHEDULE' && (
                        <>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div>
                              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#047857', display: 'block', marginBottom: 4 }}>New Date</label>
                              <input type="date" className="form-input" style={{ width: '100%', padding: '6px' }} value={drcResultForm.scheduledDate} onChange={e => setDrcResultForm({...drcResultForm, scheduledDate: e.target.value})} required />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#047857', display: 'block', marginBottom: 4 }}>New Time</label>
                              <input type="text" className="form-input" style={{ width: '100%', padding: '6px' }} placeholder="e.g. 11:30 AM" value={drcResultForm.scheduledTime} onChange={e => setDrcResultForm({...drcResultForm, scheduledTime: e.target.value})} required />
                            </div>
                          </div>
                          <div>
                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#047857', display: 'block', marginBottom: 4 }}>New Venue</label>
                            <input type="text" className="form-input" style={{ width: '100%', padding: '6px' }} placeholder="e.g. Seminar Hall A" value={drcResultForm.venue} onChange={e => setDrcResultForm({...drcResultForm, venue: e.target.value})} required />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#047857', display: 'block', marginBottom: 4 }}>Committee Panel Members</label>
                            <input type="text" className="form-input" style={{ width: '100%', padding: '6px' }} placeholder="e.g. Dr. A. Sen, Prof. M. Roy" value={drcResultForm.committeeMembers} onChange={e => setDrcResultForm({...drcResultForm, committeeMembers: e.target.value})} />
                          </div>
                        </>
                      )}
                      <div>
                        <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#047857', display: 'block', marginBottom: 4 }}>MoM / Committee Remarks *</label>
                        <textarea className="form-input" style={{ width: '100%', padding: '6px', resize: 'vertical' }} rows="3" placeholder="Enter comments or reschedule reason..." value={drcResultForm.remarks} onChange={e => setDrcResultForm({...drcResultForm, remarks: e.target.value})} required />
                      </div>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button type="button" className="btn-outline" onClick={() => { setShowDrcResult(false); setSelectedDrc(null); }} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '4px 14px', fontSize: '0.75rem', background: '#059669' }}>Record Outcome</button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })()}
            {activeResearchTab === 'history' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text, #1E293B)' }}>Ph.D. Candidate Lifecycle Progress Checklist</h4>
                
                {/* Checklist Summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                  <div style={{ background: 'var(--color-bg, #F8FAFC)', border: '1px solid var(--color-border, #E2E8F0)', padding: 12, borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted, #64748B)' }}>Coursework Status</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: 4, color: thesis.courseworkCompleted ? '#059669' : '#D97706' }}>
                      {thesis.courseworkCompleted ? 'Completed ✅' : 'Pending ⏳'}
                    </div>
                  </div>
                  <div style={{ background: 'var(--color-bg, #F8FAFC)', border: '1px solid var(--color-border, #E2E8F0)', padding: 12, borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted, #64748B)' }}>Enrollment Verified</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: 4, color: thesis.enrollmentVerified ? '#059669' : '#D97706' }}>
                      {thesis.enrollmentVerified ? 'Verified ✅' : 'Pending ⏳'}
                    </div>
                  </div>

                  <div style={{ background: 'var(--color-bg, #F8FAFC)', border: '1px solid var(--color-border, #E2E8F0)', padding: 12, borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted, #64748B)' }}>Research Start Date</div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: 4, color: 'var(--color-text, #1E293B)' }}>
                      {thesis.startDate ? new Date(thesis.startDate).toLocaleDateString() : 'N/A ⏳'}
                    </div>
                  </div>
                </div>

                {/* Audit Logs */}
                <div>
                  <h4 style={{ margin: '12px 0 8px', fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text, #1E293B)' }}>Complete Lifecycle Audit Logs</h4>
                  {!thesis.auditLog || thesis.auditLog.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-muted, #64748B)', fontSize: '0.85rem' }}>No audit logs recorded yet.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                      {[...thesis.auditLog].reverse().map((log, index) => (
                        <div key={log._id || index} style={{ background: 'var(--color-bg, #F8FAFC)', border: '1px solid var(--color-border, #E2E8F0)', padding: 12, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{log.action}</span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted, #64748B)' }}>{new Date(log.date).toLocaleString()}</span>
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--color-text, #1F2937)', fontWeight: 500 }}>{log.note}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {pendingMilestones.length > 0 ? (
              <div>
                <div style={{ fontWeight: 700, marginBottom: 12 }}>Submitted Documents for Review</div>
                {pendingMilestones.map(m => (
                  <div key={m._id} style={{ border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ fontWeight: 600 }}>{m.title}</div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: m.status === 'SUBMITTED' ? '#3B82F6' : '#DC2626' }}>{m.status}</span>
                    </div>
                    {m.documentUrl && <a href={`${API_BASE_URL}${m.documentUrl}`} target="_blank" rel="noreferrer" style={{ color: '#10B981', fontSize: '0.85rem', display: 'block', marginBottom: 10 }}>📄 View Document</a>}
                    {m.comments?.length > 0 && (
                      <div style={{ background: '#FEF3C7', padding: 8, borderRadius: 6, marginBottom: 8, fontSize: '0.82rem' }}>
                        Previous feedback: "{m.comments[m.comments.length - 1].text}"
                      </div>
                    )}
                    <textarea 
                      className="form-input" 
                      placeholder="Add remarks (required for revision)..." 
                      rows="2" 
                      value={remarks[m._id] || ''} 
                      onChange={e => setRemarks(r => ({ ...r, [m._id]: e.target.value }))} 
                      style={{ marginBottom: 8, resize: 'vertical' }}
                      disabled={m.status === 'REVISION_REQUIRED'} 
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button 
                        className="btn-primary" 
                        onClick={() => act(() => onReview(m._id, 'APPROVE', remarks[m._id]))} 
                        disabled={loading || m.status === 'REVISION_REQUIRED'} 
                        style={{ 
                          flex: 1, 
                          padding: '6px', 
                          fontSize: '0.85rem',
                          ...(m.status === 'REVISION_REQUIRED' ? { opacity: 0.5, cursor: 'not-allowed' } : {}) 
                        }}
                      >
                        <CheckCircle2 size={14} style={{ marginRight: 4 }} />Approve
                      </button>
                      <button 
                        onClick={() => act(() => onReview(m._id, 'REVISION', remarks[m._id]))} 
                        disabled={loading || m.status === 'REVISION_REQUIRED'}
                        style={{ 
                          flex: 1, 
                          padding: '6px', 
                          fontSize: '0.85rem', 
                          border: '1px solid #F87171', 
                          color: '#DC2626', 
                          background: 'none', 
                          borderRadius: 6, 
                          cursor: m.status === 'REVISION_REQUIRED' ? 'not-allowed' : 'pointer',
                          ...(m.status === 'REVISION_REQUIRED' ? { opacity: 0.5 } : {}) 
                        }}
                      >
                        <XCircle size={14} style={{ marginRight: 4 }} />Request Revision
                      </button>
                    </div>
                    {m.status === 'REVISION_REQUIRED' && (
                      <div style={{
                        marginTop: '12px',
                        background: '#FEF2F2',
                        border: '1px solid #FCA5A5',
                        borderLeft: '4px solid #EF4444',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        color: '#991B1B',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        textAlign: 'left'
                      }}>
                        <span>ℹ️ {m.type === 'SYNOPSIS' ? 'Research Synopsis' : m.title || 'Document'} has been sent to candidate for correction. Awaiting updated submission.</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: 24, color: '#9CA3AF' }}>No documents pending review for this scholar.</div>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  );
};

// ── Scholar List ──
const ScholarList = ({ theses, onSelect, title, subRole }) => {
  const { loading } = useContext(ThesisContext);
  const { paginatedData, currentPage, pageSize, renderGridControls } = useGridControl(
    theses,
    ['scholarId.name', 'department', 'title']
  );

  return (
    <div className="card documents-card">
      <h3 className="card-title">{title}</h3>
      {loading ? (
        <div className="premium-preloader-container" style={{ padding: '40px 20px' }}>
          <div className="premium-preloader-spinner" style={{ width: '40px', height: '40px', borderWidth: '3px', marginBottom: '12px' }}></div>
          <div className="premium-preloader-text" style={{ fontSize: '0.85rem' }}>Loading scholars...</div>
        </div>
      ) : (
        <>
          {renderGridControls()}
          {paginatedData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: '#9CA3AF' }}>No records found.</div>
          ) : (
            <div className="file-list">
              <div className="file-header">
                <div style={{ flex: '0.5' }}>S.No.</div>
                <div style={{ flex: 1.5 }}>Scholar</div>
                <div style={{ flex: 1 }}>Dept</div>
                <div style={{ flex: 2 }}>Title</div>
                <div style={{ flex: 1.2 }}>Status</div>
                <div style={{ flex: 0.8 }}>Action</div>
              </div>
              {paginatedData.map((t, idx) => (
                <div key={t._id} className="file-item">
                  <div style={{ flex: '0.5', fontWeight: 600, color: '#6B7280' }}>{idx + 1 + (currentPage - 1) * pageSize}</div>
                  <div className="file-name" style={{ flex: 1.5 }}>{t.scholarId?.name || <span style={{ color: '#DC2626', fontStyle: 'italic', fontSize: '0.8rem' }}>⚠️ Unassigned</span>}</div>
                  <div className="file-date" style={{ flex: 1 }}>{t.department}</div>
                  <div style={{ flex: 2, fontSize: '0.85rem', color: '#374151' }}>{t.title?.substring(0, 40)}...</div>
                  <div style={{ flex: 1.2 }}>
                    {(() => {
                      const badge = resolveDetailedStatus(t.status, t.synopsisStatus, t.finalSubStatus, subRole, t.preSubMilestoneStatus, t.preSubmissionSeminar?.status);
                      return (
                        <span style={{ padding: '3px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 600, background: badge.bg, color: badge.color }}>
                          {badge.text}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="file-actions" style={{ flex: 0.8 }}>
                    <button className="btn-action" onClick={() => onSelect(t._id)}>Review</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ── DRC Page (HOD) ──
const DRCPage = ({ theses, onSelect }) => {
  const pending = theses.filter(t => {
    if (t.status === 'SYNOPSIS_PENDING') {
      return t.synopsisStatus === 'APPROVED';
    }
    return t.status === 'ACTIVE_RESEARCH';
  });
  return (
    <div>
      <div className="card" style={{ marginBottom: 16, background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
        <h3 style={{ color: '#059669', marginBottom: 8 }}>HOD Actions</h3>
        <p style={{ color: '#065F46', fontSize: '0.9rem' }}>
          <strong>DRC Approval:</strong> Click "Review" on a scholar with SYNOPSIS_PENDING status to approve after DRC meeting.<br />
          <strong>Seminar Clearance:</strong> Click "Review" on a scholar with ACTIVE_RESEARCH status to clear their pre-submission seminar.
        </p>
      </div>
      <ScholarList theses={pending} onSelect={onSelect} title="Scholars Awaiting HOD Action" />
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

  // Sort requests by most recent first
  const sortedRequests = [...requests].sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0));

  const { paginatedData, currentPage, pageSize, renderGridControls } = useGridControl(
    sortedRequests,
    ['scholarId.name', 'type', 'status', 'currentValue', 'proposedValue']
  );

  if (loading) {
    return (
      <div className="premium-preloader-container">
        <div className="premium-preloader-spinner"></div>
        <div className="premium-preloader-text">Loading academic change requests...</div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 24, background: 'white', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
      <h3 className="card-title" style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>
        Student Academic Modification Requests
      </h3>
      <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: 20 }}>
        Review, reassign, approve, or reject student requests for Thesis Title modifications and Research Supervisor (Guide) reallocations.
      </p>

      {renderGridControls()}

      {paginatedData.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748B', background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0', fontStyle: 'italic' }}>
          No academic modification requests logged for your department.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E2E8F0', background: '#F8FAFC' }}>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>S.No.</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Scholar</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Request Type</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Current Value</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Proposed Value</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569' }}>Status</th>
                <th style={{ padding: '14px 16px', fontWeight: 700, color: '#475569', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((r, idx) => {
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
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: '#6B7280' }}>{idx + 1 + (currentPage - 1) * pageSize}</td>
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

// ── Overview ──
const OverviewPage = ({ theses, user, onSelect, setActiveTab }) => {
  const isHOD = user?.subRole === 'HOD';

  // HOD specific metrics
  const totalScholars = theses.length;
  const awaitingReg = theses.filter(t => t.status === 'REGISTRATION_PENDING').length;
  const activeResearch = theses.filter(t => t.status === 'ACTIVE_RESEARCH').length;
  const pendingReviews = theses.filter(t => {
    const hasPendingSynopsis = t.status === 'SYNOPSIS_PENDING' && t.synopsisStatus === 'PENDING_HOD';
    const hasPendingPreSub = t.status === 'PRE_SUBMISSION' && t.preSubMilestoneStatus === 'PENDING_HOD';
    const hasPendingPubs = t.publications && t.publications.some(p => p.status === 'UNDER_REVIEW_HOD');
    return hasPendingSynopsis || hasPendingPreSub || hasPendingPubs;
  }).length;
  const awaitingDRC = theses.filter(t => t.status === 'SYNOPSIS_PENDING' && t.synopsisStatus === 'APPROVED').length;

  // Advisor specific metrics
  const myScholars = theses;
  const activeSupervision = myScholars.filter(t => t.status === 'ACTIVE_RESEARCH').length;
  const myPendingApprovals = myScholars.filter(t => {
    const hasPendingSynopsis = t.status === 'SYNOPSIS_PENDING' && t.synopsisStatus === 'SUBMITTED';
    const hasPendingPreSub = t.status === 'PRE_SUBMISSION' && t.preSubMilestoneStatus === 'SUBMITTED';
    const hasPendingPubs = t.publications && t.publications.some(p => p.status === 'PENDING');
    return hasPendingSynopsis || hasPendingPreSub || hasPendingPubs;
  }).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Welcome Banner Card */}
      <div className="card" style={{
        background: isHOD ? 'linear-gradient(135deg, #1E3A8A 0%, #3B82F6 100%)' : 'linear-gradient(135deg, #133A26 0%, #059669 100%)',
        color: 'white',
        padding: '28px 24px',
        borderRadius: '16px',
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px', color: '#FFFFFF' }}>
          Welcome back, {user?.name}!
        </h2>
        <p style={{ opacity: 0.9, fontSize: '0.85rem', fontWeight: 500, lineHeight: 1.4 }}>
          {isHOD ? (
            `Head of Department — ${user?.department || 'Department of Computer Science Engineering'} Central Console. Manage registration requests, supervisor allocations, RAC sessions, and schedule DRC evaluations.`
          ) : (
            `Doctoral Supervisor — Research Advisor console. Track scholar research deliverables, approve synopsis submissions, complete RAC reviews, and clear final digital thesis submissions.`
          )}
        </p>
      </div>

      {/* Role-Specific Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {isHOD ? (
          <>
            {[
              { label: 'Total Department Scholars', value: totalScholars, color: '#3B82F6', bg: '#EFF6FF', border: '#DBEAFE' },
              { label: 'Awaiting Registration', value: awaitingReg, color: '#F59E0B', bg: '#FFFBEB', border: '#FEF3C7' },
              { label: 'Active Research', value: activeResearch, color: '#10B981', bg: '#ECFDF5', border: '#D1FAE5' },
              { label: 'Pending HOD Reviews', value: pendingReviews, color: '#EF4444', bg: '#FEF2F2', border: '#FEE2E2' }
            ].map(({ label, value, color, bg, border }) => (
              <div key={label} className="card" style={{ textAlign: 'center', padding: '20px 16px', background: bg, border: `1px solid ${border}`, borderRadius: '12px' }}>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color, marginBottom: '4px' }}>{value}</div>
                <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </>
        ) : (
          <>
            {[
              { label: 'Assigned Scholars', value: myScholars.length, color: '#10B981', bg: '#ECFDF5', border: '#D1FAE5' },
              { label: 'Active Research', value: activeSupervision, color: '#3B82F6', bg: '#EFF6FF', border: '#DBEAFE' },
              { label: 'Pending My Approval', value: myPendingApprovals, color: '#F59E0B', bg: '#FFFBEB', border: '#FEF3C7' },
              { label: 'Total Publications Logged', value: myScholars.reduce((acc, t) => acc + (t.publications?.length || 0), 0), color: '#8B5CF6', bg: '#F5F3FF', border: '#EDE9FE' }
            ].map(({ label, value, color, bg, border }) => (
              <div key={label} className="card" style={{ textAlign: 'center', padding: '20px 16px', background: bg, border: `1px solid ${border}`, borderRadius: '12px' }}>
                <div style={{ fontSize: '2.2rem', fontWeight: 900, color, marginBottom: '4px' }}>{value}</div>
                <div style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>{label}</div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Action Center Banner */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20 }}>
        {/* Left Side: Main Tasks Overview */}
        <div className="card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0F172A', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📂 Scholars Summary Checklist</span>
          </h3>

          {theses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#94A3B8', fontSize: '0.85rem' }}>
              No scholars currently assigned under this department.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {theses.slice(0, 6).map(t => {
                const badge = resolveDetailedStatus(t.status, t.synopsisStatus, t.finalSubStatus, user?.subRole, t.preSubMilestoneStatus, t.preSubmissionSeminar?.status);
                return (
                  <div
                    key={t._id}
                    onClick={() => onSelect(t._id)}
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
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B' }}>
                        {t.scholarId?.name || 'Academic Scholar'}{t.scholarId?.profile?.shNo ? ` (SH no: ${t.scholarId.profile.shNo})` : ''}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748B', maxWidth: '380px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.title || 'No Research Title Declared'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700, background: badge.bg, color: badge.color }}>
                        {badge.text}
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                  </div>
                );
              })}
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
                  {awaitingReg > 0 && (
                    <div style={{ background: '#FFF9E6', borderLeft: '4px solid #F59E0B', padding: '10px 12px', borderRadius: '6px', fontSize: '0.8rem', color: '#B45309' }}>
                      <strong>Registration Verification:</strong> There are {awaitingReg} scholar(s) awaiting initial profile review & supervisor assignment.
                    </div>
                  )}
                  {awaitingDRC > 0 && (
                    <div style={{ background: '#EFF6FF', borderLeft: '4px solid #3B82F6', padding: '10px 12px', borderRadius: '6px', fontSize: '0.8rem', color: '#1E40AF' }}>
                      <strong>DRC Meeting Scheduling:</strong> {awaitingDRC} scholar(s) have supervisor synopsis approvals and are ready for official committee evaluation.
                    </div>
                  )}
                  {awaitingReg === 0 && awaitingDRC === 0 && (
                    <div style={{ fontSize: '0.8rem', color: '#15803D', background: '#F0FDF4', padding: '10px 12px', borderRadius: '6px', borderLeft: '4px solid #10B981' }}>
                      ✅ Department workflow status is clean. All pending milestones are up to date!
                    </div>
                  )}
                </>
              ) : (
                <>
                  {myPendingApprovals > 0 && (
                    <div style={{ background: '#FFF9E6', borderLeft: '4px solid #F59E0B', padding: '10px 12px', borderRadius: '6px', fontSize: '0.8rem', color: '#B45309' }}>
                      <strong>Pending Deliverables:</strong> You have {myPendingApprovals} pending synopsis proposal(s) or pre-submission seminar draft(s) awaiting review.
                    </div>
                  )}
                  {myPendingApprovals === 0 && (
                    <div style={{ fontSize: '0.8rem', color: '#15803D', background: '#F0FDF4', padding: '10px 12px', borderRadius: '6px', borderLeft: '4px solid #10B981' }}>
                      ✅ All assigned scholars’ reviews are up to date. You have no pending submissions.
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

const SupervisorRACConsole = ({ theses }) => {
  const toast = useToast();
  const [racs, setRacs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [schedForm, setSchedForm] = useState({ thesisId: '', racNumber: 1, scheduledDate: '', committeeMembers: '' });
  const [selectedRAC, setSelectedRAC] = useState(null);

  const activeScholars = theses.filter(t => t.status === 'ACTIVE_RESEARCH');

  const fetchRacs = async () => {
    try {
      const allRacs = [];
      for (const t of activeScholars) {
        const rRes = await axios.get(`${API}/lifecycle/rac/thesis/${t._id}`, getAuthHeader());
        rRes.data.forEach(r => { r.scholar = t.scholarId; r.title = t.title; });
        allRacs.push(...rRes.data);
      }
      setRacs(allRacs);
    } catch (err) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchRacs();
  }, [theses]);

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!schedForm.thesisId || !schedForm.scheduledDate) return toast.warning('Please complete the scheduling form.');
    try {
      await axios.post(`${API}/lifecycle/rac/schedule`, schedForm, getAuthHeader());
      toast.success('RAC review meeting scheduled successfully!');
      setShowScheduleForm(false);
      setSchedForm({ thesisId: '', racNumber: 1, scheduledDate: '', committeeMembers: '' });
      fetchRacs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule RAC.');
    }
  };

  const handleRACGrade = async (racId, payload) => {
    try {
      await axios.put(`${API}/lifecycle/rac/${racId}/result`, payload, getAuthHeader());
      toast.success(`RAC progress successfully graded as ${payload.status}!`);
      fetchRacs();
    } catch (err) {
      toast.error('Failed to submit grade.');
    }
  };

  return (
    <div className="card" style={{ padding: 24, borderRadius: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 className="card-title" style={{ margin: 0 }}>Research Advisory Committee (RAC) Schedule & Clearance</h3>
          <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: 4 }}>
            Schedule and manage periodic doctoral committee milestones and add your supervisor evaluation remarks for your active assigned PhD scholars.
          </p>
        </div>
        <button onClick={() => setShowScheduleForm(!showScheduleForm)} className="btn-primary" style={{ background: '#059669', display: 'flex', gap: 6, alignItems: 'center', padding: '8px 16px', fontSize: '0.85rem' }}>
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
                {activeScholars.map(s => <option key={s._id} value={s._id}>{s.scholarId?.name} — {s.title}</option>)}
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

      {loading ? (
        <div className="premium-preloader-container" style={{ padding: '20px' }}>
          <div className="premium-preloader-spinner" style={{ width: '40px', height: '40px', borderWidth: '3px', marginBottom: '12px' }}></div>
          <div className="premium-preloader-text" style={{ fontSize: '0.85rem' }}>Loading RAC records...</div>
        </div>
      ) : racs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '36px', color: '#64748B', background: '#F8FAFC', borderRadius: 8 }}>
          No scheduled RAC review meetings found for your active scholars.
        </div>
      ) : (
        <div className="file-list">
          <div className="file-header">
            <div style={{ flex: 2 }}>Scholar</div>
            <div style={{ flex: 1 }}>Session</div>
            <div style={{ flex: 1.5 }}>Scheduled Date</div>
            <div style={{ flex: 1.8 }}>Progress Report</div>
            <div style={{ flex: 1.2 }}>Status</div>
            <div style={{ flex: 2.2, textAlign: 'center' }}>Grading Actions & Remarks</div>
          </div>
          {racs.map(r => (
            <div key={r._id} className="file-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <div style={{ flex: 2 }}>
                  <div style={{ fontWeight: 700 }}>{r.scholar?.name || 'Scholar'}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
                </div>
                <div style={{ flex: 1, fontWeight: 600, color: '#1E3A8A' }}>RAC-{r.racNumber}</div>
                <div style={{ flex: 1.5, fontSize: '0.85rem' }}>{new Date(r.scheduledDate).toLocaleDateString()}</div>
                <div style={{ flex: 1.8 }}>
                  {r.progressReportUrl ? (
                    <a href={`${API_BASE_URL}${r.progressReportUrl}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: '#2563EB', fontWeight: 600, textDecoration: 'underline' }}>
                      📄 View Progress Report
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
        </div>
      )}

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

        {user?.role === 'FACULTY' && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Designation</label>
              <select className="form-input" value={designation} onChange={e => setDesignation(e.target.value)} required>
                <option value="">Select...</option>
                <option value="Assistant Professor">Assistant Professor</option>
                <option value="Associate Professor">Associate Professor</option>
                <option value="Professor">Professor</option>
                <option value="Professor Emeritus">Professor Emeritus</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Area of Specialization</label>
              <input type="text" className="form-input" value={specialization} onChange={e => setSpecialization(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Office Room No.</label>
              <input type="text" className="form-input" value={officeRoom} onChange={e => setOfficeRoom(e.target.value)} required />
            </div>
          </>
        )}

        {user?.role === 'HOD' && (
          <>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Office Room No.</label>
              <input type="text" className="form-input" value={officeRoom} onChange={e => setOfficeRoom(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Years of Service</label>
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

// ── Step 4 Pending Reviews Queue and Split-Screen PDF Evaluator ──
const PendingReviewsQueue = ({ theses, user }) => {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null); 
  const [commentText, setCommentText] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const allPendingDocs = [];

      await Promise.all(theses.map(async (t) => {
        // Fetch milestones
        const mRes = await axios.get(`${API_URL}/milestones/${t._id}`, getAuthHeader());
        const pendingMilestones = mRes.data.filter(m => {
          if (m.type === 'SYNOPSIS') {
            if (user?.subRole === 'HOD') {
              return m.status === 'PENDING_HOD';
            } else {
              return m.status === 'SUBMITTED';
            }
          }
          return m.status === 'SUBMITTED';
        });
        pendingMilestones.forEach(m => {
          allPendingDocs.push({
            _id: m._id,
            docType: 'MILESTONE',
            title: m.title,
            type: m.type,
            submittedAt: m.submittedAt || m.updatedAt,
            documentUrl: m.documentUrl,
            scholarName: t.scholarId?.name || 'Scholar',
            thesisTitle: t.title,
            thesisId: t._id
          });
        });

        // Fetch publications
        const pRes = await axios.get(`${API_URL}/publications/thesis/${t._id}`, getAuthHeader());
        const isSupervisor = t.supervisorId && (t.supervisorId === user?._id || t.supervisorId?._id === user?._id);
        const isHodUser = user?.role === 'HOD' || user?.subRole === 'HOD' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
        const pendingPubs = pRes.data.filter(p => {
          const matchSupervisor = isSupervisor && p.status === 'PENDING';
          const matchHod = isHodUser && p.status === 'UNDER_REVIEW_HOD';
          return matchSupervisor || matchHod;
        });
        pendingPubs.forEach(p => {
          allPendingDocs.push({
            _id: p._id,
            docType: 'PUBLICATION',
            title: p.title,
            type: p.type || 'JOURNAL',
            submittedAt: p.createdAt || p.updatedAt,
            documentUrl: p.documentUrl || p.attachmentUrl,
            scholarName: t.scholarId?.name || 'Scholar',
            thesisTitle: t.title,
            thesisId: t._id
          });
        });
      }));

      allPendingDocs.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
      setItems(allPendingDocs);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPending();
  }, [theses]);

  const handleReviewAction = async (action) => {
    if (!commentText.trim() && action === 'REVISION') {
      return toast.warning('Remarks and revision requirements are required to request corrections.');
    }
    setReviewLoading(true);
    try {
      if (selectedDoc.docType === 'MILESTONE') {
        await axios.put(`${API_URL}/milestones/${selectedDoc._id}/review`, {
          action: action === 'APPROVE' ? 'APPROVE' : 'REVISION',
          comment: commentText.trim()
        }, getAuthHeader());
        toast.success(`Milestone marked: ${action === 'APPROVE' ? 'APPROVED' : 'REVISION REQUIRED'}`);
      } else {
        await axios.put(`${API_URL}/publications/${selectedDoc._id}/verify`, {
          status: action === 'APPROVE' ? 'VERIFIED' : 'REJECTED',
          remarks: commentText.trim()
        }, getAuthHeader());
        toast.success(`Publication marked: ${action === 'APPROVE' ? 'VERIFIED' : 'REJECTED'}`);
      }
      setSelectedDoc(null);
      setCommentText('');
      fetchPending();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error processing review.');
    } finally {
      setReviewLoading(false);
    }
  };

  if (selectedDoc) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => { setSelectedDoc(null); setCommentText(''); }} className="btn-outline" style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '6px 14px' }}>
            ← Back to Reviews Queue
          </button>
          <span style={{ fontWeight: 700, color: '#475569' }}>
            Reviewing: {selectedDoc.scholarName}'s Submission
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20, minHeight: '650px' }}>
          {/* Left panel: Document Viewer */}
          <div style={{ 
            background: 'var(--color-surface, #ffffff)',
            borderRadius: 12,
            padding: 0, 
            overflow: 'hidden', 
            display: 'flex', 
            flexDirection: 'column', 
            height: '650px', 
            border: '1px solid var(--color-border, #CBD5E1)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ background: 'var(--color-bg, #F1F5F9)', padding: '10px 16px', borderBottom: '1px solid var(--color-border, #CBD5E1)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text, #334155)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📄 Inline Document Previewer</span>
              {selectedDoc.documentUrl && <a href={`${API_BASE_URL}${selectedDoc.documentUrl}`} target="_blank" rel="noreferrer" style={{ color: '#2563EB', fontWeight: 700 }}>Download Copy ⬇️</a>}
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              {selectedDoc.documentUrl ? (
                <>
                  <iframe 
                    src={selectedDoc.documentUrl.toLowerCase().endsWith('.docx') || selectedDoc.documentUrl.toLowerCase().endsWith('.doc') 
                      ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(API_BASE_URL + selectedDoc.documentUrl)}` 
                      : `${API_BASE_URL}${selectedDoc.documentUrl}`
                    } 
                    title="Document Viewer" 
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                  {API_BASE_URL.includes('localhost') && (
                    <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, background: 'rgba(254, 243, 199, 0.95)', border: '1px solid #F59E0B', padding: '8px 12px', borderRadius: 8, fontSize: '0.75rem', color: '#92400E' }}>
                      ℹ️ <strong>Local Development Warning:</strong> External Word viewers cannot read local files. Use "Download Copy" above if preview does not load.
                    </div>
                  )}
                </>
              ) : (
                <div style={{ display: 'flex', flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg, #F8FAFC)', color: '#64748B', flexDirection: 'column', padding: 20 }}>
                  <span style={{ fontSize: '2rem' }}>⚠️</span>
                  <p style={{ marginTop: 10, fontWeight: 600 }}>No PDF or Word copy uploaded by scholar.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right panel: Feedback form */}
          <div style={{ 
            background: 'var(--color-surface, #ffffff)',
            borderRadius: 12,
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between', 
            height: '650px', 
            padding: 24, 
            border: '1px solid #CBD5E1',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#133A26', borderBottom: '1px solid #E2E8F0', paddingBottom: 12 }}>
                Evaluation Form
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#F8FAFC', padding: 16, borderRadius: 10, fontSize: '0.85rem' }}>
                <div><strong>Scholar Name:</strong> {selectedDoc.scholarName}</div>
                <div><strong>Document Title:</strong> {selectedDoc.title}</div>
                <div><strong>Deliverable Type:</strong> {selectedDoc.type}</div>
                <div><strong>Submission Date:</strong> {new Date(selectedDoc.submittedAt).toLocaleString()}</div>
                <div><strong>Research Title:</strong> {selectedDoc.thesisTitle}</div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  Supervisor Feedback & Directives
                </label>
                <textarea 
                  className="form-input" 
                  rows="8" 
                  placeholder="Enter comments, guidelines, or required corrections in detail..." 
                  value={commentText} 
                  onChange={e => setCommentText(e.target.value)}
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, borderTop: '1px solid #E2E8F0', paddingTop: 16 }}>
              <button 
                type="button" 
                onClick={() => handleReviewAction('REVISION')} 
                disabled={reviewLoading} 
                className="btn-outline" 
                style={{ flex: 1, padding: '12px', fontSize: '0.9rem', color: '#DC2626', borderColor: '#FCA5A5', fontWeight: 700 }}
              >
                ✗ Request Revision
              </button>
              <button 
                type="button" 
                onClick={() => handleReviewAction('APPROVE')} 
                disabled={reviewLoading} 
                className="btn-primary" 
                style={{ flex: 1, padding: '12px', fontSize: '0.9rem', background: '#059669', fontWeight: 700 }}
              >
                ✓ Approve Submission
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { paginatedData, renderGridControls, currentPage, pageSize } = useGridControl(
    items,
    ['scholarName', 'title', 'docType']
  );

  return (
    <div className="card">
      <h3 className="card-title">Pending Reviews Queue</h3>
      <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: 20 }}>
        Central assessment desk for review and sign-off on assigned progress reports, drafts, and research outputs.
      </p>

      {loading ? (
        <div className="premium-preloader-container" style={{ padding: '20px' }}>
          <div className="premium-preloader-spinner" style={{ width: '40px', height: '40px', borderWidth: '3px', marginBottom: '12px' }}></div>
          <div className="premium-preloader-text" style={{ fontSize: '0.85rem' }}>Loading pending reviews queue...</div>
        </div>
      ) : (
        <>
          {renderGridControls()}
          {paginatedData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#64748B', background: '#F8FAFC', borderRadius: 12 }}>
              <span>🍃</span> You have no pending documents in your queue. All reviews are up to date!
            </div>
          ) : (
            <div className="file-list">
              <div className="file-header">
                <div style={{ flex: 0.5 }}>S.No.</div>
                <div style={{ flex: 1.5 }}>Scholar</div>
                <div style={{ flex: 2 }}>Document Name</div>
                <div style={{ flex: 1 }}>Category</div>
                <div style={{ flex: 1.5 }}>Submitted Date</div>
                <div style={{ flex: 1, textAlign: 'center' }}>Action</div>
              </div>
              {paginatedData.map((i, idx) => (
                <div key={i._id} className="file-item">
                  <div style={{ flex: 0.5, fontWeight: 600, color: '#6B7280' }}>{(currentPage - 1) * pageSize + idx + 1}</div>
                  <div style={{ flex: 1.5, fontWeight: 700 }}>{i.scholarName}</div>
                  <div style={{ flex: 2, fontSize: '0.9rem', color: '#1E293B' }}>{i.title}</div>
                  <div style={{ flex: 1 }}><span style={{ fontSize: '0.72rem', background: i.docType === 'MILESTONE' ? '#EFF6FF' : '#F5F3FF', color: i.docType === 'MILESTONE' ? '#1E40AF' : '#5B21B6', padding: '3px 8px', borderRadius: 12, fontWeight: 600 }}>{i.docType}</span></div>
                  <div style={{ flex: 1.5, fontSize: '0.82rem', color: '#64748B' }}>{new Date(i.submittedAt).toLocaleString()}</div>
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                    <button onClick={() => setSelectedDoc(i)} className="btn-action" style={{ background: '#133A26' }}>
                      Evaluate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const FacultyDefaultersPage = ({ user, subRole }) => {
  const toast = useToast();
  const [defaulters, setDefaulters] = useState([]);
  const [loading, setLoading] = useState(true);

  const { paginatedData, renderGridControls, currentPage, pageSize } = useGridControl(
    defaulters,
    ['scholarName', 'enrollmentNumber', 'milestoneTitle']
  );

  const fetchDefaulters = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_URL}/milestones/defaulters`, getAuthHeader());
      
      // Filter based on user role
      if (subRole === 'HOD') {
        setDefaulters(data.filter(d => d.scholarDepartment === user.department));
      } else {
        setDefaulters(data.filter(d => d.supervisorId === user._id));
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDefaulters();
  }, [user, subRole]);

  const handleRemind = async (scholarId, scholarName) => {
    if (!scholarId) return toast.warning('No active scholar user ID found for notification dispatch.');
    try {
      await axios.post(`${API_URL}/notifications/create`, {
        recipient: scholarId,
        title: '⚠️ URGENT: Progress Report Overdue',
        message: 'Your mandatory 6-Month Progress Report milestone is overdue. Please submit your report immediately to avoid registration hold.',
        type: 'PENDING_ACTION',
        link: 'overview'
      }, getAuthHeader());
      toast.success(`Reminder notification sent to ${scholarName}!`);
    } catch (err) {
      toast.error('Failed to dispatch reminder.');
    }
  };

  return (
    <div className="card">
      <h3 className="card-title">Progress Report Defaulters</h3>
      <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: 20 }}>
        Active research scholars with overdue progress report submissions (due date has passed and status remains pending).
      </p>

      {loading ? (
        <div className="premium-preloader-container">
          <div className="premium-preloader-spinner"></div>
          <div className="premium-preloader-text">Loading progress report defaulters...</div>
        </div>
      ) : (
        <>
          {renderGridControls()}
          {paginatedData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#64748B', background: '#F8FAFC', borderRadius: 12 }}>
              <span>🍃</span> No progress report defaulters found in your scope. All scholars are up to date!
            </div>
          ) : (
            <div className="file-list">
              <div className="file-header">
                <div style={{ flex: 0.5 }}>S.No.</div>
                <div style={{ flex: 1.5 }}>Scholar</div>
                <div style={{ flex: 1.5 }}>Enrollment Number</div>
                <div style={{ flex: 1.5 }}>Milestone</div>
                <div style={{ flex: 1.5 }}>Due Date</div>
                <div style={{ flex: 1, textAlign: 'center' }}>Action</div>
              </div>
              {paginatedData.map((d, idx) => (
                <div key={d._id} className="file-item">
                  <div style={{ flex: 0.5, fontWeight: 600, color: '#6B7280' }}>{(currentPage - 1) * pageSize + idx + 1}</div>
                  <div style={{ flex: 1.5, fontWeight: 700 }}>{d.scholarName}</div>
                  <div style={{ flex: 1.5, fontSize: '0.9rem', color: '#1E293B' }}>{d.enrollmentNumber}</div>
                  <div style={{ flex: 1.5, fontSize: '0.9rem', color: '#1E293B' }}>{d.milestoneTitle}</div>
                  <div style={{ flex: 1.5, fontSize: '0.82rem', color: '#DC2626', fontWeight: 600 }}>{new Date(d.dueDate).toLocaleDateString()}</div>
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                    <button 
                      onClick={() => handleRemind(d.scholarId, d.scholarName)} 
                      className="btn-action" 
                      style={{ background: '#DC2626', padding: '6px 12px' }}
                    >
                      Remind
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ── Meetings Tab Component ──
const MeetingsTab = ({ user }) => {
  const toast = useToast();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState({});

  const { paginatedData, renderGridControls, currentPage, pageSize } = useGridControl(
    meetings,
    ['scholarId.name', 'department', 'reason', 'time', 'status']
  );

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
      ) : (
        <>
          {renderGridControls()}
          {paginatedData.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#94A3B8' }}>
              <Calendar size={48} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p style={{ margin: 0, fontWeight: 600 }}>No meeting requests found</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem' }}>When scholars propose guidance consultation meetings, they will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {paginatedData.map((meeting, idx) => {
                const statusStyle = getStatusStyle(meeting.status);
                const isInvited = meeting.invitedAttendees?.some(a => (a._id || a) === user?._id);
                const hasAccepted = meeting.attendees?.some(a => (a._id || a) === user?._id);
                const hasRejected = meeting.rejectedAttendees?.some(r => (r._id || r) === user?._id);

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
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <div style={{ position: 'absolute', top: 8, right: 12, background: 'linear-gradient(135deg, #7C3AED 0%, #9061F9 100%)', color: 'white', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)', zIndex: 1 }}>{(currentPage - 1) * pageSize + idx + 1}</div>
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
    </>
  )}
</div>
  );
};

// ── Main Dashboard ──
const FacultyDashboard = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useTabPersistence('sync_faculty_tab', 'overview');
  const { user, fetchMe } = useContext(AuthContext);
  const { allTheses, loading, fetchAssignedTheses, fetchDeptTheses, fetchThesisById, reviewMilestone, drcApprove, scheduleSeminar, seminarClear, finalApprove, clearCoursework, verifyEnrollment, assignSupervisor, forcePreSubmission } = useContext(ThesisContext);
  const [selectedThesisId, setSelectedThesisId] = useState(null);
  const [selectedThesisData, setSelectedThesisData] = useState(null);

  const [isOnboardingOpen, setIsOnboardingOpen] = useState(user && !user.profileCompleted);

  const subRole = user?.role === 'HOD' ? 'HOD' : user?.subRole;

  const handleTabChange = (tab) => {
    if (tab === 'registration' || tab === 'registrations') {
      setActiveTab(subRole === 'HOD' ? 'registrations' : 'scholars');
    } else if (tab === 'documents') {
      setActiveTab('scholars');
    } else {
      setActiveTab(tab);
    }
  };

  useEffect(() => {
    if (subRole === 'HOD') fetchDeptTheses();
    else fetchAssignedTheses();
  }, [subRole]);

  useEffect(() => {
    // Dynamic background update on mount
    fetchMe();
  }, []);

  const handleSelectThesis = async (id) => {
    setSelectedThesisId(id);
    const data = await fetchThesisById(id);
    setSelectedThesisData(data);
  };

  const handleReview = async (milestoneId, action, comment) => {
    await reviewMilestone(milestoneId, action, comment);
    const data = await fetchThesisById(selectedThesisId);
    setSelectedThesisData(data);
  };

  const handleClosePanel = () => {
    setSelectedThesisId(null);
    setSelectedThesisData(null);
    if (subRole === 'HOD') fetchDeptTheses(); else fetchAssignedTheses();
  };

  const handleHODAction = async (fn) => {
    await fn(selectedThesisId);
    const data = await fetchThesisById(selectedThesisId);
    setSelectedThesisData(data);
    if (subRole === 'HOD') fetchDeptTheses(); else fetchAssignedTheses();
  };

  const titles = { overview: 'Faculty Dashboard', registrations: 'Registration Requests', coursework_approvals: 'Coursework Approvals', scholars: 'My Scholars', reviews: 'Pending Reviews', dept: 'Department Scholars', meetings: 'Guidance Consultations & Meetings', requests: 'Student Change Requests Desk', profile: 'My Profile', defaulters: 'Progress Report Defaulters', scholar_search: 'Search Scholar Details', detailed_reports: 'Detailed Academic Reports', public_config: 'Public Portal Config' };

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
      case 'overview': return <OverviewPage theses={allTheses} user={user} onSelect={handleSelectThesis} setActiveTab={handleTabChange} />;
      case 'registrations': return <ScholarList theses={allTheses.filter(t => t.status === 'REGISTRATION_PENDING')} onSelect={handleSelectThesis} title="Scholars Awaiting Registration Approval" subRole={subRole} />;
      case 'coursework_approvals': {
        const pendingTheses = subRole === 'HOD'
          ? allTheses.filter(t => t.status === 'COURSEWORK' && t.courseworkStatus === 'PENDING_HOD')
          : allTheses.filter(t => t.status === 'COURSEWORK' && t.courseworkStatus === 'PENDING_FACULTY');
        return <ScholarList theses={pendingTheses} onSelect={handleSelectThesis} title="Scholars Awaiting Coursework Approval" subRole={subRole} />;
      }
      case 'scholars': return <ScholarList theses={allTheses} onSelect={handleSelectThesis} title="My Assigned Scholars" subRole={subRole} />;
      case 'dept': return <ScholarList theses={allTheses} onSelect={handleSelectThesis} title="All Department Scholars" subRole={subRole} />;
      case 'meetings': return <MeetingsTab user={user} />;
      case 'reviews': return <PendingReviewsQueue theses={allTheses} user={user} />;
      case 'requests': return <HODChangeRequestsTab user={user} />;
      case 'defaulters': return <FacultyDefaultersPage user={user} subRole={subRole} />;
      case 'profile': return <ProfileTab />;
      case 'scholar_search': return <ScholarSearchTab user={user} />;
      case 'detailed_reports': return <DetailedReportsTab user={user} />;
      case 'public_config': return <PublicConfigTab user={user} />;
      default: return <div className="card"><h3 className="card-title">{titles[activeTab]}</h3><p style={{ color: '#6b7280', marginTop: 8 }}>Content coming soon.</p></div>;
    }
  };

  return (
    <div className="app-container">
      <div className="mobile-overlay" onClick={() => document.body.classList.remove('sidebar-mobile-open')} />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} subRole={subRole} isVerified={user?.isVerified} />
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
        
        <Header title={titles[activeTab]} user={user} />
        <div className="dashboard-area" style={{ flex: 1 }}>
          <div className="welcome-banner">
            <div><span className="welcome-text">Welcome, {user?.name || 'Faculty'}!</span><span className="welcome-subtext"> | {subRole === 'HOD' ? 'Head of Department Portal' : 'Supervisor Portal'}</span></div>
            <div className="brand-text">ScholarSync Faculty</div>
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
            if (subRole === 'HOD') fetchDeptTheses(); else fetchAssignedTheses();
          }}
          onSeminar={() => handleHODAction(seminarClear)}
          onFinalApprove={() => handleHODAction(finalApprove)}
          onClearCoursework={() => handleHODAction(clearCoursework)}
          onForcePreSubmission={() => handleHODAction(forcePreSubmission)}
          onVerify={() => handleHODAction(verifyEnrollment)}
          onAssign={(supervisorId) => handleHODAction(() => assignSupervisor(selectedThesisId, supervisorId))}

          subRole={subRole}
          onRefresh={async () => {
            const data = await fetchThesisById(selectedThesisId);
            setSelectedThesisData(data);
            if (subRole === 'HOD') fetchDeptTheses(); else fetchAssignedTheses();
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

export default FacultyDashboard;
