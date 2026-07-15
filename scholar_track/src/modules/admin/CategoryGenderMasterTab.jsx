import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { Trash2, X, Plus, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CategoryGenderMasterTab = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ type: 'GENDER', label: '', value: '', sortOrder: 0 });
  const [seeding, setSeeding] = useState(false);
  const api = useApi();
  const toast = useToast();

  const handleSeedCategoryGender = async () => {
    if (!window.confirm('This will delete all current category and gender options and seed standard configurations. Do you want to proceed?')) return;
    const password = window.prompt('Please enter the seeding password:');
    if (!password) return;
    setSeeding(true);
    try {
      const res = await api.post('/attendance/masters/category-gender/seed', { seedingPassword: password });
      toast.success(res.data.message || 'Seeded successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to seed data');
    } finally {
      setSeeding(false);
    }
  };

  const fetchData = async () => {
    try {
      const res = await api.get('/attendance/masters/category-gender');
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load category & gender masters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/attendance/masters/category-gender/${editId}`, formData);
        toast.success('Updated successfully');
      } else {
        await api.post('/attendance/masters/category-gender', formData);
        toast.success('Created successfully');
      }
      setFormOpen(false);
      setEditId(null);
      setFormData({ type: 'GENDER', label: '', value: '', sortOrder: 0 });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving record');
    }
  };

  const handleEdit = (row) => {
    setEditId(row._id);
    setFormData({ type: row.type, label: row.label, value: row.value, sortOrder: row.sortOrder || 0 });
    setFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this record?')) return;
    try {
      await api.delete(`/attendance/masters/category-gender/${id}`);
      toast.success('Deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const handleClose = () => {
    setFormOpen(false);
    setEditId(null);
    setFormData({ type: 'GENDER', label: '', value: '', sortOrder: 0 });
  };

  const genderItems = data.filter(d => d.type === 'GENDER');
  const categoryItems = data.filter(d => d.type === 'CATEGORY');

  const columns = [
    { header: 'Label', accessor: 'label' },
    { header: 'Value', accessor: 'value' },
    { header: 'Type', accessor: (row) => (
      <span style={{
        fontSize: '0.75rem',
        padding: '2px 8px',
        borderRadius: '10px',
        fontWeight: 600,
        background: row.type === 'GENDER' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
        color: row.type === 'GENDER' ? '#2563eb' : '#d97706'
      }}>
        {row.type === 'GENDER' ? '👤 Gender' : '🏷️ Category'}
      </span>
    )},
    { header: 'Order', accessor: 'sortOrder' },
    {
      header: 'Actions',
      accessor: (row) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="btn btn-sm btn-outline" onClick={() => handleEdit(row)} title="Edit">
            <Edit3 size={14} />
          </button>
          <button className="btn btn-sm btn-outline" style={{ color: '#EF4444', borderColor: '#EF4444' }} onClick={() => handleDelete(row._id)} title="Delete">
            <Trash2 size={14} />
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
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Category & Gender Master</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Manage dropdown options for Gender and Social Category fields in student profiles.
          </p>
        </div>
        {!formOpen && (
          <div className="flex gap-md">
            <button className="btn btn-secondary" onClick={handleSeedCategoryGender} disabled={seeding}>
              {seeding ? 'Seeding...' : 'Seed Categories & Genders'}
            </button>
            <button className="btn btn-primary" onClick={() => setFormOpen(true)}>
              <Plus size={16} /> Add New Option
            </button>
          </div>
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
                  <Plus size={18} /> {editId ? 'Edit Option' : 'Add New Option'}
                </span>
                <button className="inline-form-close" onClick={handleClose}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Type *</label>
                    <select className="form-input" required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                      <option value="GENDER">Gender</option>
                      <option value="CATEGORY">Social Category</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Display Label *</label>
                    <input className="form-input" required value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})} placeholder="e.g. Female, OBC, ..." />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Stored Value *</label>
                    <input className="form-input" required value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} placeholder="e.g. Female, OBC, ..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sort Order</label>
                    <input className="form-input" type="number" value={formData.sortOrder} onChange={e => setFormData({...formData, sortOrder: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={handleClose}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editId ? 'Update' : 'Save'} Option</button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gender Section */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          👤 Gender Options ({genderItems.length})
        </h3>
        <DataTable
          columns={[
            { header: 'Label', accessor: 'label' },
            { header: 'Value', accessor: 'value' },
            { header: 'Order', accessor: 'sortOrder' },
            {
              header: 'Actions',
              accessor: (row) => (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn btn-sm btn-outline" onClick={() => handleEdit(row)} title="Edit"><Edit3 size={14} /></button>
                  <button className="btn btn-sm btn-outline" style={{ color: '#EF4444', borderColor: '#EF4444' }} onClick={() => handleDelete(row._id)} title="Delete"><Trash2 size={14} /></button>
                </div>
              )
            }
          ]}
          data={genderItems}
        />
      </div>

      {/* Category Section */}
      <div>
        <h3 style={{ color: 'var(--text-primary)', fontSize: '1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🏷️ Social Category Options ({categoryItems.length})
        </h3>
        <DataTable
          columns={[
            { header: 'Label', accessor: 'label' },
            { header: 'Value', accessor: 'value' },
            { header: 'Order', accessor: 'sortOrder' },
            {
              header: 'Actions',
              accessor: (row) => (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button className="btn btn-sm btn-outline" onClick={() => handleEdit(row)} title="Edit"><Edit3 size={14} /></button>
                  <button className="btn btn-sm btn-outline" style={{ color: '#EF4444', borderColor: '#EF4444' }} onClick={() => handleDelete(row._id)} title="Delete"><Trash2 size={14} /></button>
                </div>
              )
            }
          ]}
          data={categoryItems}
        />
      </div>
    </div>
  );
};

export default CategoryGenderMasterTab;
