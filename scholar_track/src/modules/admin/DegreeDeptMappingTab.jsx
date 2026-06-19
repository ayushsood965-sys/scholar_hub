import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { Trash2 } from 'lucide-react';

const DegreeDeptMappingTab = () => {
  const [data, setData] = useState([]);
  const [degreeNames, setDegreeNames] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ degreeNameId: '', departmentId: '' });
  const api = useApi();
  const toast = useToast();

  const fetchData = async () => {
    try {
      const [resMap, resDeg, resDept] = await Promise.all([
        api.get('/attendance/masters/degree-dept-mappings'),
        api.get('/attendance/masters/degree-names'),
        api.get('/departments') // Ensure we have a generic route to get departments
      ]);
      setData(resMap.data);
      setDegreeNames(resDeg.data);
      setDepartments(resDept.data);
      if (resDeg.data.length > 0 && resDept.data.length > 0) {
        setFormData({ degreeNameId: resDeg.data[0]._id, departmentId: resDept.data[0]._id });
      }
    } catch (err) {
      toast.error('Failed to load mappings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/attendance/masters/degree-dept-mappings', formData);
      toast.success('Mapping created');
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error creating mapping');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    try {
      await api.delete(`/attendance/masters/degree-dept-mappings/${id}`);
      toast.success('Deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const columns = [
    { header: 'Degree Type', accessor: (row) => row.degreeNameId?.degreeTypeId?.name || 'N/A' },
    { header: 'Degree Name', accessor: (row) => row.degreeNameId?.name || 'N/A' },
    { header: 'Department', accessor: (row) => row.departmentId?.name || 'N/A' },
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
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Degree-Department Mappings</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Assign degrees to respective departments.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>Add Mapping</button>
      </div>

      <DataTable columns={columns} data={data} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Mapping">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Degree Name</label>
            <select className="form-input" required value={formData.degreeNameId} onChange={e => setFormData({...formData, degreeNameId: e.target.value})}>
              <option value="">Select Degree...</option>
              {degreeNames.map(d => <option key={d._id} value={d._id}>{d.name} ({d.degreeTypeId?.code || ''})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Department</label>
            <select className="form-input" required value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value})}>
              <option value="">Select Department...</option>
              {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
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

export default DegreeDeptMappingTab;
