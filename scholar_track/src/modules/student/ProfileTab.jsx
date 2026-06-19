import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { AuthContext } from '../../context/AuthContext';

const ProfileTab = () => {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});

  const api = useApi();
  const toast = useToast();

  const fetchProfile = async () => {
    try {
      const res = await api.get('/auth/me');
      setProfile(res.data);
      setFormData({
        enrollmentNumber: res.data.profile?.enrollmentNumber || '',
        semesterId: res.data.profile?.semesterId?._id || '',
        degreeNameId: res.data.profile?.degreeNameId?._id || '',
        degreeTypeId: res.data.profile?.degreeTypeId?._id || '',
        isPhD: res.data.profile?.isPhD || false,
      });
    } catch (err) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const [semesters, setSemesters] = useState([]);
  const [degreeNames, setDegreeNames] = useState([]);
  const [degreeTypes, setDegreeTypes] = useState([]);

  useEffect(() => {
    if (isEditing) {
      const fetchMasters = async () => {
        const [sRes, dnRes, dtRes] = await Promise.all([
          api.get('/attendance/masters/semesters'),
          api.get('/attendance/masters/degree-names'),
          api.get('/attendance/masters/degree-types')
        ]);
        setSemesters(sRes.data);
        setDegreeNames(dnRes.data);
        setDegreeTypes(dtRes.data);
      };
      fetchMasters();
    }
  }, [isEditing, api]);

  const handleSave = async () => {
    try {
      await api.put('/auth/profile', { profile: formData });
      toast.success('Profile updated');
      setIsEditing(false);
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error updating profile');
    }
  };

  if (loading) return <SkeletonLoader count={1} height={400} />;

  const availableDegreeNames = degreeNames.filter(d => d.degreeTypeId?._id === formData.degreeTypeId);

  return (
    <div className="glass-panel p-xl">
      <div className="flex justify-between items-center mb-lg">
        <div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>My Profile</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage your academic details.</p>
        </div>
        {!isEditing ? (
          <button className="btn btn-outline" onClick={() => setIsEditing(true)}>Edit Profile</button>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>Save</button>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input className="form-input" disabled value={profile?.name || ''} />
        </div>
        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input className="form-input" disabled value={profile?.email || ''} />
        </div>
        
        <div className="form-group">
          <label className="form-label">Enrollment Number</label>
          <input 
            className="form-input" 
            disabled={!isEditing} 
            value={isEditing ? formData.enrollmentNumber : (profile?.profile?.enrollmentNumber || 'N/A')}
            onChange={e => setFormData({...formData, enrollmentNumber: e.target.value})}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Is PhD Scholar?</label>
          <select 
            className="form-input" 
            disabled={!isEditing} 
            value={isEditing ? formData.isPhD.toString() : (profile?.profile?.isPhD ? 'true' : 'false')}
            onChange={e => setFormData({...formData, isPhD: e.target.value === 'true'})}
          >
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
        </div>

        {!formData.isPhD && (
          <>
            <div className="form-group">
              <label className="form-label">Degree Type</label>
              {isEditing ? (
                <select className="form-input" value={formData.degreeTypeId} onChange={e => setFormData({...formData, degreeTypeId: e.target.value, degreeNameId: ''})}>
                  <option value="">Select Type...</option>
                  {degreeTypes.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              ) : (
                <input className="form-input" disabled value={profile?.profile?.degreeTypeId?.name || 'N/A'} />
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Degree Name</label>
              {isEditing ? (
                <select className="form-input" value={formData.degreeNameId} onChange={e => setFormData({...formData, degreeNameId: e.target.value})} disabled={!formData.degreeTypeId}>
                  <option value="">Select Degree...</option>
                  {availableDegreeNames.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              ) : (
                <input className="form-input" disabled value={profile?.profile?.degreeNameId?.name || 'N/A'} />
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Current Semester</label>
              {isEditing ? (
                <select className="form-input" value={formData.semesterId} onChange={e => setFormData({...formData, semesterId: e.target.value})}>
                  <option value="">Select Semester...</option>
                  {semesters.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              ) : (
                <input className="form-input" disabled value={profile?.profile?.semesterId?.name || 'N/A'} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfileTab;
