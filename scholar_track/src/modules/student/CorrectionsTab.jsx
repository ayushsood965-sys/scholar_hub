import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { progressiveFetch } from '../../utils/progressiveFetch';
import DataTable from '../../components/ui/DataTable';
import {
  AlertTriangle,
  CalendarDays,
  BookOpen,
  FileText,
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  Send,
  Plus,
  History,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../../config';

const leaveTypeOptions = [
  'Casual Leave', 'Medical Leave', 'Duty Leave', 'Earned Leave', 'Maternity Leave', 'Special Leave'
];

const statusBadge = (status) => {
  const map = {
    PENDING_FACULTY: { cls: 'badge-warning', label: 'Pending Faculty' },
    PENDING_HOD: { cls: 'badge-warning', label: 'Pending HOD' },
    APPROVED: { cls: 'badge-success', label: 'Approved ✓' },
    REJECTED: { cls: 'badge-danger', label: 'Rejected ✗' }
  };
  const s = map[status] || { cls: 'badge-neutral', label: status };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
};

const CorrectionsTab = () => {
  const [dates, setDates] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [currentAbsentSubjects, setCurrentAbsentSubjects] = useState([]);
  const [currentRecordId, setCurrentRecordId] = useState('');

  const [correctionType, setCorrectionType] = useState('PRESENT');
  const [leaveType, setLeaveType] = useState('');
  const [reason, setReason] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const api = useApi();
  const toast = useToast();

  const fetchData = async () => {
    try {
      // 1. Fetch absences first (typically a small list of active dates)
      const datesRes = await api.get('/attendance/my-absences');
      setDates(datesRes.data);

      // 2. Fetch correction history progressively
      await progressiveFetch(api, '/attendance/corrections/me', {}, (data, isBackground) => {
        if (!isBackground) {
          setCorrections(data);
          setLoading(false);
        } else {
          setCorrections(prev => {
            const existingIds = new Set(prev.map(c => c._id));
            const uniqueNew = data.filter(c => !existingIds.has(c._id));
            return [...prev, ...uniqueNew];
          });
        }
      });
    } catch (err) {
      toast.error('Failed to load correction data');
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDateSelect = (dateStr) => {
    setSelectedDate(dateStr);
    const dateEntry = dates.find(d => {
      const dStr = new Date(d.date).toISOString().split('T')[0];
      return dStr === dateStr;
    });
    if (dateEntry) {
      setCurrentAbsentSubjects(dateEntry.absentSubjects || []);
      setCurrentRecordId(dateEntry.recordId || '');
      setSelectedSubjects([]);
    } else {
      setCurrentAbsentSubjects([]);
      setCurrentRecordId('');
      setSelectedSubjects([]);
    }
    setCorrectionType('PRESENT');
    setLeaveType('');
    setReason('');
    setFile(null);
  };

  const handleSubjectToggle = (slotId) => {
    setSelectedSubjects(prev =>
      prev.includes(slotId) ? prev.filter(id => id !== slotId) : [...prev, slotId]
    );
  };

  const handleSelectAllSubjects = () => {
    const eligible = currentAbsentSubjects.filter(s => s.eligible);
    if (selectedSubjects.length === eligible.length) {
      setSelectedSubjects([]);
    } else {
      setSelectedSubjects(eligible.map(s => s.timetableSlotId));
    }
  };

  const handleFileUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    if (selectedFile.size > 5 * 1024 * 1024) {
      return toast.error('File size must be under 5MB');
    }
    setFile(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedDate || !currentRecordId) {
      return toast.error('Please select a date with absent subjects.');
    }
    if (selectedSubjects.length === 0) {
      return toast.error('Please select at least one subject to correct.');
    }
    if (!reason || reason.trim().length < 10) {
      return toast.error('Please provide a detailed reason (at least 10 characters).');
    }
    if (correctionType === 'ON_LEAVE' && !leaveType) {
      return toast.error('Please select a leave type for "On Leave" correction.');
    }

    // Check if this is a 2nd attempt (last chance)
    const hasLastChanceSubjects = selectedSubjects.some(slotId => {
      const sub = currentAbsentSubjects.find(s => s.timetableSlotId === slotId);
      return sub?.correctionAttempts + 1 >= 2;
    });

    if (hasLastChanceSubjects) {
      const confirmed = window.confirm(
        '⚠️ Final Attempt Warning\n\n' +
        'One or more selected subjects have already had one correction request that was rejected. ' +
        'This will be your final attempt for these subjects. After submission, you will NOT be able to ' +
        'request correction for these subjects again.\n\n' +
        'Do you want to proceed?'
      );
      if (!confirmed) return;
    }

    setSubmitting(true);
    try {
      let documentUrl = '';
      if (file) {
        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await api.post('/attendance/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        documentUrl = uploadRes.data.fileUrl;
        setUploading(false);
      }

      const res = await api.post('/attendance/corrections', {
        recordId: currentRecordId,
        timetableSlotIds: selectedSubjects,
        correctionType,
        leaveType: correctionType === 'ON_LEAVE' ? leaveType : '',
        reason,
        documentUrl
      });

      if (res.data.isLastChance) {
        toast.success(res.data.message, { duration: 8000 });
      } else {
        toast.success(res.data.message);
      }

      setFormOpen(false);
      setSelectedDate('');
      setSelectedSubjects([]);
      setCorrectionType('PRESENT');
      setLeaveType('');
      setReason('');
      setFile(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error submitting correction request');
    } finally {
      setSubmitting(false);
    }
  };

  const correctionColumns = [
    {
      header: 'Date',
      accessor: (row) => row.recordId?.date
        ? new Date(row.recordId.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'N/A'
    },
    {
      header: 'Subjects',
      accessor: (row) => {
        const subCount = row.timetableSlotIds?.length || 0;
        return subCount > 0 ? `${subCount} subject(s)` : 'All';
      }
    },
    {
      header: 'Request',
      accessor: (row) => row.correctionType === 'ON_LEAVE'
        ? `On Leave (${row.leaveType || 'N/A'})`
        : row.correctionType || 'Present'
    },
    {
      header: 'Reason',
      accessor: (row) => row.reason?.substring(0, 50) + (row.reason?.length > 50 ? '...' : '')
    },
    {
      header: 'Attempt',
      accessor: (row) => `#${row.correctionAttempt || 1}`
    },
    {
      header: 'Status',
      accessor: (row) => {
        const map = {
          PENDING_FACULTY: { cls: 'badge-warning', label: 'Pending Faculty' },
          PENDING_HOD: { cls: 'badge-warning', label: 'Pending HOD' },
          APPROVED: { cls: 'badge-success', label: 'Approved ✓' },
          REJECTED: { cls: 'badge-danger', label: 'Rejected ✗' }
        };
        const s = map[row.status] || { cls: 'badge-neutral', label: row.status };
        return <span className={`badge ${s.cls}`}>{s.label}</span>;
      }
    },
    {
      header: 'Submitted',
      accessor: (row) => new Date(row.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    }
  ];

  if (loading) return <SkeletonLoader count={1} height={400} />;

  const eligibleDates = dates.filter(d => d.absentSubjects?.some(s => s.eligible));

  return (
    <div className="glass-panel p-xl">
      <div className="flex justify-between items-center mb-lg">
        <div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Attendance Correction Requests</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Request corrections for absent records. Maximum 2 attempts per subject per date.
          </p>
        </div>
        {!formOpen && eligibleDates.length > 0 && (
          <button className="btn btn-primary" onClick={() => setFormOpen(true)}>
            <Plus size={16} /> Request Correction
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
                  <Plus size={18} /> Request Attendance Correction
                </span>
                <button className="inline-form-close" onClick={() => setFormOpen(false)}>
                  <XCircle size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                {/* Step 1: Select Date */}
                <div className="form-group">
                  <label className="form-label">
                    <CalendarDays size={14} /> Select Absent Date
                  </label>
                  <select className="form-input" value={selectedDate} onChange={e => handleDateSelect(e.target.value)} required>
                    <option value="">Select a date with absent marks...</option>
                    {eligibleDates.map(d => {
                      const dateStr = new Date(d.date).toISOString().split('T')[0];
                      const subCount = d.absentSubjects?.filter(s => s.eligible).length || 0;
                      return (
                        <option key={d.recordId} value={dateStr}>
                          {new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {' — '}{subCount} subject(s)
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Step 2: Select Subjects */}
                {selectedDate && currentAbsentSubjects.length > 0 && (
                  <div className="form-group" style={{ marginTop: 16 }}>
                    <div className="flex justify-between items-center mb-md">
                      <label className="form-label">
                        <BookOpen size={14} /> Select Subjects to Correct
                      </label>
                      <button type="button" className="btn btn-sm btn-outline" onClick={handleSelectAllSubjects}>
                        {selectedSubjects.length === currentAbsentSubjects.filter(s => s.eligible).length ? 'Deselect All' : 'Select All'}
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                      {currentAbsentSubjects.map(sub => {
                        const slotId = sub.timetableSlotId;
                        const isSelected = selectedSubjects.includes(slotId);
                        const isLocked = sub.locked;
                        const isEligible = sub.eligible;

                        return (
                          <div
                            key={slotId}
                            onClick={() => { if (isLocked || !isEligible) return; handleSubjectToggle(slotId); }}
                            className="glass-card"
                            style={{
                              padding: '10px 14px',
                              cursor: isLocked || !isEligible ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              opacity: isLocked ? 0.5 : 1,
                              border: isSelected
                                ? '2px solid var(--color-primary)'
                                : isLocked
                                  ? '2px solid #EF4444'
                                  : '1px solid rgba(255,255,255,0.15)'
                            }}
                          >
                            <div style={{
                              width: '20px', height: '20px', borderRadius: '5px',
                              border: isSelected ? 'none' : '2px solid var(--color-border-solid)',
                              background: isSelected ? 'var(--color-primary)' : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                              {isSelected && <CheckCircle size={12} color="#fff" />}
                              {isLocked && <Lock size={12} color="#EF4444" />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                                {sub.subjectName || 'Unknown Subject'}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                                Code: {sub.subjectCode || 'N/A'}
                              </div>
                            </div>
                            {isLocked && (
                              <span className="badge" style={{ background: '#FEE2E2', color: '#DC2626', fontSize: '0.6rem' }}>
                                Max Attempts
                              </span>
                            )}
                            {!isEligible && !isLocked && sub.latestStatus === 'PENDING_FACULTY' && (
                              <span className="badge badge-warning" style={{ fontSize: '0.6rem' }}>Pending</span>
                            )}
                            {!isEligible && !isLocked && sub.latestStatus === 'PENDING_HOD' && (
                              <span className="badge badge-warning" style={{ fontSize: '0.6rem' }}>Pending HOD</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {selectedSubjects.length > 0 && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--color-primary)', marginTop: '8px' }}>
                        {selectedSubjects.length} subject(s) selected
                      </p>
                    )}
                  </div>
                )}

                {/* Step 3: Correction Type */}
                {selectedSubjects.length > 0 && (
                  <div className="grid-2" style={{ marginTop: 16 }}>
                    <div className="form-group">
                      <label className="form-label">Requested Status</label>
                      <select className="form-input" value={correctionType} onChange={e => setCorrectionType(e.target.value)}>
                        <option value="PRESENT">Present</option>
                        <option value="ON_LEAVE">On Leave</option>
                      </select>
                    </div>
                    {correctionType === 'ON_LEAVE' && (
                      <div className="form-group">
                        <label className="form-label">Type of Leave</label>
                        <select className="form-input" value={leaveType} onChange={e => setLeaveType(e.target.value)} required>
                          <option value="">Select leave type...</option>
                          {leaveTypeOptions.map(lt => (
                            <option key={lt} value={lt}>{lt}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 4: Reason */}
                {selectedSubjects.length > 0 && (
                  <div className="form-group" style={{ marginTop: 16 }}>
                    <label className="form-label">
                      <FileText size={14} /> Reason for Correction
                    </label>
                    <textarea
                      className="form-input"
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      rows={3}
                      placeholder="Explain why the attendance should be corrected..."
                      style={{ minHeight: '80px' }}
                    />
                  </div>
                )}

                {/* Step 5: File Upload */}
                {selectedSubjects.length > 0 && (
                  <div className="form-group" style={{ marginTop: 12 }}>
                    <label className="form-label">
                      <Upload size={14} /> Supporting Document <span style={{ fontWeight: 400, color: 'var(--color-text-muted)' }}>(Optional)</span>
                    </label>
                    <div style={{
                      border: '2px dashed var(--color-border-solid)',
                      borderRadius: 'var(--radius-md)',
                      padding: '20px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: 'rgba(99, 102, 241, 0.03)'
                    }}
                      onClick={() => document.getElementById('correction-file-input').click()}
                    >
                      <input
                        id="correction-file-input"
                        type="file"
                        style={{ display: 'none' }}
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={handleFileUpload}
                      />
                      {file ? (
                        <div>
                          <CheckCircle size={24} style={{ color: '#10B981', margin: '0 auto 8px' }} />
                          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                            {file.name}
                          </p>
                          <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      ) : (
                        <div>
                          <Upload size={24} style={{ color: 'var(--color-text-muted)', margin: '0 auto 8px', opacity: 0.5 }} />
                          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                            Click to upload (PDF, JPG, PNG, DOC) - max 5MB
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Submit */}
                {selectedSubjects.length > 0 && (
                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setFormOpen(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={submitting || uploading}>
                      <Send size={16} /> {submitting ? 'Submitting...' : 'Submit Correction'}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Correction Requests History */}
      <div style={{ marginTop: 24 }}>
        <div className="flex items-center gap-sm mb-md">
          <History size={18} style={{ color: 'var(--color-primary)' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Correction Requests Raised by You
          </h3>
          <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
            {corrections.length} total
          </span>
        </div>
        {corrections.length > 0 ? (
          <DataTable columns={correctionColumns} data={corrections} />
        ) : (
          <div className="glass-panel p-xl" style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--color-text-muted)', marginBottom: '12px' }}>
              <History size={40} style={{ margin: '0 auto', opacity: 0.3 }} />
            </div>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
              No correction requests raised yet. Use the button above to submit your first request.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CorrectionsTab;
