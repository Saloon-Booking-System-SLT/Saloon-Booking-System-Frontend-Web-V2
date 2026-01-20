import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from './ProtectedRoute';

const ApprovedOwnerRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (user?.role === 'owner' && user.approvalStatus !== 'approved') {
    return <Navigate to="/dashboard" replace />;
  }

  return <ProtectedRoute requiredRole="owner">{children}</ProtectedRoute>;
};

export default ApprovedOwnerRoute;