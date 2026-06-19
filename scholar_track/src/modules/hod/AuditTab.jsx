import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import SkeletonLoader from '../../components/ui/SkeletonLoader';

const AuditTab = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const api = useApi();
  const toast = useToast();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/attendance/dashboard/hod');
        setLogs(res.data.auditLogs || []);
      } catch (err) {
        toast.error('Failed to load audit logs');
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [api, toast]);

  const columns = [
    { header: 'Date', accessor: (row) => new Date(row.updatedAt).toLocaleString() },
    { header: 'Student', accessor: (row) => row.studentId?.name || 'Unknown' },
    { header: 'Record Date', accessor: (row) => new Date(row.date).toLocaleDateString() },
    { header: 'Marked By', accessor: (row) => row.markedBy?.name || 'System' },
    { 
      header: 'Status', 
      accessor: (row) => {
        let badgeClass = 'badge-neutral';
        if (row.status === 'PRESENT') badgeClass = 'badge-success';
        else if (row.status === 'ABSENT') badgeClass = 'badge-danger';
        else if (row.status === 'ON_LEAVE') badgeClass = 'badge-warning';
        return <span className={`badge ${badgeClass}`}>{row.status}</span>;
      } 
    },
    { header: 'Locked', accessor: (row) => row.isLocked ? <span className="badge badge-warning">Yes</span> : 'No' }
  ];

  if (loading) return <SkeletonLoader count={1} height={400} />;

  return (
    <div className="glass-panel p-xl">
      <div className="mb-lg">
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Audit Trail</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Chronological log of recent attendance modifications.</p>
      </div>

      <DataTable columns={columns} data={logs} />
    </div>
  );
};

export default AuditTab;
