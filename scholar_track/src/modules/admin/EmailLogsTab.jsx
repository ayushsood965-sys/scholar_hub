import React, { useState, useEffect, useCallback } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { Mail, Search, RefreshCw, ChevronLeft, ChevronRight, CheckCircle, XCircle, Clock, RotateCcw, Send, Filter, BarChart3, Eye, X } from 'lucide-react';

const EmailLogsTab = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [retryingId, setRetryingId] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // Filter state
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const api = useApi();
  const toast = useToast();
  const limit = 20;

  const fetchLogs = useCallback(async (currentPage = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', currentPage);
      params.set('limit', limit);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('type', typeFilter);
      if (searchTerm) params.set('search', searchTerm);

      const res = await api.get(`/email-logs?${params.toString()}`);
      setLogs(res.data.logs || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalItems(res.data.pagination?.totalItems || 0);
      setPage(currentPage);
    } catch (err) {
      toast.error('Failed to load email delivery logs');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, statusFilter, typeFilter, searchTerm]);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const params = new URLSearchParams();
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      const res = await api.get(`/email-logs/stats?${params.toString()}`);
      setStats(res.data);
    } catch (err) {
      // Stats are non-critical, don't show error
    } finally {
      setStatsLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    fetchLogs(1);
    fetchStats();
  }, []);

  const handleSearch = () => {
    fetchLogs(1);
    fetchStats();
  };

  const handleClearFilters = () => {
    setFromDate('');
    setToDate('');
    setStatusFilter('');
    setTypeFilter('');
    setSearchTerm('');
    // Fetch with no filters
    setTimeout(() => {
      fetchLogs(1);
      fetchStats();
    }, 0);
  };

  const handleRetry = async (id) => {
    try {
      setRetryingId(id);
      await api.post(`/email-logs/${id}/retry`);
      toast.success('Email re-queued for delivery');
      fetchLogs(page);
      fetchStats();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to retry email');
    } finally {
      setRetryingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      SENT: { bg: 'rgba(16, 185, 129, 0.12)', color: '#10B981', border: 'rgba(16, 185, 129, 0.25)', icon: CheckCircle, label: 'Delivered' },
      FAILED: { bg: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', border: 'rgba(239, 68, 68, 0.25)', icon: XCircle, label: 'Failed' },
      PENDING: { bg: 'rgba(245, 158, 11, 0.12)', color: '#D97706', border: 'rgba(245, 158, 11, 0.25)', icon: Clock, label: 'Pending' },
      PROCESSING: { bg: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6', border: 'rgba(59, 130, 246, 0.25)', icon: Send, label: 'Sending' }
    };
    const cfg = configs[status] || configs.PENDING;
    const Icon = cfg.icon;
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px',
        borderRadius: '6px', background: cfg.bg, color: cfg.color,
        border: `1px solid ${cfg.border}`, textTransform: 'uppercase',
        letterSpacing: '0.3px'
      }}>
        <Icon size={13} />
        {cfg.label}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const configs = {
      VERIFICATION: { bg: 'rgba(15, 118, 110, 0.1)', color: '#0F766E', label: 'Verification' },
      PASSWORD_RESET: { bg: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED', label: 'Password Reset' },
      NOTIFICATION: { bg: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6', label: 'Notification' }
    };
    const cfg = configs[type] || { bg: 'rgba(100,116,139,0.1)', color: '#64748B', label: type };
    return (
      <span style={{
        fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px',
        borderRadius: '5px', background: cfg.bg, color: cfg.color,
        border: `1px solid ${cfg.bg}`, textTransform: 'uppercase'
      }}>
        {cfg.label}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const colors = {
      STUDENT: '#0F766E',
      FACULTY: '#2563EB',
      HOD: '#7C3AED',
      SUPER_ADMIN: '#DC2626',
      ADMIN: '#D97706',
      UNKNOWN: '#64748B'
    };
    const color = colors[role] || colors.UNKNOWN;
    return (
      <span style={{
        fontSize: '0.62rem', fontWeight: 700, padding: '1px 6px',
        borderRadius: '4px', background: `${color}18`, color,
        border: `1px solid ${color}30`, textTransform: 'uppercase'
      }}>
        {role?.replace('_', ' ')}
      </span>
    );
  };

  const formatTimestamp = (ts) => {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
  };

  const columns = [
    {
      key: 'timestamp',
      header: 'Timestamp',
      accessor: (row) => (
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
          {formatTimestamp(row.createdAt)}
        </span>
      )
    },
    {
      key: 'recipient',
      header: 'Recipient',
      accessor: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>
            {row.recipientName || row.payload?.name || '—'}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {row.payload?.email || '—'}
          </div>
          <div style={{ marginTop: '4px' }}>
            {getRoleBadge(row.recipientRole)}
          </div>
        </div>
      )
    },
    {
      key: 'type',
      header: 'Email Type',
      accessor: (row) => (
        <div>
          {getTypeBadge(row.type)}
          {row.type === 'NOTIFICATION' && row.payload?.title && (
            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '5px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {row.payload.title}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (row) => (
        <div>
          {getStatusBadge(row.status)}
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {row.attempts > 0 ? `${row.attempts} attempt${row.attempts > 1 ? 's' : ''}` : 'Queued'}
            {row.status === 'SENT' && row.sentAt && (
              <span style={{ marginLeft: '4px' }}>
                • Sent {formatTimestamp(row.sentAt)}
              </span>
            )}
          </div>
          {row.lastError && (
            <div style={{ fontSize: '0.68rem', color: '#EF4444', marginTop: '3px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {row.lastError}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      accessor: (row) => (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            onClick={() => setExpandedId(expandedId === row._id ? null : row._id)}
            className="btn btn-sm btn-outline"
            title="View Details"
            style={{ padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem' }}
          >
            <Eye size={13} /> View
          </button>
          {row.status === 'FAILED' && (
            <button
              onClick={() => handleRetry(row._id)}
              disabled={retryingId === row._id}
              className="btn btn-sm"
              title="Retry delivery"
              style={{
                padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px',
                fontSize: '0.72rem', background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444',
                border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', cursor: 'pointer'
              }}
            >
              <RotateCcw size={13} className={retryingId === row._id ? 'spin' : ''} />
              {retryingId === row._id ? 'Retrying...' : 'Retry'}
            </button>
          )}
        </div>
      )
    }
  ];

  // Stat card renderer
  const StatCard = ({ icon: Icon, label, value, color, subtext }) => (
    <div style={{
      background: 'var(--bg-card)', borderRadius: '14px', padding: '20px',
      border: '1px solid var(--border-color)', flex: '1', minWidth: '140px',
      display: 'flex', flexDirection: 'column', gap: '8px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '10px',
          background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={17} style={{ color }} />
        </div>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
        {value}
      </div>
      {subtext && (
        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{subtext}</div>
      )}
    </div>
  );

  // Detail modal/panel
  const DetailPanel = ({ log }) => {
    if (!log) return null;
    return (
      <div style={{
        background: 'var(--bg-card)', borderRadius: '14px', padding: '24px',
        border: '1px solid var(--border-color)', marginBottom: '20px',
        position: 'relative'
      }}>
        <button
          onClick={() => setExpandedId(null)}
          style={{
            position: 'absolute', top: '12px', right: '12px',
            background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)',
            padding: '4px'
          }}
        >
          <X size={18} />
        </button>
        <h3 style={{ margin: '0 0 16px', color: 'var(--text-primary)', fontSize: '1rem' }}>
          📧 Email Details
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Recipient</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.recipientName || log.payload?.name || '—'}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{log.payload?.email || '—'}</div>
            <div style={{ marginTop: '4px' }}>{getRoleBadge(log.recipientRole)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Email Type & Status</div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {getTypeBadge(log.type)}
              {getStatusBadge(log.status)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Delivery Timing</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>
              Queued: {formatTimestamp(log.createdAt)}
            </div>
            {log.sentAt && (
              <div style={{ fontSize: '0.82rem', color: '#10B981' }}>
                Delivered: {formatTimestamp(log.sentAt)}
              </div>
            )}
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>Attempts</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {log.attempts} / {log.maxAttempts}
            </div>
            {log.lastError && (
              <div style={{ fontSize: '0.76rem', color: '#EF4444', marginTop: '4px', padding: '8px', background: 'rgba(239,68,68,0.06)', borderRadius: '8px', wordBreak: 'break-all' }}>
                Last Error: {log.lastError}
              </div>
            )}
          </div>
        </div>
        {/* Email content preview */}
        {log.type === 'NOTIFICATION' && log.payload?.message && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>Notification Content</div>
            <div style={{
              padding: '14px', background: 'var(--bg-input)', borderRadius: '10px',
              border: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-primary)',
              lineHeight: 1.5
            }}>
              <div style={{ fontWeight: 700, marginBottom: '6px' }}>{log.payload.title}</div>
              {log.payload.message}
            </div>
          </div>
        )}
        {log.type === 'VERIFICATION' && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>Content</div>
            <div style={{
              padding: '14px', background: 'var(--bg-input)', borderRadius: '10px',
              border: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-primary)'
            }}>
              Email verification link sent to <strong>{log.payload?.email}</strong> for the <strong>{log.payload?.portal === 'track' ? 'ScholarTrack' : 'ScholarSync'}</strong> portal.
            </div>
          </div>
        )}
        {log.type === 'PASSWORD_RESET' && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '6px' }}>Content</div>
            <div style={{
              padding: '14px', background: 'var(--bg-input)', borderRadius: '10px',
              border: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-primary)'
            }}>
              Password reset link sent to <strong>{log.payload?.email}</strong> for the <strong>{log.payload?.portal === 'track' ? 'ScholarTrack' : 'ScholarSync'}</strong> portal.
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading && logs.length === 0 && !stats) return <SkeletonLoader count={1} height={400} />;

  const expandedLog = expandedId ? logs.find(l => l._id === expandedId) : null;

  return (
    <div className="glass-panel p-xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-lg" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={22} style={{ color: '#0F766E' }} />
            Email Delivery Logs
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Monitor all outgoing emails — verification, password resets, and notifications with delivery status.
          </p>
        </div>
        <button
          onClick={() => { fetchLogs(1); fetchStats(); }}
          className="btn btn-outline"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{ display: 'flex', gap: '14px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <StatCard icon={Mail} label="Total Emails" value={stats.total} color="#0F766E" />
          <StatCard icon={CheckCircle} label="Delivered" value={stats.sent} color="#10B981" subtext={`${stats.successRate}% success rate`} />
          <StatCard icon={Clock} label="Pending" value={stats.pending + stats.processing} color="#D97706" subtext={stats.processing > 0 ? `${stats.processing} sending now` : ''} />
          <StatCard icon={XCircle} label="Failed" value={stats.failed} color="#EF4444" subtext={stats.failed > 0 ? `Avg ${stats.avgAttempts} attempts` : ''} />
        </div>
      )}

      {/* Filter Bar */}
      <div style={{
        display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap',
        padding: '16px 20px', borderRadius: '14px',
        background: 'var(--bg-card)', border: '1px solid var(--border-color)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.82rem', fontWeight: 600 }}>
          <Filter size={15} /> Filters
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className="form-input"
            style={{ padding: '6px 10px', fontSize: '0.82rem', width: '160px' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className="form-input"
            style={{ padding: '6px 10px', fontSize: '0.82rem', width: '160px' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Status</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="form-input"
            style={{ padding: '6px 10px', fontSize: '0.82rem', width: '140px', cursor: 'pointer' }}
          >
            <option value="">All Statuses</option>
            <option value="SENT">Delivered</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Sending</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Type</label>
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="form-input"
            style={{ padding: '6px 10px', fontSize: '0.82rem', width: '150px', cursor: 'pointer' }}
          >
            <option value="">All Types</option>
            <option value="VERIFICATION">Verification</option>
            <option value="PASSWORD_RESET">Password Reset</option>
            <option value="NOTIFICATION">Notification</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: '180px' }}>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Search</label>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input
              type="text"
              placeholder="Name, email, or title..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="form-input"
              style={{ paddingLeft: '32px', fontSize: '0.82rem', width: '100%' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleSearch}
            className="btn btn-primary"
            style={{ padding: '7px 18px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Search size={14} /> Search
          </button>
          <button
            onClick={handleClearFilters}
            className="btn btn-outline"
            style={{ padding: '7px 14px', fontSize: '0.82rem' }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Detail Panel (shown when a row is expanded) */}
      {expandedLog && <DetailPanel log={expandedLog} />}

      {/* Data Table */}
      {loading ? (
        <SkeletonLoader count={1} height={300} />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={logs}
            searchable={false}
            pageSize={limit}
            emptyTitle="No email logs found"
            emptyMessage="Adjust your date range or filters to view delivery logs."
          />

          {/* Server-side Pagination */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginTop: '20px', padding: '14px 18px',
              background: 'rgba(255,255,255,0.01)', borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalItems} total emails)
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-sm btn-outline"
                  disabled={page <= 1}
                  onClick={() => fetchLogs(page - 1)}
                  style={{ padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <ChevronLeft size={15} /> Prev
                </button>
                <button
                  className="btn btn-sm btn-outline"
                  disabled={page >= totalPages}
                  onClick={() => fetchLogs(page + 1)}
                  style={{ padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  Next <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EmailLogsTab;
