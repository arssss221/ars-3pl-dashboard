import { useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  Car,
  CheckCircle,
  Clock,
  CreditCard,
  Eye,
  FileText,
  KeyRound,
  Lock,
  Plus,
  Settings as SettingsIcon,
  Shield,
  Users,
  XCircle,
} from 'lucide-react';

type TabKey = 'Roles' | 'Matrix' | 'Audit';
type Tone = 'emerald' | 'sky' | 'amber' | 'rose' | 'slate';

const roleBlueprints: Array<{
  name: string;
  users: number;
  tone: Tone;
  description: string;
  scope: string[];
}> = [
  {
    name: 'Owner',
    users: 1,
    tone: 'emerald',
    description: 'Full command over dashboard, finance, rider records, fleet, settings, and user access.',
    scope: ['Everything', 'Billing', 'Security'],
  },
  {
    name: 'Admin',
    users: 2,
    tone: 'sky',
    description: 'Runs daily operations and can update employees, vehicles, IDs, and reports.',
    scope: ['Employees', 'Vehicles', 'ID Manager'],
  },
  {
    name: 'Dispatcher',
    users: 4,
    tone: 'amber',
    description: 'Handles assignments, service schedules, accidents, and real-time fleet follow-up.',
    scope: ['Fleet', 'Servicing', 'Accidents'],
  },
  {
    name: 'Accountant',
    users: 2,
    tone: 'rose',
    description: 'Controls transaction entries, paid records, dues, and receipt visibility.',
    scope: ['Transactions', 'Paid Ledger', 'Receipts'],
  },
  {
    name: 'Viewer',
    users: 3,
    tone: 'slate',
    description: 'Read-only access for supervisors who need visibility without edit permission.',
    scope: ['Read Only', 'Reports', 'Alerts'],
  },
];

const permissionMatrix = [
  { module: 'Dashboard', icon: Shield, owner: true, admin: true, dispatcher: true, accountant: true, viewer: true },
  { module: 'Employees', icon: Users, owner: true, admin: true, dispatcher: false, accountant: false, viewer: true },
  { module: 'Vehicles', icon: Car, owner: true, admin: true, dispatcher: true, accountant: false, viewer: true },
  { module: 'ID Manager', icon: FileText, owner: true, admin: true, dispatcher: false, accountant: false, viewer: false },
  { module: 'Transactions', icon: CreditCard, owner: true, admin: true, dispatcher: false, accountant: true, viewer: false },
  { module: 'Settings', icon: SettingsIcon, owner: true, admin: false, dispatcher: false, accountant: false, viewer: false },
];

const auditLogs = [
  { time: 'Today 09:42', actor: 'Owner', action: 'Changed transaction permission for Accountant', tone: 'emerald' as Tone },
  { time: 'Today 08:10', actor: 'Admin', action: 'Viewed rider paper risk queue', tone: 'sky' as Tone },
  { time: 'Yesterday 22:18', actor: 'Dispatcher', action: 'Opened accident workflow records', tone: 'amber' as Tone },
  { time: 'Yesterday 17:02', actor: 'System', action: 'Blocked settings edit for Viewer role', tone: 'rose' as Tone },
];

export default function Permissions() {
  const [activeTab, setActiveTab] = useState<TabKey>('Roles');

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.13),transparent_30%),linear-gradient(135deg,#f8fafc_0%,#eefdf7_55%,#fff7ed_100%)] p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="overflow-hidden rounded-[32px] border border-white/20 bg-slate-950 text-white shadow-2xl">
          <div className="relative p-5 md:p-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(16,185,129,0.48),transparent_30%),radial-gradient(circle_at_88%_0%,rgba(251,146,60,0.28),transparent_28%)]" />
            <div className="relative grid gap-5 lg:grid-cols-[1fr_0.9fr] lg:items-center">
              <div className="text-center lg:text-left">
                <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-emerald-100">
                  <Lock size={13} /> Permission Control
                </p>
                <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
                  Access Rules Without Guesswork
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
                  Role blueprints, permission matrix, and audit signals are shaped so the backend can later attach real policies without redesigning the UI.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <HeroStat label="Roles" value={roleBlueprints.length.toString()} />
                <HeroStat label="Modules" value={permissionMatrix.length.toString()} />
                <HeroStat label="Locked" value="1" />
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-[28px] border border-white bg-white/90 p-3 shadow-sm backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap justify-center gap-2 md:justify-start">
            {(['Roles', 'Matrix', 'Audit'] as TabKey[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-[0.16em] transition ${
                  activeTab === tab
                    ? 'bg-slate-950 text-white shadow-lg shadow-slate-900/10'
                    : 'bg-slate-100 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600">
            <Plus size={15} /> New Role
          </button>
        </section>

        {activeTab === 'Roles' && <RolesView />}
        {activeTab === 'Matrix' && <MatrixView />}
        {activeTab === 'Audit' && <AuditView />}
      </div>
    </div>
  );
}

function RolesView() {
  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_0.45fr]">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {roleBlueprints.map((role) => (
          <RoleCard key={role.name} role={role} />
        ))}
      </div>
      <div className="space-y-4">
        <PolicyCard icon={<KeyRound size={19} />} title="Least Privilege" text="Each role starts narrow, then earns extra access only when the work needs it." tone="emerald" />
        <PolicyCard icon={<AlertTriangle size={19} />} title="Risk Guard" text="Settings and finance actions stay protected from read-only and dispatcher accounts." tone="amber" />
        <PolicyCard icon={<Eye size={19} />} title="Audit Friendly" text="Every sensitive action is ready to be logged with actor, time, module, and result." tone="sky" />
      </div>
    </div>
  );
}

function MatrixView() {
  return (
    <div className="overflow-hidden rounded-[30px] border border-white bg-white/95 shadow-sm">
      <div className="border-b border-slate-100 p-5 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">
          Permission Matrix
        </p>
        <h2 className="text-xl font-black text-slate-900">Module Access By Role</h2>
      </div>
      <div className="overflow-auto">
        <table className="min-w-[760px] w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-950 text-white shadow-sm">
            <tr>
              {['Sl.', 'Module', 'Owner', 'Admin', 'Dispatcher', 'Accountant', 'Viewer'].map((heading) => (
                <th key={heading} className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.16em]">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {permissionMatrix.map((row, index) => {
              const Icon = row.icon;
              return (
                <tr key={row.module} className="bg-white transition hover:bg-emerald-50/40">
                  <td className="px-4 py-4 text-xs font-black text-slate-400">{index + 1}</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                        <Icon size={16} />
                      </span>
                      <span className="font-black text-slate-900">{row.module}</span>
                    </div>
                  </td>
                  <PermissionCell enabled={row.owner} />
                  <PermissionCell enabled={row.admin} />
                  <PermissionCell enabled={row.dispatcher} />
                  <PermissionCell enabled={row.accountant} />
                  <PermissionCell enabled={row.viewer} />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AuditView() {
  return (
    <div className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr]">
      <div className="rounded-[30px] border border-white bg-white/95 p-5 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-950 text-emerald-300 shadow-lg shadow-slate-900/10">
          <Clock size={23} />
        </div>
        <h2 className="mt-4 text-xl font-black text-slate-900">Security Timeline</h2>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-500">
          This view is designed for real audit logs later: actor, time, action, module, and blocked attempts.
        </p>
      </div>
      <div className="space-y-3">
        {auditLogs.map((log) => (
          <AuditRow key={`${log.time}-${log.action}`} log={log} />
        ))}
      </div>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/10 p-4 text-center backdrop-blur">
      <p className="text-3xl font-black text-white">{value}</p>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">{label}</p>
    </div>
  );
}

function RoleCard({
  role,
}: {
  role: (typeof roleBlueprints)[number];
}) {
  const toneClass = {
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    sky: 'border-sky-100 bg-sky-50 text-sky-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
    rose: 'border-rose-100 bg-rose-50 text-rose-700',
    slate: 'border-slate-100 bg-slate-50 text-slate-700',
  }[role.tone];

  return (
    <div className="rounded-[30px] border border-white bg-white/95 p-5 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-3xl border ${toneClass}`}>
        <Shield size={22} />
      </div>
      <h3 className="mt-4 text-xl font-black text-slate-900">{role.name}</h3>
      <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
        {role.users} users assigned
      </p>
      <p className="mt-3 min-h-16 text-sm font-semibold leading-relaxed text-slate-500">
        {role.description}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {role.scope.map((item) => (
          <span key={item} className="rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-[11px] font-black text-slate-600">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function PolicyCard({ icon, title, text, tone }: { icon: ReactNode; title: string; text: string; tone: Tone }) {
  const toneClass = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    sky: 'bg-sky-50 text-sky-700 border-sky-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-100',
  }[tone];

  return (
    <div className="rounded-[28px] border border-white bg-white/95 p-5 text-center shadow-sm">
      <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border ${toneClass}`}>
        {icon}
      </div>
      <p className="mt-3 text-sm font-black uppercase tracking-[0.18em] text-slate-800">{title}</p>
      <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-500">{text}</p>
    </div>
  );
}

function PermissionCell({ enabled }: { enabled: boolean }) {
  return (
    <td className="px-4 py-4">
      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-2xl border ${enabled ? 'border-emerald-100 bg-emerald-50 text-emerald-600' : 'border-slate-100 bg-slate-50 text-slate-300'}`}>
        {enabled ? <CheckCircle size={17} /> : <XCircle size={17} />}
      </span>
    </td>
  );
}

function AuditRow({ log }: { log: (typeof auditLogs)[number] }) {
  const toneClass = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    sky: 'bg-sky-50 text-sky-700 border-sky-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-100',
  }[log.tone];

  return (
    <div className="rounded-[26px] border border-white bg-white/95 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${toneClass}`}>
          <Clock size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-black text-slate-900">{log.actor}</p>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
              {log.time}
            </span>
          </div>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-500">{log.action}</p>
        </div>
      </div>
    </div>
  );
}
