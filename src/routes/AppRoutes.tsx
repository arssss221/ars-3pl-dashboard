import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase/config';

import Layout from '../components/common/Layout';
import ProtectedRoute from '../components/common/ProtectedRoute';

// --- Features ---
import Login from '../features/auth/Login';
import Unauthorized from '../features/auth/Unauthorized';
import Dashboard from '../features/dashboard/Dashboard';
import Employees from '../features/employees/Employees';
import Transaction from '../features/transactions/Transaction';
import IDManager from '../features/id_manager/IDManager';

// --- Profile & Settings (আপনার নতুন পাথ অনুযায়ী) ---
import Profile from '../features/profile/Profile';
import Permissions from '../features/profile/Permissions';
import Settings from '../features/profile/Settings';

// --- Vehicles ---
import OilChanges from '../features/vehicles/OilChanges';
import Servicing from '../features/vehicles/Servicing';
import Accidents from '../features/vehicles/Accidents';
import EmployeeDetail from '../features/employees/EmployeeDetail';

export default function AppRoutes() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      const sessionData = localStorage.getItem('userSession');
      if (firebaseUser && sessionData) {
        setUser(JSON.parse(sessionData));
      } else {
        localStorage.removeItem('userSession');
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <Login />}
        />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* মেইন ড্যাশবোর্ড লেআউট */}
        <Route
          path="/"
          element={user ? <Layout /> : <Navigate to="/login" replace />}
        >
          <Route index element={<Dashboard />} />

          {/* প্রোফাইল এবং সেটিংস রাউটগুলো */}
          <Route path="profile" element={<Profile />} />
          <Route path="permissions" element={<Permissions />} />
          <Route path="settings" element={<Settings />} />

          {/* Employees Route */}
          <Route element={<ProtectedRoute requiredPermission="employees" />}>
          <Route path="employees" element={<Employees />} />
          <Route path="employees/:id" element={<EmployeeDetail />} />
          </Route>

          {/* Vehicles Routes */}
          <Route element={<ProtectedRoute requiredPermission="vehicles" />}>
            <Route path="vehicles">
              <Route path="oil" element={<OilChanges />} />
              <Route path="servicing" element={<Servicing />} />
              <Route path="accidents" element={<Accidents />} />
              <Route index element={<Navigate to="oil" replace />} />
            </Route>
          </Route>

          {/* ID Manager Route */}
          <Route element={<ProtectedRoute requiredPermission="id_manager" />}>
            <Route path="id-manager" element={<IDManager />} />
          </Route>

          {/* Transaction Route */}
          <Route element={<ProtectedRoute requiredPermission="transaction" />}>
            <Route path="transaction" element={<Transaction />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
