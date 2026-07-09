import React, { useState } from 'react';
import { API_BASE_URL } from '../config';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, ShieldCheck, Clock, ShieldAlert } from 'lucide-react';
import useApi from '../hooks/useApi';
import { useToast } from '../context/ToastContext';

const UnifiedStudentModal = ({ isOpen, onClose, student, onVerifySuccess }) => {
  const api = useApi();
  const toast = useToast();
  const [verifying, setVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState('personal'); // personal | academic

  // Rejection & Editing states
  const [showRejectPopup, setShowRejectPopup] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

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

  const handleRejectAndSendToStudent = async () => {
    if (!remarks.trim()) {
      toast.warning('Please enter rejection remarks.');
      return;
    }
    
    try {
      setVerifying(true);
      const res = await api.put(`/auth/users/${student._id}/reject`, { remarks });
      toast.success(res.data.message || 'Registration rejected and sent back to candidate.');
      if (onVerifySuccess) {
        onVerifySuccess(res.data.user || student);
      }
      setShowRejectPopup(false);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject registration');
    } finally {
      setVerifying(false);
    }
  };

  const handleSelectEditAtHodEnd = () => {
    setEditForm({
      name: student.name || '',
      dob: profile.dob || '',
      gender: profile.gender || '',
      category: profile.category || '',
      nationality: profile.nationality || '',
      fatherName: profile.fatherName || '',
      motherName: profile.motherName || '',
      phoneNumber: profile.phoneNumber || '',
      address: profile.address || '',
      degreeType: profile.degreeType || '',
      degreeName: profile.degreeName || '',
      academicSession: profile.academicSession || '',
      enrollmentNumber: profile.enrollmentNumber || '',
      erpAdmissionNo: profile.erpAdmissionNo || '',
      admissionDate: profile.admissionDate || '',
      qualifications: {
        class10: {
          board: q.class10?.board || '',
          school: q.class10?.school || '',
          rollNo: q.class10?.rollNo || '',
          percentage: q.class10?.percentage || '',
          certificateUrl: q.class10?.certificateUrl || ''
        },
        class12: {
          board: q.class12?.board || '',
          school: q.class12?.school || '',
          rollNo: q.class12?.rollNo || '',
          percentage: q.class12?.percentage || '',
          certificateUrl: q.class12?.certificateUrl || ''
        },
        graduation: {
          university: q.graduation?.university || '',
          college: q.graduation?.college || '',
          degree: q.graduation?.degree || '',
          rollNo: q.graduation?.rollNo || '',
          percentage: q.graduation?.percentage || '',
          certificateUrl: q.graduation?.certificateUrl || ''
        },
        postGraduation: {
          university: q.postGraduation?.university || '',
          college: q.postGraduation?.college || '',
          degree: q.postGraduation?.degree || '',
          rollNo: q.postGraduation?.rollNo || '',
          percentage: q.postGraduation?.percentage || '',
          certificateUrl: q.postGraduation?.certificateUrl || ''
        }
      }
    });
    setIsEditing(true);
    setShowRejectPopup(false);
  };

  const handleSaveEdit = async (approveAfterSave) => {
    try {
      setVerifying(true);
      
      let cleanedPhone = editForm.phoneNumber;
      if (cleanedPhone) {
        cleanedPhone = cleanedPhone.trim().replace(/[\s\-()]/g, '');
        const indianPhoneRegex = /^(\+91|91|0)?[6-9]\d{9}$/;
        if (!indianPhoneRegex.test(cleanedPhone)) {
          toast.warning('Please enter a valid 10-digit Indian phone number.');
          setVerifying(false);
          return;
        }
      }

      const res = await api.put(`/auth/users/${student._id}/profile`, editForm);
      const updatedUser = res.data.user;
      
      if (approveAfterSave) {
        await api.put(`/auth/users/${student._id}/verify`);
        toast.success('Profile saved and registration approved successfully!');
        if (onVerifySuccess) {
          onVerifySuccess(updatedUser ? { ...updatedUser, isVerified: true } : student._id);
        }
        setIsEditing(false);
        onClose();
      } else {
        toast.success('Profile changes saved successfully!');
        if (onVerifySuccess) {
          onVerifySuccess(updatedUser || student);
        }
        setIsEditing(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save profile changes');
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
            onClick={e => e.stopPropagation()}
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
                  {isEditing ? editForm.name : student.name}
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
                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Full Name</label>
                          <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Date of Birth</label>
                          <input type="date" value={editForm.dob} onChange={e => setEditForm({...editForm, dob: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Gender</label>
                          <select value={editForm.gender} onChange={e => setEditForm({...editForm, gender: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', background: 'white' }}>
                            <option value="">Select Gender</option>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Category</label>
                          <input type="text" value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Nationality</label>
                          <input type="text" value={editForm.nationality} onChange={e => setEditForm({...editForm, nationality: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }} />
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: '#334155' }}>
                        <div><strong style={{ color: '#475569' }}>Full Name:</strong> {student.name || '—'}</div>
                        <div><strong style={{ color: '#475569' }}>Date of Birth:</strong> {profile.dob || '—'}</div>
                        <div><strong style={{ color: '#475569' }}>Gender:</strong> {profile.gender || '—'}</div>
                        <div><strong style={{ color: '#475569' }}>Category:</strong> {profile.category || '—'}</div>
                        <div><strong style={{ color: '#475569' }}>Nationality:</strong> {profile.nationality || '—'}</div>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
                    <h3 style={{ fontSize: '1rem', color: '#0f172a', fontWeight: '800', marginTop: 0, marginBottom: '16px' }}>Contact Info</h3>
                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Father's Name</label>
                          <input type="text" value={editForm.fatherName} onChange={e => setEditForm({...editForm, fatherName: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Mother's Name</label>
                          <input type="text" value={editForm.motherName} onChange={e => setEditForm({...editForm, motherName: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Phone Number</label>
                          <input type="text" value={editForm.phoneNumber} onChange={e => setEditForm({...editForm, phoneNumber: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Contact Address</label>
                          <textarea value={editForm.address} onChange={e => setEditForm({...editForm, address: e.target.value})} style={{ width: '100%', height: '60px', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', resize: 'vertical' }} />
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem', color: '#334155' }}>
                        <div><strong style={{ color: '#475569' }}>Father's Name:</strong> {profile.fatherName || '—'}</div>
                        <div><strong style={{ color: '#475569' }}>Mother's Name:</strong> {profile.motherName || '—'}</div>
                        <div><strong style={{ color: '#475569' }}>Phone Number:</strong> {profile.phoneNumber || '—'}</div>
                        <div><strong style={{ color: '#475569' }}>Contact Address:</strong> {profile.address || '—'}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'academic' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px' }}>
                    <h3 style={{ fontSize: '1rem', color: '#0f172a', fontWeight: '800', marginTop: 0, marginBottom: '16px' }}>Admission Details</h3>
                    {isEditing ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Department</label>
                          <input type="text" value={student.department} disabled style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem', background: '#f1f5f9' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Degree Type</label>
                          <input type="text" value={editForm.degreeType} onChange={e => setEditForm({...editForm, degreeType: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Degree Name</label>
                          <input type="text" value={editForm.degreeName} onChange={e => setEditForm({...editForm, degreeName: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Academic Session</label>
                          <input type="text" value={editForm.academicSession} onChange={e => setEditForm({...editForm, academicSession: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Enrollment Number</label>
                          <input type="text" value={editForm.enrollmentNumber} onChange={e => setEditForm({...editForm, enrollmentNumber: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>HPU ERP Admission No.</label>
                          <input type="text" value={editForm.erpAdmissionNo} onChange={e => setEditForm({...editForm, erpAdmissionNo: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }} />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Admission Date</label>
                          <input type="date" value={editForm.admissionDate} onChange={e => setEditForm({...editForm, admissionDate: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.85rem' }} />
                        </div>
                      </div>
                    ) : (
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
                    )}
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
                              {isEditing ? (
                                <>
                                  <td style={{ padding: '8px' }}><input type="text" value={editForm.qualifications.class10.board} onChange={e => {
                                    const qry = {...editForm.qualifications};
                                    qry.class10.board = e.target.value;
                                    setEditForm({...editForm, qualifications: qry});
                                  }} style={{ width: '90px', padding: '4px 6px', fontSize: '0.78rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></td>
                                  <td style={{ padding: '8px' }}><input type="text" value={editForm.qualifications.class10.school} onChange={e => {
                                    const qry = {...editForm.qualifications};
                                    qry.class10.school = e.target.value;
                                    setEditForm({...editForm, qualifications: qry});
                                  }} style={{ width: '120px', padding: '4px 6px', fontSize: '0.78rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></td>
                                  <td style={{ padding: '8px' }}><input type="text" value={editForm.qualifications.class10.rollNo} onChange={e => {
                                    const qry = {...editForm.qualifications};
                                    qry.class10.rollNo = e.target.value;
                                    setEditForm({...editForm, qualifications: qry});
                                  }} style={{ width: '80px', padding: '4px 6px', fontSize: '0.78rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></td>
                                  <td style={{ padding: '8px' }}><input type="text" value={editForm.qualifications.class10.percentage} onChange={e => {
                                    const qry = {...editForm.qualifications};
                                    qry.class10.percentage = e.target.value;
                                    setEditForm({...editForm, qualifications: qry});
                                  }} style={{ width: '60px', padding: '4px 6px', fontSize: '0.78rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></td>
                                </>
                              ) : (
                                <>
                                  <td style={{ padding: '8px' }}>{q.class10.board}</td>
                                  <td style={{ padding: '8px' }}>{q.class10.school}</td>
                                  <td style={{ padding: '8px' }}>{q.class10.rollNo}</td>
                                  <td style={{ padding: '8px' }}>{q.class10.percentage}%</td>
                                </>
                              )}
                              <td style={{ padding: '8px' }}>{getDocLink(q.class10.certificateUrl)}</td>
                            </tr>
                          )}
                          {q.class12 && (
                            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '8px', fontWeight: 600 }}>Class 12</td>
                              {isEditing ? (
                                <>
                                  <td style={{ padding: '8px' }}><input type="text" value={editForm.qualifications.class12.board} onChange={e => {
                                    const qry = {...editForm.qualifications};
                                    qry.class12.board = e.target.value;
                                    setEditForm({...editForm, qualifications: qry});
                                  }} style={{ width: '90px', padding: '4px 6px', fontSize: '0.78rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></td>
                                  <td style={{ padding: '8px' }}><input type="text" value={editForm.qualifications.class12.school} onChange={e => {
                                    const qry = {...editForm.qualifications};
                                    qry.class12.school = e.target.value;
                                    setEditForm({...editForm, qualifications: qry});
                                  }} style={{ width: '120px', padding: '4px 6px', fontSize: '0.78rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></td>
                                  <td style={{ padding: '8px' }}><input type="text" value={editForm.qualifications.class12.rollNo} onChange={e => {
                                    const qry = {...editForm.qualifications};
                                    qry.class12.rollNo = e.target.value;
                                    setEditForm({...editForm, qualifications: qry});
                                  }} style={{ width: '80px', padding: '4px 6px', fontSize: '0.78rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></td>
                                  <td style={{ padding: '8px' }}><input type="text" value={editForm.qualifications.class12.percentage} onChange={e => {
                                    const qry = {...editForm.qualifications};
                                    qry.class12.percentage = e.target.value;
                                    setEditForm({...editForm, qualifications: qry});
                                  }} style={{ width: '60px', padding: '4px 6px', fontSize: '0.78rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></td>
                                </>
                              ) : (
                                <>
                                  <td style={{ padding: '8px' }}>{q.class12.board}</td>
                                  <td style={{ padding: '8px' }}>{q.class12.school}</td>
                                  <td style={{ padding: '8px' }}>{q.class12.rollNo}</td>
                                  <td style={{ padding: '8px' }}>{q.class12.percentage}%</td>
                                </>
                              )}
                              <td style={{ padding: '8px' }}>{getDocLink(q.class12.certificateUrl)}</td>
                            </tr>
                          )}
                          {q.graduation && (
                            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '8px', fontWeight: 600 }}>Graduation</td>
                              {isEditing ? (
                                <>
                                  <td style={{ padding: '8px' }}><input type="text" value={editForm.qualifications.graduation.university} onChange={e => {
                                    const qry = {...editForm.qualifications};
                                    qry.graduation.university = e.target.value;
                                    setEditForm({...editForm, qualifications: qry});
                                  }} style={{ width: '90px', padding: '4px 6px', fontSize: '0.78rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></td>
                                  <td style={{ padding: '8px' }}><input type="text" value={editForm.qualifications.graduation.college} onChange={e => {
                                    const qry = {...editForm.qualifications};
                                    qry.graduation.college = e.target.value;
                                    setEditForm({...editForm, qualifications: qry});
                                  }} style={{ width: '120px', padding: '4px 6px', fontSize: '0.78rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></td>
                                  <td style={{ padding: '8px' }}><input type="text" value={editForm.qualifications.graduation.rollNo} onChange={e => {
                                    const qry = {...editForm.qualifications};
                                    qry.graduation.rollNo = e.target.value;
                                    setEditForm({...editForm, qualifications: qry});
                                  }} style={{ width: '80px', padding: '4px 6px', fontSize: '0.78rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></td>
                                  <td style={{ padding: '8px' }}><input type="text" value={editForm.qualifications.graduation.percentage} onChange={e => {
                                    const qry = {...editForm.qualifications};
                                    qry.graduation.percentage = e.target.value;
                                    setEditForm({...editForm, qualifications: qry});
                                  }} style={{ width: '60px', padding: '4px 6px', fontSize: '0.78rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></td>
                                </>
                              ) : (
                                <>
                                  <td style={{ padding: '8px' }}>{q.graduation.university}</td>
                                  <td style={{ padding: '8px' }}>{q.graduation.college} ({q.graduation.degree})</td>
                                  <td style={{ padding: '8px' }}>{q.graduation.rollNo}</td>
                                  <td style={{ padding: '8px' }}>{q.graduation.percentage}%</td>
                                </>
                              )}
                              <td style={{ padding: '8px' }}>{getDocLink(q.graduation.certificateUrl)}</td>
                            </tr>
                          )}
                          {q.postGraduation && q.postGraduation.degree && (
                            <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '8px', fontWeight: 600 }}>Post Graduation</td>
                              {isEditing ? (
                                <>
                                  <td style={{ padding: '8px' }}><input type="text" value={editForm.qualifications.postGraduation.university} onChange={e => {
                                    const qry = {...editForm.qualifications};
                                    qry.postGraduation.university = e.target.value;
                                    setEditForm({...editForm, qualifications: qry});
                                  }} style={{ width: '90px', padding: '4px 6px', fontSize: '0.78rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></td>
                                  <td style={{ padding: '8px' }}><input type="text" value={editForm.qualifications.postGraduation.college} onChange={e => {
                                    const qry = {...editForm.qualifications};
                                    qry.postGraduation.college = e.target.value;
                                    setEditForm({...editForm, qualifications: qry});
                                  }} style={{ width: '120px', padding: '4px 6px', fontSize: '0.78rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></td>
                                  <td style={{ padding: '8px' }}><input type="text" value={editForm.qualifications.postGraduation.rollNo} onChange={e => {
                                    const qry = {...editForm.qualifications};
                                    qry.postGraduation.rollNo = e.target.value;
                                    setEditForm({...editForm, qualifications: qry});
                                  }} style={{ width: '80px', padding: '4px 6px', fontSize: '0.78rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></td>
                                  <td style={{ padding: '8px' }}><input type="text" value={editForm.qualifications.postGraduation.percentage} onChange={e => {
                                    const qry = {...editForm.qualifications};
                                    qry.postGraduation.percentage = e.target.value;
                                    setEditForm({...editForm, qualifications: qry});
                                  }} style={{ width: '60px', padding: '4px 6px', fontSize: '0.78rem', border: '1px solid #cbd5e1', borderRadius: '4px' }} /></td>
                                </>
                              ) : (
                                <>
                                  <td style={{ padding: '8px' }}>{q.postGraduation.university}</td>
                                  <td style={{ padding: '8px' }}>{q.postGraduation.college} ({q.postGraduation.degree})</td>
                                  <td style={{ padding: '8px' }}>{q.postGraduation.rollNo}</td>
                                  <td style={{ padding: '8px' }}>{q.postGraduation.percentage}%</td>
                                </>
                              )}
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
              {!isEditing && (
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
              )}
            </div>

            {/* Footer Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              {isEditing ? (
                <>
                  <button 
                    onClick={() => setIsEditing(false)}
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
                    Cancel Edit
                  </button>
                  <button 
                    onClick={() => handleSaveEdit(false)}
                    disabled={verifying}
                    style={{
                      background: '#3B82F6',
                      border: 'none',
                      color: 'white',
                      padding: '10px 20px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      fontSize: '0.85rem',
                      boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2)'
                    }}
                  >
                    {verifying ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </>
              ) : (
                <>
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
                    <>
                      {student.profile?.rejectionRemarks ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px', background: '#FFF5F5', padding: '16px', borderRadius: '12px', border: '1px solid #FEB2B2', width: '100%', textAlign: 'left' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: '#C53030',
                            fontWeight: 600,
                            fontSize: '0.85rem'
                          }}>
                            <span style={{ fontSize: '1.25rem' }}>❌</span>
                            <span>Request rejected and awaiting resubmission by the candidate.</span>
                          </div>
                        </div>
                      ) : showRejectPopup ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px', background: '#FFF5F5', padding: '16px', borderRadius: '12px', border: '1px solid #FED7D7', width: '100%', textAlign: 'left' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#C53030' }}>
                              Rejection Remarks / Correction Instructions <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <textarea
                              placeholder="Please explain the reason for rejection or what corrections are needed..."
                              value={remarks}
                              onChange={e => setRemarks(e.target.value)}
                              style={{
                                width: '100%',
                                height: '80px',
                                padding: '10px 12px',
                                borderRadius: '8px',
                                border: '1px solid #FC8181',
                                fontSize: '0.85rem',
                                outline: 'none',
                                resize: 'vertical',
                                color: '#2D3748',
                                fontFamily: 'Outfit, sans-serif'
                              }}
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              onClick={handleRejectAndSendToStudent}
                              disabled={verifying}
                              style={{ padding: '8px 16px', fontSize: '0.82rem', background: '#EF4444', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'white', fontWeight: 600 }}
                            >
                              Send back to Candidate for Editing
                            </button>
                            <button
                              type="button"
                              onClick={handleSelectEditAtHodEnd}
                              style={{ padding: '8px 16px', fontSize: '0.82rem', background: '#3B82F6', border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'white', fontWeight: 600 }}
                            >
                              ✏️ Edit Profile Info at HOD End
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowRejectPopup(false)}
                              style={{ padding: '8px 16px', fontSize: '0.82rem', background: '#E2E8F0', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#475569', fontWeight: 600 }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button 
                            style={{ 
                              background: '#EF4444', 
                              border: 'none', 
                              color: '#ffffff',
                              padding: '10px 20px',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontSize: '0.85rem',
                              boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)'
                            }}
                            onClick={() => setShowRejectPopup(true)}
                            disabled={verifying}
                          >
                            Reject Request
                          </button>
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
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

    </AnimatePresence>
  );
};

export default UnifiedStudentModal;
