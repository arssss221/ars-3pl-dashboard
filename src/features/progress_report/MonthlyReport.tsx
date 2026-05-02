import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { Download, Edit3, Eye, Printer, Save, Search, X } from 'lucide-react';
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
  monthKey: string;
  adjustOrder: number;
  reason: string;
}

interface AdjustmentDraft {
  adjustOrder: string;
  reason: string;
}

interface MonthlyRow {
  serial: number;
  rider: EmployeeRecord;
  records: DailyReportRecord[];
  rawOrderTotal: number;
  adjustedOrderTotal: number;
  adjustment: MonthlyAdjustment;
  reportDays: number;
  totalDutyMinutes: number;
  averageDutyTime: string;
  rank: number;
}

const dailyReportCollection = 'dailyProgressReports';
const monthlyAdjustmentCollection = 'monthlyReportAdjustments';
const companyName = 'ARS Logistics Manager';
const databaseTimeoutMs = 8000;

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
  if (!year || !month || !day) return dateValue;
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
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

const sanitizeAdjustment = (value: string) => {
  const normalized = value.replace(/[^\d-]/g, '');
  const sign = normalized.startsWith('-') ? '-' : '';
  return `${sign}${normalized.replace(/-/g, '').slice(0, 4)}`;
};

export default function MonthlyReport() {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [employees, setEmployees] = useState<EmployeeRecord[]>(employeeSeeds);
  const [records, setRecords] = useState<DailyReportRecord[]>([]);
  const [adjustments, setAdjustments] = useState<Record<number, MonthlyAdjustment>>({});
  const [drafts, setDrafts] = useState<Record<number, AdjustmentDraft>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [searchVersion, setSearchVersion] = useState(0);
  const [activeRiderId, setActiveRiderId] = useState<number | null>(null);

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
        console.warn('Failed to load employees for monthly report:', error);
      }
    };

    loadEmployees();

    return () => {
      isMounted = false;
    };
  }, []);

  const riders = useMemo(
    () =>
      employees
        .filter(isWorkingDriver)
        .sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [employees]
  );

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
            monthKey: String(data.monthKey ?? monthKey),
            adjustOrder: parseOrderCount(data.adjustOrder),
            reason: String(data.reason ?? ''),
          };
        });

        setRecords(nextRecords);
        setAdjustments(nextAdjustments);
        setDrafts(
          Object.fromEntries(
            Object.entries(nextAdjustments).map(([riderId, adjustment]) => [
              riderId,
              {
                adjustOrder: adjustment.adjustOrder
                  ? String(adjustment.adjustOrder)
                  : '',
                reason: adjustment.reason,
              },
            ])
          )
        );
      } catch (error) {
        console.error('Failed to load monthly reports:', error);
        if (isMounted) {
          setRecords([]);
          setAdjustments({});
          setDrafts({});
          setStatusMessage('Monthly report data could not be loaded.');
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

  const reportRows = useMemo<MonthlyRow[]>(() => {
    const rows = riders.map((rider, index) => {
      const riderRecords = records
        .filter((record) => record.riderId === rider.id)
        .sort((a, b) => a.date.localeCompare(b.date));
      const rawOrderTotal = riderRecords.reduce(
        (sum, record) => sum + record.orderCount,
        0
      );
      const totalDutyMinutes = riderRecords.reduce(
        (sum, record) => sum + parseDutyTimeValue(record.dutyTime),
        0
      );
      const adjustment = adjustments[rider.id] ?? {
        riderId: rider.id,
        monthKey,
        adjustOrder: 0,
        reason: '',
      };
      const reportDays = riderRecords.length;

      return {
        serial: index + 1,
        rider,
        records: riderRecords,
        rawOrderTotal,
        adjustedOrderTotal: rawOrderTotal + adjustment.adjustOrder,
        adjustment,
        reportDays,
        totalDutyMinutes,
        averageDutyTime: reportDays
          ? formatDutyMinutes(totalDutyMinutes / reportDays)
          : '-',
        rank: 0,
      };
    });

    const sortedByOrder = [...rows].sort(
      (a, b) => b.adjustedOrderTotal - a.adjustedOrderTotal
    );
    const rankByRider = new Map<number, number>();
    sortedByOrder.forEach((row, index) => {
      rankByRider.set(row.rider.id, index + 1);
    });

    return rows.map((row) => ({
      ...row,
      rank: rankByRider.get(row.rider.id) ?? row.serial,
    }));
  }, [adjustments, monthKey, records, riders]);

  const activeRow = reportRows.find((row) => row.rider.id === activeRiderId) ?? null;

  const updateDraft = (
    riderId: number,
    field: keyof AdjustmentDraft,
    value: string
  ) => {
    setDrafts((prev) => ({
      ...prev,
      [riderId]: {
        adjustOrder:
          field === 'adjustOrder'
            ? value
            : prev[riderId]?.adjustOrder ??
              (adjustments[riderId]?.adjustOrder
                ? String(adjustments[riderId]?.adjustOrder)
                : ''),
        reason:
          field === 'reason'
            ? value
            : prev[riderId]?.reason ?? adjustments[riderId]?.reason ?? '',
      },
    }));
  };

  const saveAdjustments = async () => {
    const invalidRow = reportRows.find((row) => {
      const draft = drafts[row.rider.id];
      const adjustOrder = parseOrderCount(draft?.adjustOrder);
      return adjustOrder !== 0 && !String(draft?.reason ?? '').trim();
    });

    if (invalidRow) {
      setStatusMessage(
        `${getEmployeeDisplayName(invalidRow.rider)} adjustment reason is required.`
      );
      return;
    }

    setIsLoading(true);
    setStatusMessage('');
    try {
      await withDatabaseTimeout(
        Promise.all(
          reportRows.map((row) => {
            const draft = drafts[row.rider.id] ?? {
              adjustOrder: row.adjustment.adjustOrder
                ? String(row.adjustment.adjustOrder)
                : '',
              reason: row.adjustment.reason,
            };
            const adjustOrder = parseOrderCount(draft.adjustOrder);
            const reason = draft.reason.trim();

            return setDoc(
              doc(db, monthlyAdjustmentCollection, `${monthKey}_${row.rider.id}`),
              {
                monthKey,
                riderId: row.rider.id,
                riderName: row.rider.fullName,
                adjustOrder,
                reason,
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
          })
        )
      );

      const nextAdjustments = Object.fromEntries(
        reportRows.map((row) => {
          const draft = drafts[row.rider.id] ?? {
            adjustOrder: '',
            reason: '',
          };
          return [
            row.rider.id,
            {
              riderId: row.rider.id,
              monthKey,
              adjustOrder: parseOrderCount(draft.adjustOrder),
              reason: draft.reason.trim(),
            },
          ];
        })
      );
      setAdjustments(nextAdjustments);
      setIsEditMode(false);
      setStatusMessage('Monthly adjustments saved.');
    } catch (error) {
      console.error('Failed to save monthly adjustments:', error);
      setStatusMessage('Save failed. Please check the database connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const openPrintPopup = () => {
    const popup = window.open('', '_blank', 'width=1100,height=780');
    if (!popup) {
      setStatusMessage('Popup was blocked. Please allow popups for printing.');
      return;
    }

    const rows = reportRows
      .map(
        (row) => `
          <tr>
            <td>${row.serial}</td>
            <td>${getEmployeeDisplayName(row.rider)}</td>
            <td>${row.adjustedOrderTotal}</td>
            <td>${row.averageDutyTime}</td>
            <td>${row.reportDays}</td>
            <td>${row.rank}</td>
          </tr>`
      )
      .join('');

    popup.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Monthly Report ${reportTitle}</title>
          <style>
            body { margin: 0; background: #f8fafc; color: #0f172a; font-family: Arial, sans-serif; }
            .sheet { width: 980px; margin: 24px auto; padding: 32px; background: #fff; }
            h1 { margin: 0; text-align: center; font-size: 24px; font-weight: 800; }
            h2 { margin: 8px 0 24px; text-align: center; font-size: 17px; font-weight: 700; }
            table { width: 100%; border-collapse: collapse; font-size: 13px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
            th { background: #ecfdf5; color: #065f46; font-weight: 800; }
            td:first-child, td:nth-child(3), td:nth-child(4), td:nth-child(5), td:nth-child(6) { text-align: center; }
            @media print { body { background: #fff; } .sheet { width: auto; margin: 0; padding: 20px; } }
          </style>
        </head>
        <body>
          <div class="sheet">
            <h1>${companyName}</h1>
            <h2>Monthly Report - ${reportTitle}</h2>
            <table>
              <thead>
                <tr>
                  <th>Serial</th>
                  <th>Rider Name</th>
                  <th>Total Order</th>
                  <th>Average Duty Time</th>
                  <th>Report Days</th>
                  <th>Rank</th>
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

  const downloadRiderScreenshot = async (row: MonthlyRow) => {
    const scale = 2;
    const width = 940;
    const rowHeight = 42;
    const tableTop = 148;
    const height = tableTop + 44 + Math.max(row.records.length, 1) * rowHeight + 86;
    const columns = [190, 150, 160, 440];
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const context = canvas.getContext('2d');

    if (!context) {
      setStatusMessage('Screenshot failed on this browser.');
      return;
    }

    context.scale(scale, scale);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.fillStyle = '#0f172a';
    context.textAlign = 'center';
    context.font = '800 23px Arial';
    context.fillText(companyName, width / 2, 38);
    context.font = '700 15px Arial';
    context.fillText(
      `${getEmployeeDisplayName(row.rider)} | Iqama: ${
        row.rider.iqamaNumber || '-'
      } | ${reportTitle}`,
      width / 2,
      70
    );

    const headers = ['Date', 'Orders', 'Duty Time', 'Problem'];
    let x = 0;
    context.textBaseline = 'middle';
    headers.forEach((header, index) => {
      context.fillStyle = '#ecfdf5';
      context.fillRect(x, 104, columns[index], 44);
      context.strokeStyle = '#cbd5e1';
      context.strokeRect(x, 104, columns[index], 44);
      context.fillStyle = '#065f46';
      context.font = '800 13px Arial';
      context.textAlign = index === 3 ? 'left' : 'center';
      context.fillText(header, index === 3 ? x + 12 : x + columns[index] / 2, 126);
      x += columns[index];
    });

    row.records.forEach((record, index) => {
      const y = tableTop + index * rowHeight;
      const cells = [
        formatDisplayDate(record.date),
        String(record.orderCount),
        record.dutyTime || '-',
        record.issue || '-',
      ];
      x = 0;
      cells.forEach((cell, cellIndex) => {
        context.fillStyle = '#ffffff';
        context.fillRect(x, y, columns[cellIndex], rowHeight);
        context.strokeStyle = '#cbd5e1';
        context.strokeRect(x, y, columns[cellIndex], rowHeight);
        context.fillStyle = '#0f172a';
        context.font = '700 12px Arial';
        context.textAlign = cellIndex === 3 ? 'left' : 'center';
        context.fillText(
          cell,
          cellIndex === 3 ? x + 12 : x + columns[cellIndex] / 2,
          y + rowHeight / 2
        );
        x += columns[cellIndex];
      });
    });

    const footerY = tableTop + Math.max(row.records.length, 1) * rowHeight;
    const footerCells = [
      `Total Days: ${row.reportDays}`,
      String(row.rawOrderTotal),
      formatDutyMinutes(row.totalDutyMinutes),
      row.adjustment.adjustOrder
        ? `Adjusted: ${row.adjustment.adjustOrder} | ${row.adjustment.reason}`
        : '-',
    ];
    x = 0;
    footerCells.forEach((cell, index) => {
      context.fillStyle = '#f8fafc';
      context.fillRect(x, footerY, columns[index], 44);
      context.strokeStyle = '#cbd5e1';
      context.strokeRect(x, footerY, columns[index], 44);
      context.fillStyle = '#0f172a';
      context.font = '800 12px Arial';
      context.textAlign = index === 3 ? 'left' : 'center';
      context.fillText(cell, index === 3 ? x + 12 : x + columns[index] / 2, footerY + 22);
      x += columns[index];
    });

    const link = document.createElement('a');
    link.download = `monthly-rider-history-${monthKey}-${row.rider.id}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setStatusMessage('Screenshot downloaded.');
  };

  return (
    <section className="ars-page p-3 sm:p-4 md:p-5">
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/80 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid flex-1 gap-2 sm:grid-cols-2 lg:max-w-lg">
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

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => setSearchVersion((value) => value + 1)}
            className="ars-primary-button inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-black"
          >
            <Search size={17} />
            Search
          </button>
          {isEditMode ? (
            <button
              type="button"
              onClick={saveAdjustments}
              disabled={isLoading}
              className="ars-primary-button inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={17} />
              Save
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditMode(true)}
              className="ars-glass-button inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-black"
            >
              <Edit3 size={17} />
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="ars-table-shell w-full overflow-hidden">
        <table className="w-full table-fixed border-collapse text-xs sm:text-sm">
          <colgroup>
            <col className="w-[7%]" />
            <col className={isEditMode ? 'w-[20%]' : 'w-[28%]'} />
            <col className="w-[11%]" />
            {isEditMode && <col className="w-[11%]" />}
            {isEditMode && <col className="w-[18%]" />}
            <col className="w-[14%]" />
            <col className="w-[13%]" />
            <col className="w-[10%]" />
            <col className="w-[6%]" />
          </colgroup>
          <thead className="ars-table-head text-left text-xs font-black uppercase tracking-normal text-slate-500">
            <tr>
              <th className="px-1.5 py-2 text-center sm:px-2">SL</th>
              <th className="px-1.5 py-2 sm:px-2">Rider Name</th>
              <th className="px-1.5 py-2 text-center sm:px-2">Total Order</th>
              {isEditMode && (
                <th className="px-1.5 py-2 text-center sm:px-2">Adjust Order</th>
              )}
              {isEditMode && <th className="px-1.5 py-2 sm:px-2">Reason</th>}
              <th className="px-1.5 py-2 text-center sm:px-2">Avg Duty Time</th>
              <th className="px-1.5 py-2 text-center sm:px-2">Report Days</th>
              <th className="px-1.5 py-2 text-center sm:px-2">Rank</th>
              <th className="px-1.5 py-2 text-center sm:px-2">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {reportRows.map((row) => (
              <tr key={row.rider.id} className="bg-white/60 dark:bg-slate-950/40">
                <td className="px-1.5 py-2 text-center font-black text-slate-500 sm:px-2">
                  {row.serial}
                </td>
                <td className="px-1.5 py-2 sm:px-2">
                  <p className="truncate text-sm font-black text-slate-900 dark:text-slate-100">
                    {getEmployeeDisplayName(row.rider)}
                  </p>
                </td>
                <td className="px-1.5 py-2 text-center text-sm font-black text-emerald-700 sm:px-2">
                  {row.adjustedOrderTotal}
                </td>
                {isEditMode && (
                  <td className="px-1.5 py-2 sm:px-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={
                        drafts[row.rider.id]?.adjustOrder ??
                        (row.adjustment.adjustOrder
                          ? String(row.adjustment.adjustOrder)
                          : '')
                      }
                      onChange={(event) =>
                        updateDraft(
                          row.rider.id,
                          'adjustOrder',
                          sanitizeAdjustment(event.target.value)
                        )
                      }
                      className="h-8 w-full rounded-md border border-slate-200 bg-white px-1 text-center font-bold outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900"
                      placeholder="+/-"
                    />
                  </td>
                )}
                {isEditMode && (
                  <td className="px-1.5 py-2 sm:px-2">
                    <input
                      type="text"
                      value={drafts[row.rider.id]?.reason ?? row.adjustment.reason}
                      onChange={(event) =>
                        updateDraft(row.rider.id, 'reason', event.target.value)
                      }
                      className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 font-bold outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900"
                      placeholder="Required for adjustment"
                    />
                  </td>
                )}
                <td className="px-1.5 py-2 text-center font-black text-slate-700 dark:text-slate-200 sm:px-2">
                  {row.averageDutyTime}
                </td>
                <td className="px-1.5 py-2 text-center font-black text-slate-700 dark:text-slate-200 sm:px-2">
                  {row.reportDays}
                </td>
                <td className="px-1.5 py-2 text-center font-black text-slate-700 dark:text-slate-200 sm:px-2">
                  {row.rank}
                </td>
                <td className="px-1.5 py-2 text-center sm:px-2">
                  <button
                    type="button"
                    onClick={() => setActiveRiderId(row.rider.id)}
                    className="ars-glass-button inline-flex h-9 w-9 items-center justify-center rounded-lg"
                    aria-label={`View ${getEmployeeDisplayName(row.rider)}`}
                  >
                    <Eye size={17} />
                  </button>
                </td>
              </tr>
            ))}
            {reportRows.length === 0 && (
              <tr>
                <td
                  colSpan={isEditMode ? 9 : 7}
                  className="px-4 py-10 text-center font-bold text-slate-400"
                >
                  No working driver profiles found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-h-5 text-sm font-bold text-slate-500">
          {isLoading ? 'Loading...' : statusMessage}
        </p>
        <button
          type="button"
          onClick={openPrintPopup}
          className="ars-glass-button inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-black"
        >
          <Printer size={17} />
          Print
        </button>
      </div>

      {activeRow && (
        <div className="fixed inset-0 z-50 bg-slate-950/45">
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-4xl flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="border-b border-slate-200 p-4 dark:border-slate-700">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-normal text-emerald-700">
                    {companyName}
                  </p>
                  <h2 className="mt-1 truncate text-lg font-black text-slate-900 dark:text-slate-100">
                    {getEmployeeDisplayName(activeRow.rider)}
                  </h2>
                  <p className="mt-1 text-sm font-bold text-slate-500">
                    Iqama: {activeRow.rider.iqamaNumber || '-'} | {reportTitle}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => downloadRiderScreenshot(activeRow)}
                    className="ars-glass-button inline-flex h-9 w-9 items-center justify-center rounded-lg"
                    aria-label="Screenshot"
                  >
                    <Download size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveRiderId(null)}
                    className="ars-glass-button inline-flex h-9 w-9 items-center justify-center rounded-lg"
                    aria-label="Close"
                  >
                    <X size={17} />
                  </button>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-4">
              <div className="ars-table-shell w-full overflow-hidden">
                <table className="w-full table-fixed border-collapse text-xs sm:text-sm">
                  <colgroup>
                    <col className="w-[24%]" />
                    <col className="w-[18%]" />
                    <col className="w-[20%]" />
                    <col className="w-[38%]" />
                  </colgroup>
                  <thead className="ars-table-head text-left text-xs font-black uppercase tracking-normal text-slate-500">
                    <tr>
                      <th className="px-2 py-2">Date</th>
                      <th className="px-2 py-2 text-center">Orders</th>
                      <th className="px-2 py-2 text-center">Duty Time</th>
                      <th className="px-2 py-2">Problem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {activeRow.records.map((record) => (
                      <tr
                        key={`${record.date}_${record.riderId}`}
                        className="bg-white/60 dark:bg-slate-950/40"
                      >
                        <td className="px-2 py-2 font-black text-slate-700 dark:text-slate-200">
                          {formatDisplayDate(record.date)}
                        </td>
                        <td className="px-2 py-2 text-center font-black text-emerald-700">
                          {record.orderCount}
                        </td>
                        <td className="px-2 py-2 text-center font-black text-slate-700 dark:text-slate-200">
                          {record.dutyTime || '-'}
                        </td>
                        <td className="px-2 py-2 font-bold text-slate-600 dark:text-slate-300">
                          {record.issue || '-'}
                        </td>
                      </tr>
                    ))}
                    {activeRow.records.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-10 text-center font-bold text-slate-400"
                        >
                          No report found for this rider in {reportTitle}.
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 text-sm font-black text-slate-900 dark:bg-slate-950 dark:text-slate-100">
                      <td className="px-2 py-3">Total Days: {activeRow.reportDays}</td>
                      <td className="px-2 py-3 text-center">
                        {activeRow.rawOrderTotal}
                        {activeRow.adjustment.adjustOrder !== 0 && (
                          <span className="block text-xs text-emerald-700">
                            Adjusted: {activeRow.adjustedOrderTotal}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-3 text-center">
                        {formatDutyMinutes(activeRow.totalDutyMinutes)}
                      </td>
                      <td className="px-2 py-3 text-xs text-slate-500">
                        {activeRow.adjustment.reason || '-'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
