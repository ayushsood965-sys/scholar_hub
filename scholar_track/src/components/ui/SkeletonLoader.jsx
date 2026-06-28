import React from 'react';

const SkeletonLoader = ({ type = 'card', count = 1 }) => {
  return (
    <div className="premium-preloader-container" style={{ padding: '60px 20px' }}>
      <div className="premium-preloader-spinner"></div>
      <div className="premium-preloader-text">Loading workspace details...</div>
    </div>
  );
};

export default SkeletonLoader;
