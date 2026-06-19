import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { Plus } from 'lucide-react';

const LeaveTab = () => {
  const [leaves, setLeaves] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });
  
  const api = useApi();
  const toast = useToast();

  const fetchLeaves = async () => {
    try {
      const [lRes, ltRes] = await Promise.all([
        api.get('/attendance/leave'),
        api.get('/attendance/leave-types')
      ]);
      setLeaves(lRes.data);
      setLeaveTypes(ltRes.data);
      if (ltRes.data.length > 0) setFormData(prev => ({ ...prev, leaveTypeId: ltRes.data[0]._id }));
    } catch (err) {
      toast.error('Failed to load leaves');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/attendance/leave', formData);
      toast.success('Leave requested successfully');
      setModalOpen(false);
      setFormData({ ...formData, startDate: '', endDate: '', reason: '' });
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error requesting leave');
    }
  };

  const columns = [
    { header: 'Leave Type', accessor: (row) => row.leaveTypeId?.leaveName || 'Unknown' },
    { header: 'Start Date', accessor: (row) => new Date(row.startDate).toLocaleDateString() },
    { header: 'End Date', accessor: (row) => new Date(row.endDate).toLocaleDateString() },
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
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Leave Management</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Apply and track your leave requests.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={18} style={{ marginRight: '8px' }} /> Apply Leave
        </button>
      </div>

      <DataTable columns={columns} data={leaves} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Apply for Leave">
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Leave Type</label>
            <select className="form-input" required value={formData.leaveTypeId} onChange={e => setFormData({...formData, leaveTypeId: e.target.value})}>
              {leaveTypes.map(t => <option key={t._id} value={t._id}>{t.leaveName}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label className="form-label">Start Date</label>
              <input type="date" className="form-input" required value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
            </div>
            <div>
              <label className="form-label">End Date</label>
              <input type="date" className="form-input" required value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Reason</label>
            <textarea className="form-input" required value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} rows={3} />
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Submit Request</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LeaveTab;
