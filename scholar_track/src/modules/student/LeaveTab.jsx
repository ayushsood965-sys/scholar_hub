import React, { useState, useEffect, useMemo } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { Plus, X, FileText, Upload, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LeaveTab = () => {
  const [leaves, setLeaves] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    totalDays: 0,
    reason: '',
    documentUrl: '',
    isHalfDay: false
  });
  const [holidays, setHolidays] = useState([]);
  
  const api = useApi();
  const toast = useToast();

  const fetchLeaves = async () => {
    try {
      const [lRes, ltRes, holRes, meRes] = await Promise.all([
        api.get('/attendance/leave/me'),
        api.get('/attendance/leave-types'),
        api.get('/attendance/holidays'),
        api.get('/auth/me')
      ]);
      setLeaves(lRes.data);
      setLeaveTypes(ltRes.data || []);
      setHolidays(holRes.data || []);
      setCurrentUser(meRes.data);

      // Filter leave types by gender to set the initial select value
      const studentGender = meRes.data?.profile?.gender || 'All';
      const initialFiltered = (ltRes.data || []).filter(lt => {
        if (!lt.isActive) return false;
        if (lt.applicableGender === 'All') return true;
        return lt.applicableGender.toLowerCase() === studentGender.toLowerCase();
      });

      if (initialFiltered.length > 0) {
        setFormData(prev => ({ ...prev, leaveTypeId: initialFiltered[0]._id }));
      } else {
        setFormData(prev => ({ ...prev, leaveTypeId: '' }));
      }
    } catch (err) {
      toast.error('Failed to load leave records');
    } finally {
      setLoading(false);
    }
  };

  const filteredLeaveTypes = useMemo(() => {
    const studentGender = currentUser?.profile?.gender || 'All';
    return leaveTypes.filter(lt => {
      if (!lt.isActive) return false;
      if (lt.applicableGender === 'All') return true;
      return lt.applicableGender.toLowerCase() === studentGender.toLowerCase();
    });
  }, [leaveTypes, currentUser]);

  useEffect(() => { fetchLeaves(); }, []);

  // Automatically calculate total days when startDate, endDate or leaveType changes
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end < start) {
        setFormData(prev => ({ ...prev, totalDays: 0 }));
        return;
      }
      
      const selectedLeave = leaveTypes.find(t => t._id === formData.leaveTypeId);
      
      if (formData.isHalfDay && formData.startDate !== formData.endDate) {
        setFormData(prev => ({ ...prev, isHalfDay: false }));
        return;
      }

      if (formData.isHalfDay) {
        setFormData(prev => ({ ...prev, totalDays: 0.5 }));
        return;
      }

      let count = 0;
      let cur = new Date(start);
      while (cur <= end) {
        const day = cur.getDay(); // 0 = Sunday
        const curStr = cur.toISOString().split('T')[0];
        const isSun = (day === 0);
        const isHoli = holidays.some(h => {
          const hStart = new Date(h.startDate).toISOString().split('T')[0];
          const hEnd = new Date(h.endDate).toISOString().split('T')[0];
          return curStr >= hStart && curStr <= hEnd;
        });
        
        if (selectedLeave?.includeHolidays) {
          count++;
        } else {
          if (!isSun && !isHoli) {
            count++;
          }
        }
        cur.setDate(cur.getDate() + 1);
      }
      setFormData(prev => ({ ...prev, totalDays: count }));
    } else {
      setFormData(prev => ({ ...prev, totalDays: 0 }));
    }
  }, [formData.startDate, formData.endDate, formData.leaveTypeId, formData.isHalfDay, leaveTypes, holidays]);

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
    if (!formData.startDate || !formData.endDate) return toast.error('Please select start and end dates');

    const selectedLeave = leaveTypes.find(t => t._id === formData.leaveTypeId);
    if (!selectedLeave) return toast.error('Selected leave type is invalid');

    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      return toast.error('End date cannot be before start date');
    }

    if (formData.isHalfDay && formData.startDate !== formData.endDate) {
      return toast.error('Half-day leaves can only be applied for a single day.');
    }

    if (formData.totalDays === 0) {
      return toast.error('Selected leave period does not contain any working days.');
    }

    // Validate minDaysPerRequest
    if (selectedLeave.minDaysPerRequest && formData.totalDays < selectedLeave.minDaysPerRequest) {
      return toast.error(`Minimum duration for this leave request must be at least ${selectedLeave.minDaysPerRequest} day(s).`);
    }

    // Validate advanceNoticeDays
    if (selectedLeave.advanceNoticeDays > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const start = new Date(formData.startDate);
      start.setHours(0, 0, 0, 0);
      const daysDiff = (start - today) / (1000 * 60 * 60 * 24);
      if (daysDiff < selectedLeave.advanceNoticeDays) {
        return toast.error(`Advance notice of ${selectedLeave.advanceNoticeDays} days is required for this leave type.`);
      }
    }

    if (selectedLeave.documentUploadRule === 'mandatory' && !formData.documentUrl) {
      return toast.error('Supporting document upload is mandatory for this leave type.');
    }
    
    try {
      await api.post('/attendance/leave/apply', {
        leaveTypeId: formData.leaveTypeId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        totalDays: formData.totalDays,
        reason: formData.reason,
        documentUrl: formData.documentUrl,
        isHalfDay: formData.isHalfDay
      });
      toast.success('Leave requested successfully');
      setFormOpen(false);
      setFormData({
        leaveTypeId: filteredLeaveTypes[0]?._id || '',
        startDate: '',
        endDate: '',
        totalDays: 0,
        reason: '',
        documentUrl: '',
        isHalfDay: false
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
        {!formOpen && (
          <button className="btn btn-primary" onClick={() => setFormOpen(true)}>
            <Plus size={18} /> Apply Leave
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
                  <Plus size={18} /> Apply for Leave
                </span>
                <button className="inline-form-close" onClick={() => setFormOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                {(() => {
                  const selectedLeave = leaveTypes.find(t => t._id === formData.leaveTypeId);
                  if (!selectedLeave) return null;
                  return (
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '20px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: '12px'
                    }}>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Leave Limit</span>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          {selectedLeave.maxDaysLimit ? `${selectedLeave.maxDaysLimit} days per ${selectedLeave.maxDaysLimitType || 'year'}` : 'No Limit'}
                        </strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Min Days Required</span>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          {selectedLeave.minDaysPerRequest || 1} day(s)
                        </strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Advance Notice Needed</span>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          {selectedLeave.advanceNoticeDays || 'No notice'} {selectedLeave.advanceNoticeDays > 0 ? 'day(s)' : ''}
                        </strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Half-Day Policy</span>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          {selectedLeave.allowHalfDay ? 'Allowed' : 'Not Allowed'}
                        </strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Holidays & Weekends</span>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          {selectedLeave.includeHolidays ? 'Count as Leave' : 'Excluded'}
                        </strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Document Upload</span>
                        <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          {selectedLeave.documentUploadRule === 'mandatory' ? 'Mandatory' : selectedLeave.documentUploadRule === 'optional' ? 'Optional' : 'Not Required'}
                        </strong>
                      </div>
                    </div>
                  );
                })()}

                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Leave Type</label>
                    <select 
                      className="form-input" 
                      required 
                      value={formData.leaveTypeId} 
                      onChange={e => setFormData({...formData, leaveTypeId: e.target.value})}
                    >
                      <option value="">Select Leave Type...</option>
                      {filteredLeaveTypes.map(t => <option key={t._id} value={t._id}>{t.leaveName} ({t.leaveCode})</option>)}
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
                    <label className="form-label">End Date</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      required 
                      value={formData.endDate} 
                      onChange={e => setFormData({...formData, endDate: e.target.value})} 
                    />
                  </div>
                </div>

                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Calculated Working Days</label>
                    <div className="form-input" style={{ background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', fontWeight: 'bold' }}>
                      <Calendar size={16} />
                      {formData.totalDays} Day(s)
                    </div>
                  </div>

                  <div className="form-group">
                    {(() => {
                      const selectedLeave = leaveTypes.find(t => t._id === formData.leaveTypeId);
                      if (selectedLeave?.allowHalfDay && formData.startDate && formData.endDate && formData.startDate === formData.endDate) {
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '42px', marginTop: '28px' }}>
                            <input 
                              type="checkbox" 
                              id="isHalfDay" 
                              checked={formData.isHalfDay} 
                              onChange={e => setFormData({ ...formData, isHalfDay: e.target.checked })} 
                              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <label htmlFor="isHalfDay" className="form-label" style={{ margin: 0, cursor: 'pointer', userSelect: 'none' }}>
                              Apply as Half-Day Leave
                            </label>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Supporting Document 
                      {(() => {
                        const selectedLeave = leaveTypes.find(t => t._id === formData.leaveTypeId);
                        if (selectedLeave?.documentUploadRule === 'mandatory') return ' (Mandatory)';
                        if (selectedLeave?.documentUploadRule === 'optional') return ' (Optional)';
                        return ' (Not Required)';
                      })()}
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', height: '42px' }}>
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
                </div>

                <div className="form-group">
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

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setFormOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={uploading}>Submit Application</button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <DataTable columns={columns} data={leaves} />
    </div>
  );
};

export default LeaveTab;
