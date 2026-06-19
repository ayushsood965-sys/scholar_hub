import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import SkeletonLoader from '../../components/ui/SkeletonLoader';

const CloneTimetableTab = () => {
  const [sessions, setSessions] = useState([]);
  const [sourceSessionId, setSourceSessionId] = useState('');
  const [targetSessionId, setTargetSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);

  const api = useApi();
  const toast = useToast();

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await api.get('/attendance/sessions');
        setSessions(res.data);
      } catch (err) {
        toast.error('Failed to load sessions');
      } finally {
        setInitLoading(false);
      }
    };
    fetchSessions();
  }, [api, toast]);

  const handleClone = async () => {
    if (!sourceSessionId || !targetSessionId) {
      return toast.error('Please select both source and target sessions');
    }
    if (sourceSessionId === targetSessionId) {
      return toast.error('Source and target cannot be the same');
    }
    if (!window.confirm('This will copy all your department timetables from the source session to the target session. Are you sure?')) return;

    setLoading(true);
    try {
      const res = await api.post('/attendance/timetables/clone', { sourceSessionId, targetSessionId });
      toast.success(res.data.message || 'Timetable cloned successfully');
      setSourceSessionId('');
      setTargetSessionId('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error cloning timetable');
    } finally {
      setLoading(false);
    }
  };

  if (initLoading) return <SkeletonLoader count={1} height={400} />;

  return (
    <div className="glass-panel p-xl">
      <div className="mb-lg">
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Clone Timetable</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Copy an entire semester's timetable to a new session.</p>
      </div>

      <div className="clone-preview" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '32px', alignItems: 'center' }}>
        <div className="clay-card p-xl" style={{ textAlign: 'center' }}>
          <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Source Session</h3>
          <select className="form-input" value={sourceSessionId} onChange={e => setSourceSessionId(e.target.value)}>
            <option value="">Select Source...</option>
            {sessions.map(s => <option key={s._id} value={s._id}>{s.sessionName}</option>)}
          </select>
        </div>

        <div style={{ fontSize: '2rem', color: 'var(--text-secondary)' }}>
          ➡️
        </div>

        <div className="clay-card p-xl" style={{ textAlign: 'center' }}>
          <h3 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>Target Session</h3>
          <select className="form-input" value={targetSessionId} onChange={e => setTargetSessionId(e.target.value)}>
            <option value="">Select Target...</option>
            {sessions.map(s => <option key={s._id} value={s._id}>{s.sessionName}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginTop: '40px', textAlign: 'center' }}>
        <button 
          className="btn btn-primary" 
          style={{ padding: '16px 48px', fontSize: '1.1rem' }}
          onClick={handleClone}
          disabled={loading || !sourceSessionId || !targetSessionId}
        >
          {loading ? 'Cloning...' : 'Start Cloning Process'}
        </button>
      </div>
    </div>
  );
};

export default CloneTimetableTab;
