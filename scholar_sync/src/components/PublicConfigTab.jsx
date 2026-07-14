import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL, API_BASE_URL } from '../config';
import { useToast } from '../context/ToastContext';
import { Plus, Edit2, Trash2, Check, RefreshCw, Mail, Calendar, Coins, Users, Search, BookOpen, Megaphone } from 'lucide-react';

const PublicConfigTab = ({ user }) => {
  const toast = useToast();
  const [subTab, setSubTab] = useState('labs');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Data lists
  const [labs, setLabs] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [funding, setFunding] = useState([]);
  const [events, setEvents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [collabCalls, setCollabCalls] = useState([]);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Forms state
  const [labForm, setLabForm] = useState({ name: '', department: user?.department || '', leadId: '', focus: '', projects: '', status: 'Actively Recruiting Scholars' });
  const [fundingForm, setFundingForm] = useState({ title: '', agency: '', amount: '', duration: '', scope: '', status: 'Applications Open' });
  const [eventForm, setEventForm] = useState({ title: '', date: '', time: '', location: '', speaker: '', type: 'Seminar' });
  const [projectForm, setProjectForm] = useState({ title: '', department: user?.department || '', abstract: '', scholarName: '', supervisorName: '', status: 'ACTIVE_RESEARCH', imageUrl: '' });
  const [collabCallForm, setCollabCallForm] = useState({ title: '', description: '', type: 'Industry Partner', department: user?.department || '', status: 'Active' });
  const [inquiryRemark, setInquiryRemark] = useState({ id: '', status: '', remarks: '' });
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  // Loaders
  const loadLabs = async () => {
    try {
      const res = await axios.get(`${API_URL}/public/labs`);
      setLabs(res.data);
    } catch (err) {
      toast.error('Failed to load research labs');
    }
  };

  const loadFaculty = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/faculty`, getAuthHeader());
      // Filter by HOD department if roles are restricted, or show all
      const deptFaculty = user?.role === 'ADMIN' ? res.data : res.data.filter(f => f.department === user?.department);
      setFaculty(deptFaculty);
    } catch (err) {
      toast.error('Failed to load faculty list');
    }
  };

  const loadInquiries = async () => {
    try {
      const res = await axios.get(`${API_URL}/config/inquiries`, getAuthHeader());
      setInquiries(res.data);
    } catch (err) {
      toast.error('Failed to load collaboration inquiries');
    }
  };

  const loadFunding = async () => {
    try {
      const res = await axios.get(`${API_URL}/public/funding`);
      setFunding(res.data);
    } catch (err) {
      toast.error('Failed to load funding opportunities');
    }
  };

  const loadEvents = async () => {
    try {
      const res = await axios.get(`${API_URL}/public/events`);
      // Keep only custom events, filter out defense vivas which are automatic
      setEvents(res.data.filter(e => e.type !== 'Defense Viva'));
    } catch (err) {
      toast.error('Failed to load scheduled events');
    }
  };

  const loadProjects = async () => {
    try {
      const res = await axios.get(`${API_URL}/public/projects`);
      setProjects(res.data);
    } catch (err) {
      toast.error('Failed to load doctoral projects');
    }
  };

  const loadCollabCalls = async () => {
    try {
      const res = await axios.get(`${API_URL}/public/collab-calls`);
      setCollabCalls(res.data);
    } catch (err) {
      toast.error('Failed to load collaboration calls');
    }
  };

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadLabs(), loadFaculty(), loadInquiries(), loadFunding(), loadEvents(), loadProjects(), loadCollabCalls()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (editingId) {
        await axios.put(`${API_URL}/config/projects/${editingId}`, projectForm, getAuthHeader());
        toast.success('Doctoral project updated');
      } else {
        await axios.post(`${API_URL}/config/projects`, projectForm, getAuthHeader());
        toast.success('Doctoral project created');
      }
      setIsModalOpen(false);
      loadProjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleProjectDelete = async (id) => {
    if (!window.confirm('Delete this doctoral project?')) return;
    try {
      await axios.delete(`${API_URL}/config/projects/${id}`, getAuthHeader());
      toast.success('Doctoral project deleted');
      loadProjects();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handleCollabCallSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (editingId) {
        await axios.put(`${API_URL}/config/collab-calls/${editingId}`, collabCallForm, getAuthHeader());
        toast.success('Collaboration call updated');
      } else {
        await axios.post(`${API_URL}/config/collab-calls`, collabCallForm, getAuthHeader());
        toast.success('Collaboration call created');
      }
      setIsModalOpen(false);
      loadCollabCalls();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCollabCallDelete = async (id) => {
    if (!window.confirm('Delete this collaboration call?')) return;
    try {
      await axios.delete(`${API_URL}/config/collab-calls/${id}`, getAuthHeader());
      toast.success('Collaboration call deleted');
      loadCollabCalls();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  // Form Handlers
  const handleLabSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        ...labForm,
        projects: labForm.projects.split(',').map(p => p.trim()).filter(Boolean)
      };

      if (editingId) {
        await axios.put(`${API_URL}/config/labs/${editingId}`, payload, getAuthHeader());
        toast.success('Research Lab updated successfully');
      } else {
        await axios.post(`${API_URL}/config/labs`, payload, getAuthHeader());
        toast.success('Research Lab created successfully');
      }
      setIsModalOpen(false);
      loadLabs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLabDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lab?')) return;
    try {
      await axios.delete(`${API_URL}/config/labs/${id}`, getAuthHeader());
      toast.success('Research Lab deleted');
      loadLabs();
    } catch (err) {
      toast.error('Failed to delete lab');
    }
  };

  const handleFundingSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (editingId) {
        await axios.put(`${API_URL}/config/funding/${editingId}`, fundingForm, getAuthHeader());
        toast.success('Funding opportunity updated');
      } else {
        await axios.post(`${API_URL}/config/funding`, fundingForm, getAuthHeader());
        toast.success('Funding opportunity created');
      }
      setIsModalOpen(false);
      loadFunding();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFundingDelete = async (id) => {
    if (!window.confirm('Delete this funding opportunity?')) return;
    try {
      await axios.delete(`${API_URL}/config/funding/${id}`, getAuthHeader());
      toast.success('Opportunity deleted');
      loadFunding();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handleEventSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (editingId) {
        await axios.put(`${API_URL}/config/events/${editingId}`, eventForm, getAuthHeader());
        toast.success('Event updated successfully');
      } else {
        await axios.post(`${API_URL}/config/events`, eventForm, getAuthHeader());
        toast.success('Event created successfully');
      }
      setIsModalOpen(false);
      loadEvents();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEventDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    try {
      await axios.delete(`${API_URL}/config/events/${id}`, getAuthHeader());
      toast.success('Event deleted');
      loadEvents();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await axios.put(`${API_URL}/config/inquiries/${inquiryRemark.id}`, {
        status: inquiryRemark.status,
        remarks: inquiryRemark.remarks
      }, getAuthHeader());
      toast.success('Inquiry feedback recorded');
      setIsInquiryModalOpen(false);
      loadInquiries();
    } catch (err) {
      toast.error('Failed to update inquiry status');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (type, item) => {
    setEditingId(item._id);
    if (type === 'lab') {
      setLabForm({
        name: item.name,
        department: item.department,
        leadId: item.leadId?._id || item.leadId || '',
        focus: item.focus,
        projects: item.projects?.join(', ') || '',
        status: item.status
      });
    } else if (type === 'funding') {
      setFundingForm({
        title: item.title,
        agency: item.agency,
        amount: item.amount,
        duration: item.duration,
        scope: item.scope,
        status: item.status
      });
    } else if (type === 'event') {
      // format date YYYY-MM-DD
      const formattedDate = item.date ? new Date(item.date).toISOString().split('T')[0] : '';
      setEventForm({
        title: item.title,
        date: formattedDate,
        time: item.time,
        location: item.location,
        speaker: item.speaker,
        type: item.type
      });
    } else if (type === 'project') {
      setProjectForm({
        title: item.title,
        department: item.department,
        abstract: item.abstract,
        scholarName: item.scholarName,
        supervisorName: item.supervisorName,
        status: item.status,
        imageUrl: item.imageUrl || ''
      });
    } else if (type === 'collab_call') {
      setCollabCallForm({
        title: item.title,
        description: item.description,
        type: item.type,
        department: item.department,
        status: item.status
      });
    }
    setIsModalOpen(true);
  };

  const openCreateModal = (type) => {
    setEditingId(null);
    if (type === 'labs') {
      setLabForm({ name: '', department: user?.department || '', leadId: '', focus: '', projects: '', status: 'Actively Recruiting Scholars' });
    } else if (type === 'funding') {
      setFundingForm({ title: '', agency: '', amount: '', duration: '', scope: '', status: 'Applications Open' });
    } else if (type === 'events') {
      setEventForm({ title: '', date: '', time: '', location: '', speaker: '', type: 'Seminar' });
    } else if (type === 'projects') {
      setProjectForm({ title: '', department: user?.department || '', abstract: '', scholarName: '', supervisorName: '', status: 'ACTIVE_RESEARCH', imageUrl: '' });
    } else if (type === 'collab_calls') {
      setCollabCallForm({ title: '', description: '', type: 'Industry Partner', department: user?.department || '', status: 'Active' });
    }
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="premium-preloader-container" style={{ padding: '80px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="premium-preloader-spinner"></div>
        <div className="premium-preloader-text">Loading Portal Config Panel...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Configuration Sub Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
        {[
          { key: 'labs', label: 'Research Labs', icon: Users },
          { key: 'inquiries', label: 'Collaboration Inquiries', icon: Mail },
          { key: 'funding', label: 'Funding & Grants', icon: Coins },
          { key: 'events', label: 'Academic Events', icon: Calendar },
          { key: 'projects', label: 'Doctoral Projects', icon: BookOpen },
          { key: 'collab_calls', label: 'Collaboration Calls', icon: Megaphone }
        ].map(tab => {
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setSubTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                border: 'none',
                background: subTab === tab.key ? '#10B981' : 'transparent',
                color: subTab === tab.key ? 'white' : '#64748B',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <TabIcon size={18} />
              {tab.label}
              {tab.key === 'inquiries' && inquiries.filter(i => i.status === 'PENDING').length > 0 && (
                <span style={{ fontSize: '0.7rem', background: '#EF4444', color: 'white', borderRadius: '50%', width: '18px', height: '18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {inquiries.filter(i => i.status === 'PENDING').length}
                </span>
              )}
            </button>
          );
        })}
        
        <button onClick={loadAll} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Dynamic Sub-tab views */}
      <div className="card" style={{ padding: '24px', background: 'var(--color-surface)' }}>
        
        {/* ================================================= */}
        {/* RESEARCH LABS VIEW */}
        {/* ================================================= */}
        {subTab === 'labs' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 className="card-title" style={{ margin: 0 }}>Departmental Research Labs</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0' }}>Manage custom research groups, guides, and recruiting updates in your department.</p>
              </div>
              <button onClick={() => openCreateModal('labs')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                <Plus size={16} /> Add Research Lab
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {labs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>No research labs registered yet. Click "Add Research Lab" to create one.</div>
              ) : (
                labs.map(lab => (
                  <div key={lab._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--color-border)', borderRadius: '12px', background: 'var(--color-bg)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h4 style={{ margin: 0, fontWeight: 700, color: '#1E293B' }}>{lab.name}</h4>
                        <span style={{ fontSize: '0.68rem', background: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>{lab.status}</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0' }}>
                        <strong>PI Lead:</strong> {lab.leadId?.name || 'Faculty Lead'} | <strong>Department:</strong> {lab.department}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}><strong>Focus:</strong> {lab.focus}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => openEditModal('lab', lab)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1', background: 'var(--color-surface)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => handleLabDelete(lab._id)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #FCA5A5', background: 'var(--color-surface)', color: '#EF4444', cursor: 'pointer' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* COLLABORATION INQUIRIES VIEW */}
        {/* ================================================= */}
        {subTab === 'inquiries' && (
          <div>
            <h3 className="card-title" style={{ marginTop: 0, marginBottom: '4px' }}>Partner Collaboration Desk</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0 0 20px' }}>Review proposal inquiries sent from the public website by external organizations or researchers.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {inquiries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>No inquiries submitted yet.</div>
              ) : (
                inquiries.map(inq => (
                  <div key={inq._id} style={{ padding: '20px', border: '1px solid var(--color-border)', borderRadius: '12px', background: 'var(--color-bg)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <h4 style={{ margin: 0, fontWeight: 700, color: '#1E293B' }}>{inq.project}</h4>
                        <span style={{ fontSize: '0.78rem', color: '#64748B' }}>
                          Submitted by: <strong>{inq.name}</strong> ({inq.institution}) | email: {inq.email}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ 
                          fontSize: '0.7rem', 
                          background: inq.status === 'PENDING' ? '#FEF3C7' : inq.status === 'REVIEWED' ? '#DBEAFE' : '#D1FAE5',
                          color: inq.status === 'PENDING' ? '#D97706' : inq.status === 'REVIEWED' ? '#1E40AF' : '#065F46',
                          padding: '3px 10px', 
                          borderRadius: '12px', 
                          fontWeight: 700 
                        }}>
                          {inq.status}
                        </span>
                        <button 
                          onClick={() => {
                            setInquiryRemark({ id: inq._id, status: inq.status, remarks: inq.remarks || '' });
                            setIsInquiryModalOpen(true);
                          }}
                          className="btn-outline-small"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          Feedback
                        </button>
                      </div>
                    </div>
                    <div style={{ background: 'var(--color-surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                      {inq.details}
                    </div>
                    {inq.remarks && (
                      <div style={{ marginTop: '10px', fontSize: '0.78rem', color: '#059669', fontStyle: 'italic' }}>
                        <strong>Office Note:</strong> {inq.remarks}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* FUNDING OPPORTUNITIES VIEW */}
        {/* ================================================= */}
        {subTab === 'funding' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 className="card-title" style={{ margin: 0 }}>Research Grants & Fellowships</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0' }}>Define active grants, corporate scholarships, or state-funded opportunities for scholars.</p>
              </div>
              <button onClick={() => openCreateModal('funding')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                <Plus size={16} /> Create Opportunity
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {funding.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>No grants listed. Click "Create Opportunity" to add one.</div>
              ) : (
                funding.map(grant => (
                  <div key={grant._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--color-border)', borderRadius: '12px', background: 'var(--color-bg)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h4 style={{ margin: 0, fontWeight: 700, color: '#1E293B' }}>{grant.title}</h4>
                        <span style={{ fontSize: '0.68rem', background: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>{grant.status}</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0' }}>
                        <strong>Agency:</strong> {grant.agency} | <strong>Amount:</strong> {grant.amount} | <strong>Duration:</strong> {grant.duration}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => openEditModal('funding', grant)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1', background: 'var(--color-surface)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => handleFundingDelete(grant._id)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #FCA5A5', background: 'var(--color-surface)', color: '#EF4444', cursor: 'pointer' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* ACADEMIC EVENTS VIEW */}
        {/* ================================================= */}
        {subTab === 'events' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 className="card-title" style={{ margin: 0 }}>University Seminars & Conferences</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0' }}>Schedule workshops, keynote panels, and symposia. Defense Viva events are automatically added based on the milestones pipeline.</p>
              </div>
              <button onClick={() => openCreateModal('events')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                <Plus size={16} /> Schedule Event
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {events.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>No scheduled events. Click "Schedule Event" to add one.</div>
              ) : (
                events.map(evt => (
                  <div key={evt._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--color-border)', borderRadius: '12px', background: 'var(--color-bg)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h4 style={{ margin: 0, fontWeight: 700, color: '#1E293B' }}>{evt.title}</h4>
                        <span style={{ fontSize: '0.68rem', background: '#DBEAFE', color: '#1E40AF', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>{evt.type}</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0' }}>
                        📅 {new Date(evt.date).toLocaleDateString()} | 🕒 {evt.time} | 📍 {evt.location}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>👤 <strong>Speaker:</strong> {evt.speaker}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => openEditModal('event', evt)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1', background: 'var(--color-surface)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => handleEventDelete(evt._id)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #FCA5A5', background: 'var(--color-surface)', color: '#EF4444', cursor: 'pointer' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* DOCTORAL PROJECTS VIEW */}
        {/* ================================================= */}
        {subTab === 'projects' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 className="card-title" style={{ margin: 0 }}>Featured Doctoral Projects</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0' }}>Manage featured Ph.D. projects/theses shown on the landing page.</p>
              </div>
              <button onClick={() => openCreateModal('projects')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                <Plus size={16} /> Add Doctoral Project
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {projects.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>No doctoral projects registered yet. Click "Add Doctoral Project" to create one.</div>
              ) : (
                projects.map(proj => (
                  <div key={proj._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--color-border)', borderRadius: '12px', background: 'var(--color-bg)' }}>
                    <div style={{ flex: 1, marginRight: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <h4 style={{ margin: 0, fontWeight: 700, color: '#1E293B' }}>{proj.title}</h4>
                        <span style={{ fontSize: '0.68rem', background: '#FEF3C7', color: '#D97706', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>{proj.status ? proj.status.replace('_', ' ') : 'ACTIVE'}</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0' }}>
                        <strong>Scholar:</strong> {proj.scholarName} | <strong>Supervisor:</strong> {proj.supervisorName} | <strong>Department:</strong> {proj.department}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '4px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        <strong>Abstract:</strong> {proj.abstract}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                      <button onClick={() => openEditModal('project', proj)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1', background: 'var(--color-surface)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => handleProjectDelete(proj._id)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #FCA5A5', background: 'var(--color-surface)', color: '#EF4444', cursor: 'pointer' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* COLLABORATION CALLS VIEW */}
        {/* ================================================= */}
        {subTab === 'collab_calls' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 className="card-title" style={{ margin: 0 }}>Active Collaboration Calls</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0' }}>Manage active industry mentor calls and inter-departmental initiatives displayed on the public Collaborate page.</p>
              </div>
              <button onClick={() => openCreateModal('collab_calls')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                <Plus size={16} /> Add Collaboration Call
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {collabCalls.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>No collaboration calls registered yet. Click "Add Collaboration Call" to create one.</div>
              ) : (
                collabCalls.map(call => (
                  <div key={call._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--color-border)', borderRadius: '12px', background: 'var(--color-bg)' }}>
                    <div style={{ flex: 1, marginRight: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <h4 style={{ margin: 0, fontWeight: 700, color: '#1E293B' }}>{call.title}</h4>
                        <span style={{ fontSize: '0.68rem', background: '#EAF4EE', color: '#065F46', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>{call.type}</span>
                        <span style={{ fontSize: '0.68rem', background: call.status === 'Active' ? '#D1FAE5' : '#FEE2E2', color: call.status === 'Active' ? '#065F46' : '#991B1B', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>{call.status}</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0' }}>
                        <strong>Department:</strong> {call.department}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                        {call.description}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
                      <button onClick={() => openEditModal('collab_call', call)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1', background: 'var(--color-surface)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => handleCollabCallDelete(call._id)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #FCA5A5', background: 'var(--color-surface)', color: '#EF4444', cursor: 'pointer' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>

      {/* ================================================= */}
      {/* STANDARD CRUD FORM MODAL */}
      {/* ================================================= */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '520px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '18px', fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {editingId ? 'Edit Record' : 'Create New Record'}
            </h3>
            
            {/* Labs Form */}
            {subTab === 'labs' && (
              <form onSubmit={handleLabSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Lab Name</label>
                  <input type="text" required className="form-input" value={labForm.name} onChange={e => setLabForm({...labForm, name: e.target.value})} />
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Department</label>
                  <input type="text" disabled className="form-input" value={labForm.department} style={{ background: 'var(--color-bg)' }} />
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Lead Supervisor</label>
                  <select required className="form-input" value={labForm.leadId} onChange={e => setLabForm({...labForm, leadId: e.target.value})}>
                    <option value="">Select...</option>
                    {faculty.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Research Focus Area</label>
                  <input type="text" required className="form-input" value={labForm.focus} onChange={e => setLabForm({...labForm, focus: e.target.value})} />
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Active Projects (comma separated)</label>
                  <input type="text" className="form-input" placeholder="e.g. Deep Reinforcement Swarms, Image Passing" value={labForm.projects} onChange={e => setLabForm({...labForm, projects: e.target.value})} />
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Recruiting Status</label>
                  <select className="form-input" value={labForm.status} onChange={e => setLabForm({...labForm, status: e.target.value})}>
                    <option value="Actively Recruiting Scholars">Actively Recruiting Scholars</option>
                    <option value="2 Research Slots Open">2 Research Slots Open</option>
                    <option value="Research Slots Filled">Research Slots Filled</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-outline" style={{ flex: 1 }}>Cancel</button>
                  <button type="submit" disabled={actionLoading} className="btn-primary" style={{ flex: 1.5 }}>
                    {actionLoading ? 'Saving...' : 'Save Lab Details'}
                  </button>
                </div>
              </form>
            )}

            {/* Funding Form */}
            {subTab === 'funding' && (
              <form onSubmit={handleFundingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Grant/Fellowship Title</label>
                  <input type="text" required className="form-input" value={fundingForm.title} onChange={e => setFundingForm({...fundingForm, title: e.target.value})} />
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Funding Agency</label>
                  <input type="text" required className="form-input" value={fundingForm.agency} onChange={e => setFundingForm({...fundingForm, agency: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Amount Pool</label>
                    <input type="text" required className="form-input" placeholder="e.g. ₹25,00,000" value={fundingForm.amount} onChange={e => setFundingForm({...fundingForm, amount: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Duration</label>
                    <input type="text" required className="form-input" placeholder="e.g. 3 Years" value={fundingForm.duration} onChange={e => setFundingForm({...fundingForm, duration: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Detailed Scope/Criteria</label>
                  <textarea rows={4} required className="form-input" style={{ resize: 'none', fontFamily: 'inherit' }} value={fundingForm.scope} onChange={e => setFundingForm({...fundingForm, scope: e.target.value})} />
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Status</label>
                  <select className="form-input" value={fundingForm.status} onChange={e => setFundingForm({...fundingForm, status: e.target.value})}>
                    <option value="Applications Open">Applications Open</option>
                    <option value="Actively Reviewing">Actively Reviewing</option>
                    <option value="Call Closed">Call Closed</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-outline" style={{ flex: 1 }}>Cancel</button>
                  <button type="submit" disabled={actionLoading} className="btn-primary" style={{ flex: 1.5 }}>
                    {actionLoading ? 'Saving...' : 'Save Opportunity'}
                  </button>
                </div>
              </form>
            )}

            {/* Event Form */}
            {subTab === 'events' && (
              <form onSubmit={handleEventSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Event Title</label>
                  <input type="text" required className="form-input" value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Date</label>
                    <input type="date" required className="form-input" value={eventForm.date} onChange={e => setEventForm({...eventForm, date: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Time Range</label>
                    <input type="text" required className="form-input" placeholder="e.g. 10:00 AM - 01:00 PM" value={eventForm.time} onChange={e => setEventForm({...eventForm, time: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Venue Location</label>
                  <input type="text" required className="form-input" value={eventForm.location} onChange={e => setEventForm({...eventForm, location: e.target.value})} />
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Keynote Speaker / Conductor</label>
                  <input type="text" required className="form-input" value={eventForm.speaker} onChange={e => setEventForm({...eventForm, speaker: e.target.value})} />
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Event Type</label>
                  <select className="form-input" value={eventForm.type} onChange={e => setEventForm({...eventForm, type: e.target.value})}>
                    <option value="Seminar">Seminar</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Conference">Conference</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-outline" style={{ flex: 1 }}>Cancel</button>
                  <button type="submit" disabled={actionLoading} className="btn-primary" style={{ flex: 1.5 }}>
                    {actionLoading ? 'Scheduling...' : 'Schedule Event'}
                  </button>
                </div>
              </form>
            )}

            {/* Doctoral Projects Form */}
            {subTab === 'projects' && (
              <form onSubmit={handleProjectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Project Title</label>
                  <input type="text" required className="form-input" value={projectForm.title} onChange={e => setProjectForm({...projectForm, title: e.target.value})} />
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Department</label>
                  <input type="text" required className="form-input" value={projectForm.department} onChange={e => setProjectForm({...projectForm, department: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Scholar Name</label>
                    <input type="text" required className="form-input" value={projectForm.scholarName} onChange={e => setProjectForm({...projectForm, scholarName: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Supervisor Name</label>
                    <input type="text" required className="form-input" value={projectForm.supervisorName} onChange={e => setProjectForm({...projectForm, supervisorName: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Project Abstract</label>
                  <textarea rows={4} required className="form-input" style={{ resize: 'none', fontFamily: 'inherit' }} value={projectForm.abstract} onChange={e => setProjectForm({...projectForm, abstract: e.target.value})} />
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Project Cover Image URL (Optional)</label>
                  <input type="text" className="form-input" placeholder="e.g. https://images.unsplash.com/photo-..." value={projectForm.imageUrl} onChange={e => setProjectForm({...projectForm, imageUrl: e.target.value})} />
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Status</label>
                  <select className="form-input" value={projectForm.status} onChange={e => setProjectForm({...projectForm, status: e.target.value})}>
                    <option value="ACTIVE_RESEARCH">ACTIVE RESEARCH</option>
                    <option value="Awarded">Awarded</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-outline" style={{ flex: 1 }}>Cancel</button>
                  <button type="submit" disabled={actionLoading} className="btn-primary" style={{ flex: 1.5 }}>
                    {actionLoading ? 'Saving...' : 'Save Project Details'}
                  </button>
                </div>
              </form>
            )}

            {/* Collaboration Calls Form */}
            {subTab === 'collab_calls' && (
              <form onSubmit={handleCollabCallSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Call Title</label>
                  <input type="text" required className="form-input" value={collabCallForm.title} onChange={e => setCollabCallForm({...collabCallForm, title: e.target.value})} />
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Department</label>
                  <input type="text" required className="form-input" value={collabCallForm.department} onChange={e => setCollabCallForm({...collabCallForm, department: e.target.value})} />
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Call Type</label>
                  <select className="form-input" value={collabCallForm.type} onChange={e => setCollabCallForm({...collabCallForm, type: e.target.value})}>
                    <option value="Industry Partner">Industry Partner</option>
                    <option value="Inter-Departmental">Inter-Departmental</option>
                    <option value="Other Call">Other Call</option>
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Brief Description</label>
                  <textarea rows={4} required className="form-input" style={{ resize: 'none', fontFamily: 'inherit' }} value={collabCallForm.description} onChange={e => setCollabCallForm({...collabCallForm, description: e.target.value})} />
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Status</label>
                  <select className="form-input" value={collabCallForm.status} onChange={e => setCollabCallForm({...collabCallForm, status: e.target.value})}>
                    <option value="Active">Active</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-outline" style={{ flex: 1 }}>Cancel</button>
                  <button type="submit" disabled={actionLoading} className="btn-primary" style={{ flex: 1.5 }}>
                    {actionLoading ? 'Saving...' : 'Save Call Details'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ================================================= */}
      {/* INQUIRY REMARKS MODAL */}
      {/* ================================================= */}
      {isInquiryModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '500px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '18px', fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Evaluate Collaboration Proposal
            </h3>
            <form onSubmit={handleInquirySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Status Desk</label>
                <select className="form-input" value={inquiryRemark.status} onChange={e => setInquiryRemark({...inquiryRemark, status: e.target.value})} required>
                  <option value="PENDING">PENDING</option>
                  <option value="REVIEWED">REVIEWED</option>
                  <option value="CONTACTED">CONTACTED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>
              <div>
                <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Administrative / Office Remarks</label>
                <textarea rows={4} className="form-input" style={{ resize: 'none', fontFamily: 'inherit' }} value={inquiryRemark.remarks} onChange={e => setInquiryRemark({...inquiryRemark, remarks: e.target.value})} placeholder="Log review notes, expert panel updates, or next steps here..." />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsInquiryModalOpen(false)} className="btn-outline" style={{ flex: 1 }}>Close</button>
                <button type="submit" disabled={actionLoading} className="btn-primary" style={{ flex: 1.5 }}>
                  {actionLoading ? 'Saving...' : 'Record Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PublicConfigTab;
