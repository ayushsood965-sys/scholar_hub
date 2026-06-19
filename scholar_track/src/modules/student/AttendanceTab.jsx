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

  if (loading) return <SkeletonLoader count={1} height={400} />;

  return (
    <div className="glass-panel p-xl">
      <div className="mb-lg">
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>My Attendance</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Subject-wise attendance breakdown.</p>
      </div>

      {data?.isPhD ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          <p>PhD Scholars do not have subject-wise attendance. You are tracked via daily check-ins.</p>
          <h3>Overall Check-in %: {data.overallPercentage}%</h3>
        </div>
      ) : (
        <DataTable columns={subjectColumns} data={data?.subjectWiseAttendance || []} />
      )}
    </div>
  );
};

export default AttendanceTab;
