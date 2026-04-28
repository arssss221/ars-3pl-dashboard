import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  Check,
  Edit2,
  FileImage,
  FileText,
  Download,
  MapPin,
  MoreVertical,
  Plus,
  X,
} from 'lucide-react';
import { vehicleSeeds } from './vehicleData';
import {
  getVehiclePersonDisplayName,
  getVehiclePersonInitials,
  getVehiclePersonSearchTokens,
} from './vehiclePeople';

type AccidentSeverity = 'Minor' | 'Moderate' | 'Severe';
type ReportedTo = 'Najm' | 'Murur';
type Liability = '0%' | '25%' | '50%' | '75%' | '100%';
type AccidentStage =
  | 'Waiting for Najm Reporting'
  | 'Waiting for Taqdeer'
  | 'Waiting for Insurance Claim'
  | 'Waiting for Compensation'
  | 'Completed';
type PaperPreview = {
  title: string;
  type: 'image' | 'pdf';
  name: string;
};

interface LayoutContext {
  searchTerm: string;
}

interface AccidentChecklist {
  najmReporting: boolean;
  taqdeerInspection: boolean;
  insuranceClaim: boolean;
  compensationReceived: boolean;
}

interface AccidentRecord {
  id: number;
  dateTime: string;
  riderName: string;
  vehicleNo: string;
  locationLink: string;
  severity: AccidentSeverity;
  details: string;
  reportedTo: ReportedTo;
  liability: Liability;
  repairCharge: number;
  nowPaid: number;
  imageNames: string[];
  pdfNames: string[];
  checklist: AccidentChecklist;
}

const halfHourAgoLocal = () => {
  const date = new Date(Date.now() - 30 * 60 * 1000);
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
};

const initialRecords: AccidentRecord[] = [
  {
    id: 1,
    dateTime: '2026-04-18T13:30',
    riderName: 'Shahidul Islam',
    vehicleNo: 'KA-02-5678',
    locationLink: 'https://maps.google.com/?q=Dammam',
    severity: 'Moderate',
    details: 'Rear brake damage after minor road accident.',
    reportedTo: 'Najm',
    liability: '75%',
    repairCharge: 950,
    nowPaid: 400,
    imageNames: ['front-damage.jpg'],
    pdfNames: ['najm-report.pdf'],
    checklist: {
      najmReporting: true,
      taqdeerInspection: false,
      insuranceClaim: false,
      compensationReceived: false,
    },
  },
  {
    id: 2,
    dateTime: '2026-04-10T09:15',
    riderName: 'Md. Rahim Uddin',
    vehicleNo: 'KA-01-1234',
    locationLink: 'https://maps.google.com/?q=Riyadh',
    severity: 'Minor',
    details: 'Small bumper scratch inspection.',
    reportedTo: 'Murur',
    liability: '25%',
    repairCharge: 120,
    nowPaid: 120,
    imageNames: [],
    pdfNames: [],
    checklist: {
      najmReporting: true,
      taqdeerInspection: true,
      insuranceClaim: true,
      compensationReceived: true,
    },
  },
];

const severityOptions: AccidentSeverity[] = ['Minor', 'Moderate', 'Severe'];
const reportedOptions: ReportedTo[] = ['Najm', 'Murur'];
const liabilityOptions: Liability[] = ['0%', '25%', '50%', '75%', '100%'];

const severityStyles: Record<AccidentSeverity, string> = {
  Minor: 'bg-yellow-100 text-yellow-700',
  Moderate: 'bg-orange-100 text-orange-700',
  Severe: 'bg-red-100 text-red-700',
};

const getStage = (checklist: AccidentChecklist): AccidentStage => {
  if (!checklist.najmReporting) return 'Waiting for Najm Reporting';
  if (!checklist.taqdeerInspection) return 'Waiting for Taqdeer';
  if (!checklist.insuranceClaim) return 'Waiting for Insurance Claim';
  if (!checklist.compensationReceived) return 'Waiting for Compensation';
  return 'Completed';
};

const stageStyles: Record<AccidentStage, string> = {
  'Waiting for Najm Reporting': 'text-red-600 bg-red-50 border-red-100',
  'Waiting for Taqdeer': 'text-orange-600 bg-orange-50 border-orange-100',
  'Waiting for Insurance Claim': 'text-blue-600 bg-blue-50 border-blue-100',
  'Waiting for Compensation': 'text-amber-600 bg-amber-50 border-amber-100',
  Completed: 'text-emerald-700 bg-emerald-50 border-emerald-100',
};

const formatDateTime = (dateTime: string) => {
  const parsed = new Date(dateTime);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const needsBilling = (liability: Liability) =>
  liability === '75%' || liability === '100%';

export default function Accidents() {
  const outletContext = useOutletContext<LayoutContext | undefined>();
  const { i18n } = useTranslation();
  const searchTerm = outletContext?.searchTerm ?? '';
  const [records, setRecords] = useState<AccidentRecord[]>(initialRecords);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [editingPaidId, setEditingPaidId] = useState<number | null>(null);
  const [papersRecordId, setPapersRecordId] = useState<number | null>(null);
  const [paperPreview, setPaperPreview] = useState<PaperPreview | null>(null);
  const [completeRecordId, setCompleteRecordId] = useState<number | null>(null);
  const [completeDraft, setCompleteDraft] = useState<AccidentChecklist | null>(
    null
  );
  const [form, setForm] = useState({
    dateTime: halfHourAgoLocal(),
    riderName: vehicleSeeds[0]?.driver ?? '',
    vehicleNo: vehicleSeeds[0]?.vehicleNumber ?? '',
    locationLink: '',
    severity: 'Minor' as AccidentSeverity,
    details: '',
    reportedTo: 'Najm' as ReportedTo,
    liability: '0%' as Liability,
    repairCharge: '',
    nowPaid: '',
    imageNames: [] as string[],
    pdfNames: [] as string[],
  });

  const riders = useMemo(
    () => Array.from(new Set(vehicleSeeds.map((vehicle) => vehicle.driver))),
    []
  );

  const vehicleNumbers = useMemo(
    () => vehicleSeeds.map((vehicle) => vehicle.vehicleNumber),
    []
  );

  const visibleRecords = useMemo(() => {
    const searchValue = searchTerm.toLowerCase().trim();
    const stageScore: Record<AccidentStage, number> = {
      'Waiting for Najm Reporting': 0,
      'Waiting for Taqdeer': 1,
      'Waiting for Insurance Claim': 2,
      'Waiting for Compensation': 3,
      Completed: 4,
    };

    return records
      .filter((record) =>
        [
          record.vehicleNo,
          record.riderName,
          ...getVehiclePersonSearchTokens(record.riderName),
          record.locationLink,
          record.severity,
          record.reportedTo,
          record.liability,
          record.details,
          getStage(record.checklist),
        ]
          .join(' ')
          .toLowerCase()
          .includes(searchValue)
      )
      .sort((a, b) => {
        const stageDiff =
          stageScore[getStage(a.checklist)] - stageScore[getStage(b.checklist)];
        if (stageDiff !== 0) return stageDiff;
        return new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime();
      });
  }, [records, searchTerm]);

  const papersRecord = records.find((record) => record.id === papersRecordId);
  const completeRecord = records.find(
    (record) => record.id === completeRecordId
  );

  useEffect(() => {
    if (openMenuId === null) return;
    const closeMenu = () => setOpenMenuId(null);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, [openMenuId]);

  const updateRider = (riderName: string) => {
    const matchedVehicle = vehicleSeeds.find(
      (vehicle) => vehicle.driver === riderName
    );
    setForm((prev) => ({
      ...prev,
      riderName,
      vehicleNo: matchedVehicle?.vehicleNumber ?? prev.vehicleNo,
    }));
  };

  const canSave =
    form.dateTime &&
    form.riderName &&
    form.vehicleNo &&
    form.locationLink.trim() &&
    form.severity &&
    form.details.trim() &&
    form.reportedTo &&
    form.liability &&
    (!needsBilling(form.liability) || form.repairCharge.trim());

  const handleSaveRecord = () => {
    if (!canSave) return;
    const newRecord: AccidentRecord = {
      id: Date.now(),
      dateTime: form.dateTime,
      riderName: form.riderName,
      vehicleNo: form.vehicleNo,
      locationLink: form.locationLink.trim(),
      severity: form.severity,
      details: form.details.trim(),
      reportedTo: form.reportedTo,
      liability: form.liability,
      repairCharge: needsBilling(form.liability)
        ? Number(form.repairCharge) || 0
        : 0,
      nowPaid: needsBilling(form.liability) ? Number(form.nowPaid) || 0 : 0,
      imageNames: form.imageNames,
      pdfNames: form.pdfNames,
      checklist: {
        najmReporting: false,
        taqdeerInspection: false,
        insuranceClaim: false,
        compensationReceived: false,
      },
    };

    setRecords((prev) => [newRecord, ...prev]);
    setIsDrawerOpen(false);
    setForm({
      dateTime: halfHourAgoLocal(),
      riderName: vehicleSeeds[0]?.driver ?? '',
      vehicleNo: vehicleSeeds[0]?.vehicleNumber ?? '',
      locationLink: '',
      severity: 'Minor',
      details: '',
      reportedTo: 'Najm',
      liability: '0%',
      repairCharge: '',
      nowPaid: '',
      imageNames: [],
      pdfNames: [],
    });
  };

  const updatePaidAmount = (recordId: number, value: string) => {
    const amount = Number(value);
    if (Number.isNaN(amount) || amount < 0) return;
    setRecords((prev) =>
      prev.map((record) =>
        record.id === recordId ? { ...record, nowPaid: amount } : record
      )
    );
  };

  const saveChecklist = () => {
    if (!completeRecordId || !completeDraft) return;
    setRecords((prev) =>
      prev.map((record) =>
        record.id === completeRecordId
          ? { ...record, checklist: completeDraft }
          : record
      )
    );
    setCompleteRecordId(null);
    setCompleteDraft(null);
  };

  const setPaperSlot = (
    recordId: number,
    type: 'imageNames' | 'pdfNames',
    index: number,
    fileName: string
  ) => {
    if (!fileName) return;
    setRecords((prev) =>
      prev.map((record) =>
        record.id === recordId
          ? {
              ...record,
              [type]: (() => {
                const next = [...record[type]];
                next[index] = fileName;
                return next.slice(0, 3);
              })(),
            }
          : record
      )
    );
  };

  return (
    <div className="h-full overflow-auto p-4">
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm hover:bg-emerald-700"
        >
          <Plus size={16} /> Report Accident
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {visibleRecords.map((record) => {
          const dueAmount = Math.max(record.repairCharge - record.nowPaid, 0);
          const isMenuOpen = openMenuId === record.id;
          const stage = getStage(record.checklist);
          const isCompleted = stage === 'Completed';
          const riderDisplayName = getVehiclePersonDisplayName(
            record.riderName,
            i18n.language
          );

          return (
            <div
              key={record.id}
              className="relative rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black text-slate-800">
                    {record.vehicleNo}
                  </h3>
                  <p
                    className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black ${stageStyles[stage]}`}
                  >
                    {stage}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  {dueAmount > 0 && (
                    <div className="relative group/due">
                      <span className="cursor-help text-sm">🔴</span>
                      <div className="absolute right-0 top-full z-30 mt-2 hidden w-44 rounded-xl border border-red-100 bg-white p-3 text-xs shadow-xl group-hover/due:block">
                        <p className="font-bold text-red-600">Payment Due</p>
                        <p className="mt-1 text-slate-600">Bill: {record.repairCharge} SAR</p>
                        <p className="text-slate-600">Paid: {record.nowPaid} SAR</p>
                        <p className="font-black text-red-600">Due: {dueAmount} SAR</p>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(isMenuOpen ? null : record.id);
                    }}
                    className="rounded-full p-1 hover:bg-slate-100"
                  >
                    <MoreVertical size={15} className="text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-xs font-black">
                  {getVehiclePersonInitials(record.riderName, i18n.language)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-700 truncate">
                    {riderDisplayName}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    📅 {formatDateTime(record.dateTime)}
                  </p>
                </div>
              </div>

              <p className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
                {record.details}
              </p>

              <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-slate-100 bg-slate-50 p-2">
                <button
                  onClick={() => window.open(record.locationLink, '_blank')}
                  className="flex items-center justify-center gap-1 rounded-lg bg-white px-2 py-1.5 text-[11px] font-bold text-blue-700 hover:bg-blue-50"
                >
                  <MapPin size={12} /> Location
                </button>
                <button
                  onClick={() => setPapersRecordId(record.id)}
                  className="flex items-center justify-center gap-1 rounded-lg bg-white px-2 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                >
                  <FileText size={12} /> Papers
                </button>
                {!isCompleted && (
                  <button
                    onClick={() => {
                      setCompleteRecordId(record.id);
                      setCompleteDraft(record.checklist);
                    }}
                    className="flex items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700"
                  >
                    <Check size={12} /> Complete
                  </button>
                )}
              </div>

              {isMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-3 top-11 z-20 w-72 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl"
                >
                  <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Accident Details
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <AlertTriangle size={14} className="text-red-500" />
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${severityStyles[record.severity]}`}
                    >
                      {record.severity}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                      {record.reportedTo}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                      Liability {record.liability}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    {record.details}
                  </p>

                  <div className="mt-3 space-y-2 rounded-xl bg-slate-50 border border-slate-100 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-500">Bill</span>
                      <span className="text-xs font-bold text-slate-700">
                        {record.repairCharge} SAR
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-500">Paid</span>
                      <div className="flex items-center gap-1">
                        {editingPaidId === record.id ? (
                          <input
                            autoFocus
                            type="number"
                            value={record.nowPaid}
                            onBlur={() => setEditingPaidId(null)}
                            onChange={(e) =>
                              updatePaidAmount(record.id, e.target.value)
                            }
                            className="w-20 rounded-md border border-slate-200 px-2 py-1 text-right text-xs font-bold outline-none"
                          />
                        ) : (
                          <span className="text-xs font-bold text-emerald-700">
                            {record.nowPaid} SAR
                          </span>
                        )}
                        <button
                          onClick={() => setEditingPaidId(record.id)}
                          className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-emerald-700"
                          title="Edit paid amount"
                        >
                          <Edit2 size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 border-t border-slate-200 pt-2">
                      <span className="text-xs text-slate-500">Due</span>
                      <span className="text-xs font-black text-red-600">
                        {dueAmount} SAR
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {visibleRecords.length === 0 && (
        <div className="mt-4 rounded-xl bg-white py-12 text-center border border-slate-100">
          <p className="text-sm text-slate-400">No accident records found</p>
        </div>
      )}

      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-[1px]">
          <div className="h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                Report Accident
              </h3>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="rounded-full p-1 hover:bg-slate-100"
              >
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Date & Time*
                </label>
                <input
                  type="datetime-local"
                  value={form.dateTime}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, dateTime: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Rider Name*
                </label>
                <select
                  value={form.riderName}
                  onChange={(e) => updateRider(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  {riders.map((rider) => (
                    <option key={rider} value={rider}>
                      {getVehiclePersonDisplayName(rider, i18n.language)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Vehicle No.*
                </label>
                <select
                  value={form.vehicleNo}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, vehicleNo: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  {vehicleNumbers.map((vehicleNo) => (
                    <option key={vehicleNo} value={vehicleNo}>
                      {vehicleNo}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Google Maps Location Link*
                </label>
                <input
                  type="url"
                  value={form.locationLink}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      locationLink: e.target.value,
                    }))
                  }
                  placeholder="https://maps.google.com/..."
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Severity*
                </label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {severityOptions.map((severity) => (
                    <button
                      key={severity}
                      onClick={() =>
                        setForm((prev) => ({ ...prev, severity }))
                      }
                      className={`rounded-xl border px-2 py-2 text-[11px] font-bold transition-colors ${
                        form.severity === severity
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {severity}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Accident Details*
                </label>
                <textarea
                  rows={3}
                  value={form.details}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, details: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Reported To*
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {reportedOptions.map((reportedTo) => (
                    <button
                      key={reportedTo}
                      onClick={() =>
                        setForm((prev) => ({ ...prev, reportedTo }))
                      }
                      className={`rounded-xl border px-2 py-2 text-xs font-bold ${
                        form.reportedTo === reportedTo
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {reportedTo}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Rider Liability*
                </label>
                <div className="mt-2 grid grid-cols-5 gap-2">
                  {liabilityOptions.map((liability) => (
                    <button
                      key={liability}
                      onClick={() =>
                        setForm((prev) => ({ ...prev, liability }))
                      }
                      className={`rounded-xl border px-1 py-2 text-[11px] font-bold ${
                        form.liability === liability
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {liability}
                    </button>
                  ))}
                </div>
              </div>

              {needsBilling(form.liability) && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Repair Charge
                    </label>
                    <input
                      type="number"
                      value={form.repairCharge}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          repairCharge: e.target.value,
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Now Paid
                    </label>
                    <input
                      type="number"
                      value={form.nowPaid}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, nowPaid: e.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Accident Images & PDFs
                </label>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((index) => (
                    <label
                      key={`img-${index}`}
                      className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-2 text-center text-[10px] font-bold text-slate-500 hover:bg-slate-50"
                    >
                      <FileImage size={18} />
                      {form.imageNames[index] || `Image ${index + 1}`}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const fileName = e.target.files?.[0]?.name;
                          if (!fileName) return;
                          setForm((prev) => {
                            const imageNames = [...prev.imageNames];
                            imageNames[index] = fileName;
                            return { ...prev, imageNames };
                          });
                        }}
                      />
                    </label>
                  ))}
                  {[0, 1, 2].map((index) => (
                    <label
                      key={`pdf-${index}`}
                      className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-2 text-center text-[10px] font-bold text-slate-500 hover:bg-slate-50"
                    >
                      <FileText size={18} />
                      {form.pdfNames[index] || `PDF ${index + 1}`}
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const fileName = e.target.files?.[0]?.name;
                          if (!fileName) return;
                          setForm((prev) => {
                            const pdfNames = [...prev.pdfNames];
                            pdfNames[index] = fileName;
                            return { ...prev, pdfNames };
                          });
                        }}
                      />
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 p-4 flex justify-end gap-2">
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRecord}
                disabled={!canSave}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:bg-slate-300"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {papersRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800">
                Accident Papers
              </h3>
              <button
                onClick={() => setPapersRecordId(null)}
                className="rounded-full p-1 hover:bg-slate-100"
              >
                <X size={16} className="text-slate-500" />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[0, 1, 2].map((index) => (
                <div
                  key={`paper-img-${index}`}
                  onClick={() =>
                    papersRecord.imageNames[index] &&
                    setPaperPreview({
                      title: `Image ${index + 1}`,
                      type: 'image',
                      name: papersRecord.imageNames[index],
                    })
                  }
                  className="relative flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-2 text-center text-xs font-bold text-slate-500"
                >
                  <div className="absolute right-1 top-1 flex gap-1">
                    <label
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-full bg-white p-1 text-slate-500 shadow hover:text-emerald-700"
                      title="Edit"
                    >
                      <FileImage size={12} />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          setPaperSlot(
                            papersRecord.id,
                            'imageNames',
                            index,
                            e.target.files?.[0]?.name ?? ''
                          )
                        }
                      />
                    </label>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-full bg-white p-1 text-slate-500 shadow hover:text-blue-700"
                      title="Download"
                    >
                      <Download size={12} />
                    </button>
                  </div>
                  {papersRecord.imageNames[index] ? (
                    <>
                      <div className="mb-2 h-12 w-full rounded-lg bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center">
                        <FileImage size={22} className="text-red-500" />
                      </div>
                      <span className="line-clamp-2">
                        {papersRecord.imageNames[index]}
                      </span>
                    </>
                  ) : (
                    <>
                      <FileImage size={20} />
                      Add Image {index + 1}
                    </>
                  )}
                </div>
              ))}
              {[0, 1, 2].map((index) => (
                <div
                  key={`paper-pdf-${index}`}
                  onClick={() =>
                    papersRecord.pdfNames[index] &&
                    setPaperPreview({
                      title: `PDF ${index + 1}`,
                      type: 'pdf',
                      name: papersRecord.pdfNames[index],
                    })
                  }
                  className="relative flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-2 text-center text-xs font-bold text-slate-500"
                >
                  <div className="absolute right-1 top-1 flex gap-1">
                    <label
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-full bg-white p-1 text-slate-500 shadow hover:text-emerald-700"
                      title="Edit"
                    >
                      <FileText size={12} />
                      <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) =>
                          setPaperSlot(
                            papersRecord.id,
                            'pdfNames',
                            index,
                            e.target.files?.[0]?.name ?? ''
                          )
                        }
                      />
                    </label>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-full bg-white p-1 text-slate-500 shadow hover:text-blue-700"
                      title="Download"
                    >
                      <Download size={12} />
                    </button>
                  </div>
                  {papersRecord.pdfNames[index] ? (
                    <>
                      <div className="mb-2 h-12 w-full rounded-lg bg-gradient-to-br from-slate-100 to-red-100 flex items-center justify-center">
                        <FileText size={22} className="text-red-500" />
                      </div>
                      <span className="line-clamp-2">
                        {papersRecord.pdfNames[index]}
                      </span>
                    </>
                  ) : (
                    <>
                      <FileText size={20} />
                      Add PDF {index + 1}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {paperPreview && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <p className="text-sm font-black text-slate-800">
                  {paperPreview.title}
                </p>
                <p className="text-xs text-slate-500">{paperPreview.name}</p>
              </div>
              <button
                onClick={() => setPaperPreview(null)}
                className="rounded-full p-1 hover:bg-slate-100"
              >
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <div className="flex min-h-[360px] items-center justify-center bg-slate-950 p-6 text-white">
              {paperPreview.type === 'image' ? (
                <div className="flex h-72 w-full max-w-xl items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-white/10">
                  <FileImage size={64} />
                </div>
              ) : (
                <div className="flex h-72 w-full max-w-xl flex-col items-center justify-center rounded-2xl bg-white text-red-600">
                  <FileText size={64} />
                  <p className="mt-3 text-sm font-bold">PDF Preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {completeRecord && completeDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800">
                Accident Progress
              </h3>
              <button
                onClick={() => {
                  setCompleteRecordId(null);
                  setCompleteDraft(null);
                }}
                className="rounded-full p-1 hover:bg-slate-100"
              >
                <X size={16} className="text-slate-500" />
              </button>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-3">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${severityStyles[completeRecord.severity]}`}
              >
                {completeRecord.severity}
              </span>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                {completeRecord.details}
              </p>
            </div>

            <div className="mt-4 space-y-2">
              {[
                ['najmReporting', 'Najm Reporting'],
                ['taqdeerInspection', 'Taqdeer Inspection'],
                ['insuranceClaim', 'Insurance Claim'],
                ['compensationReceived', 'Compensation Received'],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 rounded-xl border border-slate-100 px-3 py-2 text-sm font-semibold text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={completeDraft[key as keyof AccidentChecklist]}
                    onChange={(e) =>
                      setCompleteDraft((prev) =>
                        prev
                          ? {
                              ...prev,
                              [key]: e.target.checked,
                            }
                          : prev
                      )
                    }
                  />
                  {label}
                </label>
              ))}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => {
                  setCompleteRecordId(null);
                  setCompleteDraft(null);
                }}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={saveChecklist}
                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"
              >
                <Check size={13} /> Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
