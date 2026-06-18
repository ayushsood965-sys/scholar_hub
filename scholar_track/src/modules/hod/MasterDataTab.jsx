import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Plus, Save } from 'lucide-react';
import api from '../../hooks/useApi';
import Modal from '../../components/ui/Modal';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../context/ToastContext';

const MasterDataTab = () => {
  const toast = useToast();
  const [activeSection, setActiveSection] = useState('sessions');
  const [sessions, setSessions] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Session form
  const [sessionForm, setSessionForm] = useState({ name: '', startDate: '', endDate: '' });
  // Holiday form
  const [holidayForm, setHolidayForm] = useState({ name: '', date: '', type: 'GAZETTED' });

  const fetchAll = async () => {
    try {
      const [sessRes, holRes] = await Promise.all([
        api.get('/attendance/sessions'),
        api.get('/attendance/holidays'),
      ]);
      setSessions(sessRes.data ?? []);
      setHolidays(holRes.data ?? []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSaveSession = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/attendance/sessions', sessionForm);
      toast.success('Session created!');
      setShowModal(false);
      fetchAll();
    } catch (err) { toast.error(err?.response?.data?.message ?? 'Failed.'); }
    finally { setSaving(false); }
  };

  const handleSaveHoliday = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/attendance/holidays', holidayForm);
      toast.success('Holiday added!');
      setShowModal(false);
      fetchAll();
    } catch (err) { toast.error(err?.response?.data?.message ?? 'Failed.'); }
    finally { setSaving(false); }
  };

  if (loading) return <SkeletonLoader type="stats" count={4} />;

  return (
    <div>
      {/* Section Tabs */}
      <div className="tab-header">
        <button className={`tab-btn ${activeSection === 'sessions' ? 'active' : ''}`} onClick={() => setActiveSection('sessions')}>
          <Clock size={16} /> Sessions
        </button>
        <button className={`tab-btn ${activeSection === 'holidays' ? 'active' : ''}`} onClick={() => setActiveSection('holidays')}>
          <Calendar size={16} /> Holidays
        </button>
      </div>

      {/* Sessions */}
      {activeSection === 'sessions' && (
        <div>
          <div className="flex items-center justify-between mb-lg">
            <h3 style={{ fontWeight: 700 }}>Academic Sessions</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
              <Plus size={14} /> New Session
            </button>
          </div>
          {sessions.length === 0 ? (
            <EmptyState icon={Clock} title="No sessions" message="Create your first academic session." />
          ) : (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead><tr><th>Session Name</th><th>Start</th><th>End</th><th>Status</th></tr></thead>
                <tbody>
                  {sessions.map((s, i) => (
                    <motion.tr key={s._id ?? i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                      <td style={{ fontWeight: 600 }}>{s.name}</td>
                      <td>{new Date(s.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td>{new Date(s.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td><span className={`badge ${s.isActive ? 'badge-present' : 'badge-neutral'}`}>{s.isActive ? 'Active' : 'Inactive'}</span></td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Holidays */}
      {activeSection === 'holidays' && (
        <div>
          <div className="flex items-center justify-between mb-lg">
            <h3 style={{ fontWeight: 700 }}>Department Holidays</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
              <Plus size={14} /> Add Holiday
            </button>
          </div>
          {holidays.length === 0 ? (
            <EmptyState icon={Calendar} title="No holidays" message="Add department holidays to exclude from attendance." />
          ) : (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead><tr><th>Name</th><th>Date</th><th>Type</th></tr></thead>
                <tbody>
                  {holidays.map((h, i) => (
                    <motion.tr key={h._id ?? i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}>
                      <td style={{ fontWeight: 600 }}>{h.name}</td>
                      <td>{new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td><span className="badge badge-neutral">{h.type}</span></td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={activeSection === 'sessions' ? 'New Session' : 'Add Holiday'}>
        {activeSection === 'sessions' ? (
          <form onSubmit={handleSaveSession}>
            <div className="form-group"><label className="form-label">Session Name</label><input className="form-input" value={sessionForm.name} onChange={e => setSessionForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g., July 2025 - June 2026" /></div>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Start Date</label><input className="form-input" type="date" value={sessionForm.startDate} onChange={e => setSessionForm(p => ({ ...p, startDate: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">End Date</label><input className="form-input" type="date" value={sessionForm.endDate} onChange={e => setSessionForm(p => ({ ...p, endDate: e.target.value }))} /></div>
            </div>
            <div className="modal-footer"><button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}><Save size={14} /> {saving ? 'Creating...' : 'Create'}</button></div>
          </form>
        ) : (
          <form onSubmit={handleSaveHoliday}>
            <div className="form-group"><label className="form-label">Holiday Name</label><input className="form-input" value={holidayForm.name} onChange={e => setHolidayForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Republic Day" /></div>
            <div className="grid-2">
              <div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" value={holidayForm.date} onChange={e => setHolidayForm(p => ({ ...p, date: e.target.value }))} /></div>
              <div className="form-group"><label className="form-label">Type</label>
                <select className="form-input" value={holidayForm.type} onChange={e => setHolidayForm(p => ({ ...p, type: e.target.value }))}>
                  <option value="GAZETTED">Gazetted</option><option value="RESTRICTED">Restricted</option><option value="LOCAL">Local</option>
                </select>
              </div>
            </div>
            <div className="modal-footer"><button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary" disabled={saving}><Save size={14} /> {saving ? 'Adding...' : 'Add Holiday'}</button></div>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default MasterDataTab;
