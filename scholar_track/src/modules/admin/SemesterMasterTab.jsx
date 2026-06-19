import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { Trash2 } from 'lucide-react';

const SemesterMasterTab = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', number: '' });
  const api = useApi();
  const toast = useToast();

  const fetchData = async () => {
    try {
      const res = await api.get('/attendance/masters/semesters');
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load semesters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/attendance/masters/semesters', formData);
      toast.success('Semester created');
      setModalOpen(false);
      setFormData({ name: '', number: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating semester');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await api.delete(`/attendance/masters/semesters/${id}`);
      toast.success('Deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const columns = [
    { header: 'Semester Number', accessor: 'number' },
    { header: 'Name', accessor: 'name' },
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
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Semesters</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>e.g. Semester 1, Semester 2</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>Add Semester</button>
      </div>

      <DataTable columns={columns} data={data} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Semester">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Number (e.g. 1)</label>
            <input type="number" min="1" max="10" className="form-input" required value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Name (e.g. Semester 1)</label>
            <input className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
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

export default SemesterMasterTab;
