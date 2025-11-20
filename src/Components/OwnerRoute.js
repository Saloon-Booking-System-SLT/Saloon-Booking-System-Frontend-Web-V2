// Components/OwnerRoute.js
import ProtectedRoute from './ProtectedRoute';

const OwnerRoute = ({ children }) => {
  return (
    <ProtectedRoute requiredRole="owner">
      {children}
    </ProtectedRoute>
  );
};

export default OwnerRoute;