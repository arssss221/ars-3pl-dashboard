import { useMemo, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowUpDown, Car, Edit2, Fuel, Gauge, Plus } from 'lucide-react';
import {
  vehicleSeeds,
  type FuelAllowanceStatus,
  type VehicleSeed,
  type VehicleStatus,
} from './vehicleData';
import {
  getVehiclePersonDisplayName,
  getVehiclePersonImageUrl,
  getVehiclePersonInitials,
  getVehiclePersonSearchTokens,
} from './vehiclePeople';

type FilterKey = 'All' | VehicleStatus;
type SortKey = 'slNo' | 'vehicleType' | 'lastMileage' | 'authExpiryDate';

interface LayoutContext {
  searchTerm: string;
}

const statusFilters: VehicleStatus[] = [
  'Working',
  'Reserved',
  'Servicing',
  'Unavailable',
];

const sortOptions: Array<{ key: SortKey; label: string }> = [
  { key: 'slNo', label: 'Sl. No.' },
  { key: 'vehicleType', label: 'Vehicle Type' },
  { key: 'lastMileage', label: 'Last Mileage' },
  { key: 'authExpiryDate', label: 'Auth. Exp. Date' },
];

const statusStyles: Record<VehicleStatus, string> = {
  Working: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Reserved: 'bg-blue-50 text-blue-700 border-blue-200',
  Servicing: 'bg-amber-50 text-amber-700 border-amber-200',
  Unavailable: 'bg-red-50 text-red-700 border-red-200',
};

const statusCardAura: Record<VehicleStatus, string> = {
  Working:
    'border-emerald-200 shadow-[0_0_0_1px_rgba(16,185,129,0.08),0_8px_22px_-16px_rgba(16,185,129,0.55)]',
  Reserved:
    'border-blue-200 shadow-[0_0_0_1px_rgba(59,130,246,0.08),0_8px_22px_-16px_rgba(59,130,246,0.55)]',
  Servicing:
    'border-yellow-200 shadow-[0_0_0_1px_rgba(234,179,8,0.08),0_8px_22px_-16px_rgba(234,179,8,0.55)]',
  Unavailable:
    'border-red-200 shadow-[0_0_0_1px_rgba(239,68,68,0.08),0_8px_22px_-16px_rgba(239,68,68,0.55)]',
};

const fuelStyles: Record<FuelAllowanceStatus, string> = {
  On: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  Off: 'text-red-700 bg-red-50 border-red-200',
  'No Sim': 'text-slate-700 bg-slate-100 border-slate-200',
};

const fuelOptions: FuelAllowanceStatus[] = ['On', 'Off', 'No Sim'];

const fuelIcon: Record<FuelAllowanceStatus, string> = {
  On: '🟢',
  Off: '🔴',
  'No Sim': '⚪',
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString('en-GB');
};

const dateSortValue = (dateStr: string) => {
  const parsed = new Date(dateStr).getTime();
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
};

const getDaysSince = (dateStr: string) => {
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsed.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - parsed.getTime()) / 86400000);
};

const Avatar = ({
  name,
  imageUrl,
  language,
}: {
  name: string;
  imageUrl: string;
  language: string;
}) => {
  const resolvedImageUrl = getVehiclePersonImageUrl(name, imageUrl);

  if (resolvedImageUrl) {
    return (
      <img
        src={resolvedImageUrl}
        alt={getVehiclePersonDisplayName(name, language)}
        className="h-7 w-7 rounded-full object-cover border border-emerald-200"
      />
    );
  }

  return (
    <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-black">
      {getVehiclePersonInitials(name, language)}
    </div>
  );
};

interface PersonBoxProps {
  title: string;
  name: string;
  imageUrl: string;
  meta: string;
  language: string;
  compactLocationOnly?: boolean;
}

const PersonBox = ({
  title,
  name,
  imageUrl,
  meta,
  language,
  compactLocationOnly = false,
}: PersonBoxProps) => (
  <div className="rounded-xl bg-slate-50 border border-slate-100 px-2.5 py-2 min-w-0">
    <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
      {title}
    </p>
    {compactLocationOnly ? (
      <p className="mt-1 text-xs font-semibold text-slate-700 truncate">{meta}</p>
    ) : (
      <div className="mt-1 flex items-center gap-2 min-w-0">
        <Avatar name={name} imageUrl={imageUrl} language={language} />
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-700 truncate">
            {getVehiclePersonDisplayName(name, language)}
          </p>
          <p className="text-[10px] text-slate-500 truncate">{meta}</p>
        </div>
      </div>
    )}
  </div>
);

export default function Vehicles() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const outletContext = useOutletContext<LayoutContext | undefined>();
  const searchTerm = outletContext?.searchTerm ?? '';
  const [activeFilter, setActiveFilter] = useState<FilterKey>('All');
  const [sortBy, setSortBy] = useState<SortKey>('slNo');
  const [openSort, setOpenSort] = useState(false);
  const [statusById, setStatusById] = useState<Record<number, VehicleStatus>>({});
  const [fuelById, setFuelById] = useState<Record<number, FuelAllowanceStatus>>({});
  const [mileageById, setMileageById] = useState<Record<number, number>>({});
  const [mileageSavedAtById, setMileageSavedAtById] = useState<Record<number, string>>({});
  const [editingFuelId, setEditingFuelId] = useState<number | null>(null);
  const [editingMileageId, setEditingMileageId] = useState<number | null>(null);

  const vehicles = useMemo(
    () =>
      vehicleSeeds.map((vehicle) => ({
        ...vehicle,
        status: statusById[vehicle.id] ?? vehicle.status,
        fuelAllowanceStatus: fuelById[vehicle.id] ?? vehicle.fuelAllowanceStatus,
        mileage: mileageById[vehicle.id] ?? vehicle.mileage,
      })),
    [fuelById, mileageById, statusById]
  );

  const statusCounts = useMemo(() => {
    const counts: Record<VehicleStatus, number> = {
      Working: 0,
      Reserved: 0,
      Servicing: 0,
      Unavailable: 0,
    };
    vehicles.forEach((vehicle) => {
      counts[vehicle.status] += 1;
    });
    return counts;
  }, [vehicles]);

  const filteredAndSorted = useMemo(() => {
    const searchValue = searchTerm.toLowerCase().trim();
    const filtered = vehicles.filter((vehicle) => {
      const matchesStatus =
        activeFilter === 'All' ? true : vehicle.status === activeFilter;
      const matchesSearch = [
        vehicle.slNo,
        vehicle.vehicleNumber,
        vehicle.vehicleType,
        vehicle.brand,
        vehicle.model,
        vehicle.year,
        vehicle.color,
        ...getVehiclePersonSearchTokens(vehicle.authRider),
        ...getVehiclePersonSearchTokens(vehicle.driver),
        vehicle.place,
        vehicle.fuelAllowanceStatus,
      ]
        .join(' ')
        .toLowerCase()
        .includes(searchValue);

      return matchesStatus && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'slNo':
          return a.slNo - b.slNo;
        case 'vehicleType':
          return a.vehicleType.localeCompare(b.vehicleType);
        case 'lastMileage':
          return b.mileage - a.mileage;
        case 'authExpiryDate':
          return dateSortValue(a.authExpiryDate) - dateSortValue(b.authExpiryDate);
        default:
          return 0;
      }
    });
  }, [activeFilter, searchTerm, sortBy, vehicles]);

  const changeVehicleStatus = (
    vehicleId: number,
    status: VehicleStatus,
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    e.stopPropagation();
    setStatusById((prev) => ({ ...prev, [vehicleId]: status }));
  };

  const changeFuelAllowance = (
    vehicleId: number,
    value: FuelAllowanceStatus,
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    e.stopPropagation();
    setFuelById((prev) => ({ ...prev, [vehicleId]: value }));
    setEditingFuelId(null);
  };

  const changeMileage = (
    vehicleId: number,
    value: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    e.stopPropagation();
    const nextMileage = Number(value);
    if (Number.isNaN(nextMileage) || nextMileage < 0) return;
    setMileageById((prev) => ({ ...prev, [vehicleId]: nextMileage }));
    setMileageSavedAtById((prev) => ({
      ...prev,
      [vehicleId]: new Date().toISOString(),
    }));
  };

  return (
    <div className="ars-page h-full flex flex-col">
      <div className="sticky top-0 z-10 px-3 py-3 md:px-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide ars-toolbar-dock">
            <button
              onClick={() => setActiveFilter('All')}
              className={`ars-filter-pill shrink-0 transition-all ${
                activeFilter === 'All'
                  ? 'ars-filter-pill-active'
                  : ''
              }`}
            >
              All ({vehicles.length})
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

          <div className="flex shrink-0 items-center gap-2">
            <button className="ars-primary-button rounded-xl px-3.5 py-2 text-sm font-black flex items-center gap-1.5">
              <Plus size={16} /> Add
            </button>

            <div className="relative">
              <button
                onClick={() => setOpenSort((prev) => !prev)}
                className="ars-glass-button rounded-xl px-3.5 py-2 text-sm font-black flex items-center gap-1.5 hover:text-emerald-700"
              >
                <ArrowUpDown size={14} /> Sort
              </button>
              {openSort && (
                <div style={{ insetInlineEnd: 0 }} className="ars-floating-menu absolute mt-2 w-44 rounded-2xl shadow-lg border border-slate-100 py-1 z-30">
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
          {filteredAndSorted.map((vehicle: VehicleSeed) => {
            const nextOilChange = vehicle.mileage + vehicle.oilChangeInterval;
            const isWorking = vehicle.status === 'Working';
            const mileageSavedAt = mileageSavedAtById[vehicle.id];
            const isMileageStale =
              Boolean(mileageSavedAt) && getDaysSince(mileageSavedAt) >= 20;

            return (
              <div
                key={vehicle.id}
                onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                className={`ars-list-card p-3 cursor-pointer relative ${statusCardAura[vehicle.status]}`}
              >
                <div className="flex items-start gap-2">
                  <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center text-emerald-300 shadow-sm shrink-0">
                    <Car size={18} />
                  </div>

                  <div className="flex-1 min-w-0 pr-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                      {vehicle.slNo} • {vehicle.vehicleType}
                    </p>
                    <h3 className="font-semibold text-slate-800 text-sm truncate">
                      {vehicle.vehicleNumber}
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate">
                      {vehicle.brand} {vehicle.model} ({vehicle.year}){' '}
                      {vehicle.color}
                    </p>
                  </div>

                  <select
                    value={vehicle.status}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) =>
                      changeVehicleStatus(
                        vehicle.id,
                        e.target.value as VehicleStatus,
                        e
                      )
                    }
                    className={`max-w-[96px] rounded-full border px-2 py-1 text-[10px] font-bold outline-none ${statusStyles[vehicle.status]}`}
                  >
                    {statusFilters.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div
                    className={`group/fuel rounded-xl border px-2.5 py-2 ${fuelStyles[vehicle.fuelAllowanceStatus]}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                          Fuel Allowance
                        </p>
                        {editingFuelId === vehicle.id ? (
                          <select
                            autoFocus
                            value={vehicle.fuelAllowanceStatus}
                            onClick={(e) => e.stopPropagation()}
                            onBlur={() => setEditingFuelId(null)}
                            onChange={(e) =>
                              changeFuelAllowance(
                                vehicle.id,
                                e.target.value as FuelAllowanceStatus,
                                e
                              )
                            }
                            className="mt-1 w-full rounded-md border border-white/70 bg-white px-1.5 py-0.5 text-xs font-black outline-none"
                          >
                            {fuelOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <p className="mt-1 flex items-center gap-1 text-xs font-black">
                            <span>{fuelIcon[vehicle.fuelAllowanceStatus]}</span>
                            <span>{vehicle.fuelAllowanceStatus}</span>
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingFuelId(vehicle.id);
                        }}
                        className="opacity-0 group-hover/fuel:opacity-100 rounded-md bg-white/80 p-1 text-slate-500 hover:text-emerald-700 transition-opacity"
                        title="Edit fuel allowance"
                      >
                        <Edit2 size={11} />
                      </button>
                    </div>
                  </div>

                  <div
                    className={`group/mileage rounded-xl border px-2.5 py-2 ${
                      isMileageStale
                        ? 'border-red-200 bg-red-50 shadow-[0_0_0_1px_rgba(239,68,68,0.08),0_8px_22px_-16px_rgba(239,68,68,0.75)]'
                        : 'border-slate-100 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                          Last Mileage
                        </p>
                        {editingMileageId === vehicle.id ? (
                          <input
                            autoFocus
                            type="number"
                            inputMode="numeric"
                            min="0"
                            step="1"
                            value={vehicle.mileage}
                            onClick={(e) => e.stopPropagation()}
                            onBlur={() => setEditingMileageId(null)}
                            onChange={(e) =>
                              changeMileage(vehicle.id, e.target.value, e)
                            }
                            className="mt-1 min-w-0 w-full rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-xs font-semibold text-slate-700 outline-none"
                          />
                        ) : (
                          <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-700 truncate">
                            <Gauge size={12} className="shrink-0 text-slate-500" />
                            <span>
                              {vehicle.mileage} ({nextOilChange})
                            </span>
                          </p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingMileageId(vehicle.id);
                        }}
                        className="opacity-0 group-hover/mileage:opacity-100 rounded-md bg-white p-1 text-slate-500 hover:text-emerald-700 transition-opacity"
                        title="Edit last mileage"
                      >
                        <Edit2 size={11} />
                      </button>
                    </div>
                  </div>

                  <PersonBox
                    title="Auth. Rider"
                    name={vehicle.authRider}
                    imageUrl={vehicle.authRiderImageUrl}
                    meta={formatDate(vehicle.authExpiryDate)}
                    language={i18n.language}
                  />

                  <PersonBox
                    title={isWorking ? 'Driver' : 'Location'}
                    name={vehicle.driver}
                    imageUrl={vehicle.driverImageUrl}
                    meta={vehicle.place}
                    language={i18n.language}
                    compactLocationOnly={!isWorking}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {filteredAndSorted.length === 0 && (
          <div className="ars-card text-center py-12 rounded-3xl">
            <p className="text-slate-400 text-sm">No vehicles found</p>
          </div>
        )}
      </div>
    </div>
  );
}
