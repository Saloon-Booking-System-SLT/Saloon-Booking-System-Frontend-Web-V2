import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ProtectedRoute from './ProtectedRoute';

const ApprovedOwnerRoute = ({ children }) => {
  const { user } = useAuth();
  
  // First check if user is authenticated and is an owner
  if (!user || user.role !== 'owner') {
    return <Navigate to="/OwnerLogin" replace />;
  }
  
  // If owner is not approved, redirect to dashboard where they'll see the pending message
  if (user.approvalStatus !== 'approved') {
    return <Navigate to="/dashboard" replace />;
  }
  
  // If approved, show the protected content
  return <ProtectedRoute requiredRole="owner">{children}</ProtectedRoute>;
};

export default ApprovedOwnerRoute;