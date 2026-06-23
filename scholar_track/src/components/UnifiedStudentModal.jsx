import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, ShieldCheck } from 'lucide-react';
import useApi from '../hooks/useApi';
import { useToast } from '../context/ToastContext';

const UnifiedStudentModal = ({ isOpen, onClose, student, onVerifySuccess }) => {
  const api = useApi();
  const toast = useToast();
  const [verifying, setVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState('personal'); // personal | academic

  if (!student) return null;

  const handleVerify = async () => {
    const confirm = window.confirm(`Are you sure you want to verify ${student.name}'s profile?`);
    if (!confirm) return;

    try {
      setVerifying(true);
      const res = await api.put(`/auth/users/${student._id}/verify`);
      toast.success(res.data.message || 'Student verified successfully!');
      if (onVerifySuccess) {
        onVerifySuccess(student._id);
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to verify student');
    } finally {
      setVerifying(false);
    }
  };

  const profile = student.profile || {};
  const q = profile.qualifications || {};

  const getDocLink = (certUrl) => {
    if (!certUrl) return <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>⚠️ Missing</span>;
    return (
      <a 
        href={`http://localhost:5000${certUrl}`} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="btn btn-sm btn-outline"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', fontSize: '0.78rem' }}
      >
        <FileText size={12} /> View Certificate
      </a>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ zIndex: 999 }}
        >
          <motion.div
            className="modal-content glass-modal"
            style={{ maxWidth: '800px', width: '90%', padding: '24px', position: 'relative' }}
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
          >
            {/* Close Button */}
            <button 
              onClick={onClose} 
              style={{ position: 'absolute', top: '16px', right: '16px', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '16px',
                background: 'linear-gradient(135deg, #A5D6A7, #2E9E5B)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: '1.5rem', fontWeight: 'bold'
              }}>
                {student.name?.[0]?.toUpperCase() || 'S'}
              </div>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {student.name}
                  {student.isVerified ? (
                    <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '3px 8px', borderRadius: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldCheck size={12} /> Verified
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', padding: '3px 8px', borderRadius: '12px', fontWeight: 600 }}>
                      ⏳ Pending Verification
                    </span>
                  )}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                  {student.username} | Department of {student.department}
                </p>
              </div>
            </div>

            {/* Modal Tabs */}
            <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--color-border-solid)', marginBottom: '20px', paddingBottom: '8px' }}>
              <button 
                className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: activeTab === 'personal' ? 'var(--color-primary)' : 'var(--text-secondary)', fontWeight: activeTab === 'personal' ? 'bold' : 'normal' }}
                onClick={() => setActiveTab('personal')}
              >
                Personal Details
              </button>
              <button 
                className={`tab-btn ${activeTab === 'academic' ? 'active' : ''}`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: activeTab === 'academic' ? 'var(--color-primary)' : 'var(--text-secondary)', fontWeight: activeTab === 'academic' ? 'bold' : 'normal' }}
                onClick={() => setActiveTab('academic')}
              >
                Academic & Qualifications
              </button>
            </div>

            {/* Tab Contents */}
            <div style={{ maxHeight: '450px', overflowY: 'auto', paddingRight: '4px', marginBottom: '24px' }}>
              {activeTab === 'personal' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="clay-card" style={{ padding: '16px' }}>
                    <h3 style={{ fontSize: '0.95rem', color: 'var(--color-primary)', marginTop: 0, marginBottom: '12px' }}>Basic Info</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                      <div><strong>Date of Birth:</strong> {profile.dob || '—'}</div>
                      <div><strong>Gender:</strong> {profile.gender || '—'}</div>
                      <div><strong>Category:</strong> {profile.category || '—'}</div>
                      <div><strong>Nationality:</strong> {profile.nationality || '—'}</div>
                    </div>
                  </div>
                  <div className="clay-card" style={{ padding: '16px' }}>
                    <h3 style={{ fontSize: '0.95rem', color: 'var(--color-primary)', marginTop: 0, marginBottom: '12px' }}>Contact Info</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                      <div><strong>Father's Name:</strong> {profile.fatherName || '—'}</div>
                      <div><strong>Mother's Name:</strong> {profile.motherName || '—'}</div>
                      <div><strong>Phone Number:</strong> {profile.phoneNumber || '—'}</div>
                      <div><strong>Address:</strong> {profile.address || '—'}</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'academic' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="clay-card" style={{ padding: '16px' }}>
                    <h3 style={{ fontSize: '0.95rem', color: 'var(--color-primary)', marginTop: 0, marginBottom: '12px' }}>Admission Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
                      <div><strong>Academic Session:</strong> {profile.academicSession || '—'}</div>
                      <div><strong>Degree Type:</strong> {profile.degreeType || '—'}</div>
                      <div><strong>Degree Name:</strong> {profile.degreeName || '—'}</div>
                      <div><strong>Enrollment Number:</strong> {profile.enrollmentNumber || '—'}</div>
                      <div><strong>Admission Date:</strong> {profile.admissionDate || '—'}</div>
                      {profile.isPhD !== false && (
                        <>
                          <div><strong>PhD Mode:</strong> {profile.phdMode || '—'}</div>
                          <div style={{ gridColumn: 'span 2' }}><strong>Thesis Title:</strong> {profile.thesisTitle || '—'}</div>
                          <div style={{ gridColumn: 'span 2' }}><strong>Abstract:</strong> {profile.thesisSummary || '—'}</div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="clay-card" style={{ padding: '16px' }}>
                    <h3 style={{ fontSize: '0.95rem', color: 'var(--color-primary)', marginTop: 0, marginBottom: '12px' }}>Qualifications Matrix</h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--color-border-solid)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                            <th style={{ padding: '8px' }}>Level</th>
                            <th style={{ padding: '8px' }}>Board/University</th>
                            <th style={{ padding: '8px' }}>School/College</th>
                            <th style={{ padding: '8px' }}>Roll No</th>
                            <th style={{ padding: '8px' }}>Percentage</th>
                            <th style={{ padding: '8px' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {q.class10 && (
                            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                              <td style={{ padding: '8px', fontWeight: 600 }}>Class 10</td>
                              <td style={{ padding: '8px' }}>{q.class10.board}</td>
                              <td style={{ padding: '8px' }}>{q.class10.school}</td>
                              <td style={{ padding: '8px' }}>{q.class10.rollNo}</td>
                              <td style={{ padding: '8px' }}>{q.class10.percentage}%</td>
                              <td style={{ padding: '8px' }}>{getDocLink(q.class10.certificateUrl)}</td>
                            </tr>
                          )}
                          {q.class12 && (
                            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                              <td style={{ padding: '8px', fontWeight: 600 }}>Class 12</td>
                              <td style={{ padding: '8px' }}>{q.class12.board}</td>
                              <td style={{ padding: '8px' }}>{q.class12.school}</td>
                              <td style={{ padding: '8px' }}>{q.class12.rollNo}</td>
                              <td style={{ padding: '8px' }}>{q.class12.percentage}%</td>
                              <td style={{ padding: '8px' }}>{getDocLink(q.class12.certificateUrl)}</td>
                            </tr>
                          )}
                          {q.graduation && (
                            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                              <td style={{ padding: '8px', fontWeight: 600 }}>Graduation</td>
                              <td style={{ padding: '8px' }}>{q.graduation.university}</td>
                              <td style={{ padding: '8px' }}>{q.graduation.college} ({q.graduation.degree})</td>
                              <td style={{ padding: '8px' }}>{q.graduation.rollNo}</td>
                              <td style={{ padding: '8px' }}>{q.graduation.percentage}%</td>
                              <td style={{ padding: '8px' }}>{getDocLink(q.graduation.certificateUrl)}</td>
                            </tr>
                          )}
                          {q.postGraduation && q.postGraduation.degree && (
                            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                              <td style={{ padding: '8px', fontWeight: 600 }}>Post Graduation</td>
                              <td style={{ padding: '8px' }}>{q.postGraduation.university}</td>
                              <td style={{ padding: '8px' }}>{q.postGraduation.college} ({q.postGraduation.degree})</td>
                              <td style={{ padding: '8px' }}>{q.postGraduation.rollNo}</td>
                              <td style={{ padding: '8px' }}>{q.postGraduation.percentage}%</td>
                              <td style={{ padding: '8px' }}>{getDocLink(q.postGraduation.certificateUrl)}</td>
                            </tr>
                          )}
                          {q.netJrf?.qualified === 'YES' && (
                            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                              <td style={{ padding: '8px', fontWeight: 600 }}>NET / JRF</td>
                              <td style={{ padding: '8px' }}>Cert No: {q.netJrf.certNumber}</td>
                              <td style={{ padding: '8px' }}>AIR: {q.netJrf.rank}</td>
                              <td style={{ padding: '8px' }}>Roll: {q.netJrf.rollNo}</td>
                              <td style={{ padding: '8px' }}>Date: {q.netJrf.issueDate}</td>
                              <td style={{ padding: '8px' }}>{getDocLink(q.netJrf.certificateUrl)}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--color-border-solid)', paddingTop: '16px' }}>
              <button className="btn btn-outline" onClick={onClose}>
                Close
              </button>
              {!student.isVerified && (
                <button 
                  className="btn btn-primary" 
                  style={{ background: '#10B981', borderColor: '#10B981' }}
                  onClick={handleVerify}
                  disabled={verifying}
                >
                  {verifying ? 'Verifying...' : '✓ Verify Student Profile'}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UnifiedStudentModal;
