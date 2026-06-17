import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const UtilityAction = ({ type }) => {
  const [showModal, setShowModal] = useState(true);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState('Awaiting authorization...');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [summary, setSummary] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Dynamic seeding states
  const [departments, setDepartments] = useState([]);
  const [selectedDepts, setSelectedDepts] = useState([]);
  const [studentCount, setStudentCount] = useState(10);
  const [facultyCount, setFacultyCount] = useState(5);
  const [loadingDepts, setLoadingDepts] = useState(false);

  useEffect(() => {
    if (type === 'seed-users') {
      setLoadingDepts(true);
      setError('');
      axios.get(`${API_BASE_URL}/api/departments`)
        .then(res => {
          const fetchedDepts = res.data || [];
          setDepartments(fetchedDepts);
          // Default to select all departments
          setSelectedDepts(fetchedDepts.map(d => d.name));
        })
        .catch(err => {
          console.error('Failed to retrieve departments:', err);
          setError('Could not query departments list from database. Using fallbacks.');
          const fallback = [
            { name: 'Department of Computer Science', code: 'CS' },
            { name: 'Department of Chemistry', code: 'CHEM' },
            { name: 'Department of Data Science and Artificial Intelligence', code: 'DSAI' },
            { name: 'Department of Forensic Science', code: 'FORS' },
            { name: 'Department of Physics', code: 'PHYS' },
            { name: 'Department of Mathematics', code: 'MATH' }
          ];
          setDepartments(fallback);
          setSelectedDepts(fallback.map(d => d.name));
        })
        .finally(() => {
          setLoadingDepts(false);
        });
    }
  }, [type]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter the security password.');
      return;
    }

    if (type === 'seed-users' && selectedDepts.length === 0) {
      setError('Please select at least one department to seed.');
      return;
    }

    setSubmitting(true);
    setError('');
    setStatus(`Processing ${type === 'clear' ? 'full database wipe' : type === 'seed-users' ? 'user database seeding' : 'system seeding'}...`);

    const endpoint = type === 'clear' ? 'clear-all' : type === 'seed-users' ? 'seed-users' : 'seed';
    
    // Construct request body
    const payload = type === 'seed-users' ? {
      password,
      selectedDepartments: selectedDepts,
      studentCount,
      facultyCount
    } : { password };

    axios.post(`${API_BASE_URL}/${endpoint}`, payload, {
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })
      .then(res => {
        setSuccess(true);
        setShowModal(false);
        setStatus(type === 'clear' ? 'System database wiped successfully!' : type === 'seed-users' ? 'User accounts database seeded successfully!' : 'System database seeded successfully!');
        setSummary(res.data);
      })
      .catch(err => {
        const errMsg = err.response?.data?.message || err.message || 'Operation failed.';
        setError(errMsg);
        setStatus('Operation Failed.');
      })
      .finally(() => {
        setSubmitting(false);
      });
  };

  const accentColor = type === 'clear' ? '#ef4444' : type === 'seed-users' ? '#3b82f6' : '#10b981';
  const buttonGradient = type === 'clear' 
    ? 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)' 
    : type === 'seed-users'
    ? 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)'
    : 'linear-gradient(135deg, #34d399 0%, #10b981 100%)';
  const shadowGlow = type === 'clear' 
    ? 'rgba(239, 68, 68, 0.25)' 
    : type === 'seed-users'
    ? 'rgba(59, 130, 246, 0.25)'
    : 'rgba(16, 185, 129, 0.25)';

  return (
    <div style={{
      background: 'linear-gradient(135deg, #0b0f19 0%, #161e31 100%)',
      color: '#f1f5f9',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      position: 'relative'
    }}>
      {/* Decorative floating background orbs */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: accentColor,
        filter: 'blur(100px)',
        opacity: 0.15,
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: '350px',
        height: '350px',
        borderRadius: '50%',
        background: '#3b82f6',
        filter: 'blur(110px)',
        opacity: 0.15,
        zIndex: 0
      }} />

      {/* Main Status / Results Card (Hidden when modal is visible) */}
      {!showModal && (
        <div style={{
          background: 'rgba(30, 41, 59, 0.65)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '500px',
          padding: '40px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
          zIndex: 1,
          animation: 'fadeIn 0.4s ease'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            fontSize: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px',
            background: error ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            color: error ? '#ef4444' : '#10b981'
          }}>
            {error ? '❌' : type === 'clear' ? '🧹' : type === 'seed-users' ? '👥' : '🌱'}
          </div>
          
          <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px', color: '#fff', letterSpacing: '-0.5px' }}>
            {type === 'clear' ? 'System Reset Utility' : type === 'seed-users' ? 'User Seeding Utility' : 'System Seeding Utility'}
          </h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '24px', fontWeight: '500' }}>{status}</p>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.15)',
              borderRadius: '14px',
              padding: '16px',
              marginBottom: '24px',
              color: '#fca5a5',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              gap: '8px'
            }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {success && summary && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '12px', fontWeight: '700', letterSpacing: '0.5px' }}>Operations Log</h3>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px', padding: 0 }}>
                {summary.records && summary.records.map(r => (
                  <li key={r.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px dashed rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
                    <span style={{ color: '#cbd5e1' }}>{r.name}</span>
                    <strong style={{ color: '#fff' }}>{r.count} {type === 'clear' ? 'deleted' : 'created'}</strong>
                  </li>
                ))}
                {summary.seeded && summary.seeded.map(s => (
                  <li key={s.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', borderBottom: '1px dashed rgba(255,255,255,0.06)', paddingBottom: '6px' }}>
                    <span style={{ color: '#cbd5e1' }}>{s.name}</span>
                    <strong style={{ color: '#fff' }}>{s.status}</strong>
                  </li>
                ))}
              </ul>
              {summary.files && summary.files.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <h4 style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', fontWeight: '700' }}>Deleted Document Files ({summary.files.length})</h4>
                  <div style={{ maxHeight: '100px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {summary.files.map(f => (
                      <div key={f} style={{ fontSize: '11px', background: 'rgba(255,255,255,0.04)', padding: '6px 10px', borderRadius: '6px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        📄 {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <button 
            onClick={() => window.location.href = '/'}
            style={{
              width: '100%',
              padding: '16px',
              border: 'none',
              borderRadius: '14px',
              background: buttonGradient,
              color: '#fff',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: `0 4px 14px ${shadowGlow}`
            }}
          >
            Return to Portal Home
          </button>
        </div>
      )}

      {/* Centered Stunning Custom Password Modal overlay */}
      {showModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(11, 15, 25, 0.85)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '24px',
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{
            background: 'rgba(30, 41, 59, 0.75)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '500px',
            padding: '40px',
            boxShadow: '0 30px 60px -15px rgba(0, 0, 0, 0.6), 0 0 50px rgba(255,255,255,0.02)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
          }}>
            {/* Lock Icon */}
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              fontSize: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '24px',
              background: `${accentColor}18`,
              color: accentColor,
              border: `1px solid ${accentColor}30`,
              animation: 'pulse 2s infinite'
            }}>
              {type === 'seed-users' ? '👥' : '🔑'}
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px', color: '#fff', letterSpacing: '-0.5px' }}>
              Authorize System Action
            </h2>
            <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '24px', lineHeight: '1.5', fontWeight: '500' }}>
              {type === 'clear' 
                ? 'This action will completely wipe all database records and delete all stored PDF/DOCX thesis documents. This process is irreversible.' 
                : type === 'seed-users'
                ? 'Select departments and choose counts to populate academic scholars, supervisors, and head credentials.'
                : 'This will seed the portal with test scholar accounts, faculty guides, department heads, and academic departments list.'}
            </p>

            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.15)',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '20px',
                color: '#fca5a5',
                fontSize: '13px',
                fontWeight: '500',
                display: 'flex',
                gap: '8px'
              }}>
                <span>❌</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Dynamic User Seeding Configurations */}
              {type === 'seed-users' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8' }}>
                        Academic Departments
                      </label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          type="button" 
                          onClick={() => setSelectedDepts(departments.map(d => d.name))}
                          style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                        >
                          Select All
                        </button>
                        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '11px' }}>|</span>
                        <button 
                          type="button" 
                          onClick={() => setSelectedDepts([])}
                          style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>

                    <div style={{
                      maxHeight: '130px',
                      overflowY: 'auto',
                      background: 'rgba(15, 23, 42, 0.4)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      {loadingDepts ? (
                        <div style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center', padding: '10px' }}>Loading departments...</div>
                      ) : (
                        departments.map(d => {
                          const checked = selectedDepts.includes(d.name);
                          return (
                            <label 
                              key={d.name} 
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '10px', 
                                fontSize: '13px', 
                                cursor: 'pointer',
                                color: checked ? '#fff' : '#94a3b8',
                                fontWeight: checked ? '600' : '400',
                                userSelect: 'none'
                              }}
                            >
                              <input 
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedDepts([...selectedDepts, d.name]);
                                  } else {
                                    setSelectedDepts(selectedDepts.filter(name => name !== d.name));
                                  }
                                }}
                                style={{ cursor: 'pointer' }}
                              />
                              <span>
                                {d.name}
                              </span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8' }}>
                        Scholars Count
                      </label>
                      <select 
                        value={studentCount} 
                        onChange={e => setStudentCount(parseInt(e.target.value))}
                        style={{
                          padding: '12px',
                          background: 'rgba(15, 23, 42, 0.5)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '12px',
                          color: '#fff',
                          outline: 'none',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        <option value="3" style={{ background: '#1e293b' }}>3 (Minimum)</option>
                        <option value="5" style={{ background: '#1e293b' }}>5</option>
                        <option value="10" style={{ background: '#1e293b' }}>10 (Default)</option>
                        <option value="15" style={{ background: '#1e293b' }}>15</option>
                        <option value="20" style={{ background: '#1e293b' }}>20</option>
                      </select>
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8' }}>
                        Faculty Count
                      </label>
                      <select 
                        value={facultyCount} 
                        onChange={e => setFacultyCount(parseInt(e.target.value))}
                        style={{
                          padding: '12px',
                          background: 'rgba(15, 23, 42, 0.5)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '12px',
                          color: '#fff',
                          outline: 'none',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        <option value="3" style={{ background: '#1e293b' }}>3 (Minimum)</option>
                        <option value="5" style={{ background: '#1e293b' }}>5 (Default)</option>
                        <option value="10" style={{ background: '#1e293b' }}>10</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8' }}>
                  Enter Security Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    required 
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '16px',
                      paddingRight: '64px',
                      background: 'rgba(15, 23, 42, 0.5)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'all 0.2s'
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = accentColor;
                      e.target.style.boxShadow = `0 0 0 3px ${accentColor}20`;
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      fontSize: '11px',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      transition: 'color 0.2s',
                      outline: 'none'
                    }}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button 
                  type="button"
                  onClick={() => window.location.href = '/'}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    padding: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '14px',
                    background: 'none',
                    color: '#94a3b8',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: 1.5,
                    padding: '16px',
                    border: 'none',
                    borderRadius: '14px',
                    background: buttonGradient,
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: `0 4px 14px ${shadowGlow}`
                  }}
                >
                  {submitting ? 'Verifying...' : type === 'seed-users' ? 'Execute User Seeding' : 'Authorize Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UtilityAction;
