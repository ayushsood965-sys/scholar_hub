import React, { useContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import { AuthContext } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ShieldCheck, ShieldAlert, Mail, Phone, Building, User, Key, RefreshCw, Camera } from 'lucide-react';

const StaffProfileTab = () => {
  const { user, updateProfile, uploadAvatar, fetchMe } = useContext(AuthContext);
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(user?.profile?.phoneNumber || '');
  const [email, setEmail] = useState(user?.profile?.email || '');

  useEffect(() => {
    if (user?.profile) {
      setPhoneNumber(user.profile.phoneNumber || '');
      setEmail(user.profile.email || '');
    }
  }, [user]);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setLoading(true);
      await uploadAvatar(file);
      toast.success('Profile picture updated successfully');
    } catch (err) {
      toast.error('Failed to upload profile picture');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (phoneNumber) {
      const cleanedPhone = phoneNumber.trim().replace(/[\s\-()]/g, '');
      const indianPhoneRegex = /^(\+91|91|0)?[6-9]\d{9}$/;
      if (!indianPhoneRegex.test(cleanedPhone)) {
        toast.error('Please enter a valid 10-digit Indian phone number.');
        return;
      }
    }

    try {
      setLoading(true);
      await updateProfile({ phoneNumber, email });
      toast.success('Profile contact details updated successfully');
    } catch (err) {
      toast.error('Failed to update profile details');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    try {
      setCheckingStatus(true);
      await fetchMe();
      toast.success('Profile status refreshed');
    } catch (err) {
      toast.error('Failed to sync profile status');
    } finally {
      setCheckingStatus(false);
    }
  };

  return (
    <div className="glass-transparent p-xl" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="flex justify-between items-center mb-lg">
        <div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>My Profile</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage your account settings and credentials.</p>
        </div>
      </div>

      {/* Verification warning banner */}
      {!user?.isVerified && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderLeft: '4px solid var(--status-late)',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <ShieldAlert style={{ color: 'var(--status-late)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: 'var(--status-late)', display: 'block', fontSize: '0.95rem', marginBottom: '4px' }}>
                Account Awaiting Verification
              </strong>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                Your account is currently unverified. Access to dashboard options will remain locked until approved by the {user?.role === 'HOD' ? 'Super Admin' : 'Head of Department'}.
              </p>
            </div>
          </div>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={handleCheckStatus}
            disabled={checkingStatus}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={checkingStatus ? 'spin-animation' : ''} /> Check Status
          </button>
        </div>
      )}

      {user?.isVerified && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderLeft: '4px solid var(--status-present)',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <ShieldCheck style={{ color: 'var(--status-present)' }} />
          <div>
            <strong style={{ color: 'var(--status-present)', display: 'block', fontSize: '0.95rem' }}>
              Account Verified & Approved
            </strong>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px', marginTop: '16px' }}>
        {/* Left column: Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ position: 'relative', width: '120px', height: '120px', marginBottom: '16px' }}>
            {user?.avatarUrl ? (
              <img 
                src={`${API_BASE_URL}${user.avatarUrl}`} 
                alt="Avatar" 
                style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-primary)' }} 
              />
            ) : (
              <div style={{ 
                width: '120px', 
                height: '120px', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, var(--color-success-light), var(--color-success))', 
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3rem',
                fontWeight: 700,
                border: '3px solid var(--color-primary)'
              }}>
                {user?.name?.[0]?.toUpperCase()}
              </div>
            )}
            <label style={{
              position: 'absolute',
              bottom: '4px',
              right: '4px',
              background: 'var(--color-primary)',
              color: 'white',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: 'var(--shadow)',
              border: '2px solid var(--color-surface)'
            }}>
              <Camera size={16} />
              <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} disabled={loading} />
            </label>
          </div>
          
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>{user?.name}</h3>
          <span className="badge badge-neutral" style={{ textTransform: 'uppercase' }}>
            {user?.role === 'HOD' ? 'HOD' : user?.subRole || 'Faculty'}
          </span>
        </div>

        {/* Right column: Info & Edit form */}
        <div>
          <form onSubmit={handleUpdate}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <div className="form-input" style={{ background: 'var(--color-surface-elevated)', opacity: 0.8, cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={16} /> {user?.name}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Username / Login ID</label>
                <div className="form-input" style={{ background: 'var(--color-surface-elevated)', opacity: 0.8, cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={16} /> {user?.username}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div className="form-group">
                <label className="form-label">Department</label>
                <div className="form-input" style={{ background: 'var(--color-surface-elevated)', opacity: 0.8, cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building size={16} /> {user?.department || '—'}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">System Role</label>
                <div className="form-input" style={{ background: 'var(--color-surface-elevated)', opacity: 0.8, cursor: 'not-allowed', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Key size={16} /> {user?.role === 'HOD' ? 'Department Head' : 'Faculty Supervisor'}
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border-solid)', pt: '16px', marginTop: '24px', paddingTop: '16px' }}>
              <h4 style={{ color: 'var(--text-primary)', marginBottom: '16px', fontSize: '0.95rem' }}>Contact Details (Editable)</h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Contact Phone</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Enter Indian phone number"
                    value={phoneNumber} 
                    onChange={e => setPhoneNumber(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Personal Email</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="Enter contact email address"
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-lg">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Contact Details'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StaffProfileTab;
