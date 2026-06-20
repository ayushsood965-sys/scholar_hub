import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SessionMasterTab = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
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
      setFormOpen(false);
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
        {!formOpen && (
          <button className="btn btn-primary" onClick={() => setFormOpen(true)}>
            <Plus size={16} /> Create Session
          </button>
        )}
      </div>

      <AnimatePresence>
        {formOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="inline-form-card">
              <div className="inline-form-header">
                <span className="inline-form-title">
                  <Plus size={18} /> Create New Session
                </span>
                <button className="inline-form-close" onClick={() => setFormOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="grid-3">
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
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setFormOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Session</button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <DataTable columns={columns} data={sessions} />
    </div>
  );
};

export default SessionMasterTab;
