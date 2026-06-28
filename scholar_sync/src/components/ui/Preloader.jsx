import React from 'react';

const Preloader = ({ text = 'Loading data...', padding = '60px 20px' }) => {
  return (
    <div className="premium-preloader-container" style={{ padding }}>
      <div className="premium-preloader-spinner"></div>
      <div className="premium-preloader-text">{text}</div>
    </div>
  );
};

export default Preloader;
