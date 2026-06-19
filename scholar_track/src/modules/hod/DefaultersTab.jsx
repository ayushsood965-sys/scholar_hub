import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import SkeletonLoader from '../../components/ui/SkeletonLoader';

const DefaultersTab = () => {
  const [data, setData] = useState({ defaulters: [], warnings: [] });
  const [loading, setLoading] = useState(true);
  const api = useApi();
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/attendance/dashboard/hod');
        setData({ defaulters: res.data.defaulters || [], warnings: res.data.warnings || [] });
      } catch (err) {
        toast.error('Failed to load defaulters');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [api, toast]);

  const columns = [
    { header: 'Student Name', accessor: 'name' },
    { header: 'Enrollment No.', accessor: 'enrollmentNumber' },
    { header: 'Email', accessor: 'email' },
    { header: 'Attendance %', accessor: (row) => `${row.percentage}%` },
    { header: 'Classes to Recover', accessor: 'consecutiveClassesToAttend' },
    {
      header: 'Status',
      accessor: (row) => row.isDefaulter ? <span className="badge badge-danger">Defaulter</span> : <span className="badge badge-warning">Warning</span>
    }
  ];

  if (loading) return <SkeletonLoader count={1} height={400} />;

  const combinedList = [...data.defaulters, ...data.warnings].sort((a, b) => a.percentage - b.percentage);

  return (
    <div className="glass-panel p-xl">
      <div className="mb-lg">
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Defaulters & Warnings</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Students falling below attendance policy thresholds.</p>
      </div>

      <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
        <div className="clay-card" style={{ flex: 1, padding: '16px', borderLeft: '4px solid #EF4444' }}>
          <h3 style={{ color: '#EF4444', margin: 0 }}>{data.defaulters.length}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>Critical Defaulters</p>
        </div>
        <div className="clay-card" style={{ flex: 1, padding: '16px', borderLeft: '4px solid #F59E0B' }}>
          <h3 style={{ color: '#F59E0B', margin: 0 }}>{data.warnings.length}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>Warning Zone</p>
        </div>
      </div>

      <DataTable columns={columns} data={combinedList} />
    </div>
  );
};

export default DefaultersTab;
