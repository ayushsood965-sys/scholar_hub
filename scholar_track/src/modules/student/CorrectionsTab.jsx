import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import SkeletonLoader from '../../components/ui/SkeletonLoader';

const CorrectionsTab = () => {
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Note: For a real app, you'd probably load the student's recent absences to select from.
  // Here we assume the student knows the record Date and Subject, or we can fetch a list of recent 'ABSENT' records.
  const [recentAbsences, setRecentAbsences] = useState([]);
  const [formData, setFormData] = useState({ recordId: '', requestedStatus: 'PRESENT', reason: '' });

  const api = useApi();
  const toast = useToast();

  const fetchCorrections = async () => {
    try {
      const res = await api.get('/attendance/corrections/me');
      setCorrections(res.data);
    } catch (err) {
      toast.error('Failed to load corrections');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentAbsences = async () => {
    try {
      // Assuming a specific endpoint to get recent absences for corrections
      // If not available, we can mock or adapt. For now, we simulate an empty array or adapt logic.
      // E.g., api.get('/attendance/my-absences')
      const res = await api.get('/attendance/my-absences').catch(() => ({ data: [] }));
      setRecentAbsences(res.data);
      if (res.data.length > 0) setFormData(prev => ({ ...prev, recordId: res.data[0]._id }));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { 
    fetchCorrections(); 
    fetchRecentAbsences();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.recordId) return toast.error('No record selected');
    try {
      await api.post('/attendance/corrections', formData);
      toast.success('Correction requested successfully');
      setModalOpen(false);
      setFormData({ ...formData, reason: '' });
      fetchCorrections();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error requesting correction');
    }
  };

  const columns = [
    { header: 'Record Date', accessor: (row) => row.recordId?.date ? new Date(row.recordId.date).toLocaleDateString() : 'N/A' },
    { header: 'Requested Status', accessor: 'requestedStatus' },
    { header: 'Reason', accessor: 'reason' },
    { 
      header: 'Status', 
      accessor: (row) => {
        let cls = 'badge-warning';
        if (row.status === 'APPROVED') cls = 'badge-success';
        if (row.status === 'REJECTED') cls = 'badge-danger';
        return <span className={`badge ${cls}`}>{row.status}</span>;
      }
    }
  ];

  if (loading) return <SkeletonLoader count={1} height={400} />;

  return (
    <div className="glass-panel p-xl">
      <div className="flex justify-between items-center mb-lg">
        <div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Correction Requests</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Request fixes for inaccurately marked absences.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>Request Correction</button>
      </div>

      <DataTable columns={columns} data={corrections} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Request Attendance Correction">
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Select Absent Record</label>
            <select className="form-input" required value={formData.recordId} onChange={e => setFormData({...formData, recordId: e.target.value})}>
              <option value="">Select a recent absence...</option>
              {recentAbsences.map(r => {
                const classesStr = r.classes && r.classes.length > 0
                  ? r.classes.map(c => c.subjectName).join(', ')
                  : r.courseName || 'Daily Check-In';
                return (
                  <option key={r._id} value={r._id}>
                    {new Date(r.date).toLocaleDateString()} - {classesStr}
                  </option>
                );
              })}
              {recentAbsences.length === 0 && <option value="" disabled>No eligible records found</option>}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Requested Status</label>
            <select className="form-input" value={formData.requestedStatus} onChange={e => setFormData({...formData, requestedStatus: e.target.value})}>
              <option value="PRESENT">Present</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Reason</label>
            <textarea className="form-input" required value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} rows={3} placeholder="Explain why this should be corrected..." />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={recentAbsences.length === 0}>Submit</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CorrectionsTab;
