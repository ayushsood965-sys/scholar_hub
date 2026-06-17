import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Users, FileText, User, LogOut, CheckCircle2, XCircle, Plus, Trash2, Edit2, Shield, FolderPlus, Search, Bell } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import axios from 'axios';
import NotificationPanel from '../components/NotificationPanel';
import { API_BASE_URL, API_URL } from '../config';
import ThemeToggle from '../components/ThemeToggle';

const API = API_URL;
const getAuthHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

// ── HEADER COMPONENT ──
const Header = ({ title }) => {
  const { user } = useContext(AuthContext);
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useContext(NotificationContext);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const handleOutsideClick = () => setShowDropdown(false);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  const handleItemClick = (e, notifId) => {
    e.stopPropagation();
    markAsRead(notifId);
  };

  const handleMarkAll = (e) => {
    e.stopPropagation();
    markAllAsRead();
  };

  const getAccentColor = (type) => {
    if (type === 'WELCOME') return '#7C3AED';
    if (type === 'PROFILE_INCOMPLETE') return '#EF4444';
    if (type === 'PENDING_ACTION') return '#D97706';
    if (type === 'SUCCESSFUL_ACTION') return '#10B981';
    return '#3B82F6';
  };

  return (
    <div className="header" style={{ background: '#1e293b', borderBottom: '1px solid #334155', color: '#f8fafc' }}>
      <button 
        className="mobile-menu-toggle" 
        onClick={() => document.body.classList.toggle('sidebar-mobile-open')}
        style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: '#34d399', padding: '8px', marginRight: '8px' }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
      </button>
      <div className="header-title" style={{ color: '#34d399', fontWeight: 800 }}>{title}</div>
      <div className="header-actions">
        <ThemeToggle style={{ marginRight: '8px', color: '#34d399' }} />
        {/* Bell Popover Container */}
        <div style={{ position: 'relative', marginRight: '10px' }}>
          <button 
            onClick={toggleDropdown}
            className="notification-bell"
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              position: 'relative', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '8px',
              borderRadius: '50%',
              transition: 'background-color 0.2s',
              color: '#34d399'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(52, 211, 153, 0.1)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span 
                className="notification-badge" 
                style={{ 
                  position: 'absolute', 
                  top: '2px', 
                  right: '2px', 
                  background: '#EF4444', 
                  color: 'white', 
                  fontSize: '9px', 
                  fontWeight: 'bold', 
                  borderRadius: '50%', 
                  width: '18px', 
                  height: '18px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '2px solid #1e293b'
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* Floating Dropdown */}
          {showDropdown && (
            <div 
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                top: '45px',
                right: '0',
                width: '340px',
                background: 'white',
                border: '1px solid #E2E8F0',
                borderRadius: '16px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                zIndex: 99999,
                overflow: 'hidden',
                textAlign: 'left'
              }}
            >
              {/* Dropdown Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #F1F5F9', background: '#FAFAFA' }}>
                <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🔔</span> Recent Notifications
                </span>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAll}
                    style={{ background: 'none', border: 'none', color: '#10B981', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Scrollable List */}
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 16px', color: '#94A3B8', fontSize: '0.8rem' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🍃</div>
                    <p style={{ margin: 0, fontWeight: 600 }}>All Caught Up!</p>
                    <p style={{ margin: '2px 0 0', fontSize: '0.72rem' }}>No notifications to show.</p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const dotColor = getAccentColor(n.type);
                    return (
                      <div 
                        key={n._id}
                        onClick={(e) => handleItemClick(e, n._id)}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid #F1F5F9',
                          background: n.read ? 'white' : '#F8FAFC',
                          cursor: 'pointer',
                          display: 'flex',
                          gap: '10px',
                          alignItems: 'flex-start',
                          transition: 'background-color 0.2s',
                          position: 'relative'
                        }}
                      >
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: dotColor, marginTop: '5px', flexShrink: 0 }} />
                        
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: n.read ? 600 : 800, color: '#1E293B', lineHeight: 1.2 }}>
                              {n.title}
                            </span>
                            <span style={{ fontSize: '0.62rem', color: '#94A3B8', flexShrink: 0 }}>
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#64748B', lineHeight: 1.3 }}>
                            {n.message}
                          </p>
                        </div>

                        {!n.read && (
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#EF4444', alignSelf: 'center', marginLeft: 'auto' }} />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="user-profile">
          {user?.avatarUrl ? (
            <img src={`${API_BASE_URL}${user.avatarUrl}`} alt="SA" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', border: '2px solid #34d399' }} />
          ) : (
            <svg viewBox="0 0 100 100" style={{ width: 36, height: 36, borderRadius: '50%', background: '#e2e8f0', display: 'block', border: '2px solid #34d399' }}>
              <circle cx="50" cy="35" r="20" fill="#94a3b8" />
              <path d="M15 85c0-13.8 11.2-25 25-25h20c13.8 0 25 11.2 25 25z" fill="#94a3b8" />
            </svg>
          )}
          <div className="user-info">
            <span className="user-name" style={{ color: '#f8fafc' }}>{user?.name || 'Super Admin'}</span>
            <span className="user-dept" style={{ color: '#34d399', fontWeight: 600 }}>SYSTEM ROOT</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── SIDEBAR COMPONENT ──
const Sidebar = ({ activeTab, setActiveTab }) => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const items = [
    { key: 'overview', label: 'System Overview', Icon: Home },
    { key: 'departments', label: 'Department Master', Icon: FolderPlus },
    { key: 'faculty', label: 'Faculty Master', Icon: Users },
    { key: 'hod', label: 'HOD Master', Icon: Shield },
    { key: 'profile', label: 'My Credentials', Icon: User },
  ];
  return (
    <div className="sidebar" style={{ background: '#0f172a', borderRight: '1px solid #1e293b' }}>
      <div className="sidebar-logo">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
          <img src="/hpu_logo.png" alt="HPU Logo" style={{ width: 42, height: 42, objectFit: 'contain' }} />
        </div>
        <h2 style={{ color: '#f8fafc', letterSpacing: '0.05em' }}>SYSTEM ROOT</h2>
      </div>
      <div className="sidebar-nav">
        {items.map(({ key, label, Icon }) => (
          <button 
            key={key} 
            className={`nav-item ${activeTab === key ? 'active' : ''}`} 
            onClick={() => { setActiveTab(key); document.body.classList.remove('sidebar-mobile-open'); }}
            style={{ 
              background: activeTab === key ? 'rgba(52, 211, 153, 0.15)' : 'none', 
              color: activeTab === key ? '#34d399' : '#94a3b8',
              border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' 
            }}
          >
            <Icon className="nav-icon" /> {label}
          </button>
        ))}
      </div>
      <div className="sidebar-bottom">
        <button className="nav-item" onClick={() => { logout(); navigate('/'); }}
          style={{ background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left', color: '#f87171' }}>
          <LogOut className="nav-icon" /> Logout
        </button>
      </div>
    </div>
  );
};

// ── SUPER ADMIN PROFILE COMPONENT ──
const SAProfileTab = ({ uploadAvatar }) => {
  const { user, updateProfile, fetchMe } = useContext(AuthContext);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState('');
  
  const [phoneNumber, setPhoneNumber] = useState(user?.profile?.phoneNumber || '');
  const [email, setEmail] = useState(user?.profile?.email || '');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchMe();
  }, []);

  useEffect(() => {
    if (user?.profile) {
      setPhoneNumber(user.profile.phoneNumber || '');
      setEmail(user.profile.email || '');
    }
  }, [user]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarLoading(true);
    setAvatarMsg('');
    const res = await uploadAvatar(file);
    setAvatarLoading(false);
    if (res.success) {
      setAvatarMsg('Profile picture uploaded successfully!');
    } else {
      setAvatarMsg('Failed to upload profile picture: ' + res.message);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    setErrorMsg('');

    if (phoneNumber) {
      const cleanedPhone = phoneNumber.trim().replace(/[\s\-()]/g, '');
      const indianPhoneRegex = /^(\+91|91|0)?[6-9]\d{9}$/;
      if (!indianPhoneRegex.test(cleanedPhone)) {
        setErrorMsg('Please enter a valid 10-digit Indian phone number (starts with 6-9).');
        setLoading(false);
        return;
      }
    }

    const res = await updateProfile({
      phoneNumber,
      email
    });
    setLoading(false);
    if (res.success) {
      setMsg('Profile credentials updated successfully!');
    } else {
      setErrorMsg('Failed to update profile: ' + res.message);
    }
  };

  return (
    <div className="card" style={{ background: 'white', padding: 32, borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', maxWidth: 600, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        {user?.avatarUrl ? (
          <img 
            src={`${API_BASE_URL}${user.avatarUrl}`} 
            alt="Avatar" 
            style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #34d399', background: '#1e293b', margin: '0 auto 16px', display: 'block' }} 
          />
        ) : (
          <svg viewBox="0 0 100 100" style={{ width: 80, height: 80, borderRadius: '50%', background: '#e2e8f0', display: 'block', border: '3px solid #34d399', margin: '0 auto 16px' }}>
            <circle cx="50" cy="35" r="20" fill="#94a3b8" />
            <path d="M15 85c0-13.8 11.2-25 25-25h20c13.8 0 25 11.2 25 25z" fill="#94a3b8" />
          </svg>
        )}
        <h3 style={{ margin: 0, fontWeight: 800 }}>Master Credentials</h3>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 16 }}> ScholarSync root authority configuration sheet</p>
        
        <div>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#0f172a', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
            {avatarLoading ? 'Uploading...' : '📷 Change Profile Picture'}
            <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} disabled={avatarLoading} />
          </label>
        </div>
        {avatarMsg && (
          <div style={{ marginTop: 12, color: avatarMsg.includes('successfully') ? '#10b981' : '#ef4444', fontSize: '0.8rem', fontWeight: 600 }}>
            {avatarMsg}
          </div>
        )}
      </div>

      {msg && (
        <div style={{ background: '#ecfdf5', border: '1px solid #d1fae5', color: '#047857', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>
          {msg}
        </div>
      )}
      {errorMsg && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: 4 }}>MASTER USERNAME</span>
            <strong style={{ fontSize: '1rem', color: '#0f172a' }}>admin</strong>
          </div>
          <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: 4 }}>MASTER ROLE</span>
            <strong style={{ fontSize: '1rem', color: '#059669' }}>SUPER_ADMIN (ROOT)</strong>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Contact Email Address</label>
          <input 
            type="email" 
            className="form-input" 
            placeholder="Enter contact email address" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>Phone Number (Indian Format)</label>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Enter 10-digit mobile number e.g. 9876543210" 
            value={phoneNumber} 
            onChange={e => setPhoneNumber(e.target.value)} 
            required 
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none' }}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="btn-primary" 
          style={{ width: '100%', padding: '12px', background: '#059669', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}
        >
          {loading ? 'Updating Credentials...' : 'Save Profile Credentials'}
        </button>

        <div style={{ background: '#fef2f2', padding: 16, borderRadius: 8, border: '1px solid #fecaca', color: '#991b1b', fontSize: '0.85rem' }}>
          <strong>🔒 High Security Area:</strong> Super Admin password is auto-seeded to "password" on every server connection bootstrap. You do not need to perform manual registration checks for this node.
        </div>
      </form>
    </div>
  );
};

// ── MAIN SUPER ADMIN DASHBOARD ──
const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { user, uploadAvatar } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [depts, setDepts] = useState([]);
  const [stats, setStats] = useState({ depts: 0, faculty: 0, hods: 0, scholars: 0 });
  
  // Search & Modals State
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deptForm, setDeptForm] = useState({ name: '', code: '' });

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userRoleContext, setUserRoleContext] = useState('FACULTY'); // 'FACULTY' or 'HOD'
  const [userForm, setUserForm] = useState({ name: '', username: '', password: '', department: '', subRole: 'SUPERVISOR' });

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch initial records
  const fetchData = async () => {
    try {
      setErrorMsg('');
      const [uRes, dRes] = await Promise.all([
        axios.get(`${API}/auth/all-users`, getAuthHeader()),
        axios.get(`${API}/departments`, getAuthHeader())
      ]);

      const fetchedUsers = Array.isArray(uRes.data) ? uRes.data : [];
      const fetchedDepts = Array.isArray(dRes.data) ? dRes.data : [];

      setUsers(fetchedUsers);
      setDepts(fetchedDepts);

      // Compute statistics
      const faculty = fetchedUsers.filter(u => u.role === 'FACULTY' && u.subRole !== 'HOD');
      const hods = fetchedUsers.filter(u => u.role === 'HOD' || (u.role === 'FACULTY' && u.subRole === 'HOD'));
      const scholars = fetchedUsers.filter(u => u.role === 'STUDENT');

      setStats({
        depts: fetchedDepts.length,
        faculty: faculty.length,
        hods: hods.length,
        scholars: scholars.length
      });
    } catch (err) {
      setErrorMsg('Failed to load system directory data. Please make sure the backend is active.');
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleToggleActive = async (id) => {
    try {
      await axios.put(`${API}/auth/users/${id}/active`, {}, getAuthHeader());
      setSuccessMsg('Account status synchronized successfully.');
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error updating account status.');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you absolutely sure you want to permanently delete this user account? This action is irreversible.')) return;
    try {
      await axios.delete(`${API}/auth/users/${id}`, getAuthHeader());
      setSuccessMsg('User account permanently deleted.');
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error deleting account.');
    }
  };

  // Department CRUD
  const handleSaveDept = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      if (editingDept) {
        await axios.put(`${API}/departments/${editingDept._id}`, deptForm, getAuthHeader());
        setSuccessMsg('Department updated successfully.');
      } else {
        await axios.post(`${API}/departments`, deptForm, getAuthHeader());
        setSuccessMsg('New department created successfully.');
      }
      setIsDeptModalOpen(false);
      setEditingDept(null);
      setDeptForm({ name: '', code: '' });
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error saving department.');
    }
  };

  const handleDeleteDept = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department? Any associated students or faculty configurations might need update.')) return;
    try {
      await axios.delete(`${API}/departments/${id}`, getAuthHeader());
      setSuccessMsg('Department successfully deleted.');
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error deleting department.');
    }
  };

  // User additions
  const handleSaveUser = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const payload = {
        ...userForm,
        role: userRoleContext,
        subRole: userRoleContext === 'HOD' ? 'HOD' : userForm.subRole
      };
      await axios.post(`${API}/auth/create-user`, payload, getAuthHeader());
      setSuccessMsg(`New ${userRoleContext === 'HOD' ? 'HOD' : 'Faculty'} account created successfully.`);
      setIsUserModalOpen(false);
      setUserForm({ name: '', username: '', password: '', department: '', subRole: 'SUPERVISOR' });
      fetchData();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error creating user account.');
    }
  };

  // Filtered lists
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredFaculty = filteredUsers.filter(u => u.role === 'FACULTY' && u.subRole !== 'HOD');
  const filteredHods = filteredUsers.filter(u => u.role === 'HOD' || (u.role === 'FACULTY' && u.subRole === 'HOD'));

  return (
    <div className="app-container">
      <div className="mobile-overlay" onClick={() => document.body.classList.remove('sidebar-mobile-open')} />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main-content" style={{ display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
        
        {/* Flash Message Notifications */}
        {errorMsg && (
          <div style={{ background: '#fef2f2', borderBottom: '1px solid #fee2e2', color: '#b91c1c', padding: '12px 24px', fontWeight: 600, fontSize: '0.9rem', textAlign: 'center' }}>
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div style={{ background: '#ecfdf5', borderBottom: '1px solid #d1fae5', color: '#047857', padding: '12px 24px', fontWeight: 600, fontSize: '0.9rem', textAlign: 'center' }}>
            ✅ {successMsg}
          </div>
        )}

        <Header title={activeTab === 'overview' ? 'System Directory & Statistics' : activeTab.toUpperCase() + ' MANAGEMENT'} />

        <div className="dashboard-area" style={{ flex: 1, padding: 32 }}>
          
          {/* Welcome Banner */}
          <div className="welcome-banner" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: 16, marginBottom: 32 }}>
            <div>
              <span className="welcome-text" style={{ color: '#f8fafc' }}>System ROOT Administration</span>
              <span className="welcome-subtext" style={{ color: '#34d399' }}> | Institutional Oversight Master</span>
            </div>
            <div className="brand-text" style={{ color: 'rgba(255,255,255,0.05)' }}>SuperAdmin</div>
          </div>

          {/* ── TAB 1: SYSTEM OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div>
              {/* Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24, marginBottom: 36 }}>
                <div className="card stat-card" style={{ borderLeft: '4px solid #3b82f6', background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>ACADEMIC DEPARTMENTS</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e293b', marginTop: 8 }}>{stats.depts}</div>
                </div>
                <div className="card stat-card" style={{ borderLeft: '4px solid #10b981', background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>DEPARTMENT HOD ADMINS</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e293b', marginTop: 8 }}>{stats.hods}</div>
                </div>
                <div className="card stat-card" style={{ borderLeft: '4px solid #a855f7', background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>FACULTY SUPERVISORS</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e293b', marginTop: 8 }}>{stats.faculty}</div>
                </div>
                <div className="card stat-card" style={{ borderLeft: '4px solid #f59e0b', background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600 }}>RESEARCH SCHOLARS</div>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e293b', marginTop: 8 }}>{stats.scholars}</div>
                </div>
              </div>

              {/* Quick Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
                <div className="card" style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <h3 className="card-title" style={{ borderBottom: '2px solid #f1f5f9', paddingBottom: 12 }}>System Configuration Rules</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <span style={{ background: '#ecfdf5', color: '#059669', padding: '4px 8px', borderRadius: 6, fontWeight: 700, fontSize: '0.8rem' }}>RULE 1</span>
                      <div><strong style={{ display: 'block' }}>Department Constraints:</strong> Department creation populates selection options dynamically across Student registration and HOD signup sheets.</div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <span style={{ background: '#ecfdf5', color: '#059669', padding: '4px 8px', borderRadius: 6, fontWeight: 700, fontSize: '0.8rem' }}>RULE 2</span>
                      <div><strong style={{ display: 'block' }}>HOD Account Boundaries:</strong> Only one HOD profile may exist actively per department. Creating a secondary HOD requires disabling the current HOD account status.</div>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <span style={{ background: '#fef2f2', color: '#dc2626', padding: '4px 8px', borderRadius: 6, fontWeight: 700, fontSize: '0.8rem' }}>NOTICE</span>
                      <div><strong style={{ display: 'block' }}>Onboarding Bypass:</strong> Disabled user accounts are instantly blocked from entering the system and will hit the suspend landing prompt.</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <NotificationPanel user={user} onTabChange={setActiveTab} />
                  <div className="card" style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', marginBottom: 16 }}>🛡️</div>
                    <h4 style={{ fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>Secure Master Root Access</h4>
                    <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: '1.5' }}>Credentials for super administrator are auto-seeded on every deployment startup to allow reliable disaster recovery operations.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 2: DEPARTMENT MASTER ── */}
          {activeTab === 'departments' && (
            <div className="card" style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 className="card-title" style={{ margin: 0 }}>Academic Department Registry</h3>
                <button 
                  onClick={() => { setEditingDept(null); setDeptForm({ name: '', code: '' }); setIsDeptModalOpen(true); }}
                  className="btn-primary" 
                  style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#10b981' }}
                >
                  <Plus size={16} /> Add Department
                </button>
              </div>

              <div className="file-list">
                <div className="file-header">
                  <div style={{ flex: 1.5 }}>Code</div>
                  <div style={{ flex: 3 }}>Department Name</div>
                  <div style={{ flex: 2 }}>Registered Date</div>
                  <div style={{ flex: 1.5, textAlign: 'center' }}>Actions</div>
                </div>
                {depts.map(d => (
                  <div key={d._id} className="file-item">
                    <div style={{ flex: 1.5, fontWeight: 700, color: '#0f172a' }}>
                      <span style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: 6 }}>{d.code}</span>
                    </div>
                    <div style={{ flex: 3, fontWeight: 600 }}>{d.name}</div>
                    <div style={{ flex: 2, fontSize: '0.85rem', color: '#64748b' }}>{new Date(d.createdAt).toLocaleDateString()}</div>
                    <div style={{ flex: 1.5, display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <button 
                        onClick={() => { setEditingDept(d); setDeptForm({ name: d.name, code: d.code }); setIsDeptModalOpen(true); }}
                        style={{ border: 'none', background: '#eff6ff', color: '#2563eb', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}
                        title="Edit Department"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDeleteDept(d._id)}
                        style={{ border: 'none', background: '#fef2f2', color: '#dc2626', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}
                        title="Delete Department"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {depts.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>No departments created yet.</div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB 3: FACULTY MASTER ── */}
          {activeTab === 'faculty' && (
            <div className="card" style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: '#f1f5f9', padding: '8px 16px', borderRadius: 12, width: '100%', maxWidth: '300px' }}>
                  <Search size={16} color="#64748b" />
                  <input 
                    type="text" 
                    placeholder="Search faculty..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ border: 'none', background: 'none', outline: 'none', width: '100%', fontSize: '0.85rem' }}
                  />
                </div>
                <button 
                  onClick={() => { setUserRoleContext('FACULTY'); setUserForm({ name: '', username: '', password: '', department: depts[0]?.name || '', subRole: 'SUPERVISOR' }); setIsUserModalOpen(true); }}
                  className="btn-primary" 
                  style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#10b981' }}
                >
                  <Plus size={16} /> Add Supervisor
                </button>
              </div>

              <div className="file-list">
                <div className="file-header">
                  <div style={{ flex: 2.5 }}>Name / Email</div>
                  <div style={{ flex: 2 }}>Department</div>
                  <div style={{ flex: 1.5 }}>Sub-Role</div>
                  <div style={{ flex: 1.5 }}>Verification</div>
                  <div style={{ flex: 1.5 }}>Account Status</div>
                  <div style={{ flex: 2.8, textAlign: 'center' }}>Actions</div>
                </div>
                {filteredFaculty.map(f => (
                  <div key={f._id} className="file-item" style={{ opacity: f.isActive ? 1 : 0.65 }}>
                    <div style={{ flex: 2.5 }}>
                      <div style={{ fontWeight: 700 }}>{f.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{f.username}</div>
                    </div>
                    <div style={{ flex: 2, fontSize: '0.9rem', fontWeight: 600 }}>{f.department || '—'}</div>
                    <div style={{ flex: 1.5 }}>
                      <span style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>
                        {f.subRole || 'SUPERVISOR'}
                      </span>
                    </div>
                    <div style={{ flex: 1.5 }}>
                      <span style={{ 
                        background: f.isVerified ? '#d1fae5' : '#fef3c7', 
                        color: f.isVerified ? '#065f46' : '#d97706', 
                        padding: '4px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 
                      }}>
                        {f.isVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                    <div style={{ flex: 1.5 }}>
                      <span style={{ 
                        background: f.isActive ? '#d1fae5' : '#fee2e2', 
                        color: f.isActive ? '#065f46' : '#991b1b', 
                        padding: '4px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 
                      }}>
                        {f.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <div style={{ flex: 2.8, display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
                      <button 
                        onClick={() => handleToggleActive(f._id)}
                        className="btn-outline" 
                        style={{ fontSize: '0.75rem', padding: '6px 10px', borderColor: f.isActive ? '#ef4444' : '#10b981', color: f.isActive ? '#ef4444' : '#10b981' }}
                      >
                        {f.isActive ? 'Disable' : 'Enable'}
                      </button>
                      {!f.isVerified && (
                        <button 
                          onClick={async () => {
                            try {
                              await axios.put(`${API}/auth/users/${f._id}/verify`, {}, getAuthHeader());
                              setSuccessMsg('Faculty account verified successfully.');
                              fetchData();
                            } catch (err) {
                              setErrorMsg(err.response?.data?.message || 'Error verifying account.');
                            }
                          }}
                          className="btn-outline" 
                          style={{ fontSize: '0.75rem', padding: '6px 10px', borderColor: '#2563eb', color: '#2563eb' }}
                        >
                          Verify
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteUser(f._id)}
                        style={{ border: 'none', background: '#fef2f2', color: '#dc2626', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}
                        title="Delete Account"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {filteredFaculty.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>No supervisor faculty accounts found.</div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB 4: HOD MASTER ── */}
          {activeTab === 'hod' && (
            <div className="card" style={{ background: 'white', padding: 24, borderRadius: 12, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', background: '#f1f5f9', padding: '8px 16px', borderRadius: 12, width: '100%', maxWidth: '300px' }}>
                  <Search size={16} color="#64748b" />
                  <input 
                    type="text" 
                    placeholder="Search HODs..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ border: 'none', background: 'none', outline: 'none', width: '100%', fontSize: '0.85rem' }}
                  />
                </div>
                <button 
                  onClick={() => { setUserRoleContext('HOD'); setUserForm({ name: '', username: '', password: '', department: depts[0]?.name || '', subRole: 'HOD' }); setIsUserModalOpen(true); }}
                  className="btn-primary" 
                  style={{ display: 'flex', gap: 8, alignItems: 'center', background: '#10b981' }}
                >
                  <Plus size={16} /> Add HOD
                </button>
              </div>

              <div className="file-list">
                <div className="file-header">
                  <div style={{ flex: 2.5 }}>Name / Email</div>
                  <div style={{ flex: 2 }}>Department</div>
                  <div style={{ flex: 1.5 }}>Role</div>
                  <div style={{ flex: 1.5 }}>Verification</div>
                  <div style={{ flex: 1.5 }}>Account Status</div>
                  <div style={{ flex: 2.8, textAlign: 'center' }}>Actions</div>
                </div>
                {filteredHods.map(h => (
                  <div key={h._id} className="file-item" style={{ opacity: h.isActive ? 1 : 0.65 }}>
                    <div style={{ flex: 2.5 }}>
                      <div style={{ fontWeight: 700 }}>{h.name}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{h.username}</div>
                    </div>
                    <div style={{ flex: 2, fontSize: '0.9rem', fontWeight: 600 }}>{h.department || '—'}</div>
                    <div style={{ flex: 1.5 }}>
                      <span style={{ background: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>
                        HOD
                      </span>
                    </div>
                    <div style={{ flex: 1.5 }}>
                      <span style={{ 
                        background: h.isVerified ? '#d1fae5' : '#fef3c7', 
                        color: h.isVerified ? '#065f46' : '#d97706', 
                        padding: '4px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 
                      }}>
                        {h.isVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                    <div style={{ flex: 1.5 }}>
                      <span style={{ 
                        background: h.isActive ? '#d1fae5' : '#fee2e2', 
                        color: h.isActive ? '#065f46' : '#991b1b', 
                        padding: '4px 10px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 
                      }}>
                        {h.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    <div style={{ flex: 2.8, display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
                      <button 
                        onClick={() => handleToggleActive(h._id)}
                        className="btn-outline" 
                        style={{ fontSize: '0.75rem', padding: '6px 10px', borderColor: h.isActive ? '#ef4444' : '#10b981', color: h.isActive ? '#ef4444' : '#10b981' }}
                      >
                        {h.isActive ? 'Disable' : 'Enable'}
                      </button>
                      {!h.isVerified && (
                        <button 
                          onClick={async () => {
                            try {
                              await axios.put(`${API}/auth/users/${h._id}/verify`, {}, getAuthHeader());
                              setSuccessMsg('HOD account verified successfully.');
                              fetchData();
                            } catch (err) {
                              setErrorMsg(err.response?.data?.message || 'Error verifying account.');
                            }
                          }}
                          className="btn-outline" 
                          style={{ fontSize: '0.75rem', padding: '6px 10px', borderColor: '#2563eb', color: '#2563eb' }}
                        >
                          Verify
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteUser(h._id)}
                        style={{ border: 'none', background: '#fef2f2', color: '#dc2626', padding: '6px 10px', borderRadius: 8, cursor: 'pointer' }}
                        title="Delete Account"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {filteredHods.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>No Head of Department (HOD) accounts found.</div>
                )}
              </div>
            </div>
          )}

          {/* ── TAB 5: PROFILE Tab ── */}
          {activeTab === 'profile' && <SAProfileTab uploadAvatar={uploadAvatar} />}

        </div>
      </div>

      {/* ── MODAL A: DEPARTMENT CREATE/EDIT ── */}
      {isDeptModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 32, width: '100%', maxWidth: '420px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1e293b', marginBottom: 20 }}>
              {editingDept ? 'Edit Department' : 'Create Department'}
            </h3>
            <form onSubmit={handleSaveDept} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>Department Name *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g., Computer Science"
                  value={deptForm.name} 
                  onChange={e => setDeptForm({ ...deptForm, name: e.target.value })} 
                  required 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>Short Code (Unique) *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g., CS"
                  value={deptForm.code} 
                  onChange={e => setDeptForm({ ...deptForm, code: e.target.value })} 
                  required 
                />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => setIsDeptModalOpen(false)} className="btn-outline" style={{ flex: 1, padding: 12 }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1.5, padding: 12, background: '#10b981' }}>
                  {editingDept ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL B: USER CREATE (FACULTY / HOD) ── */}
      {isUserModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 32, width: '100%', maxWidth: '460px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1e293b', marginBottom: 20 }}>
              Add {userRoleContext === 'HOD' ? 'Department HOD Admin' : 'Faculty Supervisor'}
            </h3>
            <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>Full Name *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g., Dr. Jane Smith"
                  value={userForm.name} 
                  onChange={e => setUserForm({ ...userForm, name: e.target.value })} 
                  required 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>Email / Username *</label>
                <input 
                  type="email" 
                  className="form-input" 
                  placeholder="e.g., janesmith@university.com"
                  value={userForm.username} 
                  onChange={e => setUserForm({ ...userForm, username: e.target.value })} 
                  required 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>Password *</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="••••••••"
                  value={userForm.password} 
                  onChange={e => setUserForm({ ...userForm, password: e.target.value })} 
                  required 
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>Academic Department *</label>
                <select 
                  className="form-input"
                  value={userForm.department} 
                  onChange={e => setUserForm({ ...userForm, department: e.target.value })} 
                  required
                >
                  <option value="">Select...</option>
                  {depts.map(d => (
                    <option key={d._id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              {userRoleContext === 'FACULTY' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: 6 }}>Faculty Sub-Role *</label>
                  <select 
                    className="form-input"
                    value={userForm.subRole} 
                    onChange={e => setUserForm({ ...userForm, subRole: e.target.value })} 
                    required
                  >
                    <option value="SUPERVISOR">Supervisor Only</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => setIsUserModalOpen(false)} className="btn-outline" style={{ flex: 1, padding: 12 }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1.5, padding: 12, background: '#10b981' }}>Create Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default SuperAdminDashboard;
