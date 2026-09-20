import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { 
  Coins, 
  Award, 
  Calendar, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Search, 
  RefreshCw, 
  ArrowUpRight, 
  Users, 
  CreditCard,
  Building,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { API_URL } from '../config';

const MONTH_OPTIONS = [
  'January 2026', 'February 2026', 'March 2026', 'April 2026',
  'May 2026', 'June 2026', 'July 2026', 'August 2026',
  'September 2026', 'October 2026', 'November 2026', 'December 2026'
];

const getCurrentMonthName = () => {
  const d = new Date();
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
};

const FundingManagementTab = ({ user }) => {
  const toast = useToast();
  const [subTab, setSubTab] = useState('awards'); // 'awards', 'ledger', 'schemes'
  const [loading, setLoading] = useState(true);
  const [fundingAwards, setFundingAwards] = useState([]);
  const [fundingSchemes, setFundingSchemes] = useState([]);
  const [scholars, setScholars] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScholarFilter, setSelectedScholarFilter] = useState('ALL');

  // Modals
  const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);
  const [editingAwardId, setEditingAwardId] = useState(null);
  const [awardForm, setAwardForm] = useState({
    scholarId: '',
    thesisId: '',
    fundingOpportunityId: '',
    awardTitle: '',
    monthlyStipend: '₹37,000 / Month',
    amountSanctioned: '₹22,20,000 (5 Years)',
    amountDisbursed: '₹0 (0 Months)',
    startDate: '',
    endDate: '',
    status: 'ACTIVE',
    renewalDate: '',
    remarks: ''
  });

  // Disbursement Entry Modal
  const [isDisbursementModalOpen, setIsDisbursementModalOpen] = useState(false);
  const [disbursementTargetAward, setDisbursementTargetAward] = useState(null);
  const [disbursementForm, setDisbursementForm] = useState({
    monthYear: getCurrentMonthName(),
    amount: '37000',
    referenceNo: '',
    remarks: '',
    status: 'DISBURSED',
    disbursedAt: new Date().toISOString().split('T')[0]
  });

  // Scholar Ledger Detail Modal
  const [ledgerDetailAward, setLedgerDetailAward] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [awardsRes, schemesRes, deptUsersRes] = await Promise.all([
        axios.get(`${API_URL}/config/funding-awards`, getAuthHeader()),
        axios.get(`${API_URL}/public/funding`),
        axios.get(`${API_URL}/auth/dept-users`, getAuthHeader()).catch(() => ({ data: [] }))
      ]);

      setFundingAwards(awardsRes.data || []);
      setFundingSchemes(schemesRes.data || []);
      setScholars(deptUsersRes.data.filter(u => u.role === 'STUDENT'));
    } catch (err) {
      toast.error('Failed to load fellowship & ledger records');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Award Submit (Create or Edit)
  const handleAwardSubmit = async (e) => {
    e.preventDefault();
    if (!awardForm.scholarId || !awardForm.awardTitle) {
      toast.error('Please select scholar and award title');
      return;
    }
    setActionLoading(true);
    try {
      if (editingAwardId) {
        await axios.put(`${API_URL}/config/funding-awards/${editingAwardId}`, awardForm, getAuthHeader());
        toast.success('Fellowship award updated');
      } else {
        await axios.post(`${API_URL}/config/funding-awards`, awardForm, getAuthHeader());
        toast.success('Scholar fellowship award mapped successfully');
      }
      setIsAwardModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save award');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEditAward = (award) => {
    setEditingAwardId(award._id);
    setAwardForm({
      scholarId: award.scholarId?._id || award.scholarId || '',
      thesisId: award.thesisId?._id || award.thesisId || '',
      fundingOpportunityId: award.fundingOpportunityId?._id || award.fundingOpportunityId || '',
      awardTitle: award.awardTitle || '',
      monthlyStipend: award.monthlyStipend || '₹37,000 / Month',
      amountSanctioned: award.amountSanctioned || '',
      amountDisbursed: award.amountDisbursed || '₹0 (0 Months)',
      startDate: award.startDate ? new Date(award.startDate).toISOString().split('T')[0] : '',
      endDate: award.endDate ? new Date(award.endDate).toISOString().split('T')[0] : '',
      status: award.status || 'ACTIVE',
      renewalDate: award.renewalDate ? new Date(award.renewalDate).toISOString().split('T')[0] : '',
      remarks: award.remarks || ''
    });
    setIsAwardModalOpen(true);
  };

  const handleOpenCreateAward = () => {
    setEditingAwardId(null);
    setAwardForm({
      scholarId: '',
      thesisId: '',
      fundingOpportunityId: '',
      awardTitle: '',
      monthlyStipend: '₹37,000 / Month',
      amountSanctioned: '₹22,20,000 (5 Years)',
      amountDisbursed: '₹0 (0 Months)',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      status: 'ACTIVE',
      renewalDate: '',
      remarks: ''
    });
    setIsAwardModalOpen(true);
  };

  const handleDeleteAward = async (id, title) => {
    if (!window.confirm(`Delete fellowship award "${title}"? This will also remove associated ledger history.`)) return;
    try {
      await axios.delete(`${API_URL}/config/funding-awards/${id}`, getAuthHeader());
      toast.success('Fellowship award deleted');
      loadData();
    } catch (err) {
      toast.error('Failed to delete award');
    }
  };

  // Record Single Month Disbursement
  const handleOpenRecordDisbursement = (award) => {
    setDisbursementTargetAward(award);
    const numStipend = parseInt(String(award.monthlyStipend || '37000').replace(/[^\d]/g, ''), 10) || 37000;
    
    // Auto-select first undisbursed month for this scheme
    const existingMonths = new Set(
      (award.disbursementLedger || [])
        .filter(e => e.status !== 'CANCELLED')
        .map(e => (e.monthYear || '').trim().toLowerCase())
    );
    const defaultMonth = MONTH_OPTIONS.find(m => !existingMonths.has(m.trim().toLowerCase())) || getCurrentMonthName();

    setDisbursementForm({
      monthYear: defaultMonth,
      amount: String(numStipend),
      referenceNo: `HPU-FIN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      remarks: `Monthly fellowship disbursement for ${defaultMonth}`,
      status: 'DISBURSED',
      disbursedAt: new Date().toISOString().split('T')[0]
    });
    setIsDisbursementModalOpen(true);
  };

  const handleDisbursementSubmit = async (e) => {
    e.preventDefault();
    if (!disbursementTargetAward) return;

    // Check if month already disbursed in this award/scheme
    const normalizedMonth = (disbursementForm.monthYear || '').trim().toLowerCase();
    const isAlreadyDisbursed = (disbursementTargetAward.disbursementLedger || []).some(
      d => (d.monthYear || '').trim().toLowerCase() === normalizedMonth && d.status !== 'CANCELLED'
    );
    if (isAlreadyDisbursed) {
      toast.error(`Disbursement for "${disbursementForm.monthYear}" already exists in this scheme (${disbursementTargetAward.awardTitle})!`);
      return;
    }

    setActionLoading(true);
    try {
      await axios.post(
        `${API_URL}/config/funding-awards/${disbursementTargetAward._id}/disbursements`,
        disbursementForm,
        getAuthHeader()
      );
      toast.success(`Disbursement logged for ${disbursementForm.monthYear}!`);
      setIsDisbursementModalOpen(false);
      loadData();
      if (ledgerDetailAward && ledgerDetailAward._id === disbursementTargetAward._id) {
        // Refresh detail view
        const updated = await axios.get(`${API_URL}/config/funding-awards`, getAuthHeader());
        const match = updated.data.find(a => a._id === ledgerDetailAward._id);
        if (match) setLedgerDetailAward(match);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record disbursement');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete an entry from ledger
  const handleDeleteDisbursementEntry = async (awardId, entryId, monthYear) => {
    if (!window.confirm(`Delete payout entry for "${monthYear}"? Total disbursed amount will be recalculated.`)) return;
    try {
      await axios.delete(`${API_URL}/config/funding-awards/${awardId}/disbursements/${entryId}`, getAuthHeader());
      toast.success(`Entry for ${monthYear} removed`);
      loadData();
      if (ledgerDetailAward && ledgerDetailAward._id === awardId) {
        const updated = await axios.get(`${API_URL}/config/funding-awards`, getAuthHeader());
        const match = updated.data.find(a => a._id === awardId);
        if (match) setLedgerDetailAward(match);
      }
    } catch (err) {
      toast.error('Failed to remove entry');
    }
  };

  // Batch Disburse Current Month for all active awards
  const handleBatchDisburse = async () => {
    const currentMonth = getCurrentMonthName();
    if (!window.confirm(`Batch disburse stipend for ${currentMonth} across all active department fellows?`)) return;
    setActionLoading(true);
    try {
      const res = await axios.post(`${API_URL}/config/funding-awards/batch-disburse`, {
        monthYear: currentMonth,
        referenceNoPrefix: 'HPU-BATCH'
      }, getAuthHeader());
      toast.success(res.data.message || 'Batch disbursement completed');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Batch disbursement failed');
    } finally {
      setActionLoading(false);
    }
  };

  // Calculate Metrics
  const activeAwards = fundingAwards.filter(a => a.status === 'ACTIVE');
  const monthlyCommitment = activeAwards.reduce((acc, a) => {
    const n = parseInt(String(a.monthlyStipend || '0').replace(/[^\d]/g, ''), 10) || 0;
    return acc + n;
  }, 0);

  // Flattened ledger rows across all awards for the Ledger view
  const allLedgerRows = fundingAwards.flatMap(award => {
    const entries = award.disbursementLedger || [];
    return entries.map(entry => ({
      ...entry,
      awardId: award._id,
      awardTitle: award.awardTitle,
      scholarName: award.scholarId?.name || 'Unknown Scholar',
      scholarDept: award.scholarId?.department || '',
      monthlyStipend: award.monthlyStipend
    }));
  }).sort((a, b) => new Date(b.disbursedAt || 0) - new Date(a.disbursedAt || 0));

  const filteredLedgerRows = allLedgerRows.filter(row => {
    if (selectedScholarFilter !== 'ALL' && row.awardId !== selectedScholarFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return row.scholarName.toLowerCase().includes(q) ||
        row.monthYear.toLowerCase().includes(q) ||
        (row.referenceNo && row.referenceNo.toLowerCase().includes(q)) ||
        row.awardTitle.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Top Banner & KPI Cards */}
      <div className="card" style={{ padding: '24px', background: 'var(--color-surface)', borderRadius: '16px', border: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                Research Fellowships & Disbursement Ledger
              </h2>
              <span style={{ fontSize: '0.72rem', background: '#DCFCE7', color: '#166534', padding: '3px 10px', borderRadius: '12px', fontWeight: 700 }}>
                HPU Departmental Console
              </span>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
              Manage statutory fellowship schemes (UGC, CSIR, DST, State Govt), track scholar awards, and execute month-by-month stipend payout ledgers.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={handleOpenCreateAward}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '9px 16px', borderRadius: '10px' }}
            >
              <Plus size={16} /> Map New Fellow
            </button>
            <button
              onClick={handleBatchDisburse}
              disabled={actionLoading || activeAwards.length === 0}
              className="btn-outline-small"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '9px 16px', borderRadius: '10px', borderColor: '#10B981', color: '#047857', background: '#ECFDF5' }}
              title="Record current month stipend for all active fellows at once"
            >
              <Sparkles size={16} /> Batch Disburse ({getCurrentMonthName().split(' ')[0]})
            </button>
            <button onClick={loadData} className="btn-outline-small" style={{ padding: '9px', borderRadius: '10px' }} title="Refresh">
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* 4 Summary Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'var(--color-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Enrolled Fellows
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#166534', marginTop: '4px' }}>
              {activeAwards.length} Active
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              Across departmental labs
            </div>
          </div>

          <div style={{ background: 'var(--color-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Monthly Stipend Commitment
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0284C7', marginTop: '4px' }}>
              ₹{monthlyCommitment.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              Per month payout rate
            </div>
          </div>

          <div style={{ background: 'var(--color-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total Ledger Entries
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#9333EA', marginTop: '4px' }}>
              {allLedgerRows.length} Payouts
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              Logged month-by-month
            </div>
          </div>

          <div style={{ background: 'var(--color-bg)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Statutory Schemes Available
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#D97706', marginTop: '4px' }}>
              {fundingSchemes.length} Schemes
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              UGC, CSIR, DST, State
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '2px solid var(--color-border)', paddingBottom: '8px' }}>
        <button
          onClick={() => setSubTab('awards')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            border: 'none',
            background: subTab === 'awards' ? '#10B981' : 'transparent',
            color: subTab === 'awards' ? 'white' : 'var(--color-text-secondary)',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <Award size={18} /> Fellowship Awards ({fundingAwards.length})
        </button>

        <button
          onClick={() => setSubTab('ledger')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            border: 'none',
            background: subTab === 'ledger' ? '#10B981' : 'transparent',
            color: subTab === 'ledger' ? 'white' : 'var(--color-text-secondary)',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <FileText size={18} /> Monthly Disbursement Ledger ({allLedgerRows.length})
        </button>

        <button
          onClick={() => setSubTab('schemes')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            border: 'none',
            background: subTab === 'schemes' ? '#10B981' : 'transparent',
            color: subTab === 'schemes' ? 'white' : 'var(--color-text-secondary)',
            fontWeight: 700,
            fontSize: '0.88rem',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <Coins size={18} /> Statutory Schemes Directory ({fundingSchemes.length})
        </button>
      </div>

      {/* VIEW 1: FELLOWSHIP AWARDS */}
      {subTab === 'awards' && (
        <div className="card" style={{ padding: '24px', background: 'var(--color-surface)', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
              Mapped Ph.D. Fellows & Stipends
            </h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
              Showing {fundingAwards.length} active and completed fellowship assignments
            </span>
          </div>

          {fundingAwards.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--color-text-muted)' }}>
              <Coins size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>No fellowship awards mapped yet.</p>
              <p style={{ margin: '6px 0 16px', fontSize: '0.85rem' }}>Link your departmental scholars to statutory fellowship schemes.</p>
              <button onClick={handleOpenCreateAward} className="btn-primary" style={{ fontSize: '0.85rem' }}>
                <Plus size={16} /> Map Fellow
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {fundingAwards.map(award => (
                <div
                  key={award._id}
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: '14px',
                    padding: '20px',
                    background: 'var(--color-bg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                          {award.scholarId?.name || 'Unknown Scholar'}
                        </h4>
                        <span style={{ fontSize: '0.72rem', background: '#E0F2FE', color: '#0369A1', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
                          {award.scholarId?.department || 'Department of Computer Science'}
                        </span>
                        <span style={{
                          fontSize: '0.72rem',
                          background: award.status === 'ACTIVE' ? '#D1FAE5' : '#F1F5F9',
                          color: award.status === 'ACTIVE' ? '#065F46' : '#64748B',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontWeight: 700
                        }}>
                          {award.status}
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: '#166534', fontWeight: 700 }}>
                        {award.awardTitle}
                        {award.fundingOpportunityId?.agency && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 400, marginLeft: '6px' }}>
                            ({award.fundingOpportunityId.agency})
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => handleOpenRecordDisbursement(award)}
                        className="btn-outline-small"
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', background: '#ECFDF5', borderColor: '#10B981', color: '#047857', fontWeight: 700 }}
                      >
                        <Coins size={14} /> Disburse Month
                      </button>
                      <button
                        onClick={() => setLedgerDetailAward(award)}
                        className="btn-outline-small"
                        style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', background: '#F0F9FF', borderColor: '#0284C7', color: '#0369A1', fontWeight: 700 }}
                      >
                        <FileText size={14} /> View Ledger ({award.disbursementLedger?.length || 0})
                      </button>
                      <button
                        onClick={() => handleOpenEditAward(award)}
                        className="btn-outline-small"
                        style={{ padding: '6px 10px' }}
                        title="Edit Award"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteAward(award._id, award.awardTitle)}
                        className="btn-outline-small"
                        style={{ padding: '6px 10px', color: '#EF4444', borderColor: '#FCA5A5' }}
                        title="Delete Award"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Financial Breakdown Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', background: 'var(--color-surface)', padding: '14px', borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '0.84rem' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>
                        Monthly Stipend Rate
                      </span>
                      <strong style={{ fontSize: '0.98rem', color: '#0369A1' }}>
                        {award.monthlyStipend || '₹37,000 / Month'}
                      </strong>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>
                        Total Sanctioned Pool
                      </span>
                      <strong style={{ fontSize: '0.98rem', color: 'var(--color-text-primary)' }}>
                        {award.amountSanctioned || '₹22,20,000 (5 Years)'}
                      </strong>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>
                        Disbursed So Far
                      </span>
                      <strong style={{ fontSize: '0.98rem', color: '#166534' }}>
                        {award.amountDisbursed || '₹0 (0 Months)'}
                      </strong>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'block', fontWeight: 600, textTransform: 'uppercase' }}>
                        Tenure Period
                      </span>
                      <span style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                        {award.startDate ? new Date(award.startDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'N/A'} – {award.endDate ? new Date(award.endDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Ongoing'}
                      </span>
                    </div>
                  </div>

                  {award.remarks && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
                      <strong>Administrative Note:</strong> {award.remarks}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: MONTHLY DISBURSEMENT LEDGER */}
      {subTab === 'ledger' && (
        <div className="card" style={{ padding: '24px', background: 'var(--color-surface)', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                Departmental Fellowship Disbursement Ledger
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                Comprehensive historical log of all monthly stipend payouts disbursed to Ph.D. scholars.
              </p>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                <input
                  type="text"
                  placeholder="Search scholar or UTR ref..."
                  className="form-input"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '36px', width: '220px', fontSize: '0.82rem' }}
                />
              </div>

              <select
                className="form-input"
                value={selectedScholarFilter}
                onChange={e => setSelectedScholarFilter(e.target.value)}
                style={{ width: '200px', fontSize: '0.82rem' }}
              >
                <option value="ALL">All Scholars ({fundingAwards.length})</option>
                {fundingAwards.map(a => (
                  <option key={a._id} value={a._id}>
                    {a.scholarId?.name} ({a.awardTitle})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredLedgerRows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
              No monthly disbursement ledger entries match your filter.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)', background: 'var(--color-bg)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 14px' }}>Month & Year</th>
                    <th style={{ padding: '12px 14px' }}>Scholar Name</th>
                    <th style={{ padding: '12px 14px' }}>Fellowship Scheme</th>
                    <th style={{ padding: '12px 14px' }}>Stipend Amount</th>
                    <th style={{ padding: '12px 14px' }}>Disbursal Date</th>
                    <th style={{ padding: '12px 14px' }}>Payment Ref / UTR</th>
                    <th style={{ padding: '12px 14px' }}>Status</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLedgerRows.map((row, idx) => (
                    <tr key={row._id || idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {row.monthYear}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 600 }}>
                        {row.scholarName}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                        {row.awardTitle}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#166534' }}>
                        {row.amountFormatted || `₹${(row.amount || 37000).toLocaleString('en-IN')}`}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                        {row.disbursedAt ? new Date(row.disbursedAt).toLocaleDateString('en-IN') : 'N/A'}
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '0.78rem', color: '#0369A1', fontFamily: 'monospace' }}>
                        {row.referenceNo || 'N/A'}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{
                          fontSize: '0.68rem',
                          background: row.status === 'DISBURSED' ? '#D1FAE5' : '#FEF3C7',
                          color: row.status === 'DISBURSED' ? '#065F46' : '#92400E',
                          padding: '3px 8px',
                          borderRadius: '8px',
                          fontWeight: 700
                        }}>
                          {row.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <button
                          onClick={() => handleDeleteDisbursementEntry(row.awardId, row._id, row.monthYear)}
                          style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                          title="Delete this disbursement entry"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: STATUTORY SCHEMES DIRECTORY */}
      {subTab === 'schemes' && (
        <div className="card" style={{ padding: '24px', background: 'var(--color-surface)', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                Statutory University Funding Schemes Directory
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                Centrally configured by Super Admin (Dean Studies / Registrar). Only active schemes are assignable.
              </p>
            </div>
            <a
              href="/funding"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline-small"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
            >
              Public Grants Page <ArrowUpRight size={14} />
            </a>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {fundingSchemes.map(scheme => (
              <div
                key={scheme._id}
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  padding: '16px',
                  background: 'var(--color-bg)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '0.7rem', background: '#E0F2FE', color: '#0369A1', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                    {scheme.fundingBody || 'Statutory'}
                  </span>
                  <span style={{ fontSize: '0.7rem', background: scheme.status === 'Active' ? '#D1FAE5' : '#F1F5F9', color: scheme.status === 'Active' ? '#065F46' : '#64748B', padding: '2px 8px', borderRadius: '6px', fontWeight: 600 }}>
                    {scheme.status}
                  </span>
                </div>

                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {scheme.title}
                </h4>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  Agency: <strong>{scheme.agency}</strong>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'var(--color-surface)', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block' }}>Package / Pool</span>
                    <strong style={{ fontSize: '0.88rem', color: '#166534' }}>{scheme.amount}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', display: 'block' }}>Monthly Stipend</span>
                    <strong style={{ fontSize: '0.88rem', color: '#0369A1' }}>{scheme.monthlyStipend || '₹37,000 / Month'}</strong>
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.4, flex: 1 }}>
                  {scheme.scope}
                </p>

                {scheme.applicationUrl && (
                  <a
                    href={scheme.applicationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '0.75rem', color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    Official Portal Guidelines <ArrowUpRight size={12} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: MAP / EDIT FELLOWSHIP AWARD */}
      {isAwardModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={20} /> {editingAwardId ? 'Edit Scholar Fellowship' : 'Map Scholar to Fellowship Scheme'}
              </h3>
              <button onClick={() => setIsAwardModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: '#94A3B8', cursor: 'pointer' }}>&times;</button>
            </div>

            <form onSubmit={handleAwardSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Ph.D. Scholar *</label>
                <select
                  required
                  className="form-input"
                  value={awardForm.scholarId}
                  onChange={e => setAwardForm({ ...awardForm, scholarId: e.target.value })}
                >
                  <option value="">Select Departmental Scholar...</option>
                  {scholars.map(s => (
                    <option key={s._id} value={s._id}>{s.name} ({s.department})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Link Statutory Funding Scheme (Optional - Auto-Fills Rates)</label>
                <select
                  className="form-input"
                  value={awardForm.fundingOpportunityId}
                  onChange={e => {
                    const opt = fundingSchemes.find(f => f._id === e.target.value);
                    if (opt) {
                      const autoStipend = opt.monthlyStipend || (opt.amount.includes('/ Month') ? opt.amount.split('+')[0].trim() : '₹37,000 / Month');
                      const autoSanctioned = opt.amount.includes('/ Month')
                        ? (opt.duration?.includes('5') ? '₹22,20,000 (5 Years)' : '₹13,32,000 (3 Years)')
                        : opt.amount;
                      setAwardForm({
                        ...awardForm,
                        fundingOpportunityId: e.target.value,
                        awardTitle: opt.title,
                        monthlyStipend: autoStipend,
                        amountSanctioned: autoSanctioned
                      });
                    } else {
                      setAwardForm({ ...awardForm, fundingOpportunityId: '' });
                    }
                  }}
                >
                  <option value="">Select Scheme (UGC, CSIR, DST, etc.)...</option>
                  {fundingSchemes.map(f => (
                    <option key={f._id} value={f._id}>{f.title} ({f.agency})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Award Title *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. UGC-NET Junior Research Fellowship (JRF / SRF)"
                  value={awardForm.awardTitle}
                  onChange={e => setAwardForm({ ...awardForm, awardTitle: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="form-label">Monthly Fellowship Stipend (Editable) *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. ₹37,000 / Month"
                    value={awardForm.monthlyStipend}
                    onChange={e => setAwardForm({ ...awardForm, monthlyStipend: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Total Sanctioned Pool (Editable)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. ₹22,20,000 (5 Years)"
                    value={awardForm.amountSanctioned}
                    onChange={e => setAwardForm({ ...awardForm, amountSanctioned: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="form-label">Fellowship Start Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={awardForm.startDate}
                    onChange={e => setAwardForm({ ...awardForm, startDate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Fellowship End Date (Tenure End)</label>
                  <input
                    type="date"
                    className="form-input"
                    value={awardForm.endDate}
                    onChange={e => setAwardForm({ ...awardForm, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="form-label">Award Status</label>
                  <select
                    className="form-input"
                    value={awardForm.status}
                    onChange={e => setAwardForm({ ...awardForm, status: e.target.value })}
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="PENDING_RENEWAL">PENDING_RENEWAL (e.g. JRF to SRF Upgradation)</option>
                    <option value="COMPLETED">COMPLETED (Tenure Concluded)</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Cumulative Disbursed (Auto-Synced with Ledger)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={awardForm.amountDisbursed}
                    onChange={e => setAwardForm({ ...awardForm, amountDisbursed: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Administrative Notes & Contingency Details</label>
                <textarea
                  rows={2}
                  className="form-input"
                  placeholder="e.g. Contingency grant of ₹10,000/yr approved. DRC Joining report verified."
                  value={awardForm.remarks}
                  onChange={e => setAwardForm({ ...awardForm, remarks: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsAwardModalOpen(false)} className="btn-outline-small">
                  Cancel
                </button>
                <button type="submit" disabled={actionLoading} className="btn-primary">
                  {actionLoading ? 'Saving...' : editingAwardId ? 'Update Fellowship' : 'Save Fellowship Award'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RECORD MONTHLY DISBURSEMENT */}
      {isDisbursementModalOpen && disbursementTargetAward && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '520px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Coins size={18} /> Record Monthly Stipend Disbursal
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  Scholar: <strong>{disbursementTargetAward.scholarId?.name}</strong> ({disbursementTargetAward.awardTitle})
                </p>
              </div>
              <button onClick={() => setIsDisbursementModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', color: '#94A3B8', cursor: 'pointer' }}>&times;</button>
            </div>

            {(() => {
              const isCurrentMonthDisbursed = (disbursementTargetAward.disbursementLedger || []).some(
                d => (d.monthYear || '').trim().toLowerCase() === (disbursementForm.monthYear || '').trim().toLowerCase() && d.status !== 'CANCELLED'
              );

              return (
                <form onSubmit={handleDisbursementSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label className="form-label">Month & Year *</label>
                    <select
                      required
                      className="form-input"
                      value={disbursementForm.monthYear}
                      onChange={e => setDisbursementForm({ ...disbursementForm, monthYear: e.target.value })}
                    >
                      {MONTH_OPTIONS.map(m => {
                        const isDisbursed = (disbursementTargetAward.disbursementLedger || []).some(
                          d => (d.monthYear || '').trim().toLowerCase() === m.trim().toLowerCase() && d.status !== 'CANCELLED'
                        );
                        return (
                          <option key={m} value={m} disabled={isDisbursed}>
                            {m} {isDisbursed ? '✓ (Already Disbursed in this Scheme)' : ''}
                          </option>
                        );
                      })}
                    </select>
                    {isCurrentMonthDisbursed && (
                      <div style={{ marginTop: '6px', fontSize: '0.8rem', color: '#DC2626', background: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.2)', padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertTriangle size={15} /> A disbursement for <strong>{disbursementForm.monthYear}</strong> already exists in this scheme. Please select an undisbursed month.
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="form-label">Disbursed Stipend Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      className="form-input"
                      placeholder="e.g. 37000"
                      value={disbursementForm.amount}
                      onChange={e => setDisbursementForm({ ...disbursementForm, amount: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label">Disbursal Date</label>
                    <input
                      type="date"
                      required
                      className="form-input"
                      value={disbursementForm.disbursedAt}
                      onChange={e => setDisbursementForm({ ...disbursementForm, disbursedAt: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label">Bank UTR / PFMS / Voucher Reference Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. HPU-FIN-2026-8921 or UTR-9948274"
                      value={disbursementForm.referenceNo}
                      onChange={e => setDisbursementForm({ ...disbursementForm, referenceNo: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label">Remarks</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Standard monthly JRF credit via Canara Bank SFMP"
                      value={disbursementForm.remarks}
                      onChange={e => setDisbursementForm({ ...disbursementForm, remarks: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <button type="button" onClick={() => setIsDisbursementModalOpen(false)} className="btn-outline-small">
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={actionLoading || isCurrentMonthDisbursed} 
                      className="btn-primary"
                      style={{ 
                        opacity: isCurrentMonthDisbursed ? 0.6 : 1, 
                        cursor: isCurrentMonthDisbursed ? 'not-allowed' : 'pointer' 
                      }}
                    >
                      {actionLoading ? 'Recording...' : 'Disburse & Update Ledger'}
                    </button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL 3: SCHOLAR SPECIFIC LEDGER DETAIL MODAL */}
      {ledgerDetailAward && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: '16px', padding: '28px', width: '100%', maxWidth: '780px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', borderBottom: '1px solid var(--color-border)', paddingBottom: '14px' }}>
              <div>
                <span style={{ fontSize: '0.72rem', background: '#D1FAE5', color: '#065F46', padding: '3px 8px', borderRadius: '10px', fontWeight: 700 }}>
                  FELLOWSHIP DISBURSEMENT LEDGER
                </span>
                <h3 style={{ margin: '6px 0 2px', fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                  {ledgerDetailAward.scholarId?.name}
                </h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                  {ledgerDetailAward.awardTitle} • Monthly Rate: <strong>{ledgerDetailAward.monthlyStipend}</strong> • Total Disbursed: <strong style={{ color: '#166534' }}>{ledgerDetailAward.amountDisbursed}</strong>
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => {
                    handleOpenRecordDisbursement(ledgerDetailAward);
                  }}
                  className="btn-primary"
                  style={{ fontSize: '0.78rem', padding: '6px 12px' }}
                >
                  <Plus size={14} /> Add Month
                </button>
                <button onClick={() => setLedgerDetailAward(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', color: '#94A3B8', cursor: 'pointer' }}>&times;</button>
              </div>
            </div>

            {(!ledgerDetailAward.disbursementLedger || ledgerDetailAward.disbursementLedger.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-muted)' }}>
                No disbursement entries logged for this scholar yet. Click "Add Month" to record their first stipend.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-border)', background: 'var(--color-bg)', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px' }}>Month & Year</th>
                      <th style={{ padding: '10px 12px' }}>Amount</th>
                      <th style={{ padding: '10px 12px' }}>Status</th>
                      <th style={{ padding: '10px 12px' }}>Disbursed Date</th>
                      <th style={{ padding: '10px 12px' }}>Payment Reference</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledgerDetailAward.disbursementLedger.map((entry, idx) => (
                      <tr key={entry._id || idx} style={{ borderBottom: '1px solid var(--color-border)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 700 }}>{entry.monthYear}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: '#166534' }}>
                          {entry.amountFormatted || `₹${(entry.amount || 37000).toLocaleString('en-IN')}`}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            fontSize: '0.68rem',
                            background: entry.status === 'DISBURSED' ? '#D1FAE5' : '#FEF3C7',
                            color: entry.status === 'DISBURSED' ? '#065F46' : '#92400E',
                            padding: '2px 8px',
                            borderRadius: '8px',
                            fontWeight: 700
                          }}>
                            {entry.status}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                          {entry.disbursedAt ? new Date(entry.disbursedAt).toLocaleDateString('en-IN') : 'N/A'}
                        </td>
                        <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: '0.78rem', color: '#0369A1' }}>
                          {entry.referenceNo || 'N/A'}
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleDeleteDisbursementEntry(ledgerDetailAward._id, entry._id, entry.monthYear)}
                            style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                            title="Delete entry"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default FundingManagementTab;
