import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Car,
  FileText,
  Fuel,
  Gauge,
  IdCard,
  MapPin,
  MessageCircle,
  Palette,
  Phone,
  ShieldCheck,
  User,
  Wrench,
} from 'lucide-react';
import {
  getVehicleSeedById,
  type VehicleHealth,
  type VehicleStatus,
} from './vehicleData';
import { getVehiclePersonDisplayName } from './vehiclePeople';

const statusStyles: Record<VehicleStatus, string> = {
  Active: 'bg-emerald-100 text-emerald-700',
  Maintenance: 'bg-yellow-100 text-yellow-700',
  Inactive: 'bg-red-100 text-red-700',
};

const healthStyles: Record<VehicleHealth, string> = {
  Good: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  'Due Soon': 'bg-amber-50 text-amber-700 border-amber-100',
  Attention: 'bg-red-50 text-red-700 border-red-100',
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString('en-GB');
};

const getDaysUntil = (dateStr: string) => {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  if (Number.isNaN(target.getTime())) return null;
  return Math.floor((target.getTime() - today.getTime()) / 86400000);
};

const getDueText = (dateStr: string) => {
  const days = getDaysUntil(dateStr);
  if (days === null) return '-';
  if (days < 0) return `${Math.abs(days)} day overdue`;
  if (days === 0) return 'Due today';
  return `${days} day left`;
};

interface InfoTileProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

const InfoTile = ({ label, value, icon }: InfoTileProps) => (
  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
      {icon}
      {label}
    </div>
    <p className="mt-2 break-words text-sm font-bold text-slate-800">
      {value || '-'}
    </p>
  </div>
);

interface DocumentTileProps {
  label: string;
  value: string;
}

const DocumentTile = ({ label, value }: DocumentTileProps) => (
  <div
    className={`rounded-2xl border p-4 text-center ${
      value
        ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
        : 'border-red-100 bg-red-50 text-red-600'
    }`}
  >
    <FileText size={22} className="mx-auto" />
    <p className="mt-2 text-xs font-black uppercase tracking-wider">{label}</p>
    <p className="mt-1 text-[11px] font-semibold">
      {value ? 'Uploaded' : 'Missing'}
    </p>
  </div>
);

export default function VehicleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const vehicle = getVehicleSeedById(Number(id));

  useEffect(() => {
    if (vehicle) {
      window.dispatchEvent(
        new CustomEvent('setHeaderTitle', {
          detail: `Vehicle - ${vehicle.vehicleNumber}`,
        })
      );
    }
  }, [vehicle]);

  if (!vehicle) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate('/vehicles')}
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700"
        >
          <ArrowLeft size={16} /> Back to Vehicles
        </button>
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Vehicle not found.</p>
        </div>
      </div>
    );
  }

  const dueItems = [
    { label: 'Insurance Expiry Date', date: vehicle.insuranceExpiry },
    { label: 'Road Permit Expiry', date: vehicle.roadPermitExpiry },
    { label: 'Auth. Exp. Date', date: vehicle.authExpiryDate },
    { label: 'Import Date', date: vehicle.importDate },
  ];
  const authRiderName = getVehiclePersonDisplayName(
    vehicle.authRider,
    i18n.language
  );
  const driverName = getVehiclePersonDisplayName(vehicle.driver, i18n.language);

  return (
    <div className="p-4 md:p-6 space-y-5">
      <button
        onClick={() => navigate('/vehicles')}
        className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
      >
        <ArrowLeft size={16} /> Back to Vehicles
      </button>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 text-white shadow-xl">
        <div className="relative p-5 md:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.35),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.28),transparent_25%)]" />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-3xl bg-white/10 p-4 text-emerald-300 ring-1 ring-white/15">
                <Car size={34} />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">
                  Sl. No. {vehicle.slNo} • Sequence {vehicle.sequenceNo}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-black tracking-tight">
                    {vehicle.vehicleNumber}
                  </h1>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[vehicle.status]}`}
                  >
                    {vehicle.status}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-bold ${healthStyles[vehicle.health]}`}
                  >
                    {vehicle.health}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-300">
                  {vehicle.vehicleType} • {vehicle.brand} {vehicle.model} •{' '}
                  {vehicle.year} • {vehicle.color}
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
                  {vehicle.description}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  vehicle.riderPhone &&
                  (window.location.href = `tel:${vehicle.riderPhone}`)
                }
                disabled={!vehicle.riderPhone}
                className="rounded-full bg-white/10 p-2.5 text-white ring-1 ring-white/15 hover:bg-white/20 disabled:opacity-40"
              >
                <Phone size={18} />
              </button>
              <button
                onClick={() => {
                  if (!vehicle.riderPhone) return;
                  window.open(
                    `https://wa.me/${vehicle.riderPhone.replace(/[^0-9]/g, '')}?text=Hello%20${encodeURIComponent(authRiderName)}`,
                    '_blank'
                  );
                }}
                disabled={!vehicle.riderPhone}
                className="rounded-full bg-emerald-500 p-2.5 text-white hover:bg-emerald-400 disabled:opacity-40"
              >
                <MessageCircle size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <InfoTile
          label="Vehicle Type"
          value={vehicle.vehicleType}
          icon={<Car size={14} />}
        />
        <InfoTile
          label="Chassis No."
          value={vehicle.chassisNumber}
          icon={<IdCard size={14} />}
        />
        <InfoTile
          label="Color"
          value={vehicle.color}
          icon={<Palette size={14} />}
        />
        <InfoTile
          label="Petrol Allowance"
          value={vehicle.petrolAllowance}
          icon={<Fuel size={14} />}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
            Official Vehicle Record
          </h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <InfoTile
              label="Brand"
              value={vehicle.brand}
              icon={<Car size={14} />}
            />
            <InfoTile
              label="Model / Year"
              value={`${vehicle.model} / ${vehicle.year}`}
              icon={<Gauge size={14} />}
            />
            <InfoTile
              label="Sequence No."
              value={vehicle.sequenceNo}
              icon={<IdCard size={14} />}
            />
            <InfoTile
              label="Import Date"
              value={formatDate(vehicle.importDate)}
              icon={<Calendar size={14} />}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
            Expiry Timeline
          </h2>
          <div className="mt-4 space-y-3">
            {dueItems.map((item) => {
              const days = getDaysUntil(item.date);
              const isRisk =
                item.label !== 'Import Date' && days !== null && days <= 30;
              return (
                <div
                  key={item.label}
                  className={`rounded-2xl border p-3 ${
                    isRisk
                      ? 'border-red-100 bg-red-50'
                      : 'border-slate-100 bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <Calendar size={14} /> {item.label}
                    </span>
                    <span
                      className={`text-[11px] font-bold ${
                        isRisk ? 'text-red-600' : 'text-emerald-700'
                      }`}
                    >
                      {item.label === 'Import Date' ? 'Record' : getDueText(item.date)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDate(item.date)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
            Authorization
          </h2>
          <div className="mt-4 space-y-3">
            <InfoTile
              label="Auth. Rider"
              value={authRiderName}
              icon={<User size={14} />}
            />
            <InfoTile
              label="Auth. Status"
              value={vehicle.authStatus}
              icon={<ShieldCheck size={14} />}
            />
            <InfoTile
              label="Auth. Record"
              value={vehicle.authRecord}
              icon={<FileText size={14} />}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
            Driver & Place
          </h2>
          <div className="mt-4 space-y-3">
            <InfoTile
              label="Driver"
              value={driverName}
              icon={<User size={14} />}
            />
            <InfoTile
              label="Place"
              value={vehicle.place}
              icon={<MapPin size={14} />}
            />
            <InfoTile
              label="Status"
              value={vehicle.status}
              icon={<AlertTriangle size={14} />}
            />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
            Documents
          </h2>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <DocumentTile label="Pic" value={vehicle.picUrl} />
            <DocumentTile label="Istemara" value={vehicle.istemaraUrl} />
            <DocumentTile label="Op.Card" value={vehicle.opCardUrl} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
            Description
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            {vehicle.description}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
            History Record
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            {vehicle.historyRecord}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
          Maintenance Snapshot
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <InfoTile
            label="Last Oil Change"
            value={formatDate(vehicle.lastOilChange)}
            icon={<Fuel size={14} />}
          />
          <InfoTile
            label="Next Oil Due"
            value={formatDate(vehicle.nextOilDue)}
            icon={<Fuel size={14} />}
          />
          <InfoTile
            label="Last Service"
            value={formatDate(vehicle.lastService)}
            icon={<Wrench size={14} />}
          />
          <InfoTile
            label="Next Service"
            value={formatDate(vehicle.nextServiceDue)}
            icon={<Wrench size={14} />}
          />
        </div>
      </div>
    </div>
  );
}
