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
import PaidTransactions from '../features/transactions/PaidTransactions';
import IDManager from '../features/id_manager/IDManager';

// --- Profile & Settings (আপনার নতুন পাথ অনুযায়ী) ---
import Profile from '../features/profile/Profile';
import Permissions from '../features/profile/Permissions';
import Settings from '../features/profile/Settings';

// --- Vehicles ---
import OilChanges from '../features/vehicles/OilChanges';
import Servicing from '../features/vehicles/Servicing';
import Accidents from '../features/vehicles/Accidents';
import Vehicles from '../features/vehicles/Vehicles';
import VehicleDetail from '../features/vehicles/VehicleDetail';
import EmployeeDetail from '../features/employees/EmployeeDetail';

const getStoredUser = () => {
  const sessionData = localStorage.getItem('userSession');
  if (!sessionData) return null;

  try {
    return JSON.parse(sessionData);
  } catch {
    localStorage.removeItem('userSession');
    return null;
  }
};

export default function AppRoutes() {
  const [user, setUser] = useState<any>(() => getStoredUser());
  const [loading, setLoading] = useState(() => !getStoredUser());

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      setLoading(false);
    }

    const authFallback = window.setTimeout(() => {
      setUser(getStoredUser());
      setLoading(false);
    }, 1800);

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      window.clearTimeout(authFallback);
      const latestStoredUser = getStoredUser();

      if (firebaseUser && latestStoredUser) {
        setUser(latestStoredUser);
      } else {
        setUser(latestStoredUser);
      }
      setLoading(false);
    });

    return () => {
      window.clearTimeout(authFallback);
      unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-emerald-400/20 border-b-emerald-400"></div>
          <p className="mt-4 text-[11px] font-black uppercase tracking-[0.3em] text-emerald-200">
            Loading ARS Control
          </p>
        </div>
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
              <Route index element={<Vehicles />} />
              <Route path=":id" element={<VehicleDetail />} />
              <Route path="oil" element={<OilChanges />} />
              <Route path="servicing" element={<Servicing />} />
              <Route path="accidents" element={<Accidents />} />
            </Route>
          </Route>

          {/* ID Manager Route */}
          <Route element={<ProtectedRoute requiredPermission="id_manager" />}>
            <Route path="id-manager" element={<IDManager />} />
          </Route>

          {/* Transaction Route */}
          <Route element={<ProtectedRoute requiredPermission="transaction" />}>
            <Route path="transaction">
              <Route index element={<Transaction />} />
              <Route path="paid" element={<PaidTransactions />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
