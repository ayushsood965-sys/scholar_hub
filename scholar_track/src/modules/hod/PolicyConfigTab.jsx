import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { Edit2 } from 'lucide-react';

const PolicyConfigTab = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    programType: 'PG', minRequiredPercentage: 75, warningThreshold: 80,
    maxCondonationPercentage: 10, editLockHours: 48,
    allowHalfDay: true, allowMedicalLeave: true, allowDutyLeave: true,
    allowCorrection: true, correctionWindowDays: 14
  });
  const api = useApi();
  const toast = useToast();

  const fetchData = async () => {
    try {
      const res = await api.get('/attendance/policies');
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/attendance/policies', formData);
      toast.success('Policy updated successfully');
      setModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error('Error updating policy');
    }
  };

  const handleEdit = (policy) => {
    setFormData(policy);
    setModalOpen(true);
  };

  const columns = [
    { header: 'Program Type', accessor: 'programType' },
    { header: 'Min Required %', accessor: 'minRequiredPercentage' },
    { header: 'Warning %', accessor: 'warningThreshold' },
    { header: 'Lock Hours', accessor: 'editLockHours' },
    {
      header: 'Actions',
      accessor: (row) => (
        <button className="btn btn-sm btn-outline" onClick={() => handleEdit(row)}>
          <Edit2 size={16} /> Edit
        </button>
      )
    }
  ];

  if (loading) return <SkeletonLoader count={1} height={400} />;

  return (
    <div className="glass-panel p-xl">
      <div className="flex justify-between items-center mb-lg">
        <div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Policy Configuration</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Configure attendance policies per program type.</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setFormData({
            programType: 'PG', minRequiredPercentage: 75, warningThreshold: 80,
            maxCondonationPercentage: 10, editLockHours: 48,
            allowHalfDay: true, allowMedicalLeave: true, allowDutyLeave: true,
            allowCorrection: true, correctionWindowDays: 14
          });
          setModalOpen(true);
        }}>Add/Update Policy</button>
      </div>

      <DataTable columns={columns} data={data} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Configure Policy">
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Program Type</label>
            <select className="form-input" value={formData.programType} onChange={e => setFormData({...formData, programType: e.target.value})}>
              <option value="PhD">PhD</option>
              <option value="PG">PG</option>
              <option value="UG">UG</option>
              <option value="Diploma">Diploma</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Min. Required %</label>
            <input type="number" className="form-input" required value={formData.minRequiredPercentage} onChange={e => setFormData({...formData, minRequiredPercentage: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Warning Threshold %</label>
            <input type="number" className="form-input" required value={formData.warningThreshold} onChange={e => setFormData({...formData, warningThreshold: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Max Condonation %</label>
            <input type="number" className="form-input" required value={formData.maxCondonationPercentage} onChange={e => setFormData({...formData, maxCondonationPercentage: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Faculty Edit Lock (Hours)</label>
            <input type="number" className="form-input" required value={formData.editLockHours} onChange={e => setFormData({...formData, editLockHours: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Correction Window (Days)</label>
            <input type="number" className="form-input" required value={formData.correctionWindowDays} onChange={e => setFormData({...formData, correctionWindowDays: e.target.value})} />
          </div>
          
          <div style={{ gridColumn: 'span 2', display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PolicyConfigTab;
