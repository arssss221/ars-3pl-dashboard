// src/features/employees/Employees.tsx
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
      <div className="hidden group-hover/issue:block absolute right-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg p-2 z-30">
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
  const [activeFilter, setActiveFilter] = useState<FilterKey>('All');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [openSort, setOpenSort] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('iqamaExpiry');

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
    <div className="h-full flex flex-col">
      <div className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200">
        <div className="flex items-center justify-between gap-3 px-4 py-2">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveFilter('All')}
              className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                activeFilter === 'All'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              All ({employeeSeeds.length})
            </button>

            {statusFilters.map((status) => (
              <button
                key={status}
                onClick={() => setActiveFilter(status)}
                className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                  activeFilter === status
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {status} ({statusCounts[status]})
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 shadow-sm">
              <UserPlus size={16} /> Add
            </button>

            <div className="relative">
              <button
                onClick={() => setOpenSort((prev) => !prev)}
                className="shrink-0 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5"
              >
                <ArrowUpDown size={14} /> Sort
              </button>
              {openSort && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-30">
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

      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {filteredAndSorted.map((emp) => {
            const notificationIssues = getNotificationIssues(emp);
            const paperIssues = getPaperIssues(emp);
            const selfieUrl = getSelfieUrl(emp);

            return (
              <div
                key={emp.id}
                onClick={() => openDetails(emp.id)}
                className={`bg-white rounded-xl border p-2.5 transition-all hover:shadow-md cursor-pointer relative ${statusCardAura[emp.status]}`}
              >
                <div className="flex items-start gap-2">
                  <div className="relative shrink-0">
                    {selfieUrl ? (
                      <img
                        src={selfieUrl}
                        alt={emp.fullName}
                        className="h-10 w-10 rounded-full object-cover border border-emerald-200"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-base shadow-sm">
                        {emp.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {emp.status === 'Working' ? (
                      <BadgeCheck
                        size={12}
                        className="absolute -bottom-0.5 -right-0.5 text-emerald-500 bg-white rounded-full"
                      />
                    ) : (
                      <XCircle
                        size={12}
                        className="absolute -bottom-0.5 -right-0.5 text-red-400 bg-white rounded-full"
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-semibold text-slate-800 text-sm truncate"
                      onClick={() => openDetails(emp.id)}
                    >
                      {emp.fullName}
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate">
                      {emp.occupationVisa}
                    </p>
                  </div>

                  <div className="relative flex items-center gap-1">
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
                      className="p-1 hover:bg-slate-100 rounded-full"
                    >
                      <MoreVertical size={14} className="text-slate-400" />
                    </button>

                    {openMenuId === emp.id && (
                      <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-20">
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

                <div className="mt-2 flex gap-2">
                  <button
                    onClick={(e) => handleCall(emp.phoneNo, e)}
                    className="flex-1 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-700 py-1.5 rounded-full transition-colors"
                    aria-label="Call"
                  >
                    <Phone size={14} />
                  </button>
                  <button
                    onClick={(e) => handleWhatsApp(emp.phoneNo, emp.fullName, e)}
                    className="flex-1 flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-1.5 rounded-full transition-colors"
                    aria-label="WhatsApp"
                  >
                    <MessageCircle size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredAndSorted.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl">
            <p className="text-slate-400 text-sm">No employees found</p>
          </div>
        )}
      </div>
    </div>
  );
}
