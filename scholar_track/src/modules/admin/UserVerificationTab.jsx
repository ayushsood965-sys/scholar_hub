import React, { useState, useEffect, useContext } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import { AuthContext } from '../../context/AuthContext';
import DataTable from '../../components/ui/DataTable';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { CheckCircle, XCircle, Trash2, Search, Users, UserCheck, ShieldAlert, GraduationCap, Briefcase } from 'lucide-react';

const UserVerificationTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('DEFAULT');
  const [pageSize, setPageSize] = useState('10');
  const [currentPage, setCurrentPage] = useState(1);
  const [hodSubTab, setHodSubTab] = useState('FACULTY'); // 'FACULTY' | 'STUDENT'
  const { user } = useContext(AuthContext);
  const api = useApi();
  const toast = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const endpoint = user?.role === 'SUPER_ADMIN' ? '/auth/all-users' : '/auth/dept-users';
      const res = await api.get(endpoint);
      const filteredUsers = res.data.filter(u => u._id !== user?._id && u.role !== 'SUPER_ADMIN');
      setUsers(filteredUsers);
    } catch (err) {
      toast.error('Failed to load user directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleVerify = async (id) => {
    try {
      await api.put(`/auth/users/${id}/verify`);
      toast.success('User account verified successfully');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error verifying user');
    }
  };

  const handleToggleActive = async (id) => {
    try {
      await api.put(`/auth/users/${id}/active`);
      toast.success('Account status updated');
      fetchUsers();
    } catch (err) {
      toast.error('Error toggling account status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this user account? This cannot be undone.')) return;
    try {
      await api.delete(`/auth/users/${id}`);
      toast.success('Account deleted successfully');
      fetchUsers();
    } catch (err) {
      toast.error('Error deleting account');
    }
  };

  // Filter logic
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.role && u.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase()));
    
    let matchesRole = true;
    if (user?.role === 'HOD') {
      if (hodSubTab === 'FACULTY') {
        matchesRole = u.role === 'FACULTY' || u.role === 'HOD';
      } else if (hodSubTab === 'STUDENT') {
        matchesRole = u.role === 'STUDENT';
      }
    } else {
      matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    }

    return matchesSearch && matchesRole;
  });

  // Sort logic
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortBy === 'NAME_ASC') return a.name.localeCompare(b.name);
    if (sortBy === 'NAME_DESC') return b.name.localeCompare(a.name);
    if (sortBy === 'UNVERIFIED_FIRST') return (a.isVerified === b.isVerified) ? 0 : a.isVerified ? 1 : -1;
    return 0;
  });

  // Pagination logic
  const numericPageSize = pageSize === 'ALL' ? sortedUsers.length : parseInt(pageSize, 10);
  const totalPages = Math.ceil(sortedUsers.length / (numericPageSize || 1)) || 1;
  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * numericPageSize,
    currentPage * numericPageSize
  );

  const facultyCount = users.filter(u => u.role === 'FACULTY' || u.role === 'HOD').length;
  const studentCount = users.filter(u => u.role === 'STUDENT').length;

  const columns = [
    {
      header: 'Name / Email',
      accessor: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.name}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-start', marginTop: '2px' }}>
            <span>{row.username}</span>
            <span style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              padding: '1px 5px',
              borderRadius: '4px',
              textTransform: 'uppercase',
              background: row.isEmailVerified ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
              color: row.isEmailVerified ? '#10B981' : '#EF4444',
              border: `1px solid ${row.isEmailVerified ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
            }}>
              {row.isEmailVerified ? 'Email Verified' : 'Email Unverified'}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Role',
      accessor: (row) => (
        <span className={`badge ${row.role === 'HOD' ? 'badge-primary' : row.role === 'STUDENT' ? 'badge-neutral' : 'badge-secondary'}`}>
          {row.role === 'HOD' ? 'HOD' : row.role === 'STUDENT' ? 'STUDENT' : row.subRole || 'FACULTY'}
        </span>
      )
    },
    {
      header: 'Department',
      accessor: (row) => row.department || '—'
    },
    {
      header: 'Verification',
      accessor: (row) => (
        <span className={`badge ${row.isVerified ? 'badge-success' : 'badge-warning'}`}>
          {row.isVerified ? 'Verified' : 'Unverified'}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: (row) => (
        <span className={`badge ${row.isActive ? 'badge-success' : 'badge-danger'}`}>
          {row.isActive ? 'Active' : 'Disabled'}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Unverified users: Show Approve button if email verified, disabled Verify ID button if email unverified */}
          {!row.isVerified && (
            <button 
              className="btn btn-sm btn-primary" 
              style={{ 
                padding: '6px 14px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '4px',
                cursor: row.isEmailVerified ? 'pointer' : 'not-allowed',
                opacity: row.isEmailVerified ? 1 : 0.6,
                background: row.isEmailVerified ? '#10B981' : '#9CA3AF',
                borderColor: row.isEmailVerified ? '#10B981' : '#9CA3AF',
                color: '#FFFFFF',
                fontWeight: 700
              }}
              onClick={() => {
                if (row.isEmailVerified === false) return;
                handleVerify(row._id);
              }}
              disabled={row.isEmailVerified === false}
              title={row.isEmailVerified ? "Approve User Account" : "Email must be verified first"}
            >
              <UserCheck size={14} /> {row.isEmailVerified ? 'Approve' : 'Verify ID'}
            </button>
          )}

          {/* Verified users: Show Disable ID / Enable ID button only */}
          {row.isVerified && (
            <button 
              className={`btn btn-sm ${row.isActive ? 'btn-outline-danger' : 'btn-outline-success'}`}
              style={{ 
                padding: '6px 12px',
                color: row.isActive ? '#EF4444' : '#10B981',
                borderColor: row.isActive ? '#EF4444' : '#10B981',
                fontWeight: 700
              }}
              onClick={() => handleToggleActive(row._id)}
            >
              {row.isActive ? 'Disable ID' : 'Enable ID'}
            </button>
          )}

          {/* Delete button: Only available at Super Admin level */}
          {user?.role === 'SUPER_ADMIN' && (
            <button 
              className="btn btn-sm btn-outline" 
              style={{ color: '#EF4444', borderColor: '#EF4444', padding: '6px' }}
              onClick={() => handleDelete(row._id)}
              title="Delete Account"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      )
    }
  ];

  if (loading) return <SkeletonLoader count={1} height={400} />;

  return (
    <div className="glass-panel p-xl">
      <div className="flex justify-between items-center mb-lg">
        <div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={24} /> {user?.role === 'HOD' ? 'Department User Management' : 'Faculty & HOD Verification'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {user?.role === 'HOD' 
              ? `Manage and approve registered faculty members and student IDs for the ${user.department || ''} department.`
              : 'Verify registered faculty and department head accounts across the institution.'}
          </p>
        </div>
      </div>

      {/* Sub-tabs for HOD Level: Faculty Members vs Department Students */}
      {user?.role === 'HOD' && (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', borderBottom: '2px solid var(--color-border, #E2E8F0)', paddingBottom: '10px' }}>
          <button
            onClick={() => { setHodSubTab('FACULTY'); setCurrentPage(1); }}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: hodSubTab === 'FACULTY' ? '#10B981' : 'transparent',
              color: hodSubTab === 'FACULTY' ? '#FFFFFF' : 'var(--text-secondary)',
              transition: 'all 0.2s ease'
            }}
          >
            <Briefcase size={18} />
            1. Faculty Members ({facultyCount})
          </button>
          <button
            onClick={() => { setHodSubTab('STUDENT'); setCurrentPage(1); }}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: hodSubTab === 'STUDENT' ? '#10B981' : 'transparent',
              color: hodSubTab === 'STUDENT' ? '#FFFFFF' : 'var(--text-secondary)',
              transition: 'all 0.2s ease'
            }}
          >
            <GraduationCap size={18} />
            2. Department Students ({studentCount})
          </button>
        </div>
      )}

      {/* Screenshot-Style Control Bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px', 
        marginBottom: '24px',
        background: '#EAF5ED',
        padding: '12px 18px',
        borderRadius: '16px',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
      }}>
        {/* Search Bar */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          background: '#FFFFFF', 
          padding: '8px 16px', 
          borderRadius: '24px', 
          border: '1px solid #CBD5E1', 
          flex: '1 1 300px',
          minWidth: '240px',
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.03)'
        }}>
          <Search size={18} color="#10B981" />
          <input 
            type="text" 
            placeholder="Search by name, email, or role..." 
            value={searchTerm} 
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            style={{ 
              border: 'none', 
              background: 'none', 
              outline: 'none', 
              width: '100%', 
              fontSize: '0.88rem',
              color: '#1E293B',
              fontWeight: 500
            }}
          />
        </div>

        {/* Control Selectors */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Role Filter Element */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>Role:</span>
            <select 
              value={roleFilter} 
              onChange={e => { setRoleFilter(e.target.value); setCurrentPage(1); }}
              style={{
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '12px',
                padding: '6px 14px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#1E293B',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="ALL">All Roles</option>
              <option value="FACULTY">Faculty</option>
              <option value="STUDENT">Student</option>
              {user?.role === 'SUPER_ADMIN' && <option value="HOD">HOD</option>}
            </select>
          </div>

          {/* Sort Element */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>Sort:</span>
            <select 
              value={sortBy} 
              onChange={e => setSortBy(e.target.value)}
              style={{
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '12px',
                padding: '6px 14px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#1E293B',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="DEFAULT">Default Order</option>
              <option value="NAME_ASC">Name (A to Z)</option>
              <option value="NAME_DESC">Name (Z to A)</option>
              <option value="UNVERIFIED_FIRST">Pending Verification First</option>
            </select>
          </div>

          {/* Show Rows Element */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>Show:</span>
            <select 
              value={pageSize} 
              onChange={e => { setPageSize(e.target.value); setCurrentPage(1); }}
              style={{
                background: '#FFFFFF',
                border: '1px solid #CBD5E1',
                borderRadius: '12px',
                padding: '6px 14px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#1E293B',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="10">10 rows</option>
              <option value="20">20 rows</option>
              <option value="30">30 rows</option>
              <option value="50">50 rows</option>
              <option value="ALL">All rows</option>
            </select>
          </div>
        </div>
      </div>

      <DataTable columns={columns} data={paginatedUsers} />

      {/* Pagination Controls */}
      {pageSize !== 'ALL' && totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', padding: '12px 16px', background: 'rgba(0,0,0,0.02)', borderRadius: '10px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Showing {((currentPage - 1) * numericPageSize) + 1} to {Math.min(currentPage * numericPageSize, sortedUsers.length)} of {sortedUsers.length} users
          </span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="btn btn-sm btn-outline"
              style={{ cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
            >
              ◀ Prev
            </button>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Page {currentPage} of {totalPages}</span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="btn btn-sm btn-outline"
              style={{ cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
            >
              Next ▶
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserVerificationTab;
