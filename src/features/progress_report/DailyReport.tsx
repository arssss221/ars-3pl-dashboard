import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import {
  CalendarDays,
  Download,
  FileSpreadsheet,
  Info,
  Printer,
  Save,
  Search,
  Target,
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

interface DailyReportDraft {
  orderCount: string;
  dutyTime: string;
  issue: string;
}

type DraftMap = Record<number, DailyReportDraft>;

const reportCollection = 'dailyProgressReports';
const companyName = 'ARS Logistics Manager';
const databaseTimeoutMs = 8000;
const sampleIdOwners: Record<string, string> = {
  '2181064': 'Jamal Uddin',
  '2049273': 'Karim Hasan',
  '2122540': 'Sajid Rahman',
};

const toLocalDateInputValue = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const yesterdayDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return toLocalDateInputValue(date);
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

const monthStartDate = (dateValue: string) => `${dateValue.slice(0, 8)}01`;

const emptyDraft = (): DailyReportDraft => ({
  orderCount: '',
  dutyTime: '',
  issue: '',
});

const parseOrderCount = (value: string | number | undefined) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const sanitizeOrderCount = (value: string) =>
  value.replace(/[^0-9]/g, '').slice(0, 2);

const sanitizeDutyTime = (value: string) => {
  const digits = value.replace(/[^0-9]/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}.${digits.slice(2)}`;
};

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

const getEmployeeDesignation = (employee: Partial<EmployeeRecord>) =>
  String(employee.designation ?? employee.occupationVisa ?? '').trim();

const isDriver = (employee: Partial<EmployeeRecord>) =>
  getEmployeeDesignation(employee).toLowerCase() === 'driver';

const isWorkingDriver = (employee: Partial<EmployeeRecord>) =>
  isDriver(employee) && employee.status === 'Working';

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

const createPrintMarkup = (
  selectedDate: string,
  rows: Array<{
    serial: number;
    riderName: string;
    orderCount: number;
    isOrderBelowTarget: boolean;
    dutyTime: string;
    isDutyBelowTarget: boolean;
    issue: string;
    monthTotal: number;
  }>,
  labels: Record<string, string>
) => {
  const tableRows = rows
    .map(
      (row) => `
        <tr>
          <td>${row.serial}</td>
          <td>${row.riderName}</td>
          <td class="${row.isOrderBelowTarget ? 'report-low' : ''}">${row.orderCount}</td>
          <td class="${row.isDutyBelowTarget ? 'report-low' : ''}">${row.dutyTime || '-'}</td>
          <td>${row.issue || '-'}</td>
          <td>${row.monthTotal}</td>
        </tr>`
    )
    .join('');

  return `
    <div class="report-print-sheet">
      <h1>${companyName}</h1>
      <h2>${labels.dailyProgressReportOf} ${formatDisplayDate(selectedDate)}</h2>
      <table>
        <thead>
          <tr>
            <th>${labels.sl}</th>
            <th>${labels.riderName}</th>
            <th>${labels.orders}</th>
            <th>${labels.dutyTime}</th>
            <th>${labels.problem}</th>
            <th>${labels.monthTotal}</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>`;
};

const printStyles = `
  <style>
    body { margin: 0; background: #f8fafc; color: #0f172a; font-family: Arial, sans-serif; }
    .report-print-sheet { width: 960px; margin: 24px auto; padding: 32px; background: #fff; }
    h1 { margin: 0; text-align: center; font-size: 24px; font-weight: 800; }
    h2 { margin: 8px 0 24px; text-align: center; font-size: 17px; font-weight: 700; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; vertical-align: top; }
    th { background: #ecfdf5; color: #065f46; font-weight: 800; }
    td:first-child, td:nth-child(3), td:nth-child(6) { text-align: center; }
    .report-low { color: #dc2626; font-weight: 800; }
    @media print {
      body { background: #fff; }
      .report-print-sheet { width: auto; margin: 0; padding: 20px; }
    }
  </style>`;

const parseDutyTimeValue = (value: string) => {
  const [hoursRaw, minutesRaw = '0'] = value.split('.');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;
  return hours * 60 + minutes;
};

export default function DailyReport() {
  const { t, i18n } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(yesterdayDate);
  const [employees, setEmployees] = useState<EmployeeRecord[]>(employeeSeeds);
  const [drafts, setDrafts] = useState<DraftMap>({});
  const [monthRecords, setMonthRecords] = useState<DailyReportRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [searchVersion, setSearchVersion] = useState(0);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [targetOrderCount, setTargetOrderCount] = useState('20');
  const [targetDutyTime, setTargetDutyTime] = useState('08.30');

  const tr = (term: string) => t(`terms.${term}`, term);
  const reportLabels = useMemo(
    () => ({
      sl: tr('SL'),
      riderName: tr('Rider Name'),
      orders: tr('Orders'),
      dutyTime: tr('Duty Time'),
      problem: tr('Problem'),
      monthTotal: tr('Month Total'),
      dailyProgressReportOf: tr('Daily Progress report of'),
    }),
    [i18n.language]
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
        console.warn('Failed to load employees for daily report:', error);
      }
    };

    loadEmployees();

    return () => {
      isMounted = false;
    };
  }, []);

  const riders = useMemo(() => {
    return employees.filter(isWorkingDriver).sort(
      (a, b) => a.fullName.localeCompare(b.fullName)
    );
  }, [employees]);

  useEffect(() => {
    let isMounted = true;

    const loadReports = async () => {
      setIsLoading(true);
      setStatusMessage('');
      try {
        const startDate = monthStartDate(selectedDate);
        const snapshot = await withDatabaseTimeout(
          getDocs(
            query(
              collection(db, reportCollection),
              where('date', '>=', startDate),
              where('date', '<=', selectedDate)
            )
          )
        );

        if (!isMounted) return;

        const records = snapshot.docs.map((item) => {
          const data = item.data() as Record<string, unknown>;
          return {
            date: String(data.date ?? ''),
            riderId: Number(data.riderId ?? 0),
            riderName: String(data.riderName ?? ''),
            designation: String(data.designation ?? 'Driver'),
            orderCount: parseOrderCount(data.orderCount as number),
            dutyTime: String(data.dutyTime ?? ''),
            issue: String(data.issue ?? ''),
          };
        });

        const selectedDrafts = records
          .filter((record) => record.date === selectedDate)
          .reduce<DraftMap>((nextDrafts, record) => {
            nextDrafts[record.riderId] = {
              orderCount: String(record.orderCount || ''),
              dutyTime: record.orderCount === 0 && record.dutyTime === '08.30' ? '' : record.dutyTime,
              issue: record.issue,
            };
            return nextDrafts;
          }, {});

        setMonthRecords(records);
        setDrafts(selectedDrafts);
      } catch (error) {
        console.error('Failed to load daily reports:', error);
        if (isMounted) {
          setMonthRecords([]);
          setDrafts({});
          setStatusMessage('Report data could not be loaded from database.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadReports();

    return () => {
      isMounted = false;
    };
  }, [searchVersion, selectedDate]);

  const reportRows = useMemo(
    () =>
      riders.map((rider, index) => {
        const draft = drafts[rider.id] ?? emptyDraft();
        const previousTotal = monthRecords
          .filter(
            (record) =>
              record.riderId === rider.id &&
              record.date >= monthStartDate(selectedDate) &&
              record.date < selectedDate
          )
          .reduce((sum, record) => sum + record.orderCount, 0);
        const currentOrders = parseOrderCount(draft.orderCount);

        return {
          serial: index + 1,
          rider,
          draft,
          currentOrders,
          isOrderBelowTarget:
            draft.orderCount !== '' &&
            targetOrderCount !== '' &&
            currentOrders < parseOrderCount(targetOrderCount),
          isDutyBelowTarget:
            draft.dutyTime !== '' &&
            targetDutyTime !== '' &&
            parseDutyTimeValue(draft.dutyTime) < parseDutyTimeValue(targetDutyTime),
          monthTotal: previousTotal + currentOrders,
        };
      }),
    [drafts, monthRecords, riders, selectedDate, targetDutyTime, targetOrderCount]
  );

  const printableRows = reportRows.map((row) => ({
    serial: row.serial,
    riderName: getEmployeeDisplayName(row.rider),
    orderCount: row.currentOrders,
    isOrderBelowTarget: row.isOrderBelowTarget,
    dutyTime: row.draft.dutyTime,
    isDutyBelowTarget: row.isDutyBelowTarget,
    issue: row.draft.issue,
    monthTotal: row.monthTotal,
  }));

  const updateDraft = (
    riderId: number,
    field: keyof DailyReportDraft,
    value: string
  ) => {
    setDrafts((prev) => ({
      ...prev,
      [riderId]: {
        ...(prev[riderId] ?? emptyDraft()),
        [field]: value,
      },
    }));
  };

  const importReport = () => {
    const importedRows = importText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.split(/\t|,|\s{2,}/).map((cell) => cell.trim()));
    const riderByName = new Map(riders.map((rider) => [rider.fullName, rider]));
    const unmatchedIds: string[] = [];
    const nextDrafts: DraftMap = {};

    importedRows.forEach((cells) => {
      const [rawId, rawOrders = '', rawDutyTime = ''] = cells;
      const owner = sampleIdOwners[rawId];
      const rider = owner ? riderByName.get(owner) : undefined;
      if (!rider) {
        unmatchedIds.push(rawId);
        return;
      }
      nextDrafts[rider.id] = {
        ...(drafts[rider.id] ?? emptyDraft()),
        orderCount: sanitizeOrderCount(rawOrders),
        dutyTime: sanitizeDutyTime(rawDutyTime),
      };
    });

    if (unmatchedIds.length > 0) {
      setImportError(
        `${unmatchedIds.join(', ')} ${tr('owner not found import warning')}`
      );
      return;
    }

    setDrafts((prev) => ({ ...prev, ...nextDrafts }));
    setImportError('');
    setImportText('');
    setIsImportModalOpen(false);
    setStatusMessage(tr('Report imported.'));
  };

  const saveReports = async () => {
    setIsLoading(true);
    setStatusMessage('');
    try {
      await withDatabaseTimeout(
        Promise.all(
          reportRows.map((row) => {
            const documentId = `${selectedDate}_${row.rider.id}`;
            return setDoc(
              doc(db, reportCollection, documentId),
              {
                date: selectedDate,
                riderId: row.rider.id,
                riderName: row.rider.fullName,
                designation: getEmployeeDesignation(row.rider) || 'Driver',
                orderCount: row.currentOrders,
                dutyTime: row.draft.dutyTime.trim(),
                issue: row.draft.issue.trim(),
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
          })
        )
      );

      const savedRecords = reportRows.map((row) => ({
        date: selectedDate,
        riderId: row.rider.id,
        riderName: row.rider.fullName,
        designation: getEmployeeDesignation(row.rider) || 'Driver',
        orderCount: row.currentOrders,
        dutyTime: row.draft.dutyTime.trim(),
        issue: row.draft.issue.trim(),
      }));
      setMonthRecords((prev) => [
        ...prev.filter((record) => record.date !== selectedDate),
        ...savedRecords,
      ]);
      setStatusMessage('Daily report saved.');
    } catch (error) {
      console.error('Failed to save daily report:', error);
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
    popup.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>Daily Progress report of ${formatDisplayDate(selectedDate)}</title>
          ${printStyles}
        </head>
        <body>
          ${createPrintMarkup(selectedDate, printableRows, reportLabels)}
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

  const downloadScreenshot = async () => {
    const scale = 2;
    const width = 1040;
    const rowHeight = 42;
    const headerTop = 88;
    const tableTop = 142;
    const height = tableTop + 44 + Math.max(printableRows.length, 1) * rowHeight + 40;
    const columns = [56, 280, 110, 130, 330, 134];
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const context = canvas.getContext('2d');

    if (!context) {
      setStatusMessage('Screenshot failed on this browser.');
      return;
    }

    const drawText = (
      text: string,
      x: number,
      y: number,
      maxWidth: number,
      lineHeight = 15
    ) => {
      const words = String(text || '-').split(/\s+/);
      let line = '';
      let currentY = y;
      words.forEach((word) => {
        const testLine = line ? `${line} ${word}` : word;
        if (context.measureText(testLine).width > maxWidth && line) {
          context.fillText(line, x, currentY);
          line = word;
          currentY += lineHeight;
        } else {
          line = testLine;
        }
      });
      context.fillText(line || '-', x, currentY);
    };

    context.scale(scale, scale);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.fillStyle = '#0f172a';
    context.textAlign = 'center';
    context.font = '800 24px Arial';
    context.fillText(companyName, width / 2, 46);
    context.font = '700 17px Arial';
    context.fillText(
      `Daily Progress report of ${formatDisplayDate(selectedDate)}`,
      width / 2,
      78
    );

    const headers = [
      reportLabels.sl,
      reportLabels.riderName,
      reportLabels.orders,
      reportLabels.dutyTime,
      reportLabels.problem,
      reportLabels.monthTotal,
    ];
    let x = 0;
    context.textBaseline = 'middle';
    headers.forEach((header, index) => {
      context.fillStyle = '#ecfdf5';
      context.fillRect(x, headerTop, columns[index], 44);
      context.strokeStyle = '#cbd5e1';
      context.strokeRect(x, headerTop, columns[index], 44);
      context.fillStyle = '#065f46';
      context.font = '800 13px Arial';
      context.textAlign = index === 1 || index === 4 ? 'left' : 'center';
      context.fillText(
        header,
        index === 1 || index === 4 ? x + 12 : x + columns[index] / 2,
        headerTop + 22
      );
      x += columns[index];
    });

    const rows = printableRows.length > 0 ? printableRows : [];
    rows.forEach((row, rowIndex) => {
      const y = tableTop + rowIndex * rowHeight;
      const cells = [
        String(row.serial),
        row.riderName,
        String(row.orderCount),
        row.dutyTime || '-',
        row.issue || '-',
        String(row.monthTotal),
      ];
      x = 0;
      cells.forEach((cell, index) => {
        context.fillStyle = '#ffffff';
        context.fillRect(x, y, columns[index], rowHeight);
        context.strokeStyle = '#cbd5e1';
        context.strokeRect(x, y, columns[index], rowHeight);
        context.fillStyle =
          (index === 2 && row.isOrderBelowTarget) ||
          (index === 3 && row.isDutyBelowTarget)
            ? '#dc2626'
            : '#0f172a';
        context.font = '700 12px Arial';
        context.textAlign = index === 1 || index === 4 ? 'left' : 'center';
        context.textBaseline = 'top';
        if (index === 1 || index === 4) {
          drawText(cell, x + 10, y + 10, columns[index] - 20);
        } else {
          context.textBaseline = 'middle';
          context.fillText(cell, x + columns[index] / 2, y + rowHeight / 2);
        }
        x += columns[index];
      });
    });

    const link = document.createElement('a');
    link.download = `daily-progress-report-${selectedDate}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    setStatusMessage('Screenshot downloaded.');
  };

  return (
    <section className="ars-page p-3 sm:p-4 md:p-5">
      <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white/80 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex min-w-0 flex-1 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-black text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100">
          <CalendarDays size={18} className="shrink-0 text-emerald-600" />
          <span className="shrink-0">{tr('Date')}</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-sm font-black outline-none"
          />
        </label>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => setSearchVersion((value) => value + 1)}
            className="ars-primary-button inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-black"
          >
            <Search size={17} />
            {tr('Search')}
          </button>
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="ars-glass-button inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-black"
          >
            <FileSpreadsheet size={17} />
            {tr('Import Report')}
          </button>
          <button
            type="button"
            onClick={() => setIsTargetModalOpen(true)}
            className="ars-glass-button inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-black"
          >
            <Target size={17} />
            {tr('Set Target')}
          </button>
          <div className="group relative inline-flex">
            <button
              type="button"
              className="ars-glass-button inline-flex h-10 w-10 items-center justify-center rounded-lg"
              aria-label={tr('Report tutorial')}
            >
              <Info size={17} />
            </button>
            <div className="pointer-events-none absolute top-12 z-40 w-[min(24rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] -translate-x-[calc(100%-2.5rem)] whitespace-pre-line rounded-xl border border-slate-200 bg-white p-3 text-sm font-bold leading-6 text-slate-700 opacity-0 shadow-2xl transition-opacity group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 ltr:right-0 ltr:translate-x-0 rtl:left-0 rtl:translate-x-0">
              {tr('Daily report tutorial')}
            </div>
          </div>
        </div>
      </div>

      <div className="ars-table-shell w-full overflow-hidden">
        <table className="w-full table-fixed border-collapse text-xs sm:text-sm">
          <colgroup>
            <col className="w-[7%]" />
            <col className="w-[25%]" />
            <col className="w-[12%]" />
            <col className="w-[15%]" />
            <col className="w-[28%]" />
            <col className="w-[13%]" />
          </colgroup>
          <thead className="ars-table-head text-left text-xs font-black uppercase tracking-normal text-slate-500">
            <tr>
              <th className="px-1.5 py-2 text-center sm:px-2">{reportLabels.sl}</th>
              <th className="px-1.5 py-2 sm:px-2">{reportLabels.riderName}</th>
              <th className="px-1.5 py-2 text-center sm:px-2">{reportLabels.orders}</th>
              <th className="px-1.5 py-2 text-center sm:px-2">{reportLabels.dutyTime}</th>
              <th className="px-1.5 py-2 sm:px-2">{reportLabels.problem}</th>
              <th className="px-1.5 py-2 text-center sm:px-2">{reportLabels.monthTotal}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {reportRows.map((row) => (
              <tr key={row.rider.id} className="bg-white/60 dark:bg-slate-950/40">
                <td className="px-1.5 py-1.5 text-center font-black text-slate-500 sm:px-2">
                  {row.serial}
                </td>
                <td className="px-1.5 py-1.5 sm:px-2">
                  <p className="truncate text-sm font-black text-slate-900 dark:text-slate-100 sm:text-base">
                    {getEmployeeDisplayName(row.rider)}
                  </p>
                </td>
                <td className="px-1.5 py-1.5 sm:px-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={row.draft.orderCount}
                    onChange={(event) =>
                      updateDraft(
                        row.rider.id,
                        'orderCount',
                        sanitizeOrderCount(event.target.value)
                      )
                    }
                    className={`h-8 w-full rounded-md border border-slate-200 bg-white px-1 text-center font-bold outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 ${
                      row.isOrderBelowTarget ? 'text-red-600' : ''
                    }`}
                    maxLength={2}
                  />
                </td>
                <td className="px-1.5 py-1.5 sm:px-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={row.draft.dutyTime}
                    onChange={(event) =>
                      updateDraft(
                        row.rider.id,
                        'dutyTime',
                        sanitizeDutyTime(event.target.value)
                      )
                    }
                    className={`h-8 w-full rounded-md border border-slate-200 bg-white px-1 text-center font-bold outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 ${
                      row.isDutyBelowTarget ? 'text-red-600' : ''
                    }`}
                    maxLength={5}
                  />
                </td>
                <td className="px-1.5 py-1.5 sm:px-2">
                  <input
                    type="text"
                    value={row.draft.issue}
                    onChange={(event) =>
                      updateDraft(row.rider.id, 'issue', event.target.value)
                    }
                    className="h-8 w-full rounded-md border border-slate-200 bg-white px-2 font-bold outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-900"
                  />
                </td>
                <td className="px-1.5 py-1.5 text-center text-sm font-black text-emerald-700 sm:px-2">
                  {row.monthTotal}
                </td>
              </tr>
            ))}
            {reportRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center font-bold text-slate-400">
                  {tr('No working driver profiles found.')}
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
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={saveReports}
            disabled={isLoading || reportRows.length === 0}
            className="ars-primary-button inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-black disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={17} />
            {tr('Save')}
          </button>
          <button
            type="button"
            onClick={openPrintPopup}
            className="ars-glass-button inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-black"
          >
            <Printer size={17} />
            {tr('Print')}
          </button>
          <button
            type="button"
            onClick={downloadScreenshot}
            className="ars-glass-button inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-black"
          >
            <Download size={17} />
            {tr('Screenshot')}
          </button>
        </div>
      </div>

      {isTargetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                {tr('Set Target')}
              </h2>
              <button
                type="button"
                onClick={() => setIsTargetModalOpen(false)}
                className="ars-glass-button inline-flex h-9 w-9 items-center justify-center rounded-lg"
                aria-label={tr('Close')}
              >
                <X size={17} />
              </button>
            </div>
            <p className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm font-bold leading-6 text-emerald-800">
              {tr('Daily target tip')}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-black text-slate-700 dark:text-slate-200">
                {tr('Order Target')}
                <input
                  type="text"
                  inputMode="numeric"
                  value={targetOrderCount}
                  onChange={(event) =>
                    setTargetOrderCount(sanitizeOrderCount(event.target.value))
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-center font-black outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950"
                  maxLength={2}
                />
              </label>
              <label className="text-sm font-black text-slate-700 dark:text-slate-200">
                {tr('Duty Time Target')}
                <input
                  type="text"
                  inputMode="numeric"
                  value={targetDutyTime}
                  onChange={(event) =>
                    setTargetDutyTime(sanitizeDutyTime(event.target.value))
                  }
                  className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-center font-black outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950"
                  placeholder="08.30"
                  maxLength={5}
                />
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsTargetModalOpen(false)}
                className="ars-primary-button rounded-lg px-4 py-2 text-sm font-black"
              >
                {tr('Save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                {tr('Import Report')}
              </h2>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="ars-glass-button inline-flex h-9 w-9 items-center justify-center rounded-lg"
                aria-label={tr('Close')}
              >
                <X size={17} />
              </button>
            </div>
            <p className="mb-3 rounded-lg bg-slate-50 p-3 text-sm font-bold leading-6 text-slate-700 dark:bg-slate-950 dark:text-slate-200">
              {tr('Import report instruction')}
            </p>
            <textarea
              value={importText}
              onChange={(event) => {
                setImportText(event.target.value);
                setImportError('');
              }}
              className="h-56 w-full resize-y rounded-lg border border-slate-200 bg-white p-3 font-mono text-sm outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950"
              placeholder="2049273	13	11.43"
            />
            {importError && (
              <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm font-bold leading-6 text-red-700">
                {importError}{' '}
                <a href="/id-manager" className="underline">
                  {tr('ID Manager page')}
                </a>{' '}
                {tr('add rider id instruction')}
              </p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={importReport}
                className="ars-primary-button rounded-lg px-4 py-2 text-sm font-black"
              >
                {tr('Submit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
