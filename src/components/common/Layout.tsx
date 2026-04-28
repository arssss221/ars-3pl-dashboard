import { useState, useEffect, type ReactNode } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { auth } from '../../services/firebase/config';
import {
  LayoutDashboard,
  Users,
  Car,
  CreditCard,
  UserSquare,
  LogOut,
  Package,
  ChevronDown,
  User,
  Settings,
  Droplets,
  Wrench,
  AlertTriangle,
  Search,
  Bell,
  Shield,
  X,
  CheckCircle,
  FileWarning,
  Moon,
  Sun,
  Languages,
  CheckCheck,
} from 'lucide-react';
import {
  employeeSeeds,
  getEmployeeDisplayName,
} from '../../features/employees/employeeData';
import { vehicleSeeds } from '../../features/vehicles/vehicleData';
import {
  applyDomTranslations,
  resetDomTranslationMemory,
  restoreDomTranslations,
} from '../../i18n/domTranslator';

const getDaysUntil = (dateStr: string) => {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  if (Number.isNaN(target.getTime())) return null;
  return Math.floor((target.getTime() - today.getTime()) / 86400000);
};

type ThemeMode = 'light' | 'dark';
type LanguageMode = 'en' | 'ar';
type NotificationTone = 'red' | 'amber' | 'blue' | 'emerald' | 'slate';

interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  path: string;
  tone: NotificationTone;
  icon: ReactNode;
}

interface CompanyProfileShell {
  englishName: string;
  arabicName: string;
  logo: string;
}

const defaultCompanyProfile: CompanyProfileShell = {
  englishName: 'ARS Logistics Manager',
  arabicName: 'شركة ايه آر إس للخدمات اللوجستية',
  logo: '',
};

const loadCompanyProfile = (): CompanyProfileShell => {
  try {
    const stored = localStorage.getItem('ars-company-profile');
    return stored
      ? { ...defaultCompanyProfile, ...JSON.parse(stored) }
      : defaultCompanyProfile;
  } catch {
    return defaultCompanyProfile;
  }
};

const getCompanyInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'AR';

export default function Layout() {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const sessionData = localStorage.getItem('userSession');
  const user = sessionData ? JSON.parse(sessionData) : null;
  const permissions = user?.permissions || {};
  const shouldExpandSidebar = () =>
    window.innerWidth >= 1024 && window.innerWidth < 1536;

  const translateTerm = (term: string, language: LanguageMode) => {
    const bundle = i18n.getResourceBundle(language, 'translation') as
      | { terms?: Record<string, string> }
      | undefined;
    return bundle?.terms?.[term] ?? term;
  };

  const getPageTitle = (language: LanguageMode) => {
    const path = location.pathname;
    if (path === '/') return translateTerm('Dashboard', language);
    const segments = path.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    if (segments[0] === 'employees') {
      if (segments.length === 1) return translateTerm('Employees', language);
      const employee = employeeSeeds.find((item) => String(item.id) === last);
      return employee
        ? `${employee.idNumber}. ${translateTerm('Details', language)} ${getEmployeeDisplayName(employee, language)}`
        : translateTerm('Employees', language);
    }
    if (segments[0] === 'vehicles') {
      if (segments.length === 1) return translateTerm('Vehicles', language);
      if (last === 'oil') return translateTerm('Oil Changes', language);
      if (last === 'servicing') return translateTerm('Servicing', language);
      if (last === 'accidents') return translateTerm('Accidents', language);
      const vehicle = vehicleSeeds.find((item) => String(item.id) === last);
      return vehicle
        ? `${translateTerm('Vehicle Detail', language)} - ${vehicle.vehicleNumber}`
        : translateTerm('Vehicle Detail', language);
    }
    if (segments[0] === 'transaction') {
      if (last === 'paid') return translateTerm('Paid Transactions', language);
      return translateTerm('Transaction', language);
    }
    if (last === 'id-manager') return translateTerm('ID Manager', language);
    if (last === 'profile') return translateTerm('Company Profile', language);
    if (last === 'permissions') return translateTerm('Permissions', language);
    if (last === 'settings') return translateTerm('Settings', language);
    const fallbackTitle = last
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
    return translateTerm(fallbackTitle, language);
  };

  const [isCollapsed, setIsCollapsed] = useState(!shouldExpandSidebar());
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() =>
    localStorage.getItem('ars-theme') === 'dark' ? 'dark' : 'light'
  );
  const [languageMode, setLanguageMode] = useState<LanguageMode>(() =>
    localStorage.getItem('ars-language') === 'ar' ? 'ar' : 'en'
  );
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(
    () => {
      try {
        const stored = localStorage.getItem('ars-read-notifications');
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
  );
  const [globalSearch, setGlobalSearch] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [dynamicTitle, setDynamicTitle] = useState(() =>
    getPageTitle(localStorage.getItem('ars-language') === 'ar' ? 'ar' : 'en')
  );
  const [companyProfile, setCompanyProfile] =
    useState<CompanyProfileShell>(() => loadCompanyProfile());
  const isRtl = languageMode === 'ar';
  const companyDisplayName =
    languageMode === 'ar'
      ? companyProfile.arabicName || companyProfile.englishName
      : companyProfile.englishName;

  useEffect(() => {
    setDynamicTitle(getPageTitle(languageMode));
  }, [i18n.language, languageMode, location.pathname]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', themeMode === 'dark');
    localStorage.setItem('ars-theme', themeMode);
  }, [themeMode]);

  useEffect(() => {
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', isRtl ? 'ar' : 'en');
    localStorage.setItem('ars-language', languageMode);
    void i18n.changeLanguage(languageMode);
  }, [i18n, isRtl, languageMode]);

  useEffect(() => {
    localStorage.setItem(
      'ars-read-notifications',
      JSON.stringify(readNotificationIds)
    );
  }, [readNotificationIds]);

  useEffect(() => {
    const syncCompanyProfile = () => setCompanyProfile(loadCompanyProfile());
    const handleCompanyProfileUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<CompanyProfileShell>;
      setCompanyProfile({
        ...defaultCompanyProfile,
        ...customEvent.detail,
      });
    };

    window.addEventListener('storage', syncCompanyProfile);
    window.addEventListener(
      'ars-company-profile-updated',
      handleCompanyProfileUpdate as EventListener
    );
    return () => {
      window.removeEventListener('storage', syncCompanyProfile);
      window.removeEventListener(
        'ars-company-profile-updated',
        handleCompanyProfileUpdate as EventListener
      );
    };
  }, []);

  useEffect(() => {
    const handleResize = () => setIsCollapsed(!shouldExpandSidebar());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setGlobalSearch('');
    setIsSearchExpanded(false);
    if (location.pathname.startsWith('/vehicles')) {
      setOpenSubmenu('vehicles');
      return;
    }
    if (location.pathname.startsWith('/transaction')) {
      setOpenSubmenu('transaction');
      return;
    }
    if (openSubmenu === 'vehicles') {
      setOpenSubmenu(null);
    }
    if (openSubmenu === 'transaction') {
      setOpenSubmenu(null);
    }
  }, [location.pathname, openSubmenu]);

  const hasAccess = (permission: string) => {
    if (user?.role === 'owner') return true;
    return permissions[permission] === true;
  };

  const isVehiclesActive = location.pathname.startsWith('/vehicles');
  const isTransactionActive = location.pathname.startsWith('/transaction');
  const notificationSummary = {
    paperRisks: employeeSeeds.filter(
      (employee) =>
        employee.agreement === 'Not Complete' ||
        employee.commitment === 'Not Complete' ||
        !employee.healthInsuranceName ||
        !employee.healthInsuranceExpiry
    ).length,
    iqamaRisks: employeeSeeds.filter((employee) => {
      const days = getDaysUntil(employee.iqamaExpiry);
      return days !== null && days <= 30;
    }).length,
    fleetRisks: vehicleSeeds.filter((vehicle) => {
      const insurance = getDaysUntil(vehicle.insuranceExpiry);
      const permit = getDaysUntil(vehicle.roadPermitExpiry);
      const auth = getDaysUntil(vehicle.authExpiryDate);
      return [insurance, permit, auth].some(
        (days) => days !== null && days <= 30
      );
    }).length,
    paymentDue: 1930,
    serviceQueue: 5,
  };
  const notificationMessages: AppNotification[] = [
    notificationSummary.paperRisks > 0
      ? {
          id: 'paper-risk',
          title: 'Rider papers need review',
          message: `${notificationSummary.paperRisks} rider profiles have incomplete agreement, commitment, or insurance data.`,
          time: 'Just now',
          path: '/employees',
          tone: 'red',
          icon: <FileWarning size={18} />,
        }
      : null,
    notificationSummary.iqamaRisks > 0
      ? {
          id: 'iqama-risk',
          title: 'Iqama expiry window is active',
          message: `${notificationSummary.iqamaRisks} riders are expired or within 30 days of expiry.`,
          time: '5 min ago',
          path: '/employees',
          tone: 'amber',
          icon: <Shield size={18} />,
        }
      : null,
    notificationSummary.fleetRisks > 0
      ? {
          id: 'fleet-risk',
          title: 'Fleet documents need action',
          message: `${notificationSummary.fleetRisks} vehicles have permit, insurance, or authorization risk.`,
          time: '12 min ago',
          path: '/vehicles',
          tone: 'blue',
          icon: <Car size={18} />,
        }
      : null,
    {
      id: 'ledger-balance',
      title: 'Outstanding ledger balance',
      message: `${notificationSummary.paymentDue} SAR remains open in rider transactions.`,
      time: 'Today',
      path: '/transaction',
      tone: 'emerald',
      icon: <CreditCard size={18} />,
    },
    {
      id: 'service-queue',
      title: 'Servicing queue waiting',
      message: `${notificationSummary.serviceQueue} vehicle workflow items are waiting for next action.`,
      time: 'Today',
      path: '/vehicles/servicing',
      tone: 'slate',
      icon: <Wrench size={18} />,
    },
    ...employeeSeeds
      .map((employee) => ({
        employee,
        days: getDaysUntil(employee.iqamaExpiry),
      }))
      .filter(({ days }) => days !== null && days <= 30)
      .map(({ employee, days }) => ({
        id: `employee-iqama-${employee.id}`,
        title: `${getEmployeeDisplayName(employee, languageMode)} iqama follow-up`,
        message:
          days !== null && days < 0
            ? 'Iqama already expired. Please update the rider profile.'
            : `${days} day${days === 1 ? '' : 's'} left before iqama expiry.`,
        time: 'Compliance',
        path: `/employees/${employee.id}`,
        tone: 'amber' as NotificationTone,
        icon: <Shield size={18} />,
      })),
    ...vehicleSeeds
      .filter((vehicle) => {
        const insurance = getDaysUntil(vehicle.insuranceExpiry);
        const permit = getDaysUntil(vehicle.roadPermitExpiry);
        const auth = getDaysUntil(vehicle.authExpiryDate);
        return [insurance, permit, auth].some(
          (days) => days !== null && days <= 30
        );
      })
      .map((vehicle) => ({
        id: `vehicle-risk-${vehicle.id}`,
        title: `${vehicle.vehicleNumber} needs review`,
        message: 'Permit, insurance, or authorization date needs attention.',
        time: 'Fleet',
        path: `/vehicles/${vehicle.id}`,
        tone: 'blue' as NotificationTone,
        icon: <Car size={18} />,
      })),
  ].filter((item): item is AppNotification => Boolean(item));
  const latestNotifications = notificationMessages.slice(0, 100);
  const unreadCount = latestNotifications.filter(
    (item) => !readNotificationIds.includes(item.id)
  ).length;

  const openFromNotification = (path: string, id?: string) => {
    if (id) {
      setReadNotificationIds((prev) =>
        prev.includes(id) ? prev : [...prev, id]
      );
    }
    setIsNotificationOpen(false);
    navigate(path);
  };

  const markNotificationsAsRead = () => {
    setReadNotificationIds((prev) =>
      Array.from(
        new Set([...prev, ...latestNotifications.map((item) => item.id)])
      )
    );
  };

  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;

    if (languageMode !== 'ar') {
      restoreDomTranslations(root);
      resetDomTranslationMemory();
      return;
    }

    resetDomTranslationMemory();

    const translateCurrentView = () => applyDomTranslations(root, languageMode);
    const animationFrame = window.requestAnimationFrame(translateCurrentView);
    const delayedTranslate = window.setTimeout(translateCurrentView, 60);

    const observer = new MutationObserver(translateCurrentView);
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'title', 'aria-label'],
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.clearTimeout(delayedTranslate);
      observer.disconnect();
    };
  }, [
    isNotificationOpen,
    languageMode,
    location.pathname,
    openSubmenu,
  ]);

  const handleLogout = async () => {
    await auth.signOut();
    localStorage.removeItem('userSession');
    navigate('/login');
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="ars-app-shell flex h-screen overflow-hidden font-sans relative transition-colors duration-300"
    >
      {/* Sidebar */}
      <div
        className={`ars-sidebar-shell text-white flex flex-col transition-all duration-300 ease-in-out shrink-0 z-20 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`flex h-16 items-center cursor-pointer transition-all border-b border-white/10 shrink-0 ${
            isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'
          }`}
        >
          {companyProfile.logo ? (
            <img
              src={companyProfile.logo}
              alt={companyDisplayName}
              className="h-8 w-8 shrink-0 rounded-xl border border-emerald-300/40 bg-white object-contain p-0.5 shadow-[0_0_18px_rgba(52,211,153,0.28)]"
            />
          ) : (
            <Package
              className="text-emerald-400 shrink-0 drop-shadow-[0_0_18px_rgba(52,211,153,0.38)]"
              size={isCollapsed ? 26 : 25}
            />
          )}
          {!isCollapsed && (
            <span className="truncate text-sm font-black tracking-tight text-white leading-tight">
              {companyDisplayName}
            </span>
          )}
        </div>

        <nav className="flex-1 py-3 space-y-1.5 overflow-y-auto overflow-x-hidden scrollbar-hide px-2">
          {hasAccess('dashboard') && (
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center rounded-2xl font-black transition-all ${
                  isCollapsed ? 'justify-center py-2.5' : 'gap-3 px-3 py-2.5'
                } ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_18px_38px_-26px_rgba(16,185,129,0.9)]'
                    : 'text-slate-400 hover:bg-white/7 hover:text-white'
                }`
              }
            >
              <LayoutDashboard size={18} />
              {!isCollapsed && <span className="text-sm">Dashboard</span>}
            </NavLink>
          )}

          {hasAccess('employees') && (
            <NavLink
              to="/employees"
              className={({ isActive }) =>
                `flex items-center rounded-2xl font-black transition-all ${
                  isCollapsed ? 'justify-center py-2.5' : 'gap-3 px-3 py-2.5'
                } ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_18px_38px_-26px_rgba(16,185,129,0.9)]'
                    : 'text-slate-400 hover:bg-white/7 hover:text-white'
                }`
              }
            >
              <Users size={18} />
              {!isCollapsed && <span className="text-sm">Employees</span>}
            </NavLink>
          )}

          {hasAccess('vehicles') && (
            <div
              className={`rounded-2xl transition-all ${
                isVehiclesActive
                  ? 'bg-slate-800/80 p-1.5 shadow-[0_0_0_1px_rgba(16,185,129,0.18),0_12px_34px_-24px_rgba(16,185,129,0.95)] ring-1 ring-emerald-400/20'
                  : 'space-y-1'
              }`}
            >
              <button
                onClick={() => {
                  navigate('/vehicles');
                  setOpenSubmenu('vehicles');
                }}
                className={`w-full flex rounded-2xl font-black transition-all ${
                  isVehiclesActive
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_18px_38px_-26px_rgba(16,185,129,0.9)]'
                    : 'text-slate-400 hover:bg-white/7 hover:text-white'
                } ${
                  isCollapsed
                    ? 'flex-col items-center justify-center py-2.5'
                    : 'items-center justify-between px-3 py-2.5'
                }`}
              >
                <div
                  className={`flex items-center ${
                    isCollapsed ? 'flex-col' : 'gap-3'
                  }`}
                >
                  <Car size={18} />
                  {!isCollapsed && <span className="text-sm">Vehicles</span>}
                </div>
                {!isCollapsed && (
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${
                      openSubmenu === 'vehicles' ? 'rotate-180' : ''
                    }`}
                  />
                )}
              </button>
              {openSubmenu === 'vehicles' && (
                <div
                  className={`mt-1 space-y-1 ${
                    isCollapsed ? 'flex flex-col items-center' : 'pl-9'
                  }`}
                >
                  <NavLink
                    to="/vehicles/oil"
                    className={({ isActive }) =>
                      `flex rounded-md transition-all text-xs ${
                        isCollapsed
                          ? 'justify-center p-2'
                          : 'items-center gap-2 py-1.5 px-2'
                      } ${
                        isActive
                          ? 'text-emerald-300 bg-slate-900/60'
                          : 'text-slate-400 hover:text-emerald-300'
                      }`
                    }
                  >
                    <Droplets size={16} />
                    {!isCollapsed && <span>Oil Changes</span>}
                  </NavLink>
                  <NavLink
                    to="/vehicles/servicing"
                    className={({ isActive }) =>
                      `flex rounded-md transition-all text-xs ${
                        isCollapsed
                          ? 'justify-center p-2'
                          : 'items-center gap-2 py-1.5 px-2'
                      } ${
                        isActive
                          ? 'text-emerald-300 bg-slate-900/60'
                          : 'text-slate-400 hover:text-emerald-300'
                      }`
                    }
                  >
                    <Wrench size={16} />
                    {!isCollapsed && <span>Servicing</span>}
                  </NavLink>
                  <NavLink
                    to="/vehicles/accidents"
                    className={({ isActive }) =>
                      `flex rounded-md transition-all text-xs ${
                        isCollapsed
                          ? 'justify-center p-2'
                          : 'items-center gap-2 py-1.5 px-2'
                      } ${
                        isActive
                          ? 'text-emerald-300 bg-slate-900/60'
                          : 'text-slate-400 hover:text-emerald-300'
                      }`
                    }
                  >
                    <AlertTriangle size={16} />
                    {!isCollapsed && <span>Accidents</span>}
                  </NavLink>
                </div>
              )}
            </div>
          )}

          {hasAccess('id_manager') && (
            <NavLink
              to="/id-manager"
              className={({ isActive }) =>
                `flex items-center rounded-2xl font-black transition-all ${
                  isCollapsed ? 'justify-center py-2.5' : 'gap-3 px-3 py-2.5'
                } ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_18px_38px_-26px_rgba(16,185,129,0.9)]'
                    : 'text-slate-400 hover:bg-white/7 hover:text-white'
                }`
              }
            >
              <UserSquare size={18} />
              {!isCollapsed && <span className="text-sm">ID Manager</span>}
            </NavLink>
          )}

          {hasAccess('transaction') && (
            <div
              className={`rounded-2xl transition-all ${
                isTransactionActive
                  ? 'bg-slate-800/80 p-1.5 shadow-[0_0_0_1px_rgba(16,185,129,0.18),0_12px_34px_-24px_rgba(16,185,129,0.95)] ring-1 ring-emerald-400/20'
                  : 'space-y-1'
              }`}
            >
              <button
                onClick={() => {
                  navigate('/transaction');
                  setOpenSubmenu('transaction');
                }}
                className={`w-full flex rounded-2xl font-black transition-all ${
                  isTransactionActive
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_18px_38px_-26px_rgba(16,185,129,0.9)]'
                    : 'text-slate-400 hover:bg-white/7 hover:text-white'
                } ${
                  isCollapsed
                    ? 'flex-col items-center justify-center py-2.5'
                    : 'items-center justify-between px-3 py-2.5'
                }`}
              >
                <div
                  className={`flex items-center ${
                    isCollapsed ? 'flex-col' : 'gap-3'
                  }`}
                >
                  <CreditCard size={18} />
                  {!isCollapsed && <span className="text-sm">Transaction</span>}
                </div>
                {!isCollapsed && (
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${
                      openSubmenu === 'transaction' ? 'rotate-180' : ''
                    }`}
                  />
                )}
              </button>
              {openSubmenu === 'transaction' && (
                <div
                  className={`mt-1 space-y-1 ${
                    isCollapsed ? 'flex flex-col items-center' : 'pl-9'
                  }`}
                >
                  <NavLink
                    to="/transaction/paid"
                    className={({ isActive }) =>
                      `flex rounded-md transition-all text-xs ${
                        isCollapsed
                          ? 'justify-center p-2'
                          : 'items-center gap-2 py-1.5 px-2'
                      } ${
                        isActive
                          ? 'text-emerald-300 bg-slate-900/60'
                          : 'text-slate-400 hover:text-emerald-300'
                      }`
                    }
                  >
                    <CheckCircle size={16} />
                    {!isCollapsed && <span>Paid Transactions</span>}
                  </NavLink>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="ars-header-shell h-16 flex items-center justify-between gap-3 px-4 md:px-5 shrink-0 z-20">
          <div className="flex min-w-0 items-center gap-3">
            <h2 className="truncate text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight">
              {dynamicTitle}
            </h2>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {location.pathname !== '/' && (
              <div
                className={`ars-search-pill flex items-center transition-all duration-300 ease-in-out ${
                  isSearchExpanded
                    ? 'w-52 md:w-80 rounded-full px-3 py-2'
                    : 'w-10 rounded-full bg-transparent border-transparent shadow-none'
                }`}
              >
                <button
                  onClick={() => setIsSearchExpanded(true)}
                  className="text-slate-500 hover:text-emerald-600 focus:outline-none"
                >
                  <Search size={21} />
                </button>
                {isSearchExpanded && (
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search here..."
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    onBlur={() => !globalSearch && setIsSearchExpanded(false)}
                    className="w-full bg-transparent border-none outline-none text-sm md:text-base px-3 text-slate-700 placeholder:text-slate-400"
                  />
                )}
              </div>
            )}

            <button
              onClick={() =>
                setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'))
              }
              className="ars-header-icon relative text-slate-500 transition-colors hover:text-emerald-600"
              title={
                themeMode === 'dark'
                  ? 'Switch to light mode'
                  : 'Switch to dark mode'
              }
            >
              {themeMode === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              onClick={() =>
                setLanguageMode((prev) => (prev === 'ar' ? 'en' : 'ar'))
              }
              className="ars-header-icon ars-language-toggle text-xs font-black text-slate-500 transition-colors hover:text-emerald-600"
              title="Toggle English / Arabic layout"
            >
              <Languages size={17} />
              <span>{languageMode === 'ar' ? 'EN' : 'AR'}</span>
            </button>

            <button
              onClick={() => setIsNotificationOpen((prev) => !prev)}
              className="ars-header-icon relative text-slate-500 transition-colors hover:text-emerald-600"
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span
                  className={`absolute -top-1 ${
                    isRtl ? '-left-1' : '-right-1'
                  } min-w-5 rounded-full border border-white bg-red-500 px-1 text-center text-[10px] font-black leading-5 text-white shadow-sm`}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            <div className="relative ml-2">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 focus:outline-none"
              >
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-emerald-400 bg-white text-xs font-black text-emerald-700 shadow-sm transition-shadow hover:shadow-md">
                  {companyProfile.logo ? (
                    <img
                      src={companyProfile.logo}
                      alt={companyDisplayName}
                      className="h-full w-full object-contain p-1"
                    />
                  ) : (
                    getCompanyInitials(companyProfile.englishName)
                  )}
                </div>
              </button>

              {isProfileMenuOpen && (
                <div
                  className={`ars-floating-menu absolute ${
                    isRtl ? 'left-0' : 'right-0'
                  } mt-3 w-56 rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2`}
                >
                  <div className="px-4 py-2 border-b border-slate-50 mb-1">
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {user?.name || 'Administrator'}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {user?.email}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-emerald-600 flex items-center gap-3 transition-colors"
                  >
                    <User size={16} /> Company Profile
                  </button>
                  <button
                    onClick={() => {
                      navigate('/permissions');
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-emerald-600 flex items-center gap-3 transition-colors"
                  >
                    <Shield size={16} /> Permissions
                  </button>
                  <button
                    onClick={() => {
                      navigate('/settings');
                      setIsProfileMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-emerald-600 flex items-center gap-3 transition-colors"
                  >
                    <Settings size={16} /> Settings
                  </button>
                  <div className="h-px bg-slate-100 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 flex items-center gap-3 transition-colors"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main
          className="ars-main-surface flex-1 overflow-auto flex flex-col relative"
          onClick={() => setIsProfileMenuOpen(false)}
        >
          <Outlet key={languageMode} context={{ searchTerm: globalSearch }} />
        </main>
      </div>

      {/* Notification Drawer */}
      <div
        className={`fixed inset-y-0 ${
          isRtl ? 'left-0' : 'right-0'
        } ars-drawer-panel w-full max-w-sm z-50 transform transition-transform duration-300 ease-in-out ${
          isNotificationOpen
            ? 'translate-x-0'
            : isRtl
              ? '-translate-x-full'
              : 'translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col bg-transparent">
          <div className="border-b border-slate-100 px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-black tracking-tight text-slate-900">
                  Notifications
                </h3>
                <p className="text-xs font-semibold text-slate-500">
                  Last {latestNotifications.length} activity messages
                </p>
              </div>
              <button
                onClick={() => setIsNotificationOpen(false)}
                className="rounded-full bg-slate-100 p-1.5 text-slate-500 hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <button
              onClick={markNotificationsAsRead}
              disabled={unreadCount === 0}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            >
              <CheckCheck size={15} />
              {unreadCount > 0
                ? `Mark as read (${unreadCount})`
                : 'All notifications read'}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {latestNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <CheckCircle size={20} />
                </div>
                <p className="mt-3 text-sm font-black text-slate-800">
                  No notifications yet
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  New system messages will appear here.
                </p>
              </div>
            ) : (
              latestNotifications.map((item) => (
                <NotificationMessage
                  key={item.id}
                  notification={item}
                  unread={!readNotificationIds.includes(item.id)}
                  onClick={() => openFromNotification(item.path, item.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {isNotificationOpen && (
        <div
          className="fixed inset-0 bg-black/10 z-40 backdrop-blur-[1px]"
          onClick={() => setIsNotificationOpen(false)}
        ></div>
      )}
    </div>
  );
}

function NotificationMessage({
  notification,
  unread,
  onClick,
}: {
  notification: AppNotification;
  unread: boolean;
  onClick: () => void;
}) {
  const toneClass = {
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-sky-50 text-sky-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    slate: 'bg-slate-100 text-slate-600',
  }[notification.tone];

  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-start gap-3 rounded-2xl p-3 text-left transition hover:bg-slate-100 ${
        unread ? 'bg-emerald-50/70' : 'bg-white'
      }`}
    >
      <div
        className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${toneClass}`}
      >
        {notification.icon}
        {unread && (
          <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-red-500" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-black leading-tight text-slate-900">
            {notification.title}
          </p>
          <span className="shrink-0 text-[10px] font-bold text-slate-400">
            {notification.time}
          </span>
        </div>
        <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500">
          {notification.message}
        </p>
      </div>
    </button>
  );
}
