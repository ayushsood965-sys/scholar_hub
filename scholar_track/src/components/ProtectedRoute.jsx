import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="premium-preloader-container">
        <div className="premium-preloader-spinner" />
        <div className="premium-preloader-text">Authenticating session...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const dashMap = {
      SUPER_ADMIN: '/super-dashboard',
      HOD: '/hod-dashboard',
      ADMIN: '/hod-dashboard',
      FACULTY: '/faculty-dashboard',
      STUDENT: '/student-dashboard',
    };
    return <Navigate to={dashMap[user.role] ?? '/student-dashboard'} />;
  }

  return children;
};

export default ProtectedRoute;
