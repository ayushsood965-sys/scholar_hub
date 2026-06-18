import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Save } from 'lucide-react';
import api from '../../hooks/useApi';
import Modal from '../../components/ui/Modal';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../context/ToastContext';

const SystemPoliciesTab = () => {
  const toast = useToast();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    programType: 'PhD', minRequiredPercentage: 75, warningThreshold: 80,
    maxCondonationPercentage: 10, editLockHours: 48
  });

  const fetch = async () => {
    try {
      const { data } = await api.get('/attendance/policies');
      // Filter only global policy templates (where departmentId is null/undefined)
      const globalPolicies = (data ?? []).filter(p => !p.departmentId);
      setPolicies(globalPolicies);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        allowHalfDay: true,
        allowMedicalLeave: true,
        allowDutyLeave: true,
        allowCorrection: true,
        correctionWindowDays: 14
      };
      await api.post('/attendance/policies', payload);
      toast.success('Global policy saved!');
      setShowModal(false);
      fetch();
    } catch (err) { toast.error(err?.response?.data?.message ?? 'Failed.'); }
    finally { setSaving(false); }
  };

  if (loading) return <SkeletonLoader type="stats" count={3} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Global Default Policies</h2>
          <p className="text-sm text-muted">System-wide policy templates that departments can override</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Shield size={16} /> Create Global Policy
        </button>
      </div>

      {policies.length === 0 ? (
        <EmptyState icon={Shield} title="No global policies" message="Create global templates for departments to inherit." />
      ) : (
        <div className="grid-auto">
          {policies.map((p, i) => (
            <motion.div key={p._id ?? i} className="glass-panel p-lg" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
              <div className="flex items-center justify-between mb-md">
                <span className="badge badge-primary">{p.programType} — GLOBAL</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { label: 'Min Required', value: `${p.minRequiredPercentage}%` },
                  { label: 'Warning At', value: `${p.warningThreshold}%` },
                  { label: 'Condonation', value: `${p.maxCondonationPercentage}%` },
                  { label: 'Edit Lock', value: `${p.editLockHours}hrs` },
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

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Global Policy Template">
        <form onSubmit={handleSave}>
          <div className="form-group"><label className="form-label">Program Type</label>
            <select className="form-input" value={form.programType} onChange={e => setForm(p => ({ ...p, programType: e.target.value }))}>
              <option value="PhD">PhD</option><option value="PG">PG</option><option value="UG">UG</option>
            </select>
          </div>
          <div className="grid-2">
            <div className="form-group"><label className="form-label">Min %</label><input className="form-input" type="number" value={form.minRequiredPercentage} onChange={e => setForm(p => ({ ...p, minRequiredPercentage: +e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Warning %</label><input className="form-input" type="number" value={form.warningThreshold} onChange={e => setForm(p => ({ ...p, warningThreshold: +e.target.value }))} /></div>
          </div>
          <div className="grid-2">
            <div className="form-group"><label className="form-label">Condonation %</label><input className="form-input" type="number" value={form.maxCondonationPercentage} onChange={e => setForm(p => ({ ...p, maxCondonationPercentage: +e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Lock Hours</label><input className="form-input" type="number" value={form.editLockHours} onChange={e => setForm(p => ({ ...p, editLockHours: +e.target.value }))} /></div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}><Save size={14} /> {saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SystemPoliciesTab;
