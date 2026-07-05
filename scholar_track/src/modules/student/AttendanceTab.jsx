import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import SkeletonLoader from '../../components/ui/SkeletonLoader';

const AttendanceTab = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const api = useApi();
  const toast = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/attendance/dashboard/student');
        setData(res.data);
      } catch (err) {
        toast.error('Failed to load attendance records');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [api, toast]);

  const subjectColumns = [
    { header: 'Subject Code', accessor: 'subjectCode' },
    { header: 'Subject Name', accessor: 'subjectName' },
    { header: 'Total Classes', accessor: 'total' },
    { header: 'Attended', accessor: 'attended' },
    { 
      header: 'Percentage', 
      accessor: (row) => {
        const perc = row.total === 0 ? 0 : Math.round((row.attended / row.total) * 100);
        let color = '#10B981';
        if (perc < 75) color = '#EF4444';
        else if (perc < 80) color = '#F59E0B';
        return <span style={{ color, fontWeight: 'bold' }}>{perc}%</span>;
      }
    }
  ];

  const phdColumns = [
    { 
      header: 'Date', 
      accessor: (row) => new Date(row.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'short' }) 
    },
    { 
      header: 'Status', 
      accessor: (row) => {
        let color = '#10B981';
        if (row.status === 'ABSENT') color = '#EF4444';
        else if (row.status === 'ON_LEAVE') color = '#3B82F6';
        else if (row.status === 'HOLIDAY') color = '#8B5CF6';
        return <span style={{ color, fontWeight: 'bold' }}>{row.status}</span>;
      }
    },
    { header: 'Remarks', accessor: (row) => row.remarks || '—' }
  ];

  if (loading) return <SkeletonLoader count={1} height={400} />;

  return (
    <div className="glass-panel p-xl">
      <div className="mb-lg">
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>My Attendance</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {data?.isPhD ? 'Daily check-in logs and biometric history.' : 'Subject-wise attendance breakdown.'}
        </p>
      </div>

      {data?.isPhD ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Overall Check-in Percentage</span>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '1.8rem', color: 'var(--color-primary)', fontWeight: '800', fontFamily: 'Outfit' }}>
                {data.percentage}%
              </h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Checked-in Days</span>
              <h3 style={{ margin: '4px 0 0 0', fontSize: '1.4rem', color: 'var(--text-primary)', fontWeight: '700' }}>
                {data.presentDays} / {data.totalExpectedClasses} Days
              </h3>
            </div>
          </div>
          
          <div>
            <h3 style={{ margin: '0 0 12px 0', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: '600' }}>Biometric Attendance History</h3>
            <DataTable columns={phdColumns} data={data?.logs || []} />
          </div>
        </div>
      ) : (
        <DataTable columns={subjectColumns} data={data?.subjectWiseAttendance || []} />
      )}
    </div>
  );
};

export default AttendanceTab;
