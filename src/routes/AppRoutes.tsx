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
import ProgressReport from '../features/progress_report/ProgressReport';
import DailyReport from '../features/progress_report/DailyReport';
import MonthlyReport from '../features/progress_report/MonthlyReport';
import SalarySheet from '../features/accounts_salary/SalarySheet';
import PaidHistory from '../features/accounts_salary/PaidHistory';

// --- Profile & Settings ---
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

        {/* Main dashboard layout */}
        <Route
          path="/"
          element={user ? <Layout /> : <Navigate to="/login" replace />}
        >
          <Route index element={<Dashboard />} />

          {/* Profile and settings routes */}
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

          <Route path="progress-report">
            <Route index element={<ProgressReport />} />
            <Route path="daily-report" element={<DailyReport />} />
            <Route path="monthly-report" element={<MonthlyReport />} />
          </Route>

          <Route path="accounts-salary">
            <Route index element={<Navigate to="salary-sheet" replace />} />
            <Route path="salary-sheet" element={<SalarySheet />} />
            <Route path="paid-history" element={<PaidHistory />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
