import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  Check,
  FileImage,
  MoreVertical,
  Plus,
  Edit2,
  User,
  Wrench,
  X,
} from 'lucide-react';
import { vehicleSeeds } from './vehicleData';
import {
  getVehiclePersonDisplayName,
  getVehiclePersonInitials,
  getVehiclePersonSearchTokens,
} from './vehiclePeople';

type ServiceType = 'Checkup' | 'Servicing' | 'Accident Repire';
type ServiceStatus = 'Scheduled' | 'Complete';

interface ServiceRecord {
  id: number;
  date: string;
  riderName: string;
  vehicleNo: string;
  serviceType: ServiceType;
  details: string;
  serviceCharge: number;
  nowPaid: number;
  receiptName: string;
  status: ServiceStatus;
  completedDate: string;
}

interface LayoutContext {
  searchTerm: string;
}

const todayIso = () => new Date().toISOString().slice(0, 10);

const initialRecords: ServiceRecord[] = [
  {
    id: 1,
    date: '2026-04-20',
    riderName: 'Md. Rahim Uddin',
    vehicleNo: 'KA-01-1234',
    serviceType: 'Checkup',
    details: 'Routine vehicle checkup completed.',
    serviceCharge: 0,
    nowPaid: 0,
    receiptName: '',
    status: 'Scheduled',
    completedDate: '',
  },
  {
    id: 2,
    date: '2026-04-22',
    riderName: 'Shahidul Islam',
    vehicleNo: 'KA-02-5678',
    serviceType: 'Servicing',
    details: 'Brake inspection and rear tire replacement.',
    serviceCharge: 780,
    nowPaid: 500,
    receiptName: 'brake-service.jpg',
    status: 'Scheduled',
    completedDate: '',
  },
];

const serviceTypes: ServiceType[] = ['Checkup', 'Servicing', 'Accident Repire'];

export default function Servicing() {
  const outletContext = useOutletContext<LayoutContext | undefined>();
  const { i18n } = useTranslation();
  const searchTerm = outletContext?.searchTerm ?? '';
  const [records, setRecords] = useState<ServiceRecord[]>(initialRecords);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [editingPaidId, setEditingPaidId] = useState<number | null>(null);
  const [completeRecordId, setCompleteRecordId] = useState<number | null>(null);
  const [completeDate, setCompleteDate] = useState(todayIso());
  const [form, setForm] = useState({
    date: todayIso(),
    riderName: vehicleSeeds[0]?.driver ?? '',
    vehicleNo: vehicleSeeds[0]?.vehicleNumber ?? '',
    serviceType: 'Checkup' as ServiceType,
    details: '',
    serviceCharge: '',
    nowPaid: '',
    receiptName: '',
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
    const statusScore: Record<ServiceStatus, number> = {
      Scheduled: 0,
      Complete: 1,
    };

    return records
      .filter((record) =>
        [
          record.vehicleNo,
          record.riderName,
          ...getVehiclePersonSearchTokens(record.riderName),
          record.serviceType,
          record.status,
          record.details,
        ]
          .join(' ')
          .toLowerCase()
          .includes(searchValue)
      )
      .sort((a, b) => {
        const statusDiff = statusScore[a.status] - statusScore[b.status];
        if (statusDiff !== 0) return statusDiff;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }, [records, searchTerm]);

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

  const requiresBilling = form.serviceType !== 'Checkup';
  const canSave =
    form.date &&
    form.riderName &&
    form.vehicleNo &&
    form.serviceType &&
    form.details.trim() &&
    (!requiresBilling || form.serviceCharge.trim());

  const handleSaveRecord = () => {
    if (!canSave) return;
    const newRecord: ServiceRecord = {
      id: Date.now(),
      date: form.date,
      riderName: form.riderName,
      vehicleNo: form.vehicleNo,
      serviceType: form.serviceType,
      details: form.details.trim(),
      serviceCharge: Number(form.serviceCharge) || 0,
      nowPaid: Number(form.nowPaid) || 0,
      receiptName: form.receiptName,
      status: 'Scheduled',
      completedDate: '',
    };

    setRecords((prev) => [newRecord, ...prev]);
    setIsDrawerOpen(false);
    setForm({
      date: todayIso(),
      riderName: vehicleSeeds[0]?.driver ?? '',
      vehicleNo: vehicleSeeds[0]?.vehicleNumber ?? '',
      serviceType: 'Checkup',
      details: '',
      serviceCharge: '',
      nowPaid: '',
      receiptName: '',
    });
  };

  const saveCompleteDate = () => {
    if (!completeRecordId || !completeDate) return;
    setRecords((prev) =>
      prev.map((record) =>
        record.id === completeRecordId
          ? { ...record, status: 'Complete', completedDate: completeDate }
          : record
      )
    );
    setCompleteRecordId(null);
    setCompleteDate(todayIso());
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

  return (
    <div className="h-full overflow-auto p-4">
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm hover:bg-emerald-700"
        >
          <Plus size={16} /> Schedule Service
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {visibleRecords.map((record) => {
          const dueAmount = Math.max(record.serviceCharge - record.nowPaid, 0);
          const isMenuOpen = openMenuId === record.id;
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
                <h3 className="text-sm font-black text-slate-800">
                  {record.vehicleNo}
                </h3>
                <div className="ml-auto flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      record.status === 'Complete'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {record.status}
                  </span>
                  {dueAmount > 0 && (
                    <div className="relative group/due">
                      <span className="cursor-help text-sm">🔴</span>
                      <div className="absolute right-0 top-full z-30 mt-2 hidden w-44 rounded-xl border border-red-100 bg-white p-3 text-xs shadow-xl group-hover/due:block">
                        <p className="font-bold text-red-600">Payment Due</p>
                        <p className="mt-1 text-slate-600">
                          Bill: {record.serviceCharge} SAR
                        </p>
                        <p className="text-slate-600">
                          Paid: {record.nowPaid} SAR
                        </p>
                        <p className="font-black text-red-600">
                          Due: {dueAmount} SAR
                        </p>
                      </div>
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(isMenuOpen ? null : record.id)
                    }}
                    className="rounded-full p-1 hover:bg-slate-100"
                  >
                    <MoreVertical size={15} className="text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-black">
                  {getVehiclePersonInitials(record.riderName, i18n.language)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-700 truncate">
                    {riderDisplayName}
                  </p>
                  <p className="text-[11px] text-slate-400">Running rider</p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-700 truncate">
                    {record.serviceType}
                  </p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Calendar size={12} /> {record.date}
                  </p>
                </div>
                {record.status === 'Complete' ? (
                  <span className="text-[11px] font-bold text-emerald-700">
                    {record.completedDate}
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      setCompleteRecordId(record.id);
                      setCompleteDate(todayIso());
                    }}
                    className="rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700"
                  >
                    Complete
                  </button>
                )}
              </div>

              {isMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-3 top-11 z-20 w-72 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl"
                >
                  <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Servicing Details
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    {record.details}
                  </p>

                  <div className="mt-3 space-y-2 rounded-xl bg-slate-50 border border-slate-100 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-500">Bill</span>
                      <span className="text-xs font-bold text-slate-700">
                        {record.serviceCharge} SAR
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
          <p className="text-sm text-slate-400">No servicing records found</p>
        </div>
      )}

      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-[1px]">
          <div className="h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                Add Servicing
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
                  Date*
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, date: e.target.value }))
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
                  Service Type*
                </label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {serviceTypes.map((type) => (
                    <button
                      key={type}
                      onClick={() =>
                        setForm((prev) => ({ ...prev, serviceType: type }))
                      }
                      className={`rounded-xl border px-2 py-2 text-[11px] font-bold transition-colors ${
                        form.serviceType === type
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Servicing Details*
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

              {requiresBilling && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Service Charge
                    </label>
                    <input
                      type="number"
                      value={form.serviceCharge}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          serviceCharge: e.target.value,
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

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Receipt Image
                </label>
                <label className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-6 text-sm font-semibold text-slate-500 hover:bg-slate-100">
                  <FileImage size={18} />
                  {form.receiptName || 'Upload receipt image'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        receiptName: e.target.files?.[0]?.name ?? '',
                      }))
                    }
                  />
                </label>
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

      {completeRecordId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800">
                Complete Servicing
              </h3>
              <button
                onClick={() => setCompleteRecordId(null)}
                className="rounded-full p-1 hover:bg-slate-100"
              >
                <X size={16} className="text-slate-500" />
              </button>
            </div>
            <div className="mt-4">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Servicing End Date
              </label>
              <input
                type="date"
                value={completeDate}
                onChange={(e) => setCompleteDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setCompleteRecordId(null)}
                className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={saveCompleteDate}
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
