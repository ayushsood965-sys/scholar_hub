import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { Trash2, Edit3, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const HolidayCalendarTab = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ title: '', startDate: '', endDate: '', isRecurring: false });
  const api = useApi();
  const toast = useToast();

  const fetchData = async () => {
    try {
      const res = await api.get('/attendance/holidays');
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load holidays');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setFormData({ title: '', startDate: '', endDate: '', isRecurring: false });
    setEditId(null);
    setFormOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/attendance/holidays/${editId}`, formData);
        toast.success('Holiday updated');
      } else {
        await api.post('/attendance/holidays', formData);
        toast.success('Holiday created');
      }
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving holiday');
    }
  };

  const handleEdit = (row) => {
    setEditId(row._id);
    setFormData({
      title: row.title || '',
      startDate: row.startDate ? row.startDate.split('T')[0] : '',
      endDate: row.endDate ? row.endDate.split('T')[0] : '',
      isRecurring: row.isRecurring || false
    });
    setFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await api.delete(`/attendance/holidays/${id}`);
      toast.success('Deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const columns = [
    { header: 'Holiday Title', accessor: 'title' },
    { header: 'Start Date', accessor: (row) => row.startDate ? new Date(row.startDate).toLocaleDateString() : '—' },
    { header: 'End Date', accessor: (row) => row.endDate ? new Date(row.endDate).toLocaleDateString() : '—' },
    { header: 'Recurring (Yearly)', accessor: (row) => row.isRecurring ? 'Yes' : 'No' },
    {
      header: 'Actions',
      accessor: (row) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="btn btn-sm btn-outline" onClick={() => handleEdit(row)} title="Edit">
            <Edit3 size={16} />
          </button>
          <button className="btn btn-sm btn-outline" style={{ color: '#EF4444', borderColor: '#EF4444' }} onClick={() => handleDelete(row._id)} title="Delete">
            <Trash2 size={16} />
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
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Holiday Calendar</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage university-wide holidays.</p>
        </div>
        {!formOpen && (
          <button className="btn btn-primary" onClick={() => setFormOpen(true)}>
            <Plus size={16} /> Add Holiday
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
                  <Plus size={18} /> {editId ? 'Edit Holiday' : 'Add Holiday'}
                </span>
                <button className="inline-form-close" onClick={resetForm}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Title (e.g. Diwali)</label>
                    <input className="form-input" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
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
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                  <input type="checkbox" id="recurring" checked={formData.isRecurring} onChange={e => setFormData({...formData, isRecurring: e.target.checked})} />
                  <label htmlFor="recurring" className="form-label" style={{ marginBottom: 0 }}>Repeats yearly on this date?</label>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editId ? 'Update' : 'Save'} Holiday</button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <DataTable columns={columns} data={data} />
    </div>
  );
};

export default HolidayCalendarTab;
