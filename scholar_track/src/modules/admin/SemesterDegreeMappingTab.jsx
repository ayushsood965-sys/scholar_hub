import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { Trash2, Edit2, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SemesterDegreeMappingTab = () => {
  const [data, setData] = useState([]);
  const [degreeNames, setDegreeNames] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ degreeNameId: '', semesterId: '' });
  const [seeding, setSeeding] = useState(false);
  const api = useApi();
  const toast = useToast();

  const fetchData = async () => {
    try {
      const [resMap, resDeg, resSems] = await Promise.all([
        api.get('/attendance/masters/semester-degree-mappings'),
        api.get('/attendance/masters/degree-names'),
        api.get('/attendance/masters/semesters')
      ]);
      setData(resMap.data);
      setDegreeNames(resDeg.data);
      setSemesters(resSems.data);
      if (resDeg.data.length > 0 && resSems.data.length > 0 && !editingId) {
        setFormData({ degreeNameId: resDeg.data[0]._id, semesterId: resSems.data[0]._id });
      }
    } catch (err) {
      toast.error('Failed to load mappings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setEditingId(null);
    if (degreeNames.length > 0 && semesters.length > 0) {
      setFormData({ degreeNameId: degreeNames[0]._id, semesterId: semesters[0]._id });
    } else {
      setFormData({ degreeNameId: '', semesterId: '' });
    }
  };

  const handleEdit = (row) => {
    setEditingId(row._id);
    setFormData({ degreeNameId: row.degreeNameId?._id || '', semesterId: row.semesterId?._id || '' });
    setFormOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/attendance/masters/semester-degree-mappings/${editingId}`, formData);
        toast.success('Mapping updated successfully');
      } else {
        await api.post('/attendance/masters/semester-degree-mappings', formData);
        toast.success('Mapping created successfully');
      }
      setFormOpen(false);
      resetForm();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving mapping');
    }
  };

  const handleSeedMappings = async () => {
    if (!window.confirm('This will seed the semester mappings for all degree programs based on their durations. Duplicate mappings will be skipped. Do you want to proceed?')) return;
    const password = window.prompt('Please enter the seeding password:');
    if (!password) return;
    setSeeding(true);
    try {
      const res = await api.post('/attendance/masters/seed-mappings', { seedingPassword: password });
      toast.success(res.data.message || 'Semester mappings seeded successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to seed mappings');
    } finally {
      setSeeding(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await api.delete(`/attendance/masters/semester-degree-mappings/${id}`);
      toast.success('Deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const columns = [
    { header: 'Degree Name', accessor: (row) => row.degreeNameId?.name || 'N/A' },
    { header: 'Semester', accessor: (row) => row.semesterId?.name || 'N/A' },
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
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Semester-Degree Mappings</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Assign semesters to their respective degree courses.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {!formOpen && (
            <>
              <button className="btn btn-outline" onClick={handleSeedMappings} disabled={seeding}>
                {seeding ? 'Seeding...' : 'Seed Master Data'}
              </button>
              <button className="btn btn-primary" onClick={() => { resetForm(); setFormOpen(true); }}>
                <Plus size={16} /> Add Mapping
              </button>
            </>
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
                  {editingId ? 'Edit Semester-Degree Mapping' : 'Add Semester-Degree Mapping'}
                </span>
                <button className="inline-form-close" onClick={() => { setFormOpen(false); resetForm(); }}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Degree Name</label>
                    <select className="form-input" required value={formData.degreeNameId} onChange={e => setFormData({...formData, degreeNameId: e.target.value})}>
                      <option value="">Select Degree...</option>
                      {degreeNames.map(d => <option key={d._id} value={d._id}>{d.name} ({d.code})</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Semester</label>
                    <select className="form-input" required value={formData.semesterId} onChange={e => setFormData({...formData, semesterId: e.target.value})}>
                      <option value="">Select Semester...</option>
                      {semesters.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => { setFormOpen(false); resetForm(); }}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingId ? 'Update Mapping' : 'Save Mapping'}</button>
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

export default SemesterDegreeMappingTab;
