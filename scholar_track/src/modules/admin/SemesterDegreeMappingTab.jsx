import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { Trash2, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SemesterDegreeMappingTab = () => {
  const [data, setData] = useState([]);
  const [degreeNames, setDegreeNames] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({ degreeNameId: '', semesterId: '' });
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
      if (resDeg.data.length > 0 && resSems.data.length > 0) {
        setFormData({ degreeNameId: resDeg.data[0]._id, semesterId: resSems.data[0]._id });
      }
    } catch (err) {
      toast.error('Failed to load mappings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/attendance/masters/semester-degree-mappings', formData);
      toast.success('Mapping created successfully');
      setFormOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating mapping');
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
        <button className="btn btn-sm btn-outline" style={{ color: '#EF4444', borderColor: '#EF4444' }} onClick={() => handleDelete(row._id)}>
          <Trash2 size={16} />
        </button>
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
        {!formOpen && (
          <button className="btn btn-primary" onClick={() => setFormOpen(true)}>
            <Plus size={16} /> Add Mapping
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
                  <Plus size={18} /> Add Semester-Degree Mapping
                </span>
                <button className="inline-form-close" onClick={() => setFormOpen(false)}>
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
                  <button type="button" className="btn btn-secondary" onClick={() => setFormOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Mapping</button>
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
