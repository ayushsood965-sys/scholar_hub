import React, { useState } from 'react';
import { API_BASE_URL } from '../config';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, ShieldCheck, Clock } from 'lucide-react';
import useApi from '../hooks/useApi';
import { useToast } from '../context/ToastContext';

const UnifiedStudentModal = ({ isOpen, onClose, student, onVerifySuccess }) => {
  const api = useApi();
  const toast = useToast();
  const [verifying, setVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState('personal'); // personal | academic

  if (!student) return null;

  const handleVerify = async () => {
    const confirm = window.confirm(`Are you sure you want to approve ${student.name}'s registration?`);
    if (!confirm) return;

    try {
      setVerifying(true);
      const res = await api.put(`/auth/users/${student._id}/verify`);
      toast.success(res.data.message || 'Registration approved successfully!');
      if (onVerifySuccess) {
        onVerifySuccess(student._id);
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve registration');
    } finally {
      setVerifying(false);
    }
  };

  const profile = student.profile || {};
  const q = profile.qualifications || {};

  const getDocLink = (certUrl) => {
    if (!certUrl) return <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>⚠️ Missing</span>;
    return (
      <a 
        href={`${API_BASE_URL}${certUrl}`} 
        target="_blank" 
        rel="noopener noreferrer" 
        style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '4px', 
          padding: '4px 8px', 
          fontSize: '0.78rem',
          color: '#10B981',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '6px',
          textDecoration: 'none',
          fontWeight: 600
        }}
      >
        <FileText size={12} /> View Certificate
      </a>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ 
            zIndex: 999, 
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <motion.div
            style={{ 
              maxWidth: '800px', 
              width: '100%', 
              maxHeight: '90vh',
              padding: '28px', 
              position: 'relative',
              background: '#ffffff',
              color: '#0f172a',
              borderRadius: '20px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              fontFamily: 'Outfit, sans-serif'
            }}
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
          >
            {/* Close Button */}
            <button 
              onClick={onClose} 
              style={{ 
                position: 'absolute', 
                top: '20px', 
                right: '20px', 
                color: '#64748b', 
                background: '#f1f5f9', 
                border: 'none', 
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '16px',
                background: 'linear-gradient(135deg, #10B981, #059669)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: '1.5rem', fontWeight: 'bold'
              }}>
                {student.name?.[0]?.toUpperCase() || 'S'}
              </div>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {student.name}
                  {student.isVerified ? (
                    <span style={{ fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '3px 8px', borderRadius: '12px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldCheck size={12} /> Verified
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', color: '#D97706', padding: '3px 8px', borderRadius: '12px', fontWeight: 600 }}>
                      ⏳ Pending Verification
                    </span>
                  )}
                </h2>
                <p style={{ color: '#475569', fontSize: '0.85rem', margin: '4px 0 0 0', fontWeight: '500' }}>
                  {student.username} | Department of {student.department}
                </p>
              </div>
            </div>

            {/* Modal Tabs */}
            <div style={{ display: 'flex', gap: '20px', borderBottom: '1px solid #e2e8f0', marginBottom: '20px', paddingBottom: '8px' }}>
              <button 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontSize: '0.9rem', 
                  color: activeTab === 'personal' ? '#10B981' : '#64748b', 
                  fontWeight: activeTab === 'personal' ? '700' : '500',
                  paddingBottom: '8px',
                  borderBottom: activeTab === 'personal' ? '2px solid #10B981' : 'none'
                }}
                onClick={() => setActiveTab('personal')}
              >
                Personal Details
              </button>
              <button 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  fontSize: '0.9rem', 
                  color: activeTab === 'academic' ? '#10B981' : '#64748b', 
                  fontWeight: activeTab === 'academic' ? '700' : '500',
                  paddingBottom: '8px',
                  borderBottom: activeTab === 'academic' ? '2px solid #10B981' : 'none'
                }}
                onClick={() => setActiveTab('academic')}
              >
                Academic & Qualifications
              </button>
            </div>

            {/* Tab Contents */}
            <div style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '4px', marginBottom: '24px' }}>
              {activeTab === 'personal' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
                    <h3 style={{ fontSize: '1rem', color: '#0f172a', fontWeight: '800', marginTop: 0, marginBottom: '16px' }}>Basic Info</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: '#334155' }}>
                      <div><strong style={{ color: '#475569' }}>Full Name:</strong> {student.name || '—'}</div>
                      <div><strong style={{ color: '#475569' }}>Date of Birth:</strong> {profile.dob || '—'}</div>
                      <div><strong style={{ color: '#475569' }}>Gender:</strong> {profile.gender || '—'}</div>
                      <div><strong style={{ color: '#475569' }}>Category:</strong> {profile.category || '—'}</div>
                      <div><strong style={{ color: '#475569' }}>Nationality:</strong> {profile.nationality || '—'}</div>
                    </div>
                  </div>
                  <div style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
                    <h3 style={{ fontSize: '1rem', color: '#0f172a', fontWeight: '800', marginTop: 0, marginBottom: '16px' }}>Contact Info</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: '#334155' }}>
                      <div><strong style={{ color: '#475569' }}>Father's Name:</strong> {profile.fatherName || '—'}</div>
                      <div><strong style={{ color: '#475569' }}>Mother's Name:</strong> {profile.motherName || '—'}</div>
                      <div><strong style={{ color: '#475569' }}>Phone Number:</strong> {profile.phoneNumber || '—'}</div>
                      <div><strong style={{ color: '#475569' }}>Contact Address:</strong> {profile.address || '—'}</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'academic' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
                    <h3 style={{ fontSize: '1rem', color: '#0f172a', fontWeight: '800', marginTop: 0, marginBottom: '16px' }}>Admission Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem', color: '#334155' }}>
                      <div><strong style={{ color: '#475569' }}>Login Username:</strong> {student.username || '—'}</div>
                      <div><strong style={{ color: '#475569' }}>Department:</strong> {student.department || '—'}</div>
                      <div><strong style={{ color: '#475569' }}>Degree Type:</strong> {profile.degreeType || '—'}</div>
                      <div><strong style={{ color: '#475569' }}>Degree Name:</strong> {profile.degreeName || '—'}</div>
                      <div><strong style={{ color: '#475569' }}>Academic Session:</strong> {profile.academicSession || '—'}</div>
                      <div><strong style={{ color: '#475569' }}>Enrollment Number:</strong> {profile.enrollmentNumber || '—'}</div>
                      <div><strong style={{ color: '#475569' }}>HPU ERP Admission No.:</strong> {profile.erpAdmissionNo || '—'}</div>
                      <div><strong style={{ color: '#475569' }}>Scholar Number:</strong> {profile.shNo || '—'}</div>
                      <div><strong style={{ color: '#475569' }}>Admission Date:</strong> {profile.admissionDate || '—'}</div>
                    </div>
                  </div>

                  <div style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
                    <h3 style={{ fontSize: '1rem', color: '#0f172a', fontWeight: '800', marginTop: 0, marginBottom: '16px' }}>Qualifications Matrix</h3>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#475569' }}>
                            <th style={{ padding: '8px' }}>Level</th>
                            <th style={{ padding: '8px' }}>Board/University</th>
                            <th style={{ padding: '8px' }}>School/College</th>
                            <th style={{ padding: '8px' }}>Roll No</th>
                            <th style={{ padding: '8px' }}>Percentage</th>
                            <th style={{ padding: '8px' }}>Action</th>
                          </tr>
                        </thead>
                        <tbody style={{ color: '#334155' }}>
                          {q.class10 && (
                            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '8px', fontWeight: 600 }}>Class 10</td>
                              <td style={{ padding: '8px' }}>{q.class10.board}</td>
                              <td style={{ padding: '8px' }}>{q.class10.school}</td>
                              <td style={{ padding: '8px' }}>{q.class10.rollNo}</td>
                              <td style={{ padding: '8px' }}>{q.class10.percentage}%</td>
                              <td style={{ padding: '8px' }}>{getDocLink(q.class10.certificateUrl)}</td>
                            </tr>
                          )}
                          {q.class12 && (
                            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '8px', fontWeight: 600 }}>Class 12</td>
                              <td style={{ padding: '8px' }}>{q.class12.board}</td>
                              <td style={{ padding: '8px' }}>{q.class12.school}</td>
                              <td style={{ padding: '8px' }}>{q.class12.rollNo}</td>
                              <td style={{ padding: '8px' }}>{q.class12.percentage}%</td>
                              <td style={{ padding: '8px' }}>{getDocLink(q.class12.certificateUrl)}</td>
                            </tr>
                          )}
                          {q.graduation && (
                            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '8px', fontWeight: 600 }}>Graduation</td>
                              <td style={{ padding: '8px' }}>{q.graduation.university}</td>
                              <td style={{ padding: '8px' }}>{q.graduation.college} ({q.graduation.degree})</td>
                              <td style={{ padding: '8px' }}>{q.graduation.rollNo}</td>
                              <td style={{ padding: '8px' }}>{q.graduation.percentage}%</td>
                              <td style={{ padding: '8px' }}>{getDocLink(q.graduation.certificateUrl)}</td>
                            </tr>
                          )}
                          {q.postGraduation && q.postGraduation.degree && (
                            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '8px', fontWeight: 600 }}>Post Graduation</td>
                              <td style={{ padding: '8px' }}>{q.postGraduation.university}</td>
                              <td style={{ padding: '8px' }}>{q.postGraduation.college} ({q.postGraduation.degree})</td>
                              <td style={{ padding: '8px' }}>{q.postGraduation.rollNo}</td>
                              <td style={{ padding: '8px' }}>{q.postGraduation.percentage}%</td>
                              <td style={{ padding: '8px' }}>{getDocLink(q.postGraduation.certificateUrl)}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
              {/* Activity & Verification Log */}
              <div style={{ marginTop: '20px', borderTop: '1px dashed #e2e8f0', paddingTop: '16px' }}>
                <h4 style={{ color: 'var(--color-primary)', fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} /> Activity & Verification Log
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Submission log */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px', background: '#f8fafc', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid #e2e8f0' }}>
                    <span className="badge" style={{ fontSize: '0.62rem', flexShrink: 0, background: '#eff6ff', color: '#1e40af', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                      SUBMITTED
                    </span>
                    <span style={{ color: '#334155', lineHeight: 1.4, width: '100%' }}>
                      <strong style={{ color: '#0f172a' }}>{student.name}</strong> <span style={{ color: '#64748b', fontSize: '0.72rem' }}>(Student)</span>: Registered and submitted profile details for verification.
                      {student.createdAt && (
                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>
                          {new Date(student.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </span>
                  </div>

                  {/* Verification log */}
                  {student.isVerified && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px', background: '#ecfdf5', borderRadius: '8px', fontSize: '0.8rem', border: '1px solid #a7f3d0' }}>
                      <span className="badge" style={{ fontSize: '0.62rem', flexShrink: 0, background: '#ecfdf5', color: '#065f46', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
                        APPROVED
                      </span>
                      <span style={{ color: '#334155', lineHeight: 1.4, width: '100%' }}>
                        <strong style={{ color: '#0f172a' }}>HOD</strong>: Verified credentials and approved candidate registration.
                        {student.updatedAt && (
                          <div style={{ fontSize: '0.7rem', color: '#047857', marginTop: 2 }}>
                            {new Date(student.updatedAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <button 
                onClick={onClose}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  color: '#475569',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.85rem'
                }}
              >
                Close
              </button>
              {!student.isVerified && (
                <button 
                  style={{ 
                    background: '#10B981', 
                    border: 'none', 
                    color: '#ffffff',
                    padding: '10px 20px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)'
                  }}
                  onClick={handleVerify}
                  disabled={verifying}
                >
                  {verifying ? 'Approving...' : 'Approve Registration'}
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
