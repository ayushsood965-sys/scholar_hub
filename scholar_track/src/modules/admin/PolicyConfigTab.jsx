import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { Edit2, X, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PolicyConfigTab = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    programType: 'PG', minRequiredPercentage: 75, warningThreshold: 80,
    maxCondonationPercentage: 10, editLockHours: 48,
    allowHalfDay: true, allowMedicalLeave: true, allowDutyLeave: true,
    allowCorrection: true, correctionWindowDays: 14
  });
  const [degreeTypes, setDegreeTypes] = useState([]);
  const api = useApi();
  const toast = useToast();

  const fetchData = async () => {
    try {
      const [policiesRes, dtRes] = await Promise.all([
        api.get('/attendance/policies'),
        api.get('/attendance/masters/degree-types')
      ]);
      setData(policiesRes.data);
      setDegreeTypes(dtRes.data);
    } catch (err) {
      toast.error('Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/attendance/policies', formData);
      toast.success('Policy updated successfully');
      setFormOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating policy');
    }
  };

  const handleEdit = (policy) => {
    setFormData(policy);
    setFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this policy?')) return;
    try {
      await api.delete(`/attendance/policies/${id}`);
      toast.success('Policy deleted successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete policy');
    }
  };

  const columns = [
    { header: 'Program Type', accessor: 'programType' },
    { header: 'Min Required %', accessor: 'minRequiredPercentage' },
    { header: 'Warning %', accessor: 'warningThreshold' },
    { header: 'Lock Hours', accessor: 'editLockHours' },
    {
      header: 'Actions',
      accessor: (row) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="btn btn-sm btn-outline" onClick={() => handleEdit(row)} title="Edit">
            <Edit2 size={16} />
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
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Policy Configuration</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Configure attendance policies per program type.</p>
        </div>
        {!formOpen && (
          <button className="btn btn-primary" onClick={() => {
            setFormData({
              programType: 'PG', minRequiredPercentage: 75, warningThreshold: 80,
              maxCondonationPercentage: 10, editLockHours: 48,
              allowHalfDay: true, allowMedicalLeave: true, allowDutyLeave: true,
              allowCorrection: true, correctionWindowDays: 14
            });
            setFormOpen(true);
          }}>
            <Plus size={16} /> Add/Update Policy
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
                  <Plus size={18} /> Configure Policy
                </span>
                <button className="inline-form-close" onClick={() => setFormOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Program Type</label>
                    <select className="form-input" required value={formData.programType} onChange={e => setFormData({...formData, programType: e.target.value})}>
                      <option value="">Select Program Type...</option>
                      {degreeTypes.map(dt => {
                        const configuredProgramTypes = data.map(p => p.programType);
                        const isConfigured = configuredProgramTypes.includes(dt.code) && (!formData._id || formData.programType !== dt.code);
                        return (
                          <option key={dt._id} value={dt.code} disabled={isConfigured}>
                            {dt.name} ({dt.code}) {isConfigured ? '— Configured' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Min. Required %</label>
                    <input type="number" className="form-input" required value={formData.minRequiredPercentage} onChange={e => setFormData({...formData, minRequiredPercentage: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Warning Threshold %</label>
                    <input type="number" className="form-input" required value={formData.warningThreshold} onChange={e => setFormData({...formData, warningThreshold: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Condonation %</label>
                    <input type="number" className="form-input" required value={formData.maxCondonationPercentage} onChange={e => setFormData({...formData, maxCondonationPercentage: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Faculty Edit Lock (Hours)</label>
                    <input type="number" className="form-input" required value={formData.editLockHours} onChange={e => setFormData({...formData, editLockHours: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Correction Window (Days)</label>
                    <input type="number" className="form-input" required value={formData.correctionWindowDays} onChange={e => setFormData({...formData, correctionWindowDays: e.target.value})} />
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setFormOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Policy</button>
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

export default PolicyConfigTab;
