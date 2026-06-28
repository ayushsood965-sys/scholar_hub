import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { Search, GraduationCap, Users, User, ArrowRight, Loader } from 'lucide-react';
import { API_URL } from '../config';
import { ThesisContext } from '../context/ThesisContext';
import { useToast } from '../context/ToastContext';
import UnifiedScholarModal from './UnifiedScholarModal';
import { useGridControl } from '../hooks/useGridControl';

const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const ScholarSearchTab = ({ user }) => {
  const toast = useToast();
  const { fetchThesisById, reviewMilestone, drcApprove, seminarClear, finalApprove, clearCoursework, verifyEnrollment, assignSupervisor } = useContext(ThesisContext);

  const [searchMode, setSearchMode] = useState('enrollment'); // 'enrollment' or 'department'
  const [enrollmentInput, setEnrollmentInput] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [departments, setDepartments] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const { paginatedData, renderGridControls, currentPage, pageSize } = useGridControl(
    results,
    ['scholarId.name', 'enrollmentNumber', 'department', 'supervisorId.name']
  );

  // Profile modal states
  const [selectedThesisId, setSelectedThesisId] = useState(null);
  const [selectedThesisData, setSelectedThesisData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Fetch departments on load
  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await axios.get(`${API_URL}/departments`);
        setDepartments(res.data || []);
      } catch (err) {
        console.error('Failed to load departments:', err);
      }
    };
    fetchDepts();
  }, []);

  // Fetch candidates when department changes
  useEffect(() => {
    const fetchCandidatesByDept = async () => {
      if (!selectedDept) {
        setCandidates([]);
        setSelectedCandidateId('');
        return;
      }
      try {
        const res = await axios.get(`${API_URL}/thesis/search/global?department=${encodeURIComponent(selectedDept)}`, getAuthHeader());
        setCandidates(res.data || []);
        setSelectedCandidateId('');
      } catch (err) {
        console.error('Failed to load department candidates:', err);
        toast.error('Failed to retrieve candidates for this department.');
      }
    };
    fetchCandidatesByDept();
  }, [selectedDept]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearching(true);
    setResults([]);
    setHasSearched(true);

    try {
      let url = `${API_URL}/thesis/search/global`;
      if (searchMode === 'enrollment') {
        if (!enrollmentInput.trim()) {
          toast.warning('Please enter a registration or enrollment number.');
          setSearching(false);
          return;
        }
        url += `?enrollmentNumber=${encodeURIComponent(enrollmentInput.trim())}`;
      } else {
        if (!selectedDept) {
          toast.warning('Please select a department.');
          setSearching(false);
          return;
        }
        if (selectedCandidateId) {
          // If a specific candidate is selected, fetch just that one
          const match = candidates.find(c => c._id === selectedCandidateId);
          if (match) {
            setResults([match]);
            setSearching(false);
            return;
          }
        }
        url += `?department=${encodeURIComponent(selectedDept)}`;
      }

      const res = await axios.get(url, getAuthHeader());
      setResults(res.data || []);
      if (res.data.length === 0) {
        toast.info('No matching scholar records found.');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to search scholar records.');
    } finally {
      setSearching(false);
    }
  };

  const handleOpenProfile = async (thesisId) => {
    setModalLoading(true);
    setSelectedThesisId(thesisId);
    try {
      const data = await fetchThesisById(thesisId);
      setSelectedThesisData(data);
    } catch (err) {
      toast.error('Failed to retrieve full scholar profile details.');
      setSelectedThesisId(null);
    } finally {
      setModalLoading(false);
    }
  };

  const handleClosePanel = () => {
    setSelectedThesisId(null);
    setSelectedThesisData(null);
  };

  const handleHODAction = async (fn) => {
    try {
      await fn(selectedThesisId);
      const data = await fetchThesisById(selectedThesisId);
      setSelectedThesisData(data);
      // Refresh results list
      setResults(prev => prev.map(r => r._id === selectedThesisId ? data.thesis : r));
    } catch (e) {
      toast.error(e.response?.data?.message || 'Action failed.');
    }
  };

  const handleReview = async (milestoneId, action, comment) => {
    try {
      await reviewMilestone(milestoneId, action, comment);
      const data = await fetchThesisById(selectedThesisId);
      setSelectedThesisData(data);
    } catch (e) {
      toast.error('Failed to review milestone.');
    }
  };

  // Determine subrole based on department match to prevent mutation in other departments
  const currentSubRole = selectedThesisData?.thesis?.department === user?.department
    ? (user?.role === 'HOD' ? 'HOD' : user?.subRole)
    : '';

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Panel */}
      <div className="card" style={{ padding: '24px 32px', borderRadius: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--color-border, #E2E8F0)', paddingBottom: 16, marginBottom: 24 }}>
          <div style={{ background: '#F5F3FF', padding: 12, borderRadius: 12, color: '#7C3AED' }}>
            <Search size={24} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text, #0F172A)' }}>Search Scholar Details</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary, #64748B)' }}>
              Cross-departmental search terminal. View full milestones progress, supervisor details, and lifecycle completions across any academic department.
            </p>
          </div>
        </div>

        {/* Search Mode Toggle */}
        <div style={{ display: 'flex', background: '#F1F5F9', padding: 4, borderRadius: 10, width: 'fit-content', marginBottom: 24 }}>
          <button
            onClick={() => { setSearchMode('enrollment'); setHasSearched(false); setResults([]); }}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: searchMode === 'enrollment' ? 'white' : 'transparent',
              color: searchMode === 'enrollment' ? '#0F172A' : '#64748B',
              fontWeight: 700,
              fontSize: '0.85rem',
              borderRadius: 8,
              cursor: 'pointer',
              boxShadow: searchMode === 'enrollment' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Search by Registration Number
          </button>
          <button
            onClick={() => { setSearchMode('department'); setHasSearched(false); setResults([]); }}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: searchMode === 'department' ? 'white' : 'transparent',
              color: searchMode === 'department' ? '#0F172A' : '#64748B',
              fontWeight: 700,
              fontSize: '0.85rem',
              borderRadius: 8,
              cursor: 'pointer',
              boxShadow: searchMode === 'department' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Browse by Department
          </button>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {searchMode === 'enrollment' ? (
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-secondary, #475569)', marginBottom: 6 }}>
                Registration / Enrollment Number
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. PhD/2025/CS-102"
                  value={enrollmentInput}
                  onChange={(e) => setEnrollmentInput(e.target.value)}
                  style={{ flex: 1, padding: '10px' }}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={searching}
                  style={{
                    background: 'linear-gradient(135deg, #7C3AED 0%, #9061F9 100%)',
                    border: 'none',
                    color: 'white',
                    padding: '0 24px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    borderRadius: 8,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  {searching ? <Loader className="spin-icon" size={16} /> : <Search size={16} />}
                  Search Candidate
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Department Dropdown */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-secondary, #475569)', marginBottom: 6 }}>
                    Academic Department
                  </label>
                  <select
                    className="form-input"
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    style={{ width: '100%', padding: '10px' }}
                  >
                    <option value="">-- Select Department --</option>
                    {departments.map(d => (
                      <option key={d._id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                {/* Candidate Dropdown (Follow-up) */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-secondary, #475569)', marginBottom: 6 }}>
                    Scholar / Candidate <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#94A3B8' }}>(Optional)</span>
                  </label>
                  <select
                    className="form-input"
                    value={selectedCandidateId}
                    onChange={(e) => setSelectedCandidateId(e.target.value)}
                    disabled={!selectedDept}
                    style={{ width: '100%', padding: '10px' }}
                  >
                    <option value="">-- Select Scholar (All Scholars in Dept) --</option>
                    {candidates.map(c => (
                      <option key={c._id} value={c._id}>
                        {c.scholarId?.name} ({c.enrollmentNumber || 'No Enrollment'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={searching}
                style={{
                  background: 'linear-gradient(135deg, #7C3AED 0%, #9061F9 100%)',
                  border: 'none',
                  color: 'white',
                  padding: '12px 24px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  width: '100%'
                }}
              >
                {searching ? <Loader className="spin-icon" size={16} /> : <Search size={16} />}
                Search Department Records
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Loading Overlay */}
      {modalLoading && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
          <Loader className="spin-icon" size={40} color="#7C3AED" />
          <span style={{ marginTop: 12, fontWeight: 700, color: '#0F172A' }}>Loading scholar profile...</span>
        </div>
      )}

      {/* Results Display */}
      {hasSearched && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text, #1E293B)' }}>
            Search Results ({results.length})
          </h4>

          {renderGridControls()}

          {paginatedData.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
              No scholar records found matching the query. Please refine the enrollment number or select a different department.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {paginatedData.map((r, idx) => (
                <div
                  key={r._id}
                  className="card"
                  style={{
                    padding: 20,
                    borderRadius: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: 16,
                    borderLeft: '5px solid #7C3AED',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: -15,
                    right: -15,
                    width: 60,
                    height: 60,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #7C3AED 0%, #9061F9 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)'
                  }}>
                    {(currentPage - 1) * pageSize + idx + 1}
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h5 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text, #0F172A)' }}>
                        {r.scholarId?.name || 'Scholar Name'}
                      </h5>
                      <span style={{ fontSize: '0.72rem', background: '#F3F4F6', padding: '3px 8px', borderRadius: 12, color: '#4B5563', fontWeight: 600 }}>
                        {r.status?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12, fontSize: '0.8rem', color: 'var(--color-text-secondary, #64748B)' }}>
                      <div><strong>Registration No:</strong> <span style={{ color: '#0F172A', fontWeight: 600 }}>{r.enrollmentNumber || 'N/A'}</span></div>
                      <div><strong>Department:</strong> <span style={{ color: '#0F172A' }}>{r.department}</span></div>
                      <div><strong>Supervisor:</strong> <span style={{ color: '#0F172A' }}>{r.supervisorId?.name || 'Not Allocated'}</span></div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenProfile(r._id)}
                    className="btn-primary"
                    style={{
                      background: 'white',
                      border: '1px solid #E2E8F0',
                      color: '#4F46E5',
                      padding: '8px 16px',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      borderRadius: 6,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  >
                    View Academic Profile <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Render Unified Scholar Modal on top */}
      {selectedThesisId && selectedThesisData && createPortal(
        <UnifiedScholarModal
          thesis={selectedThesisData.thesis}
          milestones={selectedThesisData.milestones}
          onReview={handleReview}
          onDRC={async () => {
            const data = await fetchThesisById(selectedThesisId);
            setSelectedThesisData(data);
            setResults(prev => prev.map(r => r._id === selectedThesisId ? data.thesis : r));
          }}
          onSeminar={() => handleHODAction(seminarClear)}
          onFinalApprove={() => handleHODAction(finalApprove)}
          onClearCoursework={() => handleHODAction(clearCoursework)}
          onVerify={() => handleHODAction(verifyEnrollment)}
          onAssign={(supervisorId) => handleHODAction(() => assignSupervisor(selectedThesisId, supervisorId))}
          subRole={currentSubRole}
          isReadOnly={true}
          onRefresh={async () => {
            const data = await fetchThesisById(selectedThesisId);
            setSelectedThesisData(data);
          }}
          onClose={handleClosePanel}
        />,
        document.body
      )}
    </div>
  );
};

export default ScholarSearchTab;
