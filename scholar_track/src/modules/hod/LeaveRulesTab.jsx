import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { Trash2 } from 'lucide-react';

const LeaveRulesTab = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    leaveName: '', leaveCode: '', maxDaysPerYear: 10,
    requiresDocument: false, countsAsPresent: true
  });
  const api = useApi();
  const toast = useToast();

  const fetchData = async () => {
    try {
      const res = await api.get('/attendance/leave-types');
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load leave types');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/attendance/leave-types', formData);
      toast.success('Leave Type created');
      setModalOpen(false);
      setFormData({ leaveName: '', leaveCode: '', maxDaysPerYear: 10, requiresDocument: false, countsAsPresent: true });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating leave type');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await api.delete(`/attendance/leave-types/${id}`);
      toast.success('Deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const columns = [
    { header: 'Leave Name', accessor: 'leaveName' },
    { header: 'Code', accessor: 'leaveCode' },
    { header: 'Max Days/Yr', accessor: 'maxDaysPerYear' },
    { header: 'Counts As Present', accessor: (row) => row.countsAsPresent ? 'Yes' : 'No' },
    {
      header: 'Actions',
      accessor: (row) => (
        <button className="btn btn-sm btn-outline" style={{ color: '#EF4444', borderColor: '#EF4444' }} onClick={() => handleDelete(row._id)}>
          <Trash2 size={16} />
        </button>
      )
    }
  ];

  if (loading) return <SkeletonLoader count={1} height={400} />;

  return (
    <div className="glass-panel p-xl">
      <div className="flex justify-between items-center mb-lg">
        <div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Leave Rules</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Configure allowed leave types.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>Add Leave Type</button>
      </div>

      <DataTable columns={columns} data={data} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Leave Type">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Leave Name</label>
            <input className="form-input" required value={formData.leaveName} onChange={e => setFormData({...formData, leaveName: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Leave Code (e.g. DL for Duty Leave)</label>
            <input className="form-input" required value={formData.leaveCode} onChange={e => setFormData({...formData, leaveCode: e.target.value.toUpperCase()})} />
          </div>
          <div className="form-group">
            <label className="form-label">Max Days Per Year</label>
            <input type="number" className="form-input" required value={formData.maxDaysPerYear} onChange={e => setFormData({...formData, maxDaysPerYear: e.target.value})} />
          </div>
          <div className="form-group" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input type="checkbox" id="docReq" checked={formData.requiresDocument} onChange={e => setFormData({...formData, requiresDocument: e.target.checked})} />
            <label htmlFor="docReq" className="form-label" style={{ marginBottom: 0 }}>Requires Documentation</label>
          </div>
          <div className="form-group" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input type="checkbox" id="presentReq" checked={formData.countsAsPresent} onChange={e => setFormData({...formData, countsAsPresent: e.target.checked})} />
            <label htmlFor="presentReq" className="form-label" style={{ marginBottom: 0 }}>Counts as Present (Credit Attendance)</label>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LeaveRulesTab;
