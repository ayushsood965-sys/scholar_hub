import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="premium-preloader-container" style={{ minHeight: '100vh', justifyContent: 'center' }}>
        <div className="premium-preloader-spinner"></div>
        <div className="premium-preloader-text">Authenticating session...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their appropriate dashboard if they try to access another role's route
    if (user.role === 'SUPER_ADMIN') return <Navigate to="/super-dashboard" />;
    if (user.role === 'ADMIN' || user.role === 'HOD') return <Navigate to="/admin-dashboard" />;
    if (user.role === 'FACULTY') return <Navigate to="/faculty-dashboard" />;
    return <Navigate to="/student-dashboard" />;
  }

  return children;
};

export default ProtectedRoute;
