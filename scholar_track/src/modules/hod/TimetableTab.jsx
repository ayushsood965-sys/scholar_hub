import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { Trash2, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TimetableTab = () => {
  const [sessions, setSessions] = useState([]);
  const [degreeTypes, setDegreeTypes] = useState([]);
  const [degreeNames, setDegreeNames] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [faculties, setFaculties] = useState([]);
  
  const [filters, setFilters] = useState({ sessionId: '', degreeTypeId: '', degreeNameId: '', semesterId: '' });
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({ dayOfWeek: 'Monday', startTime: '09:00', endTime: '10:00', subjectCode: '', subjectName: '', facultyId: '' });

  const api = useApi();
  const toast = useToast();

  const fetchMasterData = async () => {
    try {
      const [sesRes, dtRes, dnRes, semRes, facRes] = await Promise.all([
        api.get('/attendance/sessions'),
        api.get('/attendance/masters/degree-types'),
        api.get('/attendance/masters/degree-names'),
        api.get('/attendance/masters/semesters'),
        api.get('/auth/faculty') 
      ]);
      setSessions(sesRes.data);
      setDegreeTypes(dtRes.data);
      setDegreeNames(dnRes.data);
      setSemesters(semRes.data);
      
      const allUsers = facRes.data?.data || facRes.data || [];
      setFaculties(allUsers.filter(u => u.role === 'FACULTY' || u.role === 'HOD'));
    } catch (err) {
      toast.error('Failed to load master data');
    } finally {
      setInitLoading(false);
    }
  };

  useEffect(() => { fetchMasterData(); }, []);

  const selectedType = degreeTypes.find(d => d._id === filters.degreeTypeId);
  const isPhD = selectedType?.code?.toUpperCase() === 'PHD';

  const fetchTimetable = async () => {
    if (!filters.sessionId || !filters.degreeTypeId || !filters.degreeNameId || (!isPhD && !filters.semesterId)) return;
    setLoading(true);
    try {
      const res = await api.get('/attendance/timetables', { params: filters });
      setTimetable(res.data);
    } catch (err) {
      toast.error('Failed to load timetable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTimetable(); }, [filters]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!filters.sessionId || !filters.degreeTypeId || !filters.degreeNameId || (!isPhD && !filters.semesterId)) {
      return toast.error('Please select all filters first');
    }
    try {
      await api.post('/attendance/timetables', { ...formData, ...filters });
      toast.success('Slot added');
      setFormOpen(false);
      setFormData({ ...formData, subjectCode: '', subjectName: '' });
      fetchTimetable();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error adding slot');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this slot?')) return;
    try {
      await api.delete(`/attendance/timetables/${id}`);
      toast.success('Deleted');
      fetchTimetable();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (initLoading) return <SkeletonLoader count={1} height={400} />;

  // Filter degree names based on degree type
  const availableDegreeNames = degreeNames.filter(d => d.degreeTypeId?._id === filters.degreeTypeId);

  return (
    <div className="glass-panel p-xl">
      <div className="flex justify-between items-center mb-lg">
        <div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Timetable Builder</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Build weekly class schedules.</p>
        </div>
      </div>

      <div className="grid-4 mb-lg" style={{ gap: '16px' }}>
        <select className="form-input" value={filters.sessionId} onChange={e => setFilters({...filters, sessionId: e.target.value})}>
          <option value="">Select Session...</option>
          {sessions.map(s => <option key={s._id} value={s._id}>{s.sessionName}</option>)}
        </select>
        <select className="form-input" value={filters.degreeTypeId} onChange={e => {
          setFilters({...filters, degreeTypeId: e.target.value, degreeNameId: '', semesterId: ''});
        }}>
          <option value="">Select Degree Type...</option>
          {degreeTypes.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
        <select className="form-input" value={filters.degreeNameId} onChange={e => setFilters({...filters, degreeNameId: e.target.value})} disabled={!filters.degreeTypeId}>
          <option value="">Select Degree...</option>
          {availableDegreeNames.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
        </select>
        <select 
          className="form-input" 
          value={filters.semesterId} 
          onChange={e => setFilters({...filters, semesterId: e.target.value})}
          disabled={!filters.degreeTypeId || isPhD}
          style={{ opacity: isPhD ? 0.3 : 1 }}
        >
          <option value="">{isPhD ? 'Semester (N/A)' : 'Select Semester...'}</option>
          {!isPhD && semesters.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      </div>

      {!filters.sessionId || !filters.degreeTypeId || !filters.degreeNameId || (!isPhD && !filters.semesterId) ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          Please select all filters to view or build the timetable.
        </div>
      ) : isPhD ? (
        <div className="clay-card p-xl text-center" style={{ color: 'var(--text-secondary)', padding: '60px' }}>
          <h3>PhD Scholars Configuration</h3>
          <p style={{ marginTop: '8px', fontSize: '0.95rem' }}>
            PhD scholars do not operate on weekly timetables or semesters. Attendance is automatically mapped to daily working days check-ins.
          </p>
        </div>
      ) : loading ? (
        <SkeletonLoader count={3} height={100} />
      ) : (
        <div>
          <div className="flex justify-between items-center mb-lg">
            <h3 style={{ color: 'var(--text-primary)' }}>Weekly Schedule</h3>
            {!formOpen && (
              <button className="btn btn-primary" onClick={() => setFormOpen(true)}>
                <Plus size={18} /> Add Slot
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
                      <Plus size={18} /> Add Timetable Slot
                    </span>
                    <button className="inline-form-close" onClick={() => setFormOpen(false)}>
                      <X size={18} />
                    </button>
                  </div>
                  <form onSubmit={handleSubmit}>
                    <div className="grid-3">
                      <div className="form-group">
                        <label className="form-label">Day of Week</label>
                        <select className="form-input" required value={formData.dayOfWeek} onChange={e => setFormData({...formData, dayOfWeek: e.target.value})}>
                          {days.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Start Time (HH:MM)</label>
                        <input type="time" className="form-input" required value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">End Time (HH:MM)</label>
                        <input type="time" className="form-input" required value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Subject Code</label>
                        <input className="form-input" required value={formData.subjectCode} onChange={e => setFormData({...formData, subjectCode: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Subject Name</label>
                        <input className="form-input" required value={formData.subjectName} onChange={e => setFormData({...formData, subjectName: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Faculty</label>
                        <select className="form-input" required value={formData.facultyId} onChange={e => setFormData({...formData, facultyId: e.target.value})}>
                          <option value="">Select Faculty...</option>
                          {faculties.map(f => <option key={f._id} value={f._id}>{f.name} ({f.department})</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
                      <button type="button" className="btn btn-secondary" onClick={() => setFormOpen(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary">Save Slot</button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="timetable-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
            {days.map(day => {
              const daySlots = timetable.filter(t => t.dayOfWeek === day).sort((a,b) => a.startTime.localeCompare(b.startTime));
              return (
                <div key={day} className="clay-card" style={{ padding: '16px', minHeight: '300px' }}>
                  <h4 style={{ textAlign: 'center', marginBottom: '16px', color: 'var(--text-primary)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>{day}</h4>
                  {daySlots.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No classes</div>
                  ) : (
                    daySlots.map(slot => (
                      <div key={slot._id} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '12px', marginBottom: '12px', position: 'relative' }}>
                        <div style={{ fontSize: '0.8rem', color: '#10B981', fontWeight: 'bold' }}>{slot.startTime} - {slot.endTime}</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)', marginTop: '4px' }}>{slot.subjectName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{slot.facultyId?.name || 'Unknown Faculty'}</div>
                        <button 
                          onClick={() => handleDelete(slot._id)}
                          style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableTab;
