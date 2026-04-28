import { useState, type ChangeEvent, type ReactNode } from 'react';
import {
  Bell,
  Building2,
  CheckCircle,
  Cloud,
  Database,
  Globe2,
  Lock,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Wifi,
} from 'lucide-react';

type SettingKey = 'emailAlerts' | 'paperAlerts' | 'fleetAlerts' | 'financeAlerts' | 'autoBackup' | 'strictPermissions';

type Tone = 'emerald' | 'sky' | 'amber' | 'slate';

export default function Settings() {
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    companyName: 'ARS 3PL Logistics',
    branch: 'Riyadh Main Operation',
    country: 'Saudi Arabia',
    timezone: 'Asia/Riyadh',
    currency: 'SAR',
    language: 'English / Bangla',
    emailAlerts: true,
    paperAlerts: true,
    fleetAlerts: true,
    financeAlerts: true,
    autoBackup: true,
    strictPermissions: true,
  });

  const updateText = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSettings({ ...settings, [event.target.name]: event.target.value });
  };

  const toggleSetting = (key: SettingKey) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const handleSave = () => {
    localStorage.setItem('arsSettingsDraft', JSON.stringify(settings));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1400);
  };

  return (
    <div className="min-h-full bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.14),transparent_30%),radial-gradient(circle_at_92%_0%,rgba(14,165,233,0.12),transparent_26%),linear-gradient(135deg,#f8fafc_0%,#eefdf7_55%,#fff7ed_100%)] p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="overflow-hidden rounded-[32px] border border-white/20 bg-slate-950 text-white shadow-2xl">
          <div className="relative p-5 md:p-7">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(16,185,129,0.5),transparent_32%),radial-gradient(circle_at_88%_0%,rgba(59,130,246,0.28),transparent_26%)]" />
            <div className="relative grid gap-5 lg:grid-cols-[1fr_0.85fr] lg:items-center">
              <div className="text-center lg:text-left">
                <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-emerald-100">
                  <SettingsIcon size={13} /> System Settings
                </p>
                <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
                  One Console For The Whole Operation
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
                  Company identity, region, notification channels, permission strictness, and backup behavior are grouped for a cleaner backend handoff later.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <HeroSetting icon={<Wifi size={18} />} label="System" value="Online" />
                <HeroSetting icon={<Cloud size={18} />} label="Backup" value={settings.autoBackup ? 'Auto' : 'Manual'} />
                <HeroSetting icon={<Lock size={18} />} label="Policy" value={settings.strictPermissions ? 'Strict' : 'Open'} />
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="rounded-[30px] border border-white bg-white/95 p-5 shadow-sm backdrop-blur">
            <HeaderLine
              icon={<Building2 size={16} />}
              eyebrow="Company profile"
              title="Business Defaults"
              action={
                <button
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-slate-900/10 transition hover:bg-emerald-600"
                >
                  {saved ? <CheckCircle size={15} /> : <Save size={15} />}
                  {saved ? 'Saved' : 'Save Settings'}
                </button>
              }
            />
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <SettingsInput icon={<Building2 size={13} />} label="Company Name" name="companyName" value={settings.companyName} onChange={updateText} />
              <SettingsInput icon={<Smartphone size={13} />} label="Branch" name="branch" value={settings.branch} onChange={updateText} />
              <SettingsSelect icon={<Globe2 size={13} />} label="Country" name="country" value={settings.country} onChange={updateText} options={['Saudi Arabia', 'Bangladesh', 'United Arab Emirates']} />
              <SettingsSelect icon={<Globe2 size={13} />} label="Timezone" name="timezone" value={settings.timezone} onChange={updateText} options={['Asia/Riyadh', 'Asia/Dhaka', 'UTC']} />
              <SettingsSelect icon={<Database size={13} />} label="Currency" name="currency" value={settings.currency} onChange={updateText} options={['SAR', 'BDT', 'USD']} />
              <SettingsSelect icon={<SlidersHorizontal size={13} />} label="Language" name="language" value={settings.language} onChange={updateText} options={['English / Bangla', 'English', 'Bangla', 'Arabic']} />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
            <SummaryCard icon={<Bell size={20} />} title="Notification Coverage" value="4 Channels" meta="Papers, fleet, finance, and system alerts." tone="emerald" />
            <SummaryCard icon={<ShieldCheck size={20} />} title="Access Protection" value="Strict" meta="Sensitive screens remain permission-gated." tone="sky" />
            <SummaryCard icon={<Database size={20} />} title="Data Readiness" value="Backend Ready" meta="Settings draft is stored locally until API wiring." tone="amber" />
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <SettingsPanel icon={<Bell size={18} />} title="Notification Rules" description="Control which operational signals should reach the header notification bar.">
            <ToggleRow label="Email alerts" description="Send daily summaries to the admin inbox." enabled={settings.emailAlerts} onClick={() => toggleSetting('emailAlerts')} />
            <ToggleRow label="Paper expiry alerts" description="Iqama, agreement, commitment, and insurance risk." enabled={settings.paperAlerts} onClick={() => toggleSetting('paperAlerts')} />
            <ToggleRow label="Fleet workflow alerts" description="Oil, service, permit, insurance, and accidents." enabled={settings.fleetAlerts} onClick={() => toggleSetting('fleetAlerts')} />
          </SettingsPanel>

          <SettingsPanel icon={<Database size={18} />} title="Finance And Data" description="Keep transaction and reporting behavior predictable for daily work.">
            <ToggleRow label="Finance alerts" description="Outstanding balance and paid transaction signals." enabled={settings.financeAlerts} onClick={() => toggleSetting('financeAlerts')} />
            <ToggleRow label="Automatic backup" description="Prepare daily snapshots when backend storage is connected." enabled={settings.autoBackup} onClick={() => toggleSetting('autoBackup')} />
            <ConfigMini label="Retention" value="24 months" tone="sky" />
          </SettingsPanel>

          <SettingsPanel icon={<Lock size={18} />} title="Security Posture" description="Guard sensitive modules while keeping the dashboard fast for operators.">
            <ToggleRow label="Strict permissions" description="Block hidden modules even if direct URL is entered." enabled={settings.strictPermissions} onClick={() => toggleSetting('strictPermissions')} />
            <ConfigMini label="Session Timeout" value="8 hours" tone="emerald" />
            <ConfigMini label="Audit Log" value="Enabled" tone="amber" />
          </SettingsPanel>
        </section>
      </div>
    </div>
  );
}

function HeaderLine({
  icon,
  eyebrow,
  title,
  action,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-emerald-300 shadow-lg shadow-slate-900/10">
          {icon}
        </span>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-emerald-600">{eyebrow}</p>
          <h2 className="text-lg font-black tracking-tight text-slate-900">{title}</h2>
        </div>
      </div>
      {action}
    </div>
  );
}

function HeroSetting({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/10 p-4 text-center backdrop-blur">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-emerald-100">
        {icon}
      </div>
      <p className="mt-2 text-xl font-black text-white">{value}</p>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">{label}</p>
    </div>
  );
}

function SettingsInput({
  icon,
  label,
  name,
  value,
  onChange,
}: {
  icon: ReactNode;
  label: string;
  name: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="rounded-[22px] border border-slate-100 bg-slate-50 p-3 transition focus-within:border-emerald-200 focus-within:bg-white focus-within:shadow-sm">
      <span className="flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
        {icon}
        {label}
      </span>
      <input
        name={name}
        value={value}
        onChange={onChange}
        className="mt-2 w-full rounded-2xl border border-white bg-white px-3 py-3 text-center text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-100"
      />
    </label>
  );
}

function SettingsSelect({
  icon,
  label,
  name,
  value,
  onChange,
  options,
}: {
  icon: ReactNode;
  label: string;
  name: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
}) {
  return (
    <label className="rounded-[22px] border border-slate-100 bg-slate-50 p-3 transition focus-within:border-emerald-200 focus-within:bg-white focus-within:shadow-sm">
      <span className="flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
        {icon}
        {label}
      </span>
      <select
        name={name}
        value={value}
        onChange={onChange}
        className="mt-2 w-full rounded-2xl border border-white bg-white px-3 py-3 text-center text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-100"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function SummaryCard({
  icon,
  title,
  value,
  meta,
  tone,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  meta: string;
  tone: Tone;
}) {
  const toneClass = {
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    sky: 'border-sky-100 bg-sky-50 text-sky-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
    slate: 'border-slate-100 bg-slate-50 text-slate-700',
  }[tone];

  return (
    <div className={`rounded-[28px] border p-5 text-center shadow-sm ${toneClass}`}>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
        {icon}
      </div>
      <p className="mt-4 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-[0.18em]">{title}</p>
      <p className="mt-2 text-xs font-semibold leading-relaxed text-slate-500">{meta}</p>
    </div>
  );
}

function SettingsPanel({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-[30px] border border-white bg-white/95 p-5 shadow-sm">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-emerald-300 shadow-lg shadow-slate-900/10">
          {icon}
        </div>
        <h3 className="mt-3 text-lg font-black text-slate-900">{title}</h3>
        <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-500">{description}</p>
      </div>
      <div className="mt-5 space-y-3">{children}</div>
    </div>
  );
}

function ToggleRow({ label, description, enabled, onClick }: { label: string; description: string; enabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-[22px] border border-slate-100 bg-slate-50 p-3 text-left transition hover:bg-emerald-50/60"
    >
      <span className="min-w-0">
        <span className="block text-sm font-black text-slate-900">{label}</span>
        <span className="block text-xs font-semibold leading-relaxed text-slate-500">{description}</span>
      </span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${enabled ? 'left-6' : 'left-1'}`} />
      </span>
    </button>
  );
}

function ConfigMini({ label, value, tone }: { label: string; value: string; tone: Tone }) {
  const toneClass = {
    emerald: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    sky: 'border-sky-100 bg-sky-50 text-sky-700',
    amber: 'border-amber-100 bg-amber-50 text-amber-700',
    slate: 'border-slate-100 bg-slate-50 text-slate-700',
  }[tone];

  return (
    <div className={`rounded-[22px] border p-4 text-center ${toneClass}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</p>
      <p className="mt-1 text-lg font-black text-slate-900">{value}</p>
    </div>
  );
}
