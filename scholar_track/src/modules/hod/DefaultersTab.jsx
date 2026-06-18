import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Download } from 'lucide-react';
import api from '../../hooks/useApi';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import SkeletonLoader from '../../components/ui/SkeletonLoader';

const DefaultersTab = () => {
  const [data, setData] = useState({ defaulters: [], warnings: [] });
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('defaulters');

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data: stats } = await api.get('/attendance/dashboard/hod');
        setData({
          defaulters: stats?.defaulters ?? [],
          warnings: stats?.warnings ?? [],
        });
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <SkeletonLoader type="table" count={6} />;

  const columns = [
    { key: 'name', header: 'Scholar', accessor: 'name', render: (row) => <span style={{ fontWeight: 600 }}>{row.name ?? '—'}</span> },
    { key: 'enrollment', header: 'Enrollment', accessor: 'enrollmentNumber' },
    { key: 'percentage', header: 'Attendance %', accessor: 'percentage', render: (row) => (
      <span style={{ fontWeight: 700, color: (row.percentage ?? 0) < 75 ? 'var(--status-absent)' : 'var(--status-present)' }}>
        {row.percentage?.toFixed(1) ?? 0}%
      </span>
    )},
    { key: 'present', header: 'Present', accessor: 'presentDays' },
    { key: 'absent', header: 'Absent', accessor: 'absentDays' },
    { key: 'working', header: 'Working Days', accessor: 'effectiveWorkingDays' },
    { key: 'status', header: 'Status', accessor: 'status', render: (row) => (
      view === 'defaulters'
        ? <span className="badge badge-defaulter">Defaulter</span>
        : <span className="badge badge-warning">Warning</span>
    )},
  ];

  const currentData = view === 'defaulters' ? data.defaulters : data.warnings;

  return (
    <div>
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Attendance Compliance</h2>
          <p className="text-sm text-muted">Monitor scholars falling below required thresholds</p>
        </div>
      </div>

      <div className="tab-header" style={{ marginBottom: '20px' }}>
        <button className={`tab-btn ${view === 'defaulters' ? 'active' : ''}`} onClick={() => setView('defaulters')}>
          <AlertTriangle size={16} /> Defaulters ({data.defaulters.length})
        </button>
        <button className={`tab-btn ${view === 'warnings' ? 'active' : ''}`} onClick={() => setView('warnings')}>
          ⚠ Warning Zone ({data.warnings.length})
        </button>
      </div>

      <DataTable
        columns={columns}
        data={currentData}
        searchable
        searchPlaceholder="Search scholars..."
        pageSize={15}
        emptyTitle={view === 'defaulters' ? 'No defaulters' : 'No warnings'}
        emptyMessage={view === 'defaulters' ? 'All scholars are above the minimum threshold.' : 'No scholars in the warning zone.'}
      />
    </div>
  );
};

export default DefaultersTab;
