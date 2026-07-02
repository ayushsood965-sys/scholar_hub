import React, { useState, useEffect, useContext } from 'react';
import { API_BASE_URL } from '../../config';
import useApi from '../../hooks/useApi';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { progressiveFetch } from '../../utils/progressiveFetch';
import DataTable from '../../components/ui/DataTable';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, FileText, UserCheck, ShieldCheck, Calendar, Clock } from 'lucide-react';

const ApprovalsTab = () => {
  const { user } = useContext(AuthContext);
  const [leaves, setLeaves] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [approvedRegistrations, setApprovedRegistrations] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [assignedSupervisors, setAssignedSupervisors] = useState({});
  const [selectedRegForModal, setSelectedRegForModal] = useState(null);
  const [actionRemarks, setActionRemarks] = useState({}); // per-row remarks input
  const [processing, setProcessing] = useState({}); // per-row processing action
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('registrations'); // registrations | leaves | corrections
  
  const api = useApi();
  const toast = useToast();

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      
      const facultyRes = await api.get('/auth/faculty');
      const deptFaculty = facultyRes.data.filter(f => 
        f.department === user?.department && 
        (f.role === 'FACULTY' || f.role === 'HOD') && 
        f.isActive && 
        f.isVerified
      );
      setFaculties(deptFaculty);

      // Fetch pending leaves progressively
      progressiveFetch(api, '/attendance/leave/pending', {}, (data, isBackground) => {
        if (!isBackground) {
          setLeaves(data);
          setLoading(false);
        } else {
          setLeaves(prev => {
            const existingIds = new Set(prev.map(l => l._id));
            const uniqueNew = data.filter(l => !existingIds.has(l._id));
            return [...prev, ...uniqueNew];
          });
        }
      });

      // Fetch pending corrections progressively
      progressiveFetch(api, '/attendance/corrections/pending', {}, (data, isBackground) => {
        if (!isBackground) {
          setCorrections(data);
        } else {
          setCorrections(prev => {
            const existingIds = new Set(prev.map(c => c._id));
            const uniqueNew = data.filter(c => !existingIds.has(c._id));
            return [...prev, ...uniqueNew];
          });
        }
      });

      // Fetch pending registrations (ONLY non-PhD)
      const fetchPendingNonPhd = async () => {
        try {
          const nonPhdRes = await api.get('/auth/students?profileCompleted=true&isVerified=false&isPhD=false');
          const nonPhdRegs = (nonPhdRes.data || []).map(u => ({
            _id: u._id,
            isNonPhD: true,
            scholarId: u,
            enrollmentNumber: u.profile?.enrollmentNumber || '—',
            status: 'REGISTRATION_PENDING',
            title: `${u.profile?.degreeType || 'Non-PhD'} Registration`
          }));
          setRegistrations(nonPhdRegs);
        } catch (e) {
          setRegistrations([]);
        }
      };
      fetchPendingNonPhd();

      // Fetch approved registrations (ONLY non-PhD)
      const fetchApprovedNonPhd = async () => {
        try {
          const approvedNonPhdRes = await api.get('/auth/students?profileCompleted=true&isVerified=true&isPhD=false');
          const approvedNonPhdRegs = (approvedNonPhdRes.data || []).map(u => ({
            _id: u._id,
            isNonPhD: true,
            scholarId: u,
            enrollmentNumber: u.profile?.enrollmentNumber || '—',
            status: 'APPROVED',
            title: `${u.profile?.degreeType || 'Non-PhD'} Registration`,
            approvedAt: u.updatedAt
          }));
          setApprovedRegistrations(approvedNonPhdRegs);
        } catch (err) {
          console.error('Failed to fetch approved registrations', err);
        }
      };
      fetchApprovedNonPhd();

    } catch (err) {
      toast.error('Failed to load pending approvals');
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (user) fetchApprovals(); 
  }, [user]);

  const handleLeaveAction = async (id, action) => {
    const remarks = actionRemarks[id] || '';
    if (!remarks || remarks.trim().length < 5) {
      return toast.error('Please provide remarks (at least 5 characters) before proceeding.');
    }
    setProcessing(prev => ({ ...prev, [id]: action }));
    try {
      const res = await api.put(`/attendance/leave/${id}/action`, { action, remarks: remarks.trim() });
      const actionLabel = action === 'APPROVE' ? 'Approved' : 'Rejected';
      toast.success(`Leave ${actionLabel} successfully`);
      setActionRemarks(prev => ({ ...prev, [id]: '' }));
      fetchApprovals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error processing leave');
    } finally {
      setProcessing(prev => ({ ...prev, [id]: null }));
    }
  };

  const handleCorrectionAction = async (id, action) => {
    try {
      await api.put(`/attendance/corrections/${id}/action`, { action, remarks: `HOD ${action}` });
      toast.success(`Correction ${action.toLowerCase()} successfully`);
      fetchApprovals();
    } catch (err) {
      toast.error('Error processing correction');
    }
  };

  const handleApproveRegistration = async (regId) => {
    const reg = registrations.find(r => r._id === regId);
    if (!reg) return;

    if (reg.isNonPhD) {
      try {
        setLoading(true);
        // Verify non-PhD student account
        await api.put(`/auth/users/${regId}/verify`, {});
        toast.success('Student profile verified and approved successfully');
        fetchApprovals();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to verify student');
      } finally {
        setLoading(false);
      }
      return;
    }

    const supervisorId = assignedSupervisors[regId];
    if (!supervisorId) {
      toast.error('Please assign a faculty supervisor first');
      return;
    }

    try {
      setLoading(true);
      // 1. Assign supervisor
      await api.put(`/thesis/${regId}/assign`, { supervisorId });
      // 2. Verify enrollment
      await api.put(`/thesis/${regId}/verify`, {});
      
      toast.success('Scholar registration approved and supervisor assigned successfully');
      setAssignedSupervisors(prev => {
        const copy = { ...prev };
        delete copy[regId];
        return copy;
      });
      fetchApprovals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve registration');
    } finally {
      setLoading(false);
    }
  };

  const leaveColumns = [
    {
      header: 'Student',
      accessor: (row) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
            {row.studentId?.name || 'Unknown'}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
            {row.studentId?.username || ''} {row.studentId?.profile?.shNo ? `| SH: ${row.studentId.profile.shNo}` : ''}
          </div>
        </div>
      )
    },
    { header: 'Leave Type', accessor: (row) => <span style={{ fontSize: '0.85rem' }}>{row.leaveType || 'N/A'}</span> },
    {
      header: 'Duration',
      accessor: (row) => (
        <div style={{ fontSize: '0.82rem' }}>
          <div>{new Date(row.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — {new Date(row.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>
            <Calendar size={10} style={{ display: 'inline', marginRight: 2 }} />
            {row.totalDays} day{row.totalDays > 1 ? 's' : ''}
          </div>
        </div>
      )
    },
    {
      header: 'Document',
      accessor: (row) => row.documentUrl ? (
        <a
          href={`${API_BASE_URL}${row.documentUrl}`}
          target="_blank"
          rel="noreferrer"
          className="btn btn-sm btn-outline"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
        >
          <FileText size={12} /> View File
        </a>
      ) : (
        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>No file</span>
      )
    },
    {
      header: 'Applied On',
      accessor: (row) => (
        <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
          <Clock size={10} style={{ display: 'inline', marginRight: 2 }} />
          {new Date(row.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: (row) => {
        const map = {
          PENDING_SUPERVISOR: { cls: 'badge-warning', label: 'Pending Review' },
          PENDING_HOD: { cls: 'badge-warning', label: 'Pending HOD' },
          APPROVED: { cls: 'badge-success', label: 'Approved' },
          REJECTED: { cls: 'badge-danger', label: 'Rejected' }
        };
        const s = map[row.status] || { cls: 'badge-neutral', label: row.status };
        return <span className={`badge ${s.cls}`}>{s.label}</span>;
      }
    },
    {
      header: 'Remarks',
      accessor: (row) => (
        <input
          type="text"
          placeholder="Min 5 chars..."
          value={actionRemarks[row._id] || ''}
          onChange={e => setActionRemarks(prev => ({ ...prev, [row._id]: e.target.value }))}
          style={{
            width: '100%',
            minWidth: '120px',
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-border-solid)',
            background: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
            fontSize: '0.78rem',
            outline: 'none'
          }}
        />
      )
    },
    {
      header: 'Actions',
      accessor: (row) => {
        const isProcessing = processing[row._id];
        if (row.status === 'PENDING_HOD') {
          return (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-sm btn-outline"
                style={{ borderColor: '#10B981', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => handleLeaveAction(row._id, 'APPROVE')}
                disabled={!!isProcessing}
              >
                <CheckCircle size={14} /> {isProcessing === 'APPROVE' ? '...' : 'Approve'}
              </button>
              <button
                className="btn btn-sm btn-outline"
                style={{ borderColor: '#EF4444', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={() => handleLeaveAction(row._id, 'REJECT')}
                disabled={!!isProcessing}
              >
                <XCircle size={14} /> {isProcessing === 'REJECT' ? '...' : 'Reject'}
              </button>
            </div>
          );
        }
        if (row.status === 'PENDING_SUPERVISOR') {
          return <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Pending Faculty Review</span>;
        }
        return <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>—</span>;
      }
    }
  ];

  const correctionColumns = [
    { header: 'Student Name', accessor: (row) => row.studentId?.name || 'Unknown' },
    { header: 'Record Date', accessor: (row) => row.recordId?.date ? new Date(row.recordId.date).toLocaleDateString() : 'Unknown' },
    { header: 'Requested Status', accessor: 'requestedStatus' },
    { header: 'Reason', accessor: 'reason' },
    {
      header: 'Actions',
      accessor: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-sm" style={{ background: '#10B981', color: '#fff' }} onClick={() => handleCorrectionAction(row._id, 'APPROVE')}>
            <CheckCircle size={16} />
          </button>
          <button className="btn btn-sm" style={{ background: '#EF4444', color: '#fff' }} onClick={() => handleCorrectionAction(row._id, 'REJECT')}>
            <XCircle size={16} />
          </button>
        </div>
      )
    }
  ];

  const renderRegistrationDetails = (reg) => {
    const profile = reg.scholarId?.profile || {};
    const q = profile.qualifications || {};

    const getDocLink = (certUrl) => {
      if (!certUrl) return <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No Certificate Uploaded</span>;
      return (
        <a 
          href={`${API_BASE_URL}${certUrl}`} 
          target="_blank" 
          rel="noopener noreferrer" 
          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#3B82F6', fontWeight: 600, fontSize: '0.82rem' }}
        >
          <FileText size={14} /> View Document
        </a>
      );
    };

    return (
      <tr key={`${reg._id}-details`}>
        <td colSpan="5" style={{ padding: '0px' }}>
          <div style={{
            background: 'var(--color-surface-elevated)',
            padding: '24px',
            borderBottom: '2px solid var(--color-border)',
            borderLeft: '4px solid var(--color-primary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {/* Candidate General Details */}
            <div>
              <h4 style={{ color: 'var(--color-primary)', marginBottom: '12px', borderBottom: '1px solid var(--color-border-solid)', paddingBottom: '6px' }}>Personal Profile</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', fontSize: '0.85rem' }}>
                <div><strong>DOB:</strong> {profile.dob || '—'}</div>
                <div><strong>Gender:</strong> {profile.gender || '—'}</div>
                <div><strong>Category:</strong> {profile.category || '—'}</div>
                <div><strong>Nationality:</strong> {profile.nationality || '—'}</div>
                <div><strong>Father's Name:</strong> {profile.fatherName || '—'}</div>
                <div><strong>Mother's Name:</strong> {profile.motherName || '—'}</div>
                <div><strong>Phone Number:</strong> {profile.phoneNumber || '—'}</div>
                <div><strong>Address:</strong> {profile.address || '—'}</div>
              </div>
            </div>

            {/* Academic Session, Mode, Type */}
            <div>
              <h4 style={{ color: 'var(--color-primary)', marginBottom: '12px', borderBottom: '1px solid var(--color-border-solid)', paddingBottom: '6px' }}>PhD Admission Parameters</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', fontSize: '0.85rem' }}>
                <div><strong>Academic Session:</strong> {profile.academicSession || '—'}</div>
                <div><strong>Degree Type:</strong> {profile.degreeType || 'Ph.D.'}</div>
                <div><strong>PhD Mode:</strong> {profile.phdMode || '—'}</div>
                <div><strong>Admission Date:</strong> {profile.admissionDate || '—'}</div>
                <div style={{ gridColumn: 'span 2' }}><strong>Research Title/Area:</strong> {profile.thesisTitle || profile.areaOfInterest || '—'}</div>
                <div style={{ gridColumn: 'span 2' }}><strong>Preferred Supervisor ID:</strong> {profile.preferredGuideId || '—'}</div>
              </div>
            </div>

            {/* Qualifications Matrix */}
            <div>
              <h4 style={{ color: 'var(--color-primary)', marginBottom: '12px', borderBottom: '1px solid var(--color-border-solid)', paddingBottom: '6px' }}>Academic Qualifications</h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border-solid)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '8px' }}>Level</th>
                      <th style={{ padding: '8px' }}>Degree/Board</th>
                      <th style={{ padding: '8px' }}>School/College</th>
                      <th style={{ padding: '8px' }}>Roll No</th>
                      <th style={{ padding: '8px' }}>Percentage</th>
                      <th style={{ padding: '8px' }}>Certificate</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '8px', fontWeight: 600 }}>Class 10</td>
                      <td style={{ padding: '8px' }}>{q.class10?.board || '—'}</td>
                      <td style={{ padding: '8px' }}>{q.class10?.school || '—'}</td>
                      <td style={{ padding: '8px' }}>{q.class10?.rollNo || '—'}</td>
                      <td style={{ padding: '8px' }}>{q.class10?.percentage ? `${q.class10.percentage}%` : '—'}</td>
                      <td style={{ padding: '8px' }}>{getDocLink(q.class10?.certificateUrl)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '8px', fontWeight: 600 }}>Class 12</td>
                      <td style={{ padding: '8px' }}>{q.class12?.board || '—'}</td>
                      <td style={{ padding: '8px' }}>{q.class12?.school || '—'}</td>
                      <td style={{ padding: '8px' }}>{q.class12?.rollNo || '—'}</td>
                      <td style={{ padding: '8px' }}>{q.class12?.percentage ? `${q.class12.percentage}%` : '—'}</td>
                      <td style={{ padding: '8px' }}>{getDocLink(q.class12?.certificateUrl)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '8px', fontWeight: 600 }}>Graduation</td>
                      <td style={{ padding: '8px' }}>{q.graduation?.degree || '—'}</td>
                      <td style={{ padding: '8px' }}>{q.graduation?.college || '—'} ({q.graduation?.university})</td>
                      <td style={{ padding: '8px' }}>{q.graduation?.rollNo || '—'}</td>
                      <td style={{ padding: '8px' }}>{q.graduation?.percentage ? `${q.graduation.percentage}%` : '—'}</td>
                      <td style={{ padding: '8px' }}>{getDocLink(q.graduation?.certificateUrl)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '8px', fontWeight: 600 }}>Post Graduation</td>
                      <td style={{ padding: '8px' }}>{q.postGraduation?.degree || '—'}</td>
                      <td style={{ padding: '8px' }}>{q.postGraduation?.college || '—'} ({q.postGraduation?.university})</td>
                      <td style={{ padding: '8px' }}>{q.postGraduation?.rollNo || '—'}</td>
                      <td style={{ padding: '8px' }}>{q.postGraduation?.percentage ? `${q.postGraduation.percentage}%` : '—'}</td>
                      <td style={{ padding: '8px' }}>{getDocLink(q.postGraduation?.certificateUrl)}</td>
                    </tr>
                    {q.netJrf?.qualified && (
                      <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '8px', fontWeight: 600 }}>NET / JRF</td>
                        <td style={{ padding: '8px' }}>Cert No: {q.netJrf?.certNumber || '—'}</td>
                        <td style={{ padding: '8px' }}>Rank/Score: {q.netJrf?.rank || '—'} / {q.netJrf?.score}</td>
                        <td style={{ padding: '8px' }}>Roll: {q.netJrf?.rollNo || '—'}</td>
                        <td style={{ padding: '8px' }}>Issue Date: {q.netJrf?.issueDate || '—'}</td>
                        <td style={{ padding: '8px' }}>{getDocLink(q.netJrf?.certificateUrl)}</td>
                      </tr>
                    )}
                    {q.otherQuals && q.otherQuals.map((o, idx) => (
                      <tr key={`other-${idx}`} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '8px', fontWeight: 600 }}>Other ({o.type === 'Other' ? o.otherType : o.type})</td>
                        <td style={{ padding: '8px' }}>{o.board || '—'}</td>
                        <td style={{ padding: '8px' }}>{o.school || '—'}</td>
                        <td style={{ padding: '8px' }}>{o.rollNo || '—'}</td>
                        <td style={{ padding: '8px' }}>{o.marksObtained}/{o.totalMarks} ({o.percentage ? (o.percentage.endsWith('%') ? o.percentage : `${o.percentage}%`) : '—'})</td>
                        <td style={{ padding: '8px' }}>{getDocLink(o.certificateUrl)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </td>
      </tr>
    );
  };

  if (loading && !leaves.length && !corrections.length && !registrations.length) {
    return <SkeletonLoader count={1} height={400} />;
  }

  return (
    <div className="glass-panel p-xl">
      <div className="mb-lg">
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Department Approvals Queue</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Review student leaves, attendance corrections, and new PhD registrations.</p>
      </div>

      {/* Tab selection */}
      <div className="tab-header mb-lg" style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--color-border-solid)', paddingBottom: '12px' }}>
        <button 
          className={`tab-btn ${activeSubTab === 'registrations' ? 'active' : ''}`} 
          style={{ background: 'none', border: 'none', color: activeSubTab === 'registrations' ? 'var(--color-primary)' : 'var(--text-secondary)', fontWeight: activeSubTab === 'registrations' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '0.95rem' }}
          onClick={() => setActiveSubTab('registrations')}
        >
          Registrations ({registrations.length})
        </button>
        <button 
          className={`tab-btn ${activeSubTab === 'leaves' ? 'active' : ''}`} 
          style={{ background: 'none', border: 'none', color: activeSubTab === 'leaves' ? 'var(--color-primary)' : 'var(--text-secondary)', fontWeight: activeSubTab === 'leaves' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '0.95rem' }}
          onClick={() => setActiveSubTab('leaves')}
        >
          Leave Requests ({leaves.length})
        </button>
        <button 
          className={`tab-btn ${activeSubTab === 'corrections' ? 'active' : ''}`} 
          style={{ background: 'none', border: 'none', color: activeSubTab === 'corrections' ? 'var(--color-primary)' : 'var(--text-secondary)', fontWeight: activeSubTab === 'corrections' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '0.95rem' }}
          onClick={() => setActiveSubTab('corrections')}
        >
          Corrections ({corrections.length})
        </button>
      </div>

      {activeSubTab === 'leaves' && (
        leaves.length === 0 ? (
          <div className="glass-panel p-xl" style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--color-text-muted)', marginBottom: '12px' }}>
              <CheckCircle size={48} style={{ margin: '0 auto', opacity: 0.3 }} />
            </div>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              No pending leave requests assigned to you.
            </p>
          </div>
        ) : (
          <DataTable columns={leaveColumns} data={leaves} />
        )
      )}
      {activeSubTab === 'corrections' && <DataTable columns={correctionColumns} data={corrections} />}
      
      {activeSubTab === 'registrations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {/* Pending Registrations Grid */}
          <div>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>
              Pending Verification Requests
            </h3>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Scholar Name</th>
                    <th>Degree / Program</th>
                    <th>Enrollment Number</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map(reg => {
                    return (
                      <tr key={reg._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{reg.scholarId?.name || 'Pending Profile'}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{reg.scholarId?.username}</div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {reg.scholarId?.profile?.degreeType || (reg.isNonPhD ? 'Non-PhD' : 'Ph.D.')}
                          </span>
                        </td>
                        <td>
                          <span style={{ background: 'var(--color-surface-elevated)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid var(--color-border-solid)' }}>
                            {reg.enrollmentNumber || '—'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="btn btn-sm btn-outline"
                            style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                            onClick={() => setSelectedRegForModal(reg)}
                          >
                            <FileText size={14} /> View & Approve
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {registrations.length === 0 && (
                    <tr>
                      <td colSpan="4" className="text-center" style={{ padding: '32px', color: 'var(--text-secondary)' }}>
                        No pending registration verification requests.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Approved Registrations Grid */}
          <div>
            <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px' }}>
              Approved / Verified Registrations
            </h3>
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Scholar Name</th>
                    <th>Degree / Program</th>
                    <th>Enrollment Number</th>
                    <th>Approved Timestamp</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedRegistrations.map(reg => {
                    return (
                      <tr key={reg._id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{reg.scholarId?.name || 'Approved Scholar'}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{reg.scholarId?.username}</div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            {reg.scholarId?.profile?.degreeType || (reg.isNonPhD ? 'Non-PhD' : 'Ph.D.')}
                          </span>
                        </td>
                        <td>
                          <span style={{ background: 'var(--color-surface-elevated)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid var(--color-border-solid)' }}>
                            {reg.enrollmentNumber || '—'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            {reg.approvedAt ? new Date(reg.approvedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="btn btn-sm btn-outline"
                            style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                            onClick={() => setSelectedRegForModal({ ...reg, isApprovedView: true })}
                          >
                            <FileText size={14} /> View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {approvedRegistrations.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center" style={{ padding: '32px', color: 'var(--text-secondary)' }}>
                        No approved registrations found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* View & Approve Modal */}
      {selectedRegForModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            color: '#0f172a',
            borderRadius: '16px',
            padding: '28px',
            width: '100%',
            maxWidth: '850px',
            maxHeight: '85vh',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Header (Fixed) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border-solid)', paddingBottom: '16px', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                Verify Candidate Registration Request
              </h3>
              <button 
                onClick={() => setSelectedRegForModal(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
              >
                <XCircle size={24} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', paddingRight: '8px' }}>
              {/* Section 1: Personal & Admission Details */}
              <div>
                <h4 style={{ color: 'var(--color-primary)', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', borderBottom: '1px solid var(--color-border-solid)', paddingBottom: '6px' }}>
                  1. General & Admission Parameters
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', fontSize: '0.85rem' }}>
                  <div><strong>Full Name:</strong> {selectedRegForModal.scholarId?.name || '—'}</div>
                  <div><strong>Email (Username):</strong> {selectedRegForModal.scholarId?.username || '—'}</div>
                  <div><strong>Department:</strong> {selectedRegForModal.scholarId?.department || '—'}</div>
                  <div><strong>DOB:</strong> {selectedRegForModal.scholarId?.profile?.dob || '—'}</div>
                  <div><strong>Gender:</strong> {selectedRegForModal.scholarId?.profile?.gender || '—'}</div>
                  <div><strong>Category:</strong> {selectedRegForModal.scholarId?.profile?.category || '—'}</div>
                  <div><strong>Nationality:</strong> {selectedRegForModal.scholarId?.profile?.nationality || '—'}</div>
                  <div><strong>Phone Number:</strong> {selectedRegForModal.scholarId?.profile?.phoneNumber || '—'}</div>
                  <div><strong>Residential Address:</strong> {selectedRegForModal.scholarId?.profile?.address || '—'}</div>
                  <div><strong>Father's Name:</strong> {selectedRegForModal.scholarId?.profile?.fatherName || '—'}</div>
                  <div><strong>Mother's Name:</strong> {selectedRegForModal.scholarId?.profile?.motherName || '—'}</div>
                  <div><strong>Academic Session:</strong> {selectedRegForModal.scholarId?.profile?.academicSession || '—'}</div>
                  <div><strong>HPU ERP Admission No:</strong> {selectedRegForModal.scholarId?.profile?.erpAdmissionNo || '—'}</div>
                  <div><strong>Specialization:</strong> {selectedRegForModal.scholarId?.profile?.specialization || '—'}</div>
                  <div><strong>Degree Type:</strong> {selectedRegForModal.scholarId?.profile?.degreeType || (selectedRegForModal.isNonPhD ? 'N/A' : 'Ph.D.')}</div>
                  {!selectedRegForModal.isNonPhD && (
                    <>
                      <div><strong>PhD Mode:</strong> {selectedRegForModal.scholarId?.profile?.phdMode || '—'}</div>
                      <div><strong>Admission Date:</strong> {selectedRegForModal.scholarId?.profile?.admissionDate || '—'}</div>
                      <div style={{ gridColumn: 'span 3' }}><strong>Research Title/Area:</strong> {selectedRegForModal.scholarId?.profile?.thesisTitle || selectedRegForModal.scholarId?.profile?.areaOfInterest || '—'}</div>
                      <div style={{ gridColumn: 'span 3' }}><strong>Preferred Supervisor ID:</strong> {selectedRegForModal.scholarId?.profile?.preferredGuideId || '—'}</div>
                    </>
                  )}
                </div>
              </div>

              {/* Section 2: Academic Qualifications */}
              <div>
                <h4 style={{ color: 'var(--color-primary)', fontSize: '1rem', fontWeight: 700, marginBottom: '12px', borderBottom: '1px solid var(--color-border-solid)', paddingBottom: '6px' }}>
                  2. Academic Qualifications
                </h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-border-solid)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '8px' }}>Level</th>
                        <th style={{ padding: '8px' }}>Degree/Board</th>
                        <th style={{ padding: '8px' }}>School/College</th>
                        <th style={{ padding: '8px' }}>Roll No</th>
                        <th style={{ padding: '8px' }}>Percentage</th>
                        <th style={{ padding: '8px' }}>Certificate</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '8px', fontWeight: 600 }}>Class 10</td>
                        <td style={{ padding: '8px' }}>{selectedRegForModal.scholarId?.profile?.qualifications?.class10?.board || '—'}</td>
                        <td style={{ padding: '8px' }}>{selectedRegForModal.scholarId?.profile?.qualifications?.class10?.school || '—'}</td>
                        <td style={{ padding: '8px' }}>{selectedRegForModal.scholarId?.profile?.qualifications?.class10?.rollNo || '—'}</td>
                        <td style={{ padding: '8px' }}>{selectedRegForModal.scholarId?.profile?.qualifications?.class10?.percentage ? `${selectedRegForModal.scholarId.profile.qualifications.class10.percentage}%` : '—'}</td>
                        <td style={{ padding: '8px' }}>
                          {selectedRegForModal.scholarId?.profile?.qualifications?.class10?.certificateUrl ? (
                            <a 
                              href={`${API_BASE_URL}${selectedRegForModal.scholarId.profile.qualifications.class10.certificateUrl}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#3B82F6', fontWeight: 600, fontSize: '0.82rem' }}
                            >
                              <FileText size={14} /> View Document
                            </a>
                          ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No Certificate Uploaded</span>}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '8px', fontWeight: 600 }}>Class 12</td>
                        <td style={{ padding: '8px' }}>{selectedRegForModal.scholarId?.profile?.qualifications?.class12?.board || '—'}</td>
                        <td style={{ padding: '8px' }}>{selectedRegForModal.scholarId?.profile?.qualifications?.class12?.school || '—'}</td>
                        <td style={{ padding: '8px' }}>{selectedRegForModal.scholarId?.profile?.qualifications?.class12?.rollNo || '—'}</td>
                        <td style={{ padding: '8px' }}>{selectedRegForModal.scholarId?.profile?.qualifications?.class12?.percentage ? `${selectedRegForModal.scholarId.profile.qualifications.class12.percentage}%` : '—'}</td>
                        <td style={{ padding: '8px' }}>
                          {selectedRegForModal.scholarId?.profile?.qualifications?.class12?.certificateUrl ? (
                            <a 
                              href={`${API_BASE_URL}${selectedRegForModal.scholarId.profile.qualifications.class12.certificateUrl}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#3B82F6', fontWeight: 600, fontSize: '0.82rem' }}
                            >
                              <FileText size={14} /> View Document
                            </a>
                          ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No Certificate Uploaded</span>}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '8px', fontWeight: 600 }}>Graduation</td>
                        <td style={{ padding: '8px' }}>{selectedRegForModal.scholarId?.profile?.qualifications?.graduation?.degree || '—'}</td>
                        <td style={{ padding: '8px' }}>{selectedRegForModal.scholarId?.profile?.qualifications?.graduation?.college || '—'} ({selectedRegForModal.scholarId?.profile?.qualifications?.graduation?.university || ''})</td>
                        <td style={{ padding: '8px' }}>{selectedRegForModal.scholarId?.profile?.qualifications?.graduation?.rollNo || '—'}</td>
                        <td style={{ padding: '8px' }}>{selectedRegForModal.scholarId?.profile?.qualifications?.graduation?.percentage ? `${selectedRegForModal.scholarId.profile.qualifications.graduation.percentage}%` : '—'}</td>
                        <td style={{ padding: '8px' }}>
                          {selectedRegForModal.scholarId?.profile?.qualifications?.graduation?.certificateUrl ? (
                            <a 
                              href={`${API_BASE_URL}${selectedRegForModal.scholarId.profile.qualifications.graduation.certificateUrl}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#3B82F6', fontWeight: 600, fontSize: '0.82rem' }}
                            >
                              <FileText size={14} /> View Document
                            </a>
                          ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No Certificate Uploaded</span>}
                        </td>
                      </tr>
                      {selectedRegForModal.scholarId?.profile?.qualifications?.postGraduation?.rollNo && (
                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '8px', fontWeight: 600 }}>Post Graduation</td>
                          <td style={{ padding: '8px' }}>{selectedRegForModal.scholarId?.profile?.qualifications?.postGraduation?.degree || '—'}</td>
                          <td style={{ padding: '8px' }}>{selectedRegForModal.scholarId?.profile?.qualifications?.postGraduation?.college || '—'} ({selectedRegForModal.scholarId?.profile?.qualifications?.postGraduation?.university || ''})</td>
                          <td style={{ padding: '8px' }}>{selectedRegForModal.scholarId?.profile?.qualifications?.postGraduation?.rollNo || '—'}</td>
                          <td style={{ padding: '8px' }}>{selectedRegForModal.scholarId?.profile?.qualifications?.postGraduation?.percentage ? `${selectedRegForModal.scholarId.profile.qualifications.postGraduation.percentage}%` : '—'}</td>
                          <td style={{ padding: '8px' }}>
                            {selectedRegForModal.scholarId?.profile?.qualifications?.postGraduation?.certificateUrl ? (
                              <a 
                                href={`${API_BASE_URL}${selectedRegForModal.scholarId.profile.qualifications.postGraduation.certificateUrl}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#3B82F6', fontWeight: 600, fontSize: '0.82rem' }}
                              >
                                <FileText size={14} /> View Document
                              </a>
                            ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No Certificate Uploaded</span>}
                          </td>
                        </tr>
                      )}
                      {!selectedRegForModal.isNonPhD && selectedRegForModal.scholarId?.profile?.qualifications?.mphil?.done && (
                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '8px', fontWeight: 600 }}>M.Phil</td>
                          <td style={{ padding: '8px' }}>{selectedRegForModal.scholarId?.profile?.qualifications?.mphil?.university || '—'}</td>
                          <td style={{ padding: '8px' }}>Passing Year: {selectedRegForModal.scholarId?.profile?.qualifications?.mphil?.passingYear || '—'}</td>
                          <td style={{ padding: '8px' }}>Marks: {selectedRegForModal.scholarId?.profile?.qualifications?.mphil?.marksObtained || '—'}/{selectedRegForModal.scholarId?.profile?.qualifications?.mphil?.totalMarks || '—'}</td>
                          <td style={{ padding: '8px' }}>{selectedRegForModal.scholarId?.profile?.qualifications?.mphil?.percentage ? `${selectedRegForModal.scholarId.profile.qualifications.mphil.percentage}%` : '—'}</td>
                          <td style={{ padding: '8px' }}>
                            {selectedRegForModal.scholarId?.profile?.qualifications?.mphil?.certificateUrl ? (
                              <a 
                                href={`${API_BASE_URL}${selectedRegForModal.scholarId.profile.qualifications.mphil.certificateUrl}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#3B82F6', fontWeight: 600, fontSize: '0.82rem' }}
                              >
                                <FileText size={14} /> View Document
                              </a>
                            ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No Certificate Uploaded</span>}
                          </td>
                        </tr>
                      )}
                      {!selectedRegForModal.isNonPhD && selectedRegForModal.scholarId?.profile?.qualifications?.netJrf?.qualified && (
                        <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '8px', fontWeight: 600 }}>NET / JRF</td>
                          <td style={{ padding: '8px' }}>Cert No: {selectedRegForModal.scholarId?.profile?.qualifications?.netJrf?.certNumber || '—'}</td>
                          <td style={{ padding: '8px' }}>Rank/Score: {selectedRegForModal.scholarId?.profile?.qualifications?.netJrf?.rank || '—'} / {selectedRegForModal.scholarId?.profile?.qualifications?.netJrf?.score}</td>
                          <td style={{ padding: '8px' }}>Roll: {selectedRegForModal.scholarId?.profile?.qualifications?.netJrf?.rollNo || '—'}</td>
                          <td style={{ padding: '8px' }}>Issue Date: {selectedRegForModal.scholarId?.profile?.qualifications?.netJrf?.issueDate || '—'}</td>
                          <td style={{ padding: '8px' }}>
                            {selectedRegForModal.scholarId?.profile?.qualifications?.netJrf?.certificateUrl ? (
                              <a 
                                href={`${API_BASE_URL}${selectedRegForModal.scholarId.profile.qualifications.netJrf.certificateUrl}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#3B82F6', fontWeight: 600, fontSize: '0.82rem' }}
                              >
                                <FileText size={14} /> View Document
                              </a>
                            ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No Certificate Uploaded</span>}
                          </td>
                        </tr>
                      )}
                      {!selectedRegForModal.isNonPhD && selectedRegForModal.scholarId?.profile?.qualifications?.fellowships && selectedRegForModal.scholarId.profile.qualifications.fellowships.map((f, idx) => (
                        <tr key={`fellowship-${idx}`} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '8px', fontWeight: 600 }}>Fellowship ({f.type === 'Other' ? f.otherType : f.type})</td>
                          <td style={{ padding: '8px' }} colSpan="2">Awarding Body: {f.awardingBody || '—'} | Ref No: {f.referenceNo || '—'}</td>
                          <td style={{ padding: '8px' }}>Amt: {f.amount || '—'} (Dur: {f.duration}m)</td>
                          <td style={{ padding: '8px' }}>Date: {f.awardDate || '—'}</td>
                          <td style={{ padding: '8px' }}>
                            {f.certificateUrl ? (
                              <a 
                                href={`${API_BASE_URL}${f.certificateUrl}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#3B82F6', fontWeight: 600, fontSize: '0.82rem' }}
                              >
                                <FileText size={14} /> View Document
                              </a>
                            ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No Certificate Uploaded</span>}
                          </td>
                        </tr>
                      ))}
                      {selectedRegForModal.scholarId?.profile?.qualifications?.otherQuals && selectedRegForModal.scholarId.profile.qualifications.otherQuals.map((o, idx) => (
                        <tr key={`other-${idx}`} style={{ borderBottom: '1px solid var(--color-border)' }}>
                          <td style={{ padding: '8px', fontWeight: 600 }}>Other ({o.type === 'Other' ? o.otherType : o.type})</td>
                          <td style={{ padding: '8px' }}>{o.board || '—'}</td>
                          <td style={{ padding: '8px' }}>{o.school || '—'}</td>
                          <td style={{ padding: '8px' }}>{o.rollNo || '—'}</td>
                          <td style={{ padding: '8px' }}>{o.marksObtained}/{o.totalMarks} ({o.percentage ? (o.percentage.endsWith('%') ? o.percentage : `${o.percentage}%`) : '—'})</td>
                          <td style={{ padding: '8px' }}>
                            {o.certificateUrl ? (
                              <a 
                                href={`${API_BASE_URL}${o.certificateUrl}`} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#3B82F6', fontWeight: 600, fontSize: '0.82rem' }}
                              >
                                <FileText size={14} /> View Document
                              </a>
                            ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No Certificate Uploaded</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Action Row & Verify (Fixed Footer) */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              borderTop: '1px solid var(--color-border-solid)',
              paddingTop: '20px',
              marginTop: '16px'
            }}>
              {selectedRegForModal.isApprovedView ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    color: '#10B981',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <ShieldCheck size={16} /> Verified & Approved
                  </span>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setSelectedRegForModal(null)}
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  {!selectedRegForModal.isNonPhD && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        Assign Faculty Guide/Supervisor <span style={{ color: '#EF4444' }}>*</span>
                      </label>
                      <select 
                        className="form-input" 
                        style={{ padding: '8px 12px', fontSize: '0.9rem', width: '100%', maxWidth: '400px' }}
                        value={assignedSupervisors[selectedRegForModal._id] || ''}
                        onChange={e => setAssignedSupervisors({ ...assignedSupervisors, [selectedRegForModal._id]: e.target.value })}
                      >
                        <option value="">Select Supervisor...</option>
                        {faculties.map(f => (
                          <option key={f._id} value={f._id}>{f.name} ({(f.role === 'HOD' || f.subRole === 'HOD') ? 'HOD' : (f.subRole || 'Supervisor')})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => setSelectedRegForModal(null)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn btn-primary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      onClick={async () => {
                        const id = selectedRegForModal._id;
                        setSelectedRegForModal(null);
                        await handleApproveRegistration(id);
                      }}
                      disabled={!selectedRegForModal.isNonPhD && !assignedSupervisors[selectedRegForModal._id]}
                    >
                      <UserCheck size={16} /> Verify & Approve
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalsTab;
