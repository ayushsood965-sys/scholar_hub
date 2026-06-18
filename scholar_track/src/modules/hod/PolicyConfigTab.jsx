import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Save, Trash2 } from 'lucide-react';
import api from '../../hooks/useApi';
import Modal from '../../components/ui/Modal';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../context/ToastContext';

const PolicyConfigTab = () => {
  const toast = useToast();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    programType: 'PhD', minRequiredPercentage: 75, warningThreshold: 80,
    maxCondonationPercentage: 10, editLockHours: 48, allowCorrection: true, correctionWindowDays: 14
  });

  const fetch = async () => {
    try {
      const { data } = await api.get('/attendance/policies');
      setPolicies(data ?? []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/attendance/policies', form);
      toast.success('Policy saved successfully!');
      setShowModal(false);
      fetch();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to save policy.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/attendance/policies/${id}`);
      toast.success('Policy deactivated.');
      fetch();
    } catch (err) { toast.error('Failed to deactivate policy.'); }
  };

  if (loading) return <SkeletonLoader type="stats" count={3} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Attendance Policies</h2>
          <p className="text-sm text-muted">Configure rules per program type for your department</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Shield size={16} /> Create / Update Policy
        </button>
      </div>

      {policies.length === 0 ? (
        <EmptyState icon={Shield} title="No policies configured" message="Create policies to define attendance rules for your department." />
      ) : (
        <div className="grid-auto">
          {policies.map((p, i) => (
            <motion.div
              key={p._id ?? i}
              className="glass-panel p-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <div className="flex items-center justify-between mb-md">
                <span className="badge badge-primary">{p.programType}</span>
                <button className="btn btn-icon btn-danger btn-sm" onClick={() => handleDelete(p._id)} title="Deactivate">
                  <Trash2 size={14} />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { label: 'Min Required', value: `${p.minRequiredPercentage}%` },
                  { label: 'Warning At', value: `${p.warningThreshold}%` },
                  { label: 'Max Condonation', value: `${p.maxCondonationPercentage}%` },
                  { label: 'Edit Lock', value: `${p.editLockHours}hrs` },
                  { label: 'Corrections', value: p.allowCorrection ? 'Enabled' : 'Disabled' },
                  { label: 'Window', value: `${p.correctionWindowDays ?? 14} days` },
                ].map((item, j) => (
                  <div key={j}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{item.label}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '2px' }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Configure Attendance Policy">
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Program Type</label>
            <select className="form-input" value={form.programType} onChange={e => setForm(p => ({ ...p, programType: e.target.value }))}>
              <option value="PhD">PhD</option><option value="PG">PG</option><option value="UG">UG</option>
            </select>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Min Required %</label>
              <input className="form-input" type="number" value={form.minRequiredPercentage} onChange={e => setForm(p => ({ ...p, minRequiredPercentage: +e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Warning Threshold %</label>
              <input className="form-input" type="number" value={form.warningThreshold} onChange={e => setForm(p => ({ ...p, warningThreshold: +e.target.value }))} />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Max Condonation %</label>
              <input className="form-input" type="number" value={form.maxCondonationPercentage} onChange={e => setForm(p => ({ ...p, maxCondonationPercentage: +e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Edit Lock Hours</label>
              <input className="form-input" type="number" value={form.editLockHours} onChange={e => setForm(p => ({ ...p, editLockHours: +e.target.value }))} />
            </div>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Correction Window (Days)</label>
              <input className="form-input" type="number" value={form.correctionWindowDays} onChange={e => setForm(p => ({ ...p, correctionWindowDays: +e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Allow Corrections</label>
              <select className="form-input" value={form.allowCorrection ? 'true' : 'false'} onChange={e => setForm(p => ({ ...p, allowCorrection: e.target.value === 'true' }))}>
                <option value="true">Enabled</option><option value="false">Disabled</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}><Save size={14} /> {saving ? 'Saving...' : 'Save Policy'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PolicyConfigTab;
