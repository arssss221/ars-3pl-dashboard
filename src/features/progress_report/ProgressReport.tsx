import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clock3,
  ClipboardList,
  RefreshCw,
  Search,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase';
import {
  employeeSeeds,
  getEmployeeDisplayName,
} from '../employees/employeeData';
import type { EmployeeSeed } from '../employees/employeeData';

interface EmployeeRecord extends EmployeeSeed {
  designation?: string;
}

interface DailyReportRecord {
  date: string;
  riderId: number;
  riderName: string;
  designation: string;
  orderCount: number;
  dutyTime: string;
  issue: string;
}

interface MonthlyAdjustment {
  riderId: number;
  adjustOrder: number;
  reason: string;
}

interface RiderProgressRow {
  rider: EmployeeRecord;
  orders: number;
  adjustedOrders: number;
  adjustment: number;
  reportDays: number;
  dutyMinutes: number;
  averageDutyMinutes: number;
  issueCount: number;
  lastReportDate: string;
  score: number;
  rank: number;
}

const dailyReportCollection = 'dailyProgressReports';
const monthlyAdjustmentCollection = 'monthlyReportAdjustments';
const databaseTimeoutMs = 8000;
const targetOrdersPerDay = 20;
const targetDutyMinutes = 8 * 60 + 30;

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const withDatabaseTimeout = async <T,>(promise: Promise<T>) =>
  Promise.race<T>([
    promise,
    new Promise<T>((_resolve, reject) => {
      window.setTimeout(
        () => reject(new Error('Database request timed out.')),
        databaseTimeoutMs
      );
    }),
  ]);

const parseOrderCount = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parseDutyTimeValue = (value: string) => {
  const [hoursRaw, minutesRaw = '0'] = String(value || '').split('.');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;
  return hours * 60 + minutes;
};

const formatDutyMinutes = (minutes: number) => {
  if (!Number.isFinite(minutes) || minutes <= 0) return '-';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${String(hours).padStart(2, '0')}.${String(mins).padStart(2, '0')}`;
};

const formatDisplayDate = (dateValue: string) => {
  const [year, month, day] = dateValue.split('-').map(Number);
  if (!year || !month || !day) return dateValue || '-';
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
  });
};

const monthKeyFor = (year: number, monthIndex: number) =>
  `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

const monthRange = (year: number, monthIndex: number) => {
  const month = String(monthIndex + 1).padStart(2, '0');
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  return {
    startDate: `${year}-${month}-01`,
    endDate: `${year}-${month}-${String(lastDay).padStart(2, '0')}`,
  };
};

const getEmployeeDesignation = (employee: Partial<EmployeeRecord>) =>
  String(employee.designation ?? employee.occupationVisa ?? '').trim();

const isWorkingDriver = (employee: Partial<EmployeeRecord>) =>
  getEmployeeDesignation(employee).toLowerCase() === 'driver' &&
  employee.status === 'Working';

const normalizeEmployee = (
  data: Record<string, unknown>,
  fallbackId: number
): EmployeeRecord => ({
  id: typeof data.id === 'number' ? data.id : fallbackId,
  idNumber: String(data.idNumber ?? `EMP${fallbackId}`),
  nickName: String(data.nickName ?? data.fullName ?? 'Rider'),
  arabicName: String(data.arabicName ?? ''),
  fullName: String(data.fullName ?? data.name ?? 'Rider'),
  phoneNo: String(data.phoneNo ?? ''),
  phoneNo2: String(data.phoneNo2 ?? ''),
  email: String(data.email ?? ''),
  occupationVisa: String(data.occupationVisa ?? data.designation ?? 'Driver'),
  designation: String(data.designation ?? data.occupationVisa ?? 'Driver'),
  branch: String(data.branch ?? ''),
  status:
    data.status === 'Working' ||
    data.status === 'Waiting' ||
    data.status === 'Ready' ||
    data.status === 'Leave'
      ? data.status
      : 'Working',
  vehicleNumber: String(data.vehicleNumber ?? ''),
  iqamaNumber: String(data.iqamaNumber ?? ''),
  iqamaExpiry: String(data.iqamaExpiry ?? ''),
  dateOfBirth: String(data.dateOfBirth ?? ''),
  passportNo: String(data.passportNo ?? ''),
  passportExpiry: String(data.passportExpiry ?? ''),
  nationality: String(data.nationality ?? ''),
  entryDate: String(data.entryDate ?? ''),
  sponsor: String(data.sponsor ?? ''),
  accomodation: String(data.accomodation ?? ''),
  agreement: data.agreement === 'Complete' ? 'Complete' : 'Not Complete',
  commitment: data.commitment === 'Complete' ? 'Complete' : 'Not Complete',
  transferCount: String(data.transferCount ?? ''),
  healthInsuranceName: String(data.healthInsuranceName ?? ''),
  healthInsuranceExpiry: String(data.healthInsuranceExpiry ?? ''),
  bankAccounts: [],
  documents: {
    selfie: false,
    iqama: false,
    license: false,
    passport: false,
    medicalInfo: false,
    driverCard: false,
    ajeerContract: false,
  },
});

const clampPercentage = (value: number) =>
  Math.max(0, Math.min(100, Math.round(value)));

export default function ProgressReport() {
  const navigate = useNavigate();
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [employees, setEmployees] = useState<EmployeeRecord[]>(employeeSeeds);
  const [records, setRecords] = useState<DailyReportRecord[]>([]);
  const [adjustments, setAdjustments] = useState<Record<number, MonthlyAdjustment>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [searchVersion, setSearchVersion] = useState(0);

  const yearOptions = useMemo(
    () => Array.from({ length: 21 }, (_item, index) => 2026 + index),
    []
  );

  const monthKey = useMemo(
    () => monthKeyFor(selectedYear, selectedMonth),
    [selectedMonth, selectedYear]
  );

  const reportTitle = `${monthNames[selectedMonth]} ${selectedYear}`;

  useEffect(() => {
    let isMounted = true;

    const loadEmployees = async () => {
      try {
        const snapshot = await withDatabaseTimeout(getDocs(collection(db, 'employees')));
        if (!isMounted || snapshot.empty) return;

        const merged = new Map<number, EmployeeRecord>();
        employeeSeeds.forEach((employee) => merged.set(employee.id, employee));
        snapshot.forEach((item, index) => {
          const employee = normalizeEmployee(
            item.data() as Record<string, unknown>,
            employeeSeeds.length + index + 1
          );
          merged.set(employee.id, employee);
        });
        setEmployees(Array.from(merged.values()));
      } catch (error) {
        console.warn('Failed to load employees for progress report:', error);
      }
    };

    loadEmployees();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadReports = async () => {
      setIsLoading(true);
      setStatusMessage('');
      try {
        const { startDate, endDate } = monthRange(selectedYear, selectedMonth);
        const [reportSnapshot, adjustmentSnapshot] = await withDatabaseTimeout(
          Promise.all([
            getDocs(
              query(
                collection(db, dailyReportCollection),
                where('date', '>=', startDate),
                where('date', '<=', endDate)
              )
            ),
            getDocs(
              query(
                collection(db, monthlyAdjustmentCollection),
                where('monthKey', '==', monthKey)
              )
            ),
          ])
        );

        if (!isMounted) return;

        const nextRecords = reportSnapshot.docs.map((item) => {
          const data = item.data() as Record<string, unknown>;
          return {
            date: String(data.date ?? ''),
            riderId: Number(data.riderId ?? 0),
            riderName: String(data.riderName ?? ''),
            designation: String(data.designation ?? 'Driver'),
            orderCount: parseOrderCount(data.orderCount),
            dutyTime: String(data.dutyTime ?? ''),
            issue: String(data.issue ?? ''),
          };
        });

        const nextAdjustments: Record<number, MonthlyAdjustment> = {};
        adjustmentSnapshot.forEach((item) => {
          const data = item.data() as Record<string, unknown>;
          const riderId = Number(data.riderId ?? 0);
          if (!riderId) return;
          nextAdjustments[riderId] = {
            riderId,
            adjustOrder: parseOrderCount(data.adjustOrder),
            reason: String(data.reason ?? ''),
          };
        });

        setRecords(nextRecords);
        setAdjustments(nextAdjustments);
      } catch (error) {
        console.error('Failed to load progress report:', error);
        if (isMounted) {
          setRecords([]);
          setAdjustments({});
          setStatusMessage('Progress report data could not be loaded.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadReports();

    return () => {
      isMounted = false;
    };
  }, [monthKey, searchVersion, selectedMonth, selectedYear]);

  const riders = useMemo(
    () =>
      employees
        .filter(isWorkingDriver)
        .sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [employees]
  );

  const progressRows = useMemo<RiderProgressRow[]>(() => {
    const rows = riders.map((rider) => {
      const riderRecords = records.filter((record) => record.riderId === rider.id);
      const orders = riderRecords.reduce((sum, record) => sum + record.orderCount, 0);
      const dutyMinutes = riderRecords.reduce(
        (sum, record) => sum + parseDutyTimeValue(record.dutyTime),
        0
      );
      const issueCount = riderRecords.filter((record) => record.issue.trim()).length;
      const reportDays = riderRecords.length;
      const adjustment = adjustments[rider.id]?.adjustOrder ?? 0;
      const adjustedOrders = orders + adjustment;
      const averageDutyMinutes = reportDays ? dutyMinutes / reportDays : 0;
      const orderScore = reportDays
        ? adjustedOrders / (reportDays * targetOrdersPerDay)
        : 0;
      const dutyScore = averageDutyMinutes
        ? averageDutyMinutes / targetDutyMinutes
        : 0;
      const issuePenalty = issueCount ? Math.min(issueCount * 4, 20) : 0;
      const score = clampPercentage(((orderScore * 70 + dutyScore * 30) * 100) - issuePenalty);

      return {
        rider,
        orders,
        adjustedOrders,
        adjustment,
        reportDays,
        dutyMinutes,
        averageDutyMinutes,
        issueCount,
        lastReportDate:
          riderRecords
            .map((record) => record.date)
            .sort((a, b) => b.localeCompare(a))[0] ?? '',
        score,
        rank: 0,
      };
    });

    const sortedRows = [...rows].sort((a, b) => b.score - a.score);
    const rankByRider = new Map<number, number>();
    sortedRows.forEach((row, index) => rankByRider.set(row.rider.id, index + 1));

    return rows.map((row) => ({
      ...row,
      rank: rankByRider.get(row.rider.id) ?? 0,
    }));
  }, [adjustments, records, riders]);

  const rankedRows = useMemo(
    () => [...progressRows].sort((a, b) => b.score - a.score),
    [progressRows]
  );

  const attentionRows = useMemo(
    () =>
      [...progressRows]
        .filter((row) => row.reportDays === 0 || row.score < 70 || row.issueCount > 0)
        .sort((a, b) => a.score - b.score)
        .slice(0, 6),
    [progressRows]
  );

  const dailyTrend = useMemo(() => {
    const totals = records.reduce<Record<string, number>>((acc, record) => {
      acc[record.date] = (acc[record.date] ?? 0) + record.orderCount;
      return acc;
    }, {});
    const days = Object.entries(totals)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12);
    const max = Math.max(...days.map((day) => day[1]), 1);

    return days.map(([date, orders]) => ({
      date,
      orders,
      percentage: clampPercentage((orders / max) * 100),
    }));
  }, [records]);

  const issueSummary = useMemo(() => {
    const summary = records.reduce<Record<string, number>>((acc, record) => {
      const issue = record.issue.trim();
      if (!issue) return acc;
      acc[issue] = (acc[issue] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(summary)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [records]);

  const totals = useMemo(() => {
    const totalOrders = progressRows.reduce(
      (sum, row) => sum + row.adjustedOrders,
      0
    );
    const totalDutyMinutes = progressRows.reduce(
      (sum, row) => sum + row.dutyMinutes,
      0
    );
    const totalReportEntries = progressRows.reduce(
      (sum, row) => sum + row.reportDays,
      0
    );
    const totalIssues = progressRows.reduce((sum, row) => sum + row.issueCount, 0);
    const targetOrders = totalReportEntries * targetOrdersPerDay;
    const activeRiders = progressRows.filter((row) => row.reportDays > 0).length;
    const averageScore = progressRows.length
      ? Math.round(
          progressRows.reduce((sum, row) => sum + row.score, 0) /
            progressRows.length
        )
      : 0;

    return {
      totalOrders,
      totalDutyMinutes,
      totalReportEntries,
      totalIssues,
      activeRiders,
      averageScore,
      targetAchievement: targetOrders
        ? clampPercentage((totalOrders / targetOrders) * 100)
        : 0,
      averageOrdersPerRider: progressRows.length
        ? Math.round(totalOrders / progressRows.length)
        : 0,
      averageDutyTime: totalReportEntries
        ? formatDutyMinutes(totalDutyMinutes / totalReportEntries)
        : '-',
    };
  }, [progressRows]);

  const statCards = [
    {
      title: 'Total Orders',
      value: totals.totalOrders,
      detail: `${totals.targetAchievement}% target achievement`,
      icon: BarChart3,
      color: 'text-emerald-700 bg-emerald-50',
    },
    {
      title: 'Active Riders',
      value: `${totals.activeRiders}/${riders.length}`,
      detail: `${totals.totalReportEntries} report entries`,
      icon: Users,
      color: 'text-sky-700 bg-sky-50',
    },
    {
      title: 'Avg Duty Time',
      value: totals.averageDutyTime,
      detail: `Target ${formatDutyMinutes(targetDutyMinutes)}`,
      icon: Clock3,
      color: 'text-amber-700 bg-amber-50',
    },
    {
      title: 'Progress Score',
      value: `${totals.averageScore}%`,
      detail: `${totals.totalIssues} reported issues`,
      icon: Activity,
      color: 'text-rose-700 bg-rose-50',
    },
  ];

  return (
    <section className="ars-page p-3 sm:p-4 md:p-5">
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/80 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 sm:flex">
            <ClipboardList size={22} />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-black text-slate-900 dark:text-slate-100">
              Progress Report
            </h1>
            <p className="mt-1 text-sm font-bold text-slate-500">
              Company work progress dashboard from daily and monthly reports.
            </p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:w-[27rem]">
          <label className="text-xs font-black uppercase tracking-normal text-slate-500">
            Month
            <select
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(Number(event.target.value))}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-800 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              {monthNames.map((month, index) => (
                <option key={month} value={index}>
                  {month}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-black uppercase tracking-normal text-slate-500">
            Year
            <select
              value={selectedYear}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-800 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-2 xl:justify-end">
          <button
            type="button"
            onClick={() => setSearchVersion((value) => value + 1)}
            className="ars-primary-button inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-black"
          >
            <Search size={17} />
            Search
          </button>
          <button
            type="button"
            onClick={() => navigate('/progress-report/daily-report')}
            className="ars-glass-button inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-black"
          >
            <CalendarDays size={17} />
            Daily
          </button>
          <button
            type="button"
            onClick={() => navigate('/progress-report/monthly-report')}
            className="ars-glass-button inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-black"
          >
            <CalendarRange size={17} />
            Monthly
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-normal text-slate-500">
                    {card.title}
                  </p>
                  <p className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">
                    {card.value}
                  </p>
                </div>
                <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${card.color}`}>
                  <Icon size={20} />
                </span>
              </div>
              <p className="mt-3 text-sm font-bold text-slate-500">{card.detail}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(20rem,0.8fr)]">
        <div className="ars-glass-panel rounded-xl p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-normal text-slate-500">
                Daily Trend
              </p>
              <h2 className="mt-1 text-base font-black text-slate-900 dark:text-slate-100">
                Orders flow in {reportTitle}
              </h2>
            </div>
            <TrendingUp size={20} className="shrink-0 text-emerald-700" />
          </div>

          {dailyTrend.length > 0 ? (
            <div className="flex h-52 items-end gap-2 overflow-x-auto pb-1">
              {dailyTrend.map((day) => (
                <div
                  key={day.date}
                  className="flex min-w-[3.4rem] flex-1 flex-col items-center justify-end gap-2"
                >
                  <div className="text-xs font-black text-slate-700 dark:text-slate-200">
                    {day.orders}
                  </div>
                  <div className="flex h-36 w-full items-end rounded-lg bg-slate-100 p-1 dark:bg-slate-950">
                    <div
                      className="w-full rounded-md bg-gradient-to-t from-emerald-600 to-sky-400"
                      style={{ height: `${Math.max(day.percentage, 8)}%` }}
                    />
                  </div>
                  <div className="text-[11px] font-black text-slate-500">
                    {formatDisplayDate(day.date)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-52 items-center justify-center rounded-xl bg-slate-50 text-sm font-bold text-slate-400 dark:bg-slate-950">
              No daily report data found for {reportTitle}.
            </div>
          )}
        </div>

        <div className="grid gap-4">
          <div className="ars-glass-panel rounded-xl p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-normal text-slate-500">
                  Target Coverage
                </p>
                <h2 className="mt-1 text-base font-black text-slate-900 dark:text-slate-100">
                  Monthly operating pace
                </h2>
              </div>
              <Target size={20} className="text-sky-700" />
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-950">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-sky-500 to-amber-400"
                style={{ width: `${totals.targetAchievement}%` }}
              />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-950/30">
                <p className="text-lg font-black text-emerald-700">
                  {totals.targetAchievement}%
                </p>
                <p className="text-[11px] font-black text-slate-500">Target</p>
              </div>
              <div className="rounded-lg bg-sky-50 p-2 dark:bg-sky-950/30">
                <p className="text-lg font-black text-sky-700">
                  {totals.averageOrdersPerRider}
                </p>
                <p className="text-[11px] font-black text-slate-500">Avg Rider</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-2 dark:bg-amber-950/30">
                <p className="text-lg font-black text-amber-700">
                  {totals.totalIssues}
                </p>
                <p className="text-[11px] font-black text-slate-500">Issues</p>
              </div>
            </div>
          </div>

          <div className="ars-glass-panel rounded-xl p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-normal text-slate-500">
                  Issue Snapshot
                </p>
                <h2 className="mt-1 text-base font-black text-slate-900 dark:text-slate-100">
                  Repeated blockers
                </h2>
              </div>
              <AlertTriangle size={20} className="text-amber-700" />
            </div>
            <div className="space-y-2">
              {issueSummary.map(([issue, count]) => (
                <div
                  key={issue}
                  className="flex items-center justify-between gap-3 rounded-lg bg-white/70 px-3 py-2 text-sm dark:bg-slate-950/50"
                >
                  <span className="min-w-0 truncate font-bold text-slate-700 dark:text-slate-200">
                    {issue}
                  </span>
                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-xs font-black text-amber-800">
                    {count}
                  </span>
                </div>
              ))}
              {issueSummary.length === 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-3 text-sm font-black text-emerald-800">
                  <CheckCircle2 size={17} />
                  No repeated issue recorded.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <div className="ars-table-shell w-full overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
            <div>
              <p className="text-xs font-black uppercase tracking-normal text-slate-500">
                Top Progress
              </p>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                Best performing riders
              </h2>
            </div>
            <RefreshCw size={18} className={isLoading ? 'animate-spin text-emerald-700' : 'text-slate-400'} />
          </div>
          <table className="w-full table-fixed border-collapse text-xs sm:text-sm">
            <colgroup>
              <col className="w-[12%]" />
              <col className="w-[36%]" />
              <col className="w-[17%]" />
              <col className="w-[18%]" />
              <col className="w-[17%]" />
            </colgroup>
            <thead className="ars-table-head text-left text-xs font-black uppercase tracking-normal text-slate-500">
              <tr>
                <th className="px-2 py-2 text-center">Rank</th>
                <th className="px-2 py-2">Rider</th>
                <th className="px-2 py-2 text-center">Orders</th>
                <th className="px-2 py-2 text-center">Duty</th>
                <th className="px-2 py-2 text-center">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rankedRows.slice(0, 6).map((row) => (
                <tr key={row.rider.id} className="bg-white/60 dark:bg-slate-950/40">
                  <td className="px-2 py-2 text-center font-black text-slate-500">
                    {row.rank}
                  </td>
                  <td className="px-2 py-2">
                    <p className="truncate font-black text-slate-900 dark:text-slate-100">
                      {getEmployeeDisplayName(row.rider)}
                    </p>
                    <p className="truncate text-[11px] font-bold text-slate-500">
                      Last: {formatDisplayDate(row.lastReportDate)}
                    </p>
                  </td>
                  <td className="px-2 py-2 text-center font-black text-emerald-700">
                    {row.adjustedOrders}
                  </td>
                  <td className="px-2 py-2 text-center font-black text-slate-700 dark:text-slate-200">
                    {formatDutyMinutes(row.averageDutyMinutes)}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-black text-emerald-800">
                      {row.score}%
                    </span>
                  </td>
                </tr>
              ))}
              {rankedRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center font-bold text-slate-400">
                    No working driver profiles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="ars-table-shell w-full overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
            <div>
              <p className="text-xs font-black uppercase tracking-normal text-slate-500">
                Needs Attention
              </p>
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                Low score or reported issues
              </h2>
            </div>
            <AlertTriangle size={18} className="text-amber-700" />
          </div>
          <table className="w-full table-fixed border-collapse text-xs sm:text-sm">
            <colgroup>
              <col className="w-[38%]" />
              <col className="w-[16%]" />
              <col className="w-[16%]" />
              <col className="w-[16%]" />
              <col className="w-[14%]" />
            </colgroup>
            <thead className="ars-table-head text-left text-xs font-black uppercase tracking-normal text-slate-500">
              <tr>
                <th className="px-2 py-2">Rider</th>
                <th className="px-2 py-2 text-center">Days</th>
                <th className="px-2 py-2 text-center">Orders</th>
                <th className="px-2 py-2 text-center">Issues</th>
                <th className="px-2 py-2 text-center">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {attentionRows.map((row) => (
                <tr key={row.rider.id} className="bg-white/60 dark:bg-slate-950/40">
                  <td className="px-2 py-2">
                    <p className="truncate font-black text-slate-900 dark:text-slate-100">
                      {getEmployeeDisplayName(row.rider)}
                    </p>
                    <p className="truncate text-[11px] font-bold text-slate-500">
                      {row.reportDays ? `Last: ${formatDisplayDate(row.lastReportDate)}` : 'No report'}
                    </p>
                  </td>
                  <td className="px-2 py-2 text-center font-black text-slate-700 dark:text-slate-200">
                    {row.reportDays}
                  </td>
                  <td className="px-2 py-2 text-center font-black text-emerald-700">
                    {row.adjustedOrders}
                  </td>
                  <td className="px-2 py-2 text-center font-black text-amber-700">
                    {row.issueCount}
                  </td>
                  <td className="px-2 py-2 text-center">
                    <span className="rounded-full bg-rose-50 px-2 py-1 text-xs font-black text-rose-800">
                      {row.score}%
                    </span>
                  </td>
                </tr>
              ))}
              {attentionRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center font-bold text-slate-400">
                    No attention item found for {reportTitle}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-h-5 text-sm font-bold text-slate-500">
          {isLoading ? 'Loading...' : statusMessage || `Showing ${reportTitle}`}
        </p>
        <button
          type="button"
          onClick={() => navigate('/progress-report/monthly-report')}
          className="ars-glass-button inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-black"
        >
          Open monthly details
          <ArrowRight size={17} />
        </button>
      </div>
    </section>
  );
}
