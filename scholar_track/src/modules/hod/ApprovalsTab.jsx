import React, { useState, useEffect, useContext } from 'react';
import useApi from '../../hooks/useApi';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { CheckCircle, XCircle, ChevronDown, ChevronUp, FileText, UserCheck, ShieldCheck } from 'lucide-react';

const ApprovalsTab = () => {
  const { user } = useContext(AuthContext);
  const [leaves, setLeaves] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [assignedSupervisors, setAssignedSupervisors] = useState({});
  const [expandedReg, setExpandedReg] = useState(null); // ID of expanded registration
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('leaves'); // leaves | corrections | registrations
  
  const api = useApi();
  const toast = useToast();

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const [leaveRes, corrRes, regRes, facultyRes] = await Promise.all([
        api.get('/attendance/leave/pending'),
        api.get('/attendance/corrections/pending'),
        api.get('/thesis/all?status=REGISTRATION_PENDING'),
        api.get('/auth/faculty')
      ]);
      setLeaves(leaveRes.data);
      setCorrections(corrRes.data);
      setRegistrations(regRes.data);

      // Filter faculties to only active, verified supervisors in the same department
      const deptFaculty = facultyRes.data.filter(f => 
        f.department === user?.department && 
        f.role === 'FACULTY' && 
        f.isActive && 
        f.isVerified
      );
      setFaculties(deptFaculty);
    } catch (err) {
      toast.error('Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (user) fetchApprovals(); 
  }, [user]);

  const handleLeaveAction = async (id, action) => {
    try {
      await api.put(`/attendance/leave/${id}/action`, { action, remarks: `HOD ${action}` });
      toast.success(`Leave ${action.toLowerCase()} successfully`);
      fetchApprovals();
    } catch (err) {
      toast.error('Error processing leave');
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

  const handleApproveRegistration = async (thesisId) => {
    const supervisorId = assignedSupervisors[thesisId];
    if (!supervisorId) {
      toast.error('Please assign a faculty supervisor first');
      return;
    }

    try {
      setLoading(true);
      // 1. Assign supervisor
      await api.put(`/thesis/${thesisId}/assign`, { supervisorId });
      // 2. Verify enrollment
      await api.put(`/thesis/${thesisId}/verify`, {});
      
      toast.success('Scholar registration approved and supervisor assigned successfully');
      setAssignedSupervisors(prev => {
        const copy = { ...prev };
        delete copy[thesisId];
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
    { header: 'Student Name', accessor: (row) => row.studentId?.name || 'Unknown' },
    { header: 'Leave Type', accessor: 'leaveType' },
    { header: 'Dates', accessor: (row) => `${new Date(row.startDate).toLocaleDateString()} - ${new Date(row.endDate).toLocaleDateString()}` },
    { header: 'Reason', accessor: 'reason' },
    {
      header: 'Actions',
      accessor: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-sm" style={{ background: '#10B981', color: '#fff' }} onClick={() => handleLeaveAction(row._id, 'APPROVE')}>
            <CheckCircle size={16} />
          </button>
          <button className="btn btn-sm" style={{ background: '#EF4444', color: '#fff' }} onClick={() => handleLeaveAction(row._id, 'REJECT')}>
            <XCircle size={16} />
          </button>
        </div>
      )
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
          href={`http://localhost:5000${certUrl}`} 
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
        <button 
          className={`tab-btn ${activeSubTab === 'registrations' ? 'active' : ''}`} 
          style={{ background: 'none', border: 'none', color: activeSubTab === 'registrations' ? 'var(--color-primary)' : 'var(--text-secondary)', fontWeight: activeSubTab === 'registrations' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '0.95rem' }}
          onClick={() => setActiveSubTab('registrations')}
        >
          PhD Registrations ({registrations.length})
        </button>
      </div>

      {activeSubTab === 'leaves' && <DataTable columns={leaveColumns} data={leaves} />}
      {activeSubTab === 'corrections' && <DataTable columns={correctionColumns} data={corrections} />}
      
      {activeSubTab === 'registrations' && (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>Scholar Name</th>
                <th>Enrollment Number</th>
                <th>Assign Faculty Guide</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map(reg => {
                const isExpanded = expandedReg === reg._id;
                return (
                  <React.Fragment key={reg._id}>
                    <tr style={{ borderBottom: isExpanded ? 'none' : '1px solid var(--color-border)' }}>
                      <td>
                        <button 
                          onClick={() => setExpandedReg(isExpanded ? null : reg._id)}
                          style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{reg.scholarId?.name || 'Pending Profile'}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{reg.scholarId?.username}</div>
                      </td>
                      <td>
                        <span style={{ background: 'var(--color-surface-elevated)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem', border: '1px solid var(--color-border-solid)' }}>
                          {reg.enrollmentNumber || '—'}
                        </span>
                      </td>
                      <td>
                        <select 
                          className="form-input" 
                          style={{ padding: '6px 12px', fontSize: '0.85rem', width: '220px' }}
                          value={assignedSupervisors[reg._id] || ''}
                          onChange={e => setAssignedSupervisors({ ...assignedSupervisors, [reg._id]: e.target.value })}
                        >
                          <option value="">Select Supervisor...</option>
                          {faculties.map(f => (
                            <option key={f._id} value={f._id}>{f.name}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="btn btn-sm btn-primary"
                          style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          onClick={() => handleApproveRegistration(reg._id)}
                          disabled={!assignedSupervisors[reg._id]}
                        >
                          <UserCheck size={14} /> Verify & Approve
                        </button>
                      </td>
                    </tr>
                    {isExpanded && renderRegistrationDetails(reg)}
                  </React.Fragment>
                );
              })}
              {registrations.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center" style={{ padding: '32px', color: 'var(--text-secondary)' }}>
                    No pending PhD registration verification requests.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ApprovalsTab;
