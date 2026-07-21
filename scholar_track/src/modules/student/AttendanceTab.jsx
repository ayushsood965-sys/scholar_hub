import React, { useState, useEffect, useContext, useRef } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { AuthContext } from '../../context/AuthContext';
import DataTable from '../../components/ui/DataTable';
import SkeletonLoader from '../../components/ui/SkeletonLoader';

const AttendanceTab = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [semesters, setSemesters] = useState([]);
  
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  
  const api = useApi();
  const toast = useToast();
  const fetchInitiated = useRef(false);

  const fetchData = async (sessId, semId) => {
    setLoading(true);
    try {
      let url = '/attendance/dashboard/student';
      const params = [];
      if (sessId) params.push(`sessionId=${sessId}`);
      if (semId) params.push(`semesterId=${semId}`);
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      const res = await api.get(url);
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load attendance records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || fetchInitiated.current) return;
    fetchInitiated.current = true;

    const fetchFiltersAndData = async () => {
      try {
        // 1. Fetch sessions and semesters
        const filterRes = await api.get('/student-mapping/filters');
        const sessList = filterRes.data.sessions || [];
        const semList = filterRes.data.semesters || [];
        
        setSessions(sessList);
        setSemesters(semList);

        // 2. Resolve defaults (registered session and Semester 1)
        const registeredSession = sessList.find(s => s.sessionName === user?.profile?.academicSession) || sessList.find(s => s.isCurrent) || sessList[0];
        const semester1 = semList.find(s => s.number === 1) || semList[0];

        const defaultSessId = registeredSession ? registeredSession._id : '';
        const defaultSemId = semester1 ? semester1._id : '';

        setSelectedSessionId(defaultSessId);
        setSelectedSemesterId(defaultSemId);

        // 3. Load initial data
        await fetchData(defaultSessId, defaultSemId);
      } catch (err) {
        toast.error('Failed to load filter configurations');
        // Fallback to load default dashboard stats
        await fetchData();
      }
    };

    fetchFiltersAndData();
  }, [api, toast, user]);

  const handleSearch = () => {
    fetchData(selectedSessionId, selectedSemesterId);
  };

  const subjectColumns = [
    { header: 'Subject Code', accessor: 'subjectCode' },
    { header: 'Subject Name', accessor: 'subjectName' },
    { header: 'Conducted', accessor: (row) => row.totalConducted || row.total },
    { header: 'Attended', accessor: 'attended' },
    { header: 'Approved Leaves', accessor: (row) => row.leaves || 0 },
    { header: 'Absent', accessor: (row) => row.absent || 0 },
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

  return (
    <div className="glass-panel p-xl" style={{ width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
      <div className="mb-lg">
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>My Attendance</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {data?.isPhD ? 'Daily check-in logs and biometric history.' : 'Subject-wise attendance breakdown.'}
        </p>
      </div>

      {/* Search Options Panel */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.02)',
        borderRadius: '12px',
        border: '1px solid var(--color-border, rgba(0,0,0,0.05))',
        padding: '16px',
        marginBottom: '24px',
        display: 'flex',
        gap: '16px',
        alignItems: 'flex-end',
        flexWrap: 'wrap'
      }}>
        {/* Session Dropdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '150px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Academic Session</span>
          <select
            className="form-input"
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', background: 'var(--color-surface, #fff)', border: '1px solid var(--color-border, #CBD5E1)', color: 'var(--text-primary)' }}
          >
            {sessions.map(s => (
              <option key={s._id} value={s._id}>
                {s.sessionName} {s.sessionName === user?.profile?.academicSession ? '(Registered)' : s.isCurrent ? '(Current)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Degree Type (Read Only) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '150px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Degree Type</span>
          <input
            type="text"
            className="form-input"
            value={user?.profile?.degreeType || data?.degreeType || 'N/A'}
            disabled
            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border, #CBD5E1)', background: 'rgba(0,0,0,0.03)', color: 'var(--text-secondary)', cursor: 'not-allowed' }}
          />
        </div>

        {/* Degree Name (Read Only) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 2, minWidth: '220px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Degree Name</span>
          <input
            type="text"
            className="form-input"
            value={user?.profile?.degreeName || data?.degreeName || 'N/A'}
            disabled
            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border, #CBD5E1)', background: 'rgba(0,0,0,0.03)', color: 'var(--text-secondary)', cursor: 'not-allowed' }}
          />
        </div>

        {/* Semester Dropdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minWidth: '150px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Semester</span>
          <select
            className="form-input"
            value={selectedSemesterId}
            onChange={(e) => setSelectedSemesterId(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', background: 'var(--color-surface, #fff)', border: '1px solid var(--color-border, #CBD5E1)', color: 'var(--text-primary)' }}
          >
            {semesters.map(s => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Search Button */}
        <div>
          <button
            className="btn btn-primary"
            onClick={handleSearch}
            style={{ padding: '9px 24px', borderRadius: '8px', height: '38px', fontWeight: 'bold' }}
          >
            Search
          </button>
        </div>
      </div>

      {loading ? (
        <SkeletonLoader count={1} height={250} />
      ) : data?.isPhD ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '16px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
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
