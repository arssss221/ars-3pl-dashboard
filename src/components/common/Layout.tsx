import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
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
} from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const sessionData = localStorage.getItem('userSession');
  const user = sessionData ? JSON.parse(sessionData) : null;
  const permissions = user?.permissions || {};

  // ✅ getPageTitle ফাংশন ব্যবহারের আগে ডিফাইন করুন
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/') return 'Dashboard';
    const segments = path.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    if (segments[0] === 'vehicles') {
      if (last === 'oil') return 'Oil Changes';
      if (last === 'servicing') return 'Servicing';
      if (last === 'accidents') return 'Accidents';
      return 'Vehicles';
    }
    if (last === 'id-manager') return 'ID Manager';
    return last.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < 768);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [dynamicTitle, setDynamicTitle] = useState(getPageTitle());

  // কাস্টম ইভেন্ট থেকে টাইটেল আপডেট (Employee Detail পেজ থেকে)
  useEffect(() => {
    const handleSetTitle = (e: CustomEvent) => {
      setDynamicTitle(e.detail);
    };
    window.addEventListener('setHeaderTitle', handleSetTitle as EventListener);
    return () =>
      window.removeEventListener(
        'setHeaderTitle',
        handleSetTitle as EventListener
      );
  }, []);

  // লোকেশন পরিবর্তনে ডিফল্ট টাইটেল সেট করুন (কাস্টম ইভেন্ট ওভাররাইড করবে)
  useEffect(() => {
    setDynamicTitle(getPageTitle());
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => setIsCollapsed(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setGlobalSearch('');
    setIsSearchExpanded(false);
  }, [location.pathname]);

  const hasAccess = (permission: string) => {
    if (user?.role === 'owner') return true;
    return permissions[permission] === true;
  };

  const handleLogout = async () => {
    await auth.signOut();
    localStorage.removeItem('userSession');
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans relative">
      {/* Sidebar */}
      <div
        className={`bg-slate-900 text-white flex flex-col shadow-xl transition-all duration-300 ease-in-out shrink-0 z-20 ${
          isCollapsed ? 'w-16' : 'w-56'
        }`}
      >
        <div
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`flex items-center cursor-pointer transition-all py-3 border-b border-slate-800 shrink-0 ${
            isCollapsed ? 'justify-center px-2' : 'gap-3 px-4'
          }`}
        >
          <Package
            className="text-emerald-400 shrink-0"
            size={isCollapsed ? 24 : 22}
          />
          {!isCollapsed && (
            <span className="text-[11px] font-bold tracking-tight text-white leading-tight">
              ARS Logistics Manager
            </span>
          )}
        </div>

        <nav className="flex-1 py-3 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-hide px-2">
          {hasAccess('dashboard') && (
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center rounded-lg font-medium transition-all ${
                  isCollapsed ? 'justify-center py-2' : 'gap-3 px-3 py-2'
                } ${
                  isActive
                    ? 'bg-emerald-500/90 text-white shadow-sm'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-white'
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
                `flex items-center rounded-lg font-medium transition-all ${
                  isCollapsed ? 'justify-center py-2' : 'gap-3 px-3 py-2'
                } ${
                  isActive
                    ? 'bg-emerald-500/90 text-white shadow-sm'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                }`
              }
            >
              <Users size={18} />
              {!isCollapsed && <span className="text-sm">Employees</span>}
            </NavLink>
          )}

          {hasAccess('vehicles') && (
            <div className="space-y-1">
              <button
                onClick={() =>
                  setOpenSubmenu(openSubmenu === 'vehicles' ? null : 'vehicles')
                }
                className={`w-full flex rounded-lg font-medium transition-all ${
                  location.pathname.includes('/vehicles')
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                } ${
                  isCollapsed
                    ? 'flex-col items-center justify-center py-2'
                    : 'items-center justify-between px-3 py-2'
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
                          ? 'text-emerald-400 bg-slate-800/60'
                          : 'text-slate-400 hover:text-emerald-400'
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
                          ? 'text-emerald-400 bg-slate-800/60'
                          : 'text-slate-400 hover:text-emerald-400'
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
                          ? 'text-emerald-400 bg-slate-800/60'
                          : 'text-slate-400 hover:text-emerald-400'
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
                `flex items-center rounded-lg font-medium transition-all ${
                  isCollapsed ? 'justify-center py-2' : 'gap-3 px-3 py-2'
                } ${
                  isActive
                    ? 'bg-emerald-500/90 text-white shadow-sm'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                }`
              }
            >
              <UserSquare size={18} />
              {!isCollapsed && <span className="text-sm">ID Manager</span>}
            </NavLink>
          )}

          {hasAccess('transaction') && (
            <NavLink
              to="/transaction"
              className={({ isActive }) =>
                `flex items-center rounded-lg font-medium transition-all ${
                  isCollapsed ? 'justify-center py-2' : 'gap-3 px-3 py-2'
                } ${
                  isActive
                    ? 'bg-emerald-500/90 text-white shadow-sm'
                    : 'hover:bg-slate-800 text-slate-400 hover:text-white'
                }`
              }
            >
              <CreditCard size={18} />
              {!isCollapsed && <span className="text-sm">Transaction</span>}
            </NavLink>
          )}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="bg-white border-b border-slate-200 h-14 flex items-center justify-between px-4 md:px-6 shrink-0 z-20">
          <h2 className="text-sm md:text-base font-black text-slate-800 uppercase tracking-tight">
            {dynamicTitle}
          </h2>

          <div className="flex items-center gap-3">
            {location.pathname !== '/' && (
              <div
                className={`flex items-center transition-all duration-300 ease-in-out ${
                  isSearchExpanded
                    ? 'w-48 md:w-64 bg-slate-100 rounded-full px-3 py-1.5'
                    : 'w-8 bg-transparent'
                }`}
              >
                <button
                  onClick={() => setIsSearchExpanded(true)}
                  className="text-slate-500 hover:text-emerald-600 focus:outline-none"
                >
                  <Search size={18} />
                </button>
                {isSearchExpanded && (
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search here..."
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    onBlur={() => !globalSearch && setIsSearchExpanded(false)}
                    className="w-full bg-transparent border-none outline-none text-xs md:text-sm pl-2 text-slate-700 placeholder:text-slate-400"
                  />
                )}
              </div>
            )}

            <button
              onClick={() => setIsNotificationOpen(true)}
              className="relative p-1.5 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
            >
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>

            <div className="relative ml-2">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 focus:outline-none"
              >
                <div className="h-8 w-8 bg-emerald-100 rounded-full border-2 border-emerald-400 flex items-center justify-center font-bold text-emerald-700 text-xs shadow-sm hover:shadow-md transition-shadow">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
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
                    <User size={16} /> My Profile
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
          className="flex-1 overflow-auto bg-slate-50 flex flex-col relative"
          onClick={() => setIsProfileMenuOpen(false)}
        >
          <Outlet context={{ searchTerm: globalSearch }} />
        </main>
      </div>

      {/* Notification Drawer */}
      <div
        className={`fixed inset-y-0 right-0 w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isNotificationOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h3 className="font-black text-slate-800 uppercase text-sm tracking-widest">
              Notifications
            </h3>
            <button
              onClick={() => setIsNotificationOpen(false)}
              className="p-1 hover:bg-slate-200 rounded-full transition-colors"
            >
              <X size={20} className="text-slate-500" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
              <p className="text-xs font-bold text-emerald-800">System Ready</p>
              <p className="text-[10px] text-emerald-600">
                All modules are running smoothly.
              </p>
            </div>
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
