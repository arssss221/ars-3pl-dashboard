import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  CalendarClock,
  Car,
  ClipboardCheck,
  CreditCard,
  FileWarning,
  Fuel,
  Gauge,
  IdCard,
  MapPinned,
  ShieldCheck,
  Users,
  Wrench,
} from 'lucide-react';
import { employeeSeeds } from '../employees/employeeData';
import { vehicleSeeds } from '../vehicles/vehicleData';

const getDaysUntil = (dateStr: string) => {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  if (Number.isNaN(target.getTime())) return null;
  return Math.floor((target.getTime() - today.getTime()) / 86400000);
};

export default function Dashboard() {
  const navigate = useNavigate();

  const data = useMemo(() => {
    const workingRiders = employeeSeeds.filter(
      (employee) => employee.status === 'Working'
    ).length;
    const incompletePapers = employeeSeeds.filter(
      (employee) =>
        employee.agreement === 'Not Complete' ||
        employee.commitment === 'Not Complete' ||
        !employee.healthInsuranceName ||
        !employee.healthInsuranceExpiry
    ).length;
    const iqamaUrgent = employeeSeeds.filter((employee) => {
      const days = getDaysUntil(employee.iqamaExpiry);
      return days !== null && days <= 30;
    }).length;

    const workingVehicles = vehicleSeeds.filter(
      (vehicle) => vehicle.status === 'Working'
    ).length;
    const vehicleRisks = vehicleSeeds.filter((vehicle) => {
      const insurance = getDaysUntil(vehicle.insuranceExpiry);
      const permit = getDaysUntil(vehicle.roadPermitExpiry);
      const auth = getDaysUntil(vehicle.authExpiryDate);
      return [insurance, permit, auth].some(
        (days) => days !== null && days <= 30
      );
    }).length;
    const oilWatch = vehicleSeeds.filter((vehicle) => {
      const days = getDaysUntil(vehicle.nextOilDue);
      return days !== null && days <= 30;
    }).length;
    const unavailableVehicles = vehicleSeeds.filter(
      (vehicle) => vehicle.status === 'Unavailable'
    ).length;

    return {
      workingRiders,
      incompletePapers,
      iqamaUrgent,
      workingVehicles,
      vehicleRisks,
      oilWatch,
      unavailableVehicles,
      dueMoney: 1930,
      paidMoney: 840,
      todayQueue: 12,
      openAccidents: 2,
      pendingIds: 4,
    };
  }, []);

  const readiness =
    vehicleSeeds.length > 0
      ? Math.round((data.workingVehicles / vehicleSeeds.length) * 100)
      : 0;
  const riderCoverage =
    employeeSeeds.length > 0
      ? Math.round((data.workingRiders / employeeSeeds.length) * 100)
      : 0;
  const collectionRate =
    data.dueMoney + data.paidMoney > 0
      ? Math.round((data.paidMoney / (data.dueMoney + data.paidMoney)) * 100)
      : 0;

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.16),transparent_32%),linear-gradient(135deg,#f8fafc_0%,#eefdf7_52%,#fff7ed_100%)] p-4 md:p-5">
      <div className="mx-auto max-w-7xl space-y-4">
        <section className="overflow-hidden rounded-[28px] border border-white/70 bg-slate-950 text-white shadow-xl">
          <div className="relative p-5 md:p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(16,185,129,0.42),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(251,146,60,0.32),transparent_26%)]" />
            <div className="relative grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
              <div className="flex flex-col items-center justify-center text-center lg:items-start lg:text-left">
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-emerald-200">
                  ARS 3PL Control Tower
                </p>
                <h1 className="mt-2 max-w-3xl text-3xl font-black tracking-tight md:text-5xl">
                  One screen for riders, fleet, cash, and compliance.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">
                  Designed for daily dispatch decisions: who is working, which
                  vehicles need action, where money is stuck, and what papers can
                  block operations.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <HeroTile
                  label="Today Queue"
                  value={`${data.todayQueue}`}
                  sub="items need attention"
                  icon={<ClipboardCheck size={18} />}
                />
                <HeroTile
                  label="Collection"
                  value={`${collectionRate}%`}
                  sub="paid vs total ledger"
                  icon={<CreditCard size={18} />}
                />
                <HeroTile
                  label="Fleet Ready"
                  value={`${readiness}%`}
                  sub="working vehicles"
                  icon={<Gauge size={18} />}
                />
                <HeroTile
                  label="Rider Cover"
                  value={`${riderCoverage}%`}
                  sub="working riders"
                  icon={<Users size={18} />}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
          <MetricCard
            label="Riders"
            value={`${employeeSeeds.length}`}
            sub={`${data.workingRiders} working`}
            icon={<Users size={18} />}
            tone="emerald"
          />
          <MetricCard
            label="Vehicles"
            value={`${vehicleSeeds.length}`}
            sub={`${data.workingVehicles} on road`}
            icon={<Car size={18} />}
            tone="blue"
          />
          <MetricCard
            label="Paper Risk"
            value={`${data.incompletePapers + data.iqamaUrgent}`}
            sub="profiles need review"
            icon={<FileWarning size={18} />}
            tone="amber"
          />
          <MetricCard
            label="Money Due"
            value={`${data.dueMoney} SAR`}
            sub={`${data.paidMoney} SAR paid`}
            icon={<CreditCard size={18} />}
            tone="red"
          />
          <MetricCard
            label="Service Watch"
            value={`${data.vehicleRisks + data.unavailableVehicles}`}
            sub="fleet actions"
            icon={<Wrench size={18} />}
            tone="slate"
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_1fr_0.9fr]">
          <Panel title="Operational Health" icon={<ShieldCheck size={16} />}>
            <ProgressLine
              label="Rider coverage"
              value={riderCoverage}
              hint={`${data.workingRiders}/${employeeSeeds.length} working`}
              tone="emerald"
            />
            <ProgressLine
              label="Fleet readiness"
              value={readiness}
              hint={`${data.workingVehicles}/${vehicleSeeds.length} working`}
              tone="blue"
            />
            <ProgressLine
              label="Collection rate"
              value={collectionRate}
              hint={`${data.paidMoney} SAR paid`}
              tone="amber"
            />
          </Panel>

          <Panel title="Risk Radar" icon={<AlertTriangle size={16} />}>
            <RiskRow
              label="Iqama expiring or expired"
              value={data.iqamaUrgent}
              icon={<IdCard size={14} />}
              action={() => navigate('/employees')}
            />
            <RiskRow
              label="Vehicle insurance / permit risk"
              value={data.vehicleRisks}
              icon={<Car size={14} />}
              action={() => navigate('/vehicles')}
            />
            <RiskRow
              label="Open accident workflows"
              value={data.openAccidents}
              icon={<AlertTriangle size={14} />}
              action={() => navigate('/vehicles/accidents')}
            />
            <RiskRow
              label="Pending platform IDs"
              value={data.pendingIds}
              icon={<IdCard size={14} />}
              action={() => navigate('/id-manager')}
            />
          </Panel>

          <Panel title="Quick Command" icon={<ArrowUpRight size={16} />}>
            <div className="grid grid-cols-2 gap-2">
              <QuickButton
                label="Riders"
                icon={<Users size={16} />}
                onClick={() => navigate('/employees')}
              />
              <QuickButton
                label="Fleet"
                icon={<Car size={16} />}
                onClick={() => navigate('/vehicles')}
              />
              <QuickButton
                label="Ledger"
                icon={<CreditCard size={16} />}
                onClick={() => navigate('/transaction')}
              />
              <QuickButton
                label="IDs"
                icon={<IdCard size={16} />}
                onClick={() => navigate('/id-manager')}
              />
            </div>
          </Panel>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Panel title="Dispatch Board" icon={<MapPinned size={16} />}>
            <div className="grid gap-2 md:grid-cols-2">
              {vehicleSeeds.slice(0, 4).map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="flex items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-center"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-emerald-300">
                    <Car size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-800">
                      {vehicle.vehicleNumber}
                    </p>
                    <p className="truncate text-[11px] font-semibold text-slate-500">
                      {vehicle.status} • {vehicle.place}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Next Best Actions" icon={<CalendarClock size={16} />}>
            <ActionItem
              title="Review incomplete rider papers"
              meta={`${data.incompletePapers} rider profiles`}
              icon={<FileWarning size={14} />}
            />
            <ActionItem
              title="Collect pending ledger balances"
              meta={`${data.dueMoney} SAR outstanding`}
              icon={<CreditCard size={14} />}
            />
            <ActionItem
              title="Check vehicle expiry documents"
              meta={`${data.vehicleRisks} vehicles at risk`}
              icon={<BadgeCheck size={14} />}
            />
            <ActionItem
              title="Plan oil and servicing queue"
              meta={`${data.oilWatch} vehicles to monitor`}
              icon={<Fuel size={14} />}
            />
          </Panel>
        </section>
      </div>
    </div>
  );
}

function HeroTile({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex min-h-28 flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/10 p-4 text-center backdrop-blur">
      <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-emerald-200">
        {icon}
      </div>
      <p className="text-2xl font-black">{value}</p>
      <p className="text-[10px] font-black uppercase tracking-wider text-slate-300">
        {label}
      </p>
      <p className="mt-1 text-[10px] text-slate-400">{sub}</p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  icon,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  tone: 'emerald' | 'blue' | 'amber' | 'red' | 'slate';
}) {
  const toneClass = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    blue: 'bg-sky-50 text-sky-700 border-sky-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-100',
  }[tone];

  return (
    <div className={`rounded-2xl border p-4 text-center shadow-sm ${toneClass}`}>
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm">
        {icon}
      </div>
      <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
      <p className="text-[11px] font-black uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-[11px] font-semibold text-slate-500">{sub}</p>
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-white bg-white/90 p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-center gap-2 text-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-emerald-300">
          {icon}
        </div>
        <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
          {title}
        </h2>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function ProgressLine({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number;
  hint: string;
  tone: 'emerald' | 'blue' | 'amber';
}) {
  const barClass = {
    emerald: 'bg-emerald-500',
    blue: 'bg-sky-500',
    amber: 'bg-amber-500',
  }[tone];

  return (
    <div className="rounded-2xl bg-slate-50 p-3 text-center">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-black uppercase tracking-wider text-slate-600">
          {label}
        </span>
        <span className="text-sm font-black text-slate-900">{value}%</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-white">
        <div
          className={`h-2 rounded-full ${barClass}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] font-semibold text-slate-500">{hint}</p>
    </div>
  );
}

function RiskRow({
  label,
  value,
  icon,
  action,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  action: () => void;
}) {
  return (
    <button
      onClick={action}
      className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-center transition-colors hover:bg-emerald-50"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-red-500 shadow-sm">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-black uppercase tracking-wider text-slate-700">
          {label}
        </span>
        <span className="text-[11px] font-semibold text-slate-500">
          {value} open item
        </span>
      </span>
      <span className="text-lg font-black text-slate-900">{value}</span>
    </button>
  );
}

function QuickButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex min-h-24 flex-col items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 p-3 text-center font-black text-slate-700 transition-all hover:-translate-y-0.5 hover:bg-emerald-50 hover:text-emerald-700"
    >
      <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm">
        {icon}
      </span>
      <span className="text-xs uppercase tracking-wider">{label}</span>
    </button>
  );
}

function ActionItem({
  title,
  meta,
  icon,
}: {
  title: string;
  meta: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-2xl bg-slate-50 p-3 text-center">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-black text-slate-800">{title}</span>
        <span className="text-[11px] font-semibold text-slate-500">{meta}</span>
      </span>
    </div>
  );
}
