import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { CalendarRange, Clock, Plus, Trash2, Save } from 'lucide-react';
import api from '../../hooks/useApi';
import { AuthContext } from '../../context/AuthContext';
import Modal from '../../components/ui/Modal';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../context/ToastContext';

const TimetableTab = () => {
  const { user } = useContext(AuthContext);
  const toast = useToast();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    courseCode: '',
    courseName: '',
    dayOfWeek: 'Monday',
    startTime: '09:00',
    endTime: '10:00'
  });

  const fetchSlots = async () => {
    try {
      const { data } = await api.get('/attendance/timetables');
      setSlots(data ?? []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load timetable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.courseCode.trim() || !form.courseName.trim()) {
      toast.error('Course code and course name are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        facultyId: user._id
      };
      await api.post('/attendance/timetables', payload);
      toast.success('Timetable slot added successfully!');
      setShowModal(false);
      setForm({
        courseCode: '',
        courseName: '',
        dayOfWeek: 'Monday',
        startTime: '09:00',
        endTime: '10:00'
      });
      fetchSlots();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to create slot.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/attendance/timetables/${id}`);
      toast.success('Slot removed from timetable.');
      fetchSlots();
    } catch (err) {
      toast.error('Failed to remove slot.');
    }
  };

  if (loading) return <SkeletonLoader type="table" count={5} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Semester Timetable Master</h2>
          <p className="text-sm text-muted">Configure and view your scheduled classes for the current semester</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Class Slot
        </button>
      </div>

      {slots.length === 0 ? (
        <EmptyState 
          icon={CalendarRange} 
          title="No scheduled classes" 
          message="Define your semester class timetable slots to manage attendance marking." 
        />
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Course Name</th>
                <th>Day of Week</th>
                <th>Time Slot</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {slots.map((s, i) => (
                <motion.tr 
                  key={s._id ?? i} 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  transition={{ delay: i * 0.04 }}
                >
                  <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{s.courseCode}</td>
                  <td style={{ fontWeight: 600 }}>{s.courseName}</td>
                  <td>
                    <span className="badge badge-neutral">{s.dayOfWeek}</span>
                  </td>
                  <td>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-secondary)' }}>
                      <Clock size={13} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{s.startTime} - {s.endTime}</span>
                    </div>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-danger btn-icon" onClick={() => handleDelete(s._id)} title="Delete Slot">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Timetable Slot">
        <form onSubmit={handleSave}>
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Course Code</label>
              <input 
                className="form-input" 
                value={form.courseCode} 
                onChange={e => setForm(p => ({ ...p, courseCode: e.target.value.toUpperCase() }))} 
                placeholder="e.g. CS-501" 
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Course Name</label>
              <input 
                className="form-input" 
                value={form.courseName} 
                onChange={e => setForm(p => ({ ...p, courseName: e.target.value }))} 
                placeholder="e.g. Distributed Databases" 
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Day of Week</label>
            <select 
              className="form-input" 
              value={form.dayOfWeek} 
              onChange={e => setForm(p => ({ ...p, dayOfWeek: e.target.value }))}
            >
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </select>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Start Time</label>
              <input 
                type="time"
                className="form-input" 
                value={form.startTime} 
                onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))} 
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Time</label>
              <input 
                type="time"
                className="form-input" 
                value={form.endTime} 
                onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))} 
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={14} /> {saving ? 'Adding...' : 'Add Slot'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TimetableTab;
