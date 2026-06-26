import React, { useState, useEffect, useContext } from 'react';
import useApi from '../../hooks/useApi';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import UnifiedStudentModal from '../../components/UnifiedStudentModal';
import { Search, Users, ShieldCheck, GraduationCap, Filter, BookOpen } from 'lucide-react';

const MyStudentsTab = () => {
  const { user } = useContext(AuthContext);
  const api = useApi();
  const toast = useToast();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [degreeTypeFilter, setDegreeTypeFilter] = useState('');
  const [verificationFilter, setVerificationFilter] = useState(''); // 'verified' | 'pending' | ''
  const [degreeTypes, setDegreeTypes] = useState([]);

  // Modal states
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/students');
      setStudents(res.data);
    } catch (err) {
      toast.error('Failed to fetch department students.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStudents();
      // Fetch degree types from masters
      api.get('/attendance/masters/degree-types')
        .then(res => setDegreeTypes(res.data))
        .catch(() => toast.error('Failed to load degree types'));
    }
  }, [user]);

  const handleVerifySuccess = (verifiedStudentId) => {
    setStudents(prev => 
      prev.map(s => s._id === verifiedStudentId ? { ...s, isVerified: true } : s)
    );
  };

  // Filter students locally
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          student.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.profile?.enrollmentNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDegree = degreeTypeFilter === '' || student.profile?.degreeType === degreeTypeFilter;
    
    let matchesVerification = true;
    if (verificationFilter === 'verified') {
      matchesVerification = student.isVerified === true;
    } else if (verificationFilter === 'pending') {
      matchesVerification = student.isVerified !== true;
    }

    return matchesSearch && matchesDegree && matchesVerification;
  });

  return (
    <div className="glass-panel p-xl">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={24} style={{ color: 'var(--color-primary)' }} />
            Department Students Directory
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            List of all students enrolled in the Department of {user?.department || 'your department'}.
          </p>
        </div>
        <div style={{
          background: 'rgba(var(--color-primary-rgb), 0.08)',
          color: 'var(--color-primary)',
          padding: '8px 16px',
          borderRadius: '12px',
          fontWeight: 600,
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          Total: {filteredStudents.length} Students
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr',
        gap: '16px',
        marginBottom: '24px',
        background: 'rgba(255,255,255,0.02)',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid var(--color-border)'
      }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search by name, username or enrollment number..." 
            className="form-input"
            style={{ paddingLeft: '36px' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Degree Type Filter */}
        <div>
          <select 
            className="form-input" 
            value={degreeTypeFilter}
            onChange={e => setDegreeTypeFilter(e.target.value)}
          >
            <option value="">All Degree Types</option>
            {degreeTypes.map(dt => (
              <option key={dt._id} value={dt.code}>{dt.name} ({dt.code})</option>
            ))}
          </select>
        </div>

        {/* Verification Filter */}
        <div>
          <select 
            className="form-input"
            value={verificationFilter}
            onChange={e => setVerificationFilter(e.target.value)}
          >
            <option value="">All Verification Status</option>
            <option value="verified">Verified Only</option>
            <option value="pending">Pending Verification</option>
          </select>
        </div>
      </div>

      {/* Student List Grid */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '16px' }}>
          <div className="premium-preloader-spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(26, 90, 59, 0.1)', borderTopColor: 'var(--color-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Loading department student records...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="clay-card p-xl text-center" style={{ padding: '60px', color: 'var(--text-secondary)' }}>
          <BookOpen size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <h3>No Students Found</h3>
          <p style={{ fontSize: '0.9rem', maxWidth: '400px', margin: '8px auto 0' }}>
            We couldn't find any student matching your current search or filter criteria.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          {filteredStudents.map(student => {
            const initial = student.name?.[0]?.toUpperCase() || 'S';
            const profile = student.profile || {};
            return (
              <div 
                key={student._id} 
                className="clay-card" 
                style={{ 
                  padding: '20px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div>
                  {/* Top info and status badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, rgba(165,214,167,0.3), rgba(46,158,91,0.3))',
                      color: 'var(--color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      fontWeight: 'bold'
                    }}>
                      {initial}
                    </div>
                    {student.isVerified ? (
                      <span style={{ 
                        fontSize: '0.72rem', 
                        background: 'rgba(16, 185, 129, 0.1)', 
                        color: '#10B981', 
                        padding: '4px 10px', 
                        borderRadius: '20px', 
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        <ShieldCheck size={12} /> Verified
                      </span>
                    ) : (
                      <span style={{ 
                        fontSize: '0.72rem', 
                        background: 'rgba(245, 158, 11, 0.1)', 
                        color: '#F59E0B', 
                        padding: '4px 10px', 
                        borderRadius: '20px', 
                        fontWeight: 600 
                      }}>
                        ⏳ Pending
                      </span>
                    )}
                  </div>

                  {/* Name and enrollment */}
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                    {student.name}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0 0 12px 0' }}>
                    Roll No: <strong>{profile.enrollmentNumber || 'Not Filled'}</strong>
                  </p>

                  {/* Academic metadata */}
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '6px', 
                    fontSize: '0.82rem', 
                    borderTop: '1px solid var(--color-border)', 
                    paddingTop: '12px',
                    marginBottom: '16px' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                      <GraduationCap size={14} />
                      <span>{profile.degreeName || 'Degree Details Pending'}</span>
                    </div>
                    {profile.academicSession && (
                      <div style={{ color: 'var(--text-secondary)' }}>
                        Session: <strong>{profile.academicSession}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* View Details CTA */}
                <button 
                  className="btn btn-sm btn-outline" 
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => {
                    setSelectedStudent(student);
                    setIsModalOpen(true);
                  }}
                >
                  Open Profile
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Unified Student modal */}
      {selectedStudent && (
        <UnifiedStudentModal 
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedStudent(null);
          }}
          student={selectedStudent}
          onVerifySuccess={handleVerifySuccess}
        />
      )}
      
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default MyStudentsTab;
