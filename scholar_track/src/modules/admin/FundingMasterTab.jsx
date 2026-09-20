import React, { useState, useEffect, useMemo } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { 
  Award, 
  Coins, 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  ExternalLink, 
  ToggleLeft, 
  ToggleRight, 
  CheckCircle2, 
  XCircle,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FUNDING_BODIES = [
  'UGC', 'CSIR', 'DST', 'DBT', 'ICSSR', 'ICHR', 'DRDO', 
  'HIMCOSTE', 'HP State Govt', 'SERB', 'RUSA', 'Industry', 'University', 'Other'
];

const SCHEME_TYPES = [
  'Fellowship', 'Project Grant', 'Travel Grant', 
  'Infrastructure', 'State Scholarship', 'Industry Sponsorship'
];

const RECURRENCE_OPTIONS = ['Monthly', 'Annual', 'One-time', 'Project-based'];

// Statutory standard defaults for instant auto-fill when Super Admin selects authority
const FUNDING_BODY_DEFAULTS = {
  'UGC': {
    amount: '₹37,000 / Month + HRA',
    monthlyStipend: '₹37,000 / Month',
    agency: 'University Grants Commission (UGC) & Ministry of Education',
    duration: '5 Years (2 Yrs JRF + 3 Yrs SRF)',
    scope: 'National (UGC Recognized Universities)',
    recurrence: 'Monthly',
    type: 'Fellowship'
  },
  'CSIR': {
    amount: '₹37,000 / Month + HRA',
    monthlyStipend: '₹37,000 / Month',
    agency: 'Council of Scientific and Industrial Research (CSIR) - HRDG',
    duration: '5 Years (2 Yrs JRF + 3 Yrs SRF)',
    scope: 'National (Scientific & Applied Research)',
    recurrence: 'Monthly',
    type: 'Fellowship'
  },
  'DST': {
    amount: '₹37,000 / Month + HRA',
    monthlyStipend: '₹37,000 / Month',
    agency: 'Department of Science and Technology (DST)',
    duration: '5 Years (DST-INSPIRE)',
    scope: 'National (Science & Technology Faculties)',
    recurrence: 'Monthly',
    type: 'Fellowship'
  },
  'DBT': {
    amount: '₹37,000 / Month + HRA',
    monthlyStipend: '₹37,000 / Month',
    agency: 'Department of Biotechnology (DBT)',
    duration: '5 Years (2 Yrs JRF + 3 Yrs SRF)',
    scope: 'National (Biotechnology & Life Sciences)',
    recurrence: 'Monthly',
    type: 'Fellowship'
  },
  'SERB': {
    amount: '₹37,000 / Month + HRA',
    monthlyStipend: '₹37,000 / Month',
    agency: 'Science and Engineering Research Board (SERB - DST)',
    duration: '5 Years',
    scope: 'National (Engineering & Sciences)',
    recurrence: 'Monthly',
    type: 'Fellowship'
  },
  'ICSSR': {
    amount: '₹20,000 / Month + Contingency',
    monthlyStipend: '₹20,000 / Month',
    agency: 'Indian Council of Social Science Research (ICSSR)',
    duration: '2 Years',
    scope: 'National (Social Science Disciplines)',
    recurrence: 'Monthly',
    type: 'Fellowship'
  },
  'ICHR': {
    amount: '₹17,600 / Month + Contingency',
    monthlyStipend: '₹17,600 / Month',
    agency: 'Indian Council of Historical Research (ICHR)',
    duration: '2 Years',
    scope: 'National (History & Archaeology)',
    recurrence: 'Monthly',
    type: 'Fellowship'
  },
  'University': {
    amount: '₹10,000 / Month',
    monthlyStipend: '₹10,000 / Month',
    agency: 'Himachal Pradesh University (Dean Studies Office)',
    duration: '3 Years',
    scope: 'Himachal Pradesh University Campus',
    recurrence: 'Monthly',
    type: 'Fellowship'
  },
  'HP State Govt': {
    amount: '₹15,000 / Month',
    monthlyStipend: '₹15,000 / Month',
    agency: 'Government of Himachal Pradesh (Higher Education)',
    duration: '3 Years',
    scope: 'Himachal Pradesh Domicile Scholars',
    recurrence: 'Monthly',
    type: 'State Scholarship'
  },
  'HIMCOSTE': {
    amount: '₹15,00,000 (Project Grant)',
    monthlyStipend: 'N/A (Project Grant)',
    agency: 'HP Council for Science, Technology & Environment (HIMCOSTE)',
    duration: '3 Years',
    scope: 'Himachal Pradesh State Universities & Colleges',
    recurrence: 'Project-based',
    type: 'Project Grant'
  }
};

const initialForm = {
  title: '',
  agency: 'University Grants Commission (UGC) & Ministry of Education',
  fundingBody: 'UGC',
  customFundingBody: '',
  type: 'Fellowship',
  amount: '₹37,000 / Month + HRA',
  monthlyStipend: '₹37,000 / Month',
  duration: '5 Years (2 Yrs JRF + 3 Yrs SRF)',
  recurrence: 'Monthly',
  scope: 'National (UGC Recognized)',
  status: 'Active',
  applicationUrl: '',
  contactEmail: '',
  eligibilityCriteria: '',
  eligibilityDepartments: '',
  documentsRequired: '',
  deadline: ''
};

const FundingMasterTab = () => {
  const [schemes, setSchemes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, INACTIVE

  const api = useApi();
  const toast = useToast();

  const fetchFundingData = async () => {
    try {
      setLoading(true);
      const [listRes, statsRes] = await Promise.all([
        api.get('/public/funding?includeInactive=true'),
        api.get('/public/funding/stats')
      ]);
      setSchemes(listRes.data || []);
      setStats(statsRes.data || null);
    } catch (err) {
      toast.error('Failed to load funding schemes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFundingData();
  }, []);

  const resetForm = () => {
    setFormData(initialForm);
    setEditId(null);
    setFormOpen(false);
  };

  const handleEdit = (item) => {
    setEditId(item._id);
    const isStandardBody = FUNDING_BODIES.includes(item.fundingBody) && item.fundingBody !== 'Other';
    setFormData({
      title: item.title || '',
      agency: item.agency || '',
      fundingBody: isStandardBody ? item.fundingBody : 'Other',
      customFundingBody: isStandardBody ? '' : (item.fundingBody === 'Other' ? '' : item.fundingBody),
      type: item.type || 'Fellowship',
      amount: item.amount || '',
      monthlyStipend: item.monthlyStipend || (item.amount?.includes('/ Month') ? item.amount.split('+')[0].trim() : ''),
      duration: item.duration || '',
      recurrence: item.recurrence || 'Monthly',
      scope: item.scope || '',
      status: item.status === 'Inactive' ? 'Inactive' : 'Active',
      applicationUrl: item.applicationUrl || '',
      contactEmail: item.contactEmail || '',
      eligibilityCriteria: item.eligibilityCriteria || '',
      eligibilityDepartments: Array.isArray(item.eligibilityDepartments) ? item.eligibilityDepartments.join(', ') : (item.eligibilityDepartments || ''),
      documentsRequired: Array.isArray(item.documentsRequired) ? item.documentsRequired.join(', ') : (item.documentsRequired || ''),
      deadline: item.deadline ? item.deadline.split('T')[0] : ''
    });
    setFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Auto-fills standard norms when funding body is selected (editable by admin)
  const handleFundingBodyChange = (newBody) => {
    if (editId) {
      setFormData(prev => ({ ...prev, fundingBody: newBody }));
      return;
    }

    const preset = FUNDING_BODY_DEFAULTS[newBody];
    if (preset) {
      setFormData(prev => ({
        ...prev,
        fundingBody: newBody,
        agency: preset.agency,
        amount: preset.amount,
        monthlyStipend: preset.monthlyStipend,
        duration: preset.duration,
        scope: preset.scope,
        recurrence: preset.recurrence || prev.recurrence,
        type: preset.type || prev.type
      }));
    } else {
      setFormData(prev => ({ ...prev, fundingBody: newBody }));
    }
  };

  // Keeps monthlyStipend in sync with amount if user edits amount (unless manually customized)
  const handleAmountChange = (val) => {
    setFormData(prev => {
      let updatedStipend = prev.monthlyStipend;
      if (!prev.monthlyStipend || prev.monthlyStipend === prev.amount?.split('+')[0]?.trim()) {
        if (val.includes('/ Month')) {
          updatedStipend = val.split('+')[0].trim();
        } else if (/₹?\d[\d,]+/.test(val) && prev.recurrence === 'Monthly') {
          const match = val.match(/₹?[\d,]+/);
          if (match) updatedStipend = `${match[0]} / Month`;
        }
      }
      return { ...prev, amount: val, monthlyStipend: updatedStipend };
    });
  };

  const handleToggleStatus = async (item) => {
    const nextStatus = item.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await api.put(`/config/funding/${item._id}`, { status: nextStatus });
      toast.success(`Scheme "${item.title}" marked as ${nextStatus}`);
      fetchFundingData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update scheme status');
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete scheme: "${title}"?`)) return;
    try {
      await api.delete(`/config/funding/${id}`);
      toast.success('Funding scheme deleted successfully');
      fetchFundingData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete scheme');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.agency || !formData.amount || !formData.duration || !formData.scope) {
      toast.error('Please fill in all mandatory scheme details');
      return;
    }

    if (formData.fundingBody === 'Other' && !formData.customFundingBody?.trim()) {
      toast.error('Please specify the custom funding body name');
      return;
    }

    setSubmitting(true);
    try {
      const resolvedFundingBody = formData.fundingBody === 'Other'
        ? formData.customFundingBody.trim()
        : formData.fundingBody;

      const payload = {
        ...formData,
        monthlyStipend: formData.monthlyStipend?.trim() || (formData.amount?.includes('/ Month') ? formData.amount.split('+')[0].trim() : ''),
        fundingBody: resolvedFundingBody,
        customFundingBody: formData.customFundingBody,
        status: formData.status === 'Inactive' ? 'Inactive' : 'Active',
        eligibilityDepartments: formData.eligibilityDepartments
          ? formData.eligibilityDepartments.split(',').map(d => d.trim()).filter(Boolean)
          : [],
        documentsRequired: formData.documentsRequired
          ? formData.documentsRequired.split(',').map(d => d.trim()).filter(Boolean)
          : [],
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null
      };

      if (editId) {
        await api.put(`/config/funding/${editId}`, payload);
        toast.success('University funding scheme updated successfully');
      } else {
        await api.post('/config/funding', payload);
        toast.success('New university funding scheme created successfully');
      }

      resetForm();
      fetchFundingData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save funding scheme');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSchemes = useMemo(() => {
    if (statusFilter === 'ACTIVE') return schemes.filter(s => s.status === 'Active');
    if (statusFilter === 'INACTIVE') return schemes.filter(s => s.status === 'Inactive');
    return schemes;
  }, [schemes, statusFilter]);

  const activeCount = useMemo(() => schemes.filter(s => s.status === 'Active').length, [schemes]);
  const inactiveCount = useMemo(() => schemes.filter(s => s.status === 'Inactive').length, [schemes]);

  const columns = [
    {
      header: 'Scheme & Agency',
      accessor: (row) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
            {row.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '6px',
              background: '#E0F2FE',
              color: '#0369A1'
            }}>
              {row.fundingBody || 'Statutory'}
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {row.agency}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Grant & Monthly Stipend',
      accessor: (row) => (
        <div>
          <div style={{ fontWeight: 700, color: '#1A5A3B', fontSize: '0.92rem' }}>
            {row.amount}
          </div>
          {row.monthlyStipend && (
            <div style={{
              fontSize: '0.76rem',
              color: '#0369A1',
              fontWeight: 600,
              marginTop: '3px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Coins size={12} /> Stipend: {row.monthlyStipend}
            </div>
          )}
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {row.recurrence || 'Monthly'} • {row.duration}
          </div>
        </div>
      )
    },
    {
      header: 'Type & Scope',
      accessor: (row) => (
        <div>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: '6px',
            background: 'var(--color-bg)',
            color: 'var(--text-primary)',
            border: '1px solid var(--color-border)',
            display: 'inline-block',
            marginBottom: '4px'
          }}>
            {row.type || 'Fellowship'}
          </span>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            {row.scope}
          </div>
        </div>
      )
    },
    {
      header: 'Status (HPU Operation)',
      accessor: (row) => {
        const isActive = row.status === 'Active';
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start' }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '12px',
              background: isActive ? '#D1FAE5' : '#F1F5F9',
              color: isActive ? '#065F46' : '#64748B',
              border: isActive ? '1px solid #A7F3D0' : '1px solid #CBD5E1',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
              {isActive ? 'Active' : 'Inactive'}
            </span>
            <button
              type="button"
              onClick={() => handleToggleStatus(row)}
              style={{
                background: 'none',
                border: 'none',
                color: isActive ? '#DC2626' : '#059669',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '2px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                textDecoration: 'underline'
              }}
              title={isActive ? 'Mark as Inactive (hide from HODs)' : 'Mark as Active (show to HODs)'}
            >
              {isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
              {isActive ? 'Set Inactive' : 'Set Active'}
            </button>
          </div>
        );
      }
    },
    {
      header: 'Portal Reference',
      accessor: (row) => (
        <div>
          {row.applicationUrl ? (
            <a
              href={row.applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.78rem',
                color: 'var(--color-primary)',
                textDecoration: 'none',
                fontWeight: 600
              }}
            >
              UGC / Portal <ExternalLink size={12} />
            </a>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>—</span>
          )}
        </div>
      )
    },
    {
      header: 'Actions',
      accessor: (row) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className="btn btn-sm btn-outline"
            onClick={() => handleEdit(row)}
            title="Edit Scheme"
          >
            <Edit3 size={14} />
          </button>
          <button
            className="btn btn-sm btn-outline"
            style={{ color: '#EF4444', borderColor: '#EF4444' }}
            onClick={() => handleDelete(row._id, row.title)}
            title="Delete Scheme"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )
    }
  ];

  if (loading && !schemes.length) {
    return <SkeletonLoader count={1} height={420} />;
  }

  return (
    <div className="glass-panel p-xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-lg" style={{ flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h2 style={{ color: 'var(--text-primary)', margin: 0, fontWeight: 800 }}>
              University Research Funding Schemes
            </h2>
            <span style={{
              background: 'linear-gradient(135deg, #1A5A3B, #0D9488)',
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: '12px'
            }}>
              Super Admin Master
            </span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px' }}>
            Centrally configure statutory schemes (UGC, CSIR, State Govt, University JRF). Only <strong>Active</strong> schemes are visible to HODs and faculty for scholar mapping.
          </p>
        </div>
        {!formOpen && (
          <button className="btn btn-primary" onClick={() => { resetForm(); setFormOpen(true); }}>
            <Plus size={16} /> Add Statutory Scheme
          </button>
        )}
      </div>

      {/* Live University Stats Cards */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '28px'
        }}>
          <div style={{
            background: 'var(--color-surface-elevated, #ffffff)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '10px',
              background: '#DCFCE7',
              color: '#15803D',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Coins size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                Active Funding Pool
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {stats.totalActivePool || '₹0'}
              </div>
            </div>
          </div>

          <div style={{
            background: 'var(--color-surface-elevated, #ffffff)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '10px',
              background: '#E0F2FE',
              color: '#0284C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Award size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                Active Schemes
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {activeCount} Active <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500 }}>({schemes.length} Total)</span>
              </div>
            </div>
          </div>

          <div style={{
            background: 'var(--color-surface-elevated, #ffffff)',
            border: '1px solid var(--color-border)',
            borderRadius: '12px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '10px',
              background: '#F3E8FF',
              color: '#9333EA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
                Supported Scholars
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {stats.activeFellowshipsCount ?? 0} Enrolled
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Creation / Edit Inline Card */}
      <AnimatePresence>
        {formOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 28 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="inline-form-card" style={{ borderLeftColor: '#1A5A3B' }}>
              <div className="inline-form-header">
                <span className="inline-form-title">
                  <Award size={18} /> {editId ? 'Edit Statutory Scheme' : 'Create Master Funding Scheme'}
                </span>
                <button className="inline-form-close" onClick={resetForm} type="button">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Scheme Title *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. UGC-NET Junior Research Fellowship (JRF / SRF)"
                      required
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Funding Body / Authority *</label>
                    <select
                      className="form-input"
                      value={formData.fundingBody}
                      onChange={e => handleFundingBodyChange(e.target.value)}
                    >
                      {FUNDING_BODIES.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  {formData.fundingBody === 'Other' && (
                    <div className="form-group">
                      <label className="form-label">Specify Custom Funding Body *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Tata Trusts, NABARD, Ministry of Earth Sciences"
                        required
                        value={formData.customFundingBody}
                        onChange={e => setFormData({ ...formData, customFundingBody: e.target.value })}
                      />
                    </div>
                  )}

                  <div className="form-group">
                    <label className="form-label">Scheme Type *</label>
                    <select
                      className="form-input"
                      value={formData.type}
                      onChange={e => setFormData({ ...formData, type: e.target.value })}
                    >
                      {SCHEME_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Granting Agency / Ministry *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. University Grants Commission (UGC) & Ministry of Education"
                      required
                      value={formData.agency}
                      onChange={e => setFormData({ ...formData, agency: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Stipend / Grant Amount *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. ₹37,000 / Month + HRA"
                      required
                      value={formData.amount}
                      onChange={e => handleAmountChange(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <label className="form-label" style={{ margin: 0 }}>Monthly Fellowship Stipend (Rate) *</label>
                      <span style={{ fontSize: '0.72rem', color: '#0369A1', fontWeight: 600 }}>Auto-fills Scholar Awards</span>
                    </div>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. ₹37,000 / Month"
                      required
                      value={formData.monthlyStipend}
                      onChange={e => setFormData({ ...formData, monthlyStipend: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Duration *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 5 Years (2 Yrs JRF + 3 Yrs SRF)"
                      required
                      value={formData.duration}
                      onChange={e => setFormData({ ...formData, duration: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Recurrence *</label>
                    <select
                      className="form-input"
                      value={formData.recurrence}
                      onChange={e => setFormData({ ...formData, recurrence: e.target.value })}
                    >
                      {RECURRENCE_OPTIONS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Scheme Operational Status *</label>
                    <select
                      className="form-input"
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Active">Active (Visible to HODs & Ready for Mapping)</option>
                      <option value="Inactive">Inactive / Phased Out (Hidden from HODs)</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Geographic / Institutional Scope *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. National (All UGC Recognized Universities) or HPU Campus"
                      required
                      value={formData.scope}
                      onChange={e => setFormData({ ...formData, scope: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Official UGC / Scheme Portal URL (Optional Reference)</label>
                    <input
                      type="url"
                      className="form-input"
                      placeholder="https://ugcnet.nta.ac.in"
                      value={formData.applicationUrl}
                      onChange={e => setFormData({ ...formData, applicationUrl: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">University Nodal Contact Email (Optional)</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="deanstudies@hpu.ac.in"
                      value={formData.contactEmail}
                      onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Eligibility Norms</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      placeholder="e.g. Qualified UGC-NET JRF; enrolled in regular full-time Ph.D. at HPU"
                      value={formData.eligibilityCriteria}
                      onChange={e => setFormData({ ...formData, eligibilityCriteria: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Eligible Departments (Leave blank for all departments, or comma-separated)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Computer Science, Biotechnology, Physics"
                      value={formData.eligibilityDepartments}
                      onChange={e => setFormData({ ...formData, eligibilityDepartments: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label className="form-label">Mandatory Verification Documents</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Award Letter, DRC Joining Report, Mandate Form, Monthly Attendance"
                      value={formData.documentsRequired}
                      onChange={e => setFormData({ ...formData, documentsRequired: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-secondary" onClick={resetForm} disabled={submitting}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Saving...' : editId ? 'Update Master Scheme' : 'Save Master Scheme'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Filter size={14} /> Filter Status:
        </span>
        <button
          className={`btn btn-sm ${statusFilter === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setStatusFilter('ALL')}
        >
          All ({schemes.length})
        </button>
        <button
          className={`btn btn-sm ${statusFilter === 'ACTIVE' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setStatusFilter('ACTIVE')}
          style={statusFilter === 'ACTIVE' ? { background: '#166534', borderColor: '#166534' } : {}}
        >
          Active ({activeCount})
        </button>
        <button
          className={`btn btn-sm ${statusFilter === 'INACTIVE' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setStatusFilter('INACTIVE')}
          style={statusFilter === 'INACTIVE' ? { background: '#475569', borderColor: '#475569' } : {}}
        >
          Inactive ({inactiveCount})
        </button>
      </div>

      {/* Schemes Master Table */}
      <DataTable
        columns={columns}
        data={filteredSchemes}
        searchable={true}
        searchPlaceholder="Search schemes by title, agency, or funding body..."
        pageSize={10}
        emptyTitle="No Schemes Found"
        emptyMessage={statusFilter !== 'ALL' ? `No schemes currently with status "${statusFilter}".` : "No funding schemes configured yet."}
      />
    </div>
  );
};

export default FundingMasterTab;
