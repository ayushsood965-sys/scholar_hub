import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, Plus, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL, API_URL } from '../config';
import { AuthContext } from '../context/AuthContext';
import { ThesisContext } from '../context/ThesisContext';
import { useToast } from '../context/ToastContext';

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

// Split history into submission cycles: each cycle starts at SUBMITTED and ends at REJECTED or final APPROVED
const splitIntoCycles = (history) => {
  if (!history || history.length === 0) return [];
  const sorted = [...history].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const cycles = [];
  let current = [];
  const terminalActions = ['SUPERVISOR_REJECTED', 'HOD_REJECTED', 'REVISION_REQUIRED', 'HOD_APPROVED', 'APPROVED', 'COURSEWORK_FACULTY_REJECTED', 'COURSEWORK_HOD_REJECTED', 'COURSEWORK_HOD_APPROVED'];
  const startActions = ['SUBMITTED', 'COURSEWORK_SUBMITTED'];
  
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
  if (a === 'SUBMITTED' || a === 'COURSEWORK_SUBMITTED') {
    return 'Submitted';
  }
  if (a === 'SUPERVISOR_APPROVED' || a === 'COURSEWORK_FACULTY_APPROVED') {
    return 'Approved by Supervisor / Pending at HOD for approval';
  }
  if (a === 'SUPERVISOR_REJECTED' || a === 'COURSEWORK_FACULTY_REJECTED') {
    return 'Rejected by Supervisor';
  }
  if (a === 'HOD_APPROVED' || a === 'APPROVED' || a === 'COURSEWORK_HOD_APPROVED') {
    return 'Approved by HOD';
  }
  if (a === 'HOD_REJECTED' || a === 'REVISION_REQUIRED' || a === 'COURSEWORK_HOD_REJECTED') {
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
      <td style={{ padding: '10px 12px', color: '#64748B', whiteSpace: 'nowrap' }}>
        {new Date(h.timestamp).toLocaleString()}
      </td>
      <td style={{ padding: '10px 12px', fontWeight: 600, color: '#334155' }}>
        {h.actorName} <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#64748B' }}>({h.actorRole})</span>
      </td>
      <td style={{ padding: '10px 12px' }}>
        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700, color: badgeColor, backgroundColor: badgeBg }}>
          {getActionDisplayName(h.action)}
        </span>
      </td>
      <td style={{ padding: '10px 12px', color: '#475569', fontStyle: 'italic', maxWidth: '300px', wordBreak: 'break-word' }}>
        "{h.remarks || 'No remarks.'}"
      </td>
      <td style={{ padding: '10px 12px' }}>
        {files.length > 0 ? files : <span style={{ color: '#94A3B8' }}>N/A</span>}
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
          <div key={ci} style={{ marginBottom: 16, borderRadius: 8, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <div style={{ background: outcomeBg, padding: '8px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0' }}>
              <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1E293B' }}>Submission #{cycleNum}</span>
              <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700, color: outcomeColor, background: 'rgba(255,255,255,0.7)' }}>
                {outcomeText}
              </span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left', background: '#FFFFFF' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                    <th style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Timestamp</th>
                    <th style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>User</th>
                    <th style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Action</th>
                    <th style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Remarks</th>
                    <th style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Files</th>
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

// ── Status resolver (shared) ──
const resolveDetailedStatus = (status, synopsisStatus, finalSubStatus, subRole, preSubMilestoneStatus, preSubSeminarStatus) => {
  if (status === 'REGISTRATION_PENDING') return { text: 'Awaiting Verification', color: '#D97706', bg: '#FFF3CD' };
  if (status === 'COURSEWORK') return { text: 'Coursework Phase', color: '#0284C7', bg: '#E0F2FE' };
  if (status === 'SYNOPSIS_PENDING') {
    if (synopsisStatus === 'SUBMITTED') {
      if (subRole === 'HOD') {
        return { text: 'Synopsis Pending Upload', color: '#7C3AED', bg: '#EDE9FE' };
      }
      return { text: 'Synopsis Submitted', color: '#2563EB', bg: '#DBEAFE' };
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

// ── Publication status display helper ──
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
    case 'REJECTED':
      return { text: 'rejected', color: '#991B1B', bg: '#FEE2E2', border: '#FCA5A5' };
    default:
      return { text: status || 'Unknown', color: '#475569', bg: '#E2E8F0', border: '#CBD5E1' };
  }
};

// ── Status Pipeline ──
const PIPELINE_STAGES = [
  { key: 'REGISTRATION_PENDING', label: 'Registration' },
  { key: 'COURSEWORK', label: 'Coursework' },
  { key: 'SYNOPSIS_PENDING', label: 'Synopsis' },
  { key: 'DRC', label: 'DRC' },
  { key: 'ACTIVE_RESEARCH', label: 'Active Research' },
  { key: 'PRE_SUBMISSION', label: 'Pre-Submission' },
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'AWARDED', label: 'Awarded' },
];

const getStageIndex = (status) => {
  const map = { REGISTRATION_PENDING: 0, COURSEWORK: 1, SYNOPSIS_PENDING: 2, ACTIVE_RESEARCH: 4, PRE_SUBMISSION: 5, SUBMITTED: 6, AWARDED: 7 };
  return map[status] ?? 0;
};

const StatusPipeline = ({ status }) => {
  const currentIdx = getStageIndex(status);
  return (
    <div className="usm-pipeline">
      {PIPELINE_STAGES.map((stage, idx) => (
        <div className="usm-pipeline-step" key={stage.key}>
          <div className="usm-pipeline-node">
            <div className={`usm-pipeline-dot ${idx < currentIdx ? 'completed' : idx === currentIdx ? 'current' : ''}`}>
              {idx < currentIdx ? '✓' : idx + 1}
            </div>
            <div className="usm-pipeline-label">{stage.label}</div>
          </div>
          {idx < PIPELINE_STAGES.length - 1 && (
            <div className={`usm-pipeline-line ${idx < currentIdx ? 'completed' : ''}`} />
          )}
        </div>
      ))}
    </div>
  );
};

// ── RAC Review Sub-Modal ──
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
    await onSave(rac._id, { status, remarks, researchProgress, nextMilestones, nextMeetingDate: nextMeetingDate || null, committeeChairedBy });
    setLoading(false);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999999, padding: 20 }}>
      <div className="card" style={{ maxWidth: 640, width: '100%', padding: '28px 32px', borderRadius: 20, background: 'var(--color-surface, #ffffff)', color: 'var(--color-text, #1f2937)', display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border, #E2E8F0)', paddingBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Evaluate RAC-{rac.racNumber} Meeting</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-secondary, #64748B)' }}>×</button>
        </div>
          <div><span style={{ color: 'var(--color-text-secondary, #64748B)', fontWeight: 600 }}>Scheduled:</span><div style={{ fontWeight: 700, marginTop: 2 }}>{new Date(rac.scheduledDate).toLocaleDateString()}</div></div>
          <div><span style={{ color: 'var(--color-text-secondary, #64748B)', fontWeight: 600 }}>Committee:</span><div style={{ fontWeight: 700, marginTop: 2 }}>{rac.committeeMembers || 'Pending'}</div></div>
          {rac.submissions && rac.submissions.length > 0 ? (
            <div style={{ gridColumn: 'span 2', marginTop: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ color: 'var(--color-text-secondary, #64748B)', fontWeight: 600 }}>Candidate Submissions History:</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
                {rac.submissions.map((sub, idx) => (
                  <div key={sub._id || idx} style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', padding: 10, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.78rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0', paddingBottom: 2 }}>
                      <span style={{ fontWeight: 700, color: '#1E3A8A' }}>Submission #{idx + 1}</span>
                      <span style={{ fontSize: '0.68rem', color: '#64748B' }}>{new Date(sub.uploadedAt).toLocaleString()}</span>
                    </div>
                    {sub.progressReportUrl && (
                      <div>
                        <a href={`${API_BASE_URL}${sub.progressReportUrl}`} target="_blank" rel="noreferrer" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'underline' }}>
                          📄 View File
                        </a>
                      </div>
                    )}
                    {sub.studentRemarks && (
                      <div>
                        <strong>Remarks:</strong> {sub.studentRemarks}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (rac.progressReportUrl || rac.studentRemarks) ? (
            <div style={{ gridColumn: 'span 2', marginTop: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ color: 'var(--color-text-secondary, #64748B)', fontWeight: 600 }}>Candidate Submission:</span>
              <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', padding: 10, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.78rem', maxWidth: 400 }}>
                {rac.progressReportUrl && (
                  <div>
                    <a href={`${API_BASE_URL}${rac.progressReportUrl}`} target="_blank" rel="noreferrer" style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'underline' }}>
                      📄 View File
                    </a>
                  </div>
                )}
                {rac.studentRemarks && (
                  <div>
                    <strong>Remarks:</strong> {rac.studentRemarks}
                  </div>
                )}
              </div>
            </div>
          ) : null}
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
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Chairperson</label>
              <input type="text" className="form-input" placeholder="e.g. Prof. R. K. Sen" value={committeeChairedBy} onChange={e => setCommitteeChairedBy(e.target.value)} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Research Progress Evaluation (Optional)</label>
            <textarea className="form-input" style={{ width: '100%', resize: 'vertical' }} rows="3" placeholder="Detail research updates..." value={researchProgress} onChange={e => setResearchProgress(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Next 6 Month Targets (Optional)</label>
            <textarea className="form-input" style={{ width: '100%', resize: 'vertical' }} rows="2" placeholder="List targets..." value={nextMilestones} onChange={e => setNextMilestones(e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>Next RAC Date</label>
              <input type="date" className="form-input" value={nextMeetingDate} onChange={e => setNextMeetingDate(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary, #475569)', marginBottom: 4 }}>General Remarks</label>
              <input type="text" className="form-input" placeholder="e.g. Progress is positive." value={remarks} onChange={e => setRemarks(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', borderTop: '1px solid var(--color-border, #E2E8F0)', paddingTop: 16 }}>
            <button type="button" onClick={onClose} className="btn-outline" style={{ padding: '10px 20px' }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '10px 24px', background: '#059669' }}>{loading ? 'Submitting...' : 'Submit Evaluation'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Document Evaluation Sub-Modal ──
const DocEvalModal = ({ doc, onClose, onRefresh }) => {
  const { user } = useContext(AuthContext);
  const toast = useToast();
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReview = async (action) => {
    if (!commentText.trim() && action === 'REVISION') return toast.warning('Remarks required for revision.');
    setLoading(true);
    try {
      if (doc.docType === 'MILESTONE') {
        await axios.put(`${API}/milestones/${doc._id}/review`, { action: action === 'APPROVE' ? 'APPROVE' : 'REVISION', comment: commentText.trim() }, getAuthHeader());
      } else {
        await axios.put(`${API}/publications/${doc._id}/verify`, { status: action === 'APPROVE' ? 'VERIFIED' : 'REJECTED', remarks: commentText.trim() }, getAuthHeader());
      }
      toast.success(`${doc.docType === 'MILESTONE' ? 'Milestone' : 'Publication'} ${action === 'APPROVE' ? 'approved' : 'revision requested'}!`);
      onClose();
      if (onRefresh) onRefresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Error processing review.'); }
    finally { setLoading(false); }
  };

  const fileUrl = doc.documentUrl || doc.attachmentUrl;
  const isDocx = fileUrl?.toLowerCase().endsWith('.docx') || fileUrl?.toLowerCase().endsWith('.doc');
  const viewerUrl = fileUrl ? (isDocx ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(API_BASE_URL + fileUrl)}` : `${API_BASE_URL}${fileUrl}`) : '';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 200000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'var(--color-surface, #ffffff)', color: 'var(--color-text, #1f2937)', borderRadius: 20, padding: 24, width: '95%', maxWidth: 1100, height: 'min(720px, 90vh)', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--color-border, #E2E8F0)', paddingBottom: 12, flexShrink: 0 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Reviewing: {doc.scholarName}'s Submission</h3>
          <button onClick={onClose} className="usm-close-btn">✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20, flex: 1, minHeight: 0 }}>
          <div style={{ background: '#F8FAFC', borderRadius: 12, border: '1px solid var(--color-border, #E2E8F0)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ background: '#F1F5F9', padding: '8px 16px', borderBottom: '1px solid var(--color-border, #E2E8F0)', fontWeight: 600, fontSize: '0.8rem', color: '#475569', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📄 Document Preview</span>
              {fileUrl && <a href={`${API_BASE_URL}${fileUrl}`} target="_blank" rel="noreferrer" style={{ color: '#2563EB', fontWeight: 700 }}>Download ⬇️</a>}
            </div>
            <div style={{ flex: 1, position: 'relative' }}>
              {fileUrl ? <iframe src={viewerUrl} title="Doc" style={{ width: '100%', height: '100%', border: 'none' }} /> : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', flexDirection: 'column' }}>
                  <span style={{ fontSize: '2.5rem' }}>⚠️</span><p style={{ marginTop: 8, fontWeight: 700 }}>No document attached</p>
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '4px 0', overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--color-bg, #F8FAFC)', padding: 16, borderRadius: 12, border: '1px solid var(--color-border, #E2E8F0)', fontSize: '0.82rem' }}>
                <div><strong>Scholar:</strong> {doc.scholarName} {doc.enrollmentNumber ? `(${doc.enrollmentNumber})` : ''}</div>
                <div><strong>Deliverable:</strong> {doc.title}</div>
                <div><strong>Type:</strong> {doc.type === 'IPR' && doc.iprType ? `IPR: ${doc.iprType}` : doc.type === 'PATENT' ? 'IPR: Patent' : doc.type || doc.docType}</div>
                {doc.thesisTitle && <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><strong>Thesis:</strong> {doc.thesisTitle}</div>}
                
                {doc.feeDetails?.periodFrom && (
                  <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed var(--color-border, #E2E8F0)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontWeight: 700, color: '#059669', marginBottom: 2 }}>💰 Fee Payment Details</div>
                    <div><strong>Fee Period:</strong> {new Date(doc.feeDetails.periodFrom).toLocaleDateString()} to {new Date(doc.feeDetails.periodTo).toLocaleDateString()} ({doc.feeDetails.durationMonths}m, {doc.feeDetails.durationDays}d)</div>
                    <div><strong>Total Deposited:</strong> INR {doc.feeDetails.totalFeeDeposited || 'N/A'}</div>
                    <div><strong>Remarks:</strong> {doc.feeDetails.remarks}</div>
                    {doc.feeDetails.feeReceiptUrl && (
                      <div style={{ marginTop: 2 }}>
                        <strong>Receipt:</strong>{' '}
                        <a href={`${API_BASE_URL}${doc.feeDetails.feeReceiptUrl}`} target="_blank" rel="noreferrer" style={{ color: '#2563EB', fontWeight: 700, textDecoration: 'underline' }}>
                          View Receipt PDF 📄
                        </a>
                      </div>
                    )}
                  </div>
                )}

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
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-secondary, #475569)', marginBottom: 6 }}>Review Remarks</label>
                <textarea className="form-input" rows="8" placeholder="Enter feedback..." value={commentText} onChange={e => setCommentText(e.target.value)} style={{ width: '100%', resize: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, borderTop: '1px solid var(--color-border, #E2E8F0)', paddingTop: 16 }}>
              {(() => {
                const isHodUser = user?.role === 'HOD' || user?.subRole === 'HOD' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
                let showEvaluate = false;

                if (doc.docType === 'PUBLICATION') {
                  showEvaluate = isHodUser ? doc.status === 'UNDER_REVIEW_HOD' : doc.status === 'PENDING';
                } else if (doc.type === '6_MONTH_REPORT') {
                  if (doc.isSupervisor) {
                    showEvaluate = doc.status === 'PENDING';
                  } else if (isHodUser) {
                    showEvaluate = doc.status === 'UNDER_REVIEW_HOD';
                  }
                } else {
                  showEvaluate = doc.status === 'SUBMITTED' || doc.status === 'PENDING' || (doc.status === 'PENDING_HOD' && isHodUser);
                }

                if (showEvaluate) {
                  return (
                    <>
                      <button type="button" onClick={() => handleReview('REVISION')} disabled={loading} className="btn-outline" style={{ flex: 1, padding: '12px', fontSize: '0.85rem', color: '#DC2626', borderColor: '#FCA5A5', fontWeight: 700 }}>✗ Request Revision</button>
                      <button type="button" onClick={() => handleReview('APPROVE')} disabled={loading} className="btn-primary" style={{ flex: 1, padding: '12px', fontSize: '0.85rem', background: '#059669', fontWeight: 700 }}>✓ Approve</button>
                    </>
                  );
                } else {
                  const display = doc.type === '6_MONTH_REPORT' || doc.docType === 'PUBLICATION' ? getStatusDisplay(doc.status) : { text: doc.status };
                  return (
                    <div style={{ textAlign: 'center', width: '100%', padding: '10px', background: '#F1F5F9', borderRadius: 8, fontWeight: 700, color: '#475569', fontSize: '0.85rem' }}>
                      Status: <span style={{ color: doc.status === 'VERIFIED' || doc.status === 'APPROVED' ? '#059669' : doc.status === 'UNDER_REVIEW_HOD' || doc.status === 'PENDING_HOD' ? '#1D4ED8' : '#DC2626' }}>{display.text}</span>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════
// MAIN: Unified Scholar Modal
// ══════════════════════════════════════════════════════════
const UnifiedScholarModal = ({ thesis, milestones, subRole: propSubRole, onClose, onRefresh, onReview, onDRC, onSeminar, onFinalApprove, onClearCoursework, onVerify, onAssign, onForcePreSubmission, isReadOnly = false }) => {
  const toast = useToast();
  const { user: contextUser } = useContext(AuthContext);
  const { 
    transferScholar, 
    approveCourseworkFaculty, 
    rejectCourseworkFaculty, 
    approveCourseworkHOD, 
    rejectCourseworkHOD,
    schedulePreSubmissionSeminar,
    recordPreSubmissionSeminarOutcome,
    provisionalSynopsisClear
  } = useContext(ThesisContext);

  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [remarks, setRemarks] = useState({});
  const [cwRemarks, setCwRemarks] = useState('');
  const [showBypassModal, setShowBypassModal] = useState(false);
  const [bypassRemarks, setBypassRemarks] = useState('');
  const [bypassLoading, setBypassLoading] = useState(false);
  const [showProvisionalClearModal, setShowProvisionalClearModal] = useState(false);
  const [provisionalConfirmText, setProvisionalConfirmText] = useState('');
  const [bypassConfirmText, setBypassConfirmText] = useState('');

  // Rejection & Editing states
  const [showRejectPopup, setShowRejectPopup] = useState(false);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const handleRejectAndSendToStudent = async () => {
    if (!rejectRemarks.trim()) {
      toast.warning('Please enter rejection remarks.');
      return;
    }
    
    try {
      setLoading(true);
      const scholarId = thesis.scholarId?._id || thesis.scholarId;
      const res = await axios.put(`${API_BASE_URL}/api/auth/users/${scholarId}/reject`, { remarks: rejectRemarks }, getAuthHeader());
      toast.success(res.data.message || 'Registration rejected and sent back to student.');
      setShowRejectPopup(false);
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject registration');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEditAtHodEnd = () => {
    const scholar = thesis.scholarId || {};
    const profile = scholar.profile || {};
    const q = profile.qualifications || {};
    
    setEditForm({
      name: scholar.name || '',
      dob: profile.dob || '',
      gender: profile.gender || '',
      category: profile.category || '',
      nationality: profile.nationality || '',
      fatherName: profile.fatherName || '',
      motherName: profile.motherName || '',
      phoneNumber: profile.phoneNumber || '',
      address: profile.address || '',
      degreeType: profile.degreeType || '',
      degreeName: profile.degreeName || '',
      academicSession: profile.academicSession || '',
      enrollmentNumber: profile.enrollmentNumber || '',
      erpAdmissionNo: profile.erpAdmissionNo || '',
      admissionDate: profile.admissionDate || '',
      phdMode: profile.phdMode || '',
      specialization: profile.specialization || '',
      areaOfInterest: profile.areaOfInterest || '',
      thesisTitle: thesis.title || profile.thesisTitle || '',
      thesisSummary: thesis.abstract || profile.thesisSummary || '',
      thesisKeywords: profile.thesisKeywords || '',
      preferredGuideId: profile.preferredGuideId || '',
      
      qualifications: {
        class10: {
          board: q.class10?.board || '',
          school: q.class10?.school || '',
          rollNo: q.class10?.rollNo || '',
          percentage: q.class10?.percentage || '',
          certificateUrl: q.class10?.certificateUrl || ''
        },
        class12: {
          board: q.class12?.board || '',
          school: q.class12?.school || '',
          rollNo: q.class12?.rollNo || '',
          percentage: q.class12?.percentage || '',
          certificateUrl: q.class12?.certificateUrl || ''
        },
        graduation: {
          university: q.graduation?.university || '',
          college: q.graduation?.college || '',
          degree: q.graduation?.degree || '',
          rollNo: q.graduation?.rollNo || '',
          percentage: q.graduation?.percentage || '',
          certificateUrl: q.graduation?.certificateUrl || ''
        },
        postGraduation: {
          university: q.postGraduation?.university || '',
          college: q.postGraduation?.college || '',
          degree: q.postGraduation?.degree || '',
          rollNo: q.postGraduation?.rollNo || '',
          percentage: q.postGraduation?.percentage || '',
          certificateUrl: q.postGraduation?.certificateUrl || ''
        }
      }
    });
    setIsEditing(true);
    setShowRejectPopup(false);
    setShowProfileDetails(true);
  };

  const handleSaveEdit = async (approveAfterSave) => {
    try {
      setLoading(true);
      const scholarId = thesis.scholarId?._id || thesis.scholarId;
      
      let cleanedPhone = editForm.phoneNumber;
      if (cleanedPhone) {
        cleanedPhone = cleanedPhone.trim().replace(/[\s\-()]/g, '');
        const indianPhoneRegex = /^(\+91|91|0)?[6-9]\d{9}$/;
        if (!indianPhoneRegex.test(cleanedPhone)) {
          toast.warning('Please enter a valid 10-digit Indian phone number.');
          setLoading(false);
          return;
        }
      }

      await axios.put(`${API_BASE_URL}/api/auth/users/${scholarId}/profile`, editForm, getAuthHeader());
      
      if (approveAfterSave) {
        if (!thesis.supervisorId) {
          if (!selSupervisor) {
            toast.warning('Please select a supervisor first.');
            setLoading(false);
            return;
          }
          await onAssign(selSupervisor);
        }
        await onVerify();
        toast.success('Profile saved, supervisor assigned and registration approved successfully!');
        if (onRefresh) await onRefresh();
        setIsEditing(false);
        onClose();
      } else {
        toast.success('Profile changes saved successfully!');
        if (onRefresh) await onRefresh();
        setIsEditing(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile changes');
    } finally {
      setLoading(false);
    }
  };

  // States for Pre-Submission Seminar Schedule and Outcome Recording
  const [semDate, setSemDate] = useState('');
  const [semTime, setSemTime] = useState('');
  const [semVenue, setSemVenue] = useState('');
  const [semCommittee, setSemCommittee] = useState('');
  const [semRemarks, setSemRemarks] = useState('');
  const [semOutcomeStatus, setSemOutcomeStatus] = useState('CLEARED');
  const [semOutcomeRemarks, setSemOutcomeRemarks] = useState('');

  // Synopsis DRC States
  const [synDrcDate, setSynDrcDate] = useState('');
  const [synDrcTime, setSynDrcTime] = useState('');
  const [synDrcVenue, setSynDrcVenue] = useState('');
  const [synDrcCommittee, setSynDrcCommittee] = useState('');
  const [synDrcAgenda, setSynDrcAgenda] = useState('DRC for Synopsis Approval');

  // Synopsis DRC outcome record states
  const [synDrcOutcomeStatus, setSynDrcOutcomeStatus] = useState('APPROVED');
  const [synDrcOutcomeRemarks, setSynDrcOutcomeRemarks] = useState('');

  const user = isReadOnly ? { ...contextUser, role: '', _id: '' } : contextUser;
  const subRole = isReadOnly ? '' : propSubRole;

  // Data states
  const [publications, setPublications] = useState([]);
  const [drcMeetings, setDrcMeetings] = useState([]);
  const [racReviews, setRacReviews] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]);
  const [additionalDocs, setAdditionalDocs] = useState([]);
  const [pubsLoading, setPubsLoading] = useState(false);

  // Sub-modals
  const [selectedEvalDoc, setSelectedEvalDoc] = useState(null);
  const [selectedRAC, setSelectedRAC] = useState(null);

  // Form states
  const [showProfileDetails, setShowProfileDetails] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTargetId, setTransferTargetId] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [allFaculties, setAllFaculties] = useState([]);

  // DRC form states
  const [showDrcSchedule, setShowDrcSchedule] = useState(false);
  const [drcForm, setDrcForm] = useState({ scheduledDate: '', scheduledTime: '', venue: '', committeeMembers: '', agenda: '', isSynopsisApproval: false });
  const [showDrcResult, setShowDrcResult] = useState(false);
  const [selectedDrc, setSelectedDrc] = useState(null);
  const [drcResultForm, setDrcResultForm] = useState({ status: 'APPROVED', remarks: '', scheduledDate: '', scheduledTime: '', venue: '', committeeMembers: '' });
  const [showOfflineDrc, setShowOfflineDrc] = useState(false);
  const [offlineDrcForm, setOfflineDrcForm] = useState({ conductedDate: '', venue: '', committeeMembers: '', remarks: '', status: 'APPROVED', isSynopsisApproval: false });

  // RAC form states
  const [showRacSchedule, setShowRacSchedule] = useState(false);
  const [racForm, setRacForm] = useState({ racNumber: 1, scheduledDate: '', committeeMembers: '' });

  // Report assignment
  const [showAssignReport, setShowAssignReport] = useState(false);
  const [newReportTitle, setNewReportTitle] = useState('');
  const [newReportDueDate, setNewReportDueDate] = useState('');

  // Seminar scheduling
  const [showSeminarSchedule, setShowSeminarSchedule] = useState(false);
  const [seminarForm, setSeminarForm] = useState({ scheduledDate: '', scheduledTime: '', venue: '', committeeMembers: '' });

  // HOD faculty assignment
  const [faculty, setFaculty] = useState([]);
  const [selSupervisor, setSelSupervisor] = useState(thesis.supervisorId?._id || '');

  // Dispatch form states
  const [showDispatchForm, setShowDispatchForm] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({ dispatchDate: '', dispatchMethod: 'Speed Post', dispatchTrackingNumber: '' });

  // Viva form states
  const [showVivaForm, setShowVivaForm] = useState(false);
  const [vivaForm, setVivaForm] = useState({ vivaDate: '', vivaTime: '', vivaVenue: '', vivaPanel: '' });

  // Viva outcome form states
  const [showVivaOutcomeForm, setShowVivaOutcomeForm] = useState(false);
  const [vivaOutcomeForm, setVivaOutcomeForm] = useState({ vivaStatus: 'SUCCESSFUL', remarks: '' });

  // Degree award form states
  const [showAwardForm, setShowAwardForm] = useState(false);
  const [awardForm, setAwardForm] = useState({ note: '' });

  // New final submission & award degree states
  const [eligibilityData, setEligibilityData] = useState(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [showSupervisorRejectForm, setShowSupervisorRejectForm] = useState(false);
  const [showHodRejectForm, setShowHodRejectForm] = useState(false);
  const [showEvalOutcomeForm, setShowEvalOutcomeForm] = useState(false);
  const [supervisorRejectComment, setSupervisorRejectComment] = useState('');
  const [hodRejectComment, setHodRejectComment] = useState('');
  const [evalRemarks, setEvalRemarks] = useState('');

  const fetchEligibility = async () => {
    setEligibilityLoading(true);
    try {
      const res = await axios.get(`${API}/thesis/${thesis._id}/eligibility`, getAuthHeader());
      setEligibilityData(res.data);
    } catch (err) {
      toast.error('Failed to load eligibility checklist.');
    } finally {
      setEligibilityLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'awardDegree') {
      fetchEligibility();
    }
  }, [activeTab, thesis._id]);

  // ── Fetch All Data ──
  const fetchPublications = async () => {
    setPubsLoading(true);
    try { const res = await axios.get(`${API}/publications/thesis/${thesis._id}`, getAuthHeader()); setPublications(res.data); } catch (err) {}
    setPubsLoading(false);
  };

  const fetchDrcMeetings = async () => {
    try { const res = await axios.get(`${API}/lifecycle/drc/thesis/${thesis._id}`, getAuthHeader()); setDrcMeetings(res.data); } catch (err) {}
  };

  const fetchRacReviews = async () => {
    try { const res = await axios.get(`${API}/lifecycle/rac/thesis/${thesis._id}`, getAuthHeader()); setRacReviews(res.data); } catch (err) {}
  };

  const fetchChangeRequests = async () => {
    try { const res = await axios.get(`${API}/lifecycle/change-requests/thesis/${thesis._id}`, getAuthHeader()); setChangeRequests(res.data); } catch (err) {}
  };

  const fetchAdditionalDocs = async () => {
    try { const res = await axios.get(`${API}/additional-documents/thesis/${thesis._id}`, getAuthHeader()); setAdditionalDocs(res.data); } catch (err) {}
  };

  useEffect(() => {
    fetchPublications();
    fetchDrcMeetings();
    fetchRacReviews();
    fetchChangeRequests();
    fetchAdditionalDocs();
    axios.get(`${API}/auth/faculty`, getAuthHeader())
      .then(r => setFaculty(r.data))
      .catch(() => {});
  }, [thesis._id]);

  useEffect(() => {
    if (showTransferModal && thesis?.department) {
      axios.get(`${API}/auth/faculty`, getAuthHeader())
        .then(r => setAllFaculties(r.data.filter(f => f.isVerified && f.department === thesis.department && f._id !== user._id)))
        .catch(() => {});
    }
  }, [showTransferModal]);

  const act = async (fn) => { setLoading(true); try { await fn(); } catch (e) { toast.error(e.response?.data?.message || 'Error'); } finally { setLoading(false); } };

  const refreshAll = async () => {
    if (onRefresh) await onRefresh();
    fetchPublications();
    fetchDrcMeetings();
    fetchRacReviews();
    fetchChangeRequests();
    if (activeTab === 'awardDegree') {
      fetchEligibility();
    }
  };

  // ── Computed values ──
  const synopsisMilestone = milestones.find(m => m.type === 'SYNOPSIS');
  const finalSubMilestone = milestones.find(m => m.type === 'FINAL_SUBMISSION');
  const preSubMilestone = milestones.find(m => m.type === 'PRE_SUBMISSION');
  const badge = resolveDetailedStatus(thesis.status, synopsisMilestone?.status, finalSubMilestone?.status, subRole, preSubMilestone?.status, thesis.preSubmissionSeminar?.status);
  const reports = milestones.filter(m => m.type === '6_MONTH_REPORT');
  const chapters = milestones.filter(m => m.type === 'CHAPTER_DRAFT');
  const corePendingMilestones = milestones.filter(m => (m.type === 'FINAL_SUBMISSION' || m.type === 'PRE_SUBMISSION') && (m.status === 'SUBMITTED' || m.status === 'REVISION_REQUIRED'));
  const corePendingMilestonesDocs = corePendingMilestones.filter(m => m.type !== 'PRE_SUBMISSION');
  const verifiedJournals = publications.filter(p => p.type === 'JOURNAL' && p.status === 'VERIFIED').length;
  const verifiedConferences = publications.filter(p => p.type === 'CONFERENCE' && p.status === 'VERIFIED').length;
  const isSupervisor = thesis.supervisorId && (thesis.supervisorId._id === user?._id || thesis.supervisorId === user?._id);
  const isHodUser = subRole === 'HOD' || user?.role === 'HOD' || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const pendingOutputsCount = publications.filter(p => {
    const matchSupervisor = isSupervisor && p.status === 'PENDING';
    const matchHod = isHodUser && p.status === 'UNDER_REVIEW_HOD';
    return matchSupervisor || matchHod;
  }).length;
  const pendingReportsCount = milestones.filter(m => m.type === '6_MONTH_REPORT' && ((isSupervisor && m.status === 'PENDING') || (isHodUser && m.status === 'UNDER_REVIEW_HOD'))).length;
  const pendingChaptersCount = milestones.filter(m => m.status === 'SUBMITTED' && m.type === 'CHAPTER_DRAFT' && m.forwardedTo && (m.forwardedTo._id === user?._id || m.forwardedTo === user?._id)).length;
  const pendingDocCount = corePendingMilestonesDocs.filter(m => m.status === 'SUBMITTED').length + additionalDocs.filter(d => d.status === 'SUBMITTED' && d.forwardedTo && (d.forwardedTo._id === user?._id || d.forwardedTo === user?._id)).length;
  const scheduledRacs = racReviews.filter(r => r.status === 'SCHEDULED').length;

  const preSubmissionBadge = (() => {
    const semStatus = thesis.preSubmissionSeminar?.status || 'NOT_REQUESTED';
    const preMilestone = milestones.find(m => m.type === 'PRE_SUBMISSION');
    
    if (subRole !== 'HOD' && isSupervisor) {
      if (preMilestone?.status === 'SUBMITTED') return 1;
    }
    if (subRole === 'HOD') {
      if (preMilestone?.status === 'PENDING_HOD') return 1;
      if (preMilestone?.status === 'APPROVED' && (semStatus === 'NOT_SCHEDULED' || semStatus === 'NOT_REQUESTED' || semStatus === 'UNCLEARED')) return 1;
      if (semStatus === 'SCHEDULED') return 1;
    }
    return null;
  })();

  // ── Transfer ──
  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!transferTargetId) return toast.warning('Please select a faculty member.');
    setTransferLoading(true);
    try {
      await transferScholar(thesis._id, transferTargetId);
      toast.success('Scholar transferred!');
      setShowTransferModal(false);
      onClose();
      if (onRefresh) await onRefresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Transfer failed.'); }
    finally { setTransferLoading(false); }
  };

  const handleProvisionalSynopsisClear = async () => {
    setLoading(true);
    try {
      await provisionalSynopsisClear(thesis._id);
      toast.success('Synopsis provisionally cleared successfully! Candidate has transitioned to the Active Research phase.');
      if (onRefresh) await onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Provisional clearance failed.');
    } finally {
      setLoading(false);
    }
  };

  // ── Bypass Pre-Submission ──
  const handleBypassSubmit = async (e) => {
    e.preventDefault();
    if (!bypassRemarks.trim()) return toast.warning('Remarks are required.');
    setBypassLoading(true);
    try {
      await axios.put(`${API}/thesis/${thesis._id}/force-pre-submission`, { remarks: bypassRemarks }, getAuthHeader());
      toast.success('Scholar advanced to Pre-Submission phase!');
      setShowBypassModal(false);
      setBypassRemarks('');
      setBypassConfirmText('');
      if (onRefresh) await onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to advance scholar.');
    } finally {
      setBypassLoading(false);
    }
  };

  // ── DRC handlers ──
  const handleDrcSchedule = async (e) => {
    e.preventDefault();
    if (!drcForm.scheduledDate || !drcForm.scheduledTime || !drcForm.venue) return toast.warning('Fill Date, Time, Venue');
    setLoading(true);
    try {
      await axios.post(`${API}/lifecycle/drc/schedule`, { thesisId: thesis._id, ...drcForm }, getAuthHeader());
      toast.success('DRC meeting scheduled!');
      setShowDrcSchedule(false);
      setDrcForm({ scheduledDate: '', scheduledTime: '', venue: '', committeeMembers: '', agenda: '', isSynopsisApproval: false });
      fetchDrcMeetings();
      if (onDRC) await onDRC();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const handleDrcResult = async (e) => {
    e.preventDefault();
    if (!selectedDrc) return;
    setLoading(true);
    try {
      if (drcResultForm.status === 'RESCHEDULE') {
        if (!drcResultForm.scheduledDate || !drcResultForm.scheduledTime || !drcResultForm.venue) { toast.warning('Fill Date, Time, Venue'); setLoading(false); return; }
        await axios.put(`${API}/lifecycle/drc/${selectedDrc._id}/reschedule`, { scheduledDate: drcResultForm.scheduledDate, scheduledTime: drcResultForm.scheduledTime, venue: drcResultForm.venue, committeeMembers: drcResultForm.committeeMembers, remarks: drcResultForm.remarks }, getAuthHeader());
        toast.success('DRC rescheduled!');
      } else {
        await axios.put(`${API}/lifecycle/drc/${selectedDrc._id}/result`, { status: drcResultForm.status, remarks: drcResultForm.remarks }, getAuthHeader());
        toast.success(`DRC marked ${drcResultForm.status}!`);
      }
      setShowDrcResult(false); setSelectedDrc(null);
      setDrcResultForm({ status: 'APPROVED', remarks: '', scheduledDate: '', scheduledTime: '', venue: '', committeeMembers: '' });
      fetchDrcMeetings();
      if (onDRC) await onDRC();
      if (onRefresh) await onRefresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const handleOfflineDrc = async (e) => {
    e.preventDefault();
    if (!offlineDrcForm.remarks) return toast.warning('Enter Remarks / MoM');
    setLoading(true);
    try {
      await axios.post(`${API}/lifecycle/drc/offline`, { thesisId: thesis._id, conductedDate: offlineDrcForm.conductedDate || new Date(), venue: offlineDrcForm.venue || 'Offline', committeeMembers: offlineDrcForm.committeeMembers || 'Department Board', remarks: offlineDrcForm.remarks, status: offlineDrcForm.status, isSynopsisApproval: offlineDrcForm.isSynopsisApproval }, getAuthHeader());
      toast.success(`Offline DRC recorded as ${offlineDrcForm.status}!`);
      setShowOfflineDrc(false);
      setOfflineDrcForm({ conductedDate: '', venue: '', committeeMembers: '', remarks: '', status: 'APPROVED', isSynopsisApproval: false });
      fetchDrcMeetings();
      if (onDRC) await onDRC();
      if (onRefresh) await onRefresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  // ── RAC handlers ──
  const handleRacSchedule = async (e) => {
    e.preventDefault();
    if (!racForm.scheduledDate) return toast.warning('Select a date');
    setLoading(true);
    try {
      await axios.post(`${API}/lifecycle/rac/schedule`, { thesisId: thesis._id, ...racForm }, getAuthHeader());
      toast.success('RAC meeting scheduled!');
      setShowRacSchedule(false);
      setRacForm({ racNumber: 1, scheduledDate: '', committeeMembers: '' });
      fetchRacReviews();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const handleRacGrade = async (racId, payload) => {
    try {
      await axios.put(`${API}/lifecycle/rac/${racId}/result`, payload, getAuthHeader());
      toast.success(`RAC graded as ${payload.status}!`);
      fetchRacReviews();
    } catch (err) { toast.error('Failed to grade RAC.'); }
  };

  // ── Report assignment ──
  const handleAssignReport = async (e) => {
    e.preventDefault();
    if (!newReportTitle.trim()) return toast.warning('Enter report title.');
    if (!newReportDueDate) return toast.warning('Choose due date.');
    setLoading(true);
    try {
      await axios.post(`${API}/milestones/create`, { thesisId: thesis._id, type: '6_MONTH_REPORT', title: newReportTitle.trim(), sequence: reports.length + 1, dueDate: newReportDueDate }, getAuthHeader());
      toast.success('Report milestone assigned!');
      setShowAssignReport(false);
      setNewReportTitle('');
      setNewReportDueDate('');
      if (onRefresh) await onRefresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  // ── Seminar scheduling ──
  const handleSeminarSchedule = async (e) => {
    e.preventDefault();
    if (!seminarForm.scheduledDate || !seminarForm.scheduledTime || !seminarForm.venue) return toast.warning('Fill Date, Time, Venue');
    setLoading(true);
    try {
      // Use the onSeminar prop which is scheduleSeminar from ThesisContext
      // Actually we need a different handler - the schedule seminar endpoint
      await axios.put(`${API}/thesis/${thesis._id}/schedule-seminar`, seminarForm, getAuthHeader());
      toast.success('Pre-Submission Seminar scheduled!');
      setShowSeminarSchedule(false);
      setSeminarForm({ scheduledDate: '', scheduledTime: '', venue: '', committeeMembers: '' });
      if (onRefresh) await onRefresh();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  // ── Dispatch logging ──
  const handleDispatch = async (e) => {
    e.preventDefault();
    if (!dispatchForm.dispatchDate || !dispatchForm.dispatchMethod) {
      return toast.warning('Dispatch Date and Method are required.');
    }
    setLoading(true);
    try {
      await axios.put(`${API}/thesis/${thesis._id}/dispatch`, dispatchForm, getAuthHeader());
      toast.success('Thesis dispatch details recorded!');
      setShowDispatchForm(false);
      if (onRefresh) await onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record dispatch details.');
    } finally {
      setLoading(false);
    }
  };

  // ── Viva scheduling ──
  const handleScheduleViva = async (e) => {
    e.preventDefault();
    if (!vivaForm.vivaDate || !vivaForm.vivaTime || !vivaForm.vivaVenue) {
      return toast.warning('Date, Time, and Venue are required.');
    }
    setLoading(true);
    try {
      await axios.put(`${API}/thesis/${thesis._id}/schedule-viva`, vivaForm, getAuthHeader());
      toast.success('Viva-Voce defense scheduled successfully!');
      setShowVivaForm(false);
      if (onRefresh) await onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule Viva-Voce.');
    } finally {
      setLoading(false);
    }
  };

  // ── Record Viva outcome ──
  const handleRecordVivaOutcome = async (e) => {
    e.preventDefault();
    if (!vivaOutcomeForm.vivaStatus) {
      return toast.warning('Outcome decision is required.');
    }
    setLoading(true);
    try {
      await axios.put(`${API}/thesis/${thesis._id}/record-viva`, vivaOutcomeForm, getAuthHeader());
      toast.success(`Viva-Voce outcome recorded as ${vivaOutcomeForm.vivaStatus}!`);
      setShowVivaOutcomeForm(false);
      if (onRefresh) await onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record Viva-Voce outcome.');
    } finally {
      setLoading(false);
    }
  };

  // ── Award Ph.D. Degree ──
  const handleAwardDegree = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`${API}/thesis/${thesis._id}/award`, { note: awardForm.note }, getAuthHeader());
      toast.success('Ph.D. Degree Awarded! Congratulations!');
      setShowAwardForm(false);
      if (onRefresh) await onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to award degree.');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseworkAction = async (action, remarksText) => {
    setLoading(true);
    try {
      if (action === 'APPROVE_FACULTY') {
        await approveCourseworkFaculty(thesis._id);
        toast.success('Coursework details approved by Supervisor!');
      } else if (action === 'REJECT_FACULTY') {
        await rejectCourseworkFaculty(thesis._id, remarksText);
        toast.success('Coursework details rejected and sent back to student.');
      } else if (action === 'APPROVE_HOD') {
        await approveCourseworkHOD(thesis._id);
        toast.success('Coursework successfully cleared and marked as completed!');
      } else if (action === 'REJECT_HOD') {
        await rejectCourseworkHOD(thesis._id, remarksText);
        toast.success('Coursework details rejected and sent back to student.');
      }
      if (onRefresh) await onRefresh();
      setCwRemarks('');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update coursework status');
    } finally {
      setLoading(false);
    }
  };

  const renderCourseworkSection = (title, items) => {
    if (!items || items.length === 0) {
      return (
        <div style={{ color: '#64748B', fontSize: '0.85rem', fontStyle: 'italic', padding: '10px 0' }}>
          No subjects added in this section.
        </div>
      );
    }
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8, fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', textAlign: 'left' }}>
            <th style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Subject Name</th>
            <th style={{ padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Subject Code</th>
            <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 700, color: '#475569', width: '120px' }}>Marks Obtained</th>
            <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 700, color: '#475569', width: '120px' }}>Maximum Marks</th>
            <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 700, color: '#475569', width: '150px' }}>Exam Month & Year</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
              <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1E293B' }}>{item.subjectName}</td>
              <td style={{ padding: '10px 12px', color: '#475569' }}>{item.subjectCode || '-'}</td>
              <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#0F172A' }}>{item.marksObtained}</td>
              <td style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>{item.maxMarks}</td>
              <td style={{ padding: '10px 12px', textAlign: 'center', color: '#475569' }}>{formatMonthYear(item.examinationMonthYear)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderCoursework = () => {
    const details = thesis.courseworkDetails || {};
    const hasDetails = (details.researchEthics && details.researchEthics.length > 0) ||
                       (details.researchMethodology && details.researchMethodology.length > 0) ||
                       (details.elective && details.elective.length > 0) ||
                       (details.others && details.others.length > 0);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h3 className="usm-section-title" style={{ margin: 0 }}>📚 Coursework Marks & Verification</h3>
          <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: 4 }}>
            Verify the subject-wise coursework examinations and marks details submitted by the scholar.
          </p>
        </div>

        {/* Current coursework verification status */}
        <div style={{ 
          background: 'var(--color-bg, #F8FAFC)', 
          border: '1px solid var(--color-border, #E2E8F0)', 
          padding: '12px 16px', 
          borderRadius: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted, #64748B)' }}>Coursework Progress Status</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, marginTop: 4, color: thesis.courseworkCompleted ? '#059669' : '#D97706' }}>
              {thesis.courseworkCompleted ? 'APPROVED & COMPLETED ✅' : 
               thesis.courseworkStatus === 'PENDING_FACULTY' ? 'Awaiting Supervisor Approval ⏳' :
               thesis.courseworkStatus === 'PENDING_HOD' ? 'Awaiting HOD Approval ⏳' :
               thesis.courseworkStatus === 'REJECTED' ? 'Rejected & Sent Back to Student ❌' :
               'Awaiting Submission from Student ⏳'}
            </div>
          </div>
          {thesis.courseworkApprovals?.remarks && (
            <div style={{ maxWidth: '60%', fontSize: '0.82rem', background: '#FEF2F2', borderLeft: '3px solid #EF4444', padding: '6px 10px', borderRadius: 6, color: '#991B1B' }}>
              <strong>Remarks:</strong> "{thesis.courseworkApprovals.remarks}"
            </div>
          )}
        </div>

        {!hasDetails ? (
          <div className="usm-card" style={{ textAlign: 'center', color: '#64748B', fontSize: '0.85rem', padding: '30px 20px' }}>
            📭 The scholar has not submitted any coursework marks yet.
          </div>
        ) : (
          <>
            <div className="usm-card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1E3A8A', borderBottom: '2px solid #DBEAFE', paddingBottom: 6 }}>1. Research and Publication Ethics</div>
              {renderCourseworkSection('Research and Publication Ethics', details.researchEthics)}
            </div>

            <div className="usm-card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#065F46', borderBottom: '2px solid #D1FAE5', paddingBottom: 6 }}>2. Research Methodology</div>
              {renderCourseworkSection('Research Methodology', details.researchMethodology)}
            </div>

            <div className="usm-card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#B45309', borderBottom: '2px solid #FEF3C7', paddingBottom: 6 }}>3. Discipline-Specific Elective Course</div>
              {renderCourseworkSection('Discipline-Specific Elective Course', details.elective)}
            </div>

            {details.others && details.others.length > 0 && (
              <div className="usm-card" style={{ padding: 16 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#475569', borderBottom: '2px solid #CBD5E1', paddingBottom: 6 }}>4. Others</div>
                {renderCourseworkSection('Others', details.others)}
              </div>
            )}

            {thesis.courseworkUploadProof && (
              <div className="usm-card" style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#334155' }}>Upload Proof (Grade Sheet / Certificate)</span>
                <a 
                  href={`${API_BASE_URL}${thesis.courseworkUploadProof}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn-primary"
                  style={{ fontSize: '0.8rem', padding: '8px 16px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  📎 View Uploaded Proof
                </a>
              </div>
            )}

            {/* Approval / Rejection box for Supervisor */}
            {!isReadOnly && subRole !== 'HOD' && isSupervisor && thesis.courseworkStatus === 'PENDING_FACULTY' && (
              <div className="usm-card" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: 20 }}>
                <h4 style={{ margin: '0 0 10px', color: '#166534', fontSize: '0.9rem', fontWeight: 800 }}>🤝 Supervisor Coursework Review Action</h4>
                <p style={{ fontSize: '0.8rem', color: '#166534', marginBottom: 12 }}>
                  Verify that the marks entered above exactly match the candidate's exam grade sheets. Approving will forward the file to HOD for final clearance.
                </p>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#166534', marginBottom: 4 }}>Rejection Remarks (Required only if rejecting)</label>
                  <textarea
                    className="form-input"
                    rows="2"
                    placeholder="Enter reason for sending back..."
                    value={cwRemarks}
                    onChange={e => setCwRemarks(e.target.value)}
                    style={{ background: '#FFFFFF', borderColor: '#BBF7D0', width: '100%' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button 
                    onClick={() => handleCourseworkAction('APPROVE_FACULTY')} 
                    disabled={loading} 
                    className="btn-primary" 
                    style={{ background: '#166534', flex: 1, padding: '10px' }}
                  >
                    ✓ Approve & Forward to HOD
                  </button>
                  <button 
                    onClick={() => {
                      if (!cwRemarks.trim()) return toast.warning('Please enter rejection remarks first.');
                      handleCourseworkAction('REJECT_FACULTY', cwRemarks);
                    }} 
                    disabled={loading} 
                    className="btn-outline" 
                    style={{ borderColor: '#DC2626', color: '#DC2626', flex: 1, padding: '10px' }}
                  >
                    ✗ Send Back for Correction
                  </button>
                </div>
              </div>
            )}

            {/* Approval / Rejection box for HOD */}
            {!isReadOnly && subRole === 'HOD' && thesis.courseworkStatus === 'PENDING_HOD' && (
              <div className="usm-card" style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: 20 }}>
                <h4 style={{ margin: '0 0 10px', color: '#1E40AF', fontSize: '0.9rem', fontWeight: 800 }}>🏛️ HOD Coursework Final Clearance</h4>
                <p style={{ fontSize: '0.8rem', color: '#1E40AF', marginBottom: 12 }}>
                  Supervisor has verified and approved the coursework marks. Clear this candidate's coursework phase to transition them to Synopsis status.
                </p>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#1E40AF', marginBottom: 4 }}>Rejection Remarks (Required only if rejecting)</label>
                  <textarea
                    className="form-input"
                    rows="2"
                    placeholder="Enter reason for sending back..."
                    value={cwRemarks}
                    onChange={e => setCwRemarks(e.target.value)}
                    style={{ background: '#FFFFFF', borderColor: '#BFDBFE', width: '100%' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button 
                    onClick={() => handleCourseworkAction('APPROVE_HOD')} 
                    disabled={loading} 
                    className="btn-primary" 
                    style={{ background: '#1E40AF', flex: 1, padding: '10px' }}
                  >
                    ✓ Verify & Complete Coursework Phase
                  </button>
                  <button 
                    onClick={() => {
                      if (!cwRemarks.trim()) return toast.warning('Please enter rejection remarks first.');
                      handleCourseworkAction('REJECT_HOD', cwRemarks);
                    }} 
                    disabled={loading} 
                    className="btn-outline" 
                    style={{ borderColor: '#DC2626', color: '#DC2626', flex: 1, padding: '10px' }}
                  >
                    ✗ Send Back for Correction
                  </button>
                </div>
              </div>
            )}

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
              
              if (cwLogs.length === 0) return null;
              
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
          </>
        )}
      </div>
    );
  };

  const preM = milestones && milestones.find(m => m.type === 'PRE_SUBMISSION');
  const isPreApproved = preM && preM.status === 'APPROVED';

  // ── Tab definitions ──
  const tabs = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'profile', label: 'Profile', icon: '👤' },
    { key: 'coursework', label: 'Coursework', icon: '📚', show: thesis.status === 'COURSEWORK' || thesis.courseworkCompleted || (thesis.courseworkDetails && ((thesis.courseworkDetails.researchEthics && thesis.courseworkDetails.researchEthics.length > 0) || (thesis.courseworkDetails.researchMethodology && thesis.courseworkDetails.researchMethodology.length > 0) || (thesis.courseworkDetails.elective && thesis.courseworkDetails.elective.length > 0) || (thesis.courseworkDetails.others && thesis.courseworkDetails.others.length > 0))) },
    { key: 'synopsis', label: 'Synopsis', icon: '📝', show: ['SYNOPSIS_PENDING', 'ACTIVE_RESEARCH', 'PRE_SUBMISSION', 'SUBMITTED', 'AWARDED'].includes(thesis.status) || milestones.some(m => m.type === 'SYNOPSIS') },
    { key: 'drc', label: 'DRC', icon: '🏛️', show: ['SYNOPSIS_PENDING', 'ACTIVE_RESEARCH', 'PRE_SUBMISSION', 'SUBMITTED', 'AWARDED'].includes(thesis.status) },
    { key: 'rac', label: 'RAC', icon: '📋', badge: scheduledRacs || null, show: ['ACTIVE_RESEARCH', 'PRE_SUBMISSION', 'SUBMITTED', 'AWARDED'].includes(thesis.status) },
    { key: 'reports', label: 'Reports', icon: '📑', badge: pendingReportsCount || null, show: ['ACTIVE_RESEARCH', 'PRE_SUBMISSION', 'SUBMITTED', 'AWARDED'].includes(thesis.status) },
    { key: 'chapters', label: 'Chapters', icon: '📖', badge: pendingChaptersCount || null, show: ['ACTIVE_RESEARCH', 'PRE_SUBMISSION', 'SUBMITTED', 'AWARDED'].includes(thesis.status) },
    { key: 'publications', label: 'Research Outputs', icon: '🏆', badge: pendingOutputsCount || null, show: ['ACTIVE_RESEARCH', 'PRE_SUBMISSION', 'SUBMITTED', 'AWARDED'].includes(thesis.status) },
    { key: 'preSubmission', label: 'Pre-Submission', icon: '🚀', badge: preSubmissionBadge || null, show: ['ACTIVE_RESEARCH', 'PRE_SUBMISSION', 'SUBMITTED', 'AWARDED'].includes(thesis.status) || milestones.some(m => m.type === 'PRE_SUBMISSION') },
    { key: 'finalSubmission', label: 'Final Submission and Defense', icon: '📁', show: (thesis.preSubmissionSeminar?.status === 'CLEARED') || ['THESIS_SUBMITTED', 'PENDING_SUPERVISOR', 'PENDING_HOD', 'SUBMITTED', 'AWARDED'].includes(thesis.status) },
    { key: 'awardDegree', label: 'Award Degree', icon: '🎓', show: ['SUBMITTED', 'AWARDED'].includes(thesis.status) },
    { key: 'documents', label: 'Documents', icon: '📄', badge: pendingDocCount || null },
    { key: 'changes', label: 'Changes', icon: '🔄' },
    { key: 'audit', label: 'Audit Log', icon: '📜' },
  ].filter(t => t.show !== false);

  const handleSynopsisHodApprove = async (milestoneId) => {
    if (!synDrcDate || !synDrcTime || !synDrcVenue) {
      return toast.warning('Please fill out Date, Time, and Venue for the synopsis DRC meeting.');
    }
    setLoading(true);
    try {
      // 1. Schedule DRC
      const drcPayload = {
        thesisId: thesis._id,
        scheduledDate: synDrcDate,
        scheduledTime: synDrcTime,
        venue: synDrcVenue,
        committeeMembers: synDrcCommittee,
        agenda: synDrcAgenda,
        isSynopsisApproval: true
      };
      await axios.post(`${API}/lifecycle/drc/schedule`, drcPayload, getAuthHeader());

      // 2. Review/approve milestone
      await onReview(milestoneId, 'APPROVE', remarks[milestoneId]);
      
      toast.success('Synopsis approved and DRC scheduled successfully.');
      if (onRefresh) await onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve synopsis and schedule DRC');
    } finally {
      setLoading(false);
    }
  };

  const handleSynopsisDrcOutcome = async (drcId) => {
    if (!synDrcOutcomeRemarks.trim()) {
      return toast.warning('Please enter evaluation remarks for the DRC outcome.');
    }
    setLoading(true);
    try {
      await axios.put(`${API}/lifecycle/drc/${drcId}/result`, {
        status: synDrcOutcomeStatus,
        remarks: synDrcOutcomeRemarks
      }, getAuthHeader());

      toast.success('DRC outcome recorded successfully.');
      setSynDrcOutcomeRemarks('');
      if (onRefresh) await onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record DRC outcome');
    } finally {
      setLoading(false);
    }
  };

  const renderSynopsis = () => {
    const synopsisMilestone = milestones.find(m => m.type === 'SYNOPSIS');
    if (!synopsisMilestone) {
      return (
        <div className="usm-card" style={{ textAlign: 'center', color: '#64748B', fontSize: '0.85rem', padding: '30px 20px' }}>
          ⏳ Synopsis milestone has not been generated for this candidate.
        </div>
      );
    }

    const hasUploaded = !!synopsisMilestone.documentUrl && !(subRole === 'HOD' && synopsisMilestone.status === 'SUBMITTED');
    const isSubmitted = synopsisMilestone.status === 'SUBMITTED';
    const isPendingHOD = synopsisMilestone.status === 'PENDING_HOD';
    const isRevision = synopsisMilestone.status === 'REVISION_REQUIRED';
    const isApproved = synopsisMilestone.status === 'APPROVED';

    const statusBadge = () => {
      let bg = '#F3F4F6';
      let color = '#4B5563';
      let text = 'Pending Upload';

      if (isSubmitted) {
        if (subRole === 'HOD') {
          bg = '#F3F4F6';
          color = '#4B5563';
          text = 'Pending Upload';
        } else {
          bg = '#DBEAFE';
          color = '#1D4ED8';
          text = 'Awaiting Supervisor Approval';
        }
      } else if (isPendingHOD) {
        bg = '#FFFBEB';
        color = '#D97706';
        text = 'Pending HOD Approval & DRC Pending';
      } else if (isRevision) {
        bg = '#FEE2E2';
        color = '#991B1B';
        text = 'Revision Required';
      } else if (isApproved) {
        if (thesis.status === 'SYNOPSIS_PENDING') {
          bg = '#FFFBEB';
          color = '#D97706';
          text = 'Synopsis Approved (DRC Pending at HOD)';
        } else {
          bg = '#D1FAE5';
          color = '#065F46';
          text = 'Approved & Verified';
        }
      }

      return (
        <span style={{ padding: '4px 12px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 700, background: bg, color: color }}>
          {text}
        </span>
      );
    };

    const canReview = !isReadOnly && (
      (isSubmitted && subRole !== 'HOD' && isSupervisor) ||
      (isPendingHOD && subRole === 'HOD')
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #E2E8F0', paddingBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1E293B' }}>📝 Thesis Synopsis Submission</h3>
          {statusBadge()}
        </div>

        {thesis.synopsisProvisionallyCleared && synopsisMilestone.status !== 'APPROVED' && (
          <div style={{ background: '#FFFBEB', borderLeft: '4px solid #D97706', color: '#B45309', padding: '12px 16px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600 }}>
            ⚠️ This candidate's synopsis requirement has been provisionally cleared to unlock Active Research. The candidate must submit the finalized synopsis online for official DRC approval before beginning the pre-submission colloquium phase.
          </div>
        )}

        {/* Scholar Research Details */}
        <div className="usm-card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1E3A8A', marginBottom: 12 }}>Research Outline</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.85rem' }}>
            <div>
              <strong>Thesis Title:</strong>
              <div style={{ background: '#F8FAFC', padding: 10, borderRadius: 8, marginTop: 4, fontWeight: 600, color: '#334155', border: '1px solid #E2E8F0' }}>
                {thesis.title || 'N/A'}
              </div>
            </div>
            <div>
              <strong>Abstract:</strong>
              <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, marginTop: 4, color: '#475569', lineHeight: '1.5', border: '1px solid #E2E8F0', whiteSpace: 'pre-line' }}>
                {thesis.abstract || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Synopsis Document Link */}
        {hasUploaded ? (
          <div className="usm-card" style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
            <div>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#166534' }}>📄 Synopsis Document File</span>
              {synopsisMilestone.submittedAt && (
                <div style={{ fontSize: '0.72rem', color: '#15803D', marginTop: 2 }}>
                  Submitted on: {new Date(synopsisMilestone.submittedAt).toLocaleString()}
                </div>
              )}
            </div>
            <a 
              href={`${API_BASE_URL}${synopsisMilestone.documentUrl}`} 
              target="_blank" 
              rel="noreferrer" 
              className="btn-primary"
              style={{ fontSize: '0.8rem', padding: '8px 16px', background: '#166534', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              📥 Download / View Synopsis
            </a>
          </div>
        ) : (
          <div className="usm-card" style={{ textAlign: 'center', color: '#64748B', fontSize: '0.85rem', padding: '20px' }}>
            ⏳ The candidate has not uploaded the synopsis document yet.
          </div>
        )}

        {/* Evaluation/Action Box (Only for HOD/Supervisor when submitted/pending HOD) */}
        {canReview && (
          <div className="usm-card" style={{ background: '#FFFDF5', border: '1px solid #FDE68A', padding: 20 }}>
            <h4 style={{ margin: '0 0 10px', color: '#92400E', fontSize: '0.9rem', fontWeight: 800 }}>📋 Synopsis Evaluation Action</h4>
            <p style={{ fontSize: '0.8rem', color: '#92400E', marginBottom: 12 }}>
              {isPendingHOD 
                ? "Supervisor has verified and provisionally approved the synopsis. Give final clearance to unlock DRC scheduling." 
                : "Review the synopsis document and title details. You can approve the submission or request a revision with feedback."}
            </p>
            <textarea
              className="form-input"
              rows="3"
              placeholder="Enter evaluation remarks or changes required..."
              value={remarks[synopsisMilestone._id] || ''}
              onChange={e => setRemarks(r => ({ ...r, [synopsisMilestone._id]: e.target.value }))}
              style={{ marginBottom: 12, width: '100%', borderColor: '#FCD34D', background: '#FFFFFF' }}
            />
            {subRole === 'HOD' && isPendingHOD && (
              <div style={{ marginTop: '14px', borderTop: '1px solid #FCD34D', paddingTop: '14px', marginBottom: '14px' }}>
                <h5 style={{ margin: '0 0 8px', color: '#B45309', fontSize: '0.85rem', fontWeight: 800 }}>📅 Schedule Synopsis DRC Evaluation Meeting</h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '10px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#92400E', marginBottom: 4 }}>Meeting Date *</label>
                    <input type="date" className="form-input" style={{ fontSize: '0.8rem', padding: '6px', background: '#FFFFFF', borderColor: '#FCD34D' }} value={synDrcDate} onChange={e => setSynDrcDate(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#92400E', marginBottom: 4 }}>Meeting Time *</label>
                    <input type="time" className="form-input" style={{ fontSize: '0.8rem', padding: '6px', background: '#FFFFFF', borderColor: '#FCD34D' }} value={synDrcTime} onChange={e => setSynDrcTime(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#92400E', marginBottom: 4 }}>Venue *</label>
                    <input type="text" className="form-input" style={{ fontSize: '0.8rem', padding: '6px', background: '#FFFFFF', borderColor: '#FCD34D' }} value={synDrcVenue} onChange={e => setSynDrcVenue(e.target.value)} placeholder="e.g. Dept Committee Room, Block A" />
                  </div>
                  <div className="form-group" style={{ gridColumn: 'span 2', marginBottom: 0 }}>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#92400E', marginBottom: 4 }}>Committee Members</label>
                    <input type="text" className="form-input" style={{ fontSize: '0.8rem', padding: '6px', background: '#FFFFFF', borderColor: '#FCD34D' }} value={synDrcCommittee} onChange={e => setSynDrcCommittee(e.target.value)} placeholder="e.g. Prof. R.K. Sharma, Dr. S. Verma" />
                  </div>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <button 
                className="btn-primary" 
                onClick={() => {
                  if (subRole === 'HOD') {
                    handleSynopsisHodApprove(synopsisMilestone._id);
                  } else {
                    act(() => onReview(synopsisMilestone._id, 'APPROVE', remarks[synopsisMilestone._id]));
                  }
                }} 
                disabled={loading} 
                style={{ flex: 1, padding: '10px', background: '#059669' }}
              >
                {subRole === 'HOD' ? '✓ Approve Synopsis & Schedule DRC' : '✓ Approve & Forward to HOD'}
              </button>
              <button 
                className="btn-outline" 
                onClick={() => {
                  if (!(remarks[synopsisMilestone._id] || '').trim()) {
                    return toast.warning('Remarks are required to request revision.');
                  }
                  act(() => onReview(synopsisMilestone._id, 'REVISION', remarks[synopsisMilestone._id]));
                }}
                disabled={loading} 
                style={{ flex: 1, padding: '10px', borderColor: '#DC2626', color: '#DC2626' }}
              >
                ✗ Request Revision
              </button>
            </div>
          </div>
        )}

        {/* Read-Only provisional approval notice for supervisor */}
        {!canReview && isPendingHOD && (
          <div style={{ background: '#FFF9E6', borderLeft: '4px solid #F59E0B', color: '#B45309', padding: '12px 16px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600 }}>
            ⏳ Synopsis has been provisionally approved by supervisor. Awaiting HOD final approval and DRC scheduling.
          </div>
        )}

        {isApproved && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {thesis.status === 'SYNOPSIS_PENDING' ? (
              <div style={{ background: '#ECFDF5', borderLeft: '4px solid #10B981', color: '#065F46', padding: '12px 16px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600 }}>
                ✅ Synopsis approved by HOD! DRC meeting evaluation is now pending.
              </div>
            ) : (
              <div style={{ background: '#ECFDF5', borderLeft: '4px solid #059669', color: '#047857', padding: '12px 16px', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600 }}>
                ✅ Synopsis officially approved by HOD and cleared by Departmental Research Committee (DRC)!
              </div>
            )}
            
            {(() => {
              const synDrcs = drcMeetings.filter(d => d.isSynopsisApproval);
              if (synDrcs.length > 0) {
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {synDrcs.map(drc => (
                      <div key={drc._id} className="usm-card" style={{ border: '1px solid #CBD5E1', padding: 20, background: '#F8FAFC' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1E293B', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>🏛️</span> Synopsis DRC Evaluation
                          </span>
                          <span style={{ 
                            padding: '3px 10px', 
                            borderRadius: 12, 
                            fontSize: '0.72rem', 
                            fontWeight: 700, 
                            background: drc.status === 'APPROVED' ? '#D1FAE5' : drc.status === 'REVISION_REQUIRED' ? '#FEE2E2' : '#FEF3C7', 
                            color: drc.status === 'APPROVED' ? '#065F46' : drc.status === 'REVISION_REQUIRED' ? '#991B1B' : '#92400E' 
                          }}>
                            {drc.status === 'APPROVED' ? 'Satisfactory' : drc.status === 'REVISION_REQUIRED' ? 'Unsatisfactory' : 'Scheduled'}
                          </span>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: '0.85rem', color: '#334155', background: '#FFFFFF', padding: 16, borderRadius: 8, border: '1px solid #E2E8F0', marginBottom: drc.status === 'SCHEDULED' && subRole === 'HOD' ? 16 : 0 }}>
                          <div><strong>Date:</strong> {new Date(drc.scheduledDate).toLocaleDateString()}</div>
                          <div><strong>Time:</strong> {drc.scheduledTime}</div>
                          <div style={{ gridColumn: 'span 2' }}><strong>Venue:</strong> {drc.venue}</div>
                          {drc.committeeMembers && <div style={{ gridColumn: 'span 2' }}><strong>Committee:</strong> {drc.committeeMembers}</div>}
                          {drc.remarks && (
                            <div style={{ gridColumn: 'span 2', background: drc.status === 'APPROVED' ? '#F0FDF4' : '#FEF2F2', padding: 8, borderRadius: 6, color: drc.status === 'APPROVED' ? '#15803D' : '#991B1B', borderLeft: `3px solid ${drc.status === 'APPROVED' ? '#16A34A' : '#EF4444'}`, marginTop: 4 }}>
                              <strong>Outcome Remarks:</strong> {drc.remarks}
                            </div>
                          )}
                        </div>

                        {drc.status === 'SCHEDULED' && subRole === 'HOD' && (
                          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: 16, borderRadius: 8 }}>
                            <h5 style={{ margin: '0 0 10px', color: '#92400E', fontSize: '0.85rem', fontWeight: 800 }}>📋 Record DRC Outcome</h5>
                            <div className="form-group">
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#92400E', marginBottom: 6 }}>Evaluation Status *</label>
                              <select className="form-input" style={{ width: '100%', padding: '6px', background: '#FFFFFF', borderColor: '#FCD34D' }} value={synDrcOutcomeStatus} onChange={e => setSynDrcOutcomeStatus(e.target.value)}>
                                <option value="APPROVED">Satisfactory (Move candidate to Active Research)</option>
                                <option value="REVISION_REQUIRED">Unsatisfactory (Revert candidate to Synopsis revision)</option>
                              </select>
                            </div>
                            <div className="form-group" style={{ marginTop: 10 }}>
                              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#92400E', marginBottom: 6 }}>Committee Remarks / Feedback *</label>
                              <textarea className="form-input" rows="3" style={{ width: '100%', borderColor: '#FCD34D', background: '#FFFFFF' }} value={synDrcOutcomeRemarks} onChange={e => setSynDrcOutcomeRemarks(e.target.value)} placeholder="Provide final remarks from the DRC panel..." />
                            </div>
                            <button className="btn-primary" style={{ marginTop: 8, padding: '8px 16px', background: '#D97706' }} onClick={() => handleSynopsisDrcOutcome(drc._id)} disabled={loading}>
                              {loading ? 'Recording...' : 'Submit DRC Outcome'}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              }
              return (
                <div className="usm-card" style={{ padding: 16, background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#64748B', fontSize: '0.82rem', fontStyle: 'italic', textAlign: 'center' }}>
                  ⏳ DRC meeting has not been scheduled yet.
                </div>
              );
            })()}
          </div>
        )}

        {renderHistoryTable(getMilestoneHistory(synopsisMilestone, thesis))}
        {subRole === 'HOD' && thesis.status === 'SYNOPSIS_PENDING' && !thesis.synopsisProvisionallyCleared && (
          <div className="usm-card" style={{ background: 'rgba(234, 88, 12, 0.05)', border: '1px solid rgba(234, 88, 12, 0.2)', padding: 20, borderRadius: 12 }}>
            <h4 style={{ margin: '0 0 8px 0', color: '#C2410C', fontSize: '0.9rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>⚠️</span> Provisional Synopsis Fast-Track Clearance
            </h4>
            <p style={{ fontSize: '0.8rem', color: '#7C2D12', marginBottom: 16, lineHeight: '1.4' }}>
              Bypass the strict synopsis defense phase. This transitions the scholar directly to **Active Research** to begin periodic progress reporting. The candidate remains obligated to upload and clear their final synopsis before launching pre-submission colloquiums.
            </p>
            <button 
              className="btn-primary" 
              onClick={() => { setShowProvisionalClearModal(true); setProvisionalConfirmText(''); }}
              disabled={loading}
              style={{ width: '100%', padding: '12px', background: '#D97706', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <span>⚡</span> Provisionally Clear Synopsis & Start Active Research
            </button>
          </div>
        )}
      </div>
    );
  };

  const handleHODScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!semDate || !semTime || !semVenue) {
      return toast.warning('Please fill in Date, Time, and Venue.');
    }
    setLoading(true);
    try {
      await schedulePreSubmissionSeminar(thesis._id, {
        scheduledDate: semDate,
        scheduledTime: semTime,
        venue: semVenue,
        committeeMembers: semCommittee,
        remarks: semRemarks
      });
      toast.success('Pre-Submission Seminar scheduled successfully!');
      if (onRefresh) await onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to schedule seminar.');
    } finally {
      setLoading(false);
    }
  };

  const handleHODOutcomeSubmit = async (e) => {
    e.preventDefault();
    if (semOutcomeStatus === 'UNCLEARED' && !semOutcomeRemarks.trim()) {
      return toast.warning('Remarks are required for Uncleared outcome.');
    }
    setLoading(true);
    try {
      await recordPreSubmissionSeminarOutcome(thesis._id, {
        status: semOutcomeStatus,
        remarks: semOutcomeRemarks
      });
      toast.success('Pre-Submission Seminar outcome recorded successfully!');
      if (onRefresh) await onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record outcome.');
    } finally {
      setLoading(false);
    }
  };

  const renderPreSubmission = () => {
    const sem = thesis.preSubmissionSeminar || {};
    const semStatus = sem.status || 'NOT_SCHEDULED';
    const preMilestone = milestones.find(m => m.type === 'PRE_SUBMISSION');

    const statusBadge = (status) => {
      const colors = {
        NOT_SCHEDULED: { bg: '#F3F4F6', color: '#4B5563', text: 'Not Scheduled' },
        NOT_REQUESTED: { bg: '#F3F4F6', color: '#4B5563', text: 'Not Scheduled' },
        SCHEDULED: { bg: '#FFFBEB', color: '#B45309', text: 'Scheduled' },
        CLEARED: { bg: '#D1FAE5', color: '#065F46', text: 'Seminar Cleared' },
        UNCLEARED: { bg: '#FEE2E2', color: '#991B1B', text: 'Uncleared' }
      };
      const sc = colors[status] || colors.NOT_SCHEDULED;
      return (
        <span style={{ padding: '4px 12px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 700, background: sc.bg, color: sc.color }}>
          {sc.text}
        </span>
      );
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #E2E8F0', paddingBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1E293B' }}>🎓 Pre-Submission Phase</h3>
          {statusBadge(semStatus)}
        </div>

        {thesis.activeResearchBypassed && (
          <div className="usm-card" style={{ background: '#FFF7ED', borderLeft: '4px solid #EA580C', padding: '16px 20px', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#C2410C', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>⚡</span> Active Research Prerequisites Bypassed by HOD
            </h4>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#9A3412', lineHeight: '1.4' }}>
              This candidate was advanced by <strong>{thesis.activeResearchBypassMetadata?.bypassedBy || 'HOD'}</strong> ({thesis.activeResearchBypassMetadata?.designation || 'Head of Department'}) on <strong>{new Date(thesis.activeResearchBypassMetadata?.timestamp).toLocaleString()}</strong>.
            </p>
            <div style={{ marginTop: 8, padding: 12, background: 'rgba(255, 255, 255, 0.6)', borderRadius: 8, fontSize: '0.8rem', color: '#7C2D12' }}>
              <strong>Justification / HOD Decision remarks:</strong>
              <p style={{ margin: '4px 0 0 0', fontStyle: 'italic' }}>"{thesis.activeResearchBypassMetadata?.justification || 'No remarks provided'}"</p>
            </div>
            <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', borderTop: '1px dashed #FED7AA', paddingTop: 8, fontSize: '0.78rem', color: '#7C2D12' }}>
              <div>⏳ <strong>Research time elapsed at bypass:</strong> {thesis.activeResearchBypassMetadata?.statsBeforeBypass?.researchTimeMonths || 0} months</div>
              <div>📄 <strong>Approved progress reports at bypass:</strong> {thesis.activeResearchBypassMetadata?.statsBeforeBypass?.approvedReportsCount || 0} approved</div>
              <div>🏆 <strong>Verified journals at bypass:</strong> {thesis.activeResearchBypassMetadata?.statsBeforeBypass?.journalsCount || 0} / 2</div>
              <div>🏟️ <strong>Verified conferences at bypass:</strong> {thesis.activeResearchBypassMetadata?.statsBeforeBypass?.conferencesCount || 0} / 2</div>
            </div>
          </div>
        )}

        {/* 1. DRAFT SUBMISSION & REVIEW PIPELINE (Must happen first) */}
        <div className="usm-card" style={{ padding: 16 }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>
            📂 Thesis Draft and Plagiarism Report Review
          </h4>

          {!preMilestone ? (
            <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>
              Awaiting student to complete active research prerequisites and upload the Pre-Submission draft package.
            </p>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>
                  Milestone Status: <strong style={{ textTransform: 'uppercase', color: preMilestone.status === 'APPROVED' ? '#059669' : preMilestone.status === 'REVISION_REQUIRED' ? '#DC2626' : '#2563EB' }}>{preMilestone.status}</strong>
                </span>
              </div>

              {/* Uploaded files display */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, fontSize: '0.82rem' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                    <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Document</th>
                    <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Download</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1E293B' }}>📄 Rough Thesis Draft</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      {preMilestone.documentUrl ? (
                        <a href={`${API_BASE_URL}${preMilestone.documentUrl}`} target="_blank" rel="noreferrer" style={{ color: '#3B82F6', fontWeight: 600 }}>Download</a>
                      ) : (
                        <span style={{ color: '#94A3B8' }}>Not Uploaded</span>
                      )}
                    </td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1E293B' }}>🔍 Turnitin Plagiarism Report</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      {preMilestone.plagiarismReportUrl ? (
                        <a href={`${API_BASE_URL}${preMilestone.plagiarismReportUrl}`} target="_blank" rel="noreferrer" style={{ color: '#3B82F6', fontWeight: 600 }}>Download</a>
                      ) : (
                        <span style={{ color: '#94A3B8' }}>Not Uploaded</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>

              {renderHistoryTable(getMilestoneHistory(preMilestone, thesis))}

              {/* Review actions */}
              {!isReadOnly && (
                <div>
                  {/* Faculty approval check: status is SUBMITTED and reviewer is Faculty */}
                  {preMilestone.status === 'SUBMITTED' && subRole !== 'HOD' && isSupervisor && (
                    <div>
                      <textarea className="form-input" placeholder="Add evaluation remarks..." rows="2" value={remarks[preMilestone._id] || ''} onChange={e => setRemarks(r => ({ ...r, [preMilestone._id]: e.target.value }))} style={{ marginBottom: 10, resize: 'vertical' }} />
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btn-primary" onClick={() => act(() => onReview(preMilestone._id, 'APPROVE', remarks[preMilestone._id]))} disabled={loading} style={{ flex: 1, padding: '8px', fontSize: '0.82rem', background: '#059669' }}>
                          <CheckCircle2 size={14} style={{ marginRight: 4 }} /> Approve Draft (Forward to HOD)
                        </button>
                        <button className="btn-outline" onClick={() => {
                          if (!(remarks[preMilestone._id] || '').trim()) {
                            return toast.warning('Remarks are required to request revision.');
                          }
                          act(() => onReview(preMilestone._id, 'REVISION', remarks[preMilestone._id]));
                        }} disabled={loading} style={{ flex: 1, padding: '8px', fontSize: '0.82rem', borderColor: '#EF4444', color: '#EF4444' }}>
                          <XCircle size={14} style={{ marginRight: 4 }} /> Request Revision
                        </button>
                      </div>
                    </div>
                  )}

                  {/* HOD final approval check: status is PENDING_HOD and reviewer is HOD */}
                  {preMilestone.status === 'PENDING_HOD' && subRole === 'HOD' && (
                    <div>
                      <textarea className="form-input" placeholder="Add final HOD evaluation remarks..." rows="2" value={remarks[preMilestone._id] || ''} onChange={e => setRemarks(r => ({ ...r, [preMilestone._id]: e.target.value }))} style={{ marginBottom: 10, resize: 'vertical' }} />
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btn-primary" onClick={() => act(() => onReview(preMilestone._id, 'APPROVE', remarks[preMilestone._id]))} disabled={loading} style={{ flex: 1, padding: '8px', fontSize: '0.82rem', background: '#059669' }}>
                          <CheckCircle2 size={14} style={{ marginRight: 4 }} /> Grant Final HOD Approval
                        </button>
                        <button className="btn-outline" onClick={() => {
                          if (!(remarks[preMilestone._id] || '').trim()) {
                            return toast.warning('Remarks are required to request revision.');
                          }
                          act(() => onReview(preMilestone._id, 'REVISION', remarks[preMilestone._id]));
                        }} disabled={loading} style={{ flex: 1, padding: '8px', fontSize: '0.82rem', borderColor: '#EF4444', color: '#EF4444' }}>
                          <XCircle size={14} style={{ marginRight: 4 }} /> Request Revision
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Status notifications (for users who can't review right now) */}
                  {preMilestone.status === 'SUBMITTED' && subRole === 'HOD' && (
                    <div style={{ padding: 10, background: '#EFF6FF', borderRadius: 8, color: '#1E40AF', fontSize: '0.82rem', textAlign: 'center' }}>
                      ⏳ Awaiting Faculty Supervisor review and approval before final HOD review.
                    </div>
                  )}
                  {preMilestone.status === 'PENDING_HOD' && subRole !== 'HOD' && (
                    <div style={{ padding: 10, background: '#EFF6FF', borderRadius: 8, color: '#1E40AF', fontSize: '0.82rem', textAlign: 'center' }}>
                      ⏳ Approved by Supervisor. Awaiting final HOD sign-off.
                    </div>
                  )}
                  {preMilestone.status === 'REVISION_REQUIRED' && (
                    <div style={{ padding: 10, background: '#FEF2F2', borderRadius: 8, color: '#991B1B', fontSize: '0.82rem', textAlign: 'center' }}>
                      ℹ️ Revisions requested. Awaiting scholar to re-submit draft package.
                    </div>
                  )}
                  {preMilestone.status === 'APPROVED' && (
                    <div style={{ padding: 10, background: '#ECFDF5', borderRadius: 8, color: '#047857', fontSize: '0.82rem', textAlign: 'center', fontWeight: 600 }}>
                      ✅ Pre-Submission Thesis Draft Package approved and signed off.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. SEMINAR DETAILS / SCHEDULING FLOW (Only visible/active if draft is APPROVED) */}
        <div className="usm-card" style={{ padding: 16 }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 700, color: '#334155' }}>
            📅 Pre-Submission Seminar Status & Schedule
          </h4>

          {preMilestone?.status !== 'APPROVED' ? (
            <div style={{ padding: 14, background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: 8, color: '#64748B', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🔒</span> Pre-Submission Seminar Scheduling is locked until the Thesis Draft & Plagiarism Package gets final HOD approval.
            </div>
          ) : (
            <div>
              {/* Seminar status logic */}
              {(semStatus === 'NOT_SCHEDULED' || semStatus === 'NOT_REQUESTED') && (
                <div>
                  {!isReadOnly && subRole === 'HOD' ? (
                    <form onSubmit={handleHODScheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#475569' }}>Schedule Pre-Submission Seminar:</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Date *</label>
                          <input type="date" className="form-input" value={semDate} onChange={e => setSemDate(e.target.value)} required style={{ padding: 8 }} />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Time *</label>
                          <input type="text" className="form-input" placeholder="e.g., 11:30 AM" value={semTime} onChange={e => setSemTime(e.target.value)} required style={{ padding: 8 }} />
                        </div>
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Venue *</label>
                        <input type="text" className="form-input" placeholder="e.g., Seminar Hall, Dept of Computer Science" value={semVenue} onChange={e => setSemVenue(e.target.value)} required style={{ padding: 8 }} />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Committee Members (Optional)</label>
                        <input type="text" className="form-input" placeholder="e.g., Prof. A, Dr. B (External), etc." value={semCommittee} onChange={e => setSemCommittee(e.target.value)} style={{ padding: 8 }} />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Remarks (Optional)</label>
                        <textarea className="form-input" placeholder="Scheduling notes..." value={semRemarks} onChange={e => setSemRemarks(e.target.value)} style={{ minHeight: 60, padding: 8 }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" className="btn-primary" disabled={loading} style={{ background: '#EA580C', padding: '8px 16px' }}>
                          {loading ? 'Submitting...' : 'Schedule Pre-Submission Seminar'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>
                      Draft Approved! Awaiting Head of Department (HOD) to schedule the Pre-Submission Seminar.
                    </p>
                  )}
                </div>
              )}

              {semStatus === 'SCHEDULED' && (
                <div>
                  <div style={{ background: '#EFF6FF', borderRadius: 8, padding: 14, border: '1px solid #BFDBFE', fontSize: '0.85rem', marginBottom: 16 }}>
                    <strong>📅 Scheduled Seminar Details:</strong>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
                      <div><strong>Date:</strong> {sem.scheduledDate ? new Date(sem.scheduledDate).toLocaleDateString() : 'N/A'}</div>
                      <div><strong>Time:</strong> {sem.scheduledTime}</div>
                      <div style={{ gridColumn: 'span 2' }}><strong>Venue:</strong> {sem.venue}</div>
                      <div style={{ gridColumn: 'span 2' }}><strong>Committee:</strong> {sem.committeeMembers || 'N/A'}</div>
                      {sem.remarks && <div style={{ gridColumn: 'span 2' }}><strong>HOD Remarks:</strong> "{sem.remarks}"</div>}
                    </div>
                  </div>

                  {!isReadOnly && subRole === 'HOD' ? (
                    <form onSubmit={handleHODOutcomeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#475569' }}>Record Seminar Outcome:</div>
                      <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer' }}>
                          <input type="radio" name="outcome" value="CLEARED" checked={semOutcomeStatus === 'CLEARED'} onChange={() => setSemOutcomeStatus('CLEARED')} />
                          Cleared (Satisfactory)
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', cursor: 'pointer' }}>
                          <input type="radio" name="outcome" value="UNCLEARED" checked={semOutcomeStatus === 'UNCLEARED'} onChange={() => setSemOutcomeStatus('UNCLEARED')} />
                          Uncleared (Unsatisfactory)
                        </label>
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Remarks / Feedback (Required if Uncleared) *</label>
                        <textarea className="form-input" placeholder="Outcome remarks..." value={semOutcomeRemarks} onChange={e => setSemOutcomeRemarks(e.target.value)} required={semOutcomeStatus === 'UNCLEARED'} style={{ minHeight: 60, padding: 8 }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" className="btn-primary" disabled={loading} style={{ background: '#EA580C', padding: '8px 16px' }}>
                          {loading ? 'Recording...' : 'Record Outcome'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>
                      Awaiting conduct of the Seminar and outcome recording by HOD.
                    </p>
                  )}
                </div>
              )}

              {semStatus === 'CLEARED' && (
                <div style={{ background: '#E8F5E9', borderRadius: 8, padding: 14, border: '1px solid #A5D6A7', fontSize: '0.85rem' }}>
                  <strong style={{ color: '#2E7D32' }}>✅ Seminar Outcome: CLEARED (Satisfactory)</strong>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
                    <div><strong>Conducted On:</strong> {sem.scheduledDate ? new Date(sem.scheduledDate).toLocaleDateString() : 'N/A'}</div>
                    <div><strong>Recorded On:</strong> {sem.outcomeRecordedAt ? new Date(sem.outcomeRecordedAt).toLocaleDateString() : 'N/A'}</div>
                    {sem.outcomeRemarks && <div style={{ gridColumn: 'span 2' }}><strong>Outcome Remarks:</strong> "{sem.outcomeRemarks}"</div>}
                  </div>
                </div>
              )}

              {semStatus === 'UNCLEARED' && (
                <div>
                  <div style={{ padding: 12, background: '#FEE2E2', borderRadius: 8, color: '#991B1B', fontSize: '0.85rem', marginBottom: 16 }}>
                    <strong>⚠️ Seminar Outcome: UNCLEARED (Unsatisfactory)</strong>
                    <div style={{ marginTop: 4 }}>Remarks: "{sem.outcomeRemarks || 'None'}"</div>
                  </div>

                  {!isReadOnly && subRole === 'HOD' ? (
                    <form onSubmit={handleHODScheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#991B1B' }}>Reschedule Pre-Submission Seminar:</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Date *</label>
                          <input type="date" className="form-input" value={semDate} onChange={e => setSemDate(e.target.value)} required style={{ padding: 8 }} />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: '0.75rem' }}>Time *</label>
                          <input type="text" className="form-input" placeholder="e.g., 11:30 AM" value={semTime} onChange={e => setSemTime(e.target.value)} required style={{ padding: 8 }} />
                        </div>
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Venue *</label>
                        <input type="text" className="form-input" placeholder="e.g., Seminar Hall" value={semVenue} onChange={e => setSemVenue(e.target.value)} required style={{ padding: 8 }} />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Committee Members (Optional)</label>
                        <input type="text" className="form-input" placeholder="Committee members..." value={semCommittee} onChange={e => setSemCommittee(e.target.value)} style={{ padding: 8 }} />
                      </div>
                      <div>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Remarks (Optional)</label>
                        <textarea className="form-input" placeholder="Scheduling remarks..." value={semRemarks} onChange={e => setSemRemarks(e.target.value)} style={{ minHeight: 60, padding: 8 }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" className="btn-primary" disabled={loading} style={{ background: '#EA580C', padding: '8px 16px' }}>
                          {loading ? 'Submitting...' : 'Reschedule Seminar'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>
                      Awaiting Head of Department (HOD) to reschedule the Pre-Submission Seminar.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Previously Held Seminar History Logs */}
        {thesis.preSubmissionSeminarHistory && thesis.preSubmissionSeminarHistory.length > 0 && (
          <div className="usm-card" style={{ padding: 16, marginTop: 16 }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>📜</span> Pre-Submission Seminar History Logs
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {thesis.preSubmissionSeminarHistory.map((h, idx) => (
                <div key={idx} style={{ background: '#F8FAFC', borderRadius: 10, padding: 14, border: '1px solid #E2E8F0', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ fontWeight: 700, color: '#475569' }}>Colloquium Run #{idx + 1}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: '0.7rem', background: '#FEE2E2', color: '#991B1B' }}>
                      UNCLEARED (Unsatisfactory)
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', color: '#475569', marginBottom: 8 }}>
                    <div><strong>Scheduled Date:</strong> {h.scheduledDate ? new Date(h.scheduledDate).toLocaleDateString() : 'N/A'}</div>
                    <div><strong>Time:</strong> {h.scheduledTime}</div>
                    <div style={{ gridColumn: 'span 2' }}><strong>Venue:</strong> {h.venue}</div>
                    {h.committeeMembers && <div style={{ gridColumn: 'span 2' }}><strong>Panel:</strong> {h.committeeMembers}</div>}
                  </div>
                  <div style={{ background: 'white', padding: 10, borderRadius: 6, borderLeft: '3px solid #EF4444' }}>
                    <div><strong>Outcome Remarks:</strong> "{h.outcomeRemarks || 'None'}"</div>
                    <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: 4 }}>Conducted on {h.outcomeRecordedAt ? new Date(h.outcomeRecordedAt).toLocaleDateString() : 'N/A'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════
  // TAB CONTENT RENDERERS
  // ══════════════════════════════════════════════════════════

  const renderOverview = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <StatusPipeline status={thesis.status} />

      {/* Quick Actions */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ padding: '4px 12px', borderRadius: 12, fontSize: '0.8rem', fontWeight: 600, background: badge.bg, color: badge.color }}>{badge.text}</span>

        {!isReadOnly && subRole !== 'HOD' && thesis.status === 'SUBMITTED' && milestones.find(m => m.type === 'FINAL_SUBMISSION' && (m.status === 'SUBMITTED' || m.status === 'APPROVED')) && (
          <button className="btn-primary" onClick={() => act(onFinalApprove)} disabled={loading} style={{ padding: '5px 14px', fontSize: '0.82rem', background: '#8B5CF6' }}>✓ Final Approval → SUBMITTED</button>
        )}
        {!isReadOnly && subRole === 'HOD' && thesis.status === 'ACTIVE_RESEARCH' && (
          <button className="btn-primary" onClick={() => setShowBypassModal(true)} disabled={loading} style={{ padding: '5px 14px', fontSize: '0.82rem', background: '#EA580C' }}>🚀 Advance to Pre-Submission</button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="usm-stats">
        <div className="usm-stat-card">
          <div className="usm-stat-value" style={{ color: thesis.courseworkCompleted ? '#059669' : '#D97706' }}>{thesis.courseworkCompleted ? '✅' : '⏳'}</div>
          <div className="usm-stat-label">Coursework</div>
        </div>
        <div className="usm-stat-card">
          <div className="usm-stat-value" style={{ color: thesis.enrollmentVerified ? '#059669' : '#D97706' }}>{thesis.enrollmentVerified ? '✅' : '⏳'}</div>
          <div className="usm-stat-label">Enrollment Verified</div>
        </div>
        <div className="usm-stat-card">
          <div className="usm-stat-value" style={{ color: verifiedJournals >= 2 ? '#059669' : '#EF4444' }}>{verifiedJournals}/2</div>
          <div className="usm-stat-label">Journals (Mandatory)</div>
        </div>
        <div className="usm-stat-card">
          <div className="usm-stat-value" style={{ color: verifiedConferences >= 2 ? '#059669' : '#EF4444' }}>{verifiedConferences}/2</div>
          <div className="usm-stat-label">Conferences (Mandatory)</div>
        </div>

        <div className="usm-stat-card">
          <div className="usm-stat-value" style={{ color: '#3B82F6' }}>{racReviews.filter(r => r.status !== 'SCHEDULED').length}/{racReviews.length}</div>
          <div className="usm-stat-label">RAC Completed</div>
        </div>
      </div>

      {/* Pending alerts */}
      {(pendingDocCount > 0 || pendingOutputsCount > 0) && (
        <div style={{ background: '#FFF9E6', borderLeft: '4px solid #F59E0B', padding: '10px 14px', borderRadius: 8, fontSize: '0.82rem', color: '#B45309', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {pendingDocCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>⚠️</span>
              <span>{pendingDocCount} document(s) pending review — click the Documents tab to review.</span>
            </div>
          )}
          {pendingOutputsCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🏆</span>
              <span>{pendingOutputsCount} research output(s) pending review — click the Research Outputs tab to review.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderProfile = () => {
    const scholar = thesis.scholarId || {};
    const profile = scholar.profile || {};
    const qualifications = profile.qualifications || {};
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <div className="usm-section-title" style={{ marginBottom: '10px' }}>📁 Scholar Personal Details</div>
          {isEditing ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', fontSize: '0.82rem' }}>
              <div>
                <strong>Email (Username):</strong>
                <input type="text" value={editForm.username || scholar.username || ''} disabled style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', border: '1px solid #E2E8F0', borderRadius: '6px', background: '#F1F5F9', cursor: 'not-allowed', marginTop: '4px' }} />
              </div>
              <div>
                <strong>Mobile:</strong>
                <input type="text" value={editForm.phoneNumber || ''} onChange={e => setEditForm({...editForm, phoneNumber: e.target.value})} style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', border: '1px solid #CBD5E1', borderRadius: '6px', marginTop: '4px' }} />
              </div>
              <div>
                <strong>DOB:</strong>
                <input type="date" value={editForm.dob ? editForm.dob.split('T')[0] : ''} onChange={e => setEditForm({...editForm, dob: e.target.value})} style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', border: '1px solid #CBD5E1', borderRadius: '6px', marginTop: '4px' }} />
              </div>
              <div>
                <strong>Gender:</strong>
                <select value={editForm.gender || ''} onChange={e => setEditForm({...editForm, gender: e.target.value})} style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', border: '1px solid #CBD5E1', borderRadius: '6px', marginTop: '4px', background: 'white' }}>
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <strong>Category:</strong>
                <input type="text" value={editForm.category || ''} onChange={e => setEditForm({...editForm, category: e.target.value})} style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', border: '1px solid #CBD5E1', borderRadius: '6px', marginTop: '4px' }} />
              </div>
              <div>
                <strong>Nationality:</strong>
                <input type="text" value={editForm.nationality || ''} onChange={e => setEditForm({...editForm, nationality: e.target.value})} style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', border: '1px solid #CBD5E1', borderRadius: '6px', marginTop: '4px' }} />
              </div>
              <div>
                <strong>Father's Name:</strong>
                <input type="text" value={editForm.fatherName || ''} onChange={e => setEditForm({...editForm, fatherName: e.target.value})} style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', border: '1px solid #CBD5E1', borderRadius: '6px', marginTop: '4px' }} />
              </div>
              <div>
                <strong>Mother's Name:</strong>
                <input type="text" value={editForm.motherName || ''} onChange={e => setEditForm({...editForm, motherName: e.target.value})} style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', border: '1px solid #CBD5E1', borderRadius: '6px', marginTop: '4px' }} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <strong>Address:</strong>
                <textarea value={editForm.address || ''} onChange={e => setEditForm({...editForm, address: e.target.value})} style={{ width: '100%', height: '60px', padding: '6px 10px', fontSize: '0.8rem', border: '1px solid #CBD5E1', borderRadius: '6px', marginTop: '4px', resize: 'vertical' }} />
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', fontSize: '0.82rem' }}>
              <div><strong>Email:</strong> <span style={{ color: '#475569' }}>{scholar.username || 'N/A'}</span></div>
              <div><strong>Mobile:</strong> <span style={{ color: '#475569' }}>{profile.phoneNumber || 'N/A'}</span></div>
              <div><strong>DOB:</strong> <span style={{ color: '#475569' }}>{profile.dob ? new Date(profile.dob).toLocaleDateString() : 'N/A'}</span></div>
              <div><strong>Gender:</strong> <span style={{ color: '#475569' }}>{profile.gender || 'N/A'}</span></div>
              <div><strong>Category:</strong> <span style={{ color: '#475569' }}>{profile.category || 'N/A'}</span></div>
              <div><strong>Nationality:</strong> <span style={{ color: '#475569' }}>{profile.nationality || 'N/A'}</span></div>
              <div><strong>Father:</strong> <span style={{ color: '#475569' }}>{profile.fatherName || 'N/A'}</span></div>
              <div><strong>Mother:</strong> <span style={{ color: '#475569' }}>{profile.motherName || 'N/A'}</span></div>
              <div style={{ gridColumn: 'span 2' }}><strong>Address:</strong> <span style={{ color: '#475569' }}>{profile.address || 'N/A'}</span></div>
            </div>
          )}
        </div>
        
        <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
          <div className="usm-section-title" style={{ marginBottom: '10px' }}>📝 Academic & Research Details</div>
          {isEditing ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', fontSize: '0.82rem' }}>
              <div>
                <strong>SH no:</strong>
                <input type="text" value={profile.shNo || ''} disabled style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', border: '1px solid #E2E8F0', borderRadius: '6px', background: '#F1F5F9', cursor: 'not-allowed', marginTop: '4px' }} />
              </div>
              <div>
                <strong>Enrollment No:</strong>
                <input type="text" value={editForm.enrollmentNumber || ''} onChange={e => setEditForm({...editForm, enrollmentNumber: e.target.value})} style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', border: '1px solid #CBD5E1', borderRadius: '6px', marginTop: '4px' }} />
              </div>
              <div>
                <strong>Department:</strong>
                <input type="text" value={thesis.department || ''} disabled style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', border: '1px solid #E2E8F0', borderRadius: '6px', background: '#F1F5F9', cursor: 'not-allowed', marginTop: '4px' }} />
              </div>
              <div>
                <strong>Admission Date:</strong>
                <input type="date" value={editForm.admissionDate ? editForm.admissionDate.split('T')[0] : ''} onChange={e => setEditForm({...editForm, admissionDate: e.target.value})} style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', border: '1px solid #CBD5E1', borderRadius: '6px', marginTop: '4px' }} />
              </div>
              <div>
                <strong>Ph.D. Mode:</strong>
                <select value={editForm.phdMode || ''} onChange={e => setEditForm({...editForm, phdMode: e.target.value})} style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', border: '1px solid #CBD5E1', borderRadius: '6px', marginTop: '4px', background: 'white' }}>
                  <option value="">Select Mode</option>
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                </select>
              </div>
              <div>
                <strong>Specialization:</strong>
                <input type="text" value={editForm.specialization || ''} onChange={e => setEditForm({...editForm, specialization: e.target.value})} style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', border: '1px solid #CBD5E1', borderRadius: '6px', marginTop: '4px' }} />
              </div>
              <div>
                <strong>Academic Session:</strong>
                <input type="text" value={editForm.academicSession || ''} onChange={e => setEditForm({...editForm, academicSession: e.target.value})} style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', border: '1px solid #CBD5E1', borderRadius: '6px', marginTop: '4px' }} />
              </div>
              <div>
                <strong>Degree Type:</strong>
                <input type="text" value={editForm.degreeType || ''} onChange={e => setEditForm({...editForm, degreeType: e.target.value})} style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', border: '1px solid #CBD5E1', borderRadius: '6px', marginTop: '4px' }} />
              </div>
              <div>
                <strong>Degree Name:</strong>
                <input type="text" value={editForm.degreeName || ''} onChange={e => setEditForm({...editForm, degreeName: e.target.value})} style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', border: '1px solid #CBD5E1', borderRadius: '6px', marginTop: '4px' }} />
              </div>
              <div>
                <strong>Subject:</strong>
                <input type="text" value={editForm.subject || profile.subject || ''} onChange={e => setEditForm({...editForm, subject: e.target.value})} style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', border: '1px solid #CBD5E1', borderRadius: '6px', marginTop: '4px' }} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <strong>Academic Background:</strong>
                <input type="text" value={editForm.academicBackground || profile.academicBackground || ''} onChange={e => setEditForm({...editForm, academicBackground: e.target.value})} style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', border: '1px solid #CBD5E1', borderRadius: '6px', marginTop: '4px' }} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <strong>Area of Research Interest:</strong>
                <input type="text" value={editForm.areaOfInterest || ''} onChange={e => setEditForm({...editForm, areaOfInterest: e.target.value})} style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', border: '1px solid #CBD5E1', borderRadius: '6px', marginTop: '4px' }} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <strong>Thesis Title:</strong>
                <input type="text" value={editForm.thesisTitle || ''} onChange={e => setEditForm({...editForm, thesisTitle: e.target.value})} style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', border: '1px solid #CBD5E1', borderRadius: '6px', marginTop: '4px' }} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <strong>Thesis Summary / Abstract:</strong>
                <textarea value={editForm.thesisSummary || ''} onChange={e => setEditForm({...editForm, thesisSummary: e.target.value})} style={{ width: '100%', height: '80px', padding: '6px 10px', fontSize: '0.8rem', border: '1px solid #CBD5E1', borderRadius: '6px', marginTop: '4px', resize: 'vertical' }} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <strong>Keywords:</strong>
                <input type="text" value={editForm.thesisKeywords || profile.thesisKeywords || ''} onChange={e => setEditForm({...editForm, thesisKeywords: e.target.value})} style={{ width: '100%', padding: '6px 10px', fontSize: '0.8rem', border: '1px solid #CBD5E1', borderRadius: '6px', marginTop: '4px' }} />
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', fontSize: '0.82rem' }}>
              <div><strong>SH no:</strong> <span style={{ color: '#059669', fontWeight: 700 }}>{profile.shNo || 'N/A'}</span></div>
              <div><strong>Enrollment No:</strong> <span style={{ color: '#475569', fontWeight: 600 }}>{profile.enrollmentNumber || thesis.enrollmentNumber || 'N/A'}</span></div>
              <div><strong>Department:</strong> <span style={{ color: '#475569' }}>{thesis.department || 'N/A'}</span></div>
              <div><strong>Admission Date:</strong> <span style={{ color: '#475569' }}>{profile.admissionDate ? new Date(profile.admissionDate).toLocaleDateString() : 'N/A'}</span></div>
              <div><strong>Ph.D. Mode:</strong> <span style={{ color: '#475569', fontWeight: 600 }}>{profile.phdMode || 'N/A'}</span></div>
              <div><strong>Specialization:</strong> <span style={{ color: '#475569' }}>{profile.specialization || 'N/A'}</span></div>
              <div><strong>Academic Session:</strong> <span style={{ color: '#475569', fontWeight: 600 }}>{profile.academicSession || 'N/A'}</span></div>
              <div><strong>Degree Type:</strong> <span style={{ color: '#475569' }}>{profile.degreeType || 'N/A'}</span></div>
              <div><strong>Degree Name:</strong> <span style={{ color: '#475569' }}>{profile.degreeName || 'N/A'}</span></div>
              <div><strong>Subject:</strong> <span style={{ color: '#475569' }}>{profile.subject || 'N/A'}</span></div>
              <div style={{ gridColumn: 'span 2' }}><strong>Academic Background:</strong> <span style={{ color: '#475569' }}>{profile.academicBackground || 'N/A'}</span></div>
              <div style={{ gridColumn: 'span 2' }}><strong>Area of Research Interest:</strong> <span style={{ color: '#475569' }}>{profile.areaOfInterest || 'N/A'}</span></div>
              <div style={{ gridColumn: 'span 2' }}>
                <strong>Preferred Supervisor Choice:</strong>{' '}
                <span style={{ color: '#4F46E5', fontWeight: 700, background: '#EEF2FF', border: '1px solid #C7D2FE', padding: '2px 8px', borderRadius: '4px', marginLeft: '6px' }}>
                  {profile.preferredGuideId
                    ? (faculty.find(f => f._id === profile.preferredGuideId)?.name || 'Loading Choice...')
                    : 'None Selected'}
                </span>
              </div>
              <div style={{ gridColumn: 'span 2' }}><strong>Thesis Title:</strong> <span style={{ color: '#0F172A', fontWeight: 700 }}>{profile.thesisTitle || thesis.title || 'N/A'}</span></div>
              <div style={{ gridColumn: 'span 2' }}><strong>Thesis Summary / Abstract:</strong> <span style={{ color: '#475569', display: 'block', whiteSpace: 'pre-wrap', lineHeight: 1.4, marginTop: 4 }}>{profile.thesisSummary || thesis.abstract || 'N/A'}</span></div>
              <div style={{ gridColumn: 'span 2' }}><strong>Keywords:</strong> <span style={{ color: '#475569' }}>{profile.thesisKeywords || thesis.keywords || 'N/A'}</span></div>
            </div>
          )}
        </div>

        {/* Qualifications */}
        {(profile.qualifications || isEditing) && (
          <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="usm-section-title">🎓 Educational Background</div>
            {['class10', 'class12', 'graduation', 'postGraduation'].map(level => {
              const qVal = qualifications[level];
              if (!qVal && !isEditing) return null;
              
              const labels = { class10: 'Class 10th', class12: 'Class 12th', graduation: 'Graduation', postGraduation: 'Post Graduation' };
              const isSchool = level === 'class10' || level === 'class12';
              
              return (
                <div key={level} className="usm-card" style={{ padding: 10, fontSize: '0.78rem' }}>
                  <div style={{ fontWeight: 700, marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                    <span>{labels[level]}</span>
                    {qVal?.certificateUrl ? <a href={`${API_BASE_URL}${qVal.certificateUrl}`} target="_blank" rel="noreferrer" style={{ color: '#10B981', fontWeight: 600 }}>📄 Certificate</a> : <span style={{ color: '#94A3B8' }}>Pending</span>}
                  </div>
                  
                  {isEditing ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px 12px', marginTop: '6px' }}>
                      <div>
                        <strong>Roll No:</strong>
                        <input type="text" value={editForm.qualifications?.[level]?.rollNo || ''} onChange={e => {
                          const qry = {...editForm.qualifications};
                          if (!qry[level]) qry[level] = {};
                          qry[level].rollNo = e.target.value;
                          setEditForm({...editForm, qualifications: qry});
                        }} style={{ width: '100%', padding: '4px 8px', fontSize: '0.75rem', border: '1px solid #CBD5E1', borderRadius: '4px' }} />
                      </div>
                      
                      {isSchool ? (
                        <>
                          <div>
                            <strong>Board:</strong>
                            <input type="text" value={editForm.qualifications?.[level]?.board || ''} onChange={e => {
                              const qry = {...editForm.qualifications};
                              if (!qry[level]) qry[level] = {};
                              qry[level].board = e.target.value;
                              setEditForm({...editForm, qualifications: qry});
                            }} style={{ width: '100%', padding: '4px 8px', fontSize: '0.75rem', border: '1px solid #CBD5E1', borderRadius: '4px' }} />
                          </div>
                          <div>
                            <strong>School:</strong>
                            <input type="text" value={editForm.qualifications?.[level]?.school || ''} onChange={e => {
                              const qry = {...editForm.qualifications};
                              if (!qry[level]) qry[level] = {};
                              qry[level].school = e.target.value;
                              setEditForm({...editForm, qualifications: qry});
                            }} style={{ width: '100%', padding: '4px 8px', fontSize: '0.75rem', border: '1px solid #CBD5E1', borderRadius: '4px' }} />
                          </div>
                          <div>
                            <strong>Marks Obtained:</strong>
                            <input type="text" value={editForm.qualifications?.[level]?.marksObtained || ''} onChange={e => {
                              const qry = {...editForm.qualifications};
                              if (!qry[level]) qry[level] = {};
                              qry[level].marksObtained = e.target.value;
                              setEditForm({...editForm, qualifications: qry});
                            }} style={{ width: '100%', padding: '4px 8px', fontSize: '0.75rem', border: '1px solid #CBD5E1', borderRadius: '4px' }} />
                          </div>
                          <div>
                            <strong>Total Marks:</strong>
                            <input type="text" value={editForm.qualifications?.[level]?.totalMarks || ''} onChange={e => {
                              const qry = {...editForm.qualifications};
                              if (!qry[level]) qry[level] = {};
                              qry[level].totalMarks = e.target.value;
                              setEditForm({...editForm, qualifications: qry});
                            }} style={{ width: '100%', padding: '4px 8px', fontSize: '0.75rem', border: '1px solid #CBD5E1', borderRadius: '4px' }} />
                          </div>
                          <div>
                            <strong>Percentage:</strong>
                            <input type="text" value={editForm.qualifications?.[level]?.percentage || ''} onChange={e => {
                              const qry = {...editForm.qualifications};
                              if (!qry[level]) qry[level] = {};
                              qry[level].percentage = e.target.value;
                              setEditForm({...editForm, qualifications: qry});
                            }} style={{ width: '100%', padding: '4px 8px', fontSize: '0.75rem', border: '1px solid #CBD5E1', borderRadius: '4px' }} />
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <strong>Degree:</strong>
                            <input type="text" value={editForm.qualifications?.[level]?.degree || ''} onChange={e => {
                              const qry = {...editForm.qualifications};
                              if (!qry[level]) qry[level] = {};
                              qry[level].degree = e.target.value;
                              setEditForm({...editForm, qualifications: qry});
                            }} style={{ width: '100%', padding: '4px 8px', fontSize: '0.75rem', border: '1px solid #CBD5E1', borderRadius: '4px' }} />
                          </div>
                          <div>
                            <strong>College:</strong>
                            <input type="text" value={editForm.qualifications?.[level]?.college || ''} onChange={e => {
                              const qry = {...editForm.qualifications};
                              if (!qry[level]) qry[level] = {};
                              qry[level].college = e.target.value;
                              setEditForm({...editForm, qualifications: qry});
                            }} style={{ width: '100%', padding: '4px 8px', fontSize: '0.75rem', border: '1px solid #CBD5E1', borderRadius: '4px' }} />
                          </div>
                          <div>
                            <strong>University:</strong>
                            <input type="text" value={editForm.qualifications?.[level]?.university || ''} onChange={e => {
                              const qry = {...editForm.qualifications};
                              if (!qry[level]) qry[level] = {};
                              qry[level].university = e.target.value;
                              setEditForm({...editForm, qualifications: qry});
                            }} style={{ width: '100%', padding: '4px 8px', fontSize: '0.75rem', border: '1px solid #CBD5E1', borderRadius: '4px' }} />
                          </div>
                          <div>
                            <strong>Marks Obtained:</strong>
                            <input type="text" value={editForm.qualifications?.[level]?.marksObtained || ''} onChange={e => {
                              const qry = {...editForm.qualifications};
                              if (!qry[level]) qry[level] = {};
                              qry[level].marksObtained = e.target.value;
                              setEditForm({...editForm, qualifications: qry});
                            }} style={{ width: '100%', padding: '4px 8px', fontSize: '0.75rem', border: '1px solid #CBD5E1', borderRadius: '4px' }} />
                          </div>
                          <div>
                            <strong>Total Marks:</strong>
                            <input type="text" value={editForm.qualifications?.[level]?.totalMarks || ''} onChange={e => {
                              const qry = {...editForm.qualifications};
                              if (!qry[level]) qry[level] = {};
                              qry[level].totalMarks = e.target.value;
                              setEditForm({...editForm, qualifications: qry});
                            }} style={{ width: '100%', padding: '4px 8px', fontSize: '0.75rem', border: '1px solid #CBD5E1', borderRadius: '4px' }} />
                          </div>
                          <div>
                            <strong>Percentage:</strong>
                            <input type="text" value={editForm.qualifications?.[level]?.percentage || ''} onChange={e => {
                              const qry = {...editForm.qualifications};
                              if (!qry[level]) qry[level] = {};
                              qry[level].percentage = e.target.value;
                              setEditForm({...editForm, qualifications: qry});
                            }} style={{ width: '100%', padding: '4px 8px', fontSize: '0.75rem', border: '1px solid #CBD5E1', borderRadius: '4px' }} />
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px 12px' }}>
                      <div><strong>Roll No:</strong> {qVal?.rollNo || 'N/A'}</div>
                      {isSchool ? (
                        <>
                          <div><strong>Board:</strong> {qVal?.board || 'N/A'}</div>
                          <div><strong>School:</strong> {qVal?.school || 'N/A'}</div>
                          <div style={{ gridColumn: 'span 3' }}>
                            <strong>Marks/CGPA:</strong> {qVal?.marksObtained}/{qVal?.totalMarks || 'N/A'} ({qVal?.percentage}%)
                          </div>
                        </>
                      ) : (
                        <>
                          <div><strong>Degree:</strong> {qVal?.degree || 'N/A'}</div>
                          <div><strong>College:</strong> {qVal?.college || 'N/A'}</div>
                          <div style={{ gridColumn: 'span 2' }}><strong>University:</strong> {qVal?.university || 'N/A'}</div>
                          <div><strong>Marks/CGPA:</strong> {qVal?.marksObtained}/{qVal?.totalMarks || 'N/A'} ({qVal?.percentage}%)</div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {isEditing && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
            <button 
              type="button"
              onClick={() => setIsEditing(false)}
              style={{ padding: '8px 16px', fontSize: '0.82rem', background: '#F1F5F9', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#475569' }}
            >
              Cancel Edit
            </button>
            <button 
              type="button"
              onClick={() => handleSaveEdit(false)}
              disabled={loading}
              style={{ padding: '8px 16px', fontSize: '0.82rem', background: '#3B82F6', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'white' }}
            >
              {loading ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        )}

      {/* HOD Review, Verify & Assign Supervisor Card */}
      {!isReadOnly && subRole === 'HOD' && thesis.status === 'REJECTED' && (
        <div className="usm-card" style={{ borderTop: '2px solid #E2E8F0', paddingTop: '16px', marginTop: '12px', background: '#FFF5F5', padding: '16px', borderRadius: '10px', border: '1px solid #FEB2B2', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#C53030', marginBottom: '8px', marginTop: 0 }}>📋 Verification & Supervisor Assignment</h4>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: '#C53030',
            fontWeight: 600,
            fontSize: '0.85rem'
          }}>
            <span style={{ fontSize: '1.25rem' }}>❌</span>
            <span>Request rejected and awaiting resubmission by the candidate.</span>
          </div>
        </div>
      )}

      {!isReadOnly && subRole === 'HOD' && thesis.status !== 'REJECTED' && (
        <div className="usm-card" style={{ borderTop: '2px solid #E2E8F0', paddingTop: '16px', marginTop: '12px', background: '#F8FAFC', padding: '16px', borderRadius: '10px' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A', marginBottom: '8px', marginTop: 0 }}>📋 Verification & Supervisor Assignment</h4>
          <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '16px' }}>
            Please review the qualifications and credentials above. Verify the scholar and allocate their Research Advisor (Supervisor).
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Preferred Supervisor box */}
            {!thesis.supervisorId && (
              <div style={{ display: 'flex', gap: '4px', flexDirection: 'column', background: '#EEF2FF', border: '1px solid #C7D2FE', padding: '10px 12px', borderRadius: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Preferred Supervisor submitted by student</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#312E81' }}>
                  {thesis.scholarId?.profile?.preferredGuideId
                    ? (faculty.find(f => f._id === thesis.scholarId.profile.preferredGuideId)?.name || 'Loading choice...')
                    : 'None Selected'}
                </span>
              </div>
            )}

            {/* Supervisor Selection / Info Row */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', width: '160px' }}>Supervisor:</span>
              {thesis.supervisorId ? (
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0369A1', background: '#E0F2FE', padding: '4px 10px', borderRadius: '12px' }}>
                  {thesis.supervisorId?.name || 'Assigned'}
                </span>
              ) : (
                <select 
                  className="form-input" 
                  style={{ padding: '6px 10px', height: 'auto', fontSize: '0.82rem', flex: 1, maxWidth: '300px' }} 
                  value={selSupervisor} 
                  onChange={e => setSelSupervisor(e.target.value)}
                >
                  <option value="">Select Supervisor...</option>
                  {faculty.filter(f => f.department === thesis.department).map(f => (
                    <option key={f._id} value={f._id}>{f.name} ({(f.role === 'HOD' || f.subRole === 'HOD') ? 'HOD' : (f.designation || f.subRole || 'Supervisor')})</option>
                  ))}
                </select>
              )}
            </div>

            {/* Unified Action Button Row */}
            {showRejectPopup ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px', background: '#FFF5F5', padding: '16px', borderRadius: '10px', border: '1px solid #FED7D7', width: '100%', textAlign: 'left' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#C53030' }}>
                    Rejection Remarks / Correction Instructions <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <textarea
                    placeholder="Please explain the reason for rejection or what corrections are needed..."
                    value={rejectRemarks}
                    onChange={e => setRejectRemarks(e.target.value)}
                    style={{
                      width: '100%',
                      height: '80px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #FC8181',
                      fontSize: '0.85rem',
                      outline: 'none',
                      resize: 'vertical',
                      color: '#2D3748',
                      fontFamily: 'Outfit, sans-serif'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleRejectAndSendToStudent}
                    disabled={loading}
                    style={{ padding: '8px 16px', fontSize: '0.82rem', background: '#EF4444', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'white', fontWeight: 600 }}
                  >
                    Send back to Candidate for Editing
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectEditAtHodEnd}
                    style={{ padding: '8px 16px', fontSize: '0.82rem', background: '#3B82F6', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'white', fontWeight: 600 }}
                  >
                    ✏️ Edit Profile Info at HOD End
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRejectPopup(false)}
                    style={{ padding: '8px 16px', fontSize: '0.82rem', background: '#E2E8F0', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#475569', fontWeight: 600 }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', width: '160px' }}>Action:</span>
                {(!thesis.enrollmentVerified || thesis.status === 'REGISTRATION_PENDING') ? (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setShowRejectPopup(true)}
                      disabled={loading}
                      style={{ padding: '8px 16px', fontSize: '0.82rem', background: '#EF4444', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'white', fontWeight: 600 }}
                    >
                      Reject Request
                    </button>
                    <button 
                      className="btn-primary" 
                      onClick={async () => {
                        if (!thesis.supervisorId) {
                          if (!selSupervisor) {
                            toast.warning('Please select a supervisor first.');
                            return;
                          }
                          setLoading(true);
                          try {
                            await onAssign(selSupervisor);
                            await onVerify();
                            toast.success('Supervisor assigned and profile verified successfully!');
                          } catch (err) {
                            toast.error(err.response?.data?.message || 'Error executing action.');
                          } finally {
                            setLoading(false);
                          }
                        } else {
                          act(onVerify);
                        }
                      }} 
                      disabled={loading} 
                      style={{ padding: '8px 16px', fontSize: '0.82rem', background: '#059669', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'white' }}
                    >
                      {!thesis.supervisorId 
                        ? 'Verify Profile, Assign Supervisor & Move to Coursework' 
                        : 'Verify Enrollment & Move to Coursework'}
                    </button>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#059669', background: '#D1FAE5', padding: '4px 10px', borderRadius: '12px' }}>
                    ✓ Verified & Supervisor Assigned
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

  const renderDRC = () => {
    const synopsisApproved = synopsisMilestone?.status === 'APPROVED';

    const drcLockNotice = () => {
      const mStatus = synopsisMilestone?.status || 'PENDING';
      let bg = '#FFF5F5';
      let border = '#FEB2B2';
      let color = '#C53030';
      let text = "⚠️ Synopsis upload is currently pending at the candidate's end. DRC scheduling is locked.";

      if (mStatus === 'SUBMITTED') {
        if (subRole === 'HOD') {
          text = "⚠️ Synopsis upload is currently pending at the candidate's end. DRC scheduling is locked.";
        } else {
          text = '⚠️ Synopsis has been submitted by candidate. Awaiting supervisor provisional approval. DRC scheduling is locked.';
        }
      } else if (mStatus === 'PENDING_HOD') {
        bg = '#FFFBEB';
        border = '#FDE68A';
        color = '#B45309';
        text = '⏳ Synopsis has been provisionally approved by supervisor. Awaiting HOD final approval. DRC scheduling is locked.';
      } else if (mStatus === 'REVISION_REQUIRED') {
        text = '⚠️ Synopsis revision required. Awaiting updated draft from candidate. DRC scheduling is locked.';
      }

      return (
        <div style={{ background: bg, border: `1px solid ${border}`, color: color, padding: '10px 14px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600 }}>
          {text}
        </div>
      );
    };

    const showSynopsisApprovalOption = thesis.status === 'SYNOPSIS_PENDING' && !drcMeetings.some(d => d.isSynopsisApproval && (d.status === 'APPROVED' || d.status === 'SCHEDULED'));

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="usm-section-title">🏛️ Departmental Research Committee (DRC)</div>

        {!synopsisApproved && thesis.status === 'SYNOPSIS_PENDING' && drcLockNotice()}

        {(synopsisApproved || thesis.status !== 'SYNOPSIS_PENDING') && (
          <>
            {/* HOD Actions */}
            {!isReadOnly && subRole === 'HOD' && (
              (thesis.status === 'SYNOPSIS_PENDING' && synopsisApproved) ||
              (thesis.status !== 'SYNOPSIS_PENDING')
            ) && !showDrcSchedule && !showOfflineDrc && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <button className="btn-primary" onClick={() => {
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
                }} style={{ padding: '6px 12px', fontSize: '0.78rem', background: '#3B82F6' }}>+ Schedule DRC</button>
                <button className="btn-primary" onClick={() => {
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
                }} style={{ padding: '6px 12px', fontSize: '0.78rem', background: '#059669' }}>+ Record Offline DRC</button>
              </div>
            )}

            {/* DRC List */}
            {drcMeetings.length === 0 ? (
              <div className="usm-card" style={{ textAlign: 'center', color: '#64748B', fontSize: '0.82rem', fontStyle: 'italic' }}>No DRC meetings recorded yet.</div>
            ) : drcMeetings.map((drc, idx) => (
              <div key={drc._id} className="usm-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{drc.title || 'DRC Session'}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700, background: drc.status === 'APPROVED' ? '#D1FAE5' : drc.status === 'REVISION_REQUIRED' ? '#FEE2E2' : '#FEF3C7', color: drc.status === 'APPROVED' ? '#065F46' : drc.status === 'REVISION_REQUIRED' ? '#991B1B' : '#92400E' }}>{drc.status === 'APPROVED' ? 'Satisfactory' : drc.status === 'REVISION_REQUIRED' ? 'Unsatisfactory' : drc.status}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: '0.78rem', color: 'var(--color-text-secondary, #475569)' }}>
                  <div><strong>Date:</strong> {new Date(drc.scheduledDate).toLocaleDateString()}</div>
                  <div><strong>Time:</strong> {drc.scheduledTime}</div>
                  <div style={{ gridColumn: 'span 2' }}><strong>Venue:</strong> {drc.venue}</div>
                  {drc.committeeMembers && <div style={{ gridColumn: 'span 2' }}><strong>Committee:</strong> {drc.committeeMembers}</div>}
                  {drc.remarks && <div style={{ gridColumn: 'span 2', background: '#FFFBEB', padding: 6, borderRadius: 6, color: '#92400E', borderLeft: '3px solid #F59E0B', marginTop: 4 }}><strong>Remarks:</strong> {drc.remarks}</div>}
                </div>
                {!isReadOnly && subRole === 'HOD' && drc.status === 'SCHEDULED' && (
                  <button className="btn-primary" onClick={() => { setSelectedDrc(drc); setShowDrcResult(true); }} style={{ marginTop: 10, padding: '5px 12px', fontSize: '0.75rem', background: '#059669' }}>📝 Record Outcome</button>
                )}
              </div>
            ))}

            {/* DRC Schedule Form */}
            {showDrcSchedule && (
              <form onSubmit={handleDrcSchedule} className="usm-card" style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#F0F9FF', borderColor: '#BAE6FD' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0369A1' }}>Schedule DRC Meeting</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div><label style={{ fontSize: '0.72rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Date</label><input type="date" className="form-input" style={{ width: '100%', padding: '6px' }} value={drcForm.scheduledDate} onChange={e => setDrcForm({...drcForm, scheduledDate: e.target.value})} required /></div>
                  <div><label style={{ fontSize: '0.72rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Time</label><input type="text" className="form-input" style={{ width: '100%', padding: '6px' }} placeholder="e.g. 11:00 AM" value={drcForm.scheduledTime} onChange={e => setDrcForm({...drcForm, scheduledTime: e.target.value})} required /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div><label style={{ fontSize: '0.72rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Venue</label><input type="text" className="form-input" style={{ width: '100%', padding: '6px' }} placeholder="e.g. Committee Room 1" value={drcForm.venue} onChange={e => setDrcForm({...drcForm, venue: e.target.value})} required /></div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Purpose</label>
                    <select className="form-input" style={{ width: '100%', padding: '6px' }} value={drcForm.isSynopsisApproval ? "Synopsis" : "General"} onChange={e => setDrcForm({...drcForm, isSynopsisApproval: e.target.value === "Synopsis"})}>
                      <option value="General">General DRC</option>
                      {showSynopsisApprovalOption && <option value="Synopsis">Synopsis approval</option>}
                    </select>
                  </div>
                </div>
                <div><label style={{ fontSize: '0.72rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Committee</label><input type="text" className="form-input" style={{ width: '100%', padding: '6px' }} placeholder="e.g. Dr. A. Sen, Prof. M. Roy" value={drcForm.committeeMembers} onChange={e => setDrcForm({...drcForm, committeeMembers: e.target.value})} /></div>
                <div><label style={{ fontSize: '0.72rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Agenda</label><textarea className="form-input" style={{ width: '100%', padding: '6px', resize: 'vertical' }} rows="2" placeholder="Focus areas..." value={drcForm.agenda} onChange={e => setDrcForm({...drcForm, agenda: e.target.value})} /></div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn-outline" onClick={() => setShowDrcSchedule(false)} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '4px 14px', fontSize: '0.75rem', background: '#3B82F6' }}>Schedule</button>
                </div>
              </form>
            )}

            {/* Offline DRC Form */}
            {showOfflineDrc && (
              <form onSubmit={handleOfflineDrc} className="usm-card" style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#ECFDF5', borderColor: '#A7F3D0' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#065F46' }}>Record Offline DRC Outcome</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div><label style={{ fontSize: '0.72rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Date Conducted</label><input type="date" className="form-input" style={{ width: '100%', padding: '6px' }} value={offlineDrcForm.conductedDate} onChange={e => setOfflineDrcForm({...offlineDrcForm, conductedDate: e.target.value})} required /></div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Decision</label>
                    <select className="form-input" style={{ width: '100%', padding: '6px' }} value={offlineDrcForm.status} onChange={e => setOfflineDrcForm({...offlineDrcForm, status: e.target.value})}>
                      <option value="APPROVED">Satisfactory</option>
                      <option value="REVISION_REQUIRED">Unsatisfactory</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div><label style={{ fontSize: '0.72rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Venue</label><input type="text" className="form-input" style={{ width: '100%', padding: '6px' }} placeholder="e.g. Offline Department Office" value={offlineDrcForm.venue} onChange={e => setOfflineDrcForm({...offlineDrcForm, venue: e.target.value})} required /></div>
                  <div>
                    <label style={{ fontSize: '0.72rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Purpose</label>
                    <select className="form-input" style={{ width: '100%', padding: '6px' }} value={offlineDrcForm.isSynopsisApproval ? "Synopsis" : "General"} onChange={e => setOfflineDrcForm({...offlineDrcForm, isSynopsisApproval: e.target.value === "Synopsis"})}>
                      <option value="General">General DRC</option>
                      {showSynopsisApprovalOption && <option value="Synopsis">Synopsis approval</option>}
                    </select>
                  </div>
                </div>
                <div><label style={{ fontSize: '0.72rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Remarks / MoM</label><textarea className="form-input" style={{ width: '100%', padding: '6px', resize: 'vertical' }} rows="3" value={offlineDrcForm.remarks} onChange={e => setOfflineDrcForm({...offlineDrcForm, remarks: e.target.value})} required /></div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn-outline" onClick={() => setShowOfflineDrc(false)} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '4px 14px', fontSize: '0.75rem', background: '#059669' }}>Submit</button>
                </div>
              </form>
            )}

            {/* DRC Result Form */}
            {showDrcResult && selectedDrc && (
              <form onSubmit={handleDrcResult} className="usm-card" style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#ECFDF5', borderColor: '#A7F3D0' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#065F46' }}>Record DRC Outcome</div>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Decision</label>
                  <select className="form-input" style={{ width: '100%', padding: '6px' }} value={drcResultForm.status} onChange={e => setDrcResultForm({...drcResultForm, status: e.target.value})}>
                    <option value="APPROVED">Satisfactory</option>
                    <option value="REVISION_REQUIRED">Unsatisfactory</option>
                    <option value="RESCHEDULE">Reschedule</option>
                  </select>
                </div>
                {drcResultForm.status === 'RESCHEDULE' && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div><label style={{ fontSize: '0.72rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>New Date</label><input type="date" className="form-input" style={{ width: '100%', padding: '6px' }} value={drcResultForm.scheduledDate} onChange={e => setDrcResultForm({...drcResultForm, scheduledDate: e.target.value})} required /></div>
                      <div><label style={{ fontSize: '0.72rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>New Time</label><input type="text" className="form-input" style={{ width: '100%', padding: '6px' }} placeholder="e.g. 11:30 AM" value={drcResultForm.scheduledTime} onChange={e => setDrcResultForm({...drcResultForm, scheduledTime: e.target.value})} required /></div>
                    </div>
                    <div><label style={{ fontSize: '0.72rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>New Venue</label><input type="text" className="form-input" style={{ width: '100%', padding: '6px' }} value={drcResultForm.venue} onChange={e => setDrcResultForm({...drcResultForm, venue: e.target.value})} required /></div>
                  </>
                )}
                <div><label style={{ fontSize: '0.72rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Remarks</label><textarea className="form-input" style={{ width: '100%', padding: '6px', resize: 'vertical' }} rows="3" value={drcResultForm.remarks} onChange={e => setDrcResultForm({...drcResultForm, remarks: e.target.value})} required /></div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn-outline" onClick={() => { setShowDrcResult(false); setSelectedDrc(null); }} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '4px 14px', fontSize: '0.75rem', background: '#059669' }}>{drcResultForm.status === 'RESCHEDULE' ? 'Reschedule' : 'Submit'}</button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    );
  };

  const renderRAC = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="usm-section-title" style={{ marginBottom: 0 }}>📋 Research Advisory Committee (RAC)</div>
        {!isReadOnly && (
          <button onClick={() => setShowRacSchedule(!showRacSchedule)} className="btn-primary" style={{ background: '#059669', padding: '6px 14px', fontSize: '0.78rem', display: 'flex', gap: 4, alignItems: 'center' }}><Plus size={14} /> Schedule RAC</button>
        )}
      </div>



      {/* RAC Schedule Form */}
      {showRacSchedule && (
        <form onSubmit={handleRacSchedule} className="usm-card" style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#F0F9FF', borderColor: '#BAE6FD' }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0369A1' }}>Schedule RAC Session</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div><label style={{ fontSize: '0.72rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>RAC Number</label><select className="form-input" value={racForm.racNumber} onChange={e => setRacForm({...racForm, racNumber: parseInt(e.target.value)})}>{[1,2,3,4,5,6].map(n => <option key={n} value={n}>RAC-{n}</option>)}</select></div>
            <div><label style={{ fontSize: '0.72rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Date</label><input type="date" className="form-input" required value={racForm.scheduledDate} onChange={e => setRacForm({...racForm, scheduledDate: e.target.value})} /></div>
          </div>
          <div><label style={{ fontSize: '0.72rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Committee Members</label><input type="text" className="form-input" placeholder="e.g. Dr. Verma, Prof. Sen" value={racForm.committeeMembers} onChange={e => setRacForm({...racForm, committeeMembers: e.target.value})} /></div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-outline" onClick={() => setShowRacSchedule(false)} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '4px 14px', fontSize: '0.75rem', background: '#059669' }}>Schedule</button>
          </div>
        </form>
      )}

      {/* RAC List */}
      {racReviews.length === 0 ? (
        <div className="usm-card" style={{ textAlign: 'center', color: '#64748B', fontSize: '0.82rem', fontStyle: 'italic' }}>No RAC sessions scheduled yet.</div>
      ) : racReviews.map(r => (
        <div key={r._id} className="usm-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#1E3A8A' }}>RAC-{r.racNumber}</span>
            <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700, background: r.status === 'SATISFACTORY' ? '#D1FAE5' : r.status === 'UNSATISFACTORY' ? '#FEE2E2' : '#FEF3C7', color: r.status === 'SATISFACTORY' ? '#065F46' : r.status === 'UNSATISFACTORY' ? '#991B1B' : '#D97706' }}>{r.status === 'SATISFACTORY' ? 'CLEARED' : r.status === 'UNSATISFACTORY' ? 'REJECTED' : r.status}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: '0.78rem', color: 'var(--color-text-secondary, #475569)' }}>
            <div><strong>Date:</strong> {new Date(r.scheduledDate).toLocaleDateString()}</div>
            <div><strong>Committee:</strong> {r.committeeMembers || 'Pending'}</div>
            {(r.submissions && r.submissions.length > 0) || r.progressReportUrl || r.studentRemarks ? (
              <div style={{ gridColumn: 'span 2', marginTop: 4, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontWeight: 700, color: 'var(--color-text-secondary, #475569)' }}>Candidate Submissions History:</span>
                <div style={{ width: '100%', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem', background: '#ffffff', borderRadius: 8, overflow: 'hidden', border: '1px solid #CBD5E1', minWidth: 440 }}>
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
            {r.researchProgress && <div style={{ gridColumn: 'span 2' }}><strong>Progress:</strong> {r.researchProgress}</div>}
            {r.nextMilestones && <div style={{ gridColumn: 'span 2' }}><strong>Next Targets:</strong> {r.nextMilestones}</div>}
            {r.remarks && <div style={{ gridColumn: 'span 2' }}><strong>Remarks:</strong> {r.remarks}</div>}
            {r.committeeChairedBy && <div><strong>Chaired By:</strong> {r.committeeChairedBy}</div>}
            {r.nextMeetingDate && <div><strong>Next Meeting:</strong> {new Date(r.nextMeetingDate).toLocaleDateString()}</div>}
          </div>
          {!isReadOnly && (
            <button onClick={() => setSelectedRAC(r)} className={r.status === 'SCHEDULED' ? "btn-primary" : "btn-outline"} style={{ marginTop: 10, padding: '6px 14px', fontSize: '0.78rem', background: r.status === 'SCHEDULED' ? '#059669' : 'transparent', borderColor: '#059669', color: r.status === 'SCHEDULED' ? '#fff' : '#059669' }}>
              {r.status === 'SCHEDULED' ? 'Evaluate Meeting' : 'Edit Review'}
            </button>
          )}
        </div>
      ))}
    </div>
  );

  const renderReportsOrChapters = (type) => {
    const items = type === 'reports' ? reports : chapters;
    const typeName = type === 'reports' ? '6-Month Progress Reports' : 'Chapter Drafts';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="usm-section-title" style={{ marginBottom: 0 }}>{type === 'reports' ? '📑' : '📖'} {typeName}</div>
          {type === 'reports' && !showAssignReport && !isReadOnly && (
            <button onClick={() => { setShowAssignReport(true); setNewReportTitle(`Research Progress Report (Assigned) #${reports.length + 1}`); setNewReportDueDate(new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); }} className="btn-primary" style={{ padding: '4px 10px', fontSize: '0.75rem', background: '#059669' }}>+ Assign Report</button>
          )}
        </div>

        {type === 'reports' && showAssignReport && (
          <form onSubmit={handleAssignReport} className="usm-card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>Assign New Report Milestone</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 10 }}>
              <div><label style={{ fontSize: '0.72rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Title</label><input type="text" className="form-input" required value={newReportTitle} onChange={e => setNewReportTitle(e.target.value)} style={{ width: '100%', padding: '6px' }} /></div>
              <div><label style={{ fontSize: '0.72rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Due Date</label><input type="date" className="form-input" required value={newReportDueDate} onChange={e => setNewReportDueDate(e.target.value)} style={{ width: '100%', padding: '6px' }} /></div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowAssignReport(false)} className="btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '4px 14px', fontSize: '0.75rem', background: '#3B82F6' }}>Assign</button>
            </div>
          </form>
        )}

        {items.length === 0 ? (
          <div className="usm-card" style={{ textAlign: 'center', color: '#64748B', fontSize: '0.82rem', fontStyle: 'italic' }}>No {typeName.toLowerCase()} yet.</div>
        ) : items.map(item => (
          <div key={item._id} className="usm-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>{item.title}</span>
              {(() => {
                const display = item.type === '6_MONTH_REPORT' ? getStatusDisplay(item.status) : { text: item.status, color: item.status === 'APPROVED' ? '#065F46' : item.status === 'REVISION_REQUIRED' ? '#991B1B' : item.status === 'SUBMITTED' ? '#1D4ED8' : '#D97706', bg: item.status === 'APPROVED' ? '#D1FAE5' : item.status === 'REVISION_REQUIRED' ? '#FEE2E2' : item.status === 'SUBMITTED' ? '#DBEAFE' : '#FEF3C7' };
                return (
                  <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700, background: display.bg, color: display.color, border: display.border ? `1px solid ${display.border}` : 'none' }}>
                    {display.text}
                  </span>
                );
              })()}
            </div>
            {item.dueDate && <div style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: 8 }}>Due: {new Date(item.dueDate).toLocaleDateString()}</div>}
            {item.documentUrl && <a href={`${API_BASE_URL}${item.documentUrl}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.82rem', color: '#3B82F6', fontWeight: 600, display: 'inline-block', marginBottom: 8 }}>📄 View Document</a>}
            {item.comments?.length > 0 && (
              <div style={{ background: '#FFFBEB', borderLeft: '3px solid #F59E0B', padding: '6px 10px', borderRadius: 6, fontSize: '0.8rem', color: '#92400E', margin: '8px 0' }}><strong>Feedback:</strong> {item.comments[item.comments.length - 1].text}</div>
            )}
            {(() => {
              let canEval = false;
              if (item.type === '6_MONTH_REPORT') {
                if (isSupervisor && item.status === 'PENDING') {
                  canEval = true;
                } else if (isHodUser && item.status === 'UNDER_REVIEW_HOD') {
                  canEval = true;
                }
              } else {
                if (item.status === 'SUBMITTED' || (item.status === 'PENDING_HOD' && isHodUser)) {
                  canEval = true;
                }
              }
              if (!canEval || isReadOnly) return null;
              return (
                <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                  <button onClick={() => setSelectedEvalDoc({ ...item, docType: 'MILESTONE', scholarName: thesis.scholarId?.name, enrollmentNumber: thesis.scholarId?.username, thesisTitle: thesis.title, isSupervisor })} className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.78rem', background: '#133A26' }}>Evaluate</button>
                </div>
              );
            })()}
          </div>
        ))}
      </div>
    );
  };

  const renderPublications = () => {
    const filteredPubs = publications.filter(p => {
      if (isSupervisor) {
        return p.status !== 'DRAFT';
      } else if (isHodUser) {
        return ['UNDER_REVIEW_HOD', 'VERIFIED', 'REJECTED_BY_HOD'].includes(p.status);
      } else {
        return p.status !== 'DRAFT';
      }
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="usm-section-title">🏆 Research Outputs Vault</div>
        {/* Publication prerequisite banner */}
        <div className="usm-card" style={{ display: 'flex', justifyContent: 'space-around', padding: '12px 20px', textAlign: 'center' }}>
          <div><div style={{ fontSize: '1.2rem', fontWeight: 900, color: verifiedJournals >= 2 ? '#059669' : '#EF4444' }}>{verifiedJournals}/2</div><div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B' }}>Journals {verifiedJournals >= 2 ? '✅' : '⚠️'}</div></div>
          <div style={{ width: 1, background: '#E2E8F0' }} />
          <div><div style={{ fontSize: '1.2rem', fontWeight: 900, color: verifiedConferences >= 2 ? '#059669' : '#EF4444' }}>{verifiedConferences}/2</div><div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B' }}>Conferences {verifiedConferences >= 2 ? '✅' : '⚠️'}</div></div>
          <div style={{ width: 1, background: '#E2E8F0' }} />
          <div><div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#2563EB' }}>{filteredPubs.filter(p => (p.type === 'PATENT' || p.type === 'IPR') && p.status === 'VERIFIED').length}</div><div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B' }}>IPRs (Optional)</div></div>
          <div style={{ width: 1, background: '#E2E8F0' }} />
          <div><div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#3B82F6' }}>{filteredPubs.length}</div><div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B' }}>Total Logged</div></div>
        </div>
        {pubsLoading ? (
          <div className="premium-preloader-container" style={{ padding: '30px 20px' }}>
            <div className="premium-preloader-spinner" style={{ width: '40px', height: '40px', borderWidth: '3px', marginBottom: '12px' }}></div>
            <div className="premium-preloader-text" style={{ fontSize: '0.85rem' }}>Loading research outputs...</div>
          </div>
        ) :
         filteredPubs.length === 0 ? <div className="usm-card" style={{ textAlign: 'center', color: '#64748B', fontSize: '0.82rem', fontStyle: 'italic' }}>No research outputs logged.</div> :
         filteredPubs.map(p => (
        <div key={p._id} className="usm-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>{p.title}</span>
            {(() => {
              const sd = getStatusDisplay(p.status);
              return (
                <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700, background: sd.bg, color: sd.color, border: `1px solid ${sd.border}`, whiteSpace: 'nowrap' }}>
                  {sd.text}
                </span>
              );
            })()}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 10px', fontSize: '0.78rem', color: '#64748B', margin: '6px 0' }}>
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
          {(p.documentUrl || p.attachmentUrl) && (
            <a href={`${API_BASE_URL}${p.documentUrl || p.attachmentUrl}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.82rem', color: '#3B82F6', fontWeight: 600, display: 'inline-block', marginBottom: 8 }}>
              {p.type === 'PATENT' || p.type === 'IPR' ? '📄 View IPR Proof' : '📄 View Proof'}
            </a>
          )}
          {p.remarks && (
            <div style={{ background: '#FFF9E6', borderLeft: '3px solid #F59E0B', padding: '6px 10px', borderRadius: 6, fontSize: '0.8rem', color: '#92400E', margin: '8px 0' }}>
              <strong>{p.status === 'REJECTED_BY_HOD' ? 'HOD Remarks' : 'Supervisor Remarks'}:</strong> {p.remarks}
            </div>
          )}
          {((p.status === 'PENDING' && isSupervisor) || (p.status === 'UNDER_REVIEW_HOD' && isHodUser)) && !isReadOnly && (
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedEvalDoc({ ...p, docType: 'PUBLICATION', scholarName: thesis.scholarId?.name, enrollmentNumber: thesis.scholarId?.username, thesisTitle: thesis.title })} className="btn-primary" style={{ padding: '6px 14px', fontSize: '0.78rem', background: '#133A26' }}>Evaluate</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

  const renderDocuments = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="usm-section-title">📄 Core Documents & Submissions</div>

        {/* Synopsis/Final Submission pending info */}
        {thesis.status === 'SYNOPSIS_PENDING' && (!synopsisMilestone || synopsisMilestone.status === 'PENDING') && (
          <div style={{ background: '#FFF9E6', borderLeft: '4px solid #F59E0B', color: '#B45309', padding: '10px 14px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600 }}>⚠️ Synopsis upload pending at candidate's end.</div>
        )}
        {thesis.status === 'PRE_SUBMISSION' && (!finalSubMilestone || finalSubMilestone.status === 'PENDING') && (
          <div style={{ background: '#FFF9E6', borderLeft: '4px solid #F59E0B', color: '#B45309', padding: '10px 14px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600 }}>⚠️ Final thesis upload pending at candidate's end.</div>
        )}

        {/* Core pending documents for review */}
        {corePendingMilestonesDocs.length > 0 && corePendingMilestonesDocs.map(m => (
          <div key={m._id} className="usm-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontWeight: 700 }}>{m.title}</div>
              <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700, background: m.status === 'SUBMITTED' ? '#DBEAFE' : m.status === 'APPROVED' ? '#D1FAE5' : '#FEE2E2', color: m.status === 'SUBMITTED' ? '#1D4ED8' : m.status === 'APPROVED' ? '#065F46' : '#991B1B' }}>{m.status}</span>
            </div>

            {/* Documents Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12, fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                  <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Document</th>
                  <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Status</th>
                  <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 700, color: '#475569' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {/* Thesis / Synopsis Document */}
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ fontWeight: 600, color: '#1E293B' }}>📄 {m.type === 'PRE_SUBMISSION' ? 'Rough Thesis Draft' : m.type === 'SYNOPSIS' ? 'Synopsis Document' : 'Thesis Document'}</div>
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    {m.documentUrl ? (
                      <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700, background: '#D1FAE5', color: '#065F46' }}>Uploaded</span>
                    ) : (
                      <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700, background: '#FEF3C7', color: '#D97706' }}>Not Uploaded</span>
                    )}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    {m.documentUrl ? (
                      <a href={`${API_BASE_URL}${m.documentUrl}`} target="_blank" rel="noreferrer" style={{ color: '#3B82F6', fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none' }}>📥 View</a>
                    ) : (
                      <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>—</span>
                    )}
                  </td>
                </tr>
                {/* Plagiarism Report (only for PRE_SUBMISSION and FINAL_SUBMISSION) */}
                {(m.type === 'PRE_SUBMISSION' || m.type === 'FINAL_SUBMISSION') && (
                  <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '10px 12px' }}>
                      <div style={{ fontWeight: 600, color: '#1E293B' }}>🔍 Turnitin Plagiarism Report</div>
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      {m.plagiarismReportUrl ? (
                        <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700, background: '#D1FAE5', color: '#065F46' }}>Uploaded</span>
                      ) : (
                        <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700, background: '#FEF3C7', color: '#D97706' }}>Not Uploaded</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                      {m.plagiarismReportUrl ? (
                        <a href={`${API_BASE_URL}${m.plagiarismReportUrl}`} target="_blank" rel="noreferrer" style={{ color: '#3B82F6', fontWeight: 600, fontSize: '0.8rem', textDecoration: 'none' }}>📥 View</a>
                      ) : (
                        <span style={{ color: '#94A3B8', fontSize: '0.8rem' }}>—</span>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {renderHistoryTable(getMilestoneHistory(m, thesis))}
            {!isReadOnly && (
              <>
                <textarea className="form-input" placeholder="Add evaluation remarks..." rows="2" value={remarks[m._id] || ''} onChange={e => setRemarks(r => ({ ...r, [m._id]: e.target.value }))} style={{ marginBottom: 8, resize: 'vertical' }} disabled={m.status === 'REVISION_REQUIRED'} />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-primary" onClick={() => act(() => onReview(m._id, 'APPROVE', remarks[m._id]))} disabled={loading || m.status === 'REVISION_REQUIRED'} style={{ flex: 1, padding: '6px', fontSize: '0.82rem', background: '#059669', ...(m.status === 'REVISION_REQUIRED' ? { opacity: 0.5, cursor: 'not-allowed' } : {}) }}><CheckCircle2 size={14} style={{ marginRight: 4 }} />Approve</button>
                  <button onClick={() => {
                    if (!(remarks[m._id] || '').trim()) return toast.warning('Remarks are required to request revision.');
                    act(() => onReview(m._id, 'REVISION', remarks[m._id]));
                  }} disabled={loading || m.status === 'REVISION_REQUIRED'} style={{ flex: 1, padding: '6px', fontSize: '0.82rem', border: '1px solid #F87171', color: '#DC2626', background: 'none', borderRadius: 6, cursor: m.status === 'REVISION_REQUIRED' ? 'not-allowed' : 'pointer', ...(m.status === 'REVISION_REQUIRED' ? { opacity: 0.5 } : {}) }}><XCircle size={14} style={{ marginRight: 4 }} />Request Revision</button>
                </div>
              </>
            )}
            {m.status === 'REVISION_REQUIRED' && <div style={{ marginTop: 12, background: '#FEF2F2', border: '1px solid #FCA5A5', borderLeft: '4px solid #EF4444', padding: '10px 14px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, color: '#991B1B' }}>ℹ️ Sent for correction. Awaiting resubmission.</div>}
          </div>
        ))}

        {/* Additional documents */}
        {additionalDocs.length > 0 && (
          <>
            <div className="usm-section-title" style={{ marginTop: 10 }}>📎 Additional Documents</div>
            {additionalDocs.map(doc => (
              <div key={doc._id} className="usm-card" style={{ padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{doc.title}</div>
                    {doc.description && <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>{doc.description}</div>}
                  </div>
                  <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700, background: doc.status === 'REVIEWED' ? '#D1FAE5' : '#FEF3C7', color: doc.status === 'REVIEWED' ? '#065F46' : '#D97706' }}>{doc.status}</span>
                </div>
                {doc.documentUrl && <a href={`${API_BASE_URL}${doc.documentUrl}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.78rem', color: '#3B82F6', fontWeight: 600, marginTop: 6, display: 'inline-block' }}>📄 View Document</a>}
                {doc.status === 'REVIEWED' && doc.remarks && (
                  <div style={{ marginTop: 8, background: '#F0FDF4', borderLeft: '3px solid #10B981', padding: '8px 12px', borderRadius: 6, fontSize: '0.8rem', color: '#065F46' }}>
                    <strong>Review Remarks:</strong> {doc.remarks}
                  </div>
                )}
                {doc.status === 'SUBMITTED' && !isReadOnly && (
                  <div style={{ marginTop: 10 }}>
                    <textarea
                      className="form-input"
                      placeholder="Add review remarks..."
                      rows="2"
                      value={remarks[`doc_${doc._id}`] || ''}
                      onChange={e => setRemarks(r => ({ ...r, [`doc_${doc._id}`]: e.target.value }))}
                      style={{ marginBottom: 8, resize: 'vertical', width: '100%' }}
                    />
                    <button
                      className="btn-primary"
                      disabled={loading || !(remarks[`doc_${doc._id}`] || '').trim()}
                      onClick={async () => {
                        setLoading(true);
                        try {
                          await axios.put(`${API}/additional-documents/${doc._id}/review`, { remarks: remarks[`doc_${doc._id}`] }, getAuthHeader());
                          toast.success('Document marked as reviewed!');
                          setRemarks(r => ({ ...r, [`doc_${doc._id}`]: '' }));
                          fetchAdditionalDocs();
                        } catch (err) {
                          toast.error(err.response?.data?.message || 'Failed to review document.');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      style={{ padding: '6px 14px', fontSize: '0.82rem', background: !(remarks[`doc_${doc._id}`] || '').trim() ? '#94A3B8' : '#059669', cursor: !(remarks[`doc_${doc._id}`] || '').trim() ? 'not-allowed' : 'pointer' }}
                    >
                      <CheckCircle2 size={14} style={{ marginRight: 4 }} />✓ Mark as Reviewed
                    </button>
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {corePendingMilestonesDocs.length === 0 && additionalDocs.length === 0 && thesis.status !== 'SYNOPSIS_PENDING' && thesis.status !== 'PRE_SUBMISSION' && (
          <div className="usm-card" style={{ textAlign: 'center', color: '#64748B', fontSize: '0.82rem' }}>No pending documents for review.</div>
        )}
      </div>
    );
  };

  const renderChanges = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="usm-section-title">🔄 Change Requests & Transfer History</div>

      {/* Transfer button */}
      {!isReadOnly && isSupervisor && !['SUBMITTED', 'AWARDED'].includes(thesis.status) && (
        <div className="usm-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div><div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Transfer Supervision</div><div style={{ fontSize: '0.72rem', color: '#64748B' }}>Permanently transfer to another faculty in {thesis.department}.</div></div>
          <button onClick={() => setShowTransferModal(true)} className="btn-outline" style={{ borderColor: '#F59E0B', color: '#B45309', padding: '6px 12px', fontSize: '0.78rem', fontWeight: 700 }}>Transfer</button>
        </div>
      )}

      {/* Change requests */}
      {changeRequests.length === 0 ? (
        <div className="usm-card" style={{ textAlign: 'center', color: '#64748B', fontSize: '0.82rem', fontStyle: 'italic' }}>No change requests for this scholar.</div>
      ) : changeRequests.map(r => (
        <div key={r._id} className="usm-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{r.type === 'GUIDE_CHANGE' ? '🤝 Supervisor Reallocation' : '📝 Title Change'}</span>
            <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700, background: r.status === 'APPROVED' ? '#D1FAE5' : r.status === 'REJECTED' ? '#FEE2E2' : '#FEF3C7', color: r.status === 'APPROVED' ? '#065F46' : r.status === 'REJECTED' ? '#991B1B' : '#B45309' }}>{r.status}</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div><strong>Current:</strong> {r.currentValue || 'None'}</div>
            <div><strong>Proposed:</strong> {r.proposedValue}</div>
            <div><strong>Reason:</strong> <em>"{r.reason}"</em></div>
            {r.remarks && <div style={{ background: '#F8FAFC', borderLeft: '3px solid #64748B', padding: '6px 10px', borderRadius: 4, marginTop: 4 }}><strong>HOD Remarks:</strong> "{r.remarks}"</div>}
            <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: 4 }}>Filed: {new Date(r.createdAt).toLocaleString()}</div>
          </div>
        </div>
      ))}

      {/* Transfer history from audit log */}
      {thesis.auditLog?.filter(l => l.action === 'SUPERVISOR_TRANSFERRED' || l.action === 'CHANGE_RESOLVED').length > 0 && (
        <>
          <div className="usm-section-title" style={{ marginTop: 10 }}>📋 Related Audit Entries</div>
          {thesis.auditLog.filter(l => l.action === 'SUPERVISOR_TRANSFERRED' || l.action === 'CHANGE_RESOLVED').map((log, i) => (
            <div key={i} className="usm-card" style={{ padding: 10, fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800, color: '#10b981', textTransform: 'uppercase', fontSize: '0.72rem' }}>{log.action}</span>
                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{new Date(log.date).toLocaleString()}</span>
              </div>
              <div style={{ marginTop: 4, color: '#1F2937' }}>{log.note}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );

  const renderFinalSubmission = () => {
    const finalSub = milestones.find(m => m.type === 'FINAL_SUBMISSION');
    const isSupervisor = thesis.supervisorId && (thesis.supervisorId._id === user?._id || thesis.supervisorId === user?._id);
    const isHOD = subRole === 'HOD';
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    const isDispatched = !!thesis.dispatchDate;

    const handleSupervisorApprove = async () => {
      act(async () => {
        await axios.put(`${API}/thesis/${thesis._id}/final-approve`, {}, getAuthHeader());
        toast.success('Thesis signed-off and routed to HOD!');
        refreshAll();
      });
    };

    const handleSupervisorReject = async (e) => {
      e.preventDefault();
      if (!supervisorRejectComment.trim()) return toast.warning('Comment is required for corrections.');
      act(async () => {
        await axios.put(`${API}/thesis/${thesis._id}/final-reject`, { comment: supervisorRejectComment.trim() }, getAuthHeader());
        toast.success('Thesis corrections sent back to student.');
        setSupervisorRejectComment('');
        setShowSupervisorRejectForm(false);
        refreshAll();
      });
    };

    const handleHodApprove = async () => {
      act(async () => {
        await axios.put(`${API}/thesis/${thesis._id}/final-approve-hod`, {}, getAuthHeader());
        toast.success('Final Bound Thesis approved and marked SUBMITTED!');
        refreshAll();
      });
    };

    const handleHodReject = async (e) => {
      e.preventDefault();
      if (!hodRejectComment.trim()) return toast.warning('Comment is required for corrections.');
      act(async () => {
        await axios.put(`${API}/thesis/${thesis._id}/final-reject-hod`, { comment: hodRejectComment.trim() }, getAuthHeader());
        toast.success('Thesis corrections sent back to student.');
        setHodRejectComment('');
        setShowHodRejectForm(false);
        refreshAll();
      });
    };

    const handleEvalOutcome = async (outcome) => {
      act(async () => {
        await axios.put(`${API}/thesis/${thesis._id}/external-evaluation`, { status: outcome, remarks: evalRemarks }, getAuthHeader());
        toast.success(`External evaluation logged as ${outcome}!`);
        setEvalRemarks('');
        setShowEvalOutcomeForm(false);
        refreshAll();
      });
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="usm-section-title">📁 Final Bound Thesis Submission & Evaluation Activities</div>

        {!finalSub ? (
          <div className="usm-card" style={{ padding: 24, textAlign: 'center', color: '#64748B' }}>
            ⏳ Final bound thesis submission is locked. Scholar must clear the Pre-Submission Seminar first.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Step 1: Upload Details */}
            <div className="usm-card" style={{ borderLeft: '4px solid #3B82F6', padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800 }}>Step 1: Student Final Thesis Upload</h4>
                <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700, background: finalSub.status === 'PENDING' ? '#FEF3C7' : '#D1FAE5', color: finalSub.status === 'PENDING' ? '#D97706' : '#065F46' }}>
                  {finalSub.status === 'PENDING' ? 'Awaiting Upload' : 'Uploaded'}
                </span>
              </div>
              {finalSub.status === 'PENDING' ? (
                <div style={{ fontSize: '0.82rem', color: '#64748B' }}>Awaiting the student to incorporate corrections and upload the final hard-bound thesis PDF.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.82rem' }}>
                  <div><strong>Uploaded On:</strong> {new Date(finalSub.submittedAt).toLocaleString()}</div>
                  <div style={{ marginTop: 4 }}>
                    <a href={`${API_BASE_URL}${finalSub.documentUrl}`} target="_blank" rel="noreferrer" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', fontSize: '0.75rem', textDecoration: 'none' }}>
                      📄 View Absolute Final Bound Thesis PDF
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Supervisor Digital Sign-off */}
            {finalSub.status !== 'PENDING' && (
              <div className="usm-card" style={{ borderLeft: `4px solid ${['PENDING_HOD', 'APPROVED', 'SUBMITTED', 'AWARDED'].includes(finalSub.status) ? '#10B981' : finalSub.status === 'REVISION_REQUIRED' ? '#EF4444' : '#3B82F6'}`, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800 }}>Step 2: Supervisor Digital Sign-off</h4>
                  <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700, background: ['PENDING_HOD', 'APPROVED', 'SUBMITTED', 'AWARDED'].includes(finalSub.status) ? '#D1FAE5' : finalSub.status === 'REVISION_REQUIRED' ? '#FEE2E2' : '#DBEAFE', color: ['PENDING_HOD', 'APPROVED', 'SUBMITTED', 'AWARDED'].includes(finalSub.status) ? '#065F46' : finalSub.status === 'REVISION_REQUIRED' ? '#991B1B' : '#1E40AF' }}>
                    {['PENDING_HOD', 'APPROVED', 'SUBMITTED', 'AWARDED'].includes(finalSub.status) ? 'Approved' : finalSub.status === 'REVISION_REQUIRED' ? 'Corrections Requested' : 'Pending Approval'}
                  </span>
                </div>
                
                {finalSub.status === 'SUBMITTED' ? (
                  <div style={{ fontSize: '0.82rem' }}>
                    <p style={{ color: '#475569', margin: '0 0 10px 0' }}>Review the final bound document and check if corrections are incorporated. Click Approval to sign-off and route to HOD.</p>
                    {isSupervisor && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-primary" onClick={handleSupervisorApprove} style={{ background: '#059669', padding: '5px 12px', fontSize: '0.75rem' }}>✓ Approve & Sign-off</button>
                        <button className="btn-outline" onClick={() => setShowSupervisorRejectForm(true)} style={{ borderColor: '#EF4444', color: '#DC2626', padding: '5px 12px', fontSize: '0.75rem' }}>✗ Request Corrections</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                    {finalSub.comments?.filter(c => c.text?.includes('supervisor') || c.text?.includes('Supervisor')).map((c, i) => (
                      <div key={i} style={{ marginTop: 4 }}><strong>{c.authorName}:</strong> "{c.text}" <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>({new Date(c.createdAt).toLocaleDateString()})</span></div>
                    ))}
                  </div>
                )}

                {showSupervisorRejectForm && (
                  <form onSubmit={handleSupervisorReject} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12, background: '#FFF5F5', padding: 12, borderRadius: 8, border: '1px solid #FCA5A5' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#C53030' }}>Request Corrections (Supervisor)</div>
                    <textarea className="form-input" rows="2" placeholder="List corrections needed..." value={supervisorRejectComment} onChange={e => setSupervisorRejectComment(e.target.value)} required />
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button type="button" className="btn-outline" onClick={() => setShowSupervisorRejectForm(false)} style={{ padding: '4px 10px', fontSize: '0.72rem' }}>Cancel</button>
                      <button type="submit" className="btn-primary" style={{ background: '#E53E3E', padding: '4px 12px', fontSize: '0.72rem' }}>Send Back to Student</button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Step 3: HOD Final Digital Sign-off */}
            {finalSub.status !== 'PENDING' && ['PENDING_HOD', 'APPROVED', 'SUBMITTED', 'AWARDED'].includes(finalSub.status) && (
              <div className="usm-card" style={{ borderLeft: `4px solid ${['APPROVED', 'SUBMITTED', 'AWARDED'].includes(finalSub.status) ? '#10B981' : '#3B82F6'}`, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800 }}>Step 3: HOD Final Digital Sign-off</h4>
                  <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700, background: ['APPROVED', 'SUBMITTED', 'AWARDED'].includes(finalSub.status) ? '#D1FAE5' : '#DBEAFE', color: ['APPROVED', 'SUBMITTED', 'AWARDED'].includes(finalSub.status) ? '#065F46' : '#1E40AF' }}>
                    {['APPROVED', 'SUBMITTED', 'AWARDED'].includes(finalSub.status) ? 'Approved' : 'Pending HOD Approval'}
                  </span>
                </div>

                {finalSub.status === 'PENDING_HOD' ? (
                  <div style={{ fontSize: '0.82rem' }}>
                    <p style={{ color: '#475569', margin: '0 0 10px 0' }}>Supervisor signed off. Review document and approve to dispatch external examiners.</p>
                    {isHOD && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-primary" onClick={handleHodApprove} style={{ background: '#059669', padding: '5px 12px', fontSize: '0.75rem' }}>✓ Approve & Sign-off</button>
                        <button className="btn-outline" onClick={() => setShowHodRejectForm(true)} style={{ borderColor: '#EF4444', color: '#DC2626', padding: '5px 12px', fontSize: '0.75rem' }}>✗ Request Corrections</button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.82rem', color: '#64748B' }}>
                    <span>HOD digitally approved the thesis finalbound package. Unlocked examiner dispatch tracking.</span>
                  </div>
                )}

                {showHodRejectForm && (
                  <form onSubmit={handleHodReject} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12, background: '#FFF5F5', padding: 12, borderRadius: 8, border: '1px solid #FCA5A5' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#C53030' }}>Request Corrections (HOD)</div>
                    <textarea className="form-input" rows="2" placeholder="List corrections needed..." value={hodRejectComment} onChange={e => setHodRejectComment(e.target.value)} required />
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button type="button" className="btn-outline" onClick={() => setShowHodRejectForm(false)} style={{ padding: '4px 10px', fontSize: '0.72rem' }}>Cancel</button>
                      <button type="submit" className="btn-primary" style={{ background: '#E53E3E', padding: '4px 12px', fontSize: '0.72rem' }}>Send Back to Student</button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Step 4: Dispatch Tracking */}
            {finalSub.status !== 'PENDING' && ['APPROVED', 'SUBMITTED', 'AWARDED'].includes(finalSub.status) && (
              <div className="usm-card" style={{ borderLeft: `4px solid ${thesis.dispatchDate ? '#10B981' : '#F59E0B'}`, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800 }}>Step 4: External Evaluation Dispatch Tracking</h4>
                  <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700, background: thesis.dispatchDate ? '#D1FAE5' : '#FEF3C7', color: thesis.dispatchDate ? '#065F46' : '#92400E' }}>
                    {thesis.dispatchDate ? 'Dispatched' : 'Awaiting Dispatch'}
                  </span>
                </div>

                {thesis.dispatchDate ? (
                  <div style={{ fontSize: '0.82rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
                    <div><strong>Dispatch Date:</strong> {new Date(thesis.dispatchDate).toLocaleDateString()}</div>
                    <div><strong>Method:</strong> {thesis.dispatchMethod}</div>
                    <div style={{ gridColumn: 'span 2' }}><strong>Tracking Number / Reference:</strong> {thesis.dispatchTrackingNumber || 'None'}</div>
                    {(isHOD || isAdmin) && (
                      <button onClick={() => setShowDispatchForm(true)} className="btn-outline" style={{ gridColumn: 'span 2', alignSelf: 'flex-start', padding: '4px 8px', fontSize: '0.72rem', marginTop: 8 }}>Edit Dispatch Details</button>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: '0.82rem' }}>
                    <p style={{ color: '#475569', margin: '0 0 10px 0' }}>Log details when physical or digital bound thesis is dispatched offline to external examiners.</p>
                    {(isHOD || isAdmin) && !showDispatchForm && (
                      <button onClick={() => setShowDispatchForm(true)} className="btn-primary" style={{ background: '#EA580C', padding: '5px 12px', fontSize: '0.75rem' }}>Log Dispatch Details</button>
                    )}
                  </div>
                )}

                {showDispatchForm && (isHOD || isAdmin) && (
                  <form onSubmit={handleDispatch} style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0', marginTop: 8 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Dispatch Date</label>
                        <input type="date" className="form-input" value={dispatchForm.dispatchDate} onChange={e => setDispatchForm({ ...dispatchForm, dispatchDate: e.target.value })} required />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Dispatch Method</label>
                        <select className="form-input" value={dispatchForm.dispatchMethod} onChange={e => setDispatchForm({ ...dispatchForm, dispatchMethod: e.target.value })} required>
                          <option value="Speed Post">Speed Post</option>
                          <option value="Registered Post">Registered Post</option>
                          <option value="DHL Courier">DHL Courier</option>
                          <option value="Official Courier">Official Courier</option>
                          <option value="Secure Email">Secure Email</option>
                          <option value="Hand Delivery">Hand Delivery</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Tracking Code / Dispatch Reference Number</label>
                      <input type="text" className="form-input" placeholder="e.g. HPU-EXAM-PHD-2026-99" value={dispatchForm.dispatchTrackingNumber} onChange={e => setDispatchForm({ ...dispatchForm, dispatchTrackingNumber: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button type="button" className="btn-outline" onClick={() => setShowDispatchForm(false)} style={{ padding: '4px 10px', fontSize: '0.72rem' }}>Cancel</button>
                      <button type="submit" className="btn-primary" style={{ background: '#EA580C', padding: '4px 12px', fontSize: '0.72rem' }}>Save Dispatch Details</button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Step 5: External Evaluation */}
            {thesis.dispatchDate && (
              <div className="usm-card" style={{ borderLeft: `4px solid ${thesis.externalEvaluationStatus === 'SUCCESSFUL' ? '#10B981' : thesis.externalEvaluationStatus === 'FAILED' ? '#EF4444' : '#F59E0B'}`, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800 }}>Step 5: External Examiner Evaluation Results</h4>
                  <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700, background: thesis.externalEvaluationStatus === 'SUCCESSFUL' ? '#D1FAE5' : thesis.externalEvaluationStatus === 'FAILED' ? '#FEE2E2' : '#FEF3C7', color: thesis.externalEvaluationStatus === 'SUCCESSFUL' ? '#065F46' : thesis.externalEvaluationStatus === 'FAILED' ? '#991B1B' : '#92400E' }}>
                    {thesis.externalEvaluationStatus === 'SUCCESSFUL' ? 'Successful' : thesis.externalEvaluationStatus === 'FAILED' ? 'Failed / Rejected' : 'Awaiting Reports'}
                  </span>
                </div>

                {thesis.externalEvaluationStatus !== 'PENDING' ? (
                  <div style={{ fontSize: '0.82rem' }}>
                    <div><strong>Logged On:</strong> {thesis.externalEvaluationLoggedAt ? new Date(thesis.externalEvaluationLoggedAt).toLocaleString() : 'N/A'}</div>
                    <div style={{ marginTop: 4, background: '#F8FAFC', padding: 8, borderRadius: 6, border: '1px solid #E2E8F0' }}>
                      <strong>Evaluation Comments / Remarks:</strong>
                      <div style={{ fontStyle: 'italic', marginTop: 2 }}>"{thesis.externalEvaluationRemarks || 'No remarks recorded'}"</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.82rem' }}>
                    <p style={{ color: '#475569', margin: '0 0 10px 0' }}>Examiners reports received? Record evaluation outcome. A successful outcome unlocks scheduling of the final Viva-Voce defense.</p>
                    {(isHOD || isAdmin) && !showEvalOutcomeForm && (
                      <button onClick={() => setShowEvalOutcomeForm(true)} className="btn-primary" style={{ background: '#3B82F6', padding: '5px 12px', fontSize: '0.75rem' }}>Log Evaluation Outcome</button>
                    )}
                  </div>
                )}

                {showEvalOutcomeForm && (isHOD || isAdmin) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0', marginTop: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.75rem', color: '#1E3A8A' }}>Select Evaluation Outcome</div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>Remarks / MoM Summary</label>
                      <textarea className="form-input" rows="2" placeholder="Detail examiner ratings and remarks..." value={evalRemarks} onChange={e => setEvalRemarks(e.target.value)} required />
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button type="button" className="btn-outline" onClick={() => setShowEvalOutcomeForm(false)} style={{ padding: '4px 10px', fontSize: '0.72rem' }}>Cancel</button>
                      <button onClick={() => handleEvalOutcome('FAILED')} className="btn-primary" style={{ background: '#DC2626', padding: '4px 12px', fontSize: '0.72rem' }}>Reject / Fail</button>
                      <button onClick={() => handleEvalOutcome('SUCCESSFUL')} className="btn-primary" style={{ background: '#10B981', padding: '4px 12px', fontSize: '0.72rem' }}>Accept / Successful</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 6: Viva-Voce Oral Defense */}
            {thesis.externalEvaluationStatus === 'SUCCESSFUL' && (
              <div className="usm-card" style={{ borderLeft: `4px solid ${thesis.vivaStatus === 'SUCCESSFUL' ? '#10B981' : thesis.vivaStatus === 'UNSUCCESSFUL' ? '#EF4444' : thesis.vivaStatus === 'SCHEDULED' ? '#3B82F6' : '#94A3B8'}`, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800 }}>Step 6: Viva-Voce oral defense seminar (Colloquium)</h4>
                  <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700, background: thesis.vivaStatus === 'SUCCESSFUL' ? '#D1FAE5' : thesis.vivaStatus === 'UNSUCCESSFUL' ? '#FEE2E2' : thesis.vivaStatus === 'SCHEDULED' ? '#DBEAFE' : '#E2E8F0', color: thesis.vivaStatus === 'SUCCESSFUL' ? '#065F46' : thesis.vivaStatus === 'UNSUCCESSFUL' ? '#991B1B' : thesis.vivaStatus === 'SCHEDULED' ? '#1E40AF' : '#475569' }}>
                    {thesis.vivaStatus === 'SUCCESSFUL' ? 'Passed / Successful' : thesis.vivaStatus === 'UNSUCCESSFUL' ? 'Corrections Required' : thesis.vivaStatus === 'SCHEDULED' ? 'Scheduled' : 'Awaiting Schedule'}
                  </span>
                </div>

                {thesis.vivaStatus !== 'NOT_SCHEDULED' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', fontSize: '0.82rem', marginBottom: 8 }}>
                    <div><strong>Date:</strong> {thesis.vivaDate ? new Date(thesis.vivaDate).toLocaleDateString() : 'N/A'}</div>
                    <div><strong>Time:</strong> {thesis.vivaTime}</div>
                    <div><strong>Venue:</strong> {thesis.vivaVenue}</div>
                    <div><strong>Board Panel:</strong> {thesis.vivaPanel || 'None'}</div>
                    {thesis.vivaRemarks && (
                      <div style={{ gridColumn: 'span 2', background: '#F8FAFC', padding: 8, borderRadius: 6, border: '1px solid #E2E8F0', marginTop: 4 }}>
                        <strong>Board Committee Decision Notes:</strong>
                        <div style={{ fontStyle: 'italic', marginTop: 2 }}>"{thesis.vivaRemarks}"</div>
                      </div>
                    )}
                  </div>
                )}

                {thesis.vivaStatus === 'NOT_SCHEDULED' && (isHOD || isAdmin) && !showVivaForm && (
                  <button onClick={() => setShowVivaForm(true)} className="btn-primary" style={{ background: '#3B82F6', padding: '5px 12px', fontSize: '0.75rem' }}>Schedule Viva-Voce Defense</button>
                )}

                {thesis.vivaStatus === 'SCHEDULED' && (isHOD || isAdmin) && !showVivaOutcomeForm && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setShowVivaOutcomeForm(true)} className="btn-primary" style={{ background: '#059669', padding: '5px 12px', fontSize: '0.75rem' }}>Record Defense Outcome</button>
                    <button onClick={() => {
                      setVivaForm({
                        vivaDate: thesis.vivaDate ? new Date(thesis.vivaDate).toISOString().substring(0, 10) : '',
                        vivaTime: thesis.vivaTime || '',
                        vivaVenue: thesis.vivaVenue || '',
                        vivaPanel: thesis.vivaPanel || ''
                      });
                      setShowVivaForm(true);
                    }} className="btn-outline" style={{ padding: '5px 12px', fontSize: '0.75rem' }}>Reschedule</button>
                  </div>
                )}

                {thesis.vivaStatus === 'UNSUCCESSFUL' && (isHOD || isAdmin) && !showVivaForm && (
                  <button onClick={() => {
                    setVivaForm({ vivaDate: '', vivaTime: '', vivaVenue: '', vivaPanel: '' });
                    setShowVivaForm(true);
                  }} className="btn-primary" style={{ background: '#EA580C', padding: '5px 12px', fontSize: '0.75rem' }}>Re-schedule Viva-Voce Defense</button>
                )}

                {showVivaForm && (isHOD || isAdmin) && (
                  <form onSubmit={handleScheduleViva} style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0', marginTop: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.75rem', color: '#1E40AF' }}>Schedule Viva-Voce Session</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: '#475569', marginBottom: 4 }}>Date</label>
                        <input type="date" className="form-input" value={vivaForm.vivaDate} onChange={e => setVivaForm({ ...vivaForm, vivaDate: e.target.value })} required />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: '#475569', marginBottom: 4 }}>Time</label>
                        <input type="text" className="form-input" placeholder="e.g. 12:00 PM" value={vivaForm.vivaTime} onChange={e => setVivaForm({ ...vivaForm, vivaTime: e.target.value })} required />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: '#475569', marginBottom: 4 }}>Venue</label>
                      <input type="text" className="form-input" placeholder="e.g. Science Colloquium Hall" value={vivaForm.vivaVenue} onChange={e => setVivaForm({ ...vivaForm, vivaVenue: e.target.value })} required />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: '#475569', marginBottom: 4 }}>Panel Members</label>
                      <input type="text" className="form-input" placeholder="External Examiner, Supervisor, DRC members" value={vivaForm.vivaPanel} onChange={e => setVivaForm({ ...vivaForm, vivaPanel: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button type="button" className="btn-outline" onClick={() => setShowVivaForm(false)} style={{ padding: '4px 10px', fontSize: '0.72rem' }}>Cancel</button>
                      <button type="submit" className="btn-primary" style={{ background: '#3B82F6', padding: '4px 12px', fontSize: '0.72rem' }}>Save Viva Schedule</button>
                    </div>
                  </form>
                )}

                {showVivaOutcomeForm && (isHOD || isAdmin) && (
                  <form onSubmit={handleRecordVivaOutcome} style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0', marginTop: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.75rem', color: '#047857' }}>Record Oral Defense Decision</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: '#475569', marginBottom: 4 }}>Decision</label>
                        <select className="form-input" value={vivaOutcomeForm.vivaStatus} onChange={e => setVivaOutcomeForm({ ...vivaOutcomeForm, vivaStatus: e.target.value })} required>
                          <option value="SUCCESSFUL">SUCCESSFUL (Clear & Pass)</option>
                          <option value="UNSUCCESSFUL">UNSUCCESSFUL (Revisions Required / Fail)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.7rem', color: '#475569', marginBottom: 4 }}>Defense Board Comments / Remarks</label>
                        <textarea className="form-input" rows="2" placeholder="Details of corrections or approval reasons..." value={vivaOutcomeForm.remarks} onChange={e => setVivaOutcomeForm({ ...vivaOutcomeForm, remarks: e.target.value })} required />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button type="button" className="btn-outline" onClick={() => setShowVivaOutcomeForm(false)} style={{ padding: '4px 10px', fontSize: '0.72rem' }}>Cancel</button>
                      <button type="submit" className="btn-primary" style={{ background: '#059669', padding: '4px 12px', fontSize: '0.72rem' }}>Save Viva Decision</button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderAwardDegree = () => {
    const isVivaSuccessful = thesis.vivaStatus === 'SUCCESSFUL';
    const isHOD = subRole === 'HOD';
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    const canAward = isHOD || isAdmin;
    const isAwarded = thesis.status === 'AWARDED';

    if (!isVivaSuccessful) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', textAlign: 'center', gap: 16 }}>
          <div style={{ fontSize: '4rem' }}>🔒</div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--color-text, #1F2937)' }}>Award Degree Section Locked</h3>
          <p style={{ color: 'var(--color-text-secondary, #64748B)', fontSize: '0.85rem', maxWidth: 460, lineHeight: 1.5, margin: 0 }}>
            This section becomes available once the candidate has successfully cleared their Viva-Voce oral defense colloquium. Please record the successful Viva-Voce outcome first.
          </p>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="usm-section-title">🎓 Ph.D. Degree Award Clearance & Verification</div>

        {/* Eligibility Checklist */}
        <div className="usm-card" style={{ padding: 18 }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text, #1F2937)' }}>📋 Ph.D. Requirements Checklist Verification</h4>
          {eligibilityLoading ? (
            <div style={{ fontSize: '0.85rem', color: '#64748B' }}>Loading requirements database checks...</div>
          ) : eligibilityData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {eligibilityData.checklist.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', padding: '6px 12px', background: item.status ? '#ECFDF5' : '#FEF2F2', borderRadius: 8, border: `1px solid ${item.status ? '#A7F3D0' : '#FCA5A5'}`, fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '1.1rem', color: item.status ? '#059669' : '#EF4444' }}>{item.status ? '✓' : '✗'}</span>
                    <strong style={{ color: 'var(--color-text, #1F2937)' }}>{item.name}</strong>
                  </div>
                  <div style={{ color: item.status ? '#047857' : '#B91C1C', fontWeight: 600 }}>{item.details}</div>
                </div>
              ))}

              {!eligibilityData.eligible && (
                <div style={{ marginTop: 12, padding: 12, background: '#FEF3C7', borderLeft: '4px solid #F59E0B', borderRadius: 8, color: '#B45309', fontSize: '0.82rem', fontWeight: 600 }}>
                  ⚠️ Scholar is not eligible for degree award because one or more verification checks have not been met.
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: '0.85rem', color: '#64748B' }}>Failed to verify requirements checks.</div>
          )}
        </div>

        {/* Progression Timeline & Logs */}
        <div className="usm-card" style={{ padding: 18 }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text, #1F2937)' }}>📜 Full Timelines & Detailed Log</h4>
          {!thesis.auditLog || thesis.auditLog.length === 0 ? (
            <div style={{ color: '#64748B', fontSize: '0.82rem' }}>No progression log entries.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '200px', overflowY: 'auto', paddingRight: 4, background: '#F8FAFC', padding: 10, borderRadius: 8, border: '1px solid #E2E8F0' }}>
              {[...thesis.auditLog].map((log, index) => (
                <div key={log._id || index} style={{ fontSize: '0.78rem', display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: 6 }}>
                  <div>
                    <span style={{ fontWeight: 800, color: '#4F46E5', marginRight: 8 }}>{log.action}</span>
                    <span style={{ color: 'var(--color-text, #1F2937)' }}>{log.note}</span>
                  </div>
                  <span style={{ color: '#94A3B8', fontSize: '0.72rem' }}>{new Date(log.date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Degree Award Action Card */}
        <div className="usm-card" style={{ borderLeft: `4px solid ${isAwarded ? '#10B981' : '#E2E8F0'}`, padding: 18 }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text, #1F2937)' }}>🎓 Degree Award Status</h4>
          
          {isAwarded ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.82rem' }}>
              <div><strong>Ph.D. Degree Awarded On:</strong> {thesis.awardedAt ? new Date(thesis.awardedAt).toLocaleDateString() : 'N/A'}</div>
              <div style={{ background: '#ECFDF5', padding: 8, borderRadius: 6, color: '#065F46', marginTop: 4 }}>
                <strong>Clearance Decision Note:</strong> "{thesis.auditLog?.find(l => l.action === 'DEGREE_AWARDED')?.note || 'Awarded after successfully clearing all Ph.D. lifecycle evaluation criteria.'}"
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ color: '#475569', fontSize: '0.82rem', margin: 0 }}>Record Himachal Pradesh University Academic Board award clearance note and click Award Degree to complete Ph.D. lifecycle.</p>
              
              {canAward && (
                <form onSubmit={handleAwardDegree} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <textarea
                    className="form-input"
                    rows="2"
                    placeholder="Enter academic notification reference... e.g. Passed Academic Council vide Ref HPU-PHD-2026-991"
                    value={awardForm.note}
                    onChange={e => setAwardForm({ ...awardForm, note: e.target.value })}
                    required
                  />
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading || !eligibilityData?.eligible}
                    style={{ background: '#10B981', alignSelf: 'flex-start', padding: '6px 20px', fontSize: '0.82rem' }}
                  >
                    {loading ? 'Awarding...' : '🎓 Concluding & Award Degree'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAudit = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="usm-section-title">📜 Complete Lifecycle Audit Log</div>

      {/* Lifecycle checklist */}
      <div className="usm-stats">
        <div className="usm-stat-card"><div className="usm-stat-value" style={{ color: thesis.courseworkCompleted ? '#059669' : '#D97706', fontSize: '0.9rem' }}>{thesis.courseworkCompleted ? 'Completed ✅' : 'Pending ⏳'}</div><div className="usm-stat-label">Coursework</div></div>
        <div className="usm-stat-card"><div className="usm-stat-value" style={{ color: thesis.enrollmentVerified ? '#059669' : '#D97706', fontSize: '0.9rem' }}>{thesis.enrollmentVerified ? 'Verified ✅' : 'Pending ⏳'}</div><div className="usm-stat-label">Enrollment</div></div>

        <div className="usm-stat-card"><div className="usm-stat-value" style={{ fontSize: '0.85rem' }}>{thesis.startDate ? new Date(thesis.startDate).toLocaleDateString() : 'N/A ⏳'}</div><div className="usm-stat-label">Research Start</div></div>
      </div>

      {/* Audit log entries */}
      {!thesis.auditLog || thesis.auditLog.length === 0 ? (
        <div className="usm-card" style={{ textAlign: 'center', color: '#64748B', fontSize: '0.82rem' }}>No audit logs yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '400px', overflowY: 'auto', paddingRight: 4 }}>
          {[...thesis.auditLog].reverse().map((log, index) => (
            <div key={log._id || index} className="usm-card" style={{ padding: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{log.action}</span>
                <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{new Date(log.date).toLocaleString()}</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-text, #1F2937)', fontWeight: 500, marginTop: 4 }}>{log.note}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'profile': return renderProfile();
      case 'coursework': return renderCoursework();
      case 'synopsis': return renderSynopsis();
      case 'drc': return renderDRC();
      case 'rac': return renderRAC();
      case 'reports': return renderReportsOrChapters('reports');
      case 'chapters': return renderReportsOrChapters('chapters');
      case 'publications': return renderPublications();
      case 'preSubmission': return renderPreSubmission();
      case 'finalSubmission': return renderFinalSubmission();
      case 'awardDegree': return renderAwardDegree();
      case 'documents': return renderDocuments();
      case 'changes': return renderChanges();
      case 'audit': return renderAudit();
      default: return renderOverview();
    }
  };

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════
  return (
    <>
      <div className="usm-overlay">
        <div className="usm-container">
          {/* Header */}
          <div className="usm-header">
            <div className="usm-header-info">
              <div className="usm-header-title">
                {thesis.scholarId?.name || 'Scholar'}
                <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: '0.72rem', fontWeight: 700, background: badge.bg, color: badge.color }}>{badge.text}</span>
              </div>
              <div className="usm-header-subtitle">
                <span>📝 {thesis.title?.substring(0, 60)}{thesis.title?.length > 60 ? '...' : ''}</span>
                <span>🏫 {thesis.department}</span>
                {thesis.supervisorId?.name && <span>👨‍🏫 {thesis.supervisorId.name}</span>}
                <span>🔢 {thesis.enrollmentNumber}</span>
              </div>
            </div>
            <div className="usm-header-actions">
              {!isReadOnly && isSupervisor && !['SUBMITTED', 'AWARDED'].includes(thesis.status) && (
                <button onClick={() => setShowTransferModal(true)} className="btn-outline" style={{ borderColor: '#F59E0B', color: '#B45309', padding: '5px 10px', fontSize: '0.75rem', fontWeight: 700 }}>Transfer</button>
              )}
              <button className="usm-close-btn" onClick={onClose}>✕</button>
            </div>
          </div>

          {/* Body */}
          <div className="usm-body">
            {/* Left Tabs */}
            <div className="usm-tabs">
              {tabs.map(tab => (
                <button key={tab.key} className={`usm-tab ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
                  <span className="usm-tab-icon">{tab.icon}</span>
                  {tab.label}
                  {tab.key === 'profile' && !isReadOnly && subRole === 'HOD' && (!thesis.enrollmentVerified || thesis.status === 'REGISTRATION_PENDING') && (
                    <AlertTriangle 
                      size={16} 
                      title="Needs attention: verify credentials"
                      style={{ marginLeft: '8px', color: '#EF4444', fill: '#FEE2E2', display: 'inline-block', verticalAlign: 'middle', cursor: 'help' }}
                    />
                  )}
                  {tab.key === 'coursework' && !isReadOnly && (
                    (user.role === 'FACULTY' && isSupervisor && thesis.courseworkStatus === 'PENDING_FACULTY') ||
                    (subRole === 'HOD' && thesis.courseworkStatus === 'PENDING_HOD')
                  ) && (
                    <AlertTriangle 
                      size={16} 
                      title="Needs attention: verify coursework details"
                      style={{ marginLeft: '8px', color: '#EF4444', fill: '#FEE2E2', display: 'inline-block', verticalAlign: 'middle', cursor: 'help' }}
                    />
                  )}
                  {tab.key === 'synopsis' && !isReadOnly && (() => {
                    const status = milestones.find(m => m.type === 'SYNOPSIS')?.status;
                    return (
                      (subRole === 'HOD' && status === 'PENDING_HOD') ||
                      (subRole !== 'HOD' && isSupervisor && status === 'SUBMITTED')
                    );
                  })() && (
                    <AlertTriangle 
                      size={16} 
                      title="Needs attention: verify synopsis document"
                      style={{ marginLeft: '8px', color: '#EF4444', fill: '#FEE2E2', display: 'inline-block', verticalAlign: 'middle', cursor: 'help' }}
                    />
                  )}
                  {tab.badge && <span className="usm-tab-badge">{tab.badge}</span>}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="usm-content">
              {renderTabContent()}
            </div>
          </div>
        </div>

        {/* Transfer Overlay */}
        {showTransferModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <form onSubmit={handleTransfer} style={{ background: '#FFFBEB', border: '1px solid #FDE68A', padding: 24, borderRadius: 12, width: '400px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#92400E', marginBottom: 8 }}>Transfer Supervision</div>
              <p style={{ fontSize: '0.8rem', color: '#B45309', marginBottom: 16 }}>This will permanently transfer this scholar to another verified faculty in {thesis.department}.</p>
              <select className="form-input" value={transferTargetId} onChange={e => setTransferTargetId(e.target.value)} required style={{ width: '100%', padding: '8px', fontSize: '0.9rem', borderColor: '#FCD34D', marginBottom: 16 }}>
                <option value="">-- Select Faculty/HOD --</option>
                {allFaculties.map(f => <option key={f._id} value={f._id}>{f.name} ({f.subRole === 'HOD' ? 'HOD' : 'Faculty'})</option>)}
              </select>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-outline" onClick={() => setShowTransferModal(false)} style={{ borderColor: '#F59E0B', color: '#B45309' }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={transferLoading} style={{ background: '#D97706' }}>{transferLoading ? 'Transferring...' : 'Confirm Transfer'}</button>
              </div>
            </form>
          </div>
        )}

        {/* Bypass Validations Modal */}
        {showBypassModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 200002, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <form onSubmit={handleBypassSubmit} style={{ background: '#FFF7ED', border: '1px solid #FED7AA', padding: 28, borderRadius: 16, width: '100%', maxWidth: '460px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#C2410C' }}>Bypass Validation Checks</span>
              </div>
              
              <div style={{ background: '#FFEDD5', borderLeft: '4px solid #EA580C', padding: '12px 16px', borderRadius: 8, fontSize: '0.82rem', color: '#9A3412', marginBottom: 20, lineHeight: 1.5 }}>
                Are you sure you want to bypass all active research requirements (journals, conferences, minimum duration, etc.) and advance <strong>{thesis.scholarId?.name || 'the candidate'}</strong> directly to the <strong>Pre-Submission</strong> stage?
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#7C2D12', marginBottom: 6 }}>
                  Enter Justification / Bypass Remarks (Required)
                </label>
                <textarea 
                  className="form-input" 
                  rows={4} 
                  required
                  placeholder="e.g. Approved by DRC under special circumstances. Scholar has completed industrial publications." 
                  value={bypassRemarks} 
                  onChange={e => setBypassRemarks(e.target.value)}
                  style={{ width: '100%', fontSize: '0.88rem', borderColor: '#FED7AA', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#7C2D12', marginBottom: 6 }}>
                  Type <strong style={{ textTransform: 'none' }}>confirm</strong> to proceed
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  required
                  placeholder='Type "confirm"' 
                  value={bypassConfirmText} 
                  onChange={e => setBypassConfirmText(e.target.value)}
                  style={{ width: '100%', fontSize: '0.88rem', borderColor: '#FED7AA', background: '#FFFFFF' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn-outline" 
                  onClick={() => { setShowBypassModal(false); setBypassRemarks(''); setBypassConfirmText(''); }} 
                  style={{ borderColor: '#F97316', color: '#C2410C' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={bypassLoading || !bypassRemarks.trim() || bypassConfirmText.trim().toLowerCase() !== 'confirm'} 
                  style={{ 
                    background: (bypassLoading || !bypassRemarks.trim() || bypassConfirmText.trim().toLowerCase() !== 'confirm') ? '#E2E8F0' : '#EA580C', 
                    color: (bypassLoading || !bypassRemarks.trim() || bypassConfirmText.trim().toLowerCase() !== 'confirm') ? '#94A3B8' : 'white', 
                    border: 'none', 
                    borderRadius: '8px', 
                    cursor: (bypassLoading || !bypassRemarks.trim() || bypassConfirmText.trim().toLowerCase() !== 'confirm') ? 'not-allowed' : 'pointer' 
                  }}
                >
                  {bypassLoading ? 'Saving...' : 'Bypass & Save'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Provisional Synopsis Clearance Confirmation Modal */}
        {showProvisionalClearModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 200002, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (provisionalConfirmText.trim().toLowerCase() !== 'confirm') return;
                setShowProvisionalClearModal(false);
                handleProvisionalSynopsisClear();
              }} 
              style={{ background: '#FFFDF5', border: '1px solid #FDE68A', padding: 28, borderRadius: 16, width: '100%', maxWidth: '460px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                <span style={{ fontWeight: 800, fontSize: '1.2rem', color: '#B45309' }}>Confirm Provisional Clearance</span>
              </div>
              
              <div style={{ background: '#FFFBEB', borderLeft: '4px solid #F59E0B', padding: '12px 16px', borderRadius: 8, fontSize: '0.82rem', color: '#92400E', marginBottom: 20, lineHeight: 1.5 }}>
                Are you absolutely sure you want to bypass the standard synopsis presentation and defense? This transitions <strong>{thesis.scholarId?.name || 'the candidate'}</strong> directly to the <strong>Active Research</strong> phase. The option to upload the synopsis will remain open, and approval remains mandatory before Pre-Submission can start.
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#92400E', marginBottom: 6 }}>
                  Type <strong style={{ textTransform: 'none' }}>confirm</strong> to proceed
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  required
                  placeholder='Type "confirm"' 
                  value={provisionalConfirmText} 
                  onChange={e => setProvisionalConfirmText(e.target.value)}
                  style={{ width: '100%', fontSize: '0.88rem', borderColor: '#FDE68A', background: '#FFFFFF' }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => { setShowProvisionalClearModal(false); setProvisionalConfirmText(''); }}
                  className="btn-outline" 
                  style={{ padding: '8px 16px', fontSize: '0.85rem', borderColor: '#CBD5E1', color: '#475569' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={provisionalConfirmText.trim().toLowerCase() !== 'confirm'}
                  style={{ padding: '8px 20px', fontSize: '0.85rem', background: provisionalConfirmText.trim().toLowerCase() === 'confirm' ? '#D97706' : '#E2E8F0', color: provisionalConfirmText.trim().toLowerCase() === 'confirm' ? '#FFFFFF' : '#94A3B8', border: 'none', cursor: provisionalConfirmText.trim().toLowerCase() === 'confirm' ? 'pointer' : 'not-allowed' }}
                >
                  Confirm Clearance
                </button>
              </div>
            </form>
          </div>
        )}
      </div>


      {/* Sub-modals via portal */}
      {selectedEvalDoc && createPortal(
        <DocEvalModal doc={selectedEvalDoc} onClose={() => setSelectedEvalDoc(null)} onRefresh={refreshAll} />,
        document.body
      )}
      {selectedRAC && createPortal(
        <RACReviewModal rac={selectedRAC} onClose={() => setSelectedRAC(null)} onSave={handleRacGrade} />,
        document.body
      )}
    </>
  );
};

export default UnifiedScholarModal;
