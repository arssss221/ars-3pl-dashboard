import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  BadgeCheck,
  Building2,
  CalendarClock,
  Camera,
  Check,
  Copy,
  Edit3,
  Globe2,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';

export interface CompanyProfileData {
  englishName: string;
  arabicName: string;
  logo: string;
  establishedYear: string;
  crNumber: string;
  crExpiry: string;
  vatId: string;
  phone: string;
  email: string;
  website: string;
}

const COMPANY_PROFILE_KEY = 'ars-company-profile';

const defaultCompanyProfile: CompanyProfileData = {
  englishName: 'ARS Logistics Manager',
  arabicName: 'شركة ايه آر إس للخدمات اللوجستية',
  logo: '',
  establishedYear: '2021',
  crNumber: '1010923456',
  crExpiry: '2026-12-31',
  vatId: '300987654300003',
  phone: '+966 50 111 2233',
  email: 'info@arslogisticsmanager.com',
  website: 'arslogisticsmanager.com',
};

const loadCompanyProfile = (): CompanyProfileData => {
  try {
    const stored = localStorage.getItem(COMPANY_PROFILE_KEY);
    return stored
      ? { ...defaultCompanyProfile, ...JSON.parse(stored) }
      : defaultCompanyProfile;
  } catch {
    return defaultCompanyProfile;
  }
};

const saveCompanyProfile = (profile: CompanyProfileData) => {
  localStorage.setItem(COMPANY_PROFILE_KEY, JSON.stringify(profile));
  window.dispatchEvent(
    new CustomEvent('ars-company-profile-updated', { detail: profile })
  );
};

const getCrBadge = (expiryDate: string) => {
  const expiry = new Date(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);

  if (Number.isNaN(expiry.getTime())) {
    return {
      label: 'Invalid Date',
      className: 'bg-slate-500/12 text-slate-600 border-slate-300/50',
    };
  }

  const daysLeft = Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysLeft < 0) {
    return {
      label: 'Expired',
      className: 'bg-red-500/15 text-red-600 border-red-400/45',
    };
  }

  if (daysLeft < 90) {
    return {
      label: `${daysLeft} Days Left`,
      className: 'bg-orange-500/15 text-orange-600 border-orange-400/45',
    };
  }

  return {
    label: 'Valid',
    className: 'bg-emerald-500/15 text-emerald-600 border-emerald-400/45',
  };
};

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'AR';

export default function Profile() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [profile, setProfile] = useState<CompanyProfileData>(() =>
    loadCompanyProfile()
  );
  const [editingField, setEditingField] =
    useState<keyof CompanyProfileData | null>(null);
  const [draftValue, setDraftValue] = useState('');
  const [toast, setToast] = useState('');

  const crBadge = useMemo(() => getCrBadge(profile.crExpiry), [profile.crExpiry]);

  useEffect(() => {
    saveCompanyProfile(profile);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 1800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const showToast = (message: string) => setToast(message);

  const startEdit = (field: keyof CompanyProfileData) => {
    setEditingField(field);
    setDraftValue(profile[field]);
  };

  const cancelEdit = () => {
    setEditingField(null);
    setDraftValue('');
  };

  const saveField = (field: keyof CompanyProfileData) => {
    const nextProfile = {
      ...profile,
      [field]: draftValue.trim(),
    };
    setProfile(nextProfile);
    saveCompanyProfile(nextProfile);
    setEditingField(null);
    setDraftValue('');
    showToast('Saved successfully');
  };

  const copyValue = async (value: string) => {
    await navigator.clipboard.writeText(value);
    showToast('Copied to clipboard');
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const logo = String(reader.result || '');
      const nextProfile = { ...profile, logo };
      setProfile(nextProfile);
      saveCompanyProfile(nextProfile);
      showToast('Logo updated');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const fieldProps = {
    editingField,
    draftValue,
    setDraftValue,
    onEdit: startEdit,
    onSave: saveField,
    onCancel: cancelEdit,
    onCopy: copyValue,
  };

  return (
    <div className="ars-page min-h-full overflow-auto p-3 md:p-4">
      <div className="mx-auto max-w-7xl space-y-3">
        <section className="ars-list-card relative overflow-hidden p-3 md:p-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_8%,rgba(16,185,129,0.16),transparent_32%),radial-gradient(circle_at_88%_10%,rgba(14,165,233,0.11),transparent_28%)]" />
          <div className="relative grid gap-4 lg:grid-cols-[180px_1fr_auto] lg:items-center">
            <div className="flex justify-center lg:justify-start">
              <div className="relative">
                <div className="ars-avatar-ring flex h-32 w-32 items-center justify-center overflow-hidden rounded-[34px] border-white/60 bg-white p-3 text-4xl font-black text-emerald-700">
                  {profile.logo ? (
                    <img
                      src={profile.logo}
                      alt={profile.englishName}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    getInitials(profile.englishName)
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -left-2 rounded-2xl border border-white/50 bg-emerald-500 p-2.5 text-white shadow-xl transition hover:scale-105"
                  title="Upload company logo"
                >
                  <Camera size={16} />
                </button>
                <span className="absolute -right-2 -top-2 rounded-2xl border border-emerald-200 bg-slate-950 p-2 text-emerald-300 shadow-xl">
                  <BadgeCheck size={16} />
                </span>
              </div>
            </div>

            <div className="min-w-0 space-y-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-emerald-500">
                  Company Command Card
                </p>
                <EditableValue
                  field="englishName"
                  label="English Company Name"
                  value={profile.englishName}
                  className="mt-1 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 md:text-4xl"
                  {...fieldProps}
                />
              </div>

              <div dir="rtl" className="rounded-2xl border border-white/45 bg-white/35 p-3 backdrop-blur dark:border-white/10 dark:bg-white/5">
                <EditableValue
                  rtl
                  field="arabicName"
                  label="اسم الشركة بالعربية"
                  value={profile.arabicName}
                  className="text-lg font-black leading-snug text-slate-900 dark:text-slate-100 md:text-2xl"
                  {...fieldProps}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <StatusBadge icon={<ShieldCheck size={13} />} label="Active 3PL" />
                <StatusBadge icon={<BadgeCheck size={13} />} label="Verified" />
                <StatusBadge
                  icon={<CalendarClock size={13} />}
                  label={crBadge.label}
                  className={crBadge.className}
                />
              </div>
            </div>

            <div className="grid min-w-[210px] gap-2 sm:grid-cols-3 lg:grid-cols-1">
              <MiniMetric label="Established" value={profile.establishedYear} />
              <MiniMetric label="CR Expiry" value={profile.crExpiry} />
              <MiniMetric label="VAT Status" value="Registered" />
            </div>
          </div>
        </section>

        <div className="grid gap-3 lg:grid-cols-[0.82fr_1.18fr]">
          <InfoPanel
            className="order-2"
            icon={<Sparkles size={16} />}
            eyebrow="Arabic Identity"
            title="Arabic Business Profile"
            dir="rtl"
          >
            <EditableRow
              rtl
              field="arabicName"
              label="اسم الشركة"
              value={profile.arabicName}
              {...fieldProps}
            />
            <EditableRow
              rtl
              field="establishedYear"
              label="سنة التأسيس"
              value={profile.establishedYear}
              type="number"
              {...fieldProps}
            />
          </InfoPanel>

          <InfoPanel
            className="order-3"
            icon={<Building2 size={16} />}
            eyebrow="Registration"
            title="Compliance Records"
          >
            <div className="grid gap-2 md:grid-cols-3">
              <EditableRow
                field="crNumber"
                label="CR Number"
                value={profile.crNumber}
                {...fieldProps}
              />
              <EditableRow
                field="crExpiry"
                label="CR Expiry"
                value={profile.crExpiry}
                type="date"
                {...fieldProps}
              />
              <EditableRow
                field="vatId"
                label="VAT ID"
                value={profile.vatId}
                {...fieldProps}
              />
            </div>
          </InfoPanel>

          <InfoPanel
            className="order-4 lg:col-span-2"
            icon={<Phone size={16} />}
            eyebrow="Contact"
            title="Communication Channels"
          >
            <div className="grid gap-2 md:grid-cols-3">
              <EditableRow
                field="phone"
                label="Phone Number"
                value={profile.phone}
                icon={<Phone size={13} />}
                {...fieldProps}
              />
              <EditableRow
                field="email"
                label="Email"
                value={profile.email}
                type="email"
                icon={<Mail size={13} />}
                {...fieldProps}
              />
              <EditableRow
                field="website"
                label="Website"
                value={profile.website}
                icon={<Globe2 size={13} />}
                {...fieldProps}
              />
            </div>
          </InfoPanel>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleLogoUpload}
        className="hidden"
      />

      {toast && (
        <div className="fixed inset-x-0 bottom-5 z-[80] flex justify-center px-4">
          <div className="animate-in slide-in-from-bottom-4 fade-in rounded-full border border-emerald-300/30 bg-slate-950/92 px-5 py-3 text-sm font-black text-white shadow-[0_18px_60px_-28px_rgba(16,185,129,0.8)] backdrop-blur">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoPanel({
  children,
  className = '',
  dir,
  icon,
  eyebrow,
  title,
}: {
  children: ReactNode;
  className?: string;
  dir?: 'rtl' | 'ltr';
  icon: ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <section dir={dir} className={`ars-list-card p-3 ${className}`}>
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-emerald-300 shadow-lg">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-500">
            {eyebrow}
          </p>
          <h2 className="text-base font-black leading-tight text-slate-900 dark:text-slate-100">
            {title}
          </h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/45 bg-white/35 p-3 text-center shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black text-slate-900 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}

function EditableValue({
  label,
  field,
  value,
  editingField,
  draftValue,
  setDraftValue,
  onEdit,
  onSave,
  onCancel,
  onCopy,
  type = 'text',
  rtl = false,
  className,
}: EditableProps & { className?: string }) {
  return (
    <EditableShell
      label={label}
      field={field}
      value={value}
      editingField={editingField}
      draftValue={draftValue}
      setDraftValue={setDraftValue}
      onEdit={onEdit}
      onSave={onSave}
      onCancel={onCancel}
      onCopy={onCopy}
      type={type}
      rtl={rtl}
      valueClassName={className}
      bare
    />
  );
}

function EditableRow(props: EditableProps & { icon?: ReactNode }) {
  return (
    <EditableShell
      {...props}
      valueClassName="text-sm font-black leading-snug text-slate-900 dark:text-slate-100"
    />
  );
}

interface EditableProps {
  label: string;
  field: keyof CompanyProfileData;
  value: string;
  editingField: keyof CompanyProfileData | null;
  draftValue: string;
  setDraftValue: (value: string) => void;
  onEdit: (field: keyof CompanyProfileData) => void;
  onSave: (field: keyof CompanyProfileData) => void;
  onCancel: () => void;
  onCopy: (value: string) => void;
  type?: string;
  rtl?: boolean;
  icon?: ReactNode;
}

function EditableShell({
  label,
  field,
  value,
  editingField,
  draftValue,
  setDraftValue,
  onEdit,
  onSave,
  onCancel,
  onCopy,
  type = 'text',
  rtl = false,
  icon,
  valueClassName,
  bare = false,
}: EditableProps & { valueClassName?: string; bare?: boolean }) {
  const isEditing = editingField === field;

  const content = (
    <>
      <p className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        {icon}
        {label}
      </p>

      {isEditing ? (
        <div className="flex flex-wrap items-center gap-2">
          <input
            autoFocus
            type={type}
            value={draftValue}
            onChange={(event) => setDraftValue(event.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-emerald-200 bg-white/80 px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-emerald-200 dark:bg-slate-950/80 dark:text-slate-100"
          />
          <button
            onClick={() => onSave(field)}
            className="rounded-xl bg-emerald-500 p-2 text-white shadow-sm"
            title="Save"
          >
            <Check size={15} />
          </button>
          <button
            onClick={onCancel}
            className="rounded-xl bg-slate-200 p-2 text-slate-700"
            title="Cancel"
          >
            <X size={15} />
          </button>
        </div>
      ) : (
        <div className={`relative min-h-8 ${rtl ? 'text-right' : 'text-left'}`}>
          <button
            onClick={() => onEdit(field)}
            className={`block w-full min-w-0 whitespace-normal break-words ${valueClassName} ${
              rtl ? 'pl-16 text-right' : 'pr-16 text-left'
            }`}
          >
            {value || '-'}
          </button>
          <InlineActions
            rtl={rtl}
            onEdit={() => onEdit(field)}
            onCopy={() => onCopy(value)}
          />
        </div>
      )}
    </>
  );

  if (bare) return <div className="group">{content}</div>;

  return (
    <div className="group rounded-2xl border border-slate-200/60 bg-white/35 p-2.5 shadow-sm backdrop-blur transition hover:border-emerald-300/45 hover:bg-white/50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
      {content}
    </div>
  );
}

function InlineActions({
  rtl = false,
  onEdit,
  onCopy,
}: {
  rtl?: boolean;
  onEdit: () => void;
  onCopy: () => void;
}) {
  return (
    <span
      className={`absolute top-0 flex items-center gap-1 opacity-100 transition md:opacity-0 md:group-hover:opacity-100 ${
        rtl ? 'left-0' : 'right-0'
      }`}
    >
      <button
        onClick={onEdit}
        className="rounded-lg border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-700"
        title="Edit"
      >
        <Edit3 size={13} />
      </button>
      <button
        onClick={onCopy}
        className="rounded-lg border border-slate-200 bg-slate-50 p-1.5 text-slate-600"
        title="Copy"
      >
        <Copy size={13} />
      </button>
    </span>
  );
}

function StatusBadge({
  icon,
  label,
  className = 'bg-emerald-500/15 text-emerald-600 border-emerald-400/45',
}: {
  icon: ReactNode;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black ${className}`}
    >
      {icon}
      {label}
    </span>
  );
}
