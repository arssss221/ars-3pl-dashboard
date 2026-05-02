import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  Printer,
  Save,
  Search,
  Settings2,
  X,
} from 'lucide-react';
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

interface SalarySettings {
  designationBasics: Record<string, number>;
  riderTargetOrders: number;
  extraOrderRate: number;
  lowOrderPenaltyRate: number;
}

interface MoneyDraft {
  plus: string;
  minus: string;
}

interface SalarySheetSnapshot {
  monthKey: string;
  selectedMonth: number;
  selectedYear: number;
  reportTitle: string;
  records: DailyReportRecord[];
  monthlyAdjustments: Record<number, MonthlyAdjustment>;
  moneyDrafts: Record<number, MoneyDraft>;
  importedAt: string;
}

interface PaidSalarySheet {
  id: string;
  monthKey: string;
  reportTitle: string;
  savedAt: string;
  employeeCount: number;
  totalFinalSalary: number;
  images: string[];
}

const dailyReportCollection = 'dailyProgressReports';
const monthlyAdjustmentCollection = 'monthlyReportAdjustments';
const databaseTimeoutMs = 8000;
const companyName = 'ARS Logistics Manager';
const settingsStorageKey = 'ars-salary-sheet-settings';
const pendingSheetStorageKey = 'ars-pending-salary-sheet';
const paidHistoryStorageKey = 'ars-paid-salary-sheets';
const defaultSettings: SalarySettings = {
  designationBasics: {
    Driver: 1800,
    'Logistics Manager': 4500,
    'Operations Coordinator': 3200,
    'Operations Manager': 5000,
    'HR Executive': 3000,
  },
  riderTargetOrders: 500,
  extraOrderRate: 3,
  lowOrderPenaltyRate: 2,
};

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

const parseNumber = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const sanitizeMoney = (value: string) => {
  const normalized = value.replace(/[^\d.]/g, '');
  const [whole, decimal] = normalized.split('.');
  return decimal === undefined
    ? whole.slice(0, 7)
    : `${whole.slice(0, 7)}.${decimal.slice(0, 2)}`;
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

const previousMonthDefaults = () => {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return {
    month: date.getMonth(),
    year: date.getFullYear(),
  };
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
  String(employee.designation ?? employee.occupationVisa ?? '').trim() || 'Employee';

const isDriver = (employee: Partial<EmployeeRecord>) =>
  getEmployeeDesignation(employee).toLowerCase() === 'driver';

const normalizeEmployee = (
  data: Record<string, unknown>,
  fallbackId: number
): EmployeeRecord => ({
  id: typeof data.id === 'number' ? data.id : fallbackId,
  idNumber: String(data.idNumber ?? `EMP${fallbackId}`),
  nickName: String(data.nickName ?? data.fullName ?? 'Employee'),
  arabicName: String(data.arabicName ?? ''),
  fullName: String(data.fullName ?? data.name ?? 'Employee'),
  phoneNo: String(data.phoneNo ?? ''),
  phoneNo2: String(data.phoneNo2 ?? ''),
  email: String(data.email ?? ''),
  occupationVisa: String(data.occupationVisa ?? data.designation ?? 'Employee'),
  designation: String(data.designation ?? data.occupationVisa ?? 'Employee'),
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

const loadSalarySettings = (): SalarySettings => {
  try {
    const stored = localStorage.getItem(settingsStorageKey);
    return stored
      ? {
          ...defaultSettings,
          ...JSON.parse(stored),
          designationBasics: {
            ...defaultSettings.designationBasics,
            ...JSON.parse(stored).designationBasics,
          },
        }
      : defaultSettings;
  } catch {
    return defaultSettings;
  }
};

const loadPendingSheet = (): SalarySheetSnapshot | null => {
  try {
    const stored = localStorage.getItem(pendingSheetStorageKey);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const loadPaidHistory = (): PaidSalarySheet[] => {
  try {
    const stored = localStorage.getItem(paidHistoryStorageKey);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export default function SalarySheet() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const defaults = previousMonthDefaults();
  const initialPendingSheet = useMemo(loadPendingSheet, []);
  const [selectedMonth, setSelectedMonth] = useState(
    initialPendingSheet?.selectedMonth ?? defaults.month
  );
  const [selectedYear, setSelectedYear] = useState(
    initialPendingSheet?.selectedYear ?? defaults.year
  );
  const [employees, setEmployees] = useState<EmployeeRecord[]>(employeeSeeds);
  const [records, setRecords] = useState<DailyReportRecord[]>(
    initialPendingSheet?.records ?? []
  );
  const [monthlyAdjustments, setMonthlyAdjustments] = useState<Record<number, MonthlyAdjustment>>(
    initialPendingSheet?.monthlyAdjustments ?? {}
  );
  const [moneyDrafts, setMoneyDrafts] = useState<Record<number, MoneyDraft>>(
    initialPendingSheet?.moneyDrafts ?? {}
  );
  const [settings, setSettings] = useState<SalarySettings>(loadSalarySettings);
  const [settingsDraft, setSettingsDraft] = useState<SalarySettings>(settings);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isClearOpen, setIsClearOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isImported, setIsImported] = useState(Boolean(initialPendingSheet));
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(
    initialPendingSheet ? t('terms.Pending salary sheet restored.', 'Pending salary sheet restored.') : ''
  );
  const [verificationChecks, setVerificationChecks] = useState({
    reviewed: false,
    paid: false,
    printedCopy: false,
  });
  const [historyImages, setHistoryImages] = useState<string[]>([]);
  const [historyImageError, setHistoryImageError] = useState('');
  const [historyConfirm, setHistoryConfirm] = useState(false);

  const tr = (term: string) => t(`terms.${term}`, term);
  const monthKey = monthKeyFor(selectedYear, selectedMonth);
  const reportTitle = `${monthNames[selectedMonth]} ${selectedYear}`;
  const yearOptions = useMemo(
    () => Array.from({ length: 21 }, (_item, index) => 2026 + index),
    []
  );

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
        console.warn('Failed to load employees for salary sheet:', error);
      }
    };

    loadEmployees();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isImported) return;
    const snapshot: SalarySheetSnapshot = {
      monthKey,
      selectedMonth,
      selectedYear,
      reportTitle,
      records,
      monthlyAdjustments,
      moneyDrafts,
      importedAt: initialPendingSheet?.importedAt ?? new Date().toISOString(),
    };
    localStorage.setItem(pendingSheetStorageKey, JSON.stringify(snapshot));
    window.dispatchEvent(new Event('ars-pending-salary-sheet-updated'));
  }, [
    initialPendingSheet?.importedAt,
    isImported,
    moneyDrafts,
    monthKey,
    monthlyAdjustments,
    records,
    reportTitle,
    selectedMonth,
    selectedYear,
  ]);

  const workingEmployees = useMemo(
    () =>
      employees
        .filter((employee) => employee.status === 'Working')
        .sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [employees]
  );

  const designationOptions = useMemo(() => {
    const designations = new Set<string>();
    workingEmployees.forEach((employee) =>
      designations.add(getEmployeeDesignation(employee))
    );
    Object.keys(settings.designationBasics).forEach((designation) =>
      designations.add(designation)
    );
    return Array.from(designations).sort((a, b) => a.localeCompare(b));
  }, [settings.designationBasics, workingEmployees]);

  const salaryRows = useMemo(() => {
    if (!isImported) return [];

    return workingEmployees.map((employee) => {
      const employeeRecords = records.filter(
        (record) => record.riderId === employee.id
      );
      const rawOrders = employeeRecords.reduce(
        (sum, record) => sum + record.orderCount,
        0
      );
      const monthlyAdjustment = monthlyAdjustments[employee.id]?.adjustOrder ?? 0;
      const totalOrders = isDriver(employee) ? rawOrders + monthlyAdjustment : 0;
      const dutyDays = isDriver(employee) ? employeeRecords.length : 0;
      const dutyMinutes = employeeRecords.reduce(
        (sum, record) => sum + parseDutyTimeValue(record.dutyTime),
        0
      );
      const designation = getEmployeeDesignation(employee);
      const basicSalary = settings.designationBasics[designation] ?? 0;
      const orderDifference = isDriver(employee)
        ? totalOrders - settings.riderTargetOrders
        : 0;
      const orderAdjustment =
        orderDifference > 0
          ? orderDifference * settings.extraOrderRate
          : orderDifference < 0
            ? orderDifference * settings.lowOrderPenaltyRate
            : 0;
      const moneyDraft = moneyDrafts[employee.id] ?? { plus: '', minus: '' };
      const moneyPlus = parseNumber(moneyDraft.plus);
      const moneyMinus = parseNumber(moneyDraft.minus);
      const finalSalary = basicSalary + orderAdjustment + moneyPlus - moneyMinus;

      return {
        employee,
        designation,
        totalOrders,
        dutyDays,
        averageDuty: dutyDays ? formatDutyMinutes(dutyMinutes / dutyDays) : '-',
        basicSalary,
        orderAdjustment,
        moneyPlus,
        moneyMinus,
        finalSalary,
      };
    });
  }, [isImported, moneyDrafts, monthlyAdjustments, records, settings, workingEmployees]);

  const totals = useMemo(
    () => ({
      employees: salaryRows.length,
      basic: salaryRows.reduce((sum, row) => sum + row.basicSalary, 0),
      orderAdjustments: salaryRows.reduce(
        (sum, row) => sum + row.orderAdjustment,
        0
      ),
      final: salaryRows.reduce((sum, row) => sum + row.finalSalary, 0),
    }),
    [salaryRows]
  );

  const importMonthlyReport = async () => {
    setIsConfirmOpen(false);
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

      const nextRecords = reportSnapshot.docs.map((item) => {
        const data = item.data() as Record<string, unknown>;
        return {
          date: String(data.date ?? ''),
          riderId: Number(data.riderId ?? 0),
          riderName: String(data.riderName ?? ''),
          designation: String(data.designation ?? 'Driver'),
          orderCount: parseNumber(data.orderCount),
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
          adjustOrder: parseNumber(data.adjustOrder),
          reason: String(data.reason ?? ''),
        };
      });

      setRecords(nextRecords);
      setMonthlyAdjustments(nextAdjustments);
      setMoneyDrafts({});
      setVerificationChecks({
        reviewed: false,
        paid: false,
        printedCopy: false,
      });
      setIsImported(true);
      setStatusMessage(tr('Monthly report imported.'));
    } catch (error) {
      console.error('Failed to import salary sheet report:', error);
      setRecords([]);
      setMonthlyAdjustments({});
      setIsImported(false);
      setStatusMessage(tr('Monthly report could not be imported.'));
    } finally {
      setIsLoading(false);
    }
  };

  const updateMoneyDraft = (
    employeeId: number,
    field: keyof MoneyDraft,
    value: string
  ) => {
    setMoneyDrafts((prev) => ({
      ...prev,
      [employeeId]: {
        plus: prev[employeeId]?.plus ?? '',
        minus: prev[employeeId]?.minus ?? '',
        [field]: sanitizeMoney(value),
      },
    }));
  };

  const saveSettings = () => {
    localStorage.setItem(settingsStorageKey, JSON.stringify(settingsDraft));
    setSettings(settingsDraft);
    setIsSettingsOpen(false);
    setStatusMessage(tr('Salary settings saved.'));
  };

  const clearCurrentSheet = () => {
    localStorage.removeItem(pendingSheetStorageKey);
    window.dispatchEvent(new Event('ars-pending-salary-sheet-updated'));
    setRecords([]);
    setMonthlyAdjustments({});
    setMoneyDrafts({});
    setVerificationChecks({
      reviewed: false,
      paid: false,
      printedCopy: false,
    });
    setHistoryImages([]);
    setHistoryImageError('');
    setHistoryConfirm(false);
    setIsImported(false);
    setIsClearOpen(false);
    setStatusMessage(tr('Salary sheet cleared.'));
  };

  const handleHistoryImages = (files: FileList | null) => {
    if (!files) return;
    const selectedFiles = Array.from(files);
    const oversized = selectedFiles.find((file) => file.size > 1024 * 1024);
    if (oversized) {
      setHistoryImageError(tr('Each image must be 1 MB or less.'));
      return;
    }

    selectedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result !== 'string') return;
        setHistoryImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    setHistoryImageError('');
  };

  const saveToPaidHistory = () => {
    if (!historyConfirm) {
      setHistoryImageError(tr('Please confirm before saving to paid history.'));
      return;
    }

    const nextHistory: PaidSalarySheet[] = [
      {
        id: `${monthKey}_${Date.now()}`,
        monthKey,
        reportTitle,
        savedAt: new Date().toISOString(),
        employeeCount: salaryRows.length,
        totalFinalSalary: totals.final,
        images: historyImages,
      },
      ...loadPaidHistory(),
    ];
    localStorage.setItem(paidHistoryStorageKey, JSON.stringify(nextHistory));
    window.dispatchEvent(new Event('ars-paid-salary-history-updated'));
    clearCurrentSheet();
    navigate('/accounts-salary/paid-history');
  };

  const openSettings = () => {
    setSettingsDraft(settings);
    setIsSettingsOpen(true);
  };

  const openPrintPopup = () => {
    const rows = salaryRows
      .map(
        (row, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${getEmployeeDisplayName(row.employee, i18n.language)}</td>
            <td>${row.employee.iqamaNumber || '-'}</td>
            <td>${row.designation}</td>
            <td>${row.totalOrders}</td>
            <td>${row.dutyDays}</td>
            <td>${row.averageDuty}</td>
            <td>${row.basicSalary.toFixed(2)}</td>
            <td>${row.orderAdjustment.toFixed(2)}</td>
            <td>${row.moneyPlus.toFixed(2)}</td>
            <td>${row.moneyMinus.toFixed(2)}</td>
            <td>${row.finalSalary.toFixed(2)}</td>
            <td></td>
          </tr>`
      )
      .join('');

    const popup = window.open('', '_blank', 'width=1200,height=780');
    if (!popup) {
      setStatusMessage(tr('Popup was blocked. Please allow popups for printing.'));
      return;
    }

    popup.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${companyName} - ${reportTitle} ${tr('Salary Sheet')}</title>
          <style>
            body { margin: 0; background: #f8fafc; color: #0f172a; font-family: Arial, sans-serif; }
            .sheet { width: 13in; margin: 20px auto; padding: 0.25in; background: #fff; }
            h1 { margin: 0; text-align: center; font-size: 22px; font-weight: 800; }
            h2 { margin: 6px 0 18px; text-align: center; font-size: 16px; font-weight: 700; }
            table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
            th, td { border: 1px solid #94a3b8; padding: 5px; text-align: center; vertical-align: middle; }
            th { background: #ecfdf5; color: #065f46; font-weight: 800; }
            td:nth-child(2), td:nth-child(4) { text-align: left; }
            tbody tr { height: 0.7in; }
            @media print {
              @page { size: landscape; margin: 0.25in; }
              body { background: #fff; }
              .sheet { width: auto; margin: 0; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="sheet">
            <h1>${companyName}</h1>
            <h2>${reportTitle} ${tr('Salary Sheet')}</h2>
            <table>
              <thead>
                <tr>
                  <th>${tr('SL')}</th>
                  <th>${tr('Employee Name')}</th>
                  <th>${tr('Iqama Number')}</th>
                  <th>${tr('Designation')}</th>
                  <th>${tr('Total Orders')}</th>
                  <th>${tr('Duty Days')}</th>
                  <th>${tr('Avg Duty Time')}</th>
                  <th>${tr('Basic Salary')}</th>
                  <th>${tr('Order Adjustment')}</th>
                  <th>${tr('Addition')}</th>
                  <th>${tr('Deduction')}</th>
                  <th>${tr('Final Salary')}</th>
                  <th>${tr('Fingerprint')}</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
          <script>
            window.onload = function () {
              window.focus();
              window.print();
            };
          </script>
        </body>
      </html>`);
    popup.document.close();
  };

  return (
    <section className="ars-page p-3 sm:p-4 md:p-5">
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/80 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg font-black text-slate-900 dark:text-slate-100">
            {tr('Salary Sheet')}
          </h1>
          <p className="mt-1 text-sm font-bold text-slate-500">
            {tr('Prepare salary sheet from the completed monthly report.')}
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:w-[27rem]">
          <label className="text-xs font-black uppercase tracking-normal text-slate-500">
            {tr('Month')}
            <select
              value={selectedMonth}
              disabled={isImported}
              onChange={(event) => setSelectedMonth(Number(event.target.value))}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-800 outline-none focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              {monthNames.map((month, index) => (
                <option key={month} value={index}>
                  {tr(month)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-black uppercase tracking-normal text-slate-500">
            {tr('Year')}
            <select
              value={selectedYear}
              disabled={isImported}
              onChange={(event) => setSelectedYear(Number(event.target.value))}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-black text-slate-800 outline-none focus:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
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
            onClick={() => setIsConfirmOpen(true)}
            disabled={isLoading || isImported}
            className="ars-primary-button inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Search size={17} />
            {tr('Import Monthly Report')}
          </button>
          <button
            type="button"
            onClick={() => setIsClearOpen(true)}
            disabled={!isImported}
            className="ars-glass-button inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={17} />
            {tr('Clear')}
          </button>
          <button
            type="button"
            onClick={openSettings}
            className="ars-glass-button inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-black"
          >
            <Settings2 size={17} />
            {tr('Salary Settings')}
          </button>
          <button
            type="button"
            onClick={openPrintPopup}
            disabled={!isImported}
            className="ars-glass-button inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Printer size={17} />
            {tr('Print')}
          </button>
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title={tr('Employees')} value={totals.employees} />
        <SummaryCard title={tr('Basic Salary')} value={totals.basic.toFixed(2)} />
        <SummaryCard
          title={tr('Order Adjustment')}
          value={totals.orderAdjustments.toFixed(2)}
        />
        <SummaryCard title={tr('Final Salary')} value={totals.final.toFixed(2)} />
      </div>

      {!isImported && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="mt-0.5 shrink-0" />
            <p>{tr('Select month and year, then import the completed monthly report to prepare salary sheet.')}</p>
          </div>
        </div>
      )}

      <div className="ars-table-shell w-full overflow-x-auto">
        <table className="min-w-[82rem] w-full table-fixed border-collapse text-xs sm:text-sm">
          <colgroup>
            <col className="w-[4rem]" />
            <col className="w-[15rem]" />
            <col className="w-[8rem]" />
            <col className="w-[8rem]" />
            <col className="w-[5.5rem]" />
            <col className="w-[5.5rem]" />
            <col className="w-[6rem]" />
            <col className="w-[6.5rem]" />
            <col className="w-[7rem]" />
            <col className="w-[6rem]" />
            <col className="w-[6rem]" />
            <col className="w-[7rem]" />
            <col className="w-[9rem]" />
          </colgroup>
          <thead className="ars-table-head text-left text-xs font-black uppercase tracking-normal text-slate-500">
            <tr>
              <th className="px-2 py-2 text-center">{tr('SL')}</th>
              <th className="px-2 py-2">{tr('Employee Name')}</th>
              <th className="px-2 py-2 text-center">{tr('Iqama Number')}</th>
              <th className="px-2 py-2">{tr('Designation')}</th>
              <th className="px-2 py-2 text-center">{tr('Total Orders')}</th>
              <th className="px-2 py-2 text-center">{tr('Duty Days')}</th>
              <th className="px-2 py-2 text-center">{tr('Avg Duty Time')}</th>
              <th className="px-2 py-2 text-center">{tr('Basic Salary')}</th>
              <th className="px-2 py-2 text-center">{tr('Order Adjustment')}</th>
              <th className="px-2 py-2 text-center">{tr('Addition')}</th>
              <th className="px-2 py-2 text-center">{tr('Deduction')}</th>
              <th className="px-2 py-2 text-center">{tr('Final Salary')}</th>
              <th className="px-2 py-2 text-center">{tr('Fingerprint')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {salaryRows.map((row, index) => (
              <tr key={row.employee.id} className="bg-white/60 dark:bg-slate-950/40">
                <td className="px-2 py-2 text-center font-black text-slate-500">
                  {index + 1}
                </td>
                <td className="px-2 py-2">
                  <p className="truncate font-black text-slate-900 dark:text-slate-100">
                    {getEmployeeDisplayName(row.employee, i18n.language)}
                  </p>
                </td>
                <td className="px-2 py-2 text-center font-bold text-slate-700 dark:text-slate-200">
                  {row.employee.iqamaNumber || '-'}
                </td>
                <td className="px-2 py-2 font-bold text-slate-700 dark:text-slate-200">
                  {tr(row.designation)}
                </td>
                <td className="px-2 py-2 text-center font-black text-emerald-700">
                  {row.totalOrders}
                </td>
                <td className="px-2 py-2 text-center font-black text-slate-700 dark:text-slate-200">
                  {row.dutyDays}
                </td>
                <td className="px-2 py-2 text-center font-black text-slate-700 dark:text-slate-200">
                  {row.averageDuty}
                </td>
                <td className="px-2 py-2 text-center font-black text-slate-700 dark:text-slate-200">
                  {row.basicSalary.toFixed(2)}
                </td>
                <td
                  className={`px-2 py-2 text-center font-black ${
                    row.orderAdjustment < 0 ? 'text-rose-700' : 'text-emerald-700'
                  }`}
                >
                  {row.orderAdjustment.toFixed(2)}
                </td>
                <td className="px-2 py-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={moneyDrafts[row.employee.id]?.plus ?? ''}
                    onChange={(event) =>
                      updateMoneyDraft(row.employee.id, 'plus', event.target.value)
                    }
                    className="h-8 w-full rounded-md border border-slate-200 bg-white px-1 text-center font-bold outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900"
                    placeholder="0"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={moneyDrafts[row.employee.id]?.minus ?? ''}
                    onChange={(event) =>
                      updateMoneyDraft(row.employee.id, 'minus', event.target.value)
                    }
                    className="h-8 w-full rounded-md border border-slate-200 bg-white px-1 text-center font-bold outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900"
                    placeholder="0"
                  />
                </td>
                <td className="px-2 py-2 text-center text-base font-black text-cyan-600 dark:text-cyan-300">
                  {row.finalSalary.toFixed(2)}
                </td>
                <td className="px-2 py-2">
                  <div className="h-8 rounded-md border border-dashed border-slate-300 bg-white/50 dark:border-slate-700 dark:bg-slate-950/50" />
                </td>
              </tr>
            ))}
            {salaryRows.length === 0 && (
              <tr>
                <td colSpan={13} className="px-4 py-10 text-center font-bold text-slate-400">
                  {tr('No working employee profiles found.')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isImported && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
          <div className="grid gap-3">
            <label className="flex items-start gap-3 text-sm font-bold leading-6 text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={verificationChecks.reviewed}
                onChange={(event) =>
                  setVerificationChecks((prev) => ({
                    ...prev,
                    reviewed: event.target.checked,
                  }))
                }
                className="mt-1 h-4 w-4"
              />
              {tr('We have checked this sheet several times and all information is correct.')}
            </label>
            <label className="flex items-start gap-3 text-sm font-bold leading-6 text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={verificationChecks.paid}
                onChange={(event) =>
                  setVerificationChecks((prev) => ({
                    ...prev,
                    paid: event.target.checked,
                  }))
                }
                className="mt-1 h-4 w-4"
              />
              {tr('We have paid salaries to all employees.')}
            </label>
            <label className="flex items-start gap-3 text-sm font-bold leading-6 text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={verificationChecks.printedCopy}
                onChange={(event) =>
                  setVerificationChecks((prev) => ({
                    ...prev,
                    printedCopy: event.target.checked,
                  }))
                }
                className="mt-1 h-4 w-4"
              />
              {tr('We have the printed copy of this sheet with fingerprint.')}
            </label>
          </div>

          {verificationChecks.reviewed &&
            verificationChecks.paid &&
            verificationChecks.printedCopy && (
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsHistoryOpen(true)}
                  className="ars-primary-button inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-black"
                >
                  <Save size={17} />
                  {tr('Save this sheet to Paid History')}
                </button>
              </div>
            )}
        </div>
      )}

      <div className="mt-4 min-h-5 text-sm font-bold text-slate-500">
        {isLoading ? tr('Loading...') : statusMessage}
      </div>

      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                  {tr('Confirm monthly report completion')}
                </h2>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-600 dark:text-slate-300">
                  {tr('Before importing, confirm that rider checking and order adjustments are completed in Monthly Report.')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="ars-glass-button inline-flex h-9 w-9 items-center justify-center rounded-lg"
                aria-label={tr('Close')}
              >
                <X size={17} />
              </button>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => navigate('/progress-report/monthly-report')}
                className="ars-glass-button inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-black"
              >
                <AlertTriangle size={17} />
                {tr('No, go to Monthly Report')}
              </button>
              <button
                type="button"
                onClick={importMonthlyReport}
                className="ars-primary-button inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-black"
              >
                <CheckCircle2 size={17} />
                {tr('Yes, import report')}
              </button>
            </div>
          </div>
        </div>
      )}

      {isClearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-start gap-3">
              <AlertTriangle size={22} className="mt-0.5 shrink-0 text-rose-600" />
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                  {tr('Clear salary sheet?')}
                </h2>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-600 dark:text-slate-300">
                  {tr('If this data is cleared, it cannot be restored.')}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsClearOpen(false)}
                className="ars-glass-button rounded-lg px-4 py-2 text-sm font-black"
              >
                {tr('Cancel')}
              </button>
              <button
                type="button"
                onClick={clearCurrentSheet}
                className="rounded-lg border border-rose-200 bg-rose-600 px-4 py-2 text-sm font-black text-white shadow-sm"
              >
                {tr('Clear')}
              </button>
            </div>
          </div>
        </div>
      )}

      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                  {tr('Save this sheet to Paid History')}
                </h2>
                <p className="mt-1 text-sm font-bold text-slate-500">
                  {reportTitle} - {salaryRows.length} {tr('Employees')} - {totals.final.toFixed(2)} SAR
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="ars-glass-button inline-flex h-9 w-9 items-center justify-center rounded-lg"
                aria-label={tr('Close')}
              >
                <X size={17} />
              </button>
            </div>

            <div className="grid gap-3 rounded-xl bg-slate-50 p-3 text-sm font-bold text-slate-700 dark:bg-slate-950 dark:text-slate-200 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase text-slate-500">{tr('Month')}</p>
                <p className="mt-1 font-black">{reportTitle}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">{tr('Employees')}</p>
                <p className="mt-1 font-black">{salaryRows.length}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">{tr('Final Salary')}</p>
                <p className="mt-1 font-black text-cyan-600">{totals.final.toFixed(2)}</p>
              </div>
            </div>

            <label className="mt-4 block rounded-xl border border-dashed border-slate-300 bg-white/60 p-4 text-center text-sm font-black text-slate-600 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-300">
              {tr('Upload printed fingerprint sheet images')}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => handleHistoryImages(event.target.files)}
                className="mt-3 block w-full text-sm font-bold"
              />
              <span className="mt-2 block text-xs font-bold text-slate-500">
                {tr('Each image must be 1 MB or less.')}
              </span>
            </label>

            {historyImages.length > 0 && (
              <div className="mt-3 grid gap-2 sm:grid-cols-4">
                {historyImages.map((image, index) => (
                  <div key={`${image.slice(0, 20)}_${index}`} className="relative">
                    <img
                      src={image}
                      alt={`Salary sheet ${index + 1}`}
                      className="h-24 w-full rounded-lg border border-slate-200 object-cover dark:border-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setHistoryImages((prev) =>
                          prev.filter((_item, itemIndex) => itemIndex !== index)
                        )
                      }
                      className="absolute right-1 top-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/80 text-white"
                      aria-label={tr('Delete')}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {historyImageError && (
              <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm font-bold text-rose-700">
                {historyImageError}
              </p>
            )}

            <label className="mt-4 flex items-start gap-3 rounded-xl bg-amber-50 p-3 text-sm font-bold leading-6 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
              <input
                type="checkbox"
                checked={historyConfirm}
                onChange={(event) => setHistoryConfirm(event.target.checked)}
                className="mt-1 h-4 w-4"
              />
              {tr('I consciously confirm that this salary sheet will be added to Paid History and cannot be edited again.')}
            </label>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                className="ars-glass-button rounded-lg px-4 py-2 text-sm font-black"
              >
                {tr('Cancel')}
              </button>
              <button
                type="button"
                onClick={saveToPaidHistory}
                className="ars-primary-button rounded-lg px-4 py-2 text-sm font-black disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!historyConfirm}
              >
                {tr('Confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                  {tr('Salary Settings')}
                </h2>
                <p className="mt-1 text-sm font-bold text-slate-500">
                  {tr('Set basic salary by position and rider order rules.')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="ars-glass-button inline-flex h-9 w-9 items-center justify-center rounded-lg"
                aria-label={tr('Close')}
              >
                <X size={17} />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="text-sm font-black text-slate-700 dark:text-slate-200">
                {tr('Rider Target Orders')}
                <input
                  type="text"
                  inputMode="numeric"
                  value={settingsDraft.riderTargetOrders}
                  onChange={(event) =>
                    setSettingsDraft((prev) => ({
                      ...prev,
                      riderTargetOrders: parseNumber(event.target.value),
                    }))
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-center font-black outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950"
                />
              </label>
              <label className="text-sm font-black text-slate-700 dark:text-slate-200">
                {tr('Extra Per Order')}
                <input
                  type="text"
                  inputMode="decimal"
                  value={settingsDraft.extraOrderRate}
                  onChange={(event) =>
                    setSettingsDraft((prev) => ({
                      ...prev,
                      extraOrderRate: parseNumber(event.target.value),
                    }))
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-center font-black outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950"
                />
              </label>
              <label className="text-sm font-black text-slate-700 dark:text-slate-200">
                {tr('Minus Per Low Order')}
                <input
                  type="text"
                  inputMode="decimal"
                  value={settingsDraft.lowOrderPenaltyRate}
                  onChange={(event) =>
                    setSettingsDraft((prev) => ({
                      ...prev,
                      lowOrderPenaltyRate: parseNumber(event.target.value),
                    }))
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-center font-black outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950"
                />
              </label>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {designationOptions.map((designation) => (
                <label
                  key={designation}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm font-black text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                >
                  {tr(designation)}
                  <input
                    type="text"
                    inputMode="decimal"
                    value={settingsDraft.designationBasics[designation] ?? ''}
                    onChange={(event) =>
                      setSettingsDraft((prev) => ({
                        ...prev,
                        designationBasics: {
                          ...prev.designationBasics,
                          [designation]: parseNumber(event.target.value),
                        },
                      }))
                    }
                    className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-center font-black outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900"
                  />
                </label>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={saveSettings}
                className="ars-primary-button inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-black"
              >
                <Save size={17} />
                {tr('Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function SummaryCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-normal text-slate-500">
            {title}
          </p>
          <p className="mt-2 text-2xl font-black text-slate-900 dark:text-slate-100">
            {value}
          </p>
        </div>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          <Calculator size={20} />
        </span>
      </div>
    </div>
  );
}
