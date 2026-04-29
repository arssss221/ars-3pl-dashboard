import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Car,
  CheckCircle2,
  Clock,
  CreditCard,
  FileWarning,
  Gauge,
  IdCard,
  LayoutDashboard,
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
    const workingRiders = employeeSeeds.filter((e) => e.status === 'Working').length;
    const leaveRiders = employeeSeeds.filter((e) => e.status === 'Leave').length;
    const incompletePapers = employeeSeeds.filter(
      (e) => e.agreement === 'Not Complete' || e.commitment === 'Not Complete' || !e.healthInsuranceName || !e.healthInsuranceExpiry
    ).length;
    const iqamaUrgent = employeeSeeds.filter((e) => {
      const days = getDaysUntil(e.iqamaExpiry);
      return days !== null && days <= 30;
    }).length;

    const workingVehicles = vehicleSeeds.filter((v) => v.status === 'Working').length;
    const maintenanceVehicles = vehicleSeeds.filter((v) => v.status === 'Maintenance').length;
    const vehicleRisks = vehicleSeeds.filter((v) => {
      const insurance = getDaysUntil(v.insuranceExpiry);
      const permit = getDaysUntil(v.roadPermitExpiry);
      const auth = getDaysUntil(v.authExpiryDate);
      return [insurance, permit, auth].some((days) => days !== null && days <= 30);
    }).length;
    const openAccidents = vehicleSeeds.filter((v) => v.status === 'Accident').length;

    const dueMoney = 1930; // Mock data
    const paidMoney = 840; // Mock data

    return {
      totalEmployees: employeeSeeds.length,
      workingRiders,
      leaveRiders,
      incompletePapers,
      iqamaUrgent,
      totalVehicles: vehicleSeeds.length,
      workingVehicles,
      maintenanceVehicles,
      vehicleRisks,
      openAccidents,
      dueMoney,
      paidMoney,
    };
  }, []);

  const totalUrgentIssues = data.iqamaUrgent + data.vehicleRisks + data.openAccidents;

  return (
    <div className="min-h-full bg-slate-50/50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* Header Section */}
        <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-100 text-emerald-600">
                <LayoutDashboard size={18} />
              </span>
              <p className="text-sm font-semibold text-emerald-600 tracking-wide uppercase">Overview</p>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Command Center</h1>
            <p className="mt-1 text-sm text-slate-500">Real-time metrics for your fleet, team, and financials.</p>
          </div>
          
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <div className={`h-2.5 w-2.5 rounded-full ${totalUrgentIssues > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
            <span className="text-sm font-medium text-slate-700">
              {totalUrgentIssues > 0 ? `${totalUrgentIssues} action(s) required` : 'All systems operational'}
            </span>
          </div>
        </header>

        {/* Top KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
          <KpiCard 
            title="Total Employees" 
            value={data.totalEmployees} 
            subtitle={`${data.workingRiders} active today`}
            icon={<Users className="w-5 h-5 md:w-6 md:h-6" />} 
            tone="emerald" 
          />
          <KpiCard 
            title="Total Fleet" 
            value={data.totalVehicles} 
            subtitle={`${data.workingVehicles} on the road`}
            icon={<Car className="w-5 h-5 md:w-6 md:h-6" />} 
            tone="blue" 
          />
          <KpiCard 
            title="Pending Ledger" 
            value={`${data.dueMoney} SAR`} 
            subtitle={`${data.paidMoney} SAR collected`}
            icon={<CreditCard className="w-5 h-5 md:w-6 md:h-6" />} 
            tone="slate" 
          />
          <KpiCard 
            title="Active Alerts" 
            value={totalUrgentIssues} 
            subtitle="Needs immediate attention"
            icon={<AlertTriangle className="w-5 h-5 md:w-6 md:h-6" />} 
            tone={totalUrgentIssues > 0 ? 'amber' : 'emerald'} 
          />
          <KpiCard 
            title="On Leave" 
            value={data.leaveRiders} 
            subtitle="Employees away"
            icon={<Clock className="w-5 h-5 md:w-6 md:h-6" />} 
            tone="slate" 
          />
          <KpiCard 
            title="In Maintenance" 
            value={data.maintenanceVehicles} 
            subtitle="Vehicles in garage"
            icon={<Wrench className="w-5 h-5 md:w-6 md:h-6" />} 
            tone="amber" 
          />
          <KpiCard 
            title="Missing Docs" 
            value={data.incompletePapers} 
            subtitle="Profiles to update"
            icon={<FileWarning className="w-5 h-5 md:w-6 md:h-6" />} 
            tone="amber" 
          />
          <KpiCard 
            title="Open Accidents" 
            value={data.openAccidents} 
            subtitle="Under workflow"
            icon={<AlertTriangle className="w-5 h-5 md:w-6 md:h-6" />} 
            tone="red" 
          />
        </div>

        {/* Main Content Layout */}
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          
          {/* Left Column: Operational Status */}
          <div className="space-y-6">
            
            {/* Fleet Status Panel */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Gauge size={20} className="text-sky-500" /> Fleet Readiness
                </h2>
                <button onClick={() => navigate('/vehicles')} className="text-sm font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1">
                  View All <ArrowRight size={16} />
                </button>
              </div>
              
              <div className="space-y-5">
                <ProgressBar 
                  label="On Duty" 
                  value={data.workingVehicles} 
                  total={data.totalVehicles} 
                  tone="emerald" 
                />
                <ProgressBar 
                  label="In Maintenance" 
                  value={data.maintenanceVehicles} 
                  total={data.totalVehicles} 
                  tone="amber" 
                />
                <ProgressBar 
                  label="Accident / Offline" 
                  value={data.openAccidents} 
                  total={data.totalVehicles} 
                  tone="red" 
                />
              </div>
            </div>

            {/* Employee Status Panel */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Users size={20} className="text-emerald-500" /> Workforce Status
                </h2>
                <button onClick={() => navigate('/employees')} className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
                  View All <ArrowRight size={16} />
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="flex flex-col items-center justify-center text-center rounded-xl bg-emerald-50 p-3 sm:p-4 border border-emerald-100">
                  <p className="text-[10px] sm:text-xs font-semibold text-emerald-600 uppercase tracking-wide leading-tight">Active</p>
                  <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-emerald-900">{data.workingRiders}</p>
                </div>
                <div className="flex flex-col items-center justify-center text-center rounded-xl bg-slate-50 p-3 sm:p-4 border border-slate-200">
                  <p className="text-[10px] sm:text-xs font-semibold text-slate-600 uppercase tracking-wide leading-tight">On Leave</p>
                  <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-slate-900">{data.leaveRiders}</p>
                </div>
                <div className="flex flex-col items-center justify-center text-center rounded-xl bg-amber-50 p-3 sm:p-4 border border-amber-100">
                  <p className="text-[10px] sm:text-xs font-semibold text-amber-600 uppercase tracking-wide leading-tight">Missing Docs</p>
                  <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-amber-900">{data.incompletePapers}</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Urgent Action Items & Quick Links */}
          <div className="space-y-6">
            
            {/* Urgent Alerts Panel */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-full">
              <div className="border-b border-slate-100 bg-slate-50 p-5">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle size={20} className="text-amber-500" /> Action Required
                </h2>
                <p className="text-sm text-slate-500 mt-1">Issues needing immediate resolution.</p>
              </div>
              
              <div className="p-2 flex-1 flex flex-col gap-1 overflow-y-auto">
                {totalUrgentIssues === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                    <CheckCircle2 size={40} className="text-emerald-400 mb-3" />
                    <p className="font-semibold text-slate-900">All Caught Up</p>
                    <p className="text-sm mt-1">No urgent issues to display.</p>
                  </div>
                ) : (
                  <>
                    {data.iqamaUrgent > 0 && (
                      <AlertItem 
                        icon={<IdCard size={18} />} 
                        title="Iqama Expiring Soon" 
                        description={`${data.iqamaUrgent} employee(s) have Iqamas expiring within 30 days.`}
                        actionText="Review"
                        onClick={() => navigate('/employees')}
                        tone="amber"
                      />
                    )}
                    {data.vehicleRisks > 0 && (
                      <AlertItem 
                        icon={<FileWarning size={18} />} 
                        title="Vehicle Document Risk" 
                        description={`${data.vehicleRisks} vehicle(s) have insurance or permits ending soon.`}
                        actionText="Review"
                        onClick={() => navigate('/vehicles')}
                        tone="amber"
                      />
                    )}
                    {data.openAccidents > 0 && (
                      <AlertItem 
                        icon={<Wrench size={18} />} 
                        title="Open Accident Reports" 
                        description={`${data.openAccidents} vehicle(s) currently registered under accident workflow.`}
                        actionText="Manage"
                        onClick={() => navigate('/vehicles/accidents')}
                        tone="red"
                      />
                    )}
                    {data.incompletePapers > 0 && (
                      <AlertItem 
                        icon={<FileWarning size={18} />} 
                        title="Incomplete Profiles" 
                        description={`${data.incompletePapers} employee(s) missing contracts or insurance data.`}
                        actionText="Update"
                        onClick={() => navigate('/employees')}
                        tone="slate"
                      />
                    )}
                  </>
                )}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}

// --- Helper Components ---

function KpiCard({ title, value, subtitle, icon, tone }: { title: string, value: string | number, subtitle: string, icon: React.ReactNode, tone: 'emerald' | 'blue' | 'amber' | 'slate' | 'red' }) {
  const styles = {
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    blue: 'bg-sky-50 text-sky-600 border-sky-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    slate: 'bg-slate-50 text-slate-600 border-slate-200',
    red: 'bg-red-50 text-red-600 border-red-100',
  }[tone];

  return (
    <div className="flex flex-col items-center justify-center text-center rounded-2xl border border-slate-200 bg-white p-4 md:p-6 shadow-sm transition hover:shadow-md">
      <div className={`flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl border ${styles} mb-3 md:mb-4 shadow-sm`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider leading-tight">{title}</p>
        <p className="mt-1 md:mt-2 text-2xl md:text-3xl font-black text-slate-900">{value}</p>
        <p className="mt-1 text-[10px] md:text-xs font-semibold text-slate-400 leading-tight">{subtitle}</p>
      </div>
    </div>
  );
}

function ProgressBar({ label, value, total, tone }: { label: string, value: number, total: number, tone: 'emerald' | 'amber' | 'red' }) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  
  const barColor = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  }[tone];

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-2">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className="font-bold text-slate-900">{value} <span className="text-slate-400 font-medium">/ {total}</span></span>
      </div>
      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${barColor} rounded-full`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}

function AlertItem({ icon, title, description, actionText, onClick, tone }: { icon: React.ReactNode, title: string, description: string, actionText: string, onClick: () => void, tone: 'amber' | 'red' | 'slate' }) {
  const iconColor = {
    amber: 'text-amber-500 bg-amber-50',
    red: 'text-red-500 bg-red-50',
    slate: 'text-slate-500 bg-slate-100',
  }[tone];

  return (
    <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-50 transition">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconColor}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>
      </div>
      <button 
        onClick={onClick}
        className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition"
      >
        {actionText}
      </button>
    </div>
  );
}
