import React, { useState, useEffect } from 'react';
import useApi from '../../hooks/useApi';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/ui/DataTable';
import SkeletonLoader from '../../components/ui/SkeletonLoader';
import { CheckCircle, XCircle } from 'lucide-react';

const ApprovalsTab = () => {
  const [leaves, setLeaves] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('leaves'); // leaves | corrections
  
  const api = useApi();
  const toast = useToast();

  const fetchApprovals = async () => {
    try {
      const [leaveRes, corrRes] = await Promise.all([
        api.get('/attendance/leave/pending'),
        api.get('/attendance/corrections/pending')
      ]);
      setLeaves(leaveRes.data);
      setCorrections(corrRes.data);
    } catch (err) {
      toast.error('Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApprovals(); }, []);

  const handleLeaveAction = async (id, action) => {
    try {
      await api.put(`/attendance/leave/${id}/action`, { action, remarks: `HOD ${action}` });
      toast.success(`Leave ${action.toLowerCase()} successfully`);
      fetchApprovals();
    } catch (err) {
      toast.error('Error processing leave');
    }
  };

  const handleCorrectionAction = async (id, action) => {
    try {
      await api.put(`/attendance/corrections/${id}/action`, { action, remarks: `HOD ${action}` });
      toast.success(`Correction ${action.toLowerCase()} successfully`);
      fetchApprovals();
    } catch (err) {
      toast.error('Error processing correction');
    }
  };

  const leaveColumns = [
    { header: 'Student Name', accessor: (row) => row.studentId?.name || 'Unknown' },
    { header: 'Leave Type', accessor: 'leaveType' },
    { header: 'Dates', accessor: (row) => `${new Date(row.startDate).toLocaleDateString()} - ${new Date(row.endDate).toLocaleDateString()}` },
    { header: 'Reason', accessor: 'reason' },
    {
      header: 'Actions',
      accessor: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-sm" style={{ background: '#10B981', color: '#fff' }} onClick={() => handleLeaveAction(row._id, 'APPROVE')}>
            <CheckCircle size={16} />
          </button>
          <button className="btn btn-sm" style={{ background: '#EF4444', color: '#fff' }} onClick={() => handleLeaveAction(row._id, 'REJECT')}>
            <XCircle size={16} />
          </button>
        </div>
      )
    }
  ];

  const correctionColumns = [
    { header: 'Student Name', accessor: (row) => row.studentId?.name || 'Unknown' },
    { header: 'Record Date', accessor: (row) => row.recordId?.date ? new Date(row.recordId.date).toLocaleDateString() : 'Unknown' },
    { header: 'Requested Status', accessor: 'requestedStatus' },
    { header: 'Reason', accessor: 'reason' },
    {
      header: 'Actions',
      accessor: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-sm" style={{ background: '#10B981', color: '#fff' }} onClick={() => handleCorrectionAction(row._id, 'APPROVE')}>
            <CheckCircle size={16} />
          </button>
          <button className="btn btn-sm" style={{ background: '#EF4444', color: '#fff' }} onClick={() => handleCorrectionAction(row._id, 'REJECT')}>
            <XCircle size={16} />
          </button>
        </div>
      )
    }
  ];

  if (loading) return <SkeletonLoader count={1} height={400} />;

  return (
    <div className="glass-panel p-xl">
      <div className="mb-lg">
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Pending Approvals</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Approve or reject leaves and attendance corrections.</p>
      </div>

      <div className="tab-header mb-lg" style={{ display: 'flex', gap: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
        <button 
          className={`tab-btn ${activeSubTab === 'leaves' ? 'active' : ''}`} 
          style={{ background: 'none', border: 'none', color: activeSubTab === 'leaves' ? '#3B82F6' : 'var(--text-secondary)', fontWeight: activeSubTab === 'leaves' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '1rem' }}
          onClick={() => setActiveSubTab('leaves')}
        >
          Leave Requests ({leaves.length})
        </button>
        <button 
          className={`tab-btn ${activeSubTab === 'corrections' ? 'active' : ''}`} 
          style={{ background: 'none', border: 'none', color: activeSubTab === 'corrections' ? '#3B82F6' : 'var(--text-secondary)', fontWeight: activeSubTab === 'corrections' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '1rem' }}
          onClick={() => setActiveSubTab('corrections')}
        >
          Corrections ({corrections.length})
        </button>
      </div>

      {activeSubTab === 'leaves' ? (
        <DataTable columns={leaveColumns} data={leaves} />
      ) : (
        <DataTable columns={correctionColumns} data={corrections} />
      )}
    </div>
  );
};

export default ApprovalsTab;
