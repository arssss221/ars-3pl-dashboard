// src/features/employees/Employees.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Phone,
  MessageCircle,
  MoreVertical,
  UserPlus,
  BadgeCheck,
  XCircle,
  Truck,
  IdCard,
  Receipt,
  ArrowUpDown,
  AlertTriangle,
  FileText,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import {
  employeeSeeds,
  getEmployeeDisplayName,
  getEmployeeInitials,
  getSelfieUrl,
  type CompletionStatus,
  type EmployeeDocuments,
  type EmployeeSeed,
  type EmployeeStatus,
} from './employeeData';

type FilterKey = 'All' | EmployeeStatus;
type SortKey =
  | 'iqamaExpiry'
  | 'designation'
  | 'joinDate'
  | 'nationality'
  | 'transferCount'
  | 'agreement'
  | 'commitment';

const statusFilters: EmployeeStatus[] = ['Working', 'Waiting', 'Ready', 'Leave'];

const sortOptions: Array<{ key: SortKey; label: string }> = [
  { key: 'iqamaExpiry', label: 'Iqama Expiry' },
  { key: 'designation', label: 'Designation' },
  { key: 'joinDate', label: 'Join Date' },
  { key: 'nationality', label: 'Nationality' },
  { key: 'transferCount', label: 'Transfer Count' },
  { key: 'agreement', label: 'Agreement' },
  { key: 'commitment', label: 'Commitment' },
];

const statusCardAura: Record<EmployeeStatus, string> = {
  Working:
    'border-emerald-200 shadow-[0_0_0_1px_rgba(16,185,129,0.08),0_8px_22px_-16px_rgba(16,185,129,0.55)]',
  Waiting:
    'border-yellow-200 shadow-[0_0_0_1px_rgba(234,179,8,0.08),0_8px_22px_-16px_rgba(234,179,8,0.55)]',
  Ready:
    'border-blue-200 shadow-[0_0_0_1px_rgba(59,130,246,0.08),0_8px_22px_-16px_rgba(59,130,246,0.55)]',
  Leave:
    'border-red-200 shadow-[0_0_0_1px_rgba(239,68,68,0.08),0_8px_22px_-16px_rgba(239,68,68,0.55)]',
};

const getDaysUntil = (dateStr: string) => {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  if (Number.isNaN(target.getTime())) return null;
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.floor((target.getTime() - today.getTime()) / dayMs);
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('en-GB');
};

const completionScore = (value: CompletionStatus) =>
  value === 'Not Complete' ? 0 : 1;

const transferScore = (value: string) => {
  if (value === '3+') return 4;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const getNotificationIssues = (emp: EmployeeSeed) => {
  const issues: string[] = [];
  const iqamaDays = getDaysUntil(emp.iqamaExpiry);

  if (iqamaDays !== null) {
    if (iqamaDays < 0) {
      issues.push(`Iqama expired (${Math.abs(iqamaDays)} day ago)`);
    } else if (iqamaDays < 10) {
      issues.push(`Iqama expires in ${iqamaDays} day`);
    }
  }

  if (emp.agreement === 'Not Complete') issues.push('Agreement is Not Complete');
  if (emp.commitment === 'Not Complete')
    issues.push('Commitment is Not Complete');

  if (!emp.healthInsuranceName.trim()) {
    issues.push('Health insurance name is missing');
  }
  if (!emp.healthInsuranceExpiry.trim()) {
    issues.push('Health insurance expiry is missing');
  }

  return issues;
};

const getPaperIssues = (emp: EmployeeSeed) => {
  const issues: string[] = [];
  const requiredDocs: Array<{ key: keyof EmployeeDocuments; label: string }> = [
    { key: 'selfie', label: 'Selfie' },
    { key: 'iqama', label: 'Iqama' },
    { key: 'license', label: 'License' },
    { key: 'passport', label: 'Passport' },
    { key: 'medicalInfo', label: 'Medical Info' },
    { key: 'driverCard', label: 'Driver Card' },
  ];

  requiredDocs.forEach((doc) => {
    if (!emp.documents[doc.key]) issues.push(`${doc.label} needs upload`);
  });

  if (emp.bankAccounts.length < 1) issues.push('Bank account is missing');

  return issues;
};

interface IssueButtonProps {
  title: string;
  issues: string[];
  type: 'notification' | 'papers';
}

const IssueButton = ({ title, issues, type }: IssueButtonProps) => {
  if (issues.length === 0) return null;

  return (
    <div className="relative group/issue">
      <button
        onClick={(e) => e.stopPropagation()}
        className="p-1 rounded-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600"
        title={title}
      >
        {type === 'notification' ? (
          <AlertTriangle size={14} />
        ) : (
          <FileText size={14} />
        )}
      </button>
      <div
        style={{ insetInlineEnd: 0 }}
        className="ars-floating-menu hidden group-hover/issue:block absolute top-full mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg p-2 z-30"
      >
        <p className="text-[11px] font-semibold text-slate-600 mb-1">{title}</p>
        <ul className="space-y-1">
          {issues.map((issue) => (
            <li key={issue} className="text-[11px] text-red-600 leading-snug">
              - {issue}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default function Employees() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('All');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [openSort, setOpenSort] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('iqamaExpiry');

  useEffect(() => {
    if (openMenuId === null) return;
    const closeMenu = () => setOpenMenuId(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, [openMenuId]);

  const statusCounts = useMemo(() => {
    const counts: Record<EmployeeStatus, number> = {
      Working: 0,
      Waiting: 0,
      Ready: 0,
      Leave: 0,
    };
    employeeSeeds.forEach((emp) => {
      counts[emp.status] += 1;
    });
    return counts;
  }, []);

  const filteredAndSorted = useMemo(() => {
    const filtered = employeeSeeds.filter((emp) =>
      activeFilter === 'All' ? true : emp.status === activeFilter
    );

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'iqamaExpiry': {
          const aDays = getDaysUntil(a.iqamaExpiry);
          const bDays = getDaysUntil(b.iqamaExpiry);
          return (
            (aDays ?? Number.MAX_SAFE_INTEGER) - (bDays ?? Number.MAX_SAFE_INTEGER)
          );
        }
        case 'designation':
          return a.occupationVisa.localeCompare(b.occupationVisa);
        case 'joinDate':
          return new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime();
        case 'nationality':
          return a.nationality.localeCompare(b.nationality);
        case 'transferCount':
          return transferScore(b.transferCount) - transferScore(a.transferCount);
        case 'agreement':
          return completionScore(a.agreement) - completionScore(b.agreement);
        case 'commitment':
          return completionScore(a.commitment) - completionScore(b.commitment);
        default:
          return 0;
      }
    });
  }, [activeFilter, sortBy]);

  const openDetails = (id: number) => {
    setOpenMenuId(null);
    setOpenSort(false);
    navigate(`/employees/${id}`);
  };

  const handleCall = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = (
    phone: string,
    name: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    const url = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(name)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="ars-page h-full flex flex-col">
      <div className="sticky top-0 z-10 px-3 py-3 md:px-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="order-2 flex items-center gap-2 overflow-x-auto scrollbar-hide ars-toolbar-dock xl:order-2">
            <button
              onClick={() => setActiveFilter('All')}
              className={`ars-filter-pill shrink-0 transition-all ${
                activeFilter === 'All'
                  ? 'ars-filter-pill-active'
                  : ''
              }`}
            >
              All ({employeeSeeds.length})
            </button>

            {statusFilters.map((status) => (
              <button
                key={status}
                onClick={() => setActiveFilter(status)}
                className={`ars-filter-pill shrink-0 transition-all ${
                  activeFilter === status
                    ? 'ars-filter-pill-active'
                    : ''
                }`}
              >
                {status} ({statusCounts[status]})
              </button>
            ))}
          </div>

          <div className="order-1 flex items-center gap-3 xl:order-1">
            <button className="ars-primary-button shrink-0 rounded-xl px-3.5 py-2 text-sm font-black flex items-center gap-1.5">
              <UserPlus size={17} /> Add
            </button>

            <div className="relative">
              <button
                onClick={() => setOpenSort((prev) => !prev)}
                className="ars-glass-button shrink-0 rounded-xl px-3.5 py-2 text-sm font-black flex items-center gap-1.5 hover:text-emerald-700"
              >
                <ArrowUpDown size={17} /> Sort
              </button>
              {openSort && (
                <div
                  style={{ insetInlineEnd: 0 }}
                  className="ars-floating-menu absolute mt-3 w-56 rounded-2xl shadow-lg border border-slate-100 py-2 z-30"
                >
                  {sortOptions.map((option) => (
                    <button
                      key={option.key}
                      onClick={() => {
                        setSortBy(option.key);
                        setOpenSort(false);
                      }}
                      className={`w-full px-3 py-1.5 text-xs text-left hover:bg-slate-50 ${
                        sortBy === option.key
                          ? 'text-emerald-700 font-semibold'
                          : 'text-slate-600'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-3 pb-4 md:px-4">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(330px,1fr))] gap-3">
          {filteredAndSorted.map((emp) => {
            const notificationIssues = getNotificationIssues(emp);
            const paperIssues = getPaperIssues(emp);
            const selfieUrl = getSelfieUrl(emp);
            const displayName = getEmployeeDisplayName(emp, i18n.language);

            return (
              <div
                key={emp.id}
                onClick={() => openDetails(emp.id)}
                className={`ars-list-card min-h-[126px] p-3 cursor-pointer relative ${statusCardAura[emp.status]}`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    {selfieUrl ? (
                      <img
                        src={selfieUrl}
                        alt={displayName}
                        className="ars-avatar-ring h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="ars-avatar-ring h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-sm">
                        {getEmployeeInitials(emp, i18n.language)}
                      </div>
                    )}
                    {emp.status === 'Working' ? (
                      <BadgeCheck
                        size={17}
                        className="absolute bottom-0 right-0 text-emerald-500 bg-slate-950 rounded-full"
                      />
                    ) : (
                      <XCircle
                        size={17}
                        className="absolute bottom-0 right-0 text-red-400 bg-slate-950 rounded-full"
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-black text-slate-900 text-base leading-tight truncate"
                      onClick={() => openDetails(emp.id)}
                    >
                      {displayName}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 truncate">
                      {emp.occupationVisa}
                    </p>
                  </div>

                  <div className="relative flex items-center gap-2">
                    <IssueButton
                      title="Notifications"
                      issues={notificationIssues}
                      type="notification"
                    />
                    <IssueButton title="Papers" issues={paperIssues} type="papers" />

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === emp.id ? null : emp.id);
                      }}
                      className="ars-header-icon h-8 min-w-8 text-slate-400 hover:text-emerald-600"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {openMenuId === emp.id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{ insetInlineEnd: 0 }}
                        className="ars-floating-menu absolute top-full mt-2 w-60 rounded-2xl shadow-lg border border-slate-100 py-2 z-20"
                      >
                        <div className="px-3 py-1.5 text-[11px] font-medium text-slate-500 border-b">
                          Detail Snapshot
                        </div>
                        <div className="px-3 py-1.5 text-xs text-slate-600 flex items-center gap-2">
                          <Building2 size={12} /> Branch: {emp.branch}
                        </div>
                        <div className="px-3 py-1.5 text-xs text-slate-600 flex items-center gap-2">
                          <IdCard size={12} /> Iqama: {emp.iqamaNumber}
                        </div>
                        <div className="px-3 py-1.5 text-xs text-slate-600 flex items-center gap-2">
                          <ShieldCheck size={12} /> Sponsor: {emp.sponsor}
                        </div>
                        <div className="px-3 py-1.5 text-xs text-slate-600 flex items-center gap-2">
                          <Truck size={12} /> Vehicle: {emp.vehicleNumber}
                        </div>
                        <div className="px-3 py-1.5 text-xs text-slate-600 flex items-center gap-2">
                          <Receipt size={12} /> Transfers: {emp.transferCount}
                        </div>
                        <div className="px-3 pt-1.5 pb-2 text-[11px] text-slate-500 border-t mt-1">
                          Iqama Expiry: {formatDate(emp.iqamaExpiry)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={(e) => handleCall(emp.phoneNo, e)}
                    className="ars-glass-button flex items-center justify-center text-slate-600 py-2 rounded-full transition-colors hover:text-emerald-700"
                    aria-label="Call"
                  >
                    <Phone size={18} />
                  </button>
                  <button
                    onClick={(e) => handleWhatsApp(emp.phoneNo, displayName, e)}
                    className="flex items-center justify-center bg-emerald-50/70 hover:bg-emerald-100 text-emerald-700 py-2 rounded-full transition-colors border border-emerald-100"
                    aria-label="WhatsApp"
                  >
                    <MessageCircle size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredAndSorted.length === 0 && (
          <div className="ars-card text-center py-8 rounded-2xl">
            <p className="text-slate-400 text-sm">No employees found</p>
          </div>
        )}
      </div>
    </div>
  );
}
