import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, Save, Trash2 } from 'lucide-react';
import api from '../../hooks/useApi';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { useToast } from '../../context/ToastContext';

const HolidayCalendarTab = () => {
  const toast = useToast();
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ holidayName: '', date: '', holidayType: 'NATIONAL' });

  const fetch = async () => {
    try {
      const { data } = await api.get('/attendance/holidays');
      setHolidays(data ?? []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.holidayName.trim() || !form.date) {
      toast.error('Please enter name and date.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        holidayName: form.holidayName,
        startDate: form.date,
        endDate: form.date,
        isRecurring: false,
        holidayType: form.holidayType
      };
      await api.post('/attendance/holidays', payload);
      toast.success('Holiday added!');
      setShowModal(false);
      setForm({ holidayName: '', date: '', holidayType: 'NATIONAL' });
      fetch();
    } catch (err) { toast.error(err?.response?.data?.message ?? 'Failed.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/attendance/holidays/${id}`);
      toast.success('Holiday removed.');
      fetch();
    } catch (err) { toast.error('Failed to remove holiday.'); }
  };

  if (loading) return <SkeletonLoader type="table" count={6} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Global Holiday Calendar</h2>
          <p className="text-sm text-muted">University-wide holidays excluded from attendance calculations</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Holiday
        </button>
      </div>

      {holidays.length === 0 ? (
        <EmptyState icon={Calendar} title="No global holidays" message="Add university-wide holidays." />
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead><tr><th>Holiday</th><th>Date</th><th>Type</th><th>Actions</th></tr></thead>
            <tbody>
              {holidays.map((h, i) => (
                <motion.tr key={h._id ?? i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                  <td style={{ fontWeight: 600 }}>{h.holidayName}</td>
                  <td>{new Date(h.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td><span className="badge badge-neutral">{h.holidayType}</span></td>
                  <td>
                    <button className="btn btn-sm btn-danger btn-icon" onClick={() => handleDelete(h._id)}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Global Holiday">
        <form onSubmit={handleSave}>
          <div className="form-group"><label className="form-label">Holiday Name</label><input className="form-input" value={form.holidayName} onChange={e => setForm(p => ({ ...p, holidayName: e.target.value }))} placeholder="e.g., Independence Day" /></div>
          <div className="grid-2">
            <div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Type</label>
              <select className="form-input" value={form.holidayType} onChange={e => setForm(p => ({ ...p, holidayType: e.target.value }))}>
                <option value="NATIONAL">National</option>
                <option value="STATE">State</option>
                <option value="RESTRICTED">Restricted</option>
                <option value="OPTIONAL">Optional</option>
                <option value="DEPARTMENTAL">Departmental</option>
                <option value="EMERGENCY_CLOSURE">Emergency Closure</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}><Save size={14} /> {saving ? 'Adding...' : 'Add Holiday'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default HolidayCalendarTab;

