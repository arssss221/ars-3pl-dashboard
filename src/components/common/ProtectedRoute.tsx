import { Navigate, Outlet, useOutletContext } from 'react-router-dom';

export default function ProtectedRoute({ requiredPermission }: { requiredPermission: string }) {
  const outletContext = useOutletContext();
  const sessionData = localStorage.getItem('userSession');
  if (!sessionData) return <Navigate to="/login" replace />;

  const user = JSON.parse(sessionData);
  const permissions = user.permissions || {};

  if (user.role === 'owner' || permissions[requiredPermission] === true) {
    return <Outlet context={outletContext} />;
  }
  return <Navigate to="/unauthorized" replace />;
}
