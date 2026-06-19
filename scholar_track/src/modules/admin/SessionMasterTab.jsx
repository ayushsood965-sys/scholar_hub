import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import SkeletonLoader from '../../components/ui/SkeletonLoader';

const SessionMasterTab = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ sessionName: '', startDate: '', endDate: '' });
  const api = useApi();
  const toast = useToast();

  const fetchSessions = async () => {
    try {
      const res = await api.get('/attendance/sessions');
      setSessions(res.data);
    } catch (err) {
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSessions(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/attendance/sessions', formData);
      toast.success('Session created successfully');
      setModalOpen(false);
      setFormData({ sessionName: '', startDate: '', endDate: '' });
      fetchSessions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating session');
    }
  };

  const handleSetCurrent = async (id) => {
    try {
      await api.put(`/attendance/sessions/${id}/current`);
      toast.success('Current session updated');
      fetchSessions();
    } catch (err) {
      toast.error('Failed to update current session');
    }
  };

  const columns = [
    { header: 'Session Name', accessor: 'sessionName' },
    { header: 'Start Date', accessor: (row) => new Date(row.startDate).toLocaleDateString() },
    { header: 'End Date', accessor: (row) => new Date(row.endDate).toLocaleDateString() },
    { 
      header: 'Status', 
      accessor: (row) => row.isCurrent ? <span className="badge badge-success">Current</span> : <span className="badge badge-neutral">Inactive</span>
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <button 
          className="btn btn-sm btn-outline" 
          onClick={() => handleSetCurrent(row._id)}
          disabled={row.isCurrent}
        >
          Set Current
        </button>
      )
    }
  ];

  if (loading) return <SkeletonLoader count={1} height={400} />;

  return (
    <div className="glass-panel p-xl">
      <div className="flex justify-between items-center mb-lg">
        <div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Academic Sessions</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage university-wide academic sessions.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>Create Session</button>
      </div>

      <DataTable columns={columns} data={sessions} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create New Session">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Session Name (e.g. 2025-26 Even)</label>
            <input className="form-input" required value={formData.sessionName} onChange={e => setFormData({...formData, sessionName: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input type="date" className="form-input" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">End Date</label>
            <input type="date" className="form-input" required value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SessionMasterTab;
