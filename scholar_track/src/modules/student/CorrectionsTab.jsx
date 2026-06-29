import React, { useState, useEffect, useContext } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { AuthContext } from '../../context/AuthContext';
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
  Lock,
  Layers,
  GraduationCap
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
  const { user } = useContext(AuthContext);
  const isPhD = user?.profile?.isPhD || false;

  const [dates, setDates] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

  // Form selections states
  const [semesters, setSemesters] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedDate, setSelectedDate] = useState(''); // Stores the recordId
  const [selectedSubject, setSelectedSubject] = useState(''); // Stores the timetableSlotId
  
  const [currentAbsentSubjects, setCurrentAbsentSubjects] = useState([]);
  const [currentRecordId, setCurrentRecordId] = useState('');

  const [correctionType, setCorrectionType] = useState('PRESENT');
  const [leaveType, setLeaveType] = useState('');
  const [reason, setReason] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // For timeline tracking modal
  const [selectedCorrectionDetails, setSelectedCorrectionDetails] = useState(null);

  const api = useApi();
  const toast = useToast();

  const fetchSemesters = async () => {
    try {
      const [semRes, sdmRes] = await Promise.all([
        api.get('/attendance/masters/semesters'),
        api.get('/attendance/masters/semester-degree-mappings')
      ]);
      const sems = semRes.data || [];
      const sdm = sdmRes.data || [];
      const studentDegreeNameId = user?.profile?.degreeNameId;
      if (studentDegreeNameId) {
        const mappedIds = sdm
          .filter(m => m && (m.degreeNameId?._id || m.degreeNameId) === studentDegreeNameId)
          .map(m => m.semesterId?._id || m.semesterId)
          .filter(Boolean);
        const filtered = sems.filter(s => s && mappedIds.includes(s._id));
        setSemesters(filtered);
      } else {
        setSemesters(sems);
      }
    } catch (err) {
      toast.error('Failed to load semesters');
    }
  };

  const fetchAbsences = async (semId) => {
    try {
      const params = semId ? { semesterId: semId } : {};
      const res = await api.get('/attendance/my-absences', { params });
      setDates(res.data || []);
    } catch (err) {
      toast.error('Failed to load absent records');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch corrections history progressively
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

  useEffect(() => {
    fetchData();
    if (user && !isPhD) {
      fetchSemesters();
    }
  }, [user]);

  useEffect(() => {
    if (isPhD) {
      fetchAbsences();
    } else if (selectedSemester) {
      fetchAbsences(selectedSemester);
    } else {
      setDates([]);
    }
  }, [selectedSemester, isPhD]);

  const handleDateSelect = (recordId) => {
    setSelectedDate(recordId);
    setSelectedSubject('');
    const dateEntry = dates.find(d => d.recordId === recordId);
    if (dateEntry) {
      setCurrentAbsentSubjects(dateEntry.absentSubjects || []);
      setCurrentRecordId(recordId);
    } else {
      setCurrentAbsentSubjects([]);
      setCurrentRecordId('');
    }
    setCorrectionType('PRESENT');
    setLeaveType('');
    setReason('');
    setFile(null);
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

    if (!selectedDate) {
      return toast.error('Please select an absent date.');
    }
    if (!isPhD && !selectedSubject) {
      return toast.error('Please select a class/subject to correct.');
    }
    if (!reason || reason.trim().length < 10) {
      return toast.error('Please provide a detailed reason (at least 10 characters).');
    }
    if (correctionType === 'ON_LEAVE' && !leaveType) {
      return toast.error('Please select a leave type for "On Leave" correction.');
    }

    // Check if this is a 2nd attempt (last chance)
    const selectedSlotId = isPhD ? null : selectedSubject;
    const hasLastChance = !isPhD && (() => {
      const sub = currentAbsentSubjects.find(s => s.timetableSlotId === selectedSlotId);
      return sub?.correctionAttempts + 1 >= 2;
    })();

    if (hasLastChance) {
      const confirmed = window.confirm(
        '⚠️ Final Attempt Warning\n\n' +
        'This subject/date correction request has already had one attempt rejected. ' +
        'This will be your final attempt. After submission, you will NOT be able to ' +
        'request correction for this subject/date again.\n\n' +
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
        timetableSlotIds: isPhD ? [] : [selectedSubject],
        correctionType,
        leaveType: correctionType === 'ON_LEAVE' ? leaveType : '',
        reason,
        documentUrl
      });

      if (res.data.isLastChance) {
        toast.success(res.data.message, { duration: 8000 });
      } else {
        toast.success(res.data.message || 'Correction requested successfully');
      }

      setFormOpen(false);
      setSelectedSemester('');
      setSelectedDate('');
      setSelectedSubject('');
      setCurrentAbsentSubjects([]);
      setCurrentRecordId('');
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
      accessor: (row) => {
        const dateVal = row.recordId?.date || row.customDate;
        return dateVal
          ? new Date(dateVal).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
          : 'N/A';
      }
    },
    {
      header: 'Subject/Class',
      accessor: (row) => {
        const subCount = row.timetableSlotIds?.length || 0;
        return subCount > 0 ? `${subCount} subject(s)` : 'Daily Check-in';
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
    },
    {
      header: 'Timeline',
      accessor: (row) => (
        <button 
          className="btn btn-secondary btn-sm"
          style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '4px' }}
          onClick={() => setSelectedCorrectionDetails(row)}
        >
          View Timeline
        </button>
      )
    }
  ];

  if (loading) return <SkeletonLoader count={1} height={400} />;

  const eligibleDates = dates;

  const isDateSelected = !!selectedDate;
  const isSubjectRequired = !isPhD;
  const isSubjectSelected = isPhD || !!selectedSubject;
  const showNextSteps = isDateSelected && isSubjectSelected;

  return (
    <div className="glass-panel p-xl">
      <div className="flex justify-between items-center mb-lg">
        <div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Attendance Correction Requests</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Request corrections for absent records. Maximum 2 attempts per subject per date.
          </p>
        </div>
        {!formOpen && (
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
                <button className="inline-form-close" onClick={() => { setFormOpen(false); setSelectedSemester(''); setSelectedDate(''); setSelectedSubject(''); }}>
                  <XCircle size={18} />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="grid-2">
                  {/* Step 1a: Select Semester (only if not PhD) */}
                  {!isPhD && (
                    <div className="form-group">
                      <label className="form-label">
                        <GraduationCap size={14} /> Select Semester
                      </label>
                      <select 
                        className="form-input" 
                        value={selectedSemester} 
                        onChange={e => {
                          setSelectedSemester(e.target.value);
                          setSelectedDate('');
                          setSelectedSubject('');
                          setCurrentAbsentSubjects([]);
                        }} 
                        required
                      >
                        <option value="">Choose semester...</option>
                        {semesters.map(sem => (
                          <option key={sem._id} value={sem._id}>
                            {sem.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Step 1b: Select Absent Date */}
                  {(isPhD || selectedSemester) && (
                    <div className="form-group">
                      <label className="form-label">
                        <CalendarDays size={14} /> Select Absent Date
                      </label>
                      <select 
                        className="form-input" 
                        value={selectedDate} 
                        onChange={e => handleDateSelect(e.target.value)} 
                        required
                      >
                        <option value="">Choose date...</option>
                        {eligibleDates.map(d => (
                          <option key={d.recordId} value={d.recordId}>
                            {new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                            {!isPhD && ` — ${d.absentSubjects?.length || 0} class(es)`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Step 2: Select Subject (only if not PhD) */}
                {!isPhD && selectedDate && (
                  <div className="form-group" style={{ marginTop: 16 }}>
                    <label className="form-label">
                      <BookOpen size={14} /> Select Class / Subject
                    </label>
                    <select 
                      className="form-input" 
                      value={selectedSubject} 
                      onChange={e => setSelectedSubject(e.target.value)} 
                      required
                    >
                      <option value="">Choose subject class...</option>
                      {currentAbsentSubjects.map(sub => (
                        <option key={sub.timetableSlotId} value={sub.timetableSlotId} disabled={sub.locked}>
                          {sub.subjectName} ({sub.subjectCode})
                          {sub.locked ? ' — Locked (Max attempts reached)' : ''}
                          {!sub.eligible && !sub.locked && sub.latestStatus ? ` — Pending Status: ${sub.latestStatus}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Step 3: Correction Type */}
                {showNextSteps && (
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
                {showNextSteps && (
                  <div className="form-group" style={{ marginTop: 16 }}>
                    <label className="form-label">
                      <FileText size={14} /> Reason / Remarks for Appeal
                    </label>
                    <textarea
                      className="form-input"
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      rows={3}
                      placeholder="Explain why the attendance should be corrected..."
                      style={{ minHeight: '80px' }}
                      required
                    />
                  </div>
                )}

                {/* Step 5: File Upload */}
                {showNextSteps && (
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
                {showNextSteps && (
                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px', justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setFormOpen(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={submitting || uploading}>
                      <Send size={16} /> {submitting ? 'Submitting...' : 'Submit Appeal'}
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

      {/* Timeline Stepper Modal */}
      <AnimatePresence>
        {selectedCorrectionDetails && (
          <div className="modal-backdrop" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }} onClick={() => setSelectedCorrectionDetails(null)}>
            <motion.div 
              className="glass-panel" 
              style={{ 
                maxWidth: '520px', 
                width: '100%', 
                padding: '24px', 
                background: 'var(--color-bg)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border-solid)',
                boxShadow: 'var(--shadow-xl)',
                position: 'relative'
              }}
              onClick={e => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <div className="flex justify-between items-center mb-md pb-xs" style={{ borderBottom: '1px solid var(--color-border-solid)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={18} style={{ color: 'var(--color-primary)' }} />
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>
                    Correction Appeal Timeline
                  </h3>
                </div>
                <button className="inline-form-close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }} onClick={() => setSelectedCorrectionDetails(null)}>
                  <XCircle size={20} />
                </button>
              </div>

              {/* General details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px', fontSize: '0.88rem', color: 'var(--color-text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border-solid)' }}>
                <div>
                  <strong>Date of Absence:</strong> {
                    (selectedCorrectionDetails.recordId?.date || selectedCorrectionDetails.customDate)
                      ? new Date(selectedCorrectionDetails.recordId?.date || selectedCorrectionDetails.customDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                      : 'N/A'
                  }
                </div>
                <div>
                  <strong>Assigned Faculty:</strong> {selectedCorrectionDetails.facultyId?.name || 'Supervisor'}
                </div>
                <div>
                  <strong>Your Appeal Reason:</strong> <span style={{ color: 'var(--color-text-primary)' }}>{selectedCorrectionDetails.reason}</span>
                </div>
                {selectedCorrectionDetails.documentUrl && (
                  <div>
                    <strong>Attachment:</strong>{' '}
                    <a href={`${API_BASE_URL}${selectedCorrectionDetails.documentUrl}`} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'underline', fontWeight: 500 }}>
                      View Reference Document
                    </a>
                  </div>
                )}
              </div>

              {/* Timeline Stepper */}
              <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '14px', color: 'var(--color-text-primary)' }}>
                Transition Stages & Remarks
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '24px', maxHeight: '250px', overflowY: 'auto' }}>
                <div style={{ position: 'absolute', left: '9px', top: '6px', bottom: '6px', width: '2px', background: 'var(--color-border-solid)' }}></div>
                
                {(selectedCorrectionDetails.auditLog || []).map((log, index) => {
                  const isLast = index === (selectedCorrectionDetails.auditLog.length - 1);
                  let nodeColor = 'var(--color-text-muted)';
                  if (log.action === 'APPROVED') nodeColor = '#10B981';
                  else if (log.action === 'REJECTED') nodeColor = '#EF4444';
                  else if (log.action === 'RECOMMENDED') nodeColor = '#F59E0B';
                  else if (log.action === 'SUBMITTED') nodeColor = 'var(--color-primary)';

                  return (
                    <div key={log._id || index} style={{ position: 'relative' }}>
                      {/* Node point */}
                      <div style={{
                        position: 'absolute',
                        left: '-20px',
                        top: '5px',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: nodeColor,
                        border: '2px solid var(--color-bg)',
                        boxShadow: '0 0 0 2px rgba(255,255,255,0.05)'
                      }}></div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {log.action}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                          By {log.actorName} • {new Date(log.timestamp).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {log.remarks && (
                          <p style={{ fontSize: '0.8rem', marginTop: '4px', background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '6px', fontStyle: 'italic', color: 'var(--color-text-secondary)', borderLeft: '3px solid var(--color-primary)' }}>
                            "{log.remarks}"
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CorrectionsTab;
