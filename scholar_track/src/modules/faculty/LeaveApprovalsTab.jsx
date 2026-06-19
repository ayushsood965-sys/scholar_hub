import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { CheckCircle, XCircle } from 'lucide-react';

const LeaveApprovalsTab = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const api = useApi();
  const toast = useToast();

  const fetchApprovals = async () => {
    try {
      // Assuming faculty can only see leaves for students they advise, or based on their dept.
      // Or maybe there's a specific route for faculty approvals.
      const res = await api.get('/attendance/leave/pending'); 
      setLeaves(res.data);
    } catch (err) {
      toast.error('Failed to load pending leaves');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApprovals(); }, []);

  const handleAction = async (id, action) => {
    try {
      await api.put(`/attendance/leave/${id}/action`, { action, remarks: `Faculty ${action}` });
      toast.success(`Leave ${action.toLowerCase()} successfully`);
      fetchApprovals();
    } catch (err) {
      toast.error('Error processing leave');
    }
  };

  const columns = [
    { header: 'Student Name', accessor: (row) => row.studentId?.name || 'Unknown' },
    { header: 'Leave Type', accessor: 'leaveType' },
    { header: 'Dates', accessor: (row) => `${new Date(row.startDate).toLocaleDateString()} - ${new Date(row.endDate).toLocaleDateString()}` },
    { header: 'Reason', accessor: 'reason' },
    {
      header: 'Actions',
      accessor: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-sm" style={{ background: '#10B981', color: '#fff' }} onClick={() => handleAction(row._id, 'APPROVE')}>
            <CheckCircle size={16} />
          </button>
          <button className="btn btn-sm" style={{ background: '#EF4444', color: '#fff' }} onClick={() => handleAction(row._id, 'REJECT')}>
            <XCircle size={16} />
          </button>
        </div>
      )
    }
  ];

  if (loading) return <SkeletonLoader count={1} height={400} />;

  return (
    <div className="glass-panel p-xl">
      <div className="mb-lg">
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Leave Approvals</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Approve or reject leave requests from your students.</p>
      </div>
      <DataTable columns={columns} data={leaves} />
    </div>
  );
};

export default LeaveApprovalsTab;
