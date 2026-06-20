import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { CheckCircle, XCircle } from 'lucide-react';

const CorrectionsTab = () => {
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);
  const api = useApi();
  const toast = useToast();

  const fetchApprovals = async () => {
    try {
      const res = await api.get('/attendance/corrections/pending');
      setCorrections(res.data);
    } catch (err) {
      toast.error('Failed to load pending corrections');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApprovals(); }, []);

  const handleAction = async (id, action) => {
    try {
      await api.put(`/attendance/corrections/${id}/action`, { action, remarks: `Faculty ${action}` });
      toast.success(`Correction ${action.toLowerCase()} successfully`);
      fetchApprovals();
    } catch (err) {
      toast.error('Error processing correction');
    }
  };

  const columns = [
    { header: 'Student Name', accessor: (row) => row.studentId?.name || 'Unknown' },
    { header: 'Record Date', accessor: (row) => row.recordId?.date ? new Date(row.recordId.date).toLocaleDateString() : 'Unknown' },
    { header: 'Requested Status', accessor: 'requestedStatus' },
    { header: 'Reason', accessor: 'reason' },
    {
      header: 'Actions',
      accessor: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-sm btn-outline" style={{ borderColor: '#10B981', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => handleAction(row._id, 'RECOMMEND')}>
            <CheckCircle size={14} /> Recommend
          </button>
          <button className="btn btn-sm btn-outline" style={{ borderColor: '#EF4444', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => handleAction(row._id, 'REJECT')}>
            <XCircle size={14} /> Reject
          </button>
        </div>
      )
    }
  ];

  if (loading) return <SkeletonLoader count={1} height={400} />;

  return (
    <div className="glass-panel p-xl">
      <div className="mb-lg">
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Corrections Queue</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Approve or reject attendance correction requests.</p>
      </div>
      <DataTable columns={columns} data={corrections} />
    </div>
  );
};

export default CorrectionsTab;
