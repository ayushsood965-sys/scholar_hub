import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { CheckCircle, XCircle, Trash2, Search, Users, UserCheck, ShieldAlert } from 'lucide-react';

const UserVerificationTab = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL'); // ALL | HOD | FACULTY
  const [verificationFilter, setVerificationFilter] = useState('ALL'); // ALL | VERIFIED | UNVERIFIED
  const api = useApi();
  const toast = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/all-users');
      // Filter out students and super admins
      const staffUsers = res.data.filter(u => ['HOD', 'FACULTY'].includes(u.role));
      setUsers(staffUsers);
    } catch (err) {
      toast.error('Failed to load university staff directory');
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
      (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    
    const matchesVerification = 
      verificationFilter === 'ALL' ||
      (verificationFilter === 'VERIFIED' && u.isVerified) ||
      (verificationFilter === 'UNVERIFIED' && !u.isVerified);

    return matchesSearch && matchesRole && matchesVerification;
  });

  const columns = [
    {
      header: 'Name / Email',
      accessor: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.name}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{row.username}</div>
        </div>
      )
    },
    {
      header: 'Role',
      accessor: (row) => (
        <span className={`badge ${row.role === 'HOD' ? 'badge-primary' : 'badge-secondary'}`}>
          {row.role === 'HOD' ? 'HOD' : row.subRole || 'FACULTY'}
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
        <div style={{ display: 'flex', gap: '8px' }}>
          {!row.isVerified && (
            <button 
              className="btn btn-sm btn-primary" 
              style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => handleVerify(row._id)}
            >
              <UserCheck size={14} /> Verify
            </button>
          )}
          <button 
            className={`btn btn-sm ${row.isActive ? 'btn-outline-danger' : 'btn-outline-success'}`}
            style={{ 
              padding: '6px 12px',
              color: row.isActive ? '#EF4444' : '#10B981',
              borderColor: row.isActive ? '#EF4444' : '#10B981'
            }}
            onClick={() => handleToggleActive(row._id)}
          >
            {row.isActive ? 'Disable' : 'Enable'}
          </button>
          <button 
            className="btn btn-sm btn-outline" 
            style={{ color: '#EF4444', borderColor: '#EF4444', padding: '6px' }}
            onClick={() => handleDelete(row._id)}
          >
            <Trash2 size={16} />
          </button>
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
            <Users size={24} /> Faculty & HOD Verification
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Verify registered faculty and department head accounts to unlock their access levels.
          </p>
        </div>
      </div>

      {/* Filters bar */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '2fr 1fr 1fr', 
        gap: '16px', 
        marginBottom: '24px',
        background: 'rgba(255,255,255,0.02)',
        padding: '16px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: 'var(--bg-input)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <Search size={18} color="var(--text-secondary)" />
          <input 
            type="text" 
            placeholder="Search by name, email, or department..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)}
            style={{ border: 'none', background: 'none', outline: 'none', width: '100%', color: 'var(--text-primary)' }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <select className="form-input" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ height: '100%' }}>
            <option value="ALL">All Roles</option>
            <option value="HOD">HODs Only</option>
            <option value="FACULTY">Faculties Only</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <select className="form-input" value={verificationFilter} onChange={e => setVerificationFilter(e.target.value)} style={{ height: '100%' }}>
            <option value="ALL">All Verification</option>
            <option value="UNVERIFIED">Pending Verification</option>
            <option value="VERIFIED">Verified Only</option>
          </select>
        </div>
      </div>

      <DataTable columns={columns} data={filteredUsers} />
    </div>
  );
};

export default UserVerificationTab;
