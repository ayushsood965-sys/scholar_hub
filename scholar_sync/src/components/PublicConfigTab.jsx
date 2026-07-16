import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { useToast } from '../context/ToastContext';
import { 
  Plus, Edit2, Trash2, Check, RefreshCw, Mail, Calendar, Coins, Users, 
  Search, BookOpen, Megaphone, Award, Link, Info, FileText, ClipboardList
} from 'lucide-react';

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
  const [fundingAwards, setFundingAwards] = useState([]);
  const [partnerships, setPartnerships] = useState([]);
  const [events, setEvents] = useState([]);
  const [projects, setProjects] = useState([]);
  const [collabCalls, setCollabCalls] = useState([]);
  
  // All department users (for member & scholar selectors)
  const [deptUsers, setDeptUsers] = useState([]);
  
  // Search queries for lab member selectors
  const [facultySearch, setFacultySearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  
  // Custom lab categories list
  const [labTypes, setLabTypes] = useState(["Departmental", "Centre of Excellence", "Collaborative Facility", "Central Instrumentation"]);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Forms state
  const [labForm, setLabForm] = useState({ 
    name: '', department: user?.department || '', leadId: '', focus: '', projects: '', status: 'Actively Recruiting Scholars',
    description: '', members: [], researchAreas: '', equipment: [], website: '', location: '', imageUrl: '', contactEmail: '',
    labType: 'Departmental', fundingSupport: '', establishedYear: ''
  });
  
  const [fundingForm, setFundingForm] = useState({ 
    title: '', agency: '', amount: '', duration: '', scope: '', status: 'Applications Open',
    type: 'Fellowship', eligibilityDepartments: [], eligibilityCriteria: '', deadline: '', applicationUrl: '',
    contactEmail: '', documentsRequired: '', fundingBody: 'Other', recurrence: 'One-time'
  });

  const [fundingAwardForm, setFundingAwardForm] = useState({
    scholarId: '', thesisId: '', fundingOpportunityId: '', awardTitle: '',
    amountSanctioned: '', amountDisbursed: '', startDate: '', endDate: '',
    status: 'ACTIVE', renewalDate: '', remarks: ''
  });

  const [partnershipForm, setPartnershipForm] = useState({
    partnerName: '', partnerType: 'Industry', title: '', description: '',
    departments: [], linkedLabIds: [], startDate: '', endDate: '',
    mouDocumentUrl: '', partnerLogoUrl: '', outcomes: '', status: 'ACTIVE',
    contactPerson: '', contactEmail: ''
  });

  const [eventForm, setEventForm] = useState({ title: '', date: '', time: '', location: '', speaker: '', type: 'Seminar' });
  const [projectForm, setProjectForm] = useState({ title: '', department: user?.department || '', abstract: '', scholarName: '', supervisorName: '', status: 'ACTIVE_RESEARCH', imageUrl: '' });
  
  const [collabCallForm, setCollabCallForm] = useState({ 
    title: '', description: '', type: 'Industry Partner', department: user?.department || '', status: 'Active',
    partnerType: 'Industry', deadline: '', fundingAmount: '', contactPerson: '', contactEmail: '',
    eligibleDepartments: [], outcomes: '', relatedLabId: ''
  });

  const [inquiryRemark, setInquiryRemark] = useState({ id: '', status: '', remarks: '', assignedTo: '', priority: 'MEDIUM', textNote: '' });
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

  const [allStudents, setAllStudents] = useState([]);

  const loadFaculty = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/faculty?all=true`, getAuthHeader());
      setFaculty(res.data);
    } catch (err) {
      toast.error('Failed to load faculty list');
    }
  };

  const loadAllStudents = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/students?all=true`, getAuthHeader());
      setAllStudents(res.data);
    } catch (err) {
      console.error('Failed to load all students');
    }
  };

  const loadDeptUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/dept-users`, getAuthHeader());
      setDeptUsers(res.data);
    } catch (err) {
      console.error('Failed to load department users');
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

  const loadFundingAwards = async () => {
    try {
      const res = await axios.get(`${API_URL}/config/funding-awards`, getAuthHeader());
      setFundingAwards(res.data);
    } catch (err) {
      toast.error('Failed to load funding awards');
    }
  };

  const loadPartnerships = async () => {
    try {
      const res = await axios.get(`${API_URL}/public/partnerships`);
      setPartnerships(res.data);
    } catch (err) {
      toast.error('Failed to load partnerships');
    }
  };

  const loadEvents = async () => {
    try {
      const res = await axios.get(`${API_URL}/public/events`);
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
    await Promise.all([
      loadLabs(), loadFaculty(), loadDeptUsers(), loadAllStudents(), loadInquiries(), 
      loadFunding(), loadFundingAwards(), loadPartnerships(),
      loadEvents(), loadProjects(), loadCollabCalls()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (labs && labs.length > 0) {
      const existingTypes = labs.map(l => l.labType).filter(Boolean);
      setLabTypes(prev => {
        const combined = new Set([...prev, ...existingTypes]);
        return Array.from(combined);
      });
    }
  }, [labs]);

  const scholars = deptUsers.filter(u => u.role === 'STUDENT');

  // Submit Handlers
  const handleLabSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        ...labForm,
        projects: labForm.projects ? labForm.projects.split(',').map(p => p.trim()).filter(Boolean) : [],
        researchAreas: labForm.researchAreas ? labForm.researchAreas.split(',').map(r => r.trim()).filter(Boolean) : [],
        fundingSupport: labForm.fundingSupport ? labForm.fundingSupport.split(',').map(f => f.trim()).filter(Boolean) : [],
        establishedYear: labForm.establishedYear ? parseInt(labForm.establishedYear) : null
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
    if (!window.confirm('Delete this research lab?')) return;
    try {
      await axios.delete(`${API_URL}/config/labs/${id}`, getAuthHeader());
      toast.success('Research Lab deleted');
      loadLabs();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handleFundingSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        ...fundingForm,
        eligibilityDepartments: typeof fundingForm.eligibilityDepartments === 'string' ? fundingForm.eligibilityDepartments.split(',').map(d => d.trim()).filter(Boolean) : fundingForm.eligibilityDepartments,
        documentsRequired: fundingForm.documentsRequired ? fundingForm.documentsRequired.split(',').map(d => d.trim()).filter(Boolean) : []
      };

      if (editingId) {
        await axios.put(`${API_URL}/config/funding/${editingId}`, payload, getAuthHeader());
        toast.success('Funding opportunity updated');
      } else {
        await axios.post(`${API_URL}/config/funding`, payload, getAuthHeader());
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

  const handleFundingAwardSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      if (editingId) {
        await axios.put(`${API_URL}/config/funding-awards/${editingId}`, fundingAwardForm, getAuthHeader());
        toast.success('Funding award updated');
      } else {
        await axios.post(`${API_URL}/config/funding-awards`, fundingAwardForm, getAuthHeader());
        toast.success('Funding award assigned successfully');
      }
      setIsModalOpen(false);
      loadFundingAwards();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFundingAwardDelete = async (id) => {
    if (!window.confirm('Delete this funding award?')) return;
    try {
      await axios.delete(`${API_URL}/config/funding-awards/${id}`, getAuthHeader());
      toast.success('Award deleted');
      loadFundingAwards();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handlePartnershipSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        ...partnershipForm,
        departments: typeof partnershipForm.departments === 'string' ? partnershipForm.departments.split(',').map(d => d.trim()).filter(Boolean) : partnershipForm.departments,
        outcomes: partnershipForm.outcomes ? partnershipForm.outcomes.split(',').map(o => o.trim()).filter(Boolean) : []
      };

      if (editingId) {
        await axios.put(`${API_URL}/config/partnerships/${editingId}`, payload, getAuthHeader());
        toast.success('Partnership updated');
      } else {
        await axios.post(`${API_URL}/config/partnerships`, payload, getAuthHeader());
        toast.success('Partnership created successfully');
      }
      setIsModalOpen(false);
      loadPartnerships();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePartnershipDelete = async (id) => {
    if (!window.confirm('Delete this partnership?')) return;
    try {
      await axios.delete(`${API_URL}/config/partnerships/${id}`, getAuthHeader());
      toast.success('Partnership deleted');
      loadPartnerships();
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
    if (!window.confirm('Delete this project?')) return;
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
      const payload = {
        ...collabCallForm,
        eligibleDepartments: typeof collabCallForm.eligibleDepartments === 'string' ? collabCallForm.eligibleDepartments.split(',').map(d => d.trim()).filter(Boolean) : collabCallForm.eligibleDepartments,
        outcomes: collabCallForm.outcomes ? collabCallForm.outcomes.split(',').map(o => o.trim()).filter(Boolean) : []
      };

      if (editingId) {
        await axios.put(`${API_URL}/config/collab-calls/${editingId}`, payload, getAuthHeader());
        toast.success('Collaboration call updated');
      } else {
        await axios.post(`${API_URL}/config/collab-calls`, payload, getAuthHeader());
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

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      // 1. Save general status/remarks update
      await axios.put(`${API_URL}/config/inquiries/${inquiryRemark.id}`, {
        status: inquiryRemark.status,
        remarks: inquiryRemark.remarks
      }, getAuthHeader());

      // 2. Save assignment if set
      if (inquiryRemark.assignedTo !== undefined) {
        await axios.put(`${API_URL}/config/inquiries/${inquiryRemark.id}/assign`, {
          assignedTo: inquiryRemark.assignedTo,
          priority: inquiryRemark.priority
        }, getAuthHeader());
      }

      // 3. Add timeline note if typed
      if (inquiryRemark.textNote && inquiryRemark.textNote.trim()) {
        await axios.put(`${API_URL}/config/inquiries/${inquiryRemark.id}/notes`, {
          text: inquiryRemark.textNote
        }, getAuthHeader());
      }

      toast.success('Inquiry workflow updated successfully');
      setIsInquiryModalOpen(false);
      loadInquiries();
    } catch (err) {
      toast.error('Failed to update inquiry workflow');
    } finally {
      setActionLoading(false);
    }
  };

  // Modals Open
  const openEditModal = (type, item) => {
    setEditingId(item._id);
    if (type === 'lab') {
      setLabForm({
        name: item.name,
        department: item.department,
        leadId: item.leadId?._id || item.leadId || '',
        focus: item.focus,
        projects: item.projects?.join(', ') || '',
        status: item.status,
        description: item.description || '',
        members: item.members?.map(m => m._id || m) || [],
        researchAreas: item.researchAreas?.join(', ') || '',
        website: item.website || '',
        location: item.location || '',
        imageUrl: item.imageUrl || '',
        contactEmail: item.contactEmail || '',
        labType: item.labType || 'Departmental',
        fundingSupport: item.fundingSupport?.join(', ') || '',
        establishedYear: item.establishedYear || ''
      });
    } else if (type === 'funding') {
      setFundingForm({
        title: item.title,
        agency: item.agency,
        amount: item.amount,
        duration: item.duration,
        scope: item.scope,
        status: item.status,
        type: item.type || 'Fellowship',
        eligibilityDepartments: item.eligibilityDepartments || [],
        eligibilityCriteria: item.eligibilityCriteria || '',
        deadline: item.deadline ? new Date(item.deadline).toISOString().split('T')[0] : '',
        applicationUrl: item.applicationUrl || '',
        contactEmail: item.contactEmail || '',
        documentsRequired: item.documentsRequired?.join(', ') || '',
        fundingBody: item.fundingBody || 'Other',
        recurrence: item.recurrence || 'One-time'
      });
    } else if (type === 'funding_award') {
      setFundingAwardForm({
        scholarId: item.scholarId?._id || item.scholarId || '',
        thesisId: item.thesisId?._id || item.thesisId || '',
        fundingOpportunityId: item.fundingOpportunityId?._id || item.fundingOpportunityId || '',
        awardTitle: item.awardTitle,
        amountSanctioned: item.amountSanctioned || '',
        amountDisbursed: item.amountDisbursed || '',
        startDate: item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '',
        endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '',
        status: item.status || 'ACTIVE',
        renewalDate: item.renewalDate ? new Date(item.renewalDate).toISOString().split('T')[0] : '',
        remarks: item.remarks || ''
      });
    } else if (type === 'partnership') {
      setPartnershipForm({
        partnerName: item.partnerName,
        partnerType: item.partnerType || 'Industry',
        title: item.title,
        description: item.description || '',
        departments: item.departments || [],
        linkedLabIds: item.linkedLabIds?.map(l => l._id || l) || [],
        startDate: item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '',
        endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : '',
        mouDocumentUrl: item.mouDocumentUrl || '',
        partnerLogoUrl: item.partnerLogoUrl || '',
        outcomes: item.outcomes?.join(', ') || '',
        status: item.status || 'ACTIVE',
        contactPerson: item.contactPerson || '',
        contactEmail: item.contactEmail || ''
      });
    } else if (type === 'event') {
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
        status: item.status,
        partnerType: item.partnerType || 'Industry',
        deadline: item.deadline ? new Date(item.deadline).toISOString().split('T')[0] : '',
        fundingAmount: item.fundingAmount || '',
        contactPerson: item.contactPerson || '',
        contactEmail: item.contactEmail || '',
        eligibleDepartments: item.eligibleDepartments || [],
        outcomes: item.outcomes?.join(', ') || '',
        relatedLabId: item.relatedLabId?._id || item.relatedLabId || ''
      });
    }
    setIsModalOpen(true);
  };

  const openCreateModal = (type) => {
    setEditingId(null);
    if (type === 'labs') {
      setLabForm({ 
        name: '', department: user?.department || '', leadId: '', focus: '', projects: '', status: 'Actively Recruiting Scholars',
        description: '', members: [], researchAreas: '', equipment: [], website: '', location: '', imageUrl: '', contactEmail: '',
        labType: 'Departmental', fundingSupport: '', establishedYear: ''
      });
    } else if (type === 'funding') {
      setFundingForm({ 
        title: '', agency: '', amount: '', duration: '', scope: '', status: 'Applications Open',
        type: 'Fellowship', eligibilityDepartments: [], eligibilityCriteria: '', deadline: '', applicationUrl: '',
        contactEmail: '', documentsRequired: '', fundingBody: 'Other', recurrence: 'One-time'
      });
    } else if (type === 'funding_awards') {
      setFundingAwardForm({
        scholarId: '', thesisId: '', fundingOpportunityId: '', awardTitle: '',
        amountSanctioned: '', amountDisbursed: '', startDate: '', endDate: '',
        status: 'ACTIVE', renewalDate: '', remarks: ''
      });
    } else if (type === 'partnerships') {
      setPartnershipForm({
        partnerName: '', partnerType: 'Industry', title: '', description: '',
        departments: [], linkedLabIds: [], startDate: '', endDate: '',
        mouDocumentUrl: '', partnerLogoUrl: '', outcomes: '', status: 'ACTIVE',
        contactPerson: '', contactEmail: ''
      });
    } else if (type === 'events') {
      setEventForm({ title: '', date: '', time: '', location: '', speaker: '', type: 'Seminar' });
    } else if (type === 'projects') {
      setProjectForm({ title: '', department: user?.department || '', abstract: '', scholarName: '', supervisorName: '', status: 'ACTIVE_RESEARCH', imageUrl: '' });
    } else if (type === 'collab_calls') {
      setCollabCallForm({ 
        title: '', description: '', type: 'Industry Partner', department: user?.department || '', status: 'Active',
        partnerType: 'Industry', deadline: '', fundingAmount: '', contactPerson: '', contactEmail: '',
        eligibleDepartments: [], outcomes: '', relatedLabId: ''
      });
    }
    setIsModalOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px', flexWrap: 'wrap' }}>
        {[
          { key: 'labs', label: 'Research Labs', icon: Users },
          { key: 'inquiries', label: 'Collaboration Inquiries', icon: Mail },
          { key: 'funding', label: 'Funding & Grants', icon: Coins },
          { key: 'funding_awards', label: 'Funding Awards', icon: Award },
          { key: 'partnerships', label: 'MoU & Partnerships', icon: Link },
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
                padding: '8px 14px',
                border: 'none',
                background: subTab === tab.key ? '#10B981' : 'transparent',
                color: subTab === tab.key ? 'white' : '#64748B',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <TabIcon size={16} />
              {tab.label}
              {tab.key === 'inquiries' && inquiries.filter(i => i.status === 'PENDING').length > 0 && (
                <span style={{ fontSize: '0.65rem', background: '#EF4444', color: 'white', borderRadius: '50%', width: '16px', height: '16px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
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

      {/* Views */}
      <div className="card" style={{ padding: '24px', background: 'var(--color-surface)', borderRadius: '12px' }}>
        
        {/* Research Labs Tab */}
        {subTab === 'labs' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 className="card-title" style={{ margin: 0 }}>HPU Research Labs & Facilities</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0' }}>Manage research centres, infrastructure equipment, P.I. supervisors, and members.</p>
              </div>
              <button onClick={() => openCreateModal('labs')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                <Plus size={16} /> Add Research Lab
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {labs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>No research labs registered.</div>
              ) : (
                labs.map(lab => (
                  <div key={lab._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--color-border)', borderRadius: '12px', background: 'var(--color-bg)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h4 style={{ margin: 0, fontWeight: 700, color: '#1E293B' }}>{lab.name}</h4>
                        <span style={{ fontSize: '0.68rem', background: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>{lab.status}</span>
                        <span style={{ fontSize: '0.68rem', background: '#E0F2FE', color: '#0369A1', padding: '2px 8px', borderRadius: '12px' }}>{lab.labType || 'Departmental'}</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0' }}>
                        <strong>PI Lead:</strong> {lab.leadId?.name || 'Faculty Lead'} | <strong>Department:</strong> {lab.department} | <strong>Members:</strong> {lab.memberCount || 0}
                      </p>
                      {lab.focus && <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', margin: '2px 0 0' }}><strong>Focus:</strong> {lab.focus}</p>}
                      {lab.location && <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '2px 0 0' }}>📍 {lab.location}</p>}
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

        {/* Collaboration Inquiries Tab */}
        {subTab === 'inquiries' && (
          <div>
            <h3 className="card-title" style={{ marginTop: 0, marginBottom: '4px' }}>Partner Collaboration Desk</h3>
            <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0 0 20px' }}>Evaluate proposals, assign review to faculty experts, and track workflow statuses.</p>

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
                          Submitted by: <strong>{inq.name}</strong> ({inq.institution}) | email: {inq.email} | Phone: {inq.phone || 'N/A'}
                        </span>
                        <div style={{ display: 'flex', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.65rem', background: '#F3F4F6', color: '#374151', padding: '2px 8px', borderRadius: '8px', fontWeight: 600 }}>Type: {inq.type || 'Other'}</span>
                          <span style={{ 
                            fontSize: '0.65rem', 
                            background: inq.priority === 'HIGH' ? '#FEE2E2' : inq.priority === 'MEDIUM' ? '#FEF3C7' : '#F3F4F6',
                            color: inq.priority === 'HIGH' ? '#991B1B' : inq.priority === 'MEDIUM' ? '#D97706' : '#374151',
                            padding: '2px 8px', 
                            borderRadius: '8px', 
                            fontWeight: 600 
                          }}>
                            Priority: {inq.priority || 'MEDIUM'}
                          </span>
                          {inq.assignedTo && (
                            <span style={{ fontSize: '0.65rem', background: '#E0F2FE', color: '#0369A1', padding: '2px 8px', borderRadius: '8px', fontWeight: 600 }}>
                              Assigned to: {faculty.find(f => f._id === (inq.assignedTo?._id || inq.assignedTo))?.name || 'Faculty PI'}
                            </span>
                          )}
                        </div>
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
                            setInquiryRemark({ 
                              id: inq._id, 
                              status: inq.status, 
                              remarks: inq.remarks || '', 
                              assignedTo: inq.assignedTo?._id || inq.assignedTo || '', 
                              priority: inq.priority || 'MEDIUM',
                              textNote: ''
                            });
                            setIsInquiryModalOpen(true);
                          }}
                          className="btn-outline-small"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          Manage Flow
                        </button>
                      </div>
                    </div>
                    <div style={{ background: 'var(--color-surface)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.82rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                      {inq.details}
                    </div>
                    {inq.remarks && (
                      <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#059669', fontStyle: 'italic' }}>
                        <strong>Office Note:</strong> {inq.remarks}
                      </div>
                    )}
                    {inq.notes && inq.notes.length > 0 && (
                      <div style={{ marginTop: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '8px' }}>
                        <strong style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Workflow Notes:</strong>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                          {inq.notes.map((n, idx) => (
                            <div key={idx} style={{ fontSize: '0.74rem', background: '#F8FAFC', padding: '6px 10px', borderRadius: '6px', border: '1px solid #F1F5F9' }}>
                              <span>{n.text}</span>
                              <span style={{ fontSize: '0.65rem', color: '#94A3B8', marginLeft: '8px' }}>- {new Date(n.date).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Funding opportunities Tab */}
        {subTab === 'funding' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 className="card-title" style={{ margin: 0 }}>Fellowship & Grant Schemes</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0' }}>Configure UGC, CSIR, DST-SERB, HIMCOSTE, and state-level funding programs.</p>
              </div>
              <button onClick={() => openCreateModal('funding')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                <Plus size={16} /> Add Funding Scheme
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {funding.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>No funding schemes listed.</div>
              ) : (
                funding.map(grant => (
                  <div key={grant._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--color-border)', borderRadius: '12px', background: 'var(--color-bg)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h4 style={{ margin: 0, fontWeight: 700, color: '#1E293B' }}>{grant.title}</h4>
                        <span style={{ fontSize: '0.68rem', background: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>{grant.status}</span>
                        <span style={{ fontSize: '0.68rem', background: '#F3F4F6', color: '#374151', padding: '2px 8px', borderRadius: '12px' }}>{grant.type || 'Fellowship'}</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0' }}>
                        <strong>Agency:</strong> {grant.agency} | <strong>Body:</strong> {grant.fundingBody || 'Other'} | <strong>Stipend/Amount:</strong> {grant.amount}
                      </p>
                      {grant.deadline && (
                        <p style={{ fontSize: '0.78rem', color: '#EF4444', margin: '2px 0 0' }}>
                          ⏰ Apply Before: {new Date(grant.deadline).toLocaleDateString()}
                        </p>
                      )}
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

        {/* Funding Awards Tab */}
        {subTab === 'funding_awards' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 className="card-title" style={{ margin: 0 }}>Active Student Fellowships</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0' }}>Assign funding opportunities to scholars and record their monthly stipends or project allocations.</p>
              </div>
              <button onClick={() => openCreateModal('funding_awards')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                <Plus size={16} /> Assign Award
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {fundingAwards.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>No fellowship awards mapped to scholars yet.</div>
              ) : (
                fundingAwards.map(award => (
                  <div key={award._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--color-border)', borderRadius: '12px', background: 'var(--color-bg)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h4 style={{ margin: 0, fontWeight: 700, color: '#1E293B' }}>{award.awardTitle}</h4>
                        <span style={{ 
                          fontSize: '0.68rem', 
                          background: award.status === 'ACTIVE' ? '#D1FAE5' : award.status === 'PENDING_RENEWAL' ? '#FEF3C7' : '#F3F4F6', 
                          color: award.status === 'ACTIVE' ? '#065F46' : award.status === 'PENDING_RENEWAL' ? '#D97706' : '#374151', 
                          padding: '2px 8px', 
                          borderRadius: '12px', 
                          fontWeight: 600 
                        }}>{award.status}</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0' }}>
                        <strong>Scholar:</strong> {award.scholarId?.name || 'N/A'} ({award.scholarId?.department}) | <strong>Sanctioned:</strong> {award.amountSanctioned}
                      </p>
                      {award.renewalDate && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                          📅 Renewal Date: {new Date(award.renewalDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => openEditModal('funding_award', award)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1', background: 'var(--color-surface)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => handleFundingAwardDelete(award._id)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #FCA5A5', background: 'var(--color-surface)', color: '#EF4444', cursor: 'pointer' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* MoU & Partnerships Tab */}
        {subTab === 'partnerships' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 className="card-title" style={{ margin: 0 }}>MoUs & Collaborative Partners</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0' }}>Track university MoU agreements with Industry, Defense forces (e.g. ARTRAC), and central bodies.</p>
              </div>
              <button onClick={() => openCreateModal('partnerships')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                <Plus size={16} /> Add MoU Partner
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {partnerships.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>No partnerships registered.</div>
              ) : (
                partnerships.map(partner => (
                  <div key={partner._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--color-border)', borderRadius: '12px', background: 'var(--color-bg)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h4 style={{ margin: 0, fontWeight: 700, color: '#1E293B' }}>{partner.partnerName}</h4>
                        <span style={{ fontSize: '0.68rem', background: '#D1FAE5', color: '#065F46', padding: '2px 8px', borderRadius: '12px', fontWeight: 600 }}>{partner.status}</span>
                        <span style={{ fontSize: '0.68rem', background: '#F3F4F6', color: '#374151', padding: '2px 8px', borderRadius: '12px' }}>{partner.partnerType}</span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0' }}>
                        <strong>Title:</strong> {partner.title}
                      </p>
                      {partner.startDate && (
                        <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>
                          📅 Effective Since: {new Date(partner.startDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => openEditModal('partnership', partner)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #CBD5E1', background: 'var(--color-surface)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => handlePartnershipDelete(partner._id)} style={{ padding: '8px', borderRadius: '8px', border: '1px solid #FCA5A5', background: 'var(--color-surface)', color: '#EF4444', cursor: 'pointer' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Academic Events Tab */}
        {subTab === 'events' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 className="card-title" style={{ margin: 0 }}>University Seminars & Conferences</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0' }}>Schedule workshops, keynote panels, and symposia.</p>
              </div>
              <button onClick={() => openCreateModal('events')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                <Plus size={16} /> Schedule Event
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {events.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>No scheduled events.</div>
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

        {/* Featured Projects Tab */}
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
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>No doctoral projects registered yet.</div>
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

        {/* Collaboration Calls Tab */}
        {subTab === 'collab_calls' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 className="card-title" style={{ margin: 0 }}>Active Collaboration Calls</h3>
                <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '4px 0 0' }}>Manage active industry mentor calls and inter-departmental initiatives.</p>
              </div>
              <button onClick={() => openCreateModal('collab_calls')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                <Plus size={16} /> Add Collaboration Call
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {collabCalls.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>No collaboration calls registered yet.</div>
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
                        <strong>Department:</strong> {call.department} | <strong>Partner:</strong> {call.partnerType}
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

      {/* CRUD MODAL */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px', overflowY: 'auto' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: '16px', padding: '24px', width: subTab === 'labs' ? '80%' : '100%', maxWidth: subTab === 'labs' ? '1100px' : '580px', maxHeight: '95vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '18px', fontSize: '1.2rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
              {editingId ? 'Edit Record' : 'Create New Record'}
            </h3>
            
            {/* Labs Form */}
            {subTab === 'labs' && (
              <form onSubmit={handleLabSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '24px' }}>
                  
                  {/* Left Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '8px', marginBottom: '4px' }}>
                      <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#133A26', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        📝 Identification & Details
                      </h4>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.5fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Lab Name *</label>
                        <input type="text" required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '0.88rem' }} value={labForm.name} onChange={e => setLabForm({...labForm, name: e.target.value})} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Est. Year</label>
                        <input type="number" placeholder="e.g. 2020" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '0.88rem' }} value={labForm.establishedYear} onChange={e => setLabForm({...labForm, establishedYear: e.target.value})} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Department</label>
                        <input type="text" disabled style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F1F5F9', fontSize: '0.88rem', color: '#64748B' }} value={labForm.department} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Lab Classification Type</label>
                        <select style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '0.88rem' }} value={labForm.labType} onChange={e => {
                          const val = e.target.value;
                          if (val === "ADD_NEW_CATEGORY") {
                            const newCat = prompt("Enter the name of the new Lab Classification Category:");
                            if (newCat && newCat.trim()) {
                              const trimmed = newCat.trim();
                              if (!labTypes.includes(trimmed)) {
                                setLabTypes([...labTypes, trimmed]);
                              }
                              setLabForm({...labForm, labType: trimmed});
                            }
                          } else {
                            setLabForm({...labForm, labType: val});
                          }
                        }}>
                          {labTypes.map(t => <option key={t} value={t}>{t}</option>)}
                          <option value="ADD_NEW_CATEGORY" style={{ fontWeight: 'bold', color: '#133A26' }}>➕ Add Custom Category...</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Lab Overview / Description</label>
                      <textarea rows={4} placeholder="Summarize instrumentation, tools, and general capabilities..." style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '0.88rem', resize: 'none', fontFamily: 'inherit', lineHeight: 1.4 }} value={labForm.description} onChange={e => setLabForm({...labForm, description: e.target.value})} />
                    </div>

                    <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '8px', marginTop: '10px', marginBottom: '4px' }}>
                      <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#133A26', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        👥 Lead PI & Research Group
                      </h4>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Lead PI (Faculty Supervisor) *</label>
                        <select required style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '0.88rem' }} value={labForm.leadId} onChange={e => setLabForm({...labForm, leadId: e.target.value})}>
                          <option value="">Select Lead...</option>
                          {faculty.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Recruitment Status</label>
                        <select style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '0.88rem' }} value={labForm.status} onChange={e => setLabForm({...labForm, status: e.target.value})}>
                          <option value="Actively Recruiting Scholars">Actively Recruiting</option>
                          <option value="2 Research Slots Open">2 Slots Open</option>
                          <option value="Research Slots Filled">Slots Filled</option>
                        </select>
                      </div>
                    </div>
                    {/* 1. Co-Investigators (Faculty) */}
                    <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1E293B' }}>🎓 Co-Investigators (Faculty)</span>
                      </div>
                      
                      {/* List of currently added Faculty */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {faculty.filter(f => labForm.members.includes(f._id) && f._id !== labForm.leadId).map(f => (
                          <div key={f._id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#DBEAFE', color: '#1E40AF', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                            {f.name} ({f.department?.split(' ').pop()})
                            <button type="button" onClick={() => setLabForm({...labForm, members: labForm.members.filter(id => id !== f._id)})} style={{ background: 'none', border: 'none', color: '#1E40AF', cursor: 'pointer', padding: 0, fontSize: '0.8rem', fontWeight: 'bold' }}>×</button>
                          </div>
                        ))}
                        {faculty.filter(f => labForm.members.includes(f._id) && f._id !== labForm.leadId).length === 0 && (
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic' }}>No co-investigators assigned.</span>
                        )}
                      </div>

                      {/* Add Faculty Search Dropdown */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <input type="text" placeholder="Search and add Faculty members..." style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', background: 'white', fontSize: '0.82rem' }} value={facultySearch} onChange={e => setFacultySearch(e.target.value)} />
                          {facultySearch && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #E2E8F0', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 10, maxHeight: '150px', overflowY: 'auto', marginTop: '4px' }}>
                              {faculty.filter(f => f.name.toLowerCase().includes(facultySearch.toLowerCase()) && !labForm.members.includes(f._id) && f._id !== labForm.leadId).map(f => (
                                <div key={f._id} onClick={() => {
                                  setLabForm({...labForm, members: [...labForm.members, f._id]});
                                  setFacultySearch('');
                                }} onMouseEnter={e => e.target.style.background = '#F1F5F9'} onMouseLeave={e => e.target.style.background = 'white'} style={{ padding: '8px 12px', fontSize: '0.8rem', cursor: 'pointer', borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' }}>
                                  <strong>{f.name}</strong> - {f.department}
                                </div>
                              ))}
                              {faculty.filter(f => f.name.toLowerCase().includes(facultySearch.toLowerCase()) && !labForm.members.includes(f._id) && f._id !== labForm.leadId).length === 0 && (
                                <div style={{ padding: '8px 12px', fontSize: '0.78rem', color: '#94A3B8' }}>No faculty found.</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 2. Research Scholars (Students) */}
                    <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1E293B' }}>📝 Research Scholars (Students)</span>
                      </div>
                      
                      {/* List of currently added Scholars */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {allStudents.filter(s => labForm.members.includes(s._id)).map(s => (
                          <div key={s._id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#D1FAE5', color: '#065F46', padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600 }}>
                            {s.name} ({s.department?.split(' ').pop()})
                            <button type="button" onClick={() => setLabForm({...labForm, members: labForm.members.filter(id => id !== s._id)})} style={{ background: 'none', border: 'none', color: '#065F46', cursor: 'pointer', padding: 0, fontSize: '0.8rem', fontWeight: 'bold' }}>×</button>
                          </div>
                        ))}
                        {allStudents.filter(s => labForm.members.includes(s._id)).length === 0 && (
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic' }}>No scholars assigned.</span>
                        )}
                      </div>

                      {/* Add Student Search Dropdown */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <input type="text" placeholder="Search and add Scholars..." style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #CBD5E1', background: 'white', fontSize: '0.82rem' }} value={studentSearch} onChange={e => setStudentSearch(e.target.value)} />
                          {studentSearch && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #E2E8F0', borderRadius: '6px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', zIndex: 10, maxHeight: '150px', overflowY: 'auto', marginTop: '4px' }}>
                              {allStudents.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()) && !labForm.members.includes(s._id)).map(s => (
                                <div key={s._id} onClick={() => {
                                  setLabForm({...labForm, members: [...labForm.members, s._id]});
                                  setStudentSearch('');
                                }} onMouseEnter={e => e.target.style.background = '#F1F5F9'} onMouseLeave={e => e.target.style.background = 'white'} style={{ padding: '8px 12px', fontSize: '0.8rem', cursor: 'pointer', borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s' }}>
                                  <strong>{s.name}</strong> ({s.profile?.shNo || 'No SH#'}) - {s.department}
                                </div>
                              ))}
                              {allStudents.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()) && !labForm.members.includes(s._id)).length === 0 && (
                                <div style={{ padding: '8px 12px', fontSize: '0.78rem', color: '#94A3B8' }}>No students found.</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Right Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '8px', marginBottom: '4px' }}>
                      <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#133A26', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        🔬 Focus & Output
                      </h4>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Focus Specialty Tags (comma separated) *</label>
                      <input type="text" required placeholder="e.g. Micro-particles, GSR, Thin-films" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '0.88rem' }} value={labForm.focus} onChange={e => setLabForm({...labForm, focus: e.target.value})} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Sub-Research Areas</label>
                        <input type="text" placeholder="e.g. AI, Nanotech, Optics" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '0.88rem' }} value={labForm.researchAreas} onChange={e => setLabForm({...labForm, researchAreas: e.target.value})} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Funding Support / Sponsors</label>
                        <input type="text" placeholder="e.g. DST-SERB, Himcoste" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '0.88rem' }} value={labForm.fundingSupport} onChange={e => setLabForm({...labForm, fundingSupport: e.target.value})} />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Active Projects / Deliverables</label>
                      <input type="text" placeholder="e.g. Project 1, Project 2" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '0.88rem' }} value={labForm.projects} onChange={e => setLabForm({...labForm, projects: e.target.value})} />
                    </div>

                    <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: '8px', marginTop: '10px', marginBottom: '4px' }}>
                      <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#133A26', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        📍 Logistics & Channels
                      </h4>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Location / Room</label>
                        <input type="text" placeholder="e.g. Room 304, Biotech Block" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '0.88rem' }} value={labForm.location} onChange={e => setLabForm({...labForm, location: e.target.value})} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Contact Email</label>
                        <input type="email" placeholder="e.g. lab@hpu.ac.in" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '0.88rem' }} value={labForm.contactEmail} onChange={e => setLabForm({...labForm, contactEmail: e.target.value})} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Lab Homepage URL</label>
                        <input type="text" placeholder="e.g. https://lab.hpu.ac.in" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '0.88rem' }} value={labForm.website} onChange={e => setLabForm({...labForm, website: e.target.value})} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>Lab Banner Image URL</label>
                        <input type="text" placeholder="e.g. https://images.unsplash.com/..." style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#F8FAFC', fontSize: '0.88rem' }} value={labForm.imageUrl} onChange={e => setLabForm({...labForm, imageUrl: e.target.value})} />
                      </div>
                    </div>

                  </div>

                </div>

                <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid #E2E8F0', paddingTop: '18px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-outline" style={{ flex: 1, padding: '12px 20px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600 }}>Cancel</button>
                  <button type="submit" disabled={actionLoading} className="btn-primary" style={{ flex: 2, padding: '12px 20px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, background: '#133A26', border: 'none', color: 'white' }}>
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Funding Agency</label>
                    <input type="text" required className="form-input" value={fundingForm.agency} onChange={e => setFundingForm({...fundingForm, agency: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Funding Body</label>
                    <select className="form-input" value={fundingForm.fundingBody} onChange={e => setFundingForm({...fundingForm, fundingBody: e.target.value})}>
                      <option value="UGC">UGC</option>
                      <option value="CSIR">CSIR</option>
                      <option value="DST">DST</option>
                      <option value="DBT">DBT</option>
                      <option value="SERB">SERB</option>
                      <option value="ICSSR">ICSSR</option>
                      <option value="DRDO">DRDO</option>
                      <option value="HIMCOSTE">HIMCOSTE</option>
                      <option value="HP State Govt">HP State Govt</option>
                      <option value="RUSA">RUSA</option>
                      <option value="Industry">Industry</option>
                      <option value="University">University</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Amount Pool / Stipend</label>
                    <input type="text" required className="form-input" placeholder="e.g. ₹37,000/month or ₹45 Lakhs" value={fundingForm.amount} onChange={e => setFundingForm({...fundingForm, amount: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Duration</label>
                    <input type="text" required className="form-input" placeholder="e.g. 5 Years or 3 Years" value={fundingForm.duration} onChange={e => setFundingForm({...fundingForm, duration: e.target.value})} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Opportunity Type</label>
                    <select className="form-input" value={fundingForm.type} onChange={e => setFundingForm({...fundingForm, type: e.target.value})}>
                      <option value="Fellowship">Fellowship</option>
                      <option value="Project Grant">Project Grant</option>
                      <option value="Travel Grant">Travel Grant</option>
                      <option value="Infrastructure">Infrastructure</option>
                      <option value="State Scholarship">State Scholarship</option>
                      <option value="Industry Sponsorship">Industry Sponsorship</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Disbursement Recurrence</label>
                    <select className="form-input" value={fundingForm.recurrence} onChange={e => setFundingForm({...fundingForm, recurrence: e.target.value})}>
                      <option value="Monthly">Monthly</option>
                      <option value="Annual">Annual</option>
                      <option value="Project-based">Project-based</option>
                      <option value="One-time">One-time</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Application Deadline</label>
                    <input type="date" className="form-input" value={fundingForm.deadline} onChange={e => setFundingForm({...fundingForm, deadline: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Contact Email</label>
                    <input type="email" className="form-input" placeholder="e.g. grants@hpu.ac.in" value={fundingForm.contactEmail} onChange={e => setFundingForm({...fundingForm, contactEmail: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Application Portal URL</label>
                  <input type="text" className="form-input" placeholder="e.g. https://ugc.ac.in/portal" value={fundingForm.applicationUrl} onChange={e => setFundingForm({...fundingForm, applicationUrl: e.target.value})} />
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Detailed Scope & Description</label>
                  <textarea rows={3} required className="form-input" placeholder="Briefly detail what this funding supports..." style={{ resize: 'none', fontFamily: 'inherit' }} value={fundingForm.scope} onChange={e => setFundingForm({...fundingForm, scope: e.target.value})} />
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Eligibility Criteria</label>
                  <input type="text" className="form-input" placeholder="e.g. Enrolled PhD scholars, NET-qualified" value={fundingForm.eligibilityCriteria} onChange={e => setFundingForm({...fundingForm, eligibilityCriteria: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Eligibility Departments (comma separated)</label>
                    <input type="text" className="form-input" placeholder="e.g. Department of Chemistry" value={fundingForm.eligibilityDepartments} onChange={e => setFundingForm({...fundingForm, eligibilityDepartments: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Documents Required (comma separated)</label>
                    <input type="text" className="form-input" placeholder="e.g. Marksheet, Joining report" value={fundingForm.documentsRequired} onChange={e => setFundingForm({...fundingForm, documentsRequired: e.target.value})} />
                  </div>
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

            {/* Funding Award Form */}
            {subTab === 'funding_awards' && (
              <form onSubmit={handleFundingAwardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Ph.D. Scholar</label>
                  <select required className="form-input" value={fundingAwardForm.scholarId} onChange={e => setFundingAwardForm({...fundingAwardForm, scholarId: e.target.value})}>
                    <option value="">Select Scholar...</option>
                    {scholars.map(s => <option key={s._id} value={s._id}>{s.name} ({s.department})</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Funding Scheme Link (Optional)</label>
                  <select className="form-input" value={fundingAwardForm.fundingOpportunityId} onChange={e => {
                    const opt = funding.find(f => f._id === e.target.value);
                    setFundingAwardForm({
                      ...fundingAwardForm, 
                      fundingOpportunityId: e.target.value,
                      awardTitle: opt ? opt.title : fundingAwardForm.awardTitle
                    });
                  }}>
                    <option value="">Select Scheme (sets Title)...</option>
                    {funding.map(f => <option key={f._id} value={f._id}>{f.title} ({f.agency})</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Award Title</label>
                  <input type="text" required className="form-input" placeholder="e.g. UGC-NET JRF Fellowship" value={fundingAwardForm.awardTitle} onChange={e => setFundingAwardForm({...fundingAwardForm, awardTitle: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Amount Sanctioned</label>
                    <input type="text" className="form-input" placeholder="e.g. ₹37,000/month" value={fundingAwardForm.amountSanctioned} onChange={e => setFundingAwardForm({...fundingAwardForm, amountSanctioned: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Total Disbursed So Far</label>
                    <input type="text" className="form-input" placeholder="e.g. ₹6.66 Lakhs" value={fundingAwardForm.amountDisbursed} onChange={e => setFundingAwardForm({...fundingAwardForm, amountDisbursed: e.target.value})} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Start Date</label>
                    <input type="date" className="form-input" value={fundingAwardForm.startDate} onChange={e => setFundingAwardForm({...fundingAwardForm, startDate: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>End Date</label>
                    <input type="date" className="form-input" value={fundingAwardForm.endDate} onChange={e => setFundingAwardForm({...fundingAwardForm, endDate: e.target.value})} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Award Status</label>
                    <select className="form-input" value={fundingAwardForm.status} onChange={e => setFundingAwardForm({...fundingAwardForm, status: e.target.value})}>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="PENDING_RENEWAL">PENDING RENEWAL</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Next Renewal Date</label>
                    <input type="date" className="form-input" value={fundingAwardForm.renewalDate} onChange={e => setFundingAwardForm({...fundingAwardForm, renewalDate: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Disbursement Remarks / Log Notes</label>
                  <textarea rows={3} className="form-input" placeholder="e.g. Fellowship upgraded from JRF to SRF in Jan 2026..." style={{ resize: 'none', fontFamily: 'inherit' }} value={fundingAwardForm.remarks} onChange={e => setFundingAwardForm({...fundingAwardForm, remarks: e.target.value})} />
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-outline" style={{ flex: 1 }}>Cancel</button>
                  <button type="submit" disabled={actionLoading} className="btn-primary" style={{ flex: 1.5 }}>
                    {actionLoading ? 'Saving...' : 'Save Award Details'}
                  </button>
                </div>
              </form>
            )}

            {/* Partnership Form */}
            {subTab === 'partnerships' && (
              <form onSubmit={handlePartnershipSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Partner Organization Name</label>
                  <input type="text" required className="form-input" placeholder="e.g. Indian Army (ARTRAC)" value={partnershipForm.partnerName} onChange={e => setPartnershipForm({...partnershipForm, partnerName: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>MoU Title</label>
                    <input type="text" required className="form-input" placeholder="e.g. Joint Drone R&D" value={partnershipForm.title} onChange={e => setPartnershipForm({...partnershipForm, title: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Partner Type</label>
                    <select className="form-input" value={partnershipForm.partnerType} onChange={e => setPartnershipForm({...partnershipForm, partnerType: e.target.value})}>
                      <option value="Industry">Industry</option>
                      <option value="Academic">Academic</option>
                      <option value="Government">Government</option>
                      <option value="Defense">Defense</option>
                      <option value="NGO">NGO</option>
                      <option value="International">International</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Partnership Description</label>
                  <textarea rows={3} className="form-input" placeholder="Summarize the cooperative goals, resource sharing terms, or research focus..." style={{ resize: 'none', fontFamily: 'inherit' }} value={partnershipForm.description} onChange={e => setPartnershipForm({...partnershipForm, description: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Start Date (Signing Date)</label>
                    <input type="date" className="form-input" value={partnershipForm.startDate} onChange={e => setPartnershipForm({...partnershipForm, startDate: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>End Date (Optional)</label>
                    <input type="date" className="form-input" value={partnershipForm.endDate} onChange={e => setPartnershipForm({...partnershipForm, endDate: e.target.value})} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Partner Logo URL</label>
                    <input type="text" className="form-input" placeholder="e.g. https://image..." value={partnershipForm.partnerLogoUrl} onChange={e => setPartnershipForm({...partnershipForm, partnerLogoUrl: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>MoU Document URL (PDF)</label>
                    <input type="text" className="form-input" placeholder="e.g. /uploads/mou..." value={partnershipForm.mouDocumentUrl} onChange={e => setPartnershipForm({...partnershipForm, mouDocumentUrl: e.target.value})} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Contact Person</label>
                    <input type="text" className="form-input" placeholder="e.g. Colonel Verma" value={partnershipForm.contactPerson} onChange={e => setPartnershipForm({...partnershipForm, contactPerson: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Contact Email</label>
                    <input type="email" className="form-input" placeholder="e.g. verma@army.in" value={partnershipForm.contactEmail} onChange={e => setPartnershipForm({...partnershipForm, contactEmail: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Expected Outcomes / Deliverables (comma separated)</label>
                  <input type="text" className="form-input" placeholder="e.g. 3 Joint Publications, Shared Lab access" value={partnershipForm.outcomes} onChange={e => setPartnershipForm({...partnershipForm, outcomes: e.target.value})} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Involved HPU Departments (comma separated)</label>
                    <input type="text" className="form-input" placeholder="e.g. Department of Computer Science" value={partnershipForm.departments} onChange={e => setPartnershipForm({...partnershipForm, departments: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>MoU Status</label>
                    <select className="form-input" value={partnershipForm.status} onChange={e => setPartnershipForm({...partnershipForm, status: e.target.value})}>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="PROPOSED">PROPOSED</option>
                      <option value="EXPIRED">EXPIRED</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Linked Research Labs (Select Multiple)</label>
                  <select multiple className="form-input" style={{ height: '80px' }} value={partnershipForm.linkedLabIds} onChange={e => {
                    const opts = Array.from(e.target.selectedOptions, option => option.value);
                    setPartnershipForm({...partnershipForm, linkedLabIds: opts});
                  }}>
                    {labs.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                  </select>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Hold Ctrl/Cmd to select multiple.</span>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-outline" style={{ flex: 1 }}>Cancel</button>
                  <button type="submit" disabled={actionLoading} className="btn-primary" style={{ flex: 1.5 }}>
                    {actionLoading ? 'Saving...' : 'Save Partnership'}
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Partner Type</label>
                    <select className="form-input" value={collabCallForm.partnerType} onChange={e => setCollabCallForm({...collabCallForm, partnerType: e.target.value})}>
                      <option value="Industry">Industry</option>
                      <option value="Academic">Academic</option>
                      <option value="Government">Government</option>
                      <option value="NGO">NGO</option>
                      <option value="International">International</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Application Deadline</label>
                    <input type="date" className="form-input" value={collabCallForm.deadline} onChange={e => setCollabCallForm({...collabCallForm, deadline: e.target.value})} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Funding Support / Seed Amount</label>
                    <input type="text" className="form-input" placeholder="e.g. ₹5,00,000 or Negotiable" value={collabCallForm.fundingAmount} onChange={e => setCollabCallForm({...collabCallForm, fundingAmount: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Linked Lab</label>
                    <select className="form-input" value={collabCallForm.relatedLabId} onChange={e => setCollabCallForm({...collabCallForm, relatedLabId: e.target.value})}>
                      <option value="">Select Lab...</option>
                      {labs.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Contact Person</label>
                    <input type="text" className="form-input" placeholder="e.g. Dr. Singh" value={collabCallForm.contactPerson} onChange={e => setCollabCallForm({...collabCallForm, contactPerson: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Contact Email</label>
                    <input type="email" className="form-input" placeholder="e.g. cs@hpu.ac.in" value={collabCallForm.contactEmail} onChange={e => setCollabCallForm({...collabCallForm, contactEmail: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Eligible Departments (comma separated)</label>
                  <input type="text" className="form-input" placeholder="e.g. Department of Computer Science" value={collabCallForm.eligibleDepartments} onChange={e => setCollabCallForm({...collabCallForm, eligibleDepartments: e.target.value})} />
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Expected Outcomes (comma separated)</label>
                  <input type="text" className="form-input" placeholder="e.g. Prototype, Joint publication" value={collabCallForm.outcomes} onChange={e => setCollabCallForm({...collabCallForm, outcomes: e.target.value})} />
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Brief Description</label>
                  <textarea rows={3} required className="form-input" style={{ resize: 'none', fontFamily: 'inherit' }} value={collabCallForm.description} onChange={e => setCollabCallForm({...collabCallForm, description: e.target.value})} />
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

      {/* INQUIRY REMARKS & ASSIGNMENT WORKFLOW MODAL */}
      {isInquiryModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '520px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Assign to Faculty PI</label>
                  <select className="form-input" value={inquiryRemark.assignedTo} onChange={e => setInquiryRemark({...inquiryRemark, assignedTo: e.target.value})}>
                    <option value="">Unassigned</option>
                    {faculty.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Priority</label>
                  <select className="form-input" value={inquiryRemark.priority} onChange={e => setInquiryRemark({...inquiryRemark, priority: e.target.value})}>
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Administrative / Office Remarks</label>
                <textarea rows={3} className="form-input" style={{ resize: 'none', fontFamily: 'inherit' }} value={inquiryRemark.remarks} onChange={e => setInquiryRemark({...inquiryRemark, remarks: e.target.value})} placeholder="Log review notes or administrative remarks..." />
              </div>
              <div>
                <label className="form-label" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Add Timeline Conversation Note</label>
                <input type="text" className="form-input" placeholder="Type a note (e.g. Sent brochure to applicant)..." value={inquiryRemark.textNote} onChange={e => setInquiryRemark({...inquiryRemark, textNote: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsInquiryModalOpen(false)} className="btn-outline" style={{ flex: 1 }}>Close</button>
                <button type="submit" disabled={actionLoading} className="btn-primary" style={{ flex: 1.5 }}>
                  {actionLoading ? 'Saving...' : 'Record Feedback & Save'}
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
