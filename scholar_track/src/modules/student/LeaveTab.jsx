import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import Modal from '../../components/ui/Modal';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { Plus, FileText, Upload, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const LeaveTab = () => {
  const [leaves, setLeaves] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    leaveTypeId: '',
    startDate: '',
    totalDays: 1,
    endDate: '',
    reason: '',
    documentUrl: ''
  });
  
  const api = useApi();
  const toast = useToast();

  const fetchLeaves = async () => {
    try {
      const [lRes, ltRes] = await Promise.all([
        api.get('/attendance/leave/me'),
        api.get('/attendance/leave-types')
      ]);
      setLeaves(lRes.data);
      setLeaveTypes(ltRes.data);
      if (ltRes.data.length > 0) {
        setFormData(prev => ({ ...prev, leaveTypeId: ltRes.data[0]._id }));
      }
    } catch (err) {
      toast.error('Failed to load leave records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(); }, []);

  // Automatically calculate end date when startDate or totalDays changes
  useEffect(() => {
    if (formData.startDate && formData.totalDays > 0) {
      const start = new Date(formData.startDate);
      const days = parseInt(formData.totalDays, 10);
      const end = new Date(start.getTime() + (days - 1) * 24 * 60 * 60 * 1000);
      setFormData(prev => ({ ...prev, endDate: end.toISOString().split('T')[0] }));
    } else {
      setFormData(prev => ({ ...prev, endDate: '' }));
    }
  }, [formData.startDate, formData.totalDays]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const fileData = new FormData();
    fileData.append('file', file);
    setUploading(true);
    
    try {
      const res = await api.post('/attendance/upload', fileData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({ ...prev, documentUrl: res.data.fileUrl }));
      toast.success('Document uploaded successfully');
    } catch (err) {
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.leaveTypeId) return toast.error('Please select a leave type');

    const selectedLeave = leaveTypes.find(t => t._id === formData.leaveTypeId);
    
    try {
      await api.post('/attendance/leave/apply', {
        leaveType: selectedLeave?.leaveName || 'Leave',
        leaveTypeId: formData.leaveTypeId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        totalDays: parseInt(formData.totalDays, 10),
        reason: formData.reason,
        documentUrl: formData.documentUrl
      });
      toast.success('Leave requested successfully');
      setModalOpen(false);
      setFormData({
        leaveTypeId: leaveTypes[0]?._id || '',
        startDate: '',
        totalDays: 1,
        endDate: '',
        reason: '',
        documentUrl: ''
      });
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error requesting leave');
    }
  };

  const columns = [
    { header: 'Leave Type', accessor: (row) => row.leaveType || 'Unknown' },
    { header: 'Dates', accessor: (row) => `${new Date(row.startDate).toLocaleDateString()} to ${new Date(row.endDate).toLocaleDateString()}` },
    { header: 'Days', accessor: 'totalDays' },
    { header: 'Reason', accessor: 'reason' },
    {
      header: 'Document',
      accessor: (row) => row.documentUrl ? (
        <a href={`${api.defaults.baseURL || ''}${row.documentUrl}`} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'underline' }}>
          <FileText size={16} /> View
        </a>
      ) : (
        <span style={{ color: 'var(--text-muted)' }}>None</span>
      )
    },
    { 
      header: 'Status', 
      accessor: (row) => {
        let cls = 'badge-warning';
        if (row.status === 'APPROVED') cls = 'badge-success';
        if (row.status === 'REJECTED') cls = 'badge-danger';
        return <span className={`badge ${cls}`}>{row.status.replace('_', ' ')}</span>;
      }
    }
  ];

  if (loading) return <SkeletonLoader count={1} height={400} />;

  return (
    <div className="glass-panel p-xl">
      <div className="flex justify-between items-center mb-lg">
        <div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Leave Applications</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Submit leave requests and monitor recommendation/approval status.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
          <Plus size={18} style={{ marginRight: '8px' }} /> Apply Leave
        </button>
      </div>

      <DataTable columns={columns} data={leaves} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Apply for Leave">
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Leave Type</label>
            <select 
              className="form-input" 
              required 
              value={formData.leaveTypeId} 
              onChange={e => setFormData({...formData, leaveTypeId: e.target.value})}
            >
              <option value="">Select Leave Type...</option>
              {leaveTypes.map(t => <option key={t._id} value={t._id}>{t.leaveName} ({t.leaveCode})</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input 
              type="date" 
              className="form-input" 
              required 
              value={formData.startDate} 
              onChange={e => setFormData({...formData, startDate: e.target.value})} 
            />
          </div>

          <div className="form-group">
            <label className="form-label">Number of Days</label>
            <input 
              type="number" 
              min="1" 
              className="form-input" 
              required 
              value={formData.totalDays} 
              onChange={e => setFormData({...formData, totalDays: Math.max(1, parseInt(e.target.value, 10) || 1)})} 
            />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">End Date (Auto-Calculated)</label>
            <div className="form-input" style={{ background: 'rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
              <Calendar size={16} />
              {formData.endDate ? new Date(formData.endDate).toLocaleDateString() : 'Select Start Date & Days'}
            </div>
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Reason</label>
            <textarea 
              className="form-input" 
              required 
              value={formData.reason} 
              onChange={e => setFormData({...formData, reason: e.target.value})} 
              rows={3} 
              placeholder="Provide a detailed explanation for your leave..."
            />
          </div>

          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Supporting Document (Optional)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label className="btn btn-outline" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', margin: 0 }}>
                <Upload size={16} />
                {uploading ? 'Uploading...' : 'Choose File'}
                <input 
                  type="file" 
                  disabled={uploading} 
                  onChange={handleFileUpload} 
                  style={{ display: 'none' }} 
                />
              </label>
              {formData.documentUrl && (
                <span style={{ color: '#10B981', fontSize: '0.85rem', fontWeight: '500' }}>
                  ✓ Document attached
                </span>
              )}
            </div>
          </div>

          <div style={{ gridColumn: 'span 2', display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={uploading}>Submit Application</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default LeaveTab;
