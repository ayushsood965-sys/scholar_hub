import React from 'react';

const SkeletonLoader = ({ type = 'card', count = 1 }) => {
  const items = Array.from({ length: count }, (_, i) => i);

  if (type === 'stats') {
    return (
      <div className="grid-auto">
        {items.map(i => (
          <div key={i} className="glass-panel" style={{ padding: '24px' }}>
            <div className="flex items-center justify-between mb-md">
              <div className="skeleton skeleton-avatar" />
              <div className="skeleton" style={{ width: '60px', height: '20px' }} />
            </div>
            <div className="skeleton skeleton-title" style={{ width: '40%' }} />
            <div className="skeleton skeleton-text short" />
          </div>
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className="data-table-wrapper">
        <div style={{ padding: '16px' }}>
          {items.map(i => (
            <div key={i} className="flex items-center gap-md" style={{ padding: '14px 0', borderBottom: '1px solid var(--color-border)' }}>
              <div className="skeleton skeleton-avatar" />
              <div style={{ flex: 1 }}>
                <div className="skeleton skeleton-text medium" />
                <div className="skeleton skeleton-text short" />
              </div>
              <div className="skeleton" style={{ width: '80px', height: '24px', borderRadius: '20px' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'ring') {
    return (
      <div className="flex items-center justify-center" style={{ padding: '40px' }}>
        <div className="skeleton skeleton-ring" />
      </div>
    );
  }

  return (
    <div className="grid-auto">
      {items.map(i => (
        <div key={i} className="skeleton skeleton-card" />
      ))}
    </div>
  );
};

export default SkeletonLoader;
