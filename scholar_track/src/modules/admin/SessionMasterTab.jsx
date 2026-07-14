import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { Trash2, Edit3, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SessionMasterTab = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
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

  const resetForm = () => {
    setFormData({ sessionName: '', startDate: '', endDate: '' });
    setEditId(null);
    setFormOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/attendance/sessions/${editId}`, formData);
        toast.success('Session updated successfully');
      } else {
        await api.post('/attendance/sessions', formData);
        toast.success('Session created successfully');
      }
      resetForm();
      fetchSessions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving session');
    }
  };

  const handleEdit = (session) => {
    setEditId(session._id);
    setFormData({
      sessionName: session.sessionName || '',
      startDate: session.startDate ? session.startDate.split('T')[0] : '',
      endDate: session.endDate ? session.endDate.split('T')[0] : ''
    });
    setFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this session?')) return;
    try {
      await api.delete(`/attendance/sessions/${id}`);
      toast.success('Session deleted successfully');
      fetchSessions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete session');
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
    { header: 'Start Date', accessor: (row) => row.startDate ? new Date(row.startDate).toLocaleDateString() : '—' },
    { header: 'End Date', accessor: (row) => row.endDate ? new Date(row.endDate).toLocaleDateString() : '—' },
    {
      header: 'Status',
      accessor: (row) => row.isCurrent
        ? <span style={{ fontSize: '0.75rem', background: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>Current</span>
        : <span style={{ fontSize: '0.75rem', background: 'var(--color-bg)', color: '#64748B', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>Inactive</span>
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="btn btn-sm btn-outline" onClick={() => handleEdit(row)} title="Edit">
            <Edit3 size={14} />
          </button>
          <button
            className="btn btn-sm btn-outline"
            style={{ color: '#EF4444', borderColor: '#EF4444' }}
            onClick={() => handleDelete(row._id)}
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
          <button
            className="btn btn-sm btn-outline"
            onClick={() => handleSetCurrent(row._id)}
            disabled={row.isCurrent}
            title="Set as Current"
          >
            Set Current
          </button>
        </div>
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
                  <Plus size={18} /> {editId ? 'Edit Session' : 'Create New Session'}
                </span>
                <button className="inline-form-close" onClick={resetForm}>
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
                  <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editId ? 'Update' : 'Save'} Session</button>
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
