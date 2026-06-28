import React, { useEffect, useState } from 'react';
import { X, Users, AlertTriangle } from 'lucide-react';
import useApi from '../../hooks/useApi';
import SkeletonLoader from '../../components/ui/SkeletonLoader';

const DrillDownModal = ({ view, id, name, onClose }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const api = useApi();

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/attendance/dashboard/hod/drill-down', {
          params: { view, id }
        });
        setData(res.data);
      } catch (err) {
        console.error('Failed to load drill down details', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [view, id, api]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.65)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '700px',
        maxHeight: '90vh',
        overflowY: 'auto',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'relative'
      }}>
        <button 
          onClick={onClose} 
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255,255,255,0.05)',
            border: 'none',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            borderRadius: '50%',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10
          }}
          title="Close details"
        >
          <X size={18} />
        </button>

        <div style={{ padding: '32px' }}>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={22} style={{ color: 'var(--color-primary)' }} />
            {view === 'faculty' ? 'Faculty Member Drill-Down' : 'Course Drill-Down'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
            Showing students registered under: <strong>{name}</strong>
          </p>

          {loading ? (
            <SkeletonLoader count={3} height={50} />
          ) : data.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No scholars found for this selection.
            </div>
          ) : (
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Scholar Name</th>
                    <th>Enrollment No.</th>
                    <th>Attendance %</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((stud, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{stud.studentName}</td>
                      <td>{stud.enrollmentNumber}</td>
                      <td style={{ fontWeight: 'bold', color: stud.isDefaulter ? 'var(--status-absent)' : 'var(--status-present)' }}>
                        {stud.percentage}%
                      </td>
                      <td>
                        {stud.isDefaulter ? (
                          <span className="badge badge-danger">Defaulter</span>
                        ) : (
                          <span className="badge badge-success">Good</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DrillDownModal;
