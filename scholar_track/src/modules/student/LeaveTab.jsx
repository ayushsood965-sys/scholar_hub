import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarPlus, Send } from 'lucide-react';
import api from '../../hooks/useApi';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { useToast } from '../../context/ToastContext';

const leaveTypeOptions = ['CASUAL', 'MEDICAL', 'DUTY', 'ACADEMIC', 'PERSONAL'];

const LeaveTab = () => {
  const toast = useToast();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ leaveType: 'CASUAL', startDate: '', endDate: '', totalDays: 1, reason: '' });

  const fetchLeaves = async () => {
    try {
      const { data } = await api.get('/attendance/leave/me');
      setLeaves(data ?? []);
    } catch (err) {
      console.error('Error fetching leaves:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(); }, []);

  const updateField = (key, val) => {
    setForm(prev => {
      const updated = { ...prev, [key]: val };
      if ((key === 'startDate' || key === 'endDate') && updated.startDate && updated.endDate) {
        const diff = Math.ceil((new Date(updated.endDate) - new Date(updated.startDate)) / (1000 * 60 * 60 * 24)) + 1;
        updated.totalDays = diff > 0 ? diff : 1;
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate || !form.reason.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/attendance/leave/apply', form);
      toast.success('Leave request submitted successfully!');
      setShowModal(false);
      setForm({ leaveType: 'CASUAL', startDate: '', endDate: '', totalDays: 1, reason: '' });
      fetchLeaves();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to submit leave request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <SkeletonLoader type="table" count={5} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Leave Requests</h2>
          <p className="text-sm text-muted">Apply for leave and track approval status</p>
        </div>
        <motion.button
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <CalendarPlus size={16} /> Apply for Leave
        </motion.button>
      </div>

      {leaves.length === 0 ? (
        <EmptyState
          icon={CalendarPlus}
          title="No leave requests"
          message="You haven't submitted any leave requests yet."
          action={
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
              Apply for Leave
            </button>
          }
        />
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>From</th>
                <th>To</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leaves.map((leave, i) => (
                <motion.tr
                  key={leave._id ?? i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <td><span className="badge badge-primary">{leave.leaveType}</span></td>
                  <td style={{ fontWeight: 600 }}>{new Date(leave.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                  <td style={{ fontWeight: 600 }}>{new Date(leave.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</td>
                  <td>{leave.totalDays}</td>
                  <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text-muted)' }}>{leave.reason}</td>
                  <td><StatusBadge status={leave.status} /></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Apply Leave Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Apply for Leave">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Leave Type <span className="required">*</span></label>
            <select className="form-input" value={form.leaveType} onChange={e => updateField('leaveType', e.target.value)}>
              {leaveTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Start Date <span className="required">*</span></label>
              <input className="form-input" type="date" value={form.startDate} onChange={e => updateField('startDate', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">End Date <span className="required">*</span></label>
              <input className="form-input" type="date" value={form.endDate} onChange={e => updateField('endDate', e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Total Days</label>
            <input className="form-input" type="number" value={form.totalDays} readOnly style={{ opacity: 0.7 }} />
          </div>
          <div className="form-group">
            <label className="form-label">Reason <span className="required">*</span></label>
            <textarea className="form-input" rows={3} placeholder="Explain reason for leave..." value={form.reason} onChange={e => updateField('reason', e.target.value)} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Send size={14} /> {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LeaveTab;
