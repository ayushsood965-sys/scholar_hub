import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { Smartphone, Monitor, Tablet, Globe, Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

const AppInstallLogsTab = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  
  const api = useApi();
  const toast = useToast();
  const limit = 10;

  const fetchLogs = async (currentPage = 1) => {
    try {
      setLoading(true);
      const res = await api.get(`/install-logs?page=${currentPage}&limit=${limit}`);
      setLogs(res.data.logs || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalItems(res.data.pagination?.totalItems || 0);
      setPage(currentPage);
    } catch (err) {
      toast.error('Failed to load PWA installation logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, []);

  const handleRefresh = () => {
    fetchLogs(1);
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone size={16} style={{ color: '#0F766E' }} />;
      case 'tablet':
        return <Tablet size={16} style={{ color: '#0F766E' }} />;
      default:
        return <Monitor size={16} style={{ color: '#0F766E' }} />;
    }
  };

  // Filter logs locally based on search term
  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase();
    const nameMatch = log.userInfo?.name?.toLowerCase().includes(term);
    const emailMatch = log.userInfo?.email?.toLowerCase().includes(term);
    const portalMatch = log.portal?.toLowerCase().includes(term);
    const targetMatch = log.targetApp?.toLowerCase().includes(term);
    const osMatch = log.operatingSystem?.toLowerCase().includes(term);
    const browserMatch = log.browserName?.toLowerCase().includes(term);
    const countryMatch = log.location?.country?.toLowerCase().includes(term);
    const cityMatch = log.location?.city?.toLowerCase().includes(term);
    const ipMatch = log.ipAddress?.includes(term);

    return nameMatch || emailMatch || portalMatch || targetMatch || osMatch || browserMatch || countryMatch || cityMatch || ipMatch;
  });

  const columns = [
    {
      header: 'Timestamp',
      accessor: (row) => (
        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          {new Date(row.createdAt).toLocaleString()}
        </span>
      )
    },
    {
      header: 'User Details',
      accessor: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.userInfo?.name}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{row.userInfo?.email}</div>
          <span style={{
            fontSize: '0.62rem',
            fontWeight: 700,
            padding: '1px 5px',
            borderRadius: '4px',
            textTransform: 'uppercase',
            background: row.userInfo?.name === 'Anonymous' ? 'rgba(100, 116, 139, 0.1)' : 'rgba(15, 118, 110, 0.1)',
            color: row.userInfo?.name === 'Anonymous' ? '#64748B' : '#0F766E',
            border: `1px solid ${row.userInfo?.name === 'Anonymous' ? 'rgba(100, 116, 139, 0.2)' : 'rgba(15, 118, 110, 0.2)'}`,
            display: 'inline-block',
            marginTop: '4px'
          }}>
            {row.userInfo?.role === 'N/A' ? 'Visitor' : row.userInfo?.role}
          </span>
        </div>
      )
    },
    {
      header: 'Flow Context',
      accessor: (row) => (
        <div style={{ fontSize: '0.82rem' }}>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>From:</span>{' '}
            <strong style={{ color: 'var(--text-primary)' }}>
              {row.portal === 'SCHOLAR_HUB' ? 'ScholarHub Landing' : row.portal === 'SCHOLAR_SYNC' ? 'ScholarSync' : 'ScholarTrack'}
            </strong>
          </div>
          <div style={{ marginTop: '2px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Target:</span>{' '}
            <strong style={{ color: 'var(--text-primary)' }}>
              {row.targetApp === 'SCHOLAR_SYNC' ? 'ScholarSync' : 'ScholarTrack'}
            </strong>
          </div>
          <span style={{
            fontSize: '0.65rem',
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: '4px',
            background: row.installType === 'Native' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
            color: row.installType === 'Native' ? '#10B981' : '#D97706',
            border: `1px solid ${row.installType === 'Native' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
            display: 'inline-block',
            marginTop: '4px'
          }}>
            {row.installType} Install
          </span>
        </div>
      )
    },
    {
      header: 'Device & OS',
      accessor: (row) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {getDeviceIcon(row.deviceType)}
            <span>{row.operatingSystem}</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {row.browserName} ({row.screenResolution || 'Unknown Res'})
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px', fontStyle: 'italic' }}>
            Lang: {row.language || 'N/A'} | TZ: {row.timezone || 'N/A'}
          </div>
        </div>
      )
    },
    {
      header: 'IP & Location',
      accessor: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Globe size={14} style={{ color: '#0F766E' }} />
            <span>{row.ipAddress}</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {row.location?.city ? `${row.location.city}, ` : ''}
            {row.location?.region ? `${row.location.region}, ` : ''}
            <strong>{row.location?.country || 'Unknown Location'}</strong>
          </div>
        </div>
      )
    }
  ];

  if (loading && logs.length === 0) return <SkeletonLoader count={1} height={400} />;

  return (
    <div className="glass-panel p-xl">
      <div className="flex justify-between items-center mb-lg">
        <div>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>
            📲 App Installation Logs
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Monitor installation attempts, device properties, locales, and geographic coordinates of user installs.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="btn btn-outline"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}
        >
          <RefreshCw size={16} /> Refresh Logs
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        alignItems: 'center', 
        background: 'var(--bg-input)', 
        padding: '10px 16px', 
        borderRadius: '12px', 
        border: '1px solid var(--border-color)',
        marginBottom: '24px'
      }}>
        <Search size={18} color="var(--text-secondary)" />
        <input 
          type="text" 
          placeholder="Filter by name, email, portal, OS, browser, IP or location..." 
          value={searchTerm} 
          onChange={e => setSearchTerm(e.target.value)}
          style={{ border: 'none', background: 'none', outline: 'none', width: '100%', color: 'var(--text-primary)' }}
        />
      </div>

      <DataTable columns={columns} data={filteredLogs} />

      {/* Pagination Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '24px',
        padding: '16px 20px',
        background: 'rgba(255,255,255,0.01)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Showing page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalItems} total logs)
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-sm btn-outline"
            disabled={page <= 1}
            onClick={() => fetchLogs(page - 1)}
            style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <ChevronLeft size={16} /> Prev
          </button>
          <button
            className="btn btn-sm btn-outline"
            disabled={page >= totalPages}
            onClick={() => fetchLogs(page + 1)}
            style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppInstallLogsTab;
