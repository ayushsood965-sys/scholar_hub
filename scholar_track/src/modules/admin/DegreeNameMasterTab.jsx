import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { Trash2 } from 'lucide-react';

const DegreeNameMasterTab = () => {
  const [data, setData] = useState([]);
  const [degreeTypes, setDegreeTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ degreeTypeId: '', name: '', code: '' });
  const api = useApi();
  const toast = useToast();

  const fetchData = async () => {
    try {
      const [resNames, resTypes] = await Promise.all([
        api.get('/attendance/masters/degree-names'),
        api.get('/attendance/masters/degree-types')
      ]);
      setData(resNames.data);
      setDegreeTypes(resTypes.data);
      if (resTypes.data.length > 0) {
        setFormData(prev => ({ ...prev, degreeTypeId: resTypes.data[0]._id }));
      }
    } catch (err) {
      toast.error('Failed to load degree names');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/attendance/masters/degree-names', formData);
      toast.success('Degree Name created');
      setModalOpen(false);
      setFormData({ ...formData, name: '', code: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating degree name');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await api.delete(`/attendance/masters/degree-names/${id}`);
      toast.success('Deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const columns = [
    { header: 'Degree Type', accessor: (row) => row.degreeTypeId?.name || 'N/A' },
    { header: 'Degree Name', accessor: 'name' },
    { header: 'Code', accessor: 'code' },
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
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Degree Names</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>e.g. M.Sc. Computer Science, B.Tech ECE</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>Add Degree Name</button>
      </div>

      <DataTable columns={columns} data={data} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Degree Name">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Degree Type</label>
            <select className="form-input" required value={formData.degreeTypeId} onChange={e => setFormData({...formData, degreeTypeId: e.target.value})}>
              <option value="">Select Type...</option>
              {degreeTypes.map(t => <option key={t._id} value={t._id}>{t.name} ({t.code})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Name (e.g. B.Tech Computer Science)</label>
            <input className="form-input" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Code (e.g. BTECH-CS)</label>
            <input className="form-input" required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} />
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

export default DegreeNameMasterTab;
