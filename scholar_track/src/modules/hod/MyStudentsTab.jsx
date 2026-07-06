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
  const [subTab, setSubTab] = useState('pending'); // 'pending' | 'verified'
  const [degreeTypes, setDegreeTypes] = useState([]);

  // Modal states
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/students?isPhD=false');
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
    // Hide PhDs explicitly
    const isPhD = student.profile?.isPhD === true || student.profile?.degreeType?.toUpperCase().includes('PHD');
    if (isPhD) return false;

    const matchesSearch = student.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          student.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          student.profile?.enrollmentNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDegree = degreeTypeFilter === '' || student.profile?.degreeType === degreeTypeFilter;
    
    const matchesSubTab = subTab === 'verified' ? student.isVerified === true : student.isVerified !== true;

    return matchesSearch && matchesDegree && matchesSubTab;
  });

  return (
    <div className="glass-panel p-xl">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={24} style={{ color: 'var(--color-primary)' }} />
            Student Registration Verifications & Logs (Non-PhD)
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Verify new student registrations and inspect approved registration log records.
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

      {/* Tab selection */}
      <div className="tab-header mb-lg" style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--color-border-solid)', paddingBottom: '12px', marginBottom: '24px' }}>
        <button 
          className={`tab-btn ${subTab === 'pending' ? 'active' : ''}`} 
          style={{ background: 'none', border: 'none', color: subTab === 'pending' ? 'var(--color-primary)' : 'var(--text-secondary)', fontWeight: subTab === 'pending' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '0.95rem' }}
          onClick={() => setSubTab('pending')}
        >
          Pending Verification ({students.filter(s => !s.isVerified && !(s.profile?.isPhD || s.profile?.degreeType?.toUpperCase().includes('PHD'))).length})
        </button>
        <button 
          className={`tab-btn ${subTab === 'verified' ? 'active' : ''}`} 
          style={{ background: 'none', border: 'none', color: subTab === 'verified' ? 'var(--color-primary)' : 'var(--text-secondary)', fontWeight: subTab === 'verified' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '0.95rem' }}
          onClick={() => setSubTab('verified')}
        >
          Verified Registrations Log ({students.filter(s => s.isVerified && !(s.profile?.isPhD || s.profile?.degreeType?.toUpperCase().includes('PHD'))).length})
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '3fr 1fr',
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
      </div>

      {/* Student List Table */}
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
        <div className="data-table-wrapper">
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.08)' }}>
                <th style={{ width: '60px', textAlign: 'left', padding: '12px 16px' }}>Sr. No.</th>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Father's Name</th>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Sh. No.</th>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Course</th>
                <th style={{ textAlign: 'left', padding: '12px 16px' }}>Status</th>
                <th style={{ width: '100px', textAlign: 'center', padding: '12px 16px' }}>View</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, index) => {
                const profile = student.profile || {};
                return (
                  <tr key={student._id} style={{ borderBottom: '1px solid var(--color-border-solid, rgba(255,255,255,0.05))' }}>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{index + 1}</td>
                    <td style={{ padding: '14px 16px', fontWeight: '600', color: 'var(--text-primary)' }}>{student.name}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{profile.fatherName || '—'}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontWeight: '500' }}>{profile.enrollmentNumber || '—'}</td>
                    <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{profile.degreeName || '—'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      {student.isVerified ? (
                        <span style={{ 
                          fontSize: '0.72rem', 
                          background: 'rgba(16, 185, 129, 0.1)', 
                          color: '#10B981', 
                          padding: '4px 10px', 
                          borderRadius: '20px', 
                          fontWeight: 600,
                          display: 'inline-flex',
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
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <button 
                        className="btn btn-sm btn-outline" 
                        onClick={() => {
                          setSelectedStudent(student);
                          setIsModalOpen(true);
                        }}
                        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
