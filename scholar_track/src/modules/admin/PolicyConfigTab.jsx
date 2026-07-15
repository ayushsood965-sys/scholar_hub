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
    degreeNameId: '', minRequiredPercentage: 75, warningThreshold: 80,
    maxCondonationPercentage: 10, editLockHours: 72,
    allowHalfDay: true, allowMedicalLeave: true, allowDutyLeave: true,
    allowCorrection: true, correctionWindowDays: 14
  });
  const [degreeNames, setDegreeNames] = useState([]);
  const [seeding, setSeeding] = useState(false);
  const api = useApi();
  const toast = useToast();

  const handleSeedPolicies = async () => {
    if (!window.confirm('This will delete all current policies and seed default policies with 72 edit lock hours for all courses. Do you want to proceed?')) return;
    const password = window.prompt('Please enter the seeding password:');
    if (!password) return;
    setSeeding(true);
    try {
      const res = await api.post('/attendance/policies/seed', { seedingPassword: password });
      toast.success(res.data.message || 'Policies seeded successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to seed policies');
    } finally {
      setSeeding(false);
    }
  };

  const fetchData = async () => {
    try {
      const [policiesRes, dnRes] = await Promise.all([
        api.get('/attendance/policies'),
        api.get('/attendance/masters/degree-names')
      ]);
      setData(policiesRes.data);
      setDegreeNames(dnRes.data);
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
    setFormData({
      ...policy,
      degreeNameId: policy.degreeNameId?._id || policy.degreeNameId
    });
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
    { header: 'Course/Degree Name', accessor: (row) => row.degreeNameId ? `${row.degreeNameId.name} (${row.degreeNameId.code})` : 'Global Default' },
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
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Configure attendance policies per Course/Degree Name.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {!formOpen && (
            <>
              <button className="btn btn-outline" onClick={handleSeedPolicies} disabled={seeding}>
                {seeding ? 'Seeding...' : 'Seed Policies'}
              </button>
              <button className="btn btn-primary" onClick={() => {
                setFormData({
                  degreeNameId: '', minRequiredPercentage: 75, warningThreshold: 80,
                  maxCondonationPercentage: 10, editLockHours: 72,
                  allowHalfDay: true, allowMedicalLeave: true, allowDutyLeave: true,
                  allowCorrection: true, correctionWindowDays: 14
                });
                setFormOpen(true);
              }}>
                <Plus size={16} /> Add/Update Policy
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
                  <Plus size={18} /> Configure Policy
                </span>
                <button className="inline-form-close" onClick={() => setFormOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Course/Degree Name</label>
                    <select className="form-input" required value={formData.degreeNameId || ''} onChange={e => setFormData({...formData, degreeNameId: e.target.value})}>
                      <option value="">Select Course/Degree...</option>
                      {degreeNames.map(dn => {
                        const configuredDegreeNames = data.map(p => p.degreeNameId?._id || p.degreeNameId);
                        const isConfigured = configuredDegreeNames.includes(dn._id) && (!formData._id || (formData.degreeNameId?._id || formData.degreeNameId) !== dn._id);
                        return (
                          <option key={dn._id} value={dn._id} disabled={isConfigured}>
                            {dn.name} ({dn.code}) {isConfigured ? '— Configured' : ''}
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
