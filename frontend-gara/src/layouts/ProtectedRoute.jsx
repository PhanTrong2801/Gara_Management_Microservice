import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    // Not logged in
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles) {
    const userRole = role ? role.toUpperCase() : '';
    const upperAllowed = allowedRoles.map(r => r.toUpperCase());
    
    if (!upperAllowed.includes(userRole)) {
      // Logged in but doesn't have the right role
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;
