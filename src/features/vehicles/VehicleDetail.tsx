import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Calendar,
  Car,
  FileText,
  Fuel,
  IdCard,
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
  Working: 'bg-emerald-100 text-emerald-700',
  Reserved: 'bg-yellow-100 text-yellow-700',
  Servicing: 'bg-amber-100 text-amber-700',
  Unavailable: 'bg-red-100 text-red-700',
};

const healthStyles: Record<VehicleHealth, string> = {
  Good: 'bg-emerald-100 text-emerald-700',
  'Due Soon': 'bg-amber-100 text-amber-700',
  Attention: 'bg-red-100 text-red-700',
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString('en-GB');
};

interface RowProps {
  label: string;
  value: string;
}

const Row = ({ label, value }: RowProps) => (
  <div className="flex items-start justify-between gap-2 border-b border-slate-100 py-1.5 last:border-b-0">
    <span className="text-xs text-slate-500">{label}</span>
    <span className="max-w-[55%] text-right text-xs font-semibold text-slate-800">
      {value || '-'}
    </span>
  </div>
);

interface SectionProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const Section = ({ title, icon, children }: SectionProps) => (
  <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">
    <h2 className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-800">
      {icon}
      {title}
    </h2>
    {children}
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
      <div className="p-2 md:p-3">
        <button
          onClick={() => navigate('/vehicles')}
          className="mb-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700"
        >
          <ArrowLeft size={14} />
          Back to Vehicles
        </button>

        <div className="rounded-lg border border-slate-200 bg-white p-3 text-center shadow-sm">
          <p className="text-xs text-slate-500">Vehicle not found.</p>
        </div>
      </div>
    );
  }

  const authRiderName = getVehiclePersonDisplayName(
    vehicle.authRider,
    i18n.language
  );

  const driverName = getVehiclePersonDisplayName(
    vehicle.driver,
    i18n.language
  );

  return (
    <div className="space-y-2 p-2 md:p-3">
      <button
        onClick={() => navigate('/vehicles')}
        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
      >
        <ArrowLeft size={14} />
        Back to Vehicles
      </button>

      <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">
        <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <h1 className="text-base font-black text-slate-900">
                {vehicle.vehicleNumber}
              </h1>

              <span
                className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${statusStyles[vehicle.status]}`}
              >
                {vehicle.status}
              </span>

              <span
                className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${healthStyles[vehicle.health]}`}
              >
                {vehicle.health}
              </span>
            </div>

            <p className="mt-0.5 text-xs text-slate-500">
              {vehicle.vehicleType} • {vehicle.brand} {vehicle.model} •{' '}
              {vehicle.year}
            </p>

            <p className="mt-0.5 text-xs text-slate-500">
              Sl. No. {vehicle.slNo} • Sequence {vehicle.sequenceNo}
            </p>
          </div>

        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <Section title="Vehicle Information" icon={<Car size={16} />}>
          <Row label="Vehicle Type" value={vehicle.vehicleType} />
          <Row label="Brand" value={vehicle.brand} />
          <Row label="Model" value={vehicle.model} />
          <Row label="Year" value={String(vehicle.year)} />
          <Row label="Color" value={vehicle.color} />
          <Row label="Chassis No." value={vehicle.chassisNumber} />
          <Row label="Sequence No." value={vehicle.sequenceNo} />
          <Row label="Petrol Allowance" value={vehicle.petrolAllowance} />
        </Section>

        <Section title="Dates & Expiry" icon={<Calendar size={16} />}>
          <Row label="Import Date" value={formatDate(vehicle.importDate)} />
          <Row
            label="Insurance Expiry"
            value={formatDate(vehicle.insuranceExpiry)}
          />
          <Row
            label="Road Permit Expiry"
            value={formatDate(vehicle.roadPermitExpiry)}
          />
          <Row
            label="Authorization Expiry"
            value={formatDate(vehicle.authExpiryDate)}
          />
        </Section>

        <Section title="Authorization" icon={<ShieldCheck size={16} />}>
          <Row label="Authorized Rider" value={authRiderName} />
          <Row label="Authorization Status" value={vehicle.authStatus} />
          <Row label="Authorization Record" value={vehicle.authRecord} />
        </Section>

        <Section title="Driver & Location" icon={<User size={16} />}>
          <Row label="Driver" value={driverName} />
          <Row label="Place" value={vehicle.place} />
          <Row label="Status" value={vehicle.status} />
        </Section>

        <Section title="Documents" icon={<FileText size={16} />}>
          <Row label="Vehicle Picture" value={vehicle.picUrl ? 'Uploaded' : 'Missing'} />
          <Row label="Istemara" value={vehicle.istemaraUrl ? 'Uploaded' : 'Missing'} />
          <Row label="Operation Card" value={vehicle.opCardUrl ? 'Uploaded' : 'Missing'} />
        </Section>

        <Section title="Maintenance" icon={<Wrench size={16} />}>
          <Row label="Last Oil Change" value={formatDate(vehicle.lastOilChange)} />
          <Row label="Next Oil Due" value={formatDate(vehicle.nextOilDue)} />
          <Row label="Last Service" value={formatDate(vehicle.lastService)} />
          <Row label="Next Service" value={formatDate(vehicle.nextServiceDue)} />
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <Section title="Description" icon={<IdCard size={14} />}>
          <p className="text-xs leading-4 text-slate-600 line-clamp-3">
            {vehicle.description || '-'}
          </p>
        </Section>

        <Section title="History Record" icon={<Fuel size={14} />}>
          <p className="text-xs leading-4 text-slate-600 line-clamp-3">
            {vehicle.historyRecord || '-'}
          </p>
        </Section>
      </div>
    </div>
  );
}
