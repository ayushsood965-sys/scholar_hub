import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { CheckCircle, XCircle, FileText, Calendar, Clock, Hash } from 'lucide-react';
import { API_BASE_URL } from '../../config';

const LeaveApprovalsTab = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionRemarks, setActionRemarks] = useState({});
  const [processing, setProcessing] = useState({});

  const api = useApi();
  const toast = useToast();

  const fetchApprovals = async () => {
    try {
      const res = await api.get('/attendance/leave/pending');
      // Faculty should only see PENDING_SUPERVISOR leaves
      const filtered = res.data.filter(l => l.status === 'PENDING_SUPERVISOR');
      setLeaves(filtered);
    } catch (err) {
      toast.error('Failed to load pending leaves');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApprovals(); }, []);

  const handleAction = async (id, action) => {
    const remarks = actionRemarks[id] || '';
    if (!remarks || remarks.trim().length < 5) {
      return toast.error('Please provide remarks (at least 5 characters) before proceeding.');
    }
    setProcessing(prev => ({ ...prev, [id]: action }));
    try {
      const res = await api.put(`/attendance/leave/${id}/action`, { action, remarks: remarks.trim() });
      const actionLabel = action === 'RECOMMEND' ? 'Recommended to HOD' : action === 'APPROVE' ? 'Approved' : 'Rejected';
      toast.success(`Leave ${actionLabel} successfully`);
      setActionRemarks(prev => ({ ...prev, [id]: '' }));
      fetchApprovals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error processing leave');
    } finally {
      setProcessing(prev => ({ ...prev, [id]: null }));
    }
  };

  const statusBadge = (status) => {
    const map = {
      PENDING_SUPERVISOR: { cls: 'badge-warning', label: 'Pending Review' },
      PENDING_HOD: { cls: 'badge-warning', label: 'Pending HOD' },
      APPROVED: { cls: 'badge-success', label: 'Approved' },
      REJECTED: { cls: 'badge-danger', label: 'Rejected' }
    };
    const s = map[status] || { cls: 'badge-neutral', label: status };
    return <span className={`badge ${s.cls}`}>{s.label}</span>;
  };

  const columns = [
    {
      header: 'Student',
      accessor: (row) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
            {row.studentId?.name || 'Unknown'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
            {row.studentId?.username || ''} {row.studentId?.profile?.shNo ? `| SH: ${row.studentId.profile.shNo}` : ''}
          </div>
        </div>
      )
    },
    { header: 'Leave Type', accessor: (row) => <span style={{ fontSize: '0.85rem' }}>{row.leaveType || 'N/A'}</span> },
    {
      header: 'Duration',
      accessor: (row) => (
        <div style={{ fontSize: '0.82rem' }}>
          <div>{new Date(row.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {new Date(row.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>
            <Calendar size={10} style={{ display: 'inline', marginRight: 2 }} />
            {row.totalDays} day{row.totalDays > 1 ? 's' : ''}
          </div>
        </div>
      )
    },
    {
      header: 'Document',
      accessor: (row) => row.documentUrl ? (
        <a
          href={`${API_BASE_URL}${row.documentUrl}`}
          target="_blank"
          rel="noreferrer"
          className="btn btn-sm btn-outline"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
        >
          <FileText size={12} /> View File
        </a>
      ) : (
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>No file</span>
      )
    },
    {
      header: 'Applied On',
      accessor: (row) => (
        <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
          <Clock size={10} style={{ display: 'inline', marginRight: 2 }} />
          {new Date(row.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      )
    },
    { header: 'Status', accessor: (row) => statusBadge(row.status) },
    {
      header: 'Remarks',
      accessor: (row) => (
        <input
          type="text"
          placeholder="Min 5 chars..."
          value={actionRemarks[row._id] || ''}
          onChange={e => setActionRemarks(prev => ({ ...prev, [row._id]: e.target.value }))}
          style={{
            width: '100%',
            minWidth: '120px',
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border-solid)',
            background: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            fontSize: '0.78rem',
            outline: 'none'
          }}
        />
      )
    },
    {
      header: 'Actions',
      accessor: (row) => {
        const isProcessing = processing[row._id];
        if (row.status === 'PENDING_SUPERVISOR') {
          return (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-sm btn-outline"
                style={{ borderColor: '#10B981', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => handleAction(row._id, 'RECOMMEND')}
                disabled={!!isProcessing}
              >
                <CheckCircle size={14} /> {isProcessing === 'RECOMMEND' ? '...' : 'Recommend'}
              </button>
              <button
                className="btn btn-sm btn-outline"
                style={{ borderColor: '#EF4444', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => handleAction(row._id, 'REJECT')}
                disabled={!!isProcessing}
              >
                <XCircle size={14} /> {isProcessing === 'REJECT' ? '...' : 'Reject'}
              </button>
            </div>
          );
        }
        if (row.status === 'PENDING_HOD') {
          return (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-sm btn-outline"
                style={{ borderColor: '#10B981', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => handleAction(row._id, 'APPROVE')}
                disabled={!!isProcessing}
              >
                <CheckCircle size={14} /> {isProcessing === 'APPROVE' ? '...' : 'Approve'}
              </button>
              <button
                className="btn btn-sm btn-outline"
                style={{ borderColor: '#EF4444', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => handleAction(row._id, 'REJECT')}
                disabled={!!isProcessing}
              >
                <XCircle size={14} /> {isProcessing === 'REJECT' ? '...' : 'Reject'}
              </button>
            </div>
          );
        }
        return <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>—</span>;
      }
    }
  ];

  if (loading) return <SkeletonLoader count={1} height={400} />;

  return (
    <div className="glass-panel p-xl">
      <div className="mb-lg">
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Leave Approvals</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Review, recommend, or reject leave requests from your students. Add remarks and click an action.
        </p>
      </div>

      {leaves.length === 0 ? (
        <div className="glass-panel p-xl" style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--color-text-muted)', marginBottom: '12px' }}>
            <CheckCircle size={48} style={{ margin: '0 auto', opacity: 0.3 }} />
          </div>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            No pending leave requests assigned to you.
          </p>
        </div>
      ) : (
        <DataTable columns={columns} data={leaves} />
      )}
    </div>
  );
};

export default LeaveApprovalsTab;
