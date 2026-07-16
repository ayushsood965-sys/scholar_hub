import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Book, Flag, FileText, Calendar, User, LogOut, Bell, ClipboardList, CheckCircle2, Clock, Upload, Lock, Award, Edit, File, Layers, Plus, AlertCircle, BookOpen, X, Trash2, UserCheck, Coins, Settings, Users } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { ThesisContext } from '../context/ThesisContext';
import { useToast } from '../context/ToastContext';
import { useThemeStyles } from '../context/ThemeContext';
import StaffProfileTab from '../components/StaffProfileTab';
import NotificationPanel from '../components/NotificationPanel';
import axios from 'axios';
import { API_BASE_URL, API_URL } from '../config';
import ThemeToggle from '../components/ThemeToggle';
import { useTabPersistence } from '../hooks/useTabPersistence';
import MobileBottomNav from '../components/MobileBottomNav';

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

const getMilestoneHistory = (m, thesis) => {
  if (!m) return [];
  
  // If the backend has proper history entries, use them directly
  if (m.history && m.history.length > 0) {
    let hist = [...m.history];
    if (m.type === 'PRE_SUBMISSION') {
      hist = hist.filter(h => !h.remarks?.includes('Seminar') && !h.remarks?.includes('seminar'));
    }
    return hist.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }
  
  // Fallback: history is empty (milestone was processed before history tracking was added).
  // We reconstruct the history list from comments and status.
  const list = [];
  const supervisorId = thesis?.supervisorId?._id || thesis?.supervisorId;

  // Sort comments by time
  const sortedComments = [...(m.comments || [])]
    .filter(c => !c.text?.includes('Seminar') && !c.text?.includes('seminar'))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  // Group comments into cycles
  let currentCycleComments = [];
  const cyclesOfComments = [];

  for (const c of sortedComments) {
    currentCycleComments.push(c);
    const txt = (c.text || '').toLowerCase();
    const isRejection = txt.includes('reject') || txt.includes('revision') || txt.includes('change') || txt.includes('correct') || txt.includes('modify') || txt.includes('work');
    const isHOD = (c.authorName || '').toLowerCase().includes('hod') || (c.authorName || '').toLowerCase().includes('head') || (c.authorName || '').toLowerCase().includes('kumar') || (c.authorName || '').toLowerCase().includes('mahinder');
    
    if (isRejection || (isHOD && !txt.includes('approve') && !txt.includes('ok') && !txt.includes('forward') && !txt.includes('schedule'))) {
      cyclesOfComments.push(currentCycleComments);
      currentCycleComments = [];
    }
  }
  if (currentCycleComments.length > 0) {
    cyclesOfComments.push(currentCycleComments);
  }

  // Build entries for each comments cycle
  cyclesOfComments.forEach((cycleComments, index) => {
    if (cycleComments.length === 0) return;

    const earliestCommentTime = new Date(cycleComments[0].createdAt);
    const virtualSubmitTime = (m.submittedAt && new Date(m.submittedAt) < earliestCommentTime) 
      ? new Date(m.submittedAt) 
      : new Date(earliestCommentTime.getTime() - 5 * 60 * 1000);

    list.push({
      action: 'SUBMITTED',
      actorName: 'Scholar',
      actorRole: 'STUDENT',
      remarks: 'Uploaded package.',
      timestamp: virtualSubmitTime,
      documentUrl: m.documentUrl,
      plagiarismReportUrl: m.plagiarismReportUrl
    });

    cycleComments.forEach(c => {
      const txt = (c.text || '').toLowerCase();
      const isRejection = txt.includes('reject') || txt.includes('revision') || txt.includes('change') || txt.includes('correct') || txt.includes('modify') || txt.includes('work');
      const isHOD = (c.authorName || '').toLowerCase().includes('hod') || (c.authorName || '').toLowerCase().includes('head') || (c.authorName || '').toLowerCase().includes('kumar') || (c.authorName || '').toLowerCase().includes('mahinder');

      let actionLabel = '';
      let role = 'SUPERVISOR';

      if (isHOD) {
        role = 'HOD';
        actionLabel = isRejection ? 'HOD_REJECTED' : 'HOD_APPROVED';
      } else {
        actionLabel = isRejection ? 'SUPERVISOR_REJECTED' : 'SUPERVISOR_APPROVED';
      }

      list.push({
        action: actionLabel,
        actorName: c.authorName,
        actorRole: role,
        remarks: c.text,
        timestamp: new Date(c.createdAt),
        documentUrl: m.documentUrl,
        plagiarismReportUrl: m.plagiarismReportUrl
      });
    });

    const latestCommentTime = new Date(cycleComments[cycleComments.length - 1].createdAt);
    const isLastCycle = index === cyclesOfComments.length - 1;
    const isCurrentlyRejected = ['REVISION_REQUIRED', 'REJECTED_BY_SUPERVISOR', 'REJECTED_BY_HOD'].includes(m.status);
    const needsRejectionEntry = !isLastCycle || isCurrentlyRejected || (isLastCycle && m.submittedAt && new Date(m.submittedAt) > latestCommentTime);

    if (needsRejectionEntry) {
      const hasRejection = cycleComments.some(c => {
        const txt = (c.text || '').toLowerCase();
        return txt.includes('reject') || txt.includes('revision') || txt.includes('change') || txt.includes('correct') || txt.includes('modify') || txt.includes('work');
      });
      if (!hasRejection) {
        list.push({
          action: m.status === 'REJECTED_BY_HOD' ? 'HOD_REJECTED' : (m.status === 'REJECTED_BY_SUPERVISOR' ? 'SUPERVISOR_REJECTED' : 'REVISION_REQUIRED'),
          actorName: m.status === 'REJECTED_BY_HOD' ? 'HOD' : (m.status === 'REJECTED_BY_SUPERVISOR' ? 'Supervisor' : 'Supervisor/HOD'),
          actorRole: m.status === 'REJECTED_BY_HOD' ? 'HOD' : (m.status === 'REJECTED_BY_SUPERVISOR' ? 'SUPERVISOR' : 'FACULTY'),
          remarks: 'Corrections requested.',
          timestamp: m.reviewedAt || m.updatedAt || new Date(latestCommentTime.getTime() + 1000),
          documentUrl: m.documentUrl,
          plagiarismReportUrl: m.plagiarismReportUrl
        });
      }
    }
  });

  const hasComments = m.comments && m.comments.length > 0;
  if (m.submittedAt) {
    const latestCommentTime = hasComments 
      ? new Date([...m.comments].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt))[0].createdAt)
      : null;
    
    if (!latestCommentTime || new Date(m.submittedAt) > latestCommentTime) {
      list.push({
        action: 'SUBMITTED',
        actorName: 'Scholar',
        actorRole: 'STUDENT',
        remarks: 'Uploaded package.',
        timestamp: new Date(m.submittedAt),
        documentUrl: m.documentUrl,
        plagiarismReportUrl: m.plagiarismReportUrl
      });
    }
  }

  // If the milestone is currently APPROVED or VERIFIED, make sure history ends with HOD_APPROVED
  if (m.status === 'APPROVED' || m.status === 'VERIFIED') {
    const hasFinalApproval = list.some(h => h.action === 'HOD_APPROVED' || h.action === 'APPROVED' || h.action === 'COURSEWORK_HOD_APPROVED');
    if (!hasFinalApproval) {
      list.push({
        action: 'HOD_APPROVED',
        actorName: 'HOD',
        actorRole: 'HOD',
        remarks: 'Approved.',
        timestamp: m.reviewedAt || m.updatedAt || new Date(),
        documentUrl: m.documentUrl,
        plagiarismReportUrl: m.plagiarismReportUrl
      });
    }
  }

  return list.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
};

const EvaluationTimelineWrapper = ({ milestone, thesis, titlePrefix, history }) => {
  const [isOpen, setIsOpen] = useState(false);
  const status = milestone.status;
  
  const titleUpper = titlePrefix.toUpperCase();
  const isSingleStage = 
    titleUpper.includes('MEETING') || 
    titleUpper.includes('REALLOCATION') || 
    titleUpper.includes('CHANGE') || 
    titleUpper.includes('DOCUMENT') || 
    titleUpper.includes('DRC') || 
    titleUpper.startsWith('RAC');

  const renderContent = () => {
    if (isSingleStage) {
      const isUnderReview = ['PENDING', 'SUBMITTED', 'SCHEDULED'].includes(status);
      const isRejected = ['REJECTED', 'REJECTED_BY_SUPERVISOR', 'REJECTED_BY_HOD', 'REVISION_REQUIRED', 'UNSATISFACTORY'].includes(status);
      const isApproved = ['APPROVED', 'VERIFIED', 'CLEARED', 'REVIEWED', 'SATISFACTORY'].includes(status);

      let reviewerStatus = 'PENDING';
      if (isUnderReview) reviewerStatus = 'PENDING';
      else if (isRejected) reviewerStatus = 'REJECTED';
      else if (isApproved) reviewerStatus = 'APPROVED';

      let initiatorLabel = `${titlePrefix} Submitted`;
      let reviewerLabel = 'Review & Evaluation';
      let reviewerDescription = 'Awaiting review from the assigned authority.';

      if (titleUpper.includes('MEETING') || titleUpper.includes('DRC') || titleUpper.startsWith('RAC')) {
        initiatorLabel = 'Session Scheduled';
        reviewerLabel = 'Meeting Outcome Recorded';
        reviewerDescription = 'Outcome details and recommendations from the committee.';
      } else if (titleUpper.includes('CHANGE') || titleUpper.includes('REALLOCATION')) {
        initiatorLabel = 'Request Filed';
        reviewerLabel = 'HOD Approval';
        reviewerDescription = 'Head of Department decision on reallocation / modification.';
      } else if (titleUpper.includes('DOCUMENT')) {
        const role = milestone.forwardedRole || 'Recipient';
        initiatorLabel = 'Document Uploaded';
        reviewerLabel = `${role} Verification`;
        reviewerDescription = `Verification and validation of the submitted proof by the ${role.toLowerCase()}.`;
      }

      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Step 1: Initiated */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#10B981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>✓</div>
              <div style={{ width: 2, flex: 1, background: '#10B981', minHeight: 20 }} />
            </div>
            <div style={{ flex: 1, paddingBottom: 8 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E293B' }}>{initiatorLabel}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
                Completed on {milestone.submittedAt || milestone.createdAt || milestone.scheduledDate || milestone.conductedDate ? new Date(milestone.submittedAt || milestone.createdAt || milestone.scheduledDate || milestone.conductedDate).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>
          
          {/* Step 2: Single-level Review */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ 
                width: 24, 
                height: 24, 
                borderRadius: '50%', 
                background: reviewerStatus === 'APPROVED' ? '#10B981' : (reviewerStatus === 'REJECTED' ? '#EF4444' : '#3B82F6'), 
                color: 'white', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '0.8rem', 
                fontWeight: 700 
              }}>
                {reviewerStatus === 'APPROVED' ? '✓' : (reviewerStatus === 'REJECTED' ? '✗' : '2')}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>{reviewerLabel}</span>
                <span style={{ 
                  fontSize: '0.7rem', 
                  padding: '2px 8px', 
                  borderRadius: 4, 
                  fontWeight: 700,
                  background: reviewerStatus === 'APPROVED' ? '#D1FAE5' : (reviewerStatus === 'REJECTED' ? '#FEE2E2' : '#DBEAFE'),
                  color: reviewerStatus === 'APPROVED' ? '#065F46' : (reviewerStatus === 'REJECTED' ? '#991B1B' : '#1E40AF')
                }}>
                  {reviewerStatus === 'APPROVED' ? 'Cleared' : (reviewerStatus === 'REJECTED' ? 'Revision / Reject' : 'Awaiting Review')}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
                {reviewerStatus === 'APPROVED' 
                  ? 'Evaluation marked as cleared and resolved.' 
                  : (reviewerStatus === 'REJECTED' ? 'Corrections / Revision requested.' : reviewerDescription)}
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Two-stage workflow: Student -> Faculty Supervisor -> HOD
    let facultyStatus = 'PENDING'; // PENDING, APPROVED, REJECTED
    let hodStatus = 'LOCKED'; // LOCKED, PENDING, APPROVED, REJECTED
    
    if (status === 'PENDING_HOD' || status === 'UNDER_REVIEW_HOD') {
      facultyStatus = 'APPROVED';
      hodStatus = 'PENDING';
    } else if (status === 'APPROVED' || status === 'VERIFIED') {
      facultyStatus = 'APPROVED';
      hodStatus = 'APPROVED';
    } else if (status === 'REVISION_REQUIRED' || status === 'REJECTED_BY_SUPERVISOR' || status === 'REJECTED_BY_HOD' || status === 'REJECTED') {
      const isHODRejection = status === 'REJECTED_BY_HOD' || status === 'REJECTED';
      if (isHODRejection) {
        facultyStatus = 'APPROVED';
        hodStatus = 'REJECTED';
      } else {
        facultyStatus = 'REJECTED';
        hodStatus = 'LOCKED';
      }
    } else if (status === 'SUBMITTED' || status === 'PENDING') {
      facultyStatus = 'PENDING';
      hodStatus = 'LOCKED';
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Step 1: Submission */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#10B981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>✓</div>
            <div style={{ width: 2, flex: 1, background: '#10B981', minHeight: 20 }} />
          </div>
          <div style={{ flex: 1, paddingBottom: 8 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E293B' }}>{titlePrefix} Submitted</div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
              Submitted on {milestone.submittedAt || milestone.createdAt ? new Date(milestone.submittedAt || milestone.createdAt).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>
        
        {/* Step 2: Faculty Review */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ 
              width: 24, 
              height: 24, 
              borderRadius: '50%', 
              background: facultyStatus === 'APPROVED' ? '#10B981' : (facultyStatus === 'REJECTED' ? '#EF4444' : '#3B82F6'), 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '0.8rem', 
              fontWeight: 700 
            }}>
              {facultyStatus === 'APPROVED' ? '✓' : (facultyStatus === 'REJECTED' ? '✗' : '2')}
            </div>
            <div style={{ width: 2, flex: 1, background: (facultyStatus === 'APPROVED' || hodStatus === 'PENDING' || hodStatus === 'APPROVED') ? '#10B981' : '#E2E8F0', minHeight: 20 }} />
          </div>
          <div style={{ flex: 1, paddingBottom: 8 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>Faculty Supervisor Verification</span>
              <span style={{ 
                fontSize: '0.7rem', 
                padding: '2px 8px', 
                borderRadius: 4, 
                fontWeight: 700,
                background: facultyStatus === 'APPROVED' ? '#D1FAE5' : (facultyStatus === 'REJECTED' ? '#FEE2E2' : '#DBEAFE'),
                color: facultyStatus === 'APPROVED' ? '#065F46' : (facultyStatus === 'REJECTED' ? '#991B1B' : '#1E40AF')
              }}>
                {facultyStatus === 'APPROVED' ? 'Verified' : (facultyStatus === 'REJECTED' ? 'Revision Requested' : 'Awaiting Review')}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
              {facultyStatus === 'APPROVED' 
                ? 'Supervisor has approved and forwarded this package to HOD.' 
                : (facultyStatus === 'REJECTED' ? 'Supervisor requested corrections.' : `Awaiting verification from supervisor (${thesis?.supervisorId?.name || 'Assigned Guide'}).`)}
            </div>
          </div>
        </div>
        
        {/* Step 3: HOD final clearance */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ 
              width: 24, 
              height: 24, 
              borderRadius: '50%', 
              background: hodStatus === 'APPROVED' ? '#10B981' : (hodStatus === 'REJECTED' ? '#EF4444' : (hodStatus === 'LOCKED' ? '#94A3B8' : '#3B82F6')), 
              color: 'white', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '0.8rem', 
              fontWeight: 700 
            }}>
              {hodStatus === 'APPROVED' ? '✓' : (hodStatus === 'REJECTED' ? '✗' : (hodStatus === 'LOCKED' ? '🔒' : '3'))}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>HOD Final Clearance</span>
              <span style={{ 
                fontSize: '0.7rem', 
                padding: '2px 8px', 
                borderRadius: 4, 
                fontWeight: 700,
                background: hodStatus === 'APPROVED' ? '#D1FAE5' : (hodStatus === 'REJECTED' ? '#FEE2E2' : (hodStatus === 'LOCKED' ? '#F1F5F9' : '#DBEAFE')),
                color: hodStatus === 'APPROVED' ? '#065F46' : (hodStatus === 'REJECTED' ? '#991B1B' : (hodStatus === 'LOCKED' ? '#64748B' : '#1E40AF'))
              }}>
                {hodStatus === 'APPROVED' ? 'Approved' : (hodStatus === 'REJECTED' ? 'Revision Requested' : (hodStatus === 'LOCKED' ? 'Locked' : 'Awaiting Clearance'))}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
              {hodStatus === 'APPROVED' 
                ? 'HOD has approved and cleared this deliverable.' 
                : (hodStatus === 'REJECTED' ? 'HOD requested revisions.' : (hodStatus === 'LOCKED' ? 'Awaiting Supervisor verification first.' : 'Awaiting final clearance from Head of Department.'))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ marginTop: 20, borderTop: '1px solid #E2E8F0', paddingTop: 16 }}>
      <style>{`
        @media (max-width: 768px) {
          .history-table table, 
          .history-table tbody, 
          .history-table tr {
            display: block !important;
            width: 100% !important;
          }
          
          .history-table thead {
            display: none !important;
          }
          
          .history-table tr {
            border: 1px solid var(--color-border, #E2E8F0) !important;
            border-radius: 12px !important;
            margin-bottom: 16px !important;
            padding: 16px !important;
            background: var(--color-surface, #FFFFFF) !important;
            box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05)) !important;
          }

          [data-theme='dark'] .history-table tr {
            background: var(--color-surface, #1e1e20) !important;
            border-color: var(--color-border, #2d2d30) !important;
          }
          
          .history-table td {
            border: none !important;
            padding: 8px 0 !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: flex-start !important;
            text-align: right !important;
            border-bottom: 1px dashed var(--color-border, #E2E8F0) !important;
            font-size: 0.85rem !important;
            white-space: normal !important;
          }

          [data-theme='dark'] .history-table td {
            border-bottom-color: var(--color-border, #2d2d30) !important;
          }
          
          .history-table td:last-child {
            border-bottom: none !important;
          }
          
          .history-table td::before {
            content: attr(data-label) ": " !important;
            font-weight: 700 !important;
            color: var(--color-text-secondary, #475569) !important;
            text-align: left !important;
            padding-right: 16px !important;
            flex-shrink: 0 !important;
          }
        }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isOpen ? 12 : 0 }}>
        <h4 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>📊</span> {titlePrefix} Evaluation Progress
        </h4>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-primary, #6366f1)',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={(e) => e.target.style.background = '#F1F5F9'}
          onMouseLeave={(e) => e.target.style.background = 'none'}
        >
          {isOpen ? 'Hide History Logs ▴' : 'View History Logs ▾'}
        </button>
      </div>

      <div style={{
        maxHeight: isOpen ? '2500px' : '0px',
        opacity: isOpen ? 1 : 0,
        overflow: 'hidden',
        transition: 'max-height 0.4s ease-in-out, opacity 0.3s ease-in-out, padding 0.4s ease-in-out',
        paddingTop: isOpen ? 12 : 0
      }}>
        {renderContent()}
        {history && history.length > 0 && renderHistoryTable(history)}
      </div>
    </div>
  );
};

const renderEvaluationTimelineGeneric = (milestone, thesis, titlePrefix = 'Draft', history = null) => {
  if (!milestone || ['DRAFT', 'NOT_SUBMITTED'].includes(milestone.status) || !milestone.status) return null;
  return <EvaluationTimelineWrapper milestone={milestone} thesis={thesis} titlePrefix={titlePrefix} history={history} />;
};

const getPublicationVirtualHistory = (p) => {
  if (!p) return [];
  const list = [
    {
      action: 'SUBMITTED',
      actorName: 'Scholar',
      actorRole: 'STUDENT',
      remarks: `Submitted ${p.type === 'IPR' ? (p.iprType || 'IPR') : p.type}: "${p.title}"`,
      timestamp: p.createdAt,
      documentUrl: p.documentUrl
    }
  ];
  
  if (p.status === 'UNDER_REVIEW_HOD' || p.status === 'VERIFIED' || p.status === 'REJECTED_BY_HOD') {
    list.push({
      action: 'SUPERVISOR_APPROVED',
      actorName: 'Supervisor',
      actorRole: 'SUPERVISOR',
      remarks: 'Verified & forwarded to HOD.',
      timestamp: p.updatedAt
    });
  } else if (p.status === 'REJECTED_BY_SUPERVISOR') {
    list.push({
      action: 'SUPERVISOR_REJECTED',
      actorName: 'Supervisor',
      actorRole: 'SUPERVISOR',
      remarks: p.remarks || 'Revision requested.',
      timestamp: p.updatedAt
    });
  }
  
  if (p.status === 'VERIFIED') {
    list.push({
      action: 'HOD_APPROVED',
      actorName: 'HOD',
      actorRole: 'HOD',
      remarks: p.remarks || 'Cleared by HOD.',
      timestamp: p.updatedAt
    });
  } else if (p.status === 'REJECTED_BY_HOD') {
    list.push({
      action: 'HOD_REJECTED',
      actorName: 'HOD',
      actorRole: 'HOD',
      remarks: p.remarks || 'Revision requested.',
      timestamp: p.updatedAt
    });
  }
  return list;
};

const getChangeRequestVirtualHistory = (r, thesis, faculty = []) => {
  if (!r) return [];
  const list = [
    {
      action: 'SUBMITTED',
      actorName: 'Scholar',
      actorRole: 'STUDENT',
      remarks: `Requested change: Proposed "${r.type === 'GUIDE_CHANGE' ? (faculty.find(f => f._id === r.proposedValue)?.name || 'New Faculty') : r.proposedValue}" for ${r.type?.replace('_', ' ')?.toLowerCase()}`,
      timestamp: r.createdAt
    }
  ];
  if (r.status === 'APPROVED') {
    list.push({
      action: 'HOD_APPROVED',
      actorName: 'HOD',
      actorRole: 'HOD',
      remarks: r.remarks || 'Approved.',
      timestamp: r.updatedAt
    });
  } else if (r.status === 'REJECTED') {
    list.push({
      action: 'HOD_REJECTED',
      actorName: 'HOD',
      actorRole: 'HOD',
      remarks: r.remarks || 'Rejected.',
      timestamp: r.updatedAt
    });
  }
  return list;
};

const getDocumentVirtualHistory = (d) => {
  if (!d) return [];
  const list = [
    {
      action: 'SUBMITTED',
      actorName: 'Scholar',
      actorRole: 'STUDENT',
      remarks: `Uploaded: "${d.title}" - ${d.description || 'No description.'}`,
      timestamp: d.createdAt,
      documentUrl: d.documentUrl
    }
  ];
  if (d.status === 'REVIEWED') {
    list.push({
      action: 'HOD_APPROVED',
      actorName: d.forwardedTo?.name || (d.forwardedRole === 'SUPERVISOR' ? 'Supervisor' : 'HOD'),
      actorRole: d.forwardedRole,
      remarks: d.remarks || 'Reviewed.',
      timestamp: d.updatedAt
    });
  }
  return list;
};

const getMeetingVirtualHistory = (m) => {
  if (!m) return [];
  const list = [
    {
      action: 'SUBMITTED',
      actorName: 'Scholar',
      actorRole: 'STUDENT',
      remarks: `Requested guidance meeting: "${m.reason}"`,
      timestamp: m.createdAt
    }
  ];

  if (m.responseLogs && m.responseLogs.length > 0) {
    m.responseLogs.forEach(log => {
      const u = log.user || {};
      const name = u.name || 'Faculty Member';
      const role = u.subRole || u.role || 'FACULTY';
      list.push({
        action: log.action === 'ACCEPT' ? 'SUPERVISOR_APPROVED' : 'SUPERVISOR_REJECTED',
        actorName: name,
        actorRole: role,
        remarks: log.action === 'ACCEPT' ? 'Accepted the meeting request.' : 'Rejected the meeting request.',
        timestamp: log.timestamp
      });
    });
  }

  const hasResponseLogs = m.responseLogs && m.responseLogs.length > 0;
  if (!hasResponseLogs) {
    if (m.status === 'APPROVED') {
      list.push({
        action: 'HOD_APPROVED',
        actorName: 'Faculty/HOD',
        actorRole: 'FACULTY',
        remarks: m.remarks || 'Accepted meeting request.',
        timestamp: m.updatedAt
      });
    } else if (m.status === 'REJECTED') {
      list.push({
        action: 'HOD_REJECTED',
        actorName: 'Faculty/HOD',
        actorRole: 'FACULTY',
        remarks: m.remarks || 'Rejected meeting request.',
        timestamp: m.updatedAt
      });
    }
  }

  return list.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
};

const getDrcMeetingVirtualHistory = (m) => {
  if (!m) return [];
  const list = [
    {
      action: 'SUBMITTED',
      actorName: 'HOD',
      actorRole: 'HOD',
      remarks: `Scheduled DRC Meeting. Agenda: "${m.agenda || 'N/A'}"`,
      timestamp: m.createdAt
    }
  ];
  if (m.status === 'APPROVED') {
    list.push({
      action: 'HOD_APPROVED',
      actorName: 'DRC Committee',
      actorRole: 'HOD',
      remarks: m.remarks || 'Approved.',
      timestamp: m.updatedAt
    });
  } else if (m.status === 'REVISION_REQUIRED') {
    list.push({
      action: 'HOD_REJECTED',
      actorName: 'DRC Committee',
      actorRole: 'HOD',
      remarks: m.remarks || 'Revision Required.',
      timestamp: m.updatedAt
    });
  }
  return list;
};

const getLastRejectionRemark = (m, thesis) => {
  if (!m) return 'Corrections requested.';
  const hist = getMilestoneHistory(m, thesis);
  const lastRejection = [...hist].reverse().find(h => h.action.includes('REJECTED') || h.action === 'REVISION_REQUIRED' || h.action.includes('REJECT'));
  if (lastRejection && lastRejection.remarks && !['ok', 'approved', 'yes'].includes(lastRejection.remarks.toLowerCase().trim())) {
    return `"${lastRejection.remarks.trim()}" — ${lastRejection.actorName} (${lastRejection.actorRole})`;
  }
  // Try finding a comment that looks like a rejection
  const revComment = [...(m.comments || [])].reverse().find(c => {
    const txt = (c.text || '').toLowerCase();
    return txt.includes('reject') || txt.includes('revision') || txt.includes('change') || txt.includes('correct') || txt.includes('modify') || txt.includes('work') || txt.includes('update') || txt.includes('fix');
  });
  if (revComment) {
    return `"${revComment.text.trim()}" — ${revComment.authorName}`;
  }
  return 'Supervisor/HOD has requested corrections.';
};

const getRegistrationHistory = (thesis) => {
  if (!thesis) return [];
  if (thesis.registrationHistory && thesis.registrationHistory.length > 0) {
    return thesis.registrationHistory;
  }
  // Virtual fallback
  const list = [
    {
      action: 'REGISTRATION_SUBMITTED',
      actorName: 'Scholar',
      actorRole: 'STUDENT',
      remarks: 'Submitted profile details for HOD registration approval.',
      timestamp: thesis.createdAt
    }
  ];
  if (thesis.status !== 'REGISTRATION_PENDING' && thesis.status !== 'REJECTED') {
    list.push({
      action: 'REGISTRATION_APPROVED',
      actorName: 'HOD',
      actorRole: 'HOD',
      remarks: 'Profile verified and registration approved.',
      timestamp: thesis.updatedAt
    });
  } else if (thesis.status === 'REJECTED') {
    list.push({
      action: 'REGISTRATION_REJECTED',
      actorName: 'HOD',
      actorRole: 'HOD',
      remarks: 'Profile verification rejected.',
      timestamp: thesis.updatedAt
    });
  }
  return list;
};

const splitIntoCycles = (history) => {
  if (!history || history.length === 0) return [];
  const sorted = [...history].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const cycles = [];
  let current = [];
  const terminalActions = ['SUPERVISOR_REJECTED', 'HOD_REJECTED', 'REVISION_REQUIRED', 'HOD_APPROVED', 'APPROVED', 'COURSEWORK_FACULTY_REJECTED', 'COURSEWORK_HOD_REJECTED', 'COURSEWORK_HOD_APPROVED', 'REGISTRATION_APPROVED', 'REGISTRATION_REJECTED'];
  const startActions = ['SUBMITTED', 'COURSEWORK_SUBMITTED', 'REGISTRATION_SUBMITTED'];
  
  for (const entry of sorted) {
    if (startActions.includes(entry.action) && current.length > 0) {
      cycles.push(current);
      current = [];
    }
    current.push(entry);
    if (terminalActions.includes(entry.action)) {
      cycles.push(current);
      current = [];
    }
  }
  if (current.length > 0) cycles.push(current);
  return cycles;
};

const getActionDisplayName = (action) => {
  const a = (action || '').toUpperCase();
  if (a === 'SUBMITTED' || a === 'COURSEWORK_SUBMITTED' || a === 'REGISTRATION_SUBMITTED') {
    return 'Submitted';
  }
  if (a === 'SUPERVISOR_APPROVED' || a === 'COURSEWORK_FACULTY_APPROVED') {
    return 'Approved by Supervisor / Pending at HOD for approval';
  }
  if (a === 'SUPERVISOR_REJECTED' || a === 'COURSEWORK_FACULTY_REJECTED') {
    return 'Rejected by Supervisor';
  }
  if (a === 'HOD_APPROVED' || a === 'APPROVED' || a === 'COURSEWORK_HOD_APPROVED' || a === 'REGISTRATION_APPROVED') {
    return 'Approved by HOD';
  }
  if (a === 'HOD_REJECTED' || a === 'REVISION_REQUIRED' || a === 'COURSEWORK_HOD_REJECTED' || a === 'REGISTRATION_REJECTED') {
    return 'Rejected by HOD';
  }
  return action;
};

const renderHistoryRow = (h, i, total) => {
  let badgeColor = '#64748B';
  let badgeBg = '#F1F5F9';
  if (h.action.includes('APPROVED') || h.action === 'APPROVED' || h.action.includes('CLEARED')) {
    badgeColor = '#059669';
    badgeBg = '#ECFDF5';
  } else if (h.action.includes('REJECTED') || h.action === 'REVISION_REQUIRED' || h.action.includes('REJECT')) {
    badgeColor = '#DC2626';
    badgeBg = '#FEF2F2';
  } else if (h.action === 'SUBMITTED' || h.action === 'COURSEWORK_SUBMITTED') {
    badgeColor = '#2563EB';
    badgeBg = '#EFF6FF';
  }
  
  const files = [];
  if (h.documentUrl) {
    const name = h.fileName || (h.documentUrl.toLowerCase().includes('plagiarism') ? 'Plagiarism Report' : 'Draft Thesis');
    files.push(
      <a key="doc" href={`${API_BASE_URL || ''}${h.documentUrl}`} target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB', textDecoration: 'underline', marginRight: 8, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
        📄 {name}
      </a>
    );
  }
  if (h.plagiarismReportUrl) {
    files.push(
      <a key="plag" href={`${API_BASE_URL || ''}${h.plagiarismReportUrl}`} target="_blank" rel="noopener noreferrer" style={{ color: '#EA580C', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
        📊 Plagiarism
      </a>
    );
  }

  return (
    <tr key={i} style={{ borderBottom: i < total - 1 ? '1px solid #F1F5F9' : 'none' }}>
      <td data-label="Time" style={{ padding: '10px 12px', color: '#64748B', whiteSpace: 'nowrap' }}>
        {new Date(h.timestamp).toLocaleString()}
      </td>
      <td data-label="User" style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
        {h.actorName} <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#64748B' }}>({h.actorRole})</span>
      </td>
      <td data-label="Action" style={{ padding: '10px 12px' }}>
        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700, color: badgeColor, backgroundColor: badgeBg }}>
          {getActionDisplayName(h.action)}
        </span>
      </td>
      <td data-label="Remarks" style={{ padding: '10px 12px', color: 'var(--color-text-secondary)', fontStyle: 'italic', maxWidth: '300px', wordBreak: 'break-word' }}>
        "{h.remarks || 'No remarks.'}"
      </td>
      <td data-label="Files" style={{ padding: '10px 12px' }}>
        {files.length > 0 ? files : <span style={{ color: 'var(--color-text-muted)' }}>N/A</span>}
      </td>
    </tr>
  );
};

const renderHistoryTable = (history) => {
  if (!history || history.length === 0) return null;
  
  const cycles = splitIntoCycles(history);
  
  return (
    <div style={{ marginTop: 24, borderTop: '1px solid #E2E8F0', paddingTop: 20 }}>
      <h5 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>📜</span> Submission & Review History Logs
      </h5>
      {[...cycles].reverse().map((cycle, ci) => {
        const cycleNum = cycles.length - ci;
        const lastEntry = cycle[cycle.length - 1];
        const isRejected = lastEntry && (lastEntry.action.includes('REJECTED') || lastEntry.action === 'REVISION_REQUIRED');
        const isApproved = lastEntry && (lastEntry.action.includes('APPROVED') || lastEntry.action === 'APPROVED');
        const outcomeColor = isRejected ? '#DC2626' : isApproved ? '#059669' : '#2563EB';
        const outcomeBg = isRejected ? '#FEF2F2' : isApproved ? '#ECFDF5' : '#EFF6FF';
        const outcomeText = isRejected ? 'Rejected' : isApproved ? 'Approved' : 'In Progress';
        
        return (
          <div key={ci} style={{ marginBottom: 16, borderRadius: 8, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
            <div style={{ background: outcomeBg, padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)' }}>
              <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1E293B' }}>Submission #{cycleNum}</span>
              <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700, color: outcomeColor, background: 'rgba(255,255,255,0.7)' }}>
                {outcomeText}
              </span>
            </div>
            <div className="history-table" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left', background: 'var(--color-surface)' }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Timestamp</th>
                    <th style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>User</th>
                    <th style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Action</th>
                    <th style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Remarks</th>
                    <th style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Files</th>
                  </tr>
                </thead>
                <tbody>
                  {cycle.map((h, i) => renderHistoryRow(h, i, cycle.length))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const MilestoneTimeline = ({ thesis, milestones = [] }) => {
  const [drcMeetings, setDrcMeetings] = useState([]);
  const [racSessions, setRacSessions] = useState([]);
  const theme = useThemeStyles();

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
        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
      const approvedCount = reports.filter(r => r.status === 'VERIFIED').length;
      
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
            ? `Revisions required: ${getLastRejectionRemark(preMilestone, thesis)}`
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
    <div className="card" style={{ padding: '24px 20px', background: 'var(--color-surface)', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid var(--color-border)', marginBottom: '16px' }}>
      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>🎓 Ph.D. Research Progression Timeline</span>
      </h3>
      
      {/* Desktop view: Horizontal timeline bar */}
      <div className="desktop-timeline-view" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', overflowX: 'auto', paddingBottom: '10px', gap: '12px' }}>
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

      {/* Mobile view: Vertical list of cards */}
      <div className="mobile-timeline-view" style={{ flexDirection: 'column', gap: '12px', width: '100%' }}>
        {PHASES.map((phase, idx) => {
          const isCompleted = idx < activeStepIndex;
          const isActive = idx === activeStepIndex;
          const isPending = idx > activeStepIndex;

          let cardBg = '#FFFFFF';
          let borderStyle = '1px solid #E2E8F0';
          let indicatorBg = '#E2E8F0';
          let indicatorColor = '#64748B';
          let titleColor = '#475569';
          let descColor = '#94A3B8';
          let shadow = 'none';

          if (isCompleted) {
            cardBg = '#F0FDF4';
            borderStyle = '1px solid #BBF7D0';
            indicatorBg = '#10B981';
            indicatorColor = '#FFFFFF';
            titleColor = '#166534';
            descColor = '#15803D';
          } else if (isActive) {
            cardBg = '#EFF6FF';
            borderStyle = '1px solid #BFDBFE';
            indicatorBg = '#3B82F6';
            indicatorColor = '#FFFFFF';
            titleColor = '#1E40AF';
            descColor = '#2563EB';
            shadow = '0 4px 12px rgba(59, 130, 246, 0.08)';
          }

          return (
            <div
              key={phase.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '12px 16px',
                background: cardBg,
                border: borderStyle,
                borderRadius: '12px',
                boxShadow: shadow,
                transition: 'all 0.3s ease',
                position: 'relative',
                boxSizing: 'border-box'
              }}
            >
              {/* Left Indicator */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: indicatorBg,
                color: indicatorColor,
                fontWeight: 'bold',
                fontSize: '0.8rem',
                flexShrink: 0
              }}>
                {isCompleted ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                ) : (
                  idx + 1
                )}
              </div>

              {/* Text Info */}
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: isActive ? 800 : 700, color: titleColor, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {phase.label}
                  {isActive && (
                    <span style={{ fontSize: '0.6rem', fontWeight: 800, padding: '2px 6px', background: '#DBEAFE', color: '#1E40AF', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Current
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.7rem', color: descColor, marginTop: '2px' }}>
                  {phase.desc}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Dynamic Detailed Sub-Progression Checklist */}
      {renderDetailedSubProgression()}
    </div>
  );
};

const studentNavItems = [
  { kind: 'section', label: '📊 General' },
  { key: 'overview', label: 'Dashboard', Icon: Home },
  { key: 'profile', label: 'Profile', Icon: User },

  { kind: 'section', label: '🌱 Early Stage' },
  { key: 'workspace', label: 'Workspace', Icon: Flag },
  { key: 'coursework', label: 'Coursework', Icon: BookOpen },
  { key: 'synopsis', label: 'Synopsis', Icon: ClipboardList },

  { kind: 'section', label: '🔬 Research & Progress' },
  { key: 'rac', label: 'RAC Progress', Icon: Layers },
  { key: 'sixMonthReports', label: '6-Month Reports', Icon: Calendar },
  { key: 'chapterDrafts', label: 'Chapter Drafts', Icon: FileText },
  { key: 'publications', label: 'Research Outputs', Icon: Award },
  { key: 'funding', label: 'My Funding & Lab', Icon: Coins },
  { key: 'meetings', label: 'Meetings', Icon: Calendar },

  { kind: 'section', label: '🎓 Thesis Submission' },
  { key: 'preSubmission', label: 'Pre-Submission', Icon: ClipboardList },
  { key: 'finalSubmission', label: 'Final Submission', Icon: BookOpen },

  { kind: 'section', label: '📋 Requests & Certificates' },
  { key: 'changes', label: 'Request Changes', Icon: Edit },
  { key: 'documents', label: 'Documents', Icon: FileText },
  { key: 'certificates', label: 'Certificates', Icon: Award },
];

const Sidebar = ({ activeTab, setActiveTab, isVerified, thesis, milestones }) => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const items = studentNavItems;
  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <img src="/hpu_logo.png" alt="HPU Logo" style={{ width: 42, height: 42, objectFit: 'contain' }} />
        </div>
        <h2>Scholar Sync</h2>
      </div>
      <div className="sidebar-nav" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 160px)' }}>
        {items.map((item) => {
          if (item.kind === 'section') {
            return (
              <div key={item.label} className="sidebar-section-label">
                {item.label}
              </div>
            );
          }
          const { key, label, Icon } = item;
          const disabled = (() => {
            if (key === 'profile' || key === 'overview') return false;
            if (!thesis || thesis.status === 'REGISTRATION_PENDING' || thesis.status === 'REJECTED') return true;
            
            const status = thesis.status;
            if (key === 'overview') return false;
            if (key === 'workspace' || key === 'certificates') {
              return !['COURSEWORK', 'SYNOPSIS_PENDING', 'ACTIVE_RESEARCH', 'PRE_SUBMISSION', 'THESIS_SUBMITTED', 'PENDING_SUPERVISOR', 'PENDING_HOD', 'SUBMITTED', 'AWARDED'].includes(status);
            }
            if (key === 'coursework') {
              return !['COURSEWORK', 'SYNOPSIS_PENDING', 'ACTIVE_RESEARCH', 'PRE_SUBMISSION', 'THESIS_SUBMITTED', 'PENDING_SUPERVISOR', 'PENDING_HOD', 'SUBMITTED', 'AWARDED'].includes(status);
            }
            if (key === 'synopsis') {
              const hasSynopsisMilestone = milestones && milestones.some(m => m.type === 'SYNOPSIS');
              return !(['SYNOPSIS_PENDING', 'ACTIVE_RESEARCH', 'PRE_SUBMISSION', 'THESIS_SUBMITTED', 'PENDING_SUPERVISOR', 'PENDING_HOD', 'SUBMITTED', 'AWARDED'].includes(status) || hasSynopsisMilestone);
            }
            if ([
              'rac', 
              'sixMonthReports', 
              'chapterDrafts', 
              'publications', 
              'funding',
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
              const isCleared = thesis.preSubmissionSeminar?.status === 'CLEARED';
              return !(isCleared || ['THESIS_SUBMITTED', 'PENDING_SUPERVISOR', 'PENDING_HOD', 'SUBMITTED', 'AWARDED'].includes(status));
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
        <button className="nav-item" onClick={() => { window.location.href = "/logout-bridge?toast=Logged%20out%20successfully"; }}
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
        <ThemeToggle style={{ marginRight: '8px', color: 'var(--color-text-secondary)' }} />
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
              color: 'var(--color-text-secondary)'
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
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                zIndex: 99999,
                overflow: 'hidden',
                textAlign: 'left'
              }}
            >
              {/* Dropdown Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
                <span style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                  <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
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
                          borderBottom: '1px solid var(--color-border)',
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
                            <span style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>
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
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>You must complete your thesis registration before accessing the research portal.</p>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Enrollment Number *</label>
            <input className="form-input" name="enrollmentNumber" value={form.enrollmentNumber} onChange={handle} placeholder="e.g., 2024-CS-001" required />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Department *</label>
            <select className="form-input" name="department" value={form.department} disabled style={{ background: 'var(--color-bg)', color: '#64748B' }}>
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

// ── My Funding & Lab Tab ──
const MyFundingAndLabTab = ({ thesis }) => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [awards, setAwards] = useState([]);
  const [lab, setLab] = useState(null);

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [awardsRes, labsRes] = await Promise.all([
          axios.get(`${API_URL}/public/dashboard/scholar/funding`, getAuthHeader()),
          axios.get(`${API_URL}/public/labs`, getAuthHeader())
        ]);
        setAwards(awardsRes.data || []);
        
        const myLab = labsRes.data.find(l => 
          l.members?.some(m => (m._id || m) === user._id) || 
          (l.leadId?._id || l.leadId) === thesis.supervisorId?._id
        );
        if (myLab) {
          const detailRes = await axios.get(`${API_URL}/public/labs/${myLab._id}`);
          setLab(detailRes.data);
        }
      } catch (err) {
        console.error('Error fetching student funding/lab data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, thesis]);

  if (loading) {
    return (
      <div className="premium-preloader-container" style={{ padding: '40px 0' }}>
        <div className="premium-preloader-spinner"></div>
        <div className="premium-preloader-text">Loading funding and lab allocation details...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Funding Awards */}
      <div className="card" style={{ padding: '24px', background: 'var(--color-surface)' }}>
        <h3 className="card-title" style={{ marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#133A26' }}>
          <Coins size={20} /> My Fellowships & Grants
        </h3>

        {awards.length === 0 ? (
          <div style={{ padding: '16px', background: 'var(--color-bg)', borderRadius: '8px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            No active fellowship awards mapped to your profile. Please contact the HOD/Admin if you are receiving JRF/SRF/HIMCOSTE funding.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {awards.map(award => (
              <div key={award._id} style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '18px', background: 'var(--color-bg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontWeight: 700, color: 'var(--color-text-primary)' }}>{award.awardTitle}</h4>
                    <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                      Scheme Linked: <strong>{award.fundingOpportunityId?.title || 'Direct Award'}</strong> ({award.fundingOpportunityId?.agency || 'HPU'})
                    </p>
                  </div>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    background: award.status === 'ACTIVE' ? '#D1FAE5' : award.status === 'PENDING_RENEWAL' ? '#FEF3C7' : '#F3F4F6',
                    color: award.status === 'ACTIVE' ? '#065F46' : award.status === 'PENDING_RENEWAL' ? '#D97706' : '#374151',
                    padding: '3px 10px', 
                    borderRadius: '12px',
                    fontWeight: 700
                  }}>
                    {award.status}
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginTop: '14px', fontSize: '0.82rem', color: 'var(--color-text-secondary)', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                  <div>💰 <strong>Monthly Stipend / Amount:</strong> {award.amountSanctioned}</div>
                  <div>💰 <strong>Total Disbursed:</strong> {award.amountDisbursed || '₹0'}</div>
                  <div>📅 <strong>Start Date:</strong> {award.startDate ? new Date(award.startDate).toLocaleDateString() : 'N/A'}</div>
                  <div>📅 <strong>End Date:</strong> {award.endDate ? new Date(award.endDate).toLocaleDateString() : 'N/A'}</div>
                </div>

                {award.remarks && (
                  <div style={{ marginTop: '12px', fontSize: '0.8rem', fontStyle: 'italic', color: '#059669', background: '#ECFDF5', padding: '8px 12px', borderRadius: '6px' }}>
                    <strong>Note:</strong> {award.remarks}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lab Allocation */}
      <div className="card" style={{ padding: '24px', background: 'var(--color-surface)' }}>
        <h3 className="card-title" style={{ marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#133A26' }}>
          <Users size={20} /> My Research Lab & Group
        </h3>

        {!lab ? (
          <div style={{ padding: '16px', background: 'var(--color-bg)', borderRadius: '8px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            You are not currently allocated to a registered departmental research lab. Ask your supervisor (PI Lead) to add you via the admin panel.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#133A26' }}>{lab.name}</h4>
                <span style={{ fontSize: '0.72rem', background: '#E0F2FE', color: '#0369A1', padding: '3px 10px', borderRadius: '12px', fontWeight: 700 }}>{lab.labType}</span>
              </div>
              <p style={{ margin: '6px 0 0', fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
                📍 Location: <strong>{lab.location || 'N/A'}</strong> | P.I. Supervisor: <strong>{lab.leadId?.name || 'Faculty'}</strong>
              </p>
              {lab.website && (
                <a href={lab.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: '#133A26', display: 'inline-block', marginTop: '6px', textDecoration: 'none', fontWeight: 600 }}>
                  🌐 Visit Lab Website ➔
                </a>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '20px', alignItems: 'start' }}>
              
              {/* Lab Focus & Members */}
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', display: 'block', marginBottom: '4px' }}>Lab Research Focus:</strong>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{lab.focus}</p>
                </div>

                <div>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', display: 'block', marginBottom: '8px' }}>Lab Members ({lab.members?.length || 0}):</strong>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {lab.members?.map(m => (
                      <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                        <div style={{ width: '28px', height: '28px', background: '#94A3B8', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem' }}>
                          {m.name?.charAt(0)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>{m.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Shared Equipment */}
              <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px' }}>
                <strong style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', display: 'block', marginBottom: '10px' }}>Instruments & Equipment:</strong>
                {(!lab.equipment || lab.equipment.length === 0) ? (
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>No lab equipment logged.</span>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {lab.equipment.map((eq, idx) => (
                      <div key={idx} style={{ fontSize: '0.76rem', background: 'var(--color-surface)', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                        <div style={{ fontWeight: 700, color: 'var(--color-text-primary)' }}>{eq.name}</div>
                        {eq.isShared && <span style={{ fontSize: '0.6rem', color: '#065F46', background: '#D1FAE5', padding: '1px 4px', borderRadius: '3px', fontWeight: 700 }}>SHARED</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </div>

    </div>
  );
};

// ── Waiting Room ──
const WaitingRoom = ({ thesis }) => (
  <div className="card" style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', padding: 48 }}>
    <Clock size={64} color="#F59E0B" style={{ margin: '0 auto 16px' }} />
    <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>Awaiting Admin Verification</h3>
    <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>Your registration has been submitted. The admin will verify your enrollment and assign a supervisor. All uploads are locked until verification is complete.</p>
    <div style={{ background: '#FEF3C7', borderRadius: 12, padding: 16, textAlign: 'left', marginBottom: 24 }}>
      <div style={{ fontWeight: 600, marginBottom: 8, color: '#92400E' }}>Submitted Details:</div>
      <div style={{ fontSize: '0.9rem', color: '#78350F' }}>
        <div>📋 Enrollment: <strong>{thesis.enrollmentNumber}</strong></div>
        <div>🏛 Department: <strong>{thesis.department}</strong></div>
        <div>📌 Title: <strong>{thesis.title}</strong></div>
      </div>
    </div>

    {renderHistoryTable(getRegistrationHistory(thesis))}

    <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
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
      : []
  );

  const renderCourseworkTimeline = () => {
    const status = thesis.courseworkStatus || 'NOT_SUBMITTED';
    if (status === 'NOT_SUBMITTED') return null;

    let facultyStatus = 'PENDING';
    let hodStatus = 'LOCKED';

    if (status === 'PENDING_HOD') {
      facultyStatus = 'APPROVED';
      hodStatus = 'PENDING';
    } else if (status === 'APPROVED') {
      facultyStatus = 'APPROVED';
      hodStatus = 'APPROVED';
    } else if (status === 'REVISION_REQUIRED' || status === 'REJECTED') {
      const auditLog = thesis.auditLog || [];
      const courseworkRejections = auditLog.filter(l => l.action === 'COURSEWORK_FACULTY_REJECTED' || l.action === 'COURSEWORK_HOD_REJECTED');
      const lastRejection = courseworkRejections.length > 0 ? courseworkRejections[courseworkRejections.length - 1] : null;
      
      const isSupervisorComment = lastRejection && lastRejection.action === 'COURSEWORK_FACULTY_REJECTED';
      if (isSupervisorComment) {
        facultyStatus = 'REJECTED';
        hodStatus = 'LOCKED';
      } else {
        facultyStatus = 'APPROVED';
        hodStatus = 'REJECTED';
      }
    } else if (status === 'PENDING_FACULTY') {
      facultyStatus = 'PENDING';
      hodStatus = 'LOCKED';
    }

    const cwLogs = (thesis.auditLog || []).filter(l => [
      'COURSEWORK_SUBMITTED', 
      'COURSEWORK_FACULTY_APPROVED', 
      'COURSEWORK_FACULTY_REJECTED', 
      'COURSEWORK_HOD_APPROVED', 
      'COURSEWORK_HOD_REJECTED'
    ].includes(l.action));

    return (
      <div style={{ marginTop: 28, borderTop: '1px solid #E2E8F0', paddingTop: 20 }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>📊</span> Evaluation Progress Timeline
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Step 1: Submission */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#10B981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>✓</div>
              <div style={{ width: 2, flex: 1, background: '#10B981', minHeight: 20 }} />
            </div>
            <div style={{ flex: 1, paddingBottom: 8 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E293B' }}>Coursework Details Submitted</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
                Upload proof and marks sheet recorded.
              </div>
            </div>
          </div>
          
          {/* Step 2: Faculty Supervisor Review */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ 
                width: 24, 
                height: 24, 
                borderRadius: '50%', 
                background: facultyStatus === 'APPROVED' ? '#10B981' : (facultyStatus === 'REJECTED' ? '#EF4444' : '#3B82F6'), 
                color: 'white', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '0.8rem', 
                fontWeight: 700 
              }}>
                {facultyStatus === 'APPROVED' ? '✓' : (facultyStatus === 'REJECTED' ? '✗' : '2')}
              </div>
              <div style={{ width: 2, flex: 1, background: (facultyStatus === 'APPROVED' || hodStatus === 'PENDING' || hodStatus === 'APPROVED') ? '#10B981' : '#E2E8F0', minHeight: 20 }} />
            </div>
            <div style={{ flex: 1, paddingBottom: 8 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Faculty Supervisor Verification</span>
                <span style={{ 
                  fontSize: '0.7rem', 
                  padding: '2px 8px', 
                  borderRadius: 4, 
                  fontWeight: 700,
                  background: facultyStatus === 'APPROVED' ? '#D1FAE5' : (facultyStatus === 'REJECTED' ? '#FEE2E2' : '#DBEAFE'),
                  color: facultyStatus === 'APPROVED' ? '#065F46' : (facultyStatus === 'REJECTED' ? '#991B1B' : '#1E40AF')
                }}>
                  {facultyStatus === 'APPROVED' ? 'Verified' : (facultyStatus === 'REJECTED' ? 'Revision Requested' : 'Awaiting Review')}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
                {facultyStatus === 'APPROVED' 
                  ? 'Supervisor has approved and forwarded coursework to the HOD.' 
                  : (facultyStatus === 'REJECTED' ? 'Supervisor/HOD requested corrections.' : `Awaiting verification from supervisor (${thesis.supervisorId?.name || 'Assigned Guide'}).`)}
              </div>
            </div>
          </div>
          
          {/* Step 3: HOD Final Clearance */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ 
                width: 24, 
                height: 24, 
                borderRadius: '50%', 
                background: hodStatus === 'APPROVED' ? '#10B981' : (hodStatus === 'REJECTED' ? '#EF4444' : (hodStatus === 'LOCKED' ? '#94A3B8' : '#3B82F6')), 
                color: 'white', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '0.8rem', 
                fontWeight: 700 
              }}>
                {hodStatus === 'APPROVED' ? '✓' : (hodStatus === 'REJECTED' ? '✗' : (hodStatus === 'LOCKED' ? '🔒' : '3'))}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>HOD Final Clearance</span>
                <span style={{ 
                  fontSize: '0.7rem', 
                  padding: '2px 8px', 
                  borderRadius: 4, 
                  fontWeight: 700,
                  background: hodStatus === 'APPROVED' ? '#D1FAE5' : (hodStatus === 'REJECTED' ? '#FEE2E2' : (hodStatus === 'LOCKED' ? '#F1F5F9' : '#DBEAFE')),
                  color: hodStatus === 'APPROVED' ? '#065F46' : (hodStatus === 'REJECTED' ? '#991B1B' : (hodStatus === 'LOCKED' ? '#64748B' : '#1E40AF'))
                }}>
                  {hodStatus === 'APPROVED' ? 'Approved' : (hodStatus === 'REJECTED' ? 'Revision Requested' : (hodStatus === 'LOCKED' ? 'Locked' : 'Awaiting Clearance'))}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
                {hodStatus === 'APPROVED' 
                  ? 'HOD has cleared coursework. Proceeding to synopsis phase.' 
                  : (hodStatus === 'REJECTED' ? 'HOD requested revisions.' : (hodStatus === 'LOCKED' ? 'Awaiting Supervisor verification first.' : 'Awaiting final clearance from Head of Department.'))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Remarks/Audit History */}
        {cwLogs.length > 0 && (
          <div style={{ marginTop: 20, background: 'var(--color-bg)', padding: 14, borderRadius: 8, border: '1px solid var(--color-border)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 8 }}>💬 Coursework Review remarks log:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cwLogs.map((l, i) => (
                <div key={i} style={{ fontSize: '0.8rem', borderBottom: i < cwLogs.length - 1 ? '1px dashed #E2E8F0' : 'none', paddingBottom: i < cwLogs.length - 1 ? 8 : 0 }}>
                  <span style={{ fontWeight: 700, color: '#1E293B' }}>{l.action?.replace('COURSEWORK_', '')?.replace('_', ' ')?.toLowerCase()}: </span>
                  <span style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>{l.note}</span>
                  {l.timestamp && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                      {new Date(l.timestamp).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

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
      setter(getter.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Pre-validation
    const checkSection = (sectionRows, name) => {
      for (const row of sectionRows) {
        if (!row.subjectName.trim()) {
          throw new Error(`Subject Name is required in all active rows of ${name}.`);
        }
        const obtained = Number(row.marksObtained);
        const max = Number(row.maxMarks);
        if (isNaN(obtained) || obtained < 0) {
          throw new Error(`Valid Marks Obtained is required in all active rows of ${name}.`);
        }
        if (isNaN(max) || max <= 0) {
          throw new Error(`Valid Maximum Marks (greater than 0) is required in all active rows of ${name}.`);
        }
        if (obtained > max) {
          throw new Error(`Marks Obtained (${obtained}) cannot exceed Maximum Marks (${max}) in ${name}.`);
        }
        if (!row.examinationMonthYear) {
          throw new Error(`Examination Month & Year is required in all active rows of ${name}.`);
        }
      }
    };

    try {
      if (researchEthics.length === 0) {
        throw new Error('At least one entry is required in Research and Publication Ethics.');
      }
      if (researchMethodology.length === 0) {
        throw new Error('At least one entry is required in Research Methodology.');
      }
      if (elective.length === 0) {
        throw new Error('At least one entry is required in Discipline-Specific Elective Course.');
      }

      checkSection(researchEthics, 'Research and Publication Ethics');
      checkSection(researchMethodology, 'Research Methodology');
      checkSection(elective, 'Discipline-Specific Elective Course');
      checkSection(others, 'Others (Optional)');

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
    if (thesis.courseworkStatus === 'APPROVED') {
      return (
        <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: 16, borderRadius: 12, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <CheckCircle2 size={24} />
          <div>
            <div style={{ fontWeight: 600 }}>Coursework Verified & Approved</div>
            <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Your coursework results have been successfully verified and approved by HOD. Coursework phase is locked.</div>
          </div>
        </div>
      );
    }
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
        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#374151', marginBottom: 8, borderBottom: '1px solid var(--color-border)', paddingBottom: 4 }}>{title}</h4>
        <div style={{ background: '#F9FAFB', borderRadius: 8, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: '#F3F4F6', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px' }}>Subject Name</th>
                <th style={{ padding: '8px 12px' }}>Subject Code</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Marks Obtained</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Max Marks</th>
                <th style={{ padding: '8px 12px', textAlign: 'center' }}>Exam Month & Year</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '8px 12px', color: 'var(--color-text-primary)' }}>{row.subjectName}</td>
                  <td style={{ padding: '8px 12px', color: 'var(--color-text-primary)' }}>{row.subjectCode || '-'}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--color-text-primary)' }}>{row.marksObtained}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--color-text-primary)' }}>{row.maxMarks}</td>
                  <td style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--color-text-primary)' }}>{formatMonthYear(row.examinationMonthYear)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderEditableSection = (title, section, items) => {
    const sectionMeta = {
      researchEthics: {
        color: '#3B82F6',
        bgLight: 'rgba(59, 130, 246, 0.02)',
        icon: '⚖️',
        title: 'Research and Publication Ethics'
      },
      researchMethodology: {
        color: '#8B5CF6',
        bgLight: 'rgba(139, 92, 246, 0.02)',
        icon: '📊',
        title: 'Research Methodology'
      },
      elective: {
        color: '#10B981',
        bgLight: 'rgba(16, 185, 129, 0.02)',
        icon: '🧩',
        title: 'Discipline-Specific Elective Course'
      },
      others: {
        color: '#F59E0B',
        bgLight: 'rgba(245, 158, 11, 0.02)',
        icon: '📁',
        title: 'Others (Optional)'
      }
    };

    const meta = sectionMeta[section] || { color: '#64748B', bgLight: '#F8FAFC', icon: '📘' };

    return (
      <div style={{ 
        marginBottom: 32, 
        background: 'var(--color-surface)', 
        borderRadius: '16px', 
        padding: '24px', 
        border: '1px solid var(--color-border)',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.02), 0 4px 6px -2px rgba(0, 0, 0, 0.01)',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid var(--color-border)', paddingBottom: 12 }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.2rem' }}>{meta.icon}</span> {title}
          </h4>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: meta.color, background: `${meta.color}15`, padding: '4px 10px', borderRadius: '12px' }}>
            {items.length} {items.length === 1 ? 'Subject' : 'Subjects'}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {items.map((row, idx) => (
            <div key={idx} style={{ 
              background: 'var(--color-surface)', 
              borderRadius: '14px', 
              padding: '20px', 
              border: '1px solid var(--color-border)',
              borderLeft: `4px solid ${meta.color}`,
              position: 'relative',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.01), 0 2px 4px -1px rgba(0, 0, 0, 0.01)',
              transition: 'all 0.2s ease',
              animation: 'fadeIn 0.2s ease-out'
            }}>
              {/* Card Header (Subject Counter and Delete Action) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#64748B' }}>
                  📚 Subject #{idx + 1}
                </span>
                
                {/* Delete button */}
                <button
                  type="button"
                  style={{ 
                    background: 'transparent',
                    border: 'none', 
                    color: '#EF4444', 
                    cursor: 'pointer', 
                    padding: '4px 8px',
                    borderRadius: '6px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    gap: 4,
                    lineHeight: 1,
                    transition: 'all 0.2s',
                    userSelect: 'none'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = '#FEE2E2';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                  onClick={() => removeRow(section, idx)}
                  title="Remove Row"
                >
                  <X size={14} /> Remove
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Subject Name *</label>
                  <input
                    className="form-input"
                    style={{ padding: '10px 14px', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                    placeholder="e.g. Advanced Research Ethics & Plagiarism"
                    value={row.subjectName}
                    onChange={(e) => handleRowChange(section, idx, 'subjectName', e.target.value)}
                    required
                  />
                </div>

                <div style={{ gridColumn: 'span 1' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Subject Code</label>
                  <input
                    className="form-input"
                    style={{ padding: '10px 14px', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                    placeholder="e.g. CPE-RPE-01"
                    value={row.subjectCode}
                    onChange={(e) => handleRowChange(section, idx, 'subjectCode', e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Exam Month & Year *</label>
                  <input
                    type="month"
                    className="form-input"
                    style={{ padding: '10px 14px', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid #CBD5E1', color: row.examinationMonthYear ? 'inherit' : '#94A3B8' }}
                    value={row.examinationMonthYear}
                    onChange={(e) => handleRowChange(section, idx, 'examinationMonthYear', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Marks Obtained *</label>
                  <input
                    type="number"
                    className="form-input"
                    style={{ padding: '10px 14px', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                    placeholder="Marks obtained"
                    value={row.marksObtained}
                    onChange={(e) => handleRowChange(section, idx, 'marksObtained', e.target.value)}
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Maximum Marks *</label>
                  <input
                    type="number"
                    className="form-input"
                    style={{ padding: '10px 14px', fontSize: '0.85rem', width: '100%', boxSizing: 'border-box', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                    placeholder="Maximum marks"
                    value={row.maxMarks}
                    onChange={(e) => handleRowChange(section, idx, 'maxMarks', e.target.value)}
                    min="1"
                    required
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: 20 }}>
          <button 
            type="button" 
            onClick={() => addRow(section)} 
            style={{ 
              padding: '10px 20px', 
              fontSize: '0.8rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6,
              background: 'var(--color-surface)',
              border: `1.5px dashed ${meta.color}`,
              color: meta.color,
              borderRadius: '10px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.02)',
              transition: 'all 0.2s',
              outline: 'none'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = `${meta.color}08`;
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#FFFFFF';
              e.currentTarget.style.transform = 'none';
            }}
            className="add-row-btn"
          >
            <Plus size={15} /> Add Subject
          </button>
        </div>
      </div>
    );
  };

  const isLocked = ['PENDING_FACULTY', 'PENDING_HOD', 'APPROVED'].includes(thesis.courseworkStatus);

  return (
    <div ref={cardRef} className={`card ${shake ? 'shake-on-error' : ''}`} style={{ padding: 32 }}>
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
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', margin: '4px 0 0' }}>Enter exam results for Research Methodology, Research Analysis, and Electives for verification.</p>
        </div>
      </div>

      {getStatusBanner()}

      {error && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#B91C1C', padding: '12px 16px', borderRadius: 8, fontSize: '0.88rem', marginBottom: 20 }}>
          {error}
        </div>
      )}

      {isLocked ? (
        <div>
          {renderReadOnlySection('Research and Publication Ethics', thesis.courseworkDetails?.researchEthics || [])}
          {renderReadOnlySection('Research Methodology', thesis.courseworkDetails?.researchMethodology || [])}
          {renderReadOnlySection('Discipline-Specific Elective Course', thesis.courseworkDetails?.elective || [])}
          {thesis.courseworkDetails?.others?.length > 0 && renderReadOnlySection('Others', thesis.courseworkDetails?.others || [])}
          
          {thesis.courseworkUploadProof && (
            <div style={{ marginTop: 20, padding: '12px 16px', background: 'var(--color-bg)', borderRadius: 10, border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Upload Proof:</span>
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

          <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--color-text-muted)', fontSize: '0.85rem', background: '#F9FAFB', padding: 12, borderRadius: 8 }}>
            <Lock size={16} /> {thesis.courseworkStatus === 'APPROVED' ? 'Coursework details are approved and locked.' : 'Coursework details are locked while approval is pending.'}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {renderEditableSection('Research and Publication Ethics', 'researchEthics', researchEthics)}
          {renderEditableSection('Research Methodology', 'researchMethodology', researchMethodology)}
          {renderEditableSection('Discipline-Specific Elective Course', 'elective', elective)}
          {renderEditableSection('Others (Optional)', 'others', others)}

          <div style={{ marginTop: 24, padding: 20, background: 'var(--color-bg)', borderRadius: 16, border: '2px dashed #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
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
              <div style={{ marginTop: 4, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
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
      {renderCourseworkTimeline()}
      {(() => {
        const cwLogs = (thesis.auditLog || []).filter(l => [
          'COURSEWORK_SUBMITTED', 
          'COURSEWORK_FACULTY_APPROVED', 
          'COURSEWORK_APPROVED_FACULTY',
          'COURSEWORK_FACULTY_REJECTED', 
          'COURSEWORK_APPROVED_FACULTY_REJECTED',
          'COURSEWORK_HOD_APPROVED', 
          'COURSEWORK_APPROVED_HOD',
          'COURSEWORK_HOD_REJECTED',
          'COURSEWORK_APPROVED_HOD_REJECTED'
        ].includes(l.action));

        const cwHistory = cwLogs.map(l => {
          let actionLabel = '';
          let actorRole = '';
          let actorName = '';
          let remarks = '';
          let fileUrl = '';
          let fileName = '';

          if (l.action === 'COURSEWORK_SUBMITTED') {
            actionLabel = 'SUBMITTED';
            actorRole = 'STUDENT';
            actorName = thesis.scholarName || 'Student';
            remarks = 'Coursework details submitted.';
            fileUrl = thesis.courseworkUploadProof;
            const match = l.note?.match(/File:\s*(.*)/);
            fileName = match ? match[1] : 'Coursework Proof';
          } else if (l.action === 'COURSEWORK_FACULTY_APPROVED' || l.action === 'COURSEWORK_APPROVED_FACULTY') {
            actionLabel = 'SUPERVISOR_APPROVED';
            actorRole = 'SUPERVISOR';
            const match = l.note?.match(/Approved by supervisor (.*?)\.(?:\s*Remarks:\s*(.*))?$/);
            actorName = match ? match[1] : 'Supervisor';
            remarks = match && match[2] ? match[2] : 'Approved by Supervisor.';
          } else if (l.action === 'COURSEWORK_FACULTY_REJECTED' || l.action === 'COURSEWORK_APPROVED_FACULTY_REJECTED') {
            actionLabel = 'SUPERVISOR_REJECTED';
            actorRole = 'SUPERVISOR';
            const match = l.note?.match(/Rejected by supervisor (.*?)\.(?:\s*Remarks:\s*(.*))?$/);
            actorName = match ? match[1] : 'Supervisor';
            remarks = match && match[2] ? match[2] : 'Revision requested.';
          } else if (l.action === 'COURSEWORK_HOD_APPROVED' || l.action === 'COURSEWORK_APPROVED_HOD') {
            actionLabel = 'HOD_APPROVED';
            actorRole = 'HOD';
            const match = l.note?.match(/Approved by HOD (.*?)\.(?:\s*Remarks:\s*(.*))?$/);
            actorName = match ? match[1] : 'HOD';
            remarks = match && match[2] ? match[2] : 'Cleared by HOD.';
          } else if (l.action === 'COURSEWORK_HOD_REJECTED' || l.action === 'COURSEWORK_APPROVED_HOD_REJECTED') {
            actionLabel = 'HOD_REJECTED';
            actorRole = 'HOD';
            const match = l.note?.match(/Rejected by HOD (.*?)\.(?:\s*Remarks:\s*(.*))?$/);
            actorName = match ? match[1] : 'HOD';
            remarks = match && match[2] ? match[2] : 'Revision requested.';
          }

          return {
            timestamp: l.date,
            actorName,
            actorRole,
            action: actionLabel,
            remarks,
            documentUrl: fileUrl,
            fileName: fileName
          };
        });

        return renderHistoryTable(cwHistory);
      })()}
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

  const renderEvaluationTimeline = (milestone) => {
    if (!milestone) return null;
    const status = milestone.status;
    
    let facultyStatus = 'PENDING'; // PENDING, APPROVED, REJECTED
    let hodStatus = 'LOCKED'; // LOCKED, PENDING, APPROVED, REJECTED
    
    if (status === 'PENDING_HOD') {
      facultyStatus = 'APPROVED';
      hodStatus = 'PENDING';
    } else if (status === 'APPROVED') {
      facultyStatus = 'APPROVED';
      hodStatus = 'APPROVED';
    } else if (status === 'REVISION_REQUIRED') {
      const hist = getMilestoneHistory(milestone, thesis);
      const lastRej = [...hist].reverse().find(h => h.action.includes('REJECTED') || h.action === 'REVISION_REQUIRED');
      const isHODRejection = lastRej && (lastRej.action === 'HOD_REJECTED' || lastRej.actorRole === 'HOD');
      
      if (isHODRejection) {
        facultyStatus = 'APPROVED';
        hodStatus = 'REJECTED';
      } else {
        facultyStatus = 'REJECTED';
        hodStatus = 'LOCKED';
      }
    } else if (status === 'SUBMITTED') {
      facultyStatus = 'PENDING';
      hodStatus = 'LOCKED';
    }
    
    return (
      <div style={{ marginTop: 24, borderTop: '1px solid #E2E8F0', paddingTop: 20 }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>📊</span> Evaluation Progress Timeline
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Step 1: Submission */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#10B981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>✓</div>
              <div style={{ width: 2, flex: 1, background: '#10B981', minHeight: 20 }} />
            </div>
            <div style={{ flex: 1, paddingBottom: 8 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E293B' }}>Synopsis Submitted</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
                Submitted on {milestone.submittedAt ? new Date(milestone.submittedAt).toLocaleDateString() : new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
          
          {/* Step 2: Faculty Supervisor Review */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ 
                width: 24, 
                height: 24, 
                borderRadius: '50%', 
                background: facultyStatus === 'APPROVED' ? '#10B981' : (facultyStatus === 'REJECTED' ? '#EF4444' : '#3B82F6'), 
                color: 'white', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '0.8rem', 
                fontWeight: 700 
              }}>
                {facultyStatus === 'APPROVED' ? '✓' : (facultyStatus === 'REJECTED' ? '✗' : '2')}
              </div>
              <div style={{ width: 2, flex: 1, background: (facultyStatus === 'APPROVED' || hodStatus === 'PENDING' || hodStatus === 'APPROVED') ? '#10B981' : '#E2E8F0', minHeight: 20 }} />
            </div>
            <div style={{ flex: 1, paddingBottom: 8 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Faculty Supervisor Verification</span>
                <span style={{ 
                  fontSize: '0.7rem', 
                  padding: '2px 8px', 
                  borderRadius: 4, 
                  fontWeight: 700,
                  background: facultyStatus === 'APPROVED' ? '#D1FAE5' : (facultyStatus === 'REJECTED' ? '#FEE2E2' : '#DBEAFE'),
                  color: facultyStatus === 'APPROVED' ? '#065F46' : (facultyStatus === 'REJECTED' ? '#991B1B' : '#1E40AF')
                }}>
                  {facultyStatus === 'APPROVED' ? 'Verified' : (facultyStatus === 'REJECTED' ? 'Revision Requested' : 'Awaiting Review')}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
                {facultyStatus === 'APPROVED' 
                  ? 'Supervisor has approved and forwarded the synopsis to HOD.' 
                  : (facultyStatus === 'REJECTED' ? 'Supervisor/HOD requested corrections.' : 'Awaiting digital sign-off from supervisor.')}
              </div>
            </div>
          </div>
          
          {/* Step 3: HOD Final Sign-off & DRC Scheduling */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ 
                width: 24, 
                height: 24, 
                borderRadius: '50%', 
                background: hodStatus === 'APPROVED' ? '#10B981' : (hodStatus === 'REJECTED' ? '#EF4444' : (hodStatus === 'LOCKED' ? '#94A3B8' : '#3B82F6')), 
                color: 'white', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '0.8rem', 
                fontWeight: 700 
              }}>
                {hodStatus === 'APPROVED' ? '✓' : (hodStatus === 'REJECTED' ? '✗' : (hodStatus === 'LOCKED' ? '🔒' : '3'))}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>HOD Final Sign-off & DRC Scheduling</span>
                <span style={{ 
                  fontSize: '0.7rem', 
                  padding: '2px 8px', 
                  borderRadius: 4, 
                  fontWeight: 700,
                  background: hodStatus === 'APPROVED' ? '#D1FAE5' : (hodStatus === 'REJECTED' ? '#FEE2E2' : (hodStatus === 'LOCKED' ? '#F1F5F9' : '#DBEAFE')),
                  color: hodStatus === 'APPROVED' ? '#065F46' : (hodStatus === 'REJECTED' ? '#991B1B' : (hodStatus === 'LOCKED' ? '#64748B' : '#1E40AF'))
                }}>
                  {hodStatus === 'APPROVED' ? 'Approved' : (hodStatus === 'REJECTED' ? 'Revision Requested' : (hodStatus === 'LOCKED' ? 'Locked' : 'Awaiting Sign-off'))}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
                {hodStatus === 'APPROVED' 
                  ? 'HOD has approved the synopsis. DRC evaluation meeting will be scheduled.' 
                  : (hodStatus === 'REJECTED' ? 'HOD requested revisions.' : (hodStatus === 'LOCKED' ? 'Awaiting Supervisor verification first.' : 'Awaiting final clearance from Head of Department.'))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Comments List */}
        {milestone.comments && milestone.comments.length > 0 && (
          <div style={{ marginTop: 20, background: 'var(--color-bg)', padding: 14, borderRadius: 8, border: '1px solid var(--color-border)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 8 }}>💬 Evaluation Remarks history:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {milestone.comments.map((c, i) => (
                <div key={i} style={{ fontSize: '0.8rem', borderBottom: i < milestone.comments.length - 1 ? '1px dashed #E2E8F0' : 'none', paddingBottom: i < milestone.comments.length - 1 ? 8 : 0 }}>
                  <span style={{ fontWeight: 700, color: '#1E293B' }}>{c.authorName}: </span>
                  <span style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>"{c.text}"</span>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (synopsisMilestone) {
      axios.get(`${API}/lifecycle/drc/thesis/${thesis._id}`, getAuthHeader())
        .then(res => {
          if (Array.isArray(res.data)) {
            setDrcMeetings(res.data);
          }
        })
        .catch(() => {});
    }
  }, [thesis._id, synopsisMilestone]);

  if (!synopsisMilestone) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-muted)' }}>
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

          if (thesis.synopsisProvisionallyCleared && synopsisMilestone.status !== 'APPROVED') {
            bg = '#FFFBEB';
            border = '#F59E0B';
            color = '#D97706';
            label = 'Provisionally Cleared for Active Research (Upload & Approval Mandatory)';
          } else if (synopsisMilestone.status === 'PENDING') {
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
            const synDrcs = drcMeetings.filter(d => d.isSynopsisApproval);
            const lastSynDrc = synDrcs.length > 0 ? synDrcs[0] : null;
            const isDrcUnsatisfactory = lastSynDrc && lastSynDrc.status === 'REVISION_REQUIRED';

            bg = '#FEF2F2';
            border = '#FCA5A5';
            color = '#DC2626';
            label = isDrcUnsatisfactory ? 'DRC Outcome Unsatisfactory' : 'Correction Needed';
          }

          return (
            <div style={{ background: bg, border: `1px solid ${border}`, padding: 16, borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: '#1E293B' }}>Current Lifecycle Status:</span>
                <span style={{ fontWeight: 800, color: color, textTransform: 'uppercase' }}>
                  {label}
                </span>
              </div>
              {thesis.synopsisProvisionallyCleared && synopsisMilestone.status !== 'APPROVED' && (
                <div style={{ marginTop: 10, fontSize: '0.8rem', color: '#B45309', borderTop: '1px dashed #F59E0B', paddingTop: 8 }}>
                  ⚠️ Your department has provisionally bypassed the synopsis defense phase to place you into Active Research. However, you are strictly required to upload your synopsis document, finalize your research abstract, and obtain official supervisor and HOD/DRC clearance before you can unlock your Pre-Submission Colloquium phase.
                </div>
              )}
              {(() => {
                const synDrcs = drcMeetings.filter(d => d.isSynopsisApproval);
                const lastSynDrc = synDrcs.length > 0 ? synDrcs[0] : null;
                if (lastSynDrc && lastSynDrc.status === 'REVISION_REQUIRED') {
                  return (
                    <div style={{ marginTop: 12, padding: 12, background: 'rgba(255, 255, 255, 0.8)', borderRadius: 6, borderLeft: '4px solid #DC2626' }}>
                      <div style={{ fontWeight: 700, color: '#991B1B', marginBottom: 4 }}>⚠️ DRC Outcome: Unsatisfactory</div>
                      <div style={{ fontSize: '0.85rem', color: '#7F1D1D', fontStyle: 'italic' }}>
                        Remarks: "{lastSynDrc.remarks || 'No remarks provided'}"
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 6 }}>
                        Please revise your synopsis document and research abstract according to the panel comments and resubmit below.
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
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
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Finalized Thesis Title *</label>
              <input type="text" className="form-input" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Update or finalize your research title" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Finalized Research Abstract *</label>
              <textarea className="form-input" value={abstract} onChange={e => setAbstract(e.target.value)} required rows="5" placeholder="Provide a detailed finalized abstract summarizing methodology and expected contributions." />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Synopsis Document (PDF/Word) *</label>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 4 }}>
                <label 
                  style={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: 8, 
                    padding: '8px 16px', 
                    background: 'var(--color-bg)', 
                    color: 'var(--color-text-secondary)', 
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
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 6 }}>Please ensure your document includes introduction, literature survey, proposed methodology, and references.</p>
            </div>
            
            <div style={{ background: '#F3F4F6', borderRadius: 8, padding: 12, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
              ℹ️ <strong>Ph.D. Regulation Notice:</strong> Your synopsis will be automatically run through Turnitin/URKUND for plagiarism checks. Ensure similarity is strictly below 10% before submitting.
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ alignSelf: 'flex-start', padding: '8px 20px' }}>
              {loading ? 'Submitting...' : 'Submit Research Synopsis'}
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: '#F9FAFB', padding: 16, borderRadius: 8, color: '#374151' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 4 }}>RESEARCH ABSTRACT</div>
              <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>{thesis.abstract}</div>
              {synopsisMilestone.documentUrl && (
                <a href={`${API_BASE_URL}${synopsisMilestone.documentUrl}`} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 12, color: '#0284C7', fontWeight: 600 }}>View Submitted Synopsis</a>
              )}
            </div>

            {synopsisMilestone.status === 'APPROVED' && (
              <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', padding: 16, borderRadius: 10 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1E293B', marginBottom: 8 }}>
                  📆 Departmental Research Committee (DRC) Review
                </div>
                {drcMeetings.length === 0 ? (
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: '1.1rem' }}>⏳</span>
                    <span>Synopsis approved by your supervisor! HOD will schedule the official DRC meeting for final evaluation shortly.</span>
                  </div>
                ) : (
                  drcMeetings.map(drc => (
                    <div key={drc._id} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>DRC Session Schedule</span>
                        <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700, background: drc.status === 'APPROVED' ? '#D1FAE5' : drc.status === 'REVISION_REQUIRED' ? '#FEE2E2' : '#FEF3C7', color: drc.status === 'APPROVED' ? '#065F46' : drc.status === 'REVISION_REQUIRED' ? '#991B1B' : '#92400E' }}>
                          {drc.status}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
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
        {synopsisMilestone.status !== 'PENDING' && renderEvaluationTimeline(synopsisMilestone)}
        {renderHistoryTable(getMilestoneHistory(synopsisMilestone, thesis))}
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
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 4 }}>Type: {milestone.type}</div>
          {milestone.dueDate && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Due: {new Date(milestone.dueDate).toLocaleDateString()}</div>}
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
  const approvedCount = reports.filter(r => r.status === 'VERIFIED').length;
  const submittedCount = reports.filter(r => ['SUBMITTED', 'PENDING', 'UNDER_REVIEW_HOD'].includes(r.status)).length;
  const pendingCount = reports.filter(r => ['DRAFT', 'REJECTED_BY_SUPERVISOR', 'REJECTED_BY_HOD'].includes(r.status) || !r.status).length;

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <h3 className="card-title">Research Timeline</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
          {[{ label: 'Start Date', value: thesis.startDate ? new Date(thesis.startDate).toLocaleDateString() : 'N/A' },
            { label: 'Supervisor', value: thesis.supervisorId?.name || 'N/A' },
            { label: 'Department', value: thesis.department }].map(({ label, value }) => (
            <div key={label} style={{ background: '#F0FDF4', padding: 12, borderRadius: 8 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{label}</div>
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
          <div style={{ textAlign: 'center', padding: 32, color: '#64748B', background: 'var(--color-bg)', borderRadius: 12 }}>
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
                  <div key={r._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--color-bg)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#1E293B' }}>{r.title}</div>
                      {r.dueDate && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>Due: {new Date(r.dueDate).toLocaleDateString()}</div>}
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
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 4 }}>Type: {m.type}</div>
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

  const renderEvaluationTimeline = (milestone) => {
    if (!milestone) return null;
    const status = milestone.status;
    
    let facultyStatus = 'PENDING'; // PENDING, APPROVED, REJECTED
    let hodStatus = 'LOCKED'; // LOCKED, PENDING, APPROVED, REJECTED
    
    if (status === 'PENDING_HOD') {
      facultyStatus = 'APPROVED';
      hodStatus = 'PENDING';
    } else if (status === 'APPROVED') {
      facultyStatus = 'APPROVED';
      hodStatus = 'APPROVED';
    } else if (status === 'REVISION_REQUIRED') {
      const hist = getMilestoneHistory(milestone, thesis);
      const lastRej = [...hist].reverse().find(h => h.action.includes('REJECTED') || h.action === 'REVISION_REQUIRED');
      const isHODRejection = lastRej && (lastRej.action === 'HOD_REJECTED' || lastRej.actorRole === 'HOD');
      
      if (isHODRejection) {
        facultyStatus = 'APPROVED';
        hodStatus = 'REJECTED';
      } else {
        facultyStatus = 'REJECTED';
        hodStatus = 'LOCKED';
      }
    } else if (status === 'SUBMITTED') {
      facultyStatus = 'PENDING';
      hodStatus = 'LOCKED';
    }
    
    return (
      <div style={{ marginTop: 24, borderTop: '1px solid #E2E8F0', paddingTop: 20 }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>📊</span> Evaluation Progress Timeline
        </h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Step 1: Submission */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#10B981', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700 }}>✓</div>
              <div style={{ width: 2, flex: 1, background: '#10B981', minHeight: 20 }} />
            </div>
            <div style={{ flex: 1, paddingBottom: 8 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E293B' }}>Rough Draft Submitted</div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
                Submitted on {milestone.submittedAt ? new Date(milestone.submittedAt).toLocaleDateString() : new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
          
          {/* Step 2: Faculty Supervisor Review */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ 
                width: 24, 
                height: 24, 
                borderRadius: '50%', 
                background: facultyStatus === 'APPROVED' ? '#10B981' : (facultyStatus === 'REJECTED' ? '#EF4444' : '#3B82F6'), 
                color: 'white', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '0.8rem', 
                fontWeight: 700 
              }}>
                {facultyStatus === 'APPROVED' ? '✓' : (facultyStatus === 'REJECTED' ? '✗' : '2')}
              </div>
              <div style={{ width: 2, flex: 1, background: (facultyStatus === 'APPROVED' || hodStatus === 'PENDING' || hodStatus === 'APPROVED') ? '#10B981' : '#E2E8F0', minHeight: 20 }} />
            </div>
            <div style={{ flex: 1, paddingBottom: 8 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>Faculty Supervisor Verification</span>
                <span style={{ 
                  fontSize: '0.7rem', 
                  padding: '2px 8px', 
                  borderRadius: 4, 
                  fontWeight: 700,
                  background: facultyStatus === 'APPROVED' ? '#D1FAE5' : (facultyStatus === 'REJECTED' ? '#FEE2E2' : '#DBEAFE'),
                  color: facultyStatus === 'APPROVED' ? '#065F46' : (facultyStatus === 'REJECTED' ? '#991B1B' : '#1E40AF')
                }}>
                  {facultyStatus === 'APPROVED' ? 'Verified' : (facultyStatus === 'REJECTED' ? 'Revision Requested' : 'Awaiting Review')}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
                {facultyStatus === 'APPROVED' 
                  ? 'Supervisor has approved and forwarded the files to the HOD.' 
                  : (facultyStatus === 'REJECTED' ? 'Supervisor requested corrections.' : 'Awaiting digital sign-off from supervisor.')}
              </div>
            </div>
          </div>
          
          {/* Step 3: HOD Final Sign-off */}
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ 
                width: 24, 
                height: 24, 
                borderRadius: '50%', 
                background: hodStatus === 'APPROVED' ? '#10B981' : (hodStatus === 'REJECTED' ? '#EF4444' : (hodStatus === 'LOCKED' ? '#94A3B8' : '#3B82F6')), 
                color: 'white', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '0.8rem', 
                fontWeight: 700 
              }}>
                {hodStatus === 'APPROVED' ? '✓' : (hodStatus === 'REJECTED' ? '✗' : (hodStatus === 'LOCKED' ? '🔒' : '3'))}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>HOD Final Sign-off</span>
                <span style={{ 
                  fontSize: '0.7rem', 
                  padding: '2px 8px', 
                  borderRadius: 4, 
                  fontWeight: 700,
                  background: hodStatus === 'APPROVED' ? '#D1FAE5' : (hodStatus === 'REJECTED' ? '#FEE2E2' : (hodStatus === 'LOCKED' ? '#F1F5F9' : '#DBEAFE')),
                  color: hodStatus === 'APPROVED' ? '#065F46' : (hodStatus === 'REJECTED' ? '#991B1B' : (hodStatus === 'LOCKED' ? '#64748B' : '#1E40AF'))
                }}>
                  {hodStatus === 'APPROVED' ? 'Approved' : (hodStatus === 'REJECTED' ? 'Revision Requested' : (hodStatus === 'LOCKED' ? 'Locked' : 'Awaiting Sign-off'))}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
                {hodStatus === 'APPROVED' 
                  ? 'HOD has approved the drafts. Seminar defense will be scheduled.' 
                  : (hodStatus === 'REJECTED' ? 'HOD requested revisions.' : (hodStatus === 'LOCKED' ? 'Awaiting Supervisor verification first.' : 'Awaiting final signature from Head of Department.'))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Comments List */}
        {milestone.comments && milestone.comments.length > 0 && (
          <div style={{ marginTop: 20, background: 'var(--color-bg)', padding: 14, borderRadius: 8, border: '1px solid var(--color-border)' }}>
            <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginBottom: 8 }}>💬 Evaluation Remarks history:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {milestone.comments.map((c, i) => (
                <div key={i} style={{ fontSize: '0.8rem', borderBottom: i < milestone.comments.length - 1 ? '1px dashed #E2E8F0' : 'none', paddingBottom: i < milestone.comments.length - 1 ? 8 : 0 }}>
                  <span style={{ fontWeight: 700, color: '#1E293B' }}>{c.authorName}: </span>
                  <span style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>"{c.text}"</span>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

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
  const approvedReports = reports.filter(r => r.status === 'VERIFIED').length;
  const requiredReportsCount = hasMphil ? 3 : 6;
  const reportsCleared = approvedReports >= requiredReportsCount;

  const journals = pubs.filter(p => p.type === 'JOURNAL' && p.status === 'VERIFIED').length;
  const conferences = pubs.filter(p => p.type === 'CONFERENCE' && p.status === 'VERIFIED').length;
  const pubsCleared = journals >= 2 && conferences >= 2;

  const synopsisMilestone = milestones.find(m => m.type === 'SYNOPSIS');
  const synopsisCleared = synopsisMilestone?.status === 'APPROVED';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {thesis.activeResearchBypassed && (
        <div className="card" style={{ background: '#FFF7ED', borderLeft: '4px solid #EA580C', padding: '16px 20px', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#C2410C', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>⚡</span> Active Research Prerequisites Bypassed by Department HOD
          </h4>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#9A3412', lineHeight: '1.4' }}>
            This candidate has been force-advanced to the Pre-Submission phase by <strong>{thesis.activeResearchBypassMetadata?.bypassedBy || 'HOD'}</strong> ({thesis.activeResearchBypassMetadata?.designation || 'Head of Department'}) on <strong>{new Date(thesis.activeResearchBypassMetadata?.timestamp).toLocaleString()}</strong>.
          </p>
          <div style={{ marginTop: 8, padding: 12, background: 'rgba(255, 255, 255, 0.6)', borderRadius: 8, fontSize: '0.8rem', color: '#7C2D12' }}>
            <strong>Justification / HOD Decision remarks:</strong>
            <p style={{ margin: '4px 0 0 0', fontStyle: 'italic' }}>"{thesis.activeResearchBypassMetadata?.justification || 'No remarks provided'}"</p>
          </div>
          <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', borderTop: '1px dashed #FED7AA', paddingTop: 8, fontSize: '0.78rem', color: '#7C2D12' }}>
            <div>⏳ <strong>Research time elapsed at bypass:</strong> {thesis.activeResearchBypassMetadata?.statsBeforeBypass?.researchTimeMonths || 0} months</div>
            <div>📄 <strong>Approved progress reports at bypass:</strong> {thesis.activeResearchBypassMetadata?.statsBeforeBypass?.approvedReportsCount || 0} / {requiredReportsCount}</div>
            <div>🏆 <strong>Verified journals at bypass:</strong> {thesis.activeResearchBypassMetadata?.statsBeforeBypass?.journalsCount || 0} / 2</div>
            <div>🏟️ <strong>Verified conferences at bypass:</strong> {thesis.activeResearchBypassMetadata?.statsBeforeBypass?.conferencesCount || 0} / 2</div>
          </div>
        </div>
      )}

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

              {/* Research Synopsis Clearance */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: synopsisCleared ? '#ECFDF5' : '#FEF2F2', borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: synopsisCleared ? '#065F46' : '#991B1B' }}>Research Synopsis Clearance</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>Status: {synopsisCleared ? 'Official DRC Approval Cleared' : 'Pending official DRC synopsis verification'}</div>
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: synopsisCleared ? '#059669' : '#DC2626' }}>{synopsisCleared ? '✓ Cleared' : '⏳ Pending'}</span>
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

          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📤</span> Submit Rough Thesis Draft & Plagiarism Report
          </h3>
          {isRevision && (
            <div style={{ padding: 14, background: '#FEE2E2', borderLeft: '4px solid #EF4444', borderRadius: 8, color: '#991B1B', fontSize: '0.85rem', marginBottom: 16 }}>
              <strong>⚠️ Revision Required:</strong>
              <div style={{ marginTop: 4 }}>
                {getLastRejectionRemark(preMilestone, thesis)}
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
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
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
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Rough Thesis Draft (PDF) *</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
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
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
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
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Plagiarism Report (PDF) *</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '6px', lineHeight: 1.4 }}>
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

      {/* 3. Pre-Submission Seminar Status Banners (Scheduled, Cleared, Uncleared) */}
      {preMilestone && isApproved && semStatus === 'SCHEDULED' && (
        <div className="card" style={{ borderLeft: '4px solid #D97706' }}>
          <h3 className="card-title" style={{ color: '#D97706', display: 'flex', alignItems: 'center', gap: 8 }}>
            📆 Pre-Submission Seminar Confirmed
          </h3>
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: 20 }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#92400E', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>📆</span> Seminar Schedule Details:
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.85rem', color: '#78350F' }}>
              <div><strong>Date:</strong> {thesis.preSubmissionSeminar.scheduledDate ? new Date(thesis.preSubmissionSeminar.scheduledDate).toLocaleDateString() : 'TBD'}</div>
              <div><strong>Time:</strong> {thesis.preSubmissionSeminar.scheduledTime || 'TBD'}</div>
              <div style={{ gridColumn: 'span 2' }}><strong>Venue:</strong> {thesis.preSubmissionSeminar.venue || 'TBD'}</div>
              <div style={{ gridColumn: 'span 2' }}><strong>Committee/Panel:</strong> {thesis.preSubmissionSeminar.committeeMembers || 'TBD'}</div>
              {thesis.preSubmissionSeminar.remarks && <div style={{ gridColumn: 'span 2', background: 'var(--color-surface)', padding: 10, borderRadius: 6, border: '1px solid #FCD34D', marginTop: 6 }}><strong>Remarks:</strong> {thesis.preSubmissionSeminar.remarks}</div>}
            </div>
            <div style={{ marginTop: 16, fontSize: '0.8rem', color: '#92400E', fontStyle: 'italic', borderTop: '1px solid #FDE68A', paddingTop: 10 }}>
              * Please attend the seminar defense offline at the scheduled time. The outcome clearance will be recorded in this portal by the HOD.
            </div>
          </div>
        </div>
      )}

      {preMilestone && isApproved && semStatus === 'UNCLEARED' && (
        <div className="card" style={{ borderLeft: '4px solid #DC2626' }}>
          <h3 className="card-title" style={{ color: '#DC2626', display: 'flex', alignItems: 'center', gap: 8 }}>
            ⚠️ Seminar Outcome: Uncleared
          </h3>
          <div style={{ padding: 14, background: '#FEE2E2', borderLeft: '4px solid #EF4444', borderRadius: 8, color: '#991B1B', fontSize: '0.85rem' }}>
            <strong>⚠️ Seminar Defense Evaluated as Unsatisfactory</strong>
            <div style={{ marginTop: 4 }}><strong>HOD Feedback Remarks:</strong> {thesis.preSubmissionSeminar.outcomeRemarks || 'None'}</div>
            <div style={{ marginTop: 6, color: '#7F1D1D' }}>Please discuss the corrections with your supervisor. HOD will reschedule the seminar defense in this portal once ready.</div>
          </div>
        </div>
      )}

      {preMilestone && isApproved && semStatus === 'CLEARED' && (
        <div className="card" style={{ borderLeft: '4px solid #10B981' }}>
          <h3 className="card-title" style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: 8 }}>
            🎉 Seminar Outcome: Cleared
          </h3>
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

      {/* 4. Active Pre-Submission Milestone Package Details Card */}
      {preMilestone && (
        <div className="card">
          <h3 className="card-title">📦 Draft & Plagiarism Evaluation</h3>

          {/* Banner inside card depending on status */}
          {isSubmitted && (
            <div style={{ textAlign: 'center', padding: '24px 16px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 12, color: '#1E40AF', marginBottom: 16 }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>⏳</div>
              <h4 style={{ margin: '0 0 6px 0', fontWeight: 700 }}>
                {preMilestone.status === 'PENDING_HOD' ? 'Approved & Forwarded to HOD' : 'Draft Submitted Successfully'}
              </h4>
              <p style={{ fontSize: '0.85rem', margin: 0, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.4 }}>
                {preMilestone.status === 'PENDING_HOD'
                  ? 'Your rough draft thesis has been verified and approved by your supervisor, and forwarded to the HOD for final sign-off.'
                  : 'Your rough draft thesis and plagiarism report are under review. Faculty Supervisor must verify them first, followed by HOD final sign-off.'}
              </p>
            </div>
          )}

          {isApproved && semStatus === 'NOT_SCHEDULED' && (
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#065F46', fontWeight: 800 }}>
                ✅ Thesis Draft & Plagiarism Certificate Approved
              </h4>
              <p style={{ fontSize: '0.85rem', color: '#065F46', margin: 0, lineHeight: 1.5 }}>
                Your complete rough thesis draft and Turnitin report have been approved by both the Faculty Supervisor and HOD. 
                The HOD of the department has been notified to schedule your Pre-Submission Seminar defense colloquium.
              </p>
            </div>
          )}

          {/* Files List Section */}
          {(isSubmitted || isApproved) && (
            <div style={{ background: 'var(--color-bg)', borderRadius: 8, padding: 14, border: '1px solid var(--color-border)', fontSize: '0.85rem', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>{isApproved ? 'Approved Files:' : 'Uploaded Files:'}</div>
              {preMilestone.documentUrl && (
                <div style={{ marginBottom: 6 }}>
                  <a href={`${API_BASE_URL}${preMilestone.documentUrl}`} target="_blank" rel="noreferrer" style={{ color: isApproved ? '#10B981' : '#EA580C', textDecoration: 'underline', fontWeight: 600 }}>
                    📄 {isApproved ? 'Approved Thesis Draft' : 'Rough Thesis Draft'}
                  </a>
                </div>
              )}
              {preMilestone.plagiarismReportUrl && (
                <div>
                  <a href={`${API_BASE_URL}${preMilestone.plagiarismReportUrl}`} target="_blank" rel="noreferrer" style={{ color: isApproved ? '#10B981' : '#EA580C', textDecoration: 'underline', fontWeight: 600 }}>
                    📄 {isApproved ? 'Approved Plagiarism Clearance Certificate' : 'Plagiarism Clearance Report'}
                  </a>
                </div>
              )}
            </div>
          )}

          {renderEvaluationTimeline(preMilestone)}
          {renderHistoryTable(getMilestoneHistory(preMilestone, thesis))}

          {/* Pre-Submission Seminar History Logs Subsection */}
          {thesis.preSubmissionSeminarHistory && thesis.preSubmissionSeminarHistory.length > 0 && (
            <div style={{ marginTop: 24, borderTop: '1px solid #E2E8F0', paddingTop: 20 }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📜</span> Pre-Submission Seminar History Logs
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {thesis.preSubmissionSeminarHistory.map((h, idx) => (
                  <div key={idx} style={{ background: 'var(--color-bg)', borderRadius: 10, padding: 14, border: '1px solid var(--color-border)', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                      <span style={{ fontWeight: 700, color: 'var(--color-text-secondary)' }}>Colloquium Run #{idx + 1}</span>
                      {h.status === 'CLEARED' ? (
                        <span style={{ padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: '0.7rem', background: '#D1FAE5', color: '#065F46' }}>
                          CLEARED (Satisfactory)
                        </span>
                      ) : (
                        <span style={{ padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: '0.7rem', background: '#FEE2E2', color: '#991B1B' }}>
                          UNCLEARED (Unsatisfactory)
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                      <div><strong>Scheduled Date:</strong> {h.scheduledDate ? new Date(h.scheduledDate).toLocaleDateString() : 'N/A'}</div>
                      <div><strong>Scheduled Time:</strong> {h.scheduledTime}</div>
                      <div style={{ gridColumn: 'span 2' }}><strong>Venue:</strong> {h.venue}</div>
                      {h.committeeMembers && <div style={{ gridColumn: 'span 2' }}><strong>Panel:</strong> {h.committeeMembers}</div>}
                    </div>
                    <div style={{ background: 'var(--color-surface)', padding: 10, borderRadius: 6, borderLeft: h.status === 'CLEARED' ? '3px solid #10B981' : '3px solid #EF4444' }}>
                      <div><strong>Outcome Remarks:</strong> "{h.outcomeRemarks || 'None'}"</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 4 }}>Conducted on {h.outcomeRecordedAt ? new Date(h.outcomeRecordedAt).toLocaleDateString() : 'N/A'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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

  const getActiveStep = () => {
    if (thesis.externalEvaluationStatus === 'SUCCESSFUL') {
      if (thesis.vivaStatus === 'SUCCESSFUL') {
        return 6;
      }
      return 5;
    }
    if (thesis.status === 'SUBMITTED' || thesis.status === 'AWARDED') {
      return 4;
    }
    if (thesis.status === 'PENDING_HOD' || finalMilestone?.status === 'PENDING_HOD') {
      return 3;
    }
    if (finalMilestone?.status === 'SUBMITTED') {
      return 2;
    }
    return 1;
  };

  const activeStep = getActiveStep();

  const stepperSteps = [
    { num: 1, label: 'Student Upload' },
    { num: 2, label: 'Supervisor Sign-off' },
    { num: 3, label: 'HOD Sign-off' },
    { num: 4, label: 'External Evaluation' },
    { num: 5, label: 'Viva-Voce Defense' }
  ];

  const renderStepperHeader = () => (
    <div className="progress-stepper">
      {stepperSteps.map((s, idx) => {
        const isCompleted = activeStep > s.num;
        const isActive = activeStep === s.num;
        
        let circleBg = '#E2E8F0';
        let circleColor = '#64748B';
        let circleBorder = '2px solid #CBD5E1';
        let textWeight = 'normal';
        let textColor = '#64748B';
        
        if (isCompleted) {
          circleBg = '#D1FAE5';
          circleColor = '#059669';
          circleBorder = '2px solid #10B981';
          textColor = '#059669';
        } else if (isActive) {
          circleBg = '#DBEAFE';
          circleColor = '#1D4ED8';
          circleBorder = '2px solid #3B82F6';
          textColor = '#1D4ED8';
          textWeight = '800';
        }

        return (
          <React.Fragment key={s.num}>
            <div className="progress-stepper-step">
              <div className="progress-stepper-step-circle" style={{
                background: circleBg,
                border: circleBorder,
                color: circleColor,
                boxShadow: isActive ? '0 0 0 3px rgba(59, 130, 246, 0.2)' : 'none'
              }}>
                {isCompleted ? '✓' : s.num}
              </div>
              <div className="progress-stepper-step-label" style={{
                fontWeight: textWeight,
                color: textColor
              }}>
                {s.label}
              </div>
            </div>
            {idx < stepperSteps.length - 1 && (
              <div className="progress-stepper-divider" style={{
                background: activeStep > s.num ? '#10B981' : '#E2E8F0'
              }}>
                <div className="progress-stepper-divider-arrow" style={{
                  borderLeft: `6px solid ${activeStep > s.num ? '#10B981' : '#CBD5E1'}`
                }} />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--final-sub-gap, 20px)' }}>
      <div className="card" style={{ 
        padding: 'var(--final-sub-padding, 24px)', 
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

      {renderStepperHeader()}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Dynamic Active Step Action Panel */}
        <div className="card" style={{ borderLeft: '4px solid #1E40AF', padding: 'var(--final-sub-padding, 18px)', background: 'var(--color-bg, #F8FAFC)' }}>
          {activeStep === 1 && (
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.88rem', fontWeight: 800, color: '#1E40AF' }}>Step 1: Student Final Thesis Upload</h4>
              {(finalMilestone.status === 'PENDING' || finalMilestone.status === 'REVISION_REQUIRED') ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                  <p style={{ color: 'var(--color-text-secondary, #64748B)', fontSize: '0.85rem', lineHeight: 1.5, margin: 0 }}>
                    Please compile and upload your absolute final, hard-bound equivalent Ph.D. thesis document here. Ensure that all corrections, suggestions, and feedback received from the expert panel during your offline defense colloquium are fully incorporated.
                  </p>
                  {finalMilestone.status === 'REVISION_REQUIRED' && (
                    <div style={{ padding: 10, background: '#FEF2F2', borderLeft: '3px solid #EF4444', borderRadius: 6, fontSize: '0.8rem', color: '#991B1B' }}>
                      <strong>Correction Required:</strong> {getLastRejectionRemark(finalMilestone, thesis)}
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
          )}

          {activeStep === 2 && (
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.88rem', fontWeight: 800, color: '#1E40AF' }}>Step 2: Supervisor Digital Sign-off</h4>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary, #64748B)' }}>
                Thesis submitted on {finalMilestone.submittedAt ? new Date(finalMilestone.submittedAt).toLocaleString() : 'N/A'}. Awaiting supervisor signature review and approval.
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.88rem', fontWeight: 800, color: '#1E40AF' }}>Step 3: HOD Final Digital Sign-off</h4>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary, #64748B)' }}>
                Supervisor has signed off the thesis. Awaiting HOD final verification and clearance.
              </div>
            </div>
          )}

          {activeStep === 4 && (
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.88rem', fontWeight: 800, color: '#1E40AF' }}>Step 4: External Examiner Evaluation</h4>
              <div style={{ fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {thesis.dispatchDate ? (
                  <div style={{ background: 'var(--color-surface)', padding: 12, borderRadius: 8, border: '1px solid var(--color-border, #E2E8F0)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginBottom: 6 }}>📬 Dispatch Details</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'var(--final-sub-grid-cols, 1fr 1fr)', gap: 'var(--final-sub-gap, 12px)', marginBottom: 8 }}>
                      <div><strong>Dispatch Date:</strong> {new Date(thesis.dispatchDate).toLocaleDateString()}</div>
                      <div><strong>Method:</strong> {thesis.dispatchMethod}</div>
                      <div><strong>Tracking Ref:</strong> {thesis.dispatchTrackingNumber || 'None'}</div>
                      <div><strong>Sent to:</strong> {thesis.externalEvaluationSentTo || 'External Examiners'}</div>
                    </div>
                    <div style={{ borderTop: '1px dashed var(--color-border, #E2E8F0)', paddingTop: 8, marginTop: 4 }}>
                      {thesis.externalEvaluationStatus !== 'PENDING' ? (
                        <div>
                          <div><strong>Logged On:</strong> {thesis.externalEvaluationLoggedAt ? new Date(thesis.externalEvaluationLoggedAt).toLocaleString() : 'N/A'}</div>
                          <div style={{ marginTop: 4, background: 'var(--color-surface)', padding: 8, borderRadius: 6, border: '1px solid var(--color-border, #E2E8F0)', fontStyle: 'italic' }}>
                            "{thesis.externalEvaluationRemarks}"
                          </div>
                        </div>
                      ) : (
                        <div style={{ color: '#0284C7', fontWeight: 700 }}>
                          ⏳ Thesis package is currently under external evaluation. Awaiting examiner reports.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{ color: 'var(--color-text-secondary, #64748B)' }}>
                    Awaiting HOD/Academic Branch to dispatch the thesis package to external university examiners.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeStep === 5 && (
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.88rem', fontWeight: 800, color: '#1E40AF' }}>Step 5: Viva-Voce Oral Defense Colloquium</h4>
              
              {thesis.vivaStatus !== 'NOT_SCHEDULED' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'var(--final-sub-grid-cols, 1fr 1fr)', gap: 'var(--final-sub-gap, 12px)', fontSize: '0.82rem', marginBottom: 12, background: 'var(--color-surface)', padding: 12, borderRadius: 8, border: '1px solid var(--color-border, #E2E8F0)' }}>
                  <div><strong>Date:</strong> {thesis.vivaDate ? new Date(thesis.vivaDate).toLocaleDateString() : 'N/A'}</div>
                  <div><strong>Time:</strong> {thesis.vivaTime}</div>
                  <div><strong>Venue:</strong> {thesis.vivaVenue}</div>
                  <div><strong>Board Panel:</strong> {thesis.vivaPanel || 'None'}</div>
                  <div><strong>Coordinator / Convenor:</strong> {thesis.vivaCoordinator || 'None'}</div>
                  <div><strong>Meeting Link (Hybrid/Virtual):</strong> {thesis.vivaMeetingLink ? <a href={thesis.vivaMeetingLink} target="_blank" rel="noreferrer" style={{ color: '#3B82F6', textDecoration: 'underline' }}>Join Viva Meeting</a> : 'Physical Only'}</div>
                  {thesis.vivaRemarks && (
                    <div style={{ gridColumn: 'span var(--final-sub-grid-cols, 2)', background: 'var(--color-bg)', padding: 8, borderRadius: 6, border: '1px solid var(--color-border, #E2E8F0)', marginTop: 4, fontStyle: 'italic' }}>
                      "{thesis.vivaRemarks}"
                    </div>
                  )}
                </div>
              )}

              {thesis.vivaStatus === 'UNSUCCESSFUL' && (
                <div style={{ padding: 12, background: '#FEF2F2', borderLeft: '4px solid #EF4444', color: '#991B1B', borderRadius: 6, fontSize: '0.8rem', margin: '10px 0' }}>
                  <strong>⚠️ Oral Defense Outcome: UNCLEARED</strong>. Your viva has been recorded as unsatisfactory. Contact HOD to reschedule the viva voce.
                </div>
              )}

              {thesis.vivaStatus === 'NOT_SCHEDULED' && (
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary, #64748B)' }}>
                  External evaluation completed successfully! Awaiting HOD to schedule the final Viva-Voce defense session.
                </div>
              )}
            </div>
          )}

          {activeStep === 6 && (
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '0.88rem', fontWeight: 800, color: '#059669' }}>Step 6: Evaluation Process Completed</h4>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary, #64748B)' }}>
                🎉 Congratulations! Your final bound thesis evaluation has been cleared and approved. Ph.D. degree has been awarded.
              </div>
            </div>
          )}
        </div>

        {/* Chronological Workflow History Logs */}
        <div style={{ marginTop: 20, borderTop: '1px solid var(--color-border, #E2E8F0)', paddingTop: 20 }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-text-primary, #334155)', display: 'flex', alignItems: 'center', gap: 6 }}>
            📋 Detailed Final Thesis Submission & Evaluation Logs
          </h4>
          {(() => {
            const history = getMilestoneHistory(finalMilestone, thesis) || [];
            if (history.length === 0) {
              return (
                <div style={{ padding: 16, background: 'var(--color-bg, #F8FAFC)', border: '1px dashed var(--color-border, #E2E8F0)', borderRadius: 8, textAlign: 'center', fontSize: '0.8rem', color: '#64748B' }}>
                  No actions recorded in the final submission workflow logs yet.
                </div>
              );
            }
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', paddingLeft: 20 }}>
                {/* Vertical timeline connector */}
                <div style={{ position: 'absolute', top: 8, bottom: 8, left: 7, width: 2, background: 'var(--color-border, #E2E8F0)' }} />
                
                {history.map((item, idx) => {
                  const dateStr = item.timestamp ? new Date(item.timestamp).toLocaleString() : 'N/A';
                  
                  let badgeBg = '#E2E8F0';
                  let badgeColor = '#475569';
                  let dotBg = '#CBD5E1';
                  
                  const actionUpper = (item.action || '').toUpperCase();
                  if (actionUpper.includes('SUBMITTED')) {
                    badgeBg = '#DBEAFE';
                    badgeColor = '#1E40AF';
                    dotBg = '#3B82F6';
                  } else if (actionUpper.includes('APPROVED') || actionUpper.includes('SUCCESS') || actionUpper.includes('DISPATCHED')) {
                    badgeBg = '#D1FAE5';
                    badgeColor = '#065F46';
                    dotBg = '#10B981';
                  } else if (actionUpper.includes('REJECTED') || actionUpper.includes('FAILED') || actionUpper.includes('VIVA_FAILED') || actionUpper.includes('UNSUCCESSFUL')) {
                    badgeBg = '#FEE2E2';
                    badgeColor = '#991B1B';
                    dotBg = '#EF4444';
                  } else if (actionUpper.includes('VIVA_SCHEDULED')) {
                    badgeBg = '#FEF3C7';
                    badgeColor = '#92400E';
                    dotBg = '#F59E0B';
                  }
                  
                  return (
                    <div key={idx} style={{ display: 'flex', gap: 12, position: 'relative', background: 'var(--color-bg, #F8FAFC)', border: '1px solid var(--color-border, #E2E8F0)', borderRadius: 8, padding: 12 }}>
                      {/* Timeline dot */}
                      <div style={{
                        position: 'absolute',
                        left: -27,
                        top: 18,
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: dotBg,
                        border: '2px solid white',
                        zIndex: 2
                      }} />
                      
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: 12, background: badgeBg, color: badgeColor, textTransform: 'uppercase' }}>
                            {item.action?.replace(/_/g, ' ')}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#64748B' }}>{dateStr}</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary, #1E293B)', marginTop: 2 }}>
                          {item.actorName || 'System'} ({item.actorRole || 'System'})
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary, #475569)', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                          {item.remarks || 'No remarks recorded.'}
                        </div>
                        {item.documentUrl && (
                          <div style={{ marginTop: 4 }}>
                            <a href={`${API_BASE_URL}${item.documentUrl}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', color: '#3B82F6', textDecoration: 'underline', fontWeight: 700 }}>
                              📄 View Submitted Thesis Document
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
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
  const theme = useThemeStyles();

  const isTabDisabled = (key) => {
    if (key === 'profile') return false;
    if (!thesis || thesis.status === 'REGISTRATION_PENDING' || thesis.status === 'REJECTED') return true;
    
    const status = thesis.status;
    if (key === 'overview') return false;
    if (key === 'workspace' || key === 'certificates') {
      return !['COURSEWORK', 'SYNOPSIS_PENDING', 'ACTIVE_RESEARCH', 'PRE_SUBMISSION', 'THESIS_SUBMITTED', 'PENDING_SUPERVISOR', 'PENDING_HOD', 'SUBMITTED', 'AWARDED'].includes(status);
    }
    if (key === 'coursework') {
      return !['COURSEWORK', 'SYNOPSIS_PENDING', 'ACTIVE_RESEARCH', 'PRE_SUBMISSION', 'THESIS_SUBMITTED', 'PENDING_SUPERVISOR', 'PENDING_HOD', 'SUBMITTED', 'AWARDED'].includes(status);
    }
    if (key === 'synopsis') {
      const hasSynopsisMilestone = milestones && milestones.some(m => m.type === 'SYNOPSIS');
      return !(['SYNOPSIS_PENDING', 'ACTIVE_RESEARCH', 'PRE_SUBMISSION', 'THESIS_SUBMITTED', 'PENDING_SUPERVISOR', 'PENDING_HOD', 'SUBMITTED', 'AWARDED'].includes(status) || hasSynopsisMilestone);
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
      const preMilestone = milestones && milestones.find(m => m.type === 'PRE_SUBMISSION');
      const isPreApproved = preMilestone && preMilestone.status === 'APPROVED';
      return !(isPreApproved || ['THESIS_SUBMITTED', 'PENDING_SUPERVISOR', 'PENDING_HOD', 'SUBMITTED', 'AWARDED'].includes(status));
    }
    return true;
  };

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
      nextAction: `Your supervisor requested corrections. Feedback: ${getLastRejectionRemark(synopsisMilestone, thesis)}. Go to "Synopsis" to re-upload your revised proposal.`
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
      nextAction: `Your supervisor requested thesis revisions. Feedback: ${getLastRejectionRemark(preMilestone, thesis)}. Go to "Pre-Submission Package" to re-upload your revised package.`
    } : {
      label: 'Pre-Submission',
      color: '#EA580C',
      bg: '#FED7AA',
      progress: 85,
      nextAction: 'Prepare for your pre-submission seminar and defense colloquium in front of department experts.'
    },
    SUBMITTED: { 
      label: thesis.vivaStatus === 'SUCCESSFUL' ? 'Defense Concluded' : thesis.vivaStatus === 'SCHEDULED' ? 'Defense Scheduled' : 'Under Evaluation', 
      color: 'var(--color-text-muted)', 
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
              const approvedReports = reports.filter(r => r.status === 'VERIFIED').length;
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
          <div className="card" style={{ padding: '24px', background: 'var(--color-surface, #ffffff)', borderRadius: '16px', border: '1px solid var(--color-border, #E2E8F0)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary, #0F172A)', marginBottom: '16px', borderBottom: '1px solid var(--color-border, #F1F5F9)', paddingBottom: '12px' }}>
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
                <div key={k} style={{ 
                  background: theme.surfaceHover, 
                  padding: '12px', 
                  borderRadius: '8px', 
                  border: `1px solid ${theme.border}` 
                }}>
                  <div style={{ fontSize: '0.72rem', color: theme.textMuted, fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>{k}</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: theme.textPrimary }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ 
              background: 'linear-gradient(135deg, rgba(26, 90, 59, 0.04) 0%, rgba(26, 90, 59, 0.01) 100%)', 
              borderRadius: '12px', 
              padding: '16px', 
              border: '1px solid rgba(26, 90, 59, 0.12)' 
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary, #1A5A3B)', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                ⚡ Next Action Required
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary, #475569)', lineHeight: 1.5 }}>{s.nextAction}</div>
            </div>
          </div>


        </div>

        {/* Right Hand Column: Stats & Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Key Metrics Card */}
          <div className="card" style={{ padding: '24px', background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '16px' }}>
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
          <div className="card" style={{ padding: '24px', background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '16px' }}>
              ⚡ Quick Navigation
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { key: 'sixMonthReports', label: '📄 Submit 6-Month Progress Report' },
                { key: 'rac', label: '📆 Submit RAC Progress Report' },
                { key: 'publications', label: '🏆 Log Research Output' },
                { key: 'profile', label: '👤 Complete/Edit Profile Details' }
              ].map(({ key, label }) => {
                const disabled = isTabDisabled(key);
                return (
                  <button
                    key={key}
                    disabled={disabled}
                    onClick={() => { if (!disabled) setActiveTab(key); }}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      textAlign: 'left',
                      background: disabled ? '#F1F5F9' : '#F8FAFC',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: disabled ? '#94A3B8' : '#334155',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.6 : 1,
                      transition: 'all 0.2s ease',
                      outline: 'none',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    onMouseOver={e => { if (!disabled) { e.currentTarget.style.background = '#F1F5F9'; e.currentTarget.style.borderColor = '#CBD5E1'; } }}
                    onMouseOut={e => { if (!disabled) { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.borderColor = '#E2E8F0'; } }}
                  >
                    <span>{label}</span>
                    {disabled && <span>🔒</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent Deliverables list */}
          {milestones.length > 0 && (
            <div className="card" style={{ padding: '24px', background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '16px' }}>
                📂 Recent Deliverables
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {milestones.slice(0, 3).map(m => (
                  <div key={m._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid var(--color-border)' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1E293B' }}>{m.title}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>Type: {m.type}</div>
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
        <div style={{ textAlign: 'center', padding: '36px', color: '#64748B', background: 'var(--color-bg)', borderRadius: 8 }}>
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
                <div style={{ flex: 2, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{r.committeeMembers || 'Pending Formation'}</div>
                <div style={{ flex: 1.5 }}>
                  <span style={{ 
                    padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600,
                    background: r.status === 'SATISFACTORY' ? '#D1FAE5' : r.status === 'UNSATISFACTORY' ? '#FEE2E2' : '#FEF3C7',
                    color: r.status === 'SATISFACTORY' ? '#065F46' : r.status === 'UNSATISFACTORY' ? '#991B1B' : '#D97706'
                  }}>
                    {r.status === 'SATISFACTORY' ? 'CLEARED' : r.status === 'UNSATISFACTORY' ? 'REJECTED' : r.status}
                  </span>
                </div>
                <div style={{ flex: 2, fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>{r.remarks || '—'}</div>
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
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Uploaded Reports & Remarks History:</span>
                  <div style={{ width: '100%', overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', background: 'var(--color-surface)', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--color-border)', minWidth: 500 }}>
                      <thead>
                        <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                          <th style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--color-text-secondary)', width: '15%' }}>Submission</th>
                          <th style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--color-text-secondary)', width: '25%' }}>Date & Time</th>
                          <th style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--color-text-secondary)', width: '25%' }}>Attached File</th>
                          <th style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--color-text-secondary)', width: '35%' }}>Remarks</th>
                        </tr>
                      </thead>
                      <tbody>
                        {r.submissions && r.submissions.length > 0 ? (
                          r.submissions.map((sub, idx) => (
                            <tr key={sub._id || idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                              <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1E3A8A' }}>#{idx + 1}</td>
                              <td style={{ padding: '8px 12px', color: '#64748B' }}>{new Date(sub.uploadedAt).toLocaleString()}</td>
                              <td style={{ padding: '8px 12px' }}>
                                {sub.progressReportUrl ? (
                                  <a href={`${API_BASE_URL}${sub.progressReportUrl}`} target="_blank" rel="noreferrer" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'underline' }}>
                                    📄 View File
                                  </a>
                                ) : (
                                  <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No file</span>
                                )}
                              </td>
                              <td style={{ padding: '8px 12px', color: 'var(--color-text-secondary)' }}>
                                {sub.studentRemarks || <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No remarks</span>}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1E3A8A' }}>#1</td>
                            <td style={{ padding: '8px 12px', color: '#64748B' }}>—</td>
                            <td style={{ padding: '8px 12px' }}>
                              {r.progressReportUrl ? (
                                <a href={`${API_BASE_URL}${r.progressReportUrl}`} target="_blank" rel="noreferrer" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'underline' }}>
                                  📄 View File
                                </a>
                              ) : (
                                <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No file</span>
                              )}
                            </td>
                            <td style={{ padding: '8px 12px', color: 'var(--color-text-secondary)' }}>
                              {r.studentRemarks || <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No remarks</span>}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
              {uploadingId === r._id && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--color-bg)', padding: 16, borderRadius: 10, border: '1px dashed #CBD5E1', marginTop: 4 }}>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ flex: 1, minWidth: 250 }}>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Remarks (Optional)</label>
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
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Attach File (Optional)</label>
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

const getStatusDisplay = (status) => {
  switch (status) {
    case 'DRAFT':
      return { text: 'Draft', color: 'var(--color-text-secondary)', bg: '#E2E8F0', border: '#CBD5E1' };
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
      return { text: status, color: 'var(--color-text-secondary)', bg: '#E2E8F0', border: '#CBD5E1' };
  }
};

const ResearchOutputsTab = ({ thesis }) => {
  const toast = useToast();
  const [pubs, setPubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState(null);
  const [editingPubId, setEditingPubId] = useState(null);
  const [form, setForm] = useState({ 
    title: '', 
    journalName: '', 
    issn: '', 
    publicationDate: '', 
    paperLink: '', 
    type: 'JOURNAL',
    doiUrl: '',
    iprType: '',
    itemStatus: '',
    indexing: '',
    volume: '',
    issue: '',
    pages: ''
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
    if (!form.title.trim()) {
      return toast.warning('Please enter the title.');
    }
    if (form.type === 'JOURNAL') {
      if (!form.journalName.trim()) return toast.warning('Please enter the Journal/Publisher name.');
      if (!form.indexing) return toast.warning('Please select the Journal Indexing database.');
    } else if (form.type === 'CONFERENCE') {
      if (!form.journalName.trim()) return toast.warning('Please enter the Conference Name.');
      if (!form.volume.trim()) return toast.warning('Please enter the Host / Organizing Institution.');
      if (!form.issn.trim()) return toast.warning('Please enter the Conference Location / Venue.');
      if (!form.indexing) return toast.warning('Please select the Conference Indexing database.');
    } else if (form.type === 'IPR') {
      if (!form.iprType) return toast.warning('Please select the IPR Type.');
      if (!form.journalName.trim()) return toast.warning('Please enter the IPR Office / Issuing Organization.');
      if (!form.volume.trim()) return toast.warning('Please enter the Inventors / Applicants.');
      if (!form.issn.trim()) return toast.warning('Please enter the Application / Registration Number.');
      if (!form.pages.trim()) return toast.warning('Please enter the Country / Region.');
      if (form.itemStatus === 'Granted / Issued / Registered' && !form.issue.trim()) {
        return toast.warning('Please enter the App/Grant ID.');
      }
    }

    if (!editingPubId && !file) return toast.warning('Please upload a PDF proof document.');
    
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
      formData.append('indexing', form.indexing || '');
      formData.append('volume', form.volume || '');
      formData.append('issue', form.issue || '');
      formData.append('pages', form.pages || '');
      if (file) {
        formData.append('document', file);
      }

      if (editingPubId) {
        await axios.put(`${API}/publications/${editingPubId}`, formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success(`${form.type === 'IPR' ? 'IPR' : 'Research Output'} updated successfully!`);
      } else {
        await axios.post(`${API}/publications`, formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        toast.success(`${form.type === 'IPR' ? 'IPR' : 'Research Output'} logged successfully & pending verification!`);
      }

      setShowForm(false);
      setEditingPubId(null);
      setForm({ title: '', journalName: '', issn: '', publicationDate: '', paperLink: '', type: 'JOURNAL', doiUrl: '', iprType: '', itemStatus: '', indexing: '', volume: '', issue: '', pages: '' });
      setFile(null);
      fetchPubs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving research output.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePub = async (pubId) => {
    if (!window.confirm('Are you sure you want to delete this draft research output?')) return;
    try {
      await axios.delete(`${API}/publications/${pubId}`, getAuthHeader());
      toast.success('Research output deleted successfully.');
      fetchPubs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting research output.');
    }
  };

  const handleSendToSupervisor = async () => {
    if (!window.confirm('Are you sure you want to send all draft research outputs to your supervisor for approval?')) return;
    try {
      await axios.put(`${API}/publications/thesis/${thesis._id}/submit-drafts`, {}, getAuthHeader());
      toast.success('Research outputs submitted to supervisor successfully.');
      fetchPubs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error submitting research outputs.');
    }
  };

  const handleEditClick = (p) => {
    setForm({
      title: p.title || '',
      journalName: p.journalName || '',
      issn: p.issn || '',
      publicationDate: p.publicationDate ? p.publicationDate.split('T')[0] : '',
      paperLink: p.paperLink || '',
      type: (p.type === 'PATENT' || p.type === 'IPR') ? 'IPR' : (p.type || 'JOURNAL'),
      doiUrl: p.doiUrl || '',
      iprType: p.iprType || (p.type === 'PATENT' ? 'Patent' : ''),
      itemStatus: p.itemStatus || '',
      indexing: p.indexing || '',
      volume: p.volume || '',
      issue: p.issue || '',
      pages: p.pages || ''
    });
    setEditingPubId(p._id);
    setFile(null);
    setShowForm(true);
    setTimeout(() => {
      const element = document.getElementById('new-research-output-form');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingPubId(null);
    setForm({ title: '', journalName: '', issn: '', publicationDate: '', paperLink: '', type: 'JOURNAL', doiUrl: '', iprType: '', itemStatus: '', indexing: '', volume: '', issue: '', pages: '' });
    setFile(null);
  };

  const verifiedJournals = pubs.filter(p => p.type === 'JOURNAL' && p.status === 'VERIFIED').length;
  const verifiedConferences = pubs.filter(p => p.type === 'CONFERENCE' && p.status === 'VERIFIED').length;
  const loggedPatents = pubs.filter(p => (p.type === 'PATENT' || p.type === 'IPR') && p.status === 'VERIFIED').length;

  const activePubs = pubs.filter(p => p.status === 'DRAFT' || p.status === 'REJECTED_BY_SUPERVISOR' || p.status === 'REJECTED_BY_HOD');
  const reviewedPubs = pubs.filter(p => p.status === 'PENDING' || p.status === 'UNDER_REVIEW_HOD' || p.status === 'VERIFIED');
  const hasDrafts = pubs.some(p => p.status === 'DRAFT');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <style>{`
        .research-list-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .research-header-row {
          display: flex;
          font-size: 0.8rem;
          color: var(--color-text-muted, #64748B);
          padding-bottom: 8px;
          border-bottom: 1px solid var(--color-border, #E2E8F0);
        }
        .research-item-card {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          padding: 20px !important;
          background: var(--color-surface, #FFFFFF) !important;
          border: 1px solid var(--color-border, #E2E8F0) !important;
          border-radius: 12px !important;
          margin-bottom: 20px !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03) !important;
        }
        [data-theme='dark'] .research-item-card {
          background: var(--color-surface, #1e1e20) !important;
          border-color: var(--color-border, #2d2d30) !important;
        }

        @media (max-width: 768px) {
          .research-list-container {
            display: flex !important;
            flex-direction: column !important;
            gap: 16px !important;
            overflow-x: visible !important;
          }
          .research-header-row {
            display: none !important;
          }
          .research-item-card {
            min-width: 0 !important;
            background: var(--color-surface, #ffffff) !important;
            border: 1px solid var(--color-border, #E2E8F0) !important;
            border-radius: 12px !important;
            padding: 16px !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 12px !important;
            align-items: stretch !important;
            box-shadow: var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05)) !important;
            margin-bottom: 16px !important;
          }
          .research-row-primary {
            display: flex !important;
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 8px !important;
          }
          .research-cell-title {
            flex: none !important;
            font-size: 0.95rem !important;
            font-weight: 800 !important;
            color: var(--color-text-primary, #0F172A) !important;
          }
          .research-cell-publisher {
            flex: none !important;
            font-size: 0.85rem !important;
            color: var(--color-text-secondary, #475569) !important;
            margin-top: -4px !important;
          }
          .research-cell-type {
            flex: none !important;
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            border-top: 1px dashed var(--color-border, #E2E8F0) !important;
            padding-top: 10px !important;
          }
          .research-cell-date {
            flex: none !important;
            font-size: 0.8rem !important;
            color: var(--color-text-muted, #64748B) !important;
          }
          .research-cell-status {
            flex: none !important;
            display: inline-flex !important;
          }
          .research-cell-links {
            flex: none !important;
            display: flex !important;
            justify-content: flex-start !important;
            gap: 12px !important;
            border-top: 1px dashed var(--color-border, #E2E8F0) !important;
            padding-top: 10px !important;
          }
          .research-cell-actions {
            flex: none !important;
            display: flex !important;
            justify-content: flex-start !important;
            gap: 12px !important;
            border-top: 1px dashed var(--color-border, #E2E8F0) !important;
            padding-top: 10px !important;
          }
        }
      `}</style>
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
              <span style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary, #64748B)', fontWeight: 500 }}>verified</span>
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
          <button onClick={() => { if (editingPubId) resetForm(); else setShowForm(!showForm); }} className="btn-primary" style={{ background: 'var(--color-primary, #059669)', display: 'flex', gap: 6, alignItems: 'center' }}>
            <Plus size={16} /> Log Research Output
          </button>
        </div>

        {showForm && (
          <form id="new-research-output-form" onSubmit={handleSubmit} style={{ background: 'var(--color-bg, #F8FAFC)', padding: 20, borderRadius: 12, border: '1px solid var(--color-border, #E2E8F0)', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h4 style={{ margin: 0, color: 'var(--color-text, #0F172A)' }}>{editingPubId ? 'Edit Research Output' : 'Log New Research Output'}</h4>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Research Output Type *</label>
              <select className="form-input" required value={form.type} onChange={e => setForm({ ...form, type: e.target.value, iprType: '', itemStatus: '', indexing: '', volume: '', issue: '', pages: '' })} style={{ maxWidth: '400px' }} disabled={!!editingPubId}>
                <option value="JOURNAL">Journal Publication</option>
                <option value="CONFERENCE">Conference Presentation</option>
                <option value="IPR">Intellectual Property Rights (IPR)</option>
              </select>
            </div>

            {/* JOURNAL FORM FIELDS */}
            {form.type === 'JOURNAL' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Publication Status *</label>
                    <select className="form-input" required value={form.itemStatus} onChange={e => setForm({ ...form, itemStatus: e.target.value })} style={{ width: '100%' }}>
                      <option value="">-- Select Status --</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Accepted">Accepted (In Press)</option>
                      <option value="Published">Published</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Journal Indexing / Database *</label>
                    <select className="form-input" required value={form.indexing} onChange={e => setForm({ ...form, indexing: e.target.value })} style={{ width: '100%' }}>
                      <option value="">-- Select Indexing --</option>
                      <option value="UGC-CARE List Group I">UGC-CARE List Group I</option>
                      <option value="UGC-CARE List Group II (Scopus)">UGC-CARE List Group II (Scopus)</option>
                      <option value="UGC-CARE List Group II (Web of Science)">UGC-CARE List Group II (Web of Science)</option>
                      <option value="Other Peer-Reviewed Journal">Other Peer-Reviewed Journal</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Paper Title *</label>
                    <input type="text" className="form-input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. A Deep Learning Approach to Cybersecurity" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Journal / Publisher *</label>
                    <input type="text" className="form-input" required value={form.journalName} onChange={e => setForm({ ...form, journalName: e.target.value })} placeholder="e.g. IEEE Transactions on Forensics" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Volume Number</label>
                    <input type="text" className="form-input" value={form.volume} onChange={e => setForm({ ...form, volume: e.target.value })} placeholder="e.g. Vol. 14" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Issue Number</label>
                    <input type="text" className="form-input" value={form.issue} onChange={e => setForm({ ...form, issue: e.target.value })} placeholder="e.g. Issue 3" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Page Range</label>
                    <input type="text" className="form-input" value={form.pages} onChange={e => setForm({ ...form, pages: e.target.value })} placeholder="e.g. 120-135" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>ISSN / ISBN</label>
                    <input type="text" className="form-input" value={form.issn} onChange={e => setForm({ ...form, issn: e.target.value })} placeholder="e.g. 1549-3652" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Date of Acceptance/Print *</label>
                    <input type="date" className="form-input" required value={form.publicationDate} onChange={e => setForm({ ...form, publicationDate: e.target.value })} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Paper/Publisher Link</label>
                    <input type="text" className="form-input" value={form.paperLink} onChange={e => setForm({ ...form, paperLink: e.target.value })} placeholder="e.g. https://ieeexplore.ieee.org/document/..." />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>DOI URL / Number</label>
                    <input type="text" className="form-input" value={form.doiUrl} onChange={e => setForm({ ...form, doiUrl: e.target.value })} placeholder="e.g. 10.1109/TIFS.2026.12345" />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Upload Proof of Acceptance / Publication (PDF format) {editingPubId ? '' : '*'}</label>
                  <input type="file" className="form-input" required={!editingPubId} accept=".pdf" onChange={e => setFile(e.target.files[0])} />
                  {editingPubId && <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 4 }}>Leave blank to keep the currently uploaded document.</div>}
                </div>
              </>
            )}

            {/* CONFERENCE FORM FIELDS */}
            {form.type === 'CONFERENCE' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Conference Status *</label>
                    <select className="form-input" required value={form.itemStatus} onChange={e => setForm({ ...form, itemStatus: e.target.value })} style={{ width: '100%' }}>
                      <option value="">-- Select Status --</option>
                      <option value="Submitted / Abstract Under Review">Submitted / Abstract Under Review</option>
                      <option value="Accepted (Pending Presentation)">Accepted (Pending Presentation)</option>
                      <option value="Presented (Oral / Poster)">Presented (Oral / Poster)</option>
                      <option value="Presented & Published in Proceedings">Presented & Published in Proceedings</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Conference Indexing / Database *</label>
                    <select className="form-input" required value={form.indexing} onChange={e => setForm({ ...form, indexing: e.target.value })} style={{ width: '100%' }}>
                      <option value="">-- Select Indexing --</option>
                      <option value="Scopus Indexed">Scopus Indexed</option>
                      <option value="Web of Science (WoS) Indexed">Web of Science (WoS) Indexed</option>
                      <option value="Google Scholar Indexed">Google Scholar Indexed</option>
                      <option value="UGC-CARE Listed Proceedings">UGC-CARE Listed Proceedings</option>
                      <option value="Other Peer-Reviewed Conference">Other Peer-Reviewed Conference</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Presentation/Paper Title *</label>
                    <input type="text" className="form-input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. A Deep Learning Approach to Cybersecurity" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Conference Name *</label>
                    <input type="text" className="form-input" required value={form.journalName} onChange={e => setForm({ ...form, journalName: e.target.value })} placeholder="e.g. IEEE ICC 2026" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Host / Organizing Institution *</label>
                    <input type="text" className="form-input" required value={form.volume} onChange={e => setForm({ ...form, volume: e.target.value })} placeholder="e.g. Paris Institute of Technology" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Conference Location / Venue *</label>
                    <input type="text" className="form-input" required value={form.issn} onChange={e => setForm({ ...form, issn: e.target.value })} placeholder="e.g. Paris, France" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Date of Presentation *</label>
                    <input type="date" className="form-input" required value={form.publicationDate} onChange={e => setForm({ ...form, publicationDate: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Proceedings DOI (Optional)</label>
                    <input type="text" className="form-input" value={form.doiUrl} onChange={e => setForm({ ...form, doiUrl: e.target.value })} placeholder="e.g. 10.1109/ICC.2026.12345" />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Proceedings / Paper Link (Optional)</label>
                  <input type="text" className="form-input" value={form.paperLink} onChange={e => setForm({ ...form, paperLink: e.target.value })} placeholder="e.g. https://ieeexplore.ieee.org/document/..." />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Upload Proof of Presentation (PDF format) {editingPubId ? '' : '*'}</label>
                  <input type="file" className="form-input" required={!editingPubId} accept=".pdf" onChange={e => setFile(e.target.files[0])} />
                  {editingPubId && <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 4 }}>Leave blank to keep the currently uploaded document.</div>}
                </div>
              </>
            )}

            {/* IPR FORM FIELDS */}
            {form.type === 'IPR' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>IPR Type *</label>
                    <select className="form-input" required value={form.iprType} onChange={e => setForm({ ...form, iprType: e.target.value })} style={{ width: '100%' }}>
                      <option value="">-- Select IPR Type --</option>
                      <option value="Patent">Patent</option>
                      <option value="Copyright">Copyright</option>
                      <option value="Trademark">Trademark</option>
                      <option value="Design Registration">Design Registration</option>
                      <option value="Geographical Indication">Geographical Indication</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>IPR Status *</label>
                    <select className="form-input" required value={form.itemStatus} onChange={e => setForm({ ...form, itemStatus: e.target.value })} style={{ width: '100%' }}>
                      <option value="">-- Select Status --</option>
                      <option value="Filed / Application Submitted">Filed / Application Submitted</option>
                      <option value="Published (in Gazette/Journal)">Published (in Gazette/Journal)</option>
                      <option value="Granted / Issued / Registered">Granted / Issued / Registered</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>IPR / Patent Title *</label>
                    <input type="text" className="form-input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. System and Method for Adaptive Threat Detection" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>IPR Office / Issuing Organization *</label>
                    <input type="text" className="form-input" required value={form.journalName} onChange={e => setForm({ ...form, journalName: e.target.value })} placeholder="e.g. Indian Patent Office (IPO)" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Inventors / Applicants *</label>
                    <input type="text" className="form-input" required value={form.volume} onChange={e => setForm({ ...form, volume: e.target.value })} placeholder="e.g. Dr. Ayush Sood, Prof. M. Roy" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Application / Registration Number *</label>
                    <input type="text" className="form-input" required value={form.issn} onChange={e => setForm({ ...form, issn: e.target.value })} placeholder="e.g. 202611012345" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>App/Grant ID *</label>
                    <input type="text" className="form-input" required value={form.issue} onChange={e => setForm({ ...form, issue: e.target.value })} placeholder="e.g. PAT/2026/7890" />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Country / Region *</label>
                    <input type="text" className="form-input" required value={form.pages} onChange={e => setForm({ ...form, pages: e.target.value })} placeholder="e.g. India" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Date of Filing / Award *</label>
                    <input type="date" className="form-input" required value={form.publicationDate} onChange={e => setForm({ ...form, publicationDate: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>IPR ID / Reference Number (Optional)</label>
                    <input type="text" className="form-input" value={form.doiUrl} onChange={e => setForm({ ...form, doiUrl: e.target.value })} placeholder="e.g. Ref/IPO/4567" />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>IPR URL / Registry Link (Optional)</label>
                  <input type="text" className="form-input" value={form.paperLink} onChange={e => setForm({ ...form, paperLink: e.target.value })} placeholder="e.g. https://ipindiaservices.gov.in/..." />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Upload IPR Proof / Certificate (PDF format) {editingPubId ? '' : '*'}</label>
                  <input type="file" className="form-input" required={!editingPubId} accept=".pdf" onChange={e => setFile(e.target.files[0])} />
                  {editingPubId && <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 4 }}>Leave blank to keep the currently uploaded document.</div>}
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" onClick={resetForm} className="btn-outline" style={{ padding: '8px 16px' }}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={submitting} style={{ background: '#133A26', padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 6 }}>
                {submitting ? 'Submitting...' : editingPubId ? 'Update Log' : 'Submit Log'}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* Section 1: Saved & Rejected Research Outputs */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#1E293B', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📁</span> Saved & Rejected Research Outputs
                <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', background: '#E2E8F0', color: 'var(--color-text-secondary)', borderRadius: 12 }}>
                  {activePubs.length}
                </span>
              </h4>
              
              {activePubs.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', background: 'var(--color-bg)', border: '1px dashed #CBD5E1', borderRadius: 8, color: '#64748B', fontSize: '0.85rem' }}>
                  No active or draft research outputs logged.
                </div>
              ) : (
                <div className="research-list-container" style={{ overflowX: 'auto' }}>
                  <div className="research-header-row" style={{ minWidth: 800 }}>
                    <div style={{ flex: 2.2 }}>Title</div>
                    <div style={{ flex: 1.5 }}>Journal/Publisher/Office</div>
                    <div style={{ flex: 1 }}>Type</div>
                    <div style={{ flex: 1 }}>Date</div>
                    <div style={{ flex: 1 }}>Status</div>
                    <div style={{ flex: 1.2, textAlign: 'center' }}>Links & Proof</div>
                    <div style={{ flex: 1.5, textAlign: 'center' }}>Actions</div>
                  </div>
                  {activePubs.map(p => (
                    <div key={p._id} className="research-item-card" style={{ minWidth: 800, flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
                      <div className="research-row-primary" style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <div className="research-cell-title" style={{ flex: 2.2, fontWeight: 700, color: 'var(--color-text, #1E293B)' }}>{p.title}</div>
                        <div className="research-cell-publisher" style={{ flex: 1.5, fontSize: '0.9rem' }}>{p.journalName}</div>
                        <div className="research-cell-type" style={{ flex: 1 }}>
                          <span style={{ 
                            padding: '2px 6px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 700,
                            background: p.type === 'JOURNAL' ? 'rgba(59, 130, 246, 0.1)' : p.type === 'CONFERENCE' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            color: p.type === 'JOURNAL' ? '#2563EB' : p.type === 'CONFERENCE' ? '#7C3AED' : '#059669'
                          }}>
                            {p.type === 'IPR' && p.iprType ? `IPR: ${p.iprType}` : p.type === 'PATENT' ? 'IPR: Patent' : p.type}
                          </span>
                          {p.itemStatus && <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary, #64748B)', marginTop: 4, fontWeight: 600 }}>{p.itemStatus}</div>}
                        </div>
                        <div className="research-cell-date" style={{ flex: 1, fontSize: '0.85rem' }}>{new Date(p.publicationDate).toLocaleDateString()}</div>
                        <div className="research-cell-status" style={{ flex: 1 }}>
                          {(() => {
                            const display = getStatusDisplay(p.status);
                            return (
                              <span style={{ 
                                padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600,
                                background: display.bg,
                                color: display.color,
                                border: `1px solid ${display.border}`
                              }}>
                                {display.text}
                              </span>
                            );
                          })()}
                        </div>
                        <div className="research-cell-links" style={{ flex: 1.2, display: 'flex', gap: 12, justifyContent: 'center' }}>
                          {p.paperLink && <a href={p.paperLink} target="_blank" rel="noreferrer" title={p.type === 'PATENT' || p.type === 'IPR' ? 'View IPR URL' : 'View Publisher Page'} style={{ fontSize: '0.82rem', color: '#2563EB', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}><File size={16} /> Link</a>}
                          {p.documentUrl && <a href={`${API_BASE_URL}${p.documentUrl}`} target="_blank" rel="noreferrer" title="View Proof PDF" style={{ fontSize: '0.82rem', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}><Upload size={16} /> PDF</a>}
                        </div>
                        <div className="research-cell-actions" style={{ flex: 1.5, display: 'flex', gap: 8, justifyContent: 'center' }}>
                          <button
                            onClick={() => handleEditClick(p)}
                            disabled={p.status === 'PENDING' || p.status === 'UNDER_REVIEW_HOD'}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              background: (p.status === 'PENDING' || p.status === 'UNDER_REVIEW_HOD') ? '#F1F5F9' : '#3B82F6',
                              color: (p.status === 'PENDING' || p.status === 'UNDER_REVIEW_HOD') ? '#94A3B8' : '#FFFFFF',
                              border: 'none',
                              cursor: (p.status === 'PENDING' || p.status === 'UNDER_REVIEW_HOD') ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'opacity 0.2s'
                            }}
                          >
                            <Edit size={14} /> Edit
                          </button>
                          <button
                            onClick={() => handleDeletePub(p._id)}
                            disabled={p.status === 'PENDING' || p.status === 'UNDER_REVIEW_HOD'}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              background: (p.status === 'PENDING' || p.status === 'UNDER_REVIEW_HOD') ? '#F1F5F9' : '#EF4444',
                              color: (p.status === 'PENDING' || p.status === 'UNDER_REVIEW_HOD') ? '#94A3B8' : '#FFFFFF',
                              border: 'none',
                              cursor: (p.status === 'PENDING' || p.status === 'UNDER_REVIEW_HOD') ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'opacity 0.2s'
                            }}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </div>
                      
                      {/* Detailed Sub-info Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: '0.78rem', color: 'var(--color-text-secondary, #64748B)', margin: '8px 0', borderTop: '1px dashed var(--color-border, #E2E8F0)', paddingTop: 8 }}>
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
                      {p.remarks && (
                        <div style={{ background: '#FEF2F2', borderLeft: '3px solid #EF4444', padding: '8px 12px', borderRadius: 6, fontSize: '0.8rem', color: '#991B1B', marginTop: 4, marginBottom: 8 }}>
                          <strong>{p.status === 'REJECTED_BY_HOD' ? 'HOD Remarks' : 'Supervisor Remarks'}:</strong> "{p.remarks}"
                        </div>
                      )}
                      {/* Timeline & History Logs */}
                      {renderEvaluationTimelineGeneric(p, thesis, p.type === 'IPR' ? (p.iprType || 'IPR') : p.type, getPublicationVirtualHistory(p))}
                    </div>
                  ))}
                </div>
              )}

              {/* Bulk submit drafts button */}
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleSendToSupervisor}
                  disabled={!hasDrafts}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    background: hasDrafts ? '#059669' : '#CBD5E1',
                    color: hasDrafts ? '#FFFFFF' : '#94A3B8',
                    border: 'none',
                    cursor: hasDrafts ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                    boxShadow: hasDrafts ? '0 4px 6px -1px rgba(16, 185, 129, 0.2)' : 'none'
                  }}
                >
                  <span>📤</span> Send to Supervisor for Approval
                </button>
              </div>
            </div>

            {/* Section 2: Submitted & Approved Research Outputs Log */}
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#1E293B', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📋</span> Submitted & Approved Research Outputs Log
                <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', background: '#E2E8F0', color: 'var(--color-text-secondary)', borderRadius: 12 }}>
                  {reviewedPubs.length}
                </span>
              </h4>

              {reviewedPubs.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', background: 'var(--color-bg)', border: '1px dashed #CBD5E1', borderRadius: 8, color: '#64748B', fontSize: '0.85rem' }}>
                  No reviewed research outputs yet.
                </div>
              ) : (
                <div className="research-list-container" style={{ overflowX: 'auto' }}>
                  <div className="research-header-row" style={{ minWidth: 800 }}>
                    <div style={{ flex: 2.2 }}>Title</div>
                    <div style={{ flex: 1.5 }}>Journal/Publisher/Office</div>
                    <div style={{ flex: 1 }}>Type</div>
                    <div style={{ flex: 1 }}>Date</div>
                    <div style={{ flex: 1 }}>Status</div>
                    <div style={{ flex: 1.2, textAlign: 'center' }}>Links & Proof</div>
                    <div style={{ flex: 1.5, textAlign: 'center' }}>Actions</div>
                  </div>
                  {reviewedPubs.map(p => (
                    <div key={p._id} className="research-item-card" style={{ minWidth: 800, flexDirection: 'column', alignItems: 'stretch', gap: 6 }}>
                      <div className="research-row-primary" style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <div className="research-cell-title" style={{ flex: 2.2, fontWeight: 700, color: 'var(--color-text, #1E293B)' }}>{p.title}</div>
                        <div className="research-cell-publisher" style={{ flex: 1.5, fontSize: '0.9rem' }}>{p.journalName}</div>
                        <div className="research-cell-type" style={{ flex: 1 }}>
                          <span style={{ 
                            padding: '2px 6px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 700,
                            background: p.type === 'JOURNAL' ? 'rgba(59, 130, 246, 0.1)' : p.type === 'CONFERENCE' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            color: p.type === 'JOURNAL' ? '#2563EB' : p.type === 'CONFERENCE' ? '#7C3AED' : '#059669'
                          }}>
                            {p.type === 'IPR' && p.iprType ? `IPR: ${p.iprType}` : p.type === 'PATENT' ? 'IPR: Patent' : p.type}
                          </span>
                          {p.itemStatus && <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary, #64748B)', marginTop: 4, fontWeight: 600 }}>{p.itemStatus}</div>}
                        </div>
                        <div className="research-cell-date" style={{ flex: 1, fontSize: '0.85rem' }}>{new Date(p.publicationDate).toLocaleDateString()}</div>
                        <div className="research-cell-status" style={{ flex: 1 }}>
                          {(() => {
                            const display = getStatusDisplay(p.status);
                            return (
                              <span style={{ 
                                padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600,
                                background: display.bg,
                                color: display.color,
                                border: `1px solid ${display.border}`
                              }}>
                                {display.text}
                              </span>
                            );
                          })()}
                        </div>
                        <div className="research-cell-links" style={{ flex: 1.2, display: 'flex', gap: 12, justifyContent: 'center' }}>
                          {p.paperLink && <a href={p.paperLink} target="_blank" rel="noreferrer" title={p.type === 'PATENT' || p.type === 'IPR' ? 'View IPR URL' : 'View Publisher Page'} style={{ fontSize: '0.82rem', color: '#2563EB', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}><File size={16} /> Link</a>}
                          {p.documentUrl && <a href={`${API_BASE_URL}${p.documentUrl}`} target="_blank" rel="noreferrer" title="View Proof PDF" style={{ fontSize: '0.82rem', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}><Upload size={16} /> PDF</a>}
                        </div>
                        <div className="research-cell-actions" style={{ flex: 1.5, display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
                          {p.status === 'VERIFIED' ? (
                            <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span>✅</span> approved
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span>🔒</span> Under Review
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Detailed Sub-info Grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', fontSize: '0.78rem', color: 'var(--color-text-secondary, #64748B)', margin: '8px 0', borderTop: '1px dashed var(--color-border, #E2E8F0)', paddingTop: 8 }}>
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

                      {p.remarks && (
                        <div style={{ background: '#FEF2F2', borderLeft: '3px solid #EF4444', padding: '8px 12px', borderRadius: 6, fontSize: '0.8rem', color: '#991B1B', marginTop: 4 }}>
                          <strong>{p.status === 'REJECTED_BY_HOD' ? 'HOD Remarks' : 'Supervisor Remarks'}:</strong> "{p.remarks}"
                        </div>
                      )}
                      {/* Timeline & History Logs */}
                      {renderEvaluationTimelineGeneric(p, thesis, p.type === 'IPR' ? (p.iprType || 'IPR') : p.type, getPublicationVirtualHistory(p))}
                    </div>
                  ))}
                </div>
              )}
            </div>

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
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
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
                    {/* Timeline & History Logs */}
                    {renderEvaluationTimelineGeneric(meeting, thesis, 'Meeting Request', getMeetingVirtualHistory(meeting))}
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
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
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
                      {/* Timeline & History Logs */}
                      {renderEvaluationTimelineGeneric(drc, thesis, 'DRC Meeting Schedule', getDrcMeetingVirtualHistory(drc))}
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
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-muted)' }}>
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
                {/* Timeline & History Logs */}
                {renderEvaluationTimelineGeneric(doc, thesis, 'Additional Document', getDocumentVirtualHistory(doc))}
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
        <form onSubmit={handleSubmit} style={{ background: 'var(--color-bg)', padding: 20, borderRadius: 12, border: '1px solid var(--color-border)', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h4 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Create Academic Modification Request</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Request Type</label>
              <select className="form-input" value={form.type} onChange={e => { setForm({ ...form, type: e.target.value, proposedValue: '' }); setSearchTerm(''); setShowSearchResults(false); }}>
                <option value="TITLE_CHANGE">Thesis Title Modification</option>
                <option value="GUIDE_CHANGE">Supervisor Reallocation</option>
              </select>
            </div>
            <div>
              {form.type === 'TITLE_CHANGE' ? (
                <>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Proposed New Title</label>
                  <input type="text" className="form-input" required placeholder="Enter the exact new thesis topic title..." value={form.proposedValue} onChange={e => setForm({ ...form, proposedValue: e.target.value })} />
                </>
              ) : (
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                    Choose Proposed Research Guide (Active Faculty)
                  </label>
                  {/* Select Box Trigger */}
                  <div 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSearchResults(!showSearchResults);
                    }}
                    style={{
                      background: 'var(--color-surface)',
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
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
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
                          background: 'var(--color-surface)', 
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
                        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
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
                                  borderBottom: '1px solid var(--color-border)', 
                                  background: form.proposedValue === f._id ? '#EFF6FF' : 'white',
                                  transition: 'background-color 0.2s',
                                  textAlign: 'left'
                                }}
                                onMouseOver={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                                onMouseOut={e => e.currentTarget.style.backgroundColor = form.proposedValue === f._id ? '#EFF6FF' : 'white'}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>{f.name}</span>
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
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Supporting Rationale & Academic Reason</label>
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
        <div style={{ textAlign: 'center', padding: '36px', color: '#64748B', background: 'var(--color-bg)', borderRadius: 8 }}>
          No guide or title modification requests logged yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {requests.map(r => (
            <div key={r._id} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1E3A8A' }}>
                  {r.type === 'TITLE_CHANGE' ? '📝 Thesis Title Modification' : '🤝 Supervisor Reallocation'}
                </span>
                <span style={{ 
                  padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600,
                  background: r.status === 'APPROVED' ? '#D1FAE5' : r.status === 'REJECTED' ? '#FEE2E2' : '#FEF3C7',
                  color: r.status === 'APPROVED' ? '#065F46' : r.status === 'REJECTED' ? '#991B1B' : '#D97706'
                }}>
                  {r.status}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: 12, fontSize: '0.85rem' }}>
                <div>
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Current Value:</span>
                  <div style={{ color: 'var(--color-text-primary)', marginTop: 2 }}>{r.currentValue}</div>
                </div>
                <div>
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Proposed Value:</span>
                  <div style={{ color: 'var(--color-text-primary)', marginTop: 2 }}>
                    {r.type === 'GUIDE_CHANGE' ? (faculty.find(f => f._id === r.proposedValue)?.name || 'New Faculty') : r.proposedValue}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                <strong>Rationale/Reason:</strong> "{r.reason}"
              </div>
              {r.remarks && (
                <div style={{ background: 'rgba(239, 68, 68, 0.05)', borderLeft: '3px solid #EF4444', padding: '8px 10px', borderRadius: '0 6px 6px 0', fontSize: '0.8rem', color: '#991B1B', marginBottom: 12 }}>
                  <strong>Remarks:</strong> "{r.remarks}"
                </div>
              )}
              {/* Timeline & History Logs */}
              {renderEvaluationTimelineGeneric(r, thesis, r.type === 'TITLE_CHANGE' ? 'Title Change Request' : 'Supervisor Allocation Request', getChangeRequestVirtualHistory(r, thesis, faculty))}
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
              <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>{c.title}</h4>
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
  const { fetchMyThesis } = useContext(ThesisContext);
  const toast = useToast();
  const reports = milestones.filter(m => m.type === '6_MONTH_REPORT') || [];
  const [file, setFile] = useState(null);
  const [uploadingId, setUploadingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fee Details state variables
  const [feeForm, setFeeForm] = useState({
    periodFrom: '',
    periodTo: '',
    totalFeeDeposited: '',
    remarks: ''
  });
  const [feeFile, setFeeFile] = useState(null);
  const [savingFeeId, setSavingFeeId] = useState(null);
  const [savingFee, setSavingFee] = useState(false);

  const startEditFee = (report) => {
    setFeeForm({
      periodFrom: report.feeDetails?.periodFrom ? new Date(report.feeDetails.periodFrom).toISOString().split('T')[0] : '',
      periodTo: report.feeDetails?.periodTo ? new Date(report.feeDetails.periodTo).toISOString().split('T')[0] : '',
      totalFeeDeposited: report.feeDetails?.totalFeeDeposited || '',
      remarks: report.feeDetails?.remarks || ''
    });
    setFeeFile(null);
    setSavingFeeId(report._id);
  };

  const getCalculatedDuration = (fromStr, toStr) => {
    const fromDate = new Date(fromStr);
    const toDate = new Date(toStr);
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) return '';
    const diffTime = Math.abs(toDate - fromDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const durationMonths = Math.floor(diffDays / 30);
    const durationDays = diffDays % 30;
    return `${durationMonths} Month${durationMonths !== 1 ? 's' : ''} & ${durationDays} Day${durationDays !== 1 ? 's' : ''}`;
  };

  const handleSaveFee = async (id) => {
    if (!feeForm.remarks.trim()) {
      return toast.warning('Remarks are mandatory.');
    }
    const report = reports.find(r => r._id === id);
    if (!report?.feeDetails?.feeReceiptUrl && !feeFile) {
      return toast.warning('Fee receipt document upload is mandatory.');
    }

    setSavingFee(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('periodFrom', feeForm.periodFrom);
      formData.append('periodTo', feeForm.periodTo);
      formData.append('totalFeeDeposited', feeForm.totalFeeDeposited);
      formData.append('remarks', feeForm.remarks);
      if (feeFile) {
        formData.append('feeReceipt', feeFile);
      }

      await axios.post(`${API}/milestones/${id}/fee-details`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Fee Details saved successfully!');
      setSavingFeeId(null);
      
      // Sync state back
      await fetchMyThesis();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save fee details.');
    } finally {
      setSavingFee(false);
    }
  };

  const handleUpload = async (report) => {
    if (!report.feeDetails?.feeReceiptUrl) {
      return toast.warning('Fee payment receipt details are mandatory to submit this report.');
    }
    if (!file) return toast.warning('Please choose a PDF document first.');
    setLoading(true);
    try {
      await onSubmit(report._id, file);
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
        <div style={{ textAlign: 'center', padding: 40, color: '#64748B', background: 'var(--color-bg)', borderRadius: 12 }}>
          <span>⏳</span> No 6-month progress report milestones assigned yet. Your supervisor/admin will allocate these deliverables.
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: '24px', borderLeft: '3px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {reports.map((report, idx) => {
            const isVerified = report.status === 'VERIFIED';
            const isUnderReviewHod = report.status === 'UNDER_REVIEW_HOD';
            const isPending = report.status === 'PENDING';
            const isRejectedBySupervisor = report.status === 'REJECTED_BY_SUPERVISOR';
            const isRejectedByHod = report.status === 'REJECTED_BY_HOD';
            const isDraft = report.status === 'DRAFT' || !report.status || (report.status === 'PENDING' && !report.documentUrl);

            let dotBg = '#CBD5E1';
            let titleColor = '#475569';
            let badgeBg = '#F1F5F9';
            let badgeColor = '#475569';
            let statusText = report.status || 'DRAFT';

            if (isVerified) {
              dotBg = '#10B981';
              titleColor = '#065F46';
              badgeBg = '#D1FAE5';
              badgeColor = '#065F46';
              statusText = 'VERIFIED';
            } else if (isUnderReviewHod) {
              dotBg = '#3B82F6';
              titleColor = '#1D4ED8';
              badgeBg = '#DBEAFE';
              badgeColor = '#1D4ED8';
              statusText = 'UNDER REVIEW (HOD)';
            } else if (isPending && report.documentUrl) {
              dotBg = '#F59E0B';
              titleColor = '#B45309';
              badgeBg = '#FEF3C7';
              badgeColor = '#D97706';
              statusText = 'PENDING (SUPERVISOR)';
            } else if (isRejectedBySupervisor) {
              dotBg = '#EF4444';
              titleColor = '#B91C1C';
              badgeBg = '#FEE2E2';
              badgeColor = '#991B1B';
              statusText = 'REJECTED BY SUPERVISOR';
            } else if (isRejectedByHod) {
              dotBg = '#EF4444';
              titleColor = '#B91C1C';
              badgeBg = '#FEE2E2';
              badgeColor = '#991B1B';
              statusText = 'REJECTED BY HOD';
            } else {
              dotBg = '#94A3B8';
              titleColor = '#475569';
              badgeBg = '#F1F5F9';
              badgeColor = '#475569';
              statusText = 'DRAFT';
            }

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
                <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px' }}>
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
                      background: badgeBg,
                      color: badgeColor
                    }}>
                      {statusText}
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

                  {/* Fee Details Subsection (Always visible if saved) */}
                  {report.feeDetails?.periodFrom && (
                    <div style={{ marginTop: '16px', background: 'var(--color-surface)', padding: '14px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                      <h5 style={{ margin: '0 0 10px 0', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>💰</span> Fee Payment Details
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                        <div><strong>Fee Period:</strong> {new Date(report.feeDetails.periodFrom).toLocaleDateString()} to {new Date(report.feeDetails.periodTo).toLocaleDateString()} ({getCalculatedDuration(report.feeDetails.periodFrom, report.feeDetails.periodTo)})</div>
                        <div><strong>Total Deposited:</strong> INR {report.feeDetails.totalFeeDeposited || 'N/A'}</div>
                        <div><strong>Remarks:</strong> {report.feeDetails.remarks}</div>
                        {report.feeDetails.feeReceiptUrl && (
                          <div>
                            <strong>Receipt:</strong>{' '}
                            <a href={`${API_BASE_URL}${report.feeDetails.feeReceiptUrl}`} target="_blank" rel="noreferrer" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'underline' }}>
                              View Saved Receipt PDF 📄
                            </a>
                          </div>
                        )}
                        {(isDraft || isRejectedBySupervisor || isRejectedByHod) && savingFeeId !== report._id && (
                          <button 
                            onClick={() => startEditFee(report)} 
                            className="btn-outline" 
                            style={{ padding: '4px 10px', fontSize: '0.75rem', marginTop: 6, width: 'fit-content', border: '1px solid #133A26', color: '#133A26' }}
                          >
                            Edit Fee Details
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Empty/Enter Form Only for Drafts if no details are saved or editing is active */}
                  {(isDraft || isRejectedBySupervisor || isRejectedByHod) && (savingFeeId === report._id || !report.feeDetails?.periodFrom) && (
                    <div style={{ marginTop: '16px', background: 'var(--color-bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                      <h5 style={{ margin: '0 0 12px 0', fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>💰</span> Fee Payment Details (Sub-Section)
                      </h5>
                      {savingFeeId === report._id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Period From</label>
                              <input 
                                type="date" 
                                className="form-input" 
                                value={feeForm.periodFrom} 
                                onChange={e => setFeeForm({ ...feeForm, periodFrom: e.target.value })} 
                                style={{ width: '100%', padding: '6px' }} 
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Period To</label>
                              <input 
                                type="date" 
                                className="form-input" 
                                value={feeForm.periodTo} 
                                onChange={e => setFeeForm({ ...feeForm, periodTo: e.target.value })} 
                                style={{ width: '100%', padding: '6px' }} 
                              />
                            </div>
                          </div>

                          {feeForm.periodFrom && feeForm.periodTo && (
                            <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 600 }}>
                              Calculated Period Duration: {getCalculatedDuration(feeForm.periodFrom, feeForm.periodTo)}
                            </div>
                          )}

                          <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Total Fee Deposited (INR)</label>
                            <input 
                              type="text" 
                              className="form-input" 
                              placeholder="e.g. 15,000" 
                              value={feeForm.totalFeeDeposited} 
                              onChange={e => setFeeForm({ ...feeForm, totalFeeDeposited: e.target.value })} 
                              style={{ width: '100%', padding: '6px' }} 
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Remarks <span style={{ color: '#EF4444' }}>*</span></label>
                            <textarea 
                              className="form-input" 
                              rows="2" 
                              placeholder="Add payment remarks (e.g., Bank Challan no, online transaction details)..." 
                              value={feeForm.remarks} 
                              onChange={e => setFeeForm({ ...feeForm, remarks: e.target.value })} 
                              style={{ width: '100%', resize: 'none', padding: '6px' }} 
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>
                              Upload Fee Receipt (PDF/Image) <span style={{ color: '#EF4444' }}>*</span>
                            </label>
                            <input 
                              type="file" 
                              accept=".pdf,.png,.jpg,.jpeg" 
                              onChange={e => setFeeFile(e.target.files[0])} 
                              style={{ fontSize: '0.8rem' }} 
                            />
                            {report.feeDetails?.feeReceiptUrl && !feeFile && (
                              <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: 4 }}>
                                Existing: <a href={`${API_BASE_URL}${report.feeDetails.feeReceiptUrl}`} target="_blank" rel="noreferrer" style={{ color: '#2563EB', textDecoration: 'underline' }}>View Saved Receipt</a>
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: 4 }}>
                            {report.feeDetails?.periodFrom && (
                              <button onClick={() => setSavingFeeId(null)} className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Cancel</button>
                            )}
                            <button 
                              onClick={() => handleSaveFee(report._id)} 
                              className="btn-primary" 
                              disabled={savingFee} 
                              style={{ background: '#059669', padding: '6px 16px', fontSize: '0.8rem' }}
                            >
                              {savingFee ? 'Saving...' : 'Save Fee Details'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p style={{ margin: '0 0 10px 0', fontSize: '0.78rem', color: '#64748B' }}>
                            Payment receipt details are mandatory to submit this progress report.
                          </p>
                          <button 
                            onClick={() => startEditFee(report)} 
                            className="btn-primary" 
                            style={{ background: '#059669', padding: '6px 14px', fontSize: '0.8rem' }}
                          >
                            Enter Fee Details
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Submission Form */}
                  {(isDraft || isRejectedBySupervisor || isRejectedByHod) && (
                    <div style={{ marginTop: '16px', borderTop: '1px dashed #CBD5E1', paddingTop: '16px' }}>
                      {uploadingId === report._id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Select Progress Report PDF</label>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} style={{ fontSize: '0.85rem' }} />
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => setUploadingId(null)} className="btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Cancel</button>
                              <button onClick={() => handleUpload(report)} className="btn-primary" disabled={loading} style={{ background: '#133A26', padding: '6px 16px', fontSize: '0.8rem' }}>
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
                  {/* Timeline & History Logs */}
                  {renderEvaluationTimelineGeneric(report, thesis, 'Progress Report', getMilestoneHistory(report, thesis))}
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
  const [faculty, setFaculty] = useState([]);
  const [forwardedTo, setForwardedTo] = useState('');
  const [forwardedRole, setForwardedRole] = useState('');

  useEffect(() => {
    axios.get(`${API}/auth/faculty`, getAuthHeader())
      .then(res => {
        const deptFaculty = res.data.filter(f => f.department === thesis.department && f.isActive);
        setFaculty(deptFaculty);
      })
      .catch(() => {});
  }, []);

  const hodUser = faculty.find(f => f.role === 'HOD');
  const supervisorUser = thesis.supervisorId;

  const handleRecipientChange = (e) => {
    const val = e.target.value;
    if (!val) {
      setForwardedTo('');
      setForwardedRole('');
      return;
    }
    const [id, role] = val.split(':');
    setForwardedTo(id);
    setForwardedRole(role);
  };

  const handleCreateAndUpload = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return toast.warning('Please enter the chapter title.');
    if (!forwardedTo) return toast.warning('Please select a recipient to forward the chapter draft.');
    if (!file) return toast.warning('Please select a PDF document.');
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/milestones/create`, {
        thesisId: thesis._id,
        type: 'CHAPTER_DRAFT',
        title: newTitle.trim(),
        sequence: drafts.length + 1,
        forwardedTo,
        forwardedRole
      }, getAuthHeader());

      await onSubmit(res.data._id, file);

      toast.success('Chapter Draft uploaded and forwarded successfully!');
      setNewTitle('');
      setFile(null);
      setForwardedTo('');
      setForwardedRole('');
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
        <form onSubmit={handleCreateAndUpload} style={{ background: 'var(--color-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--color-border)', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h4 style={{ margin: 0, color: 'var(--color-text-primary)' }}>Upload Chapter Draft</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Chapter Title (e.g. Chapter 1: Introduction)</label>
              <input type="text" className="form-input" required value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Chapter 1: Literature Review" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Forward To Recipient *</label>
              <select
                className="form-input"
                required
                value={forwardedTo ? `${forwardedTo}:${forwardedRole}` : ''}
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
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Chapter Document Proof (PDF)</label>
            <input type="file" accept=".pdf" required onChange={e => setFile(e.target.files[0])} style={{ fontSize: '0.85rem', marginTop: '6px' }} />
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => { setShowAddForm(false); setForwardedTo(''); setForwardedRole(''); }} className="btn-outline" style={{ padding: '8px 16px' }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ background: '#133A26', padding: '8px 16px' }}>
              {loading ? 'Submitting...' : 'Upload & Submit Draft'}
            </button>
          </div>
        </form>
      )}

      {drafts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '36px', color: '#64748B', background: 'var(--color-bg)', borderRadius: 8 }}>
          No chapter drafts uploaded yet. Complete your outline and upload the first draft!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {drafts.map(d => (
            <div key={d._id} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>{d.title}</h4>
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

              {d.forwardedTo && (
                <div style={{ marginTop: '8px', fontSize: '0.78rem', color: 'var(--color-text-secondary)' }}>
                  📤 Forwarded To: <strong>{d.forwardedTo?.name || 'N/A'}</strong> ({d.forwardedRole})
                </div>
              )}

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
              {/* Timeline & History Logs */}
              {renderEvaluationTimelineGeneric(d, thesis, 'Chapter Draft', getMilestoneHistory(d, thesis))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


const ProfileTab = () => {
  const { user, updateProfile, uploadAvatar, uploadProfileDocument, fetchMe } = useContext(AuthContext);
  const { thesis: rawThesis, createThesis, fetchMyThesis } = useContext(ThesisContext);
  const thesis = rawThesis && rawThesis.status !== 'REJECTED' ? rawThesis : null;
  const toast = useToast();
  const [subTab, setSubTab] = useState('general'); // general | academic | guide
  const [loading, setLoading] = useState(false);
  const [guideUnlocked, setGuideUnlocked] = useState(false);
  const [isStuck, setIsStuck] = useState(false);
  const theme = useThemeStyles();
  const [headerHeight, setHeaderHeight] = useState(64);

  useEffect(() => {
    const updateHeaderHeight = () => {
      const headerEl = document.querySelector('.app-header') || document.querySelector('.header');
      if (headerEl) {
        setHeaderHeight(headerEl.offsetHeight);
      }
    };
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    window.addEventListener('scroll', updateHeaderHeight);
    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
      window.removeEventListener('scroll', updateHeaderHeight);
    };
  }, []);

  const [isPersonalInfoSavedState, setIsPersonalInfoSavedState] = useState(false);
  useEffect(() => {
    if (user?.profile?.dob) {
      setIsPersonalInfoSavedState(true);
    }
  }, [user?.profile?.dob]);

  // ── Milestone sidebar state & refs ──
  const [activeSection, setActiveSection] = useState('personal');
  const sectionRefs = {
    personal: React.useRef(null),
    education: React.useRef(null),
    supervisor: React.useRef(null)
  };
  const milestonePlaceholderRef = React.useRef(null);
  const mobileBarRef = React.useRef(null);
  const isAutoScrollingRef = React.useRef(false);

  const milestoneItems = [
    { key: 'personal', label: 'Personal Info', Icon: User },
    { key: 'education', label: 'Academic Qualifications', Icon: BookOpen },
    { key: 'supervisor', label: 'Supervisor Preference', Icon: UserCheck }
  ];

  const profileLayoutCSS = `
    .profile-tab-wrapper { padding: 24px; }
    .profile-layout-container { display:flex; gap:28px; max-width:1280px; margin:0 auto; padding:12px; position:relative; }
    .card.active-card { border-color:#133A26 !important; box-shadow:0 6px 20px rgba(19,58,38,0.12) !important; }
    .timeline-sidebar-panel {
      width: 260px;
      position: sticky;
      top: 90px;
      height: fit-content;
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex-shrink: 0;
    }
    .profile-details-column { flex:1; display:flex; flex-direction:column; gap:24px; min-width:0; }
    .mobile-milestones-bar {
      display: none;
      position: sticky;
      top: 0;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(226, 232, 240, 0.8);
      border-radius: 12px;
      padding: 8px 12px;
      z-index: 99;
      overflow-x: auto;
      white-space: nowrap;
      gap: 8px;
      -webkit-overflow-scrolling: touch;
      margin: 8px 0 16px 0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03), 0 1px 3px rgba(0, 0, 0, 0.02);
      scrollbar-width: none;
    }
    .mobile-milestones-bar::-webkit-scrollbar {
      display: none;
    }
    .mobile-milestone-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.74rem;
      font-weight: 600;
      color: #475569;
      background: transparent;
      border: 1px solid transparent;
      transition: all 0.2s ease-in-out;
      cursor: pointer;
      flex-shrink: 0;
    }
    .mobile-milestone-link:hover {
      background: rgba(19, 58, 38, 0.05);
      color: #133A26;
    }
    .mobile-milestone-link.active {
      color: #ffffff !important;
      background: #133A26 !important;
      border-color: #133A26 !important;
      box-shadow: 0 4px 10px rgba(19, 58, 38, 0.25);
    }
    @media (max-width: 768px) {
      .profile-tab-wrapper {
        padding: 8px 0 !important;
      }
      .profile-layout-container {
        flex-direction: column;
        gap: 16px;
        padding: 8px 0 !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }
      .timeline-sidebar-panel {
        display: none !important;
      }
      .mobile-milestones-bar {
        display: flex !important;
        margin: 8px 4px 16px 4px !important;
      }
      .mobile-milestones-bar.is-stuck {
        position: fixed !important;
        top: var(--header-height, 64px) !important;
        left: 0 !important;
        width: 100% !important;
        height: 50px !important;
        border-radius: 0 !important;
        border-left: none !important;
        border-right: none !important;
        border-top: none !important;
        margin: 0 !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important;
        background: #ffffff !important;
        z-index: 999 !important;
      }
    }
  `;

  const scrollToSection = (key, force = false) => {
    if (!force) {
      if (key === 'education' && !isPersonalInfoSavedState) {
        return;
      }
      if (key === 'supervisor' && !guideUnlocked) {
        return;
      }
    }
    setActiveSection(key);
    isAutoScrollingRef.current = true;
    sectionRefs[key].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => { isAutoScrollingRef.current = false; }, 850);
  };

  // Sticking milestones bar scroll listener
  useEffect(() => {
    const checkSticky = () => {
      if (milestonePlaceholderRef.current) {
        const rect = milestonePlaceholderRef.current.getBoundingClientRect();
        setIsStuck(rect.top <= headerHeight + 2);
      }
    };

    checkSticky();

    const dashboardArea = document.querySelector('.dashboard-area');
    if (dashboardArea) {
      dashboardArea.addEventListener('scroll', checkSticky);
    }
    window.addEventListener('scroll', checkSticky);
    window.addEventListener('resize', checkSticky);

    return () => {
      if (dashboardArea) {
        dashboardArea.removeEventListener('scroll', checkSticky);
      }
      window.removeEventListener('scroll', checkSticky);
      window.removeEventListener('resize', checkSticky);
    };
  }, [headerHeight]);

  // Highlight active card border
  useEffect(() => {
    Object.entries(sectionRefs).forEach(([key, ref]) => {
      if (ref.current) {
        ref.current.classList.toggle('active-card', key === activeSection);
      }
    });
  }, [activeSection]);

  // Click on a section card sets it active
  useEffect(() => {
    const listeners = [];
    Object.entries(sectionRefs).forEach(([key, ref]) => {
      if (ref.current) {
        const h = () => {
          if (key === 'education' && !user?.profile?.dob) return;
          if (key === 'supervisor' && !guideUnlocked) return;
          setActiveSection(key);
        };
        ref.current.addEventListener('click', h);
        listeners.push({ el: ref.current, h });
      }
    });
    return () => listeners.forEach(({ el, h }) => el.removeEventListener('click', h));
  }, [isPersonalInfoSavedState, guideUnlocked]);

  // Auto-scroll mobile bar
  useEffect(() => {
    if (mobileBarRef.current) {
      const el = mobileBarRef.current.querySelector(`.mobile-milestone-link[data-key="${activeSection}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeSection]);
  useEffect(() => {
    fetchMe();
  }, []);
  const [sessions, setSessions] = useState([]);
  useEffect(() => {
    axios.get(`${API_URL}/attendance/sessions`, getAuthHeader())
      .then(res => {
        if (Array.isArray(res.data)) {
          setSessions(res.data);
        }
      })
      .catch(err => console.error('Error fetching sessions:', err));
  }, []);
  const [registering, setRegistering] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState('');
  const [selectedFileNames, setSelectedFileNames] = useState({});
  const [pendingFiles, setPendingFiles] = useState({});
  const [editModes, setEditModes] = useState({
    general: false,
    class10: false,
    class12: false,
    graduation: false,
    postGraduation: false,
    otherQuals: false,
    mphil: false,
    netJrf: false,
    fellowships: false,
    guide: false
  });
  const isEditingAcademic = !!(
    editModes.class10 ||
    editModes.class12 ||
    editModes.graduation ||
    editModes.postGraduation ||
    editModes.otherQuals ||
    editModes.mphil ||
    editModes.netJrf ||
    editModes.fellowships
  );
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
  const [academicSession, setAcademicSession] = useState(user?.profile?.academicSession || '');
  const [degreeType, setDegreeType] = useState(user?.profile?.degreeType || 'Ph.D.');
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
  const [otherQuals, setOtherQuals] = useState(user?.profile?.qualifications?.otherQuals || []);

  // Guide Selection
  const [preferredGuideId, setPreferredGuideId] = useState(user?.profile?.preferredGuideId || '');
  const [faculties, setFaculties] = useState([]);

  // Gender & Category from master data
  const [genders, setGenders] = useState([]);
  const [categories, setCategories] = useState([]);

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
      setAcademicSession(user.profile.academicSession || '');
      setDegreeType(user.profile.degreeType || 'Ph.D.');
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
      setFellowships(prev => {
        const dbFellowships = q?.fellowships || [];
        if (!prev || prev.length === 0) return dbFellowships;
        const merged = prev.map((localRow, idx) => {
          if (idx < dbFellowships.length) {
            return {
              ...dbFellowships[idx],
              ...localRow,
              certificateUrl: dbFellowships[idx]?.certificateUrl || localRow.certificateUrl
            };
          }
          return localRow;
        });
        if (dbFellowships.length > prev.length) {
          merged.push(...dbFellowships.slice(prev.length));
        }
        return merged;
      });

      setOtherQuals(prev => {
        const dbQuals = q?.otherQuals || [];
        if (!prev || prev.length === 0) return dbQuals;
        const merged = prev.map((localRow, idx) => {
          if (idx < dbQuals.length) {
            return {
              ...dbQuals[idx],
              ...localRow,
              certificateUrl: dbQuals[idx]?.certificateUrl || localRow.certificateUrl
            };
          }
          return localRow;
        });
        if (dbQuals.length > prev.length) {
          merged.push(...dbQuals.slice(prev.length));
        }
        return merged;
      });

      // Initialize editModes based on if database has values
      setEditModes(prev => ({
        general: prev.general || !user?.profile?.dob,
        class10: prev.class10 || !q?.class10?.rollNo,
        class12: prev.class12 || !q?.class12?.rollNo,
        graduation: prev.graduation || !q?.graduation?.rollNo,
        postGraduation: prev.postGraduation || !q?.postGraduation?.rollNo,
        otherQuals: prev.otherQuals || false,
        mphil: prev.mphil || (mphilDone === 'YES' && !q?.mphil?.university),
        netJrf: prev.netJrf || (netJrfQualified === 'YES' && !q?.netJrf?.rollNo),
        fellowships: prev.fellowships || false,
        guide: prev.guide || !user?.profile?.preferredGuideId
      }));
    } else {
      setEditModes({
        general: true,
        class10: true,
        class12: true,
        graduation: true,
        postGraduation: true,
        otherQuals: false,
        mphil: false,
        netJrf: false,
        fellowships: false,
        guide: true
      });
    }
    if (user?.profile?.preferredGuideId || thesis) {
      setGuideUnlocked(true);
    }
  }, [user, thesis]);

  // Fetch category and gender masters
  useEffect(() => {
    axios.get(`${API_URL}/attendance/public/masters/category-gender`)
      .then(res => {
        const data = res.data;
        setCategories(data.filter(d => d.type === 'CATEGORY'));
        setGenders(data.filter(d => d.type === 'GENDER'));
      })
      .catch(err => console.error('Error fetching category/gender masters:', err));
  }, []);

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
      thesisKeywords && thesisKeywords.trim() &&
      academicSession && academicSession.trim()
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

  const validatePersonalInfo = () => {
    if (!dob) return 'Date of Birth is required.';
    if (!gender) return 'Gender is required.';
    if (!category) return 'Social Category is required.';
    if (!nationality || !nationality.trim()) return 'Nationality is required.';
    if (!fatherName || !fatherName.trim()) return 'Father\'s Name is required.';
    if (!motherName || !motherName.trim()) return 'Mother\'s Name is required.';
    if (!phoneNumber || !phoneNumber.trim()) return 'Phone Number is required.';
    const cleanedPhone = phoneNumber.trim().replace(/[\s\-()]/g, '');
    const indianPhoneRegex = /^(\+91|91|0)?[6-9]\d{9}$/;
    if (!indianPhoneRegex.test(cleanedPhone)) {
      return 'Please enter a valid 10-digit Indian phone number (starts with 6-9).';
    }
    if (!address || !address.trim()) return 'Residential Address is required.';
    if (!academicSession) return 'Academic Session is required.';
    if (!enrollmentNumber || !enrollmentNumber.trim()) return 'Enrollment Number is required.';
    if (!admissionDate) return 'Date of Admission is required.';
    if (!phdMode) return 'Mode of Ph.D. is required.';
    if (!specialization || !specialization.trim()) return 'Area of Specialization is required.';
    if (!areaOfInterest || !areaOfInterest.trim()) return 'Area of Research Interest is required.';
    if (!thesisTitle || !thesisTitle.trim()) return 'Thesis Title is required.';
    if (!thesisSummary || !thesisSummary.trim()) return 'Thesis Summary / Abstract is required.';
    if (!thesisKeywords || !thesisKeywords.trim()) return 'Keywords are required.';
    return null;
  };

  const validateAcademicQualifications = () => {
    const q = user?.profile?.qualifications;
    if (!q) return 'No academic qualifications record found. Please enter and save Class 10, Class 12, Graduation, and Post Graduation details.';

    if (!class10Roll || !class10Board || !class10School || !class10Marks || !class10Total || !class10Percentage || !q?.class10?.certificateUrl) {
      return 'Please complete and save Class 10 Details including certificate upload.';
    }
    if (!class12Roll || !class12Board || !class12School || !class12Marks || !class12Total || !class12Percentage || !q?.class12?.certificateUrl) {
      return 'Please complete and save Class 12 Details including certificate upload.';
    }
    if (!gradRoll || !gradDegree || !gradCollege || !gradUniversity || !gradMarks || !gradTotal || !gradPercentage || !q?.graduation?.certificateUrl) {
      return 'Please complete and save Graduation Details including certificate upload.';
    }
    if (!pgRoll || !pgDegree || !pgCollege || !pgUniversity || !pgMarks || !pgTotal || !pgPercentage || !q?.postGraduation?.certificateUrl) {
      return 'Please complete and save Post Graduation Details including certificate upload.';
    }
    if (mphilDone === 'YES') {
      if (!mphilUniversity || !mphilPassingYear || !mphilTotalMarks || !mphilMarksObtained || !mphilPercentage || !q?.mphil?.certificateUrl) {
        return 'Please complete and save M.Phil Details including certificate upload.';
      }
    }
    if (netJrfQualified === 'YES') {
      if (!netJrfCertNumber || !netJrfRoll || !netJrfRank || !netJrfScore || !netJrfIssueDate || !q?.netJrf?.certificateUrl) {
        return 'Please complete and save NET JRF Details including certificate upload.';
      }
    }
    return null;
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

  const handleDocUpload = (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFileNames(prev => ({ ...prev, [docType]: file.name }));
    setPendingFiles(prev => ({ ...prev, [docType]: file }));
  };

  const handleCancel = (sectionKey) => {
    setEditModes(prev => ({ ...prev, [sectionKey]: false }));
    setPendingFiles(prev => {
      const next = { ...prev };
      delete next[sectionKey];
      if (sectionKey === 'otherQuals') {
        Object.keys(next).forEach(k => {
          if (k.startsWith('otherQuals_')) delete next[k];
        });
      }
      if (sectionKey === 'fellowships') {
        Object.keys(next).forEach(k => {
          if (k.startsWith('fellowship_')) delete next[k];
        });
      }
      return next;
    });
    setSelectedFileNames(prev => {
      const next = { ...prev };
      delete next[sectionKey];
      if (sectionKey === 'otherQuals') {
        Object.keys(next).forEach(k => {
          if (k.startsWith('otherQuals_')) delete next[k];
        });
      }
      if (sectionKey === 'fellowships') {
        Object.keys(next).forEach(k => {
          if (k.startsWith('fellowship_')) delete next[k];
        });
      }
      return next;
    });
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

  const handleUpdate = async (e, section) => {
    e.preventDefault();
    const validationError = validatePersonalInfo();
    if (validationError) {
      toast.error(validationError);
      return;
    }

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
      academicSession,
      degreeType: 'Ph.D.',
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
        })),
        otherQuals: otherQuals.map((o, i) => ({
          ...o,
          certificateUrl: user?.profile?.qualifications?.otherQuals?.[i]?.certificateUrl || o.certificateUrl || ''
        }))
      }
    };

    const res = await updateProfile(payload);
    setLoading(false);
    if (res.success) {
      setIsPersonalInfoSavedState(true);
      let msg = 'PhD Scholar profile details updated successfully!';
      const isFirstTimeGeneral = !user?.profile?.dob;
      if (section === 'guide') {
        msg = 'Guide preference saved. Submit your profile to HOD for verification now.';
        setEditModes(prev => ({ ...prev, guide: false }));
      } else if (subTab === 'general' || isFirstTimeGeneral) {
        msg = 'Personal details saved successfully! Proceeding to Academic Qualifications.';
        setEditModes(prev => ({ ...prev, general: false }));
        setTimeout(() => {
          scrollToSection('education', true);
        }, 100);
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

    let tempQualifications = user?.profile?.qualifications || {};

    // --- STEP 1: Validate Text Input Fields ---
    if (sectionKey === 'class10') {
      if (!class10Roll.trim() || !class10Board.trim() || !class10School.trim() || !class10Marks.trim() || !class10Total.trim() || !class10Percentage.trim()) {
        toast.error('Please fill in all Class 10 details before saving.');
        setLoading(false);
        return;
      }
    } else if (sectionKey === 'class12') {
      if (!class12Roll.trim() || !class12Board.trim() || !class12School.trim() || !class12Marks.trim() || !class12Total.trim() || !class12Percentage.trim()) {
        toast.error('Please fill in all Class 12 details before saving.');
        setLoading(false);
        return;
      }
    } else if (sectionKey === 'graduation') {
      if (!gradRoll.trim() || !gradDegree.trim() || !gradCollege.trim() || !gradUniversity.trim() || !gradMarks.trim() || !gradTotal.trim() || !gradPercentage.trim()) {
        toast.error('Please fill in all Graduation details before saving.');
        setLoading(false);
        return;
      }
    } else if (sectionKey === 'postGraduation') {
      if (!pgRoll.trim() || !pgDegree.trim() || !pgCollege.trim() || !pgUniversity.trim() || !pgMarks.trim() || !pgTotal.trim() || !pgPercentage.trim()) {
        toast.error('Please fill in all Post Graduation details before saving.');
        setLoading(false);
        return;
      }
    } else if (sectionKey === 'mphil') {
      if (mphilDone === 'YES') {
        if (!mphilUniversity.trim() || !mphilPassingYear.trim() || !mphilTotalMarks.trim() || !mphilMarksObtained.trim() || !mphilPercentage.trim()) {
          toast.error('Please fill in all M.Phil details before saving.');
          setLoading(false);
          return;
        }
      }
    } else if (sectionKey === 'netJrf') {
      if (!netJrfQualified) {
        toast.error('Please select whether you qualified for NET JRF.');
        setLoading(false);
        return;
      }
      if (netJrfQualified === 'YES') {
        if (!netJrfCertNumber.trim() || !netJrfRoll.trim() || !netJrfRank.trim() || !netJrfScore.trim() || !netJrfIssueDate.trim()) {
          toast.error('Please fill in all NET JRF details before saving.');
          setLoading(false);
          return;
        }
      }
    }

    // --- STEP 2: Validate Certificate Selection ---
    if (['class10', 'class12', 'graduation', 'postGraduation'].includes(sectionKey)) {
      const hasCert = tempQualifications[sectionKey]?.certificateUrl || pendingFiles[sectionKey];
      if (!hasCert) {
        toast.error(`Please select a certificate PDF to upload for ${sectionKey.replace(/([A-Z])/g, ' $1').toUpperCase()}`);
        setLoading(false);
        return;
      }
    } else if (sectionKey === 'mphil' && mphilDone === 'YES') {
      const hasCert = tempQualifications.mphil?.certificateUrl || pendingFiles.mphil;
      if (!hasCert) {
        toast.error('Please select a certificate PDF to upload for M.Phil');
        setLoading(false);
        return;
      }
    } else if (sectionKey === 'netJrf' && netJrfQualified === 'YES') {
      const hasCert = tempQualifications.netJrf?.certificateUrl || pendingFiles.netJrf;
      if (!hasCert) {
        toast.error('Please select a certificate PDF to upload for NET JRF');
        setLoading(false);
        return;
      }
    }

    // --- STEP 3: Upload Pending Certificate ---
    if (['class10', 'class12', 'graduation', 'postGraduation', 'mphil', 'netJrf'].includes(sectionKey)) {
      if (pendingFiles[sectionKey]) {
        setUploadingDoc(sectionKey);
        const uploadRes = await uploadProfileDocument(pendingFiles[sectionKey], sectionKey);
        setUploadingDoc('');
        if (!uploadRes.success) {
          toast.error(`Certificate upload failed: ${uploadRes.message}`);
          setLoading(false);
          return;
        }
        tempQualifications = uploadRes.user?.profile?.qualifications || {};
        setPendingFiles(prev => {
          const next = { ...prev };
          delete next[sectionKey];
          return next;
        });
      }
    }

    // --- STEP 4: Format Payload & Send Update ---
    let sectionData = {};
    if (sectionKey === 'class10') {
      sectionData = {
        rollNo: class10Roll,
        board: class10Board,
        school: class10School,
        marksObtained: class10Marks,
        totalMarks: class10Total,
        percentage: class10Percentage,
        certificateUrl: tempQualifications?.class10?.certificateUrl
      };
    } else if (sectionKey === 'class12') {
      sectionData = {
        rollNo: class12Roll,
        board: class12Board,
        school: class12School,
        marksObtained: class12Marks,
        totalMarks: class12Total,
        percentage: class12Percentage,
        certificateUrl: tempQualifications?.class12?.certificateUrl
      };
    } else if (sectionKey === 'graduation') {
      sectionData = {
        rollNo: gradRoll,
        degree: gradDegree,
        college: gradCollege,
        university: gradUniversity,
        marksObtained: gradMarks,
        totalMarks: gradTotal,
        percentage: gradPercentage,
        certificateUrl: tempQualifications?.graduation?.certificateUrl
      };
    } else if (sectionKey === 'postGraduation') {
      sectionData = {
        rollNo: pgRoll,
        degree: pgDegree,
        college: pgCollege,
        university: pgUniversity,
        marksObtained: pgMarks,
        totalMarks: pgTotal,
        percentage: pgPercentage,
        certificateUrl: tempQualifications?.postGraduation?.certificateUrl
      };
    } else if (sectionKey === 'mphil') {
      sectionData = {
        done: mphilDone === 'YES',
        university: mphilUniversity,
        passingYear: mphilPassingYear,
        totalMarks: mphilTotalMarks,
        marksObtained: mphilMarksObtained,
        percentage: mphilPercentage,
        certificateUrl: tempQualifications?.mphil?.certificateUrl
      };
    } else if (sectionKey === 'netJrf') {
      sectionData = {
        qualified: netJrfQualified === 'YES',
        certNumber: netJrfCertNumber,
        rollNo: netJrfRoll,
        rank: netJrfRank,
        score: netJrfScore,
        issueDate: netJrfIssueDate,
        certificateUrl: tempQualifications?.netJrf?.certificateUrl
      };
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
      const prettyName = sectionKey === 'netJrf' ? 'NET JRF' : sectionKey === 'otherQuals' ? 'Other Qualifications' : sectionKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      toast.success(`${prettyName} details saved successfully!`);
      setEditModes(prev => ({ ...prev, [sectionKey]: false }));
    } else {
      toast.error(`Failed to save details: ${res.message}`);
    }
  };

  const saveSectionRow = async (sectionKey, rowIndex) => {
    setLoading(true);

    let tempQualifications = user?.profile?.qualifications || {};

    if (sectionKey === 'otherQuals') {
      const o = otherQuals[rowIndex];
      if (!o || !o.type || !o.rollNo || !o.board || !o.school || !o.marksObtained || !o.totalMarks || !o.percentage) {
        toast.error(`Please fill in all details for Qualification #${rowIndex + 1} before saving.`);
        setLoading(false);
        return;
      }
      if (o.type === 'Other' && !o.otherType) {
        toast.error(`Please specify the qualification type for Qualification #${rowIndex + 1}.`);
        setLoading(false);
        return;
      }
      const key = `otherQuals_${rowIndex}`;
      const hasCert = tempQualifications?.otherQuals?.[rowIndex]?.certificateUrl || o.certificateUrl || pendingFiles[key];
      if (!hasCert) {
        toast.error(`Please select a certificate PDF to upload for Qualification #${rowIndex + 1}`);
        setLoading(false);
        return;
      }

      // Upload pending certificate if exists
      let finalCertUrl = tempQualifications?.otherQuals?.[rowIndex]?.certificateUrl || o.certificateUrl || '';
      if (pendingFiles[key]) {
        setUploadingDoc(key);
        const uploadRes = await uploadProfileDocument(pendingFiles[key], key);
        setUploadingDoc('');
        if (!uploadRes.success) {
          toast.error(`Certificate upload failed for Qualification #${rowIndex + 1}: ${uploadRes.message}`);
          setLoading(false);
          return;
        }
        tempQualifications = uploadRes.user?.profile?.qualifications || {};
        finalCertUrl = tempQualifications?.otherQuals?.[rowIndex]?.certificateUrl || '';
        setPendingFiles(prev => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }

      // Construct payload array with only valid rows to prevent saving incomplete ones
      const listToSave = [];
      otherQuals.forEach((item, idx) => {
        const isCurrent = idx === rowIndex;
        const cert = isCurrent ? finalCertUrl : (item.certificateUrl || '');
        
        const hasFields = item.type && item.rollNo && item.board && item.school && item.marksObtained && item.totalMarks && item.percentage;
        const hasSpecific = item.type !== 'Other' || item.otherType;
        
        if (isCurrent || (hasFields && hasSpecific && cert)) {
          listToSave.push({
            type: isCurrent ? o.type : item.type,
            otherType: isCurrent ? o.otherType : item.otherType,
            rollNo: isCurrent ? o.rollNo : item.rollNo,
            board: isCurrent ? o.board : item.board,
            school: isCurrent ? o.school : item.school,
            marksObtained: isCurrent ? o.marksObtained : item.marksObtained,
            totalMarks: isCurrent ? o.totalMarks : item.totalMarks,
            percentage: isCurrent ? o.percentage : item.percentage,
            certificateUrl: cert
          });
        }
      });

      const payload = {
        ...user?.profile,
        qualifications: {
          ...user?.profile?.qualifications,
          otherQuals: listToSave
        }
      };

      const res = await updateProfile(payload);
      setLoading(false);
      if (res.success) {
        toast.success(`Qualification #${rowIndex + 1} saved successfully!`);
      } else {
        toast.error(`Failed to save: ${res.message}`);
      }
    } else if (sectionKey === 'fellowships') {
      const f = fellowships[rowIndex];
      if (!f || !f.type || !f.awardingBody || !f.awardDate || !f.referenceNo || !f.duration || !f.amount) {
        toast.error(`Please fill in all details for Fellowship #${rowIndex + 1} before saving.`);
        setLoading(false);
        return;
      }
      if (f.type === 'Other' && !f.otherType) {
        toast.error(`Please specify the fellowship type for Fellowship #${rowIndex + 1}.`);
        setLoading(false);
        return;
      }
      const key = `fellowship_${rowIndex}`;
      const hasCert = tempQualifications?.fellowships?.[rowIndex]?.certificateUrl || f.certificateUrl || pendingFiles[key];
      if (!hasCert) {
        toast.error(`Please select a certificate PDF to upload for Fellowship #${rowIndex + 1}`);
        setLoading(false);
        return;
      }

      // Upload pending certificate if exists
      let finalCertUrl = tempQualifications?.fellowships?.[rowIndex]?.certificateUrl || f.certificateUrl || '';
      if (pendingFiles[key]) {
        setUploadingDoc(key);
        const uploadRes = await uploadProfileDocument(pendingFiles[key], key);
        setUploadingDoc('');
        if (!uploadRes.success) {
          toast.error(`Certificate upload failed for Fellowship #${rowIndex + 1}: ${uploadRes.message}`);
          setLoading(false);
          return;
        }
        tempQualifications = uploadRes.user?.profile?.qualifications || {};
        finalCertUrl = tempQualifications?.fellowships?.[rowIndex]?.certificateUrl || '';
        setPendingFiles(prev => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }

      // Construct payload array with only valid rows to prevent saving incomplete ones
      const listToSave = [];
      fellowships.forEach((item, idx) => {
        const isCurrent = idx === rowIndex;
        const cert = isCurrent ? finalCertUrl : (item.certificateUrl || '');
        
        const hasFields = item.type && item.awardingBody && item.awardDate && item.referenceNo && item.duration && item.amount;
        const hasSpecific = item.type !== 'Other' || item.otherType;
        
        if (isCurrent || (hasFields && hasSpecific && cert)) {
          listToSave.push({
            type: isCurrent ? f.type : item.type,
            otherType: isCurrent ? f.otherType : item.otherType,
            awardingBody: isCurrent ? f.awardingBody : item.awardingBody,
            awardDate: isCurrent ? f.awardDate : item.awardDate,
            referenceNo: isCurrent ? f.referenceNo : item.referenceNo,
            duration: isCurrent ? f.duration : item.duration,
            amount: isCurrent ? f.amount : item.amount,
            certificateUrl: cert
          });
        }
      });

      const payload = {
        ...user?.profile,
        qualifications: {
          ...user?.profile?.qualifications,
          fellowships: listToSave
        }
      };

      const res = await updateProfile(payload);
      setLoading(false);
      if (res.success) {
        toast.success(`Fellowship #${rowIndex + 1} saved successfully!`);
      } else {
        toast.error(`Failed to save: ${res.message}`);
      }
    }
  };

  const handleRemoveRow = (sectionKey, index) => {
    const list = sectionKey === 'otherQuals' ? otherQuals : fellowships;
    const setList = sectionKey === 'otherQuals' ? setOtherQuals : setFellowships;
    const prefix = sectionKey === 'otherQuals' ? 'otherQuals_' : 'fellowship_';

    const updatedList = [...list];
    updatedList.splice(index, 1);
    setList(updatedList);

    setPendingFiles(prev => {
      const next = {};
      Object.keys(prev).forEach(key => {
        if (key.startsWith(prefix)) {
          const idx = parseInt(key.split('_')[1], 10);
          if (idx < index) {
            next[key] = prev[key];
          } else if (idx > index) {
            next[`${prefix}${idx - 1}`] = prev[key];
          }
        } else {
          next[key] = prev[key];
        }
      });
      return next;
    });

    setSelectedFileNames(prev => {
      const next = {};
      Object.keys(prev).forEach(key => {
        if (key.startsWith(prefix)) {
          const idx = parseInt(key.split('_')[1], 10);
          if (idx < index) {
            next[key] = prev[key];
          } else if (idx > index) {
            next[`${prefix}${idx - 1}`] = prev[key];
          }
        } else {
          next[key] = prev[key];
        }
      });
      return next;
    });
  };

  const saveSectionList = async (sectionKey) => {
    setLoading(true);
    let tempQualifications = user?.profile?.qualifications || {};

    const list = sectionKey === 'otherQuals' ? otherQuals : fellowships;
    const keyPrefix = sectionKey === 'otherQuals' ? 'otherQuals_' : 'fellowship_';

    // 1. Validation
    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      const key = `${keyPrefix}${i}`;
      
      if (sectionKey === 'otherQuals') {
        if (!item.type || !item.rollNo || !item.board || !item.school || !item.marksObtained || !item.totalMarks || !item.percentage) {
          toast.error(`Please fill in all details for Qualification #${i + 1} or remove the row before saving.`);
          setLoading(false);
          return;
        }
        if (item.type === 'Other' && !item.otherType) {
          toast.error(`Please specify the qualification type for Qualification #${i + 1}.`);
          setLoading(false);
          return;
        }
        const hasCert = tempQualifications?.otherQuals?.[i]?.certificateUrl || item.certificateUrl || pendingFiles[key];
        if (!hasCert) {
          toast.error(`Please select a certificate PDF to upload for Qualification #${i + 1}`);
          setLoading(false);
          return;
        }
      } else {
        if (!item.type || !item.awardingBody || !item.awardDate || !item.referenceNo || !item.duration || !item.amount) {
          toast.error(`Please fill in all details for Fellowship #${i + 1} or remove the row before saving.`);
          setLoading(false);
          return;
        }
        if (item.type === 'Other' && !item.otherType) {
          toast.error(`Please specify the fellowship type for Fellowship #${i + 1}.`);
          setLoading(false);
          return;
        }
        const hasCert = tempQualifications?.fellowships?.[i]?.certificateUrl || item.certificateUrl || pendingFiles[key];
        if (!hasCert) {
          toast.error(`Please select a certificate PDF to upload for Fellowship #${i + 1}`);
          setLoading(false);
          return;
        }
      }
    }

    // 2. Upload pending files
    const uploadedUrls = {};
    for (let i = 0; i < list.length; i++) {
      const key = `${keyPrefix}${i}`;
      if (pendingFiles[key]) {
        setUploadingDoc(key);
        const uploadRes = await uploadProfileDocument(pendingFiles[key], key);
        setUploadingDoc('');
        if (!uploadRes.success) {
          toast.error(`Certificate upload failed for item #${i + 1}: ${uploadRes.message}`);
          setLoading(false);
          return;
        }
        tempQualifications = uploadRes.user?.profile?.qualifications || {};
        uploadedUrls[i] = tempQualifications?.[sectionKey]?.[i]?.certificateUrl || '';
        setPendingFiles(prev => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    }

    // 3. Construct list to save
    const listToSave = [];
    list.forEach((item, i) => {
      const cert = uploadedUrls[i] || item.certificateUrl || '';
      if (sectionKey === 'otherQuals') {
        listToSave.push({
          type: item.type,
          otherType: item.otherType,
          rollNo: item.rollNo,
          board: item.board,
          school: item.school,
          marksObtained: item.marksObtained,
          totalMarks: item.totalMarks,
          percentage: item.percentage,
          certificateUrl: cert
        });
      } else {
        listToSave.push({
          type: item.type,
          otherType: item.otherType,
          awardingBody: item.awardingBody,
          awardDate: item.awardDate,
          referenceNo: item.referenceNo,
          duration: item.duration,
          amount: item.amount,
          certificateUrl: cert
        });
      }
    });

    const payload = {
      ...user?.profile,
      qualifications: {
        ...user?.profile?.qualifications,
        [sectionKey]: listToSave
      }
    };

    const res = await updateProfile(payload);
    setLoading(false);
    if (res.success) {
      toast.success(`${sectionKey === 'otherQuals' ? 'Other Qualifications' : 'Fellowships'} saved successfully!`);
      setEditModes(prev => ({ ...prev, [sectionKey]: false }));
    } else {
      toast.error(`Failed to save: ${res.message}`);
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
      return <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '12px', background: '#F3F4F6', color: 'var(--color-text-muted)', fontWeight: 600 }}>Optional</span>;
    }
    if (docType.startsWith('fellowship_')) {
      return <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '12px', background: '#F3F4F6', color: 'var(--color-text-muted)', fontWeight: 600 }}>Optional</span>;
    }
    return <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '12px', background: '#F3F4F6', color: 'var(--color-text-muted)', fontWeight: 600 }}>Pending Upload</span>;
  };

  const getUploadButton = (docType, certUrl) => {
    // Determine edit mode for this specific docType
    let isEditingThisDoc = false;
    if (docType === 'class10') isEditingThisDoc = editModes.class10;
    else if (docType === 'class12') isEditingThisDoc = editModes.class12;
    else if (docType === 'graduation') isEditingThisDoc = editModes.graduation;
    else if (docType === 'postGraduation') isEditingThisDoc = editModes.postGraduation;
    else if (docType.startsWith('otherQuals_')) isEditingThisDoc = editModes.otherQuals;
    else if (docType === 'mphil') isEditingThisDoc = editModes.mphil;
    else if (docType === 'netJrf') isEditingThisDoc = editModes.netJrf;
    else if (docType.startsWith('fellowship_')) isEditingThisDoc = editModes.fellowships;

    const isUploaded = !!certUrl;
    const isDisabled = !!thesis || !isEditingThisDoc;
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
          background: isDisabled ? '#9CA3AF' : isUploaded ? '#D97706' : '#4B5563', 
          color: 'white', 
          padding: '8px 12px', 
          borderRadius: '6px', 
          fontSize: '0.75rem', 
          fontWeight: 600, 
          cursor: isDisabled ? 'not-allowed' : 'pointer', 
          textAlign: 'center',
          transition: 'all 0.2s',
          boxShadow: !isDisabled && isUploaded ? '0 2px 4px rgba(217, 119, 6, 0.2)' : 'none'
        }}>
          {isUploaded ? '✓ Certificate Uploaded' : '📤 Upload Certificate (PDF)'}
          {!isDisabled && <input type="file" accept=".pdf,image/*" onChange={e => handleDocUpload(e, docType)} style={{ display: 'none' }} />}
        </label>
        {displayFileName && (
          <div style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', fontStyle: 'italic', wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: '4px' }}>
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
      !thesisTitle || !thesisSummary || !thesisKeywords || !academicSession
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
        profileCompleted: true,
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
        academicSession,
        degreeType: 'Ph.D.',
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
          })),
          otherQuals: otherQuals.map((o, i) => ({
            ...o,
            certificateUrl: user?.profile?.qualifications?.otherQuals?.[i]?.certificateUrl || o.certificateUrl || ''
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

  const handleProceedToGuide = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const errorMsg = validateAcademicQualifications();
    if (errorMsg) {
      toast.error(errorMsg);
      return;
    }

    setLoading(true);

    const payload = {
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
        })),
        otherQuals: otherQuals.map((o, i) => ({
          ...o,
          certificateUrl: user?.profile?.qualifications?.otherQuals?.[i]?.certificateUrl || o.certificateUrl || ''
        }))
      }
    };

    const res = await updateProfile(payload);
    setLoading(false);
    if (res.success) {
      setGuideUnlocked(true);
      const isComplete = isAcademicQualificationsComplete();
      toast.success(`Academic qualifications ${isComplete ? 'updated' : 'saved'} successfully! Proceeding to Supervisor Selection.`);
      setEditModes(prev => ({
        ...prev,
        class10: false,
        class12: false,
        graduation: false,
        postGraduation: false,
        otherQuals: false,
        mphil: false,
        netJrf: false,
        fellowships: false
      }));
      setTimeout(() => {
        scrollToSection('supervisor', true);
      }, 100);
    } else {
      toast.error('Failed to save academic qualifications: ' + res.message);
    }
  };

  const hasAnySavedQualification = !!(
    user?.profile?.qualifications?.class10?.rollNo ||
    user?.profile?.qualifications?.class12?.rollNo ||
    user?.profile?.qualifications?.graduation?.rollNo ||
    user?.profile?.qualifications?.postGraduation?.rollNo ||
    (user?.profile?.qualifications?.otherQuals && user?.profile?.qualifications?.otherQuals.length > 0)
  );

  const class10Saved = !!(
    user?.profile?.qualifications?.class10?.rollNo &&
    user?.profile?.qualifications?.class10?.certificateUrl
  );
  const class12Saved = !!(
    user?.profile?.qualifications?.class12?.rollNo &&
    user?.profile?.qualifications?.class12?.certificateUrl
  );
  const canProceedToGuide = class10Saved && class12Saved;
  const canSubmit = isGeneralInfoComplete() && isAcademicQualificationsComplete() && !!preferredGuideId;

  return (
    <div className="profile-tab-wrapper" style={{ position: 'relative' }}>
      <style>{profileLayoutCSS}</style>

      {/* Dynamic Profile Registration Status Banner */}
      {!thesis ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {user?.profile?.rejectionRemarks && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderLeft: '4px solid #EF4444',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              color: '#991B1B'
            }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={16} /> Status: Request rejected and awaiting resubmission by the candidate.
              </div>
              <div style={{ marginBottom: '8px' }}>
                Remarks: <strong style={{ color: '#7F1D1D' }}>"{user.profile.rejectionRemarks}"</strong>
              </div>
              <div style={{ color: 'var(--color-text-secondary)' }}>
                Your profile has been unlocked for editing. Please update the necessary fields below and re-submit your profile.
              </div>
            </div>
          )}
          <div style={{
            background: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderLeft: '4px solid #3B82F6',
            padding: '16px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            color: '#1E3A8A',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>ℹ️ Ph.D. Profile Verification Pending Submission</div>
            <div>Please fill out your complete profile information: <strong>General Info</strong>, <strong>Qualifications (with certificates)</strong>, and <strong>Preferred Guide Selection</strong>. Once completed, click the green <strong>🚀 Submit PhD Profile for HOD Registration Approval</strong> button at the very bottom!</div>
          </div>
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

      {thesis && thesis.status !== 'REGISTRATION_PENDING' && (
        <div className="glass-transparent" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '1.1rem' }}>🎓</span>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ph.D. Registration Allocation Details</span>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', fontSize: '0.85rem' }}>
            <div style={{ gridColumn: 'span 2' }}>
              <strong style={{ color: 'var(--color-text-secondary)' }}>Thesis Title:</strong>
              <div style={{ fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '2px', fontSize: '0.9rem' }}>
                {thesis.title || 'N/A'}
              </div>
            </div>
            <div>
              <strong style={{ color: 'var(--color-text-secondary)' }}>Supervisor Assigned:</strong>
              <div style={{ fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span>👤</span> {thesis.supervisorId?.name || 'Pending Allocation'}
              </div>
            </div>
            <div>
              <strong style={{ color: 'var(--color-text-secondary)' }}>Active Phase / Current Milestone:</strong>
              <div style={{ marginTop: '2px' }}>
                <span style={{ 
                  fontWeight: 700, 
                  color: '#059669', 
                  background: '#D1FAE5', 
                  padding: '3px 10px', 
                  borderRadius: '12px', 
                  fontSize: '0.8rem',
                  display: 'inline-block'
                }}>
                  {(() => {
                    const statusMap = {
                      REGISTRATION_PENDING: 'Awaiting HOD Verification',
                      COURSEWORK: 'Coursework Phase',
                      SYNOPSIS_PENDING: 'Synopsis Submission Phase',
                      ACTIVE_RESEARCH: 'Active Research Phase',
                      PRE_SUBMISSION: 'Pre-Submission Seminar Phase',
                      THESIS_SUBMITTED: 'Thesis Submitted',
                      PENDING_SUPERVISOR: 'Pending Supervisor Approval',
                      PENDING_HOD: 'Pending HOD Approval',
                      SUBMITTED: 'Thesis Under Evaluation',
                      AWARDED: 'Ph.D. Degree Awarded! 🎉'
                    };
                    return statusMap[thesis.status] || thesis.status;
                  })()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--color-border)' }}>
        {user?.avatarUrl ? (
          <img 
            src={`${API_BASE_URL}${user.avatarUrl}`} 
            alt="Avatar Preview" 
            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #133A26', background: 'var(--color-bg)' }} 
          />
        ) : (
          <svg viewBox="0 0 100 100" style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#e2e8f0', display: 'block', border: '3px solid #133A26' }}>
            <circle cx="50" cy="35" r="20" fill="#133A26" />
            <path d="M15 85c0-13.8 11.2-25 25-25h20c13.8 0 25 11.2 25 25z" fill="#133A26" />
          </svg>
        )}
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#111827', margin: 0 }}>{user?.name}</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '4px 0 12px' }}>Ph.D. Scholar • {user?.department}</p>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#133A26', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>
            {avatarLoading ? 'Uploading...' : '📷 Change Profile Picture'}
            <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} disabled={avatarLoading} />
          </label>
        </div>
      </div>
      {/* Main Split Layout Container */}
      <div 
        className="profile-layout-container" 
        style={{ 
          '--header-height': `${headerHeight}px`
        }}
      >

        {/* Left Side: Milestones Sidebar Panel */}
        <div className="timeline-sidebar-panel">
          <h4 style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 800, textTransform: 'uppercase', paddingLeft: '12px', marginBottom: '8px', letterSpacing: '0.05em' }}>
            Profile Timeline
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {/* Vertical Connective Line */}
            <div style={{
              position: 'absolute',
              left: '20px',
              top: '20px',
              bottom: '20px',
              width: '2px',
              background: '#e5e7eb',
              zIndex: 0
            }} />

            {/* Timeline Nodes */}
            {milestoneItems.map((item) => {
              const isActive = activeSection === item.key;
              const isCompleted = 
                (item.key === 'personal' && isGeneralInfoComplete() && isPersonalInfoSavedState) ||
                (item.key === 'education' && isAcademicQualificationsComplete()) ||
                (item.key === 'supervisor' && !!preferredGuideId);

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => scrollToSection(item.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    background: 'none',
                    border: 'none',
                    borderRadius: '8px',
                    width: '100%',
                    textAlign: 'left',
                    cursor: 'pointer',
                    zIndex: 1,
                    transition: 'all 0.2s',
                    color: isActive ? '#133A26' : '#64748b',
                    fontWeight: isActive ? 700 : 500
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background: isActive ? '#133A26' : isCompleted ? '#10b981' : '#e5e7eb',
                    boxShadow: isActive ? '0 0 0 4px rgba(19,58,38,0.15)' : 'none',
                    transition: 'all 0.2s'
                  }} />
                  <item.Icon size={16} />
                  <span style={{ fontSize: '0.85rem', flex: 1 }}>{item.label}</span>
                  {isCompleted && (
                    <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 700 }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Scrollable Details Cards */}
        <div className="profile-details-column">

          {/* Placeholder Sentinel to detect when milestones bar should stick */}
          <div 
            ref={milestonePlaceholderRef} 
            style={{ 
              height: isStuck ? '50px' : '0px', 
              margin: '0', 
              padding: '0', 
              visibility: 'hidden' 
            }} 
          />

          {/* Sticky Mobile Sub-navbar */}
          <div className={`mobile-milestones-bar ${isStuck ? 'is-stuck' : ''}`} ref={mobileBarRef}>
            {milestoneItems.map((item) => {
              const isActive = activeSection === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  data-key={item.key}
                  className={`mobile-milestone-link ${isActive ? 'active' : ''}`}
                  onClick={() => scrollToSection(item.key)}
                >
                  <item.Icon size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

      <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* --- Section 1: Personal Info --- */}
        <div ref={sectionRefs.personal} className="card" style={{ padding: '24px', border: '1px solid var(--color-border)', borderRadius: '12px', transition: 'all 0.3s' }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '20px', fontSize: '0.85rem' }}>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Full Name</span>
                    <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{user?.name || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>University Email</span>
                    <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{user?.username || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Date of Birth</span>
                    <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{dob || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Gender</span>
                    <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{gender || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Social Category</span>
                    <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{category || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Nationality</span>
                    <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{nationality || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Father's Name</span>
                    <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{fatherName || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Mother's Name</span>
                    <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{motherName || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Phone Number</span>
                    <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{phoneNumber || '—'}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Residential Address</span>
                    <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{address || '—'}</strong>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '12px', padding: '20px', fontSize: '0.85rem' }}>
                  <div style={{ gridColumn: 'span 2', borderBottom: '1px solid #BBF7D0', paddingBottom: '8px', marginBottom: '4px' }}>
                    <h4 style={{ margin: 0, color: '#133A26', fontSize: '0.95rem', fontWeight: 700 }}>Thesis & Research Details</h4>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Academic Session</span>
                    <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{academicSession || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Degree Type</span>
                    <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{degreeType || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Department</span>
                    <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{user?.department || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>SH no.</span>
                    <strong style={{ color: '#059669', fontSize: '0.9rem', fontWeight: 700 }}>{user?.profile?.shNo || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Enrollment Number</span>
                    <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{enrollmentNumber || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Date of Admission</span>
                    <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{admissionDate || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Ph.D. Mode</span>
                    <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{phdMode || '—'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Specialization</span>
                    <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{specialization || '—'}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Area of Research Interest</span>
                    <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{areaOfInterest || '—'}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Thesis Title</span>
                    <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{thesisTitle || '—'}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Thesis Summary / Abstract</span>
                    <strong style={{ color: 'var(--color-text-secondary)', fontSize: '0.88rem', fontWeight: 500, display: 'block', whiteSpace: 'pre-wrap', lineHeight: 1.5, marginTop: 4 }}>{thesisSummary || '—'}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Keywords</span>
                    <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{thesisKeywords || '—'}</strong>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Full Name</label>
                    <input type="text" className="form-input" value={user?.name} disabled style={{ background: 'var(--color-bg)', color: '#64748B' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>University Email (ID)</label>
                    <input type="text" className="form-input" value={user?.username} disabled style={{ background: 'var(--color-bg)', color: '#64748B' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Date of Birth <span style={{ color: '#EF4444' }}>*</span></label>
                    <input type="date" className="form-input" value={dob} onChange={e => setDob(e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Gender <span style={{ color: '#EF4444' }}>*</span></label>
                    <select className="form-input" value={gender} onChange={e => setGender(e.target.value)} required disabled style={{ background: 'var(--color-bg)', color: '#64748B', cursor: 'not-allowed' }}>
                      <option value="">Select...</option>
                      {genders.map(g => <option key={g._id} value={g.value}>{g.label}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Social Category <span style={{ color: '#EF4444' }}>*</span></label>
                    <select className="form-input" value={category} onChange={e => setCategory(e.target.value)} required disabled style={{ background: 'var(--color-bg)', color: '#64748B', cursor: 'not-allowed' }}>
                      <option value="">Select Category...</option>
                      {categories.map(c => <option key={c._id} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Nationality <span style={{ color: '#EF4444' }}>*</span></label>
                    <input type="text" className="form-input" placeholder="e.g. Indian" value={nationality} onChange={e => setNationality(e.target.value)} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Father's Name <span style={{ color: '#EF4444' }}>*</span></label>
                    <input type="text" className="form-input" placeholder="Father's full name" value={fatherName} onChange={e => setFatherName(e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Mother's Name <span style={{ color: '#EF4444' }}>*</span></label>
                    <input type="text" className="form-input" placeholder="Mother's full name" value={motherName} onChange={e => setMotherName(e.target.value)} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Phone Number (Indian Format) <span style={{ color: '#EF4444' }}>*</span></label>
                    <input type="text" className="form-input" placeholder="Enter 10-digit mobile number" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Full Residential Address <span style={{ color: '#EF4444' }}>*</span></label>
                    <textarea 
                      className="form-input" 
                      placeholder="Street, City, State, ZIP" 
                      value={address} 
                      onChange={e => setAddress(e.target.value)} 
                      required 
                      rows={3} 
                      style={{ fontFamily: 'inherit', resize: 'vertical' }}
                    />
                  </div>
                </div>

                <div style={{ borderBottom: '2px solid #E5E7EB', paddingBottom: '8px', marginTop: '16px', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, color: '#133A26', fontSize: '1rem', fontWeight: 700 }}>Thesis & Research Details</h4>
                </div>

                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Academic Session <span style={{ color: '#EF4444' }}>*</span></label>
                    <select className="form-input" value={academicSession} onChange={e => setAcademicSession(e.target.value)} required disabled style={{ background: 'var(--color-bg)', color: '#64748B', cursor: 'not-allowed' }}>
                      <option value="">Select Session...</option>
                      {sessions.map(s => <option key={s._id} value={s.name || s.sessionName}>{s.name || s.sessionName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Degree Type</label>
                    <input type="text" className="form-input" value="Ph.D." disabled style={{ background: 'var(--color-bg)', color: '#64748B' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Department</label>
                    <input type="text" className="form-input" value={user?.department} disabled style={{ background: 'var(--color-bg)', color: '#64748B' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>SH no. (Auto Generated)</label>
                    <input type="text" className="form-input" value={user?.profile?.shNo || '—'} disabled style={{ background: 'var(--color-bg)', color: '#64748B', border: '1px solid var(--color-border)', cursor: 'not-allowed' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>University Enrollment Number <span style={{ color: '#EF4444' }}>*</span></label>
                    <input type="text" className="form-input" placeholder="Enter enrollment number" value={enrollmentNumber} onChange={e => setEnrollmentNumber(e.target.value)} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Date of Admission <span style={{ color: '#EF4444' }}>*</span></label>
                    <input type="date" className="form-input" value={admissionDate} onChange={e => setAdmissionDate(e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Mode of Ph.D. <span style={{ color: '#EF4444' }}>*</span></label>
                    <select className="form-input" value={phdMode} onChange={e => setPhdMode(e.target.value)} required>
                      <option value="">Select Mode...</option>
                      <option value="Full-time">Full-time Regular</option>
                      <option value="Part-time">Part-time / Sponsored</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Area of Specialization <span style={{ color: '#EF4444' }}>*</span></label>
                    <input type="text" className="form-input" placeholder="e.g. Machine Learning, Structural Bio" value={specialization} onChange={e => setSpecialization(e.target.value)} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Area of Research Interest <span style={{ color: '#EF4444' }}>*</span></label>
                    <input type="text" className="form-input" placeholder="Specific research title domain" value={areaOfInterest} onChange={e => setAreaOfInterest(e.target.value)} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Thesis Title <span style={{ color: '#EF4444' }}>*</span></label>
                    <input type="text" className="form-input" placeholder="Enter final or tentative thesis title" value={thesisTitle} onChange={e => setThesisTitle(e.target.value)} required />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Thesis Summary / Abstract <span style={{ color: '#EF4444' }}>*</span></label>
                    <textarea className="form-input" rows={4} placeholder="Write a short summary/abstract of your thesis..." value={thesisSummary} onChange={e => setThesisSummary(e.target.value)} required style={{ fontFamily: 'inherit' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Keywords <span style={{ color: '#EF4444' }}>*</span></label>
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
          {/* Bottom action for personal section */}
          {!thesis && editModes.general && (
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #E5E7EB' }}>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ background: '#1F2937', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}
              >
                {loading ? 'Saving Changes...' : (user?.profile?.dob ? '💾 Save General Info' : '💾 Save Personal Info & Proceed to Academic Qualifications')}
              </button>
            </div>
          )}
        </div>

        {/* --- Section 2: Academic Qualifications --- */}
        <div 
          ref={sectionRefs.education} 
          className="card" 
          style={{ 
            padding: '24px', 
            border: '1px solid var(--color-border)', 
            borderRadius: '12px', 
            transition: 'all 0.3s',
            opacity: (isPersonalInfoSavedState || !!thesis) ? 1 : 0.5,
            pointerEvents: (isPersonalInfoSavedState || !!thesis) ? 'auto' : 'none',
            position: 'relative'
          }}
        >
          {!isPersonalInfoSavedState && !thesis && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(2px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              borderRadius: '12px',
              textAlign: 'center',
              padding: '20px'
            }}>
              <Lock size={36} style={{ color: '#64748B', marginBottom: '12px' }} />
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Section Locked</span>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Please save your Personal Info & Thesis Details first to unlock.</span>
            </div>
          )}
          <form onSubmit={handleSaveAcademicDetails}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Class 10 Card */}
            <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', background: '#F9FAFB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>Class 10 (Secondary) Details</h4>
                {getDocBadge('class10', user?.profile?.qualifications?.class10?.certificateUrl)}
              </div>
              
              {!editModes.class10 ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px', fontSize: '0.85rem', marginBottom: '16px' }}>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Roll Number</span>
                      <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{class10Roll || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Board of Examination</span>
                      <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{class10Board || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>School Name</span>
                      <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{class10School || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Marks Obtained / Total</span>
                      <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{class10Marks || '0'} / {class10Total || '0'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Percentage (%)</span>
                      <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{class10Percentage || '0%'}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5E7EB', paddingTop: '12px' }}>
                    <div>
                      {getUploadButton('class10', user?.profile?.qualifications?.class10?.certificateUrl)}
                    </div>
                    <button
                      type="button"
                      disabled={!!thesis || !isEditingAcademic}
                      onClick={() => !thesis && isEditingAcademic && setEditModes(prev => ({ ...prev, class10: true }))}
                      style={{ background: (!!thesis || !isEditingAcademic) ? '#9CA3AF' : '#3B82F6', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: (!!thesis || !isEditingAcademic) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: (!!thesis || !isEditingAcademic) ? 'none' : '0 2px 4px rgba(59, 130, 246, 0.15)', transition: 'all 0.2s' }}
                    >
                      ✏️ Edit Class 10 Details
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Roll Number</label>
                      <input type="text" className="form-input" placeholder="Roll No" value={class10Roll} onChange={e => setClass10Roll(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Board of Examination</label>
                      <input type="text" className="form-input" placeholder="e.g. CBSE, ICSE" value={class10Board} onChange={e => setClass10Board(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>School Name</label>
                      <input type="text" className="form-input" placeholder="School Name" value={class10School} onChange={e => setClass10School(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', alignItems: 'flex-end' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Marks Obtained</label>
                      <input type="number" step="0.01" className="form-input" placeholder="Marks" value={class10Marks} onChange={e => setClass10Marks(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Total Marks</label>
                      <input type="number" step="0.01" className="form-input" placeholder="Total" value={class10Total} onChange={e => setClass10Total(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Percentage (%)</label>
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
                        onClick={() => handleCancel('class10')}
                        style={{ background: '#6B7280', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => saveSection('class10')}
                      disabled={loading || !isEditingAcademic}
                      style={{ background: (loading || !isEditingAcademic) ? '#9CA3AF' : '#059669', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: (loading || !isEditingAcademic) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: (loading || !isEditingAcademic) ? 'none' : '0 2px 4px rgba(5, 150, 105, 0.2)', transition: 'all 0.2s' }}
                    >
                      💾 Save Class 10 Details
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Class 12 Card */}
            <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', background: '#F9FAFB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>Class 12 (Higher Secondary) Details</h4>
                {getDocBadge('class12', user?.profile?.qualifications?.class12?.certificateUrl)}
              </div>
              
              {!editModes.class12 ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px', fontSize: '0.85rem', marginBottom: '16px' }}>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Roll Number</span>
                      <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{class12Roll || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Board of Examination</span>
                      <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{class12Board || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>School/College Name</span>
                      <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{class12School || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Marks Obtained / Total</span>
                      <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{class12Marks || '0'} / {class12Total || '0'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Percentage (%)</span>
                      <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{class12Percentage || '0%'}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5E7EB', paddingTop: '12px' }}>
                    <div>
                      {getUploadButton('class12', user?.profile?.qualifications?.class12?.certificateUrl)}
                    </div>
                    <button
                      type="button"
                      disabled={!!thesis || !isEditingAcademic}
                      onClick={() => !thesis && isEditingAcademic && setEditModes(prev => ({ ...prev, class12: true }))}
                      style={{ background: (!!thesis || !isEditingAcademic) ? '#9CA3AF' : '#3B82F6', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: (!!thesis || !isEditingAcademic) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: (!!thesis || !isEditingAcademic) ? 'none' : '0 2px 4px rgba(59, 130, 246, 0.15)', transition: 'all 0.2s' }}
                    >
                      ✏️ Edit Class 12 Details
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Roll Number</label>
                      <input type="text" className="form-input" placeholder="Roll No" value={class12Roll} onChange={e => setClass12Roll(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Board of Examination</label>
                      <input type="text" className="form-input" placeholder="e.g. CBSE, State Board" value={class12Board} onChange={e => setClass12Board(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>School/College Name</label>
                      <input type="text" className="form-input" placeholder="School/College Name" value={class12School} onChange={e => setClass12School(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', alignItems: 'flex-end' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Marks Obtained</label>
                      <input type="number" step="0.01" className="form-input" placeholder="Marks" value={class12Marks} onChange={e => setClass12Marks(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Total Marks</label>
                      <input type="number" step="0.01" className="form-input" placeholder="Total" value={class12Total} onChange={e => setClass12Total(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Percentage (%)</label>
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
                        onClick={() => handleCancel('class12')}
                        style={{ background: '#6B7280', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => saveSection('class12')}
                      disabled={loading || !isEditingAcademic}
                      style={{ background: (loading || !isEditingAcademic) ? '#9CA3AF' : '#059669', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: (loading || !isEditingAcademic) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: (loading || !isEditingAcademic) ? 'none' : '0 2px 4px rgba(5, 150, 105, 0.2)', transition: 'all 0.2s' }}
                    >
                      💾 Save Class 12 Details
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Graduation Card */}
            <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', background: '#F9FAFB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>Graduation Details</h4>
                {getDocBadge('graduation', user?.profile?.qualifications?.graduation?.certificateUrl)}
              </div>
              
              {!editModes.graduation ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px', fontSize: '0.85rem', marginBottom: '16px' }}>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Roll No / Enroll No</span>
                      <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{gradRoll || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Degree</span>
                      <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{gradDegree || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>College Name</span>
                      <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{gradCollege || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>University Name</span>
                      <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{gradUniversity || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>CGPA / Marks Obtained / Scale</span>
                      <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{gradMarks || '0'} / {gradTotal || '0'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Percentage / CGPA (%)</span>
                      <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{gradPercentage || '—'}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5E7EB', paddingTop: '12px' }}>
                    <div>
                      {getUploadButton('graduation', user?.profile?.qualifications?.graduation?.certificateUrl)}
                    </div>
                    <button
                      type="button"
                      disabled={!!thesis || !isEditingAcademic}
                      onClick={() => !thesis && isEditingAcademic && setEditModes(prev => ({ ...prev, graduation: true }))}
                      style={{ background: (!!thesis || !isEditingAcademic) ? '#9CA3AF' : '#3B82F6', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: (!!thesis || !isEditingAcademic) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: (!!thesis || !isEditingAcademic) ? 'none' : '0 2px 4px rgba(59, 130, 246, 0.15)', transition: 'all 0.2s' }}
                    >
                      ✏️ Edit Graduation Details
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Roll No / Enroll No</label>
                      <input type="text" className="form-input" placeholder="Roll No" value={gradRoll} onChange={e => setGradRoll(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Degree (e.g. B.Tech, B.Sc)</label>
                      <input type="text" className="form-input" placeholder="e.g. B.Tech CSE" value={gradDegree} onChange={e => setGradDegree(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>College Name</label>
                      <input type="text" className="form-input" placeholder="College Name" value={gradCollege} onChange={e => setGradCollege(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>University Name</label>
                      <input type="text" className="form-input" placeholder="University" value={gradUniversity} onChange={e => setGradUniversity(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', alignItems: 'flex-end' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>CGPA / Marks Obtained</label>
                      <input type="number" step="0.01" className="form-input" placeholder="Marks" value={gradMarks} onChange={e => setGradMarks(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Total Max Marks / Scale</label>
                      <input type="number" step="0.01" className="form-input" placeholder="Total scale" value={gradTotal} onChange={e => setGradTotal(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Percentage / CGPA (%)</label>
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
                        onClick={() => handleCancel('graduation')}
                        style={{ background: '#6B7280', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => saveSection('graduation')}
                      disabled={loading || !isEditingAcademic}
                      style={{ background: (loading || !isEditingAcademic) ? '#9CA3AF' : '#059669', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: (loading || !isEditingAcademic) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: (loading || !isEditingAcademic) ? 'none' : '0 2px 4px rgba(5, 150, 105, 0.2)', transition: 'all 0.2s' }}
                    >
                      💾 Save Graduation Details
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Post Graduation Card */}
            <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', background: '#F9FAFB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>Post-Graduation Details</h4>
                {getDocBadge('postGraduation', user?.profile?.qualifications?.postGraduation?.certificateUrl)}
              </div>
              
              {!editModes.postGraduation ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px', fontSize: '0.85rem', marginBottom: '16px' }}>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Roll No / Enroll No</span>
                      <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{pgRoll || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Degree</span>
                      <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{pgDegree || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>College Name</span>
                      <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{pgCollege || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>University Name</span>
                      <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{pgUniversity || '—'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>CGPA / Marks Obtained / Scale</span>
                      <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{pgMarks || '0'} / {pgTotal || '0'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Percentage / CGPA (%)</span>
                      <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{pgPercentage || '—'}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E5E7EB', paddingTop: '12px' }}>
                    <div>
                      {getUploadButton('postGraduation', user?.profile?.qualifications?.postGraduation?.certificateUrl)}
                    </div>
                    <button
                      type="button"
                      disabled={!!thesis || !isEditingAcademic}
                      onClick={() => !thesis && isEditingAcademic && setEditModes(prev => ({ ...prev, postGraduation: true }))}
                      style={{ background: (!!thesis || !isEditingAcademic) ? '#9CA3AF' : '#3B82F6', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: (!!thesis || !isEditingAcademic) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: (!!thesis || !isEditingAcademic) ? 'none' : '0 2px 4px rgba(59, 130, 246, 0.15)', transition: 'all 0.2s' }}
                    >
                      ✏️ Edit Post-Graduation Details
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Roll No / Enroll No</label>
                      <input type="text" className="form-input" placeholder="Roll No" value={pgRoll} onChange={e => setPgRoll(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>PG Degree (e.g. M.Tech, M.Sc)</label>
                      <input type="text" className="form-input" placeholder="e.g. M.Tech CSE" value={pgDegree} onChange={e => setPgDegree(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>College Name</label>
                      <input type="text" className="form-input" placeholder="College Name" value={pgCollege} onChange={e => setPgCollege(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>University Name</label>
                      <input type="text" className="form-input" placeholder="University" value={pgUniversity} onChange={e => setPgUniversity(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', alignItems: 'flex-end' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>CGPA / Marks Obtained</label>
                      <input type="number" step="0.01" className="form-input" placeholder="Marks" value={pgMarks} onChange={e => setPgMarks(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Total Max Marks / Scale</label>
                      <input type="number" step="0.01" className="form-input" placeholder="Total scale" value={pgTotal} onChange={e => setPgTotal(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Percentage / CGPA (%)</label>
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
                        onClick={() => handleCancel('postGraduation')}
                        style={{ background: '#6B7280', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => saveSection('postGraduation')}
                      disabled={loading || !isEditingAcademic}
                      style={{ background: (loading || !isEditingAcademic) ? '#9CA3AF' : '#059669', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: (loading || !isEditingAcademic) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: (loading || !isEditingAcademic) ? 'none' : '0 2px 4px rgba(5, 150, 105, 0.2)', transition: 'all 0.2s' }}
                    >
                      💾 Save Post Graduation Details
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Other Qualifications Card */}
            <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', background: '#F9FAFB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>Other Qualifications</h4>
              </div>
              
              {!editModes.otherQuals ? (
                <div>
                  {otherQuals.length > 0 ? otherQuals.map((o, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px', fontSize: '0.85rem', marginBottom: '16px' }}>
                      <div>
                        <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Qualification Type</span>
                        <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{o.type === 'Other' ? o.otherType : o.type || '—'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Roll Number</span>
                        <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{o.rollNo || '—'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Board / University</span>
                        <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{o.board || '—'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Institution / School</span>
                        <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{o.school || '—'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Marks Obtained / Total</span>
                        <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{o.marksObtained || '0'} / {o.totalMarks || '0'}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Percentage (%)</span>
                        <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{o.percentage || '—'}</strong>
                      </div>
                      <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                        {getDocBadge(`otherQuals_${i}`, user?.profile?.qualifications?.otherQuals?.[i]?.certificateUrl)}
                      </div>
                    </div>
                  )) : (
                    <div style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '16px' }}>No other qualifications added.</div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #E5E7EB', paddingTop: '12px' }}>
                    <button
                      type="button"
                      disabled={!!thesis || !isEditingAcademic}
                      onClick={() => !thesis && isEditingAcademic && setEditModes(prev => ({ ...prev, otherQuals: true }))}
                      style={{ background: (!!thesis || !isEditingAcademic) ? '#9CA3AF' : '#3B82F6', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: (!!thesis || !isEditingAcademic) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
                    >
                      ✏️ Edit / Add Other Qualifications
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {otherQuals.map((o, i) => (
                    <div key={i} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <strong style={{ color: '#1E293B', fontSize: '0.9rem' }}>Qualification #{i + 1}</strong>
                        <button type="button" onClick={() => handleRemoveRow('otherQuals', i)} style={{ background: '#EF4444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}>Remove</button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Qualification Type</label>
                          <select className="form-input" value={o.type || ''} onChange={e => { const updated = [...otherQuals]; updated[i].type = e.target.value; setOtherQuals(updated); }}>
                            <option value="">Select Option...</option>
                            <option value="Certificate">Certificate</option>
                            <option value="Diploma">Diploma</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        {o.type === 'Other' && (
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Please Specify Qualification</label>
                            <input type="text" className="form-input" placeholder="Specify..." value={o.otherType || ''} onChange={e => { const updated = [...otherQuals]; updated[i].otherType = e.target.value; setOtherQuals(updated); }} />
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Roll Number</label>
                          <input type="text" className="form-input" placeholder="Roll Number" value={o.rollNo || ''} onChange={e => { const updated = [...otherQuals]; updated[i].rollNo = e.target.value; setOtherQuals(updated); }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Board / University</label>
                          <input type="text" className="form-input" placeholder="e.g. CBSE / Delhi University" value={o.board || ''} onChange={e => { const updated = [...otherQuals]; updated[i].board = e.target.value; setOtherQuals(updated); }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Institution / School Name</label>
                          <input type="text" className="form-input" placeholder="Institution Name" value={o.school || ''} onChange={e => { const updated = [...otherQuals]; updated[i].school = e.target.value; setOtherQuals(updated); }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Marks Obtained</label>
                          <input type="number" step="0.01" className="form-input" placeholder="Marks" value={o.marksObtained || ''} onChange={e => { const updated = [...otherQuals]; updated[i].marksObtained = e.target.value; setOtherQuals(updated); }} />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', alignItems: 'flex-end' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Total Max Marks</label>
                          <input type="number" step="0.01" className="form-input" placeholder="Total scale" value={o.totalMarks || ''} onChange={e => { const updated = [...otherQuals]; updated[i].totalMarks = e.target.value; setOtherQuals(updated); }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Percentage (%)</label>
                          <input type="text" className="form-input" placeholder="e.g. 85%" value={o.percentage || ''} onChange={e => { const updated = [...otherQuals]; updated[i].percentage = e.target.value; setOtherQuals(updated); }} />
                        </div>
                        <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                          <div style={{ flex: 1 }}>
                            {getUploadButton(`otherQuals_${i}`, o.certificateUrl)}
                          </div>
                          <button
                            type="button"
                            onClick={() => saveSectionRow('otherQuals', i)}
                            disabled={loading || !isEditingAcademic}
                            style={{ background: (loading || !isEditingAcademic) ? '#9CA3AF' : '#059669', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: (loading || !isEditingAcademic) ? 'not-allowed' : 'pointer', height: '38px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            💾 Save
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setOtherQuals([...otherQuals, { type: '', otherType: '', rollNo: '', board: '', school: '', marksObtained: '', totalMarks: '', percentage: '' }])} style={{ background: 'var(--color-bg)', color: 'var(--color-text-secondary)', border: '1px dashed #CBD5E1', padding: '8px 16px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', width: '100%', marginBottom: '16px' }}>+ Add More Qualification</button>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '12px', borderTop: '1px solid #E5E7EB' }}>
                    <button
                      type="button"
                      onClick={() => { setOtherQuals(user?.profile?.qualifications?.otherQuals || []); handleCancel('otherQuals'); }}
                      style={{ background: '#6B7280', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => saveSectionList('otherQuals')}
                      disabled={loading || !isEditingAcademic}
                      style={{ background: (loading || !isEditingAcademic) ? '#9CA3AF' : '#3B82F6', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: (loading || !isEditingAcademic) ? 'not-allowed' : 'pointer' }}
                    >
                      💾 Save & Close
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* M.Phil Qualifications */}
            <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', background: '#F9FAFB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>M.Phil Details</h4>
                {getDocBadge('mphil', user?.profile?.qualifications?.mphil?.certificateUrl)}
              </div>
              
              {!editModes.mphil ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px', fontSize: '0.85rem', marginBottom: '16px' }}>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Completed M.Phil?</span>
                      <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{mphilDone || 'NO'}</strong>
                    </div>
                    {mphilDone === 'YES' && (
                      <>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>University/Institution</span>
                          <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{mphilUniversity || '—'}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Passing Year</span>
                          <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{mphilPassingYear || '—'}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Marks Obtained</span>
                          <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{mphilMarksObtained || '—'}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Total Marks</span>
                          <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{mphilTotalMarks || '—'}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Percentage</span>
                          <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{mphilPercentage || '—'}%</strong>
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
                      disabled={!!thesis || !isEditingAcademic}
                      onClick={() => !thesis && isEditingAcademic && setEditModes(prev => ({ ...prev, mphil: true }))}
                      style={{ background: (!!thesis || !isEditingAcademic) ? '#9CA3AF' : '#3B82F6', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: (!!thesis || !isEditingAcademic) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: (!!thesis || !isEditingAcademic) ? 'none' : '0 2px 4px rgba(59, 130, 246, 0.15)', transition: 'all 0.2s' }}
                    >
                      ✏️ Edit M.Phil Details
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Have you completed M.Phil?</label>
                      <select className="form-input" value={mphilDone} onChange={e => setMphilDone(e.target.value)}>
                        <option value="">Select option...</option>
                        <option value="NO">No</option>
                        <option value="YES">Yes</option>
                      </select>
                    </div>
                    {mphilDone === 'YES' && (
                      <>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>University / Institution</label>
                          <input type="text" className="form-input" placeholder="e.g. Delhi University" value={mphilUniversity} onChange={e => setMphilUniversity(e.target.value)} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Passing Year</label>
                          <input type="text" className="form-input" placeholder="e.g. 2022" value={mphilPassingYear} onChange={e => setMphilPassingYear(e.target.value)} />
                        </div>
                      </>
                    )}
                  </div>
                  {mphilDone === 'YES' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', alignItems: 'flex-end' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Marks Obtained</label>
                        <input type="number" className="form-input" placeholder="Marks Obtained" value={mphilMarksObtained} onChange={e => {
                          setMphilMarksObtained(e.target.value);
                          if (mphilTotalMarks) {
                            setMphilPercentage(((parseFloat(e.target.value) / parseFloat(mphilTotalMarks)) * 100).toFixed(2));
                          }
                        }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Total Marks</label>
                        <input type="number" className="form-input" placeholder="Total Marks" value={mphilTotalMarks} onChange={e => {
                          setMphilTotalMarks(e.target.value);
                          if (mphilMarksObtained) {
                            setMphilPercentage(((parseFloat(mphilMarksObtained) / parseFloat(e.target.value)) * 100).toFixed(2));
                          }
                        }} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Percentage (%)</label>
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
                        onClick={() => handleCancel('mphil')}
                        style={{ background: '#6B7280', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => saveSection('mphil')}
                      disabled={loading || !isEditingAcademic}
                      style={{ background: (loading || !isEditingAcademic) ? '#9CA3AF' : '#059669', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: (loading || !isEditingAcademic) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: (loading || !isEditingAcademic) ? 'none' : '0 2px 4px rgba(5, 150, 105, 0.2)', transition: 'all 0.2s' }}
                    >
                      💾 Save M.Phil Details
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* NET JRF Qualifications */}
            <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', background: '#F9FAFB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>National Entrance Examinations (NET / JRF / GATE)</h4>
                {getDocBadge('netJrf', user?.profile?.qualifications?.netJrf?.certificateUrl)}
              </div>
              
              {!editModes.netJrf ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px', fontSize: '0.85rem', marginBottom: '16px' }}>
                    <div>
                      <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Qualified NET JRF?</span>
                      <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{netJrfQualified}</strong>
                    </div>
                    {netJrfQualified === 'YES' && (
                      <>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Award Letter Number</span>
                          <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{netJrfCertNumber || '—'}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Roll Number</span>
                          <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{netJrfRoll || '—'}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>All India Rank (AIR)</span>
                          <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{netJrfRank || '—'}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Normalized Score</span>
                          <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{netJrfScore || '—'}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Certificate Issue Date</span>
                          <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{netJrfIssueDate || '—'}</strong>
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
                      disabled={!!thesis || !isEditingAcademic}
                      onClick={() => !thesis && isEditingAcademic && setEditModes(prev => ({ ...prev, netJrf: true }))}
                      style={{ background: (!!thesis || !isEditingAcademic) ? '#9CA3AF' : '#3B82F6', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: (!!thesis || !isEditingAcademic) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: (!!thesis || !isEditingAcademic) ? 'none' : '0 2px 4px rgba(59, 130, 246, 0.15)', transition: 'all 0.2s' }}
                    >
                      ✏️ Edit NET JRF Details
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Have you qualified NET JRF?</label>
                      <select className="form-input" value={netJrfQualified} onChange={e => setNetJrfQualified(e.target.value)}>
                        <option value="">Select option...</option>
                        <option value="NO">No</option>
                        <option value="YES">Yes</option>
                      </select>
                    </div>
                    {netJrfQualified === 'YES' && (
                      <>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Certification / Award Letter Number</label>
                          <input type="text" className="form-input" placeholder="Cert Number" value={netJrfCertNumber} onChange={e => setNetJrfCertNumber(e.target.value)} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Roll Number / Reg Number</label>
                          <input type="text" className="form-input" placeholder="Roll No" value={netJrfRoll} onChange={e => setNetJrfRoll(e.target.value)} />
                        </div>
                      </>
                    )}
                  </div>
                  {netJrfQualified === 'YES' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', alignItems: 'flex-end' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>All India Rank (AIR)</label>
                        <input type="text" className="form-input" placeholder="AIR Rank" value={netJrfRank} onChange={e => setNetJrfRank(e.target.value)} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Normalized Score / Percentile</label>
                        <input type="text" className="form-input" placeholder="Score" value={netJrfScore} onChange={e => setNetJrfScore(e.target.value)} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Date of Certificate Issue</label>
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
                        onClick={() => handleCancel('netJrf')}
                        style={{ background: '#6B7280', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => saveSection('netJrf')}
                      disabled={loading || !isEditingAcademic}
                      style={{ background: (loading || !isEditingAcademic) ? '#9CA3AF' : '#059669', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: (loading || !isEditingAcademic) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: (loading || !isEditingAcademic) ? 'none' : '0 2px 4px rgba(5, 150, 105, 0.2)', transition: 'all 0.2s' }}
                    >
                      💾 Save NET JRF Details
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Fellowships Card */}
            <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', background: '#F9FAFB', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>National & International Fellowships (Optional)</h4>
              </div>
              
              {!editModes.fellowships ? (
                <div>
                  {fellowships.length > 0 ? fellowships.map((f, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px', fontSize: '0.85rem', marginBottom: '16px' }}>
                      <div><span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Fellowship Type</span><strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{f.type === 'Other' ? f.otherType : f.type || '—'}</strong></div>
                      <div><span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Awarding Body</span><strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{f.awardingBody || '—'}</strong></div>
                      <div><span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Award Date</span><strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{f.awardDate || '—'}</strong></div>
                      <div><span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Reference No. / ID</span><strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{f.referenceNo || '—'}</strong></div>
                      <div><span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Duration</span><strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{f.duration || '—'}</strong></div>
                      <div><span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '2px' }}>Amount</span><strong style={{ color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>{f.amount || '—'}</strong></div>
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
                      disabled={!!thesis || !isEditingAcademic}
                      onClick={() => !thesis && isEditingAcademic && setEditModes(prev => ({ ...prev, fellowships: true }))}
                      style={{ background: (!!thesis || !isEditingAcademic) ? '#9CA3AF' : '#3B82F6', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: (!!thesis || !isEditingAcademic) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
                    >
                      ✏️ Edit / Add Fellowships
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {fellowships.map((f, i) => (
                    <div key={i} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <strong style={{ color: '#1E293B', fontSize: '0.9rem' }}>Fellowship #{i + 1}</strong>
                        <button type="button" onClick={() => handleRemoveRow('fellowships', i)} style={{ background: '#EF4444', color: 'white', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', cursor: 'pointer' }}>Remove</button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Fellowship Type</label>
                          <select className="form-input" value={f.type || ''} onChange={e => { const updated = [...fellowships]; updated[i].type = e.target.value; setFellowships(updated); }}>
                            <option value="">Select Fellowship...</option>
                            <option value="DST INSPIRE">DST INSPIRE</option>
                            <option value="CSIR NET JRF">CSIR NET JRF</option>
                            <option value="UGC NET JRF">UGC NET JRF</option>
                            <option value="NFSC">NFSC</option>
                            <option value="NFST">NFST</option>
                            <option value="NFOBC">NFOBC</option>
                            <option value="MANF">MANF</option>
                            <option value="RGNF">RGNF</option>
                            <option value="PMRF">PMRF</option>
                            <option value="Fulbright">Fulbright</option>
                            <option value="DAAD">DAAD</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        {f.type === 'Other' && (
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Please Specify Fellowship</label>
                            <input type="text" className="form-input" placeholder="Specify..." value={f.otherType || ''} onChange={e => { const updated = [...fellowships]; updated[i].otherType = e.target.value; setFellowships(updated); }} />
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Awarding Body / Agency</label>
                          <input type="text" className="form-input" placeholder="e.g. DST / UGC" value={f.awardingBody || ''} onChange={e => { const updated = [...fellowships]; updated[i].awardingBody = e.target.value; setFellowships(updated); }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Award Date</label>
                          <input type="date" className="form-input" value={f.awardDate || ''} onChange={e => { const updated = [...fellowships]; updated[i].awardDate = e.target.value; setFellowships(updated); }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Reference No. / ID</label>
                          <input type="text" className="form-input" placeholder="ID No" value={f.referenceNo || ''} onChange={e => { const updated = [...fellowships]; updated[i].referenceNo = e.target.value; setFellowships(updated); }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Amount</label>
                          <input type="text" className="form-input" placeholder="e.g. 31,000" value={f.amount || ''} onChange={e => { const updated = [...fellowships]; updated[i].amount = e.target.value; setFellowships(updated); }} />
                        </div>
                      </div>
                      <div style={{ marginTop: '12px' }}>
                          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Duration</label>
                          <input type="text" className="form-input" placeholder="e.g. 5 Years" value={f.duration || ''} onChange={e => { const updated = [...fellowships]; updated[i].duration = e.target.value; setFellowships(updated); }} />
                      </div>
                      <div style={{ marginTop: '12px' }}>
                        {getUploadButton(`fellowship_${i}`, f.certificateUrl)}
                      </div>
                    </div>
                  ))}
                  <button type="button" onClick={() => setFellowships([...fellowships, { type: '', otherType: '', awardingBody: '', awardDate: '', referenceNo: '', amount: '', duration: '' }])} style={{ background: 'var(--color-bg)', color: 'var(--color-text-secondary)', border: '1px dashed #CBD5E1', padding: '8px 16px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', width: '100%', marginBottom: '16px' }}>+ Add More Fellowships</button>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '12px', borderTop: '1px solid #E5E7EB' }}>
                    <button
                      type="button"
                      onClick={() => { setFellowships(user?.profile?.qualifications?.fellowships || []); handleCancel('fellowships'); }}
                      style={{ background: '#6B7280', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => saveSectionList('fellowships')}
                      disabled={loading || !isEditingAcademic}
                      style={{ background: (loading || !isEditingAcademic) ? '#9CA3AF' : '#3B82F6', color: 'white', border: 'none', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600, borderRadius: '6px', cursor: (loading || !isEditingAcademic) ? 'not-allowed' : 'pointer' }}
                    >
                      💾 Save & Close
                    </button>
                  </div>
                </>
              )}
            </div>
            {user?.profile?.dob && !thesis && !user?.profileCompleted && (
              <div style={{ marginTop: '32px', padding: '16px', borderTop: '2px solid #E5E7EB', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={(e) => {
                    const isEditing = (
                      editModes.class10 ||
                      editModes.class12 ||
                      editModes.graduation ||
                      editModes.postGraduation ||
                      editModes.otherQuals ||
                      editModes.mphil ||
                      editModes.netJrf ||
                      editModes.fellowships
                    );
                    if (!isEditing) {
                      setEditModes(prev => ({
                        ...prev,
                        class10: true,
                        class12: true,
                        graduation: true,
                        postGraduation: true,
                        otherQuals: false,
                        mphil: mphilDone === 'YES',
                        netJrf: netJrfQualified === 'YES',
                        fellowships: false
                      }));
                    } else {
                      handleProceedToGuide(e);
                    }
                  }}
                  style={{
                    background: '#059669',
                    color: 'white',
                    border: 'none',
                    padding: '12px 24px',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.2)',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {!(
                    editModes.class10 ||
                    editModes.class12 ||
                    editModes.graduation ||
                    editModes.postGraduation ||
                    editModes.otherQuals ||
                    editModes.mphil ||
                    editModes.netJrf ||
                    editModes.fellowships
                  ) ? (
                    <>✏️ Edit Academic Qualifications</>
                  ) : (
                    <>{guideUnlocked ? '🔓' : '🔒'} Save Academic Qualifications & Move to Preferred Supervisor</>
                  )}
                </button>
              </div>
            )}
          </div>
          </form>
        </div>

        {/* --- Section 3: Preferred Guide Selection --- */}
        <div 
          ref={sectionRefs.supervisor} 
          className="card" 
          style={{ 
            padding: '24px', 
            border: '1px solid var(--color-border)', 
            borderRadius: '12px', 
            transition: 'all 0.3s',
            opacity: (guideUnlocked || !!thesis) ? 1 : 0.5,
            pointerEvents: (guideUnlocked || !!thesis) ? 'auto' : 'none',
            position: 'relative'
          }}
        >
          {!guideUnlocked && !thesis && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(2px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
              borderRadius: '12px',
              textAlign: 'center',
              padding: '20px'
            }}>
              <Lock size={36} style={{ color: '#64748B', marginBottom: '12px' }} />
              <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Section Locked</span>
              <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Please save all your Academic Qualifications first to unlock.</span>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#133A26', margin: '0 0 8px 0' }}>Advisor & Guide Preference of {user?.department}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '0 0 12px 0' }}>
              Please select your preferred guide for Ph.D. supervision from the list of registered faculty members in your department. 
              This selection acts as your institutional preference for thesis allotment.
            </p>

            <div>
              {editModes.guide ? (
                <>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Preferred supervisor / Guide</label>
                  <select 
                    className="form-input" 
                    value={preferredGuideId} 
                    onChange={e => setPreferredGuideId(e.target.value)}
                    disabled={!!thesis}
                  >
                    <option value="">Select Preferred Guide...</option>
                    {faculties.map(fac => (
                      <option key={fac._id} value={fac._id}>
                        {fac.name} ({(fac.role === 'HOD' || fac.subRole === 'HOD') ? 'HOD' : 'Faculty'})
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <div style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px' }}>
                  <span style={{ color: '#64748B', display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: '4px' }}>Preferred supervisor / Guide</span>
                  <strong style={{ color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>
                    {faculties.find(f => f._id === preferredGuideId)?.name || 'Select Preferred Guide...'}
                  </strong>
                </div>
              )}
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

          {/* Guide section bottom actions */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #E5E7EB' }}>
            {thesis && thesis.status === 'REGISTRATION_PENDING' && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '8px', color: '#D97706', fontSize: '0.85rem', fontWeight: 700, padding: '10px 16px' }}>
                ⏳ Awaiting HOD Verification
              </div>
            )}
            {!thesis && (
              <>
                {editModes.guide ? (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={(e) => handleUpdate(e, 'guide')}
                    className="btn-primary"
                    style={{ flex: 1, background: '#1F2937', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    {loading ? 'Saving Changes...' : '💾 Save Guide Preference'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditModes(prev => ({ ...prev, guide: true }))}
                    className="btn-primary"
                    style={{ flex: 1, background: '#4B5563', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    ✏️ Edit Guide Preference
                  </button>
                )}
                <button
                  type="button"
                  disabled={registering || !canSubmit}
                  onClick={handleProfileRegistrationSubmit}
                  className="btn-primary"
                  style={{
                    flex: 1.2,
                    background: canSubmit ? '#059669' : '#9CA3AF',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    border: 'none',
                    cursor: canSubmit ? 'pointer' : 'not-allowed',
                    boxShadow: canSubmit ? '0 4px 6px -1px rgba(16, 185, 129, 0.2)' : 'none'
                  }}
                  title={!canSubmit ? 'Please complete all required profile sections to submit' : ''}
                >
                  {registering ? 'Submitting...' : '🚀 Submit PhD Profile for HOD Approval'}
                </button>
              </>
            )}
          </div>
        </div>

      </form>
      {thesis && renderHistoryTable(getRegistrationHistory(thesis))}
        </div>
      </div>
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {(() => {
                          const cwStatus = thesis.courseworkStatus || 'NOT_SUBMITTED';
                          
                          if (cwStatus === 'APPROVED') {
                            return (
                              <div style={{ 
                                background: '#ECFDF5', 
                                border: '1px solid #A7F3D0', 
                                borderRadius: '8px', 
                                padding: '12px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                fontSize: '0.82rem',
                                color: '#065F46',
                                alignSelf: 'flex-start'
                              }}>
                                <span>✓</span> 
                                <span>Coursework results successfully verified and locked on HOD Clearance.</span>
                              </div>
                            );
                          }
                          
                          if (cwStatus === 'PENDING_FACULTY') {
                            return (
                              <div style={{ 
                                background: '#EFF6FF', 
                                border: '1px solid #BFDBFE', 
                                borderRadius: '8px', 
                                padding: '12px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                fontSize: '0.82rem',
                                color: '#1E3A8A',
                                alignSelf: 'flex-start'
                              }}>
                                <span>⏳</span> 
                                <span>Coursework details submitted. Awaiting Supervisor verification and approval.</span>
                              </div>
                            );
                          }

                          if (cwStatus === 'PENDING_HOD') {
                            return (
                              <div style={{ 
                                background: '#FFFBEB', 
                                border: '1px solid #FDE68A', 
                                borderRadius: '8px', 
                                padding: '12px 16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                fontSize: '0.82rem',
                                color: '#78350F',
                                alignSelf: 'flex-start'
                              }}>
                                <span>⏳</span> 
                                <span>Coursework verified by Supervisor. Pending final clearance from HOD.</span>
                              </div>
                            );
                          }

                          if (cwStatus === 'REJECTED') {
                            return (
                              <div style={{ 
                                background: '#FEE2E2', 
                                border: '1px solid #FCA5A5', 
                                borderRadius: '8px', 
                                padding: '12px 16px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 6,
                                fontSize: '0.82rem',
                                color: '#991B1B',
                                alignSelf: 'flex-start'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <span>❌</span> 
                                  <strong>Coursework details rejected / correction required.</strong>
                                </div>
                                {thesis.courseworkRemarks && (
                                  <div style={{ fontSize: '0.78rem', color: '#7F1D1D', borderTop: '1px dashed #FCA5A5', paddingTop: 4, marginTop: 4 }}>
                                    <strong>Remarks:</strong> {thesis.courseworkRemarks}
                                  </div>
                                )}
                              </div>
                            );
                          }

                          // NOT_SUBMITTED or fallback
                          return (
                            <div style={{ 
                              background: 'var(--color-bg)', 
                              border: '1px solid var(--color-border)', 
                              borderRadius: '8px', 
                              padding: '12px 16px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              fontSize: '0.82rem',
                              color: 'var(--color-text-secondary)',
                              alignSelf: 'flex-start'
                            }}>
                              <span>✏️</span> 
                              <span>Coursework details not yet submitted. Please enter your coursework grades in the active task workspace.</span>
                            </div>
                          );
                        })()}

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
  const [activeTab, setActiveTab] = useTabPersistence('sync_student_tab', 'profile');
  const [milestonesSubTab, setMilestonesSubTab] = useState('active');
  const { user } = useContext(AuthContext);
  const { thesis, milestones, loading, fetchMyThesis, submitMilestone } = useContext(ThesisContext);
  const theme = useThemeStyles();

  useEffect(() => { 
    fetchMyThesis(); 
  }, []);

  const hasRedirected = React.useRef(false);

  useEffect(() => {
    if (thesis && thesis.status !== 'REGISTRATION_PENDING' && !hasRedirected.current) {
      const stored = sessionStorage.getItem('sync_student_tab');
      if (!stored || (stored === 'profile' && thesis.status !== 'REGISTRATION_PENDING')) {
        setActiveTab('overview');
      }
      hasRedirected.current = true;
    }
  }, [thesis]);

  const titles = { 
    overview: 'Student Dashboard', 
    profile: 'Profile',
    workspace: 'Workspace', 
    coursework: 'Coursework Milestone',
    synopsis: 'Research Synopsis',
    rac: 'RAC Progress', 
    publications: 'Research Outputs', 
    funding: 'My Funding & Lab',
    sixMonthReports: '6-Month Progress Reports',
    chapterDrafts: 'Chapter Drafts Workspace',
    preSubmission: 'Pre-Submission Package',
    changes: 'Request Changes', 
    certificates: 'Certificates', 
    documents: 'Documents', 
    meetings: 'Meetings'
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

    if (activeTab === 'profile') {
      return <ProfileTab />;
    }

    if (!thesis) {
      return (
        <div className="card" style={{ maxWidth: 650, margin: '40px auto', textAlign: 'center', padding: 48 }}>
          <AlertCircle size={64} color="#10B981" style={{ margin: '0 auto 16px' }} />
          {user && user.profileCompleted ? (
            <>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>Profile Under HOD Review</h3>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>You have submitted your Ph.D. profile details. Once the HOD approves your registration, your workspace will be unlocked.</p>
            </>
          ) : (
            <>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>Complete Your PhD Profile</h3>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: 24 }}>Please complete all required details in the **Profile** tab and click **Submit PhD Profile for HOD Approval** to register and unlock the student portal features.</p>
            </>
          )}
          <button className="btn-primary" onClick={() => setActiveTab('profile')}>Go to Profile Tab</button>
        </div>
      );
    }

    if (thesis.status === 'REGISTRATION_PENDING') {
      return <WaitingRoom thesis={thesis} />;
    }

    switch (activeTab) {
      case 'overview': return <OverviewPage thesis={thesis} milestones={milestones} setActiveTab={setActiveTab} user={user} />;
      case 'coursework': return <CourseworkPhase thesis={thesis} />;
      case 'synopsis': return <SynopsisPhase thesis={thesis} milestones={milestones} onSubmit={submitMilestone} />;
      case 'rac': return <RACProgressTab thesis={thesis} />;
      case 'publications': return <ResearchOutputsTab thesis={thesis} />;
      case 'funding': return <MyFundingAndLabTab thesis={thesis} />;
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
                return <div className="card" style={{ padding: 32, color: 'var(--color-text-muted)' }}>No milestones yet.</div>;
              })()
            ) : (
              <AllMilestonesRecords thesis={thesis} milestones={milestones} user={user} />
            )}
          </div>
        );

      case 'profile':
        if (thesis && thesis.status !== 'REGISTRATION_PENDING' && thesis.status !== 'REJECTED') {
          return <StaffProfileTab thesis={thesis} />;
        }
        return <ProfileTab />;
      default: return <div className="card"><h3 className="card-title">{titles[activeTab]}</h3><p style={{ color: 'var(--color-text-muted)', marginTop: 8 }}>Content coming soon.</p></div>;
    }
  };
  return (
    <div className="app-container">
      <div className="mobile-overlay" onClick={() => document.body.classList.remove('sidebar-mobile-open')} />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isVerified={thesis && thesis.status !== 'REGISTRATION_PENDING' && thesis.status !== 'REJECTED'} thesis={thesis} milestones={milestones} />
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
              onClick={() => setActiveTab('profile')}
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
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        navItems={studentNavItems}
        isVerified={thesis && thesis.status !== 'REGISTRATION_PENDING' && thesis.status !== 'REJECTED'}
        thesis={thesis}
        milestones={milestones}
        onLogout={() => { window.location.href = "/logout-bridge?toast=Logged%20out%20successfully"; }}
        isStudent={true}
      />
    </div>
  );
};

export default StudentDashboard;
