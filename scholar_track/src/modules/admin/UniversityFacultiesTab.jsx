import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { Trash2, Edit2, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const UniversityFacultiesTab = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '' });
  const api = useApi();
  const toast = useToast();

  const fetchData = async () => {
    try {
      const res = await api.get('/faculties');
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load university faculties');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '', code: '' });
  };

  const handleEdit = (row) => {
    setEditingId(row._id);
    setFormData({ name: row.name, code: row.code });
    setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/faculties/${editingId}`, formData);
        toast.success('Faculty updated');
      } else {
        await api.post('/faculties', formData);
        toast.success('Faculty created');
      }
      setFormOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving faculty');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this faculty? Doing so will unmap any departments currently associated with it.')) return;
    try {
      await api.delete(`/faculties/${id}`);
      toast.success('Faculty deleted');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete faculty');
    }
  };

  const columns = [
    { header: 'Faculty Name', accessor: 'name' },
    { header: 'Short Code', accessor: 'code' },
    {
      header: 'Actions',
      accessor: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-sm btn-outline" style={{ color: '#3B82F6', borderColor: '#3B82F6' }} onClick={() => handleEdit(row)}>
            <Edit2 size={16} />
          </button>
          <button className="btn btn-sm btn-outline" style={{ color: '#EF4444', borderColor: '#EF4444' }} onClick={() => handleDelete(row._id)}>
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
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>University Faculty Master</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Academic faculties of Himachal Pradesh University (e.g. Faculty of Life Sciences).</p>
        </div>
        <div>
          {!formOpen && (
            <button className="btn btn-primary" onClick={() => { resetForm(); setFormOpen(true); }}>
              <Plus size={16} /> Add Faculty
            </button>
          )}
        </div>
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
                  {editingId ? <Edit2 size={18} /> : <Plus size={18} />}
                  {editingId ? 'Edit Faculty' : 'Add Faculty'}
                </span>
                <button className="inline-form-close" onClick={() => { setFormOpen(false); resetForm(); }}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Faculty Name</label>
                    <input className="form-input" required placeholder="e.g. Faculty of Physical Sciences" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Code</label>
                    <input className="form-input" required placeholder="e.g. PHYSICAL_SCIENCES" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => { setFormOpen(false); resetForm(); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingId ? 'Update Faculty' : 'Save Faculty'}</button>
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

export default UniversityFacultiesTab;
