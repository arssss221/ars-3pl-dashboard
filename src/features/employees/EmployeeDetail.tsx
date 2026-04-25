// src/features/employees/EmployeeDetail.tsx
import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Phone,
  MessageCircle,
  Mail,
  Edit2,
  Copy,
  Check,
  ChevronDown,
  Image,
  FileText,
  Download,
  AlertTriangle,
  X,
} from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import {
  PLACEHOLDER_PDF_URL,
  buildPlaceholderImage,
  employeeSeeds,
  getEmployeeSeedById,
  getSelfieUrl,
  type EmployeeSeed,
} from './employeeData';

// Helpers
const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
};

const calculateAge = (dob: string) => {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const getDateDiffParts = (fromInput: Date, toInput: Date) => {
  const from = new Date(fromInput);
  const to = new Date(toInput);

  from.setHours(0, 0, 0, 0);
  to.setHours(0, 0, 0, 0);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    return null;
  }

  let cursor = new Date(from);
  let years = 0;
  let months = 0;

  while (true) {
    const nextYear = new Date(cursor);
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    if (nextYear <= to) {
      cursor = nextYear;
      years += 1;
    } else {
      break;
    }
  }

  while (true) {
    const nextMonth = new Date(cursor);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    if (nextMonth <= to) {
      cursor = nextMonth;
      months += 1;
    } else {
      break;
    }
  }

  const dayMs = 24 * 60 * 60 * 1000;
  const days = Math.floor((to.getTime() - cursor.getTime()) / dayMs);

  return { years, months, days };
};

const formatDurationParts = (
  parts: { years: number; months: number; days: number },
  suffix?: string
) => {
  const segments: string[] = [];
  if (parts.years > 0) {
    segments.push(`${parts.years} year${parts.years === 1 ? '' : 's'}`);
  }
  if (parts.months > 0) {
    segments.push(`${parts.months} month${parts.months === 1 ? '' : 's'}`);
  }
  if (parts.days > 0 || segments.length === 0) {
    segments.push(`${parts.days} day${parts.days === 1 ? '' : 's'}`);
  }
  return suffix ? `${segments.join(' ')} ${suffix}` : segments.join(' ');
};

const getElapsedDurationText = (dateStr: string) => {
  if (!dateStr) return '—';
  const fromDate = new Date(dateStr);
  if (Number.isNaN(fromDate.getTime())) return '—';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  fromDate.setHours(0, 0, 0, 0);

  if (fromDate > today) return '0 days';
  const parts = getDateDiffParts(fromDate, today);
  if (!parts) return '—';
  return formatDurationParts(parts);
};

const getIqamaRemainingText = (expiryDate: string) => {
  if (!expiryDate) return '—';

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const targetDate = new Date(expiryDate);
  targetDate.setHours(0, 0, 0, 0);

  if (Number.isNaN(targetDate.getTime())) return '—';

  const isExpired = targetDate < startOfToday;
  const from = isExpired ? targetDate : startOfToday;
  const to = isExpired ? startOfToday : targetDate;
  const parts = getDateDiffParts(from, to);
  if (!parts) return '—';

  return formatDurationParts(parts, isExpired ? 'ago' : 'left');
};

const getDaysUntil = (targetDate: string) => {
  if (!targetDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  if (Number.isNaN(target.getTime())) return null;
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.floor((target.getTime() - today.getTime()) / dayMs);
};

type WarningLevel = 'none' | 'warning' | 'danger';

const getIqamaWarning = (expiryDate: string) => {
  const days = getDaysUntil(expiryDate);
  if (days === null) return { level: 'none' as WarningLevel, text: '' };
  if (days < 0) {
    return {
      level: 'danger' as WarningLevel,
      text: `Iqama expired ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`,
    };
  }
  if (days < 7) {
    return {
      level: 'warning' as WarningLevel,
      text: `Iqama expires in ${days} day${days === 1 ? '' : 's'}`,
    };
  }
  return { level: 'none' as WarningLevel, text: '' };
};

const getPassportWarning = (expiryDate: string) => {
  const days = getDaysUntil(expiryDate);
  if (days === null) return { level: 'none' as WarningLevel, text: '' };
  if (days < 0) {
    return {
      level: 'danger' as WarningLevel,
      text: `Passport expired ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago`,
    };
  }
  if (days < 30) {
    return {
      level: 'danger' as WarningLevel,
      text: `Passport expires in ${days} day${days === 1 ? '' : 's'} (< 1 month)`,
    };
  }
  if (days < 60) {
    return {
      level: 'warning' as WarningLevel,
      text: `Passport expires in ${days} day${days === 1 ? '' : 's'} (< 2 months)`,
    };
  }
  return { level: 'none' as WarningLevel, text: '' };
};

type DropdownField =
  | 'nationality'
  | 'accomodation'
  | 'sponsor'
  | 'branch'
  | 'occupationVisa'
  | 'bank';

const dropdownFields: DropdownField[] = [
  'nationality',
  'accomodation',
  'sponsor',
  'branch',
  'occupationVisa',
  'bank',
];

type AttachmentKind = 'image' | 'pdf';
type BaseAttachmentKey =
  | 'selfie'
  | 'iqama'
  | 'license'
  | 'passport'
  | 'medicalInfo'
  | 'driverCard'
  | 'ajeerContract';

interface AttachmentConfig {
  key: BaseAttachmentKey;
  label: string;
  type: AttachmentKind;
}

const attachmentConfigs: AttachmentConfig[] = [
  { key: 'selfie', label: 'Selfie', type: 'image' },
  { key: 'iqama', label: 'Iqama', type: 'image' },
  { key: 'license', label: 'License', type: 'image' },
  { key: 'passport', label: 'Passport', type: 'image' },
  { key: 'medicalInfo', label: 'Medical Info', type: 'pdf' },
  { key: 'driverCard', label: 'Driver Card', type: 'pdf' },
  { key: 'ajeerContract', label: 'Ajeer Contract', type: 'pdf' },
];

interface BankAccount {
  id: string;
  bank: string;
  ibanNo: string;
}

interface ExtraDocument {
  id: string;
  title: string;
  type: AttachmentKind;
  url: string;
}

interface MoreInfoItem {
  id: string;
  title: string;
  text: string;
}

const createId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const defaultDropdownValues: Record<DropdownField, string[]> = {
  nationality: ['Bangladeshi', 'Indian', 'Pakistani', 'Nepali'],
  accomodation: [
    'Company Housing, Uttara',
    'Company Housing, Gulshan',
    'Self Accommodation',
  ],
  sponsor: ['ARS Logistics Manager', 'ARS Group', 'Logistics Partner'],
  branch: ['Dhaka Main', 'Chittagong', 'Sylhet'],
  occupationVisa: [
    'Logistics Manager',
    'Driver',
    'Operations Manager',
    'HR Executive',
  ],
  bank: [
    'Islami Bank Bangladesh Ltd.',
    'Dutch-Bangla Bank',
    'BRAC Bank',
    'City Bank',
  ],
};

const isDropdownField = (field: string): field is DropdownField =>
  dropdownFields.includes(field as DropdownField);

const buildAttachmentStateFromSeed = (seed: EmployeeSeed) => ({
  selfie: getSelfieUrl(seed),
  iqama: seed.documents.iqama
    ? buildPlaceholderImage('Iqama', { bg: '#e0f2fe', fg: '#0c4a6e' })
    : null,
  license: seed.documents.license
    ? buildPlaceholderImage('License', { bg: '#f5f3ff', fg: '#5b21b6' })
    : null,
  passport: seed.documents.passport
    ? buildPlaceholderImage('Passport', { bg: '#fff7ed', fg: '#9a3412' })
    : null,
  medicalInfo: seed.documents.medicalInfo ? PLACEHOLDER_PDF_URL : null,
  driverCard: seed.documents.driverCard ? PLACEHOLDER_PDF_URL : null,
  ajeerContract: seed.documents.ajeerContract ? PLACEHOLDER_PDF_URL : null,
});

const createEmployeeStateFromSeed = (seed: EmployeeSeed) => ({
  id: seed.id,
  branch: seed.branch,
  status: seed.status,
  idNumber: seed.idNumber,
  nickName: seed.nickName,
  arabicName: seed.arabicName,
  fullName: seed.fullName,
  phoneNo: seed.phoneNo,
  phoneNo2: seed.phoneNo2,
  email: seed.email,
  iqamaNumber: seed.iqamaNumber,
  iqamaExpiry: seed.iqamaExpiry,
  dateOfBirth: seed.dateOfBirth,
  passportNo: seed.passportNo,
  passportExpiry: seed.passportExpiry,
  healthInsuranceName: seed.healthInsuranceName,
  healthInsuranceExpiry: seed.healthInsuranceExpiry,
  accomodation: seed.accomodation,
  entryDate: seed.entryDate,
  daysInCompany: 0,
  sponsor: seed.sponsor,
  agreement: seed.agreement,
  commitment: seed.commitment,
  transferCount: seed.transferCount,
  nationality: seed.nationality,
  occupationVisa: seed.occupationVisa,
  vehicleNumber: seed.vehicleNumber,
  licenseNumber: seed.documents.license ? 'AVAILABLE' : '',
  licenseExpiry: '',
  attachments: buildAttachmentStateFromSeed(seed),
});

const fallbackEmployeeSeed = employeeSeeds[0];

const createBankAccountsFromSeed = (seed: EmployeeSeed): BankAccount[] =>
  seed.bankAccounts.map((account) => ({
    id: createId('bank'),
    bank: account.bank,
    ibanNo: account.ibanNo,
  }));

const setHeaderTitle = (title: string) => {
  window.dispatchEvent(new CustomEvent('setHeaderTitle', { detail: title }));
};

const statusOptions = ['Working', 'Waiting', 'Ready', 'Leave'];
const statusColors: Record<string, string> = {
  Working: 'bg-emerald-100 text-emerald-700',
  Waiting: 'bg-yellow-100 text-yellow-700',
  Ready: 'bg-blue-100 text-blue-700',
  Leave: 'bg-red-100 text-red-700',
};

const statusHeaderThemes: Record<
  string,
  { gradient: string; softText: string }
> = {
  Working: {
    gradient: 'from-emerald-600 to-emerald-700',
    softText: 'text-emerald-100',
  },
  Waiting: {
    gradient: 'from-yellow-500 to-amber-600',
    softText: 'text-yellow-100',
  },
  Ready: {
    gradient: 'from-blue-600 to-blue-700',
    softText: 'text-blue-100',
  },
  Leave: {
    gradient: 'from-red-600 to-rose-700',
    softText: 'text-red-100',
  },
};

// ------------------------ Sub-components ------------------------

interface EditableFieldProps {
  label: string;
  field: string;
  value: string;
  isCopyable?: boolean;
  isDate?: boolean;
  maxLength?: number;
  dropdownOptions?: string[];
  editField: string | null;
  editValue: string;
  copiedField: string | null;
  onEdit: (field: string, value: string) => void;
  onSave: (field: string, overrideValue?: string) => void;
  onCancel: () => void;
  onCopy: (text: string, field: string) => void;
  onEditValueChange: (val: string) => void;
}

const EditableField = ({
  label,
  field,
  value,
  isCopyable = false,
  isDate = false,
  maxLength,
  dropdownOptions,
  editField,
  editValue,
  copiedField,
  onEdit,
  onSave,
  onCancel,
  onCopy,
  onEditValueChange,
}: EditableFieldProps) => {
  const displayValue = isDate ? formatDate(value) : value;
  const isDropdownEditor = Boolean(dropdownOptions);
  const trimmedInput = editValue.trim();
  const filteredOptions = isDropdownEditor
    ? dropdownOptions!.filter((option) =>
        option.toLowerCase().includes(editValue.toLowerCase())
      )
    : [];

  return (
    <div className="group relative">
      <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-0.5">
        {label}
      </label>
      <div className="flex items-center justify-between gap-2 p-1.5 -m-1.5 rounded-lg hover:bg-slate-50 transition-colors">
        {editField === field ? (
          <div className="flex-1 space-y-1">
            <div className="flex gap-1">
              <input
                type="text"
                value={editValue}
                onChange={(e) => onEditValueChange(e.target.value)}
                maxLength={maxLength}
                placeholder={
                  isDropdownEditor ? `Type to search or add ${label}` : undefined
                }
                className="flex-1 px-2 py-1 text-sm border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-200 outline-none"
                autoFocus
              />
              {!isDropdownEditor && (
                <button
                  onClick={() => onSave(field)}
                  className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-xs"
                >
                  Save
                </button>
              )}
              <button
                onClick={onCancel}
                className="px-2 py-1 bg-slate-200 rounded-lg text-xs"
              >
                Cancel
              </button>
            </div>

            {isDropdownEditor && (
              <div className="border border-slate-200 rounded-lg bg-white overflow-hidden max-h-40 overflow-y-auto">
                <button
                  onClick={() => onSave(field, trimmedInput)}
                  disabled={!trimmedInput}
                  className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:text-slate-400 disabled:hover:bg-white"
                >
                  [Add {trimmedInput || label}]
                </button>
                {filteredOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => onSave(field, option)}
                    className="w-full text-left px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 border-t border-slate-100"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            <span className="text-sm text-slate-700 font-medium">
              {displayValue || '—'}
            </span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {isCopyable && displayValue !== '—' && (
                <button
                  onClick={() => onCopy(value, field)}
                  className="p-1 hover:bg-slate-200 rounded"
                  title="Copy"
                >
                  {copiedField === field ? (
                    <Check size={12} className="text-emerald-500" />
                  ) : (
                    <Copy size={12} className="text-slate-400" />
                  )}
                </button>
              )}
              <button
                onClick={() => onEdit(field, value)}
                className="p-1 hover:bg-slate-200 rounded"
                title="Edit"
              >
                <Edit2 size={12} className="text-slate-400" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

interface PhoneActionsProps {
  field: string;
  label: string;
  phone: string;
  employeeName: string;
  mutedTextClass: string;
  editField: string | null;
  editValue: string;
  copiedField: string | null;
  onEdit: (field: string, value: string) => void;
  onSave: (field: string, overrideValue?: string) => void;
  onCancel: () => void;
  onCopy: (text: string, field: string) => void;
  onEditValueChange: (val: string) => void;
}

const PhoneActions = ({
  field,
  label,
  phone,
  employeeName,
  mutedTextClass,
  editField,
  editValue,
  copiedField,
  onEdit,
  onSave,
  onCancel,
  onCopy,
  onEditValueChange,
}: PhoneActionsProps) => {
  const hasPhone = Boolean(phone);

  if (editField === field) {
    return (
      <div className="space-y-2 py-2 border-b border-white/15 last:border-b-0">
        <p className={`text-[10px] uppercase tracking-wider ${mutedTextClass}`}>
          {label}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            className="flex-1 min-w-[160px] px-2.5 py-1.5 rounded-lg bg-white text-sm text-slate-800 border border-emerald-200 outline-none focus:ring-2 focus:ring-emerald-200"
            autoFocus
          />
          <button
            onClick={() => onSave(field)}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-emerald-500 text-white hover:bg-emerald-400"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-white/20 text-white hover:bg-white/30"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group py-2 border-b border-white/15 last:border-b-0">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-[10px] uppercase tracking-wider ${mutedTextClass}`}>
            {label}
          </p>
          <p className="text-sm text-white font-medium truncate">
            {hasPhone ? phone : '—'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => hasPhone && (window.location.href = `tel:${phone}`)}
            className="p-1 rounded-full hover:bg-white/20 text-white disabled:opacity-40 disabled:cursor-not-allowed"
            title="Call"
            disabled={!hasPhone}
          >
            <Phone size={14} />
          </button>
          <button
            onClick={() => {
              if (!hasPhone) return;
              const clean = phone.replace(/[^0-9]/g, '');
              window.open(
                `https://wa.me/${clean}?text=Hello%20${encodeURIComponent(employeeName)}`,
                '_blank'
              );
            }}
            className="p-1 rounded-full hover:bg-white/20 text-white disabled:opacity-40 disabled:cursor-not-allowed"
            title="WhatsApp"
            disabled={!hasPhone}
          >
            <MessageCircle size={14} />
          </button>
          <button
            onClick={() => hasPhone && onCopy(phone, field)}
            className="p-1 rounded-full hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            title="Copy"
            disabled={!hasPhone}
          >
            {copiedField === field ? <Check size={14} /> : <Copy size={14} />}
          </button>
          <button
            onClick={() => onEdit(field, phone)}
            className="p-1 rounded-full hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            title="Edit"
          >
            <Edit2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

interface EmailActionsProps {
  email: string;
  mutedTextClass: string;
  editField: string | null;
  editValue: string;
  copiedField: string | null;
  onEdit: (field: string, value: string) => void;
  onSave: (field: string, overrideValue?: string) => void;
  onCancel: () => void;
  onCopy: (text: string, field: string) => void;
  onEditValueChange: (val: string) => void;
}

const EmailActions = ({
  email,
  mutedTextClass,
  editField,
  editValue,
  copiedField,
  onEdit,
  onSave,
  onCancel,
  onCopy,
  onEditValueChange,
}: EmailActionsProps) => {
  const hasEmail = Boolean(email);

  if (editField === 'email') {
    return (
      <div className="space-y-2 py-2 border-b border-white/15 last:border-b-0">
        <p className={`text-[10px] uppercase tracking-wider ${mutedTextClass}`}>
          Email Address
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="email"
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            className="flex-1 min-w-[180px] px-2.5 py-1.5 rounded-lg bg-white text-sm text-slate-800 border border-emerald-200 outline-none focus:ring-2 focus:ring-emerald-200"
            autoFocus
          />
          <button
            onClick={() => onSave('email')}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-emerald-500 text-white hover:bg-emerald-400"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-white/20 text-white hover:bg-white/30"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group py-2 border-b border-white/15 last:border-b-0">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className={`text-[10px] uppercase tracking-wider ${mutedTextClass}`}>
            Email Address
          </p>
          <p className="text-sm text-white font-medium break-all">
            {hasEmail ? email : '—'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => hasEmail && (window.location.href = `mailto:${email}`)}
            className="p-1 rounded-full hover:bg-white/20 text-white disabled:opacity-40 disabled:cursor-not-allowed"
            title="Send Mail"
            disabled={!hasEmail}
          >
            <Mail size={14} />
          </button>
          <button
            onClick={() => hasEmail && onCopy(email, 'email')}
            className="p-1 rounded-full hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            title="Copy"
            disabled={!hasEmail}
          >
            {copiedField === 'email' ? <Check size={14} /> : <Copy size={14} />}
          </button>
          <button
            onClick={() => onEdit('email', email)}
            className="p-1 rounded-full hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            title="Edit"
          >
            <Edit2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
};

interface WarningNoteProps {
  level: WarningLevel;
  text: string;
}

const WarningNote = ({ level, text }: WarningNoteProps) => {
  if (level === 'none' || !text) return null;

  const colorClass =
    level === 'danger'
      ? 'text-red-100 bg-red-500/25 border-red-300/40'
      : 'text-yellow-100 bg-yellow-500/25 border-yellow-300/40';

  return (
    <div
      className={`mt-2 inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md border ${colorClass}`}
    >
      <AlertTriangle size={12} />
      <span>{text}</span>
    </div>
  );
};

interface StatusDropdownProps {
  current: string;
  onChange: (status: string) => void;
}

const StatusDropdown = ({ current, onChange }: StatusDropdownProps) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${statusColors[current]} bg-opacity-90`}
      >
        {current} <ChevronDown size={10} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-10 min-w-[110px]">
          {statusOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className="w-full px-3 py-1.5 text-xs text-left hover:bg-slate-50"
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface AttachmentGridProps {
  attachments: Record<BaseAttachmentKey, string | null>;
  configs: AttachmentConfig[];
  onEdit: (item: AttachmentConfig) => void;
  onDownload: (item: AttachmentConfig) => void;
  onPreview: (item: AttachmentConfig) => void;
}

const AttachmentGrid = ({
  attachments,
  configs,
  onEdit,
  onDownload,
  onPreview,
}: AttachmentGridProps) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
    {configs.map((item) => {
      const url = attachments[item.key];
      const hasFile = Boolean(url);
      const isImage = item.type === 'image';

      return (
      <div
        key={item.key}
        onClick={() => onPreview(item)}
        className="border border-slate-200 rounded-xl p-3 text-center bg-slate-50 hover:shadow-md transition-all group cursor-pointer"
      >
        <div className="relative">
          {hasFile && isImage ? (
            <img
              src={url ?? undefined}
              alt={item.label}
              className="h-16 w-full object-cover rounded-lg mb-2"
            />
          ) : hasFile ? (
            <div className="h-16 w-full bg-red-50 border border-red-100 rounded-lg mb-2 flex flex-col items-center justify-center">
              <FileText size={20} className="text-red-500" />
              <span className="text-[9px] font-semibold text-red-500 mt-1">
                PDF
              </span>
            </div>
          ) : (
            <div className="h-16 w-full bg-slate-200 rounded-lg mb-2 flex items-center justify-center">
              {isImage ? (
                <Image size={24} className="text-slate-400" />
              ) : (
                <FileText size={22} className="text-slate-400" />
              )}
            </div>
          )}
          <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
              className="p-1 bg-white rounded-full shadow-md hover:bg-slate-100"
              title="Edit"
            >
              <Edit2 size={12} className="text-slate-600" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownload(item);
              }}
              className="p-1 bg-white rounded-full shadow-md hover:bg-slate-100"
              title="Download"
            >
              <Download size={12} className="text-slate-600" />
            </button>
          </div>
        </div>
        <p className="text-[10px] font-medium text-slate-500 mt-1 capitalize">
          {item.label}
        </p>
      </div>
      );
    })}
  </div>
);

// ------------------------ Main Component ------------------------

export default function EmployeeDetail() {
  const { id } = useParams();
  const selectedSeed = useMemo(() => {
    const parsedId = Number(id);
    if (!Number.isFinite(parsedId)) return fallbackEmployeeSeed;
    return getEmployeeSeedById(parsedId) ?? fallbackEmployeeSeed;
  }, [id]);

  const [emp, setEmp] = useState(() => createEmployeeStateFromSeed(selectedSeed));
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [dropdownOptions, setDropdownOptions] =
    useState<Record<DropdownField, string[]>>(defaultDropdownValues);
  const [selectedAttachment, setSelectedAttachment] =
    useState<AttachmentConfig | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() =>
    createBankAccountsFromSeed(selectedSeed)
  );
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [bankForm, setBankForm] = useState({
    bank: '',
    bankInput: '',
    ibanNo: '',
  });
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const [extraInfoItems, setExtraInfoItems] = useState<MoreInfoItem[]>([]);
  const [isMoreInfoModalOpen, setIsMoreInfoModalOpen] = useState(false);
  const [moreInfoForm, setMoreInfoForm] = useState({
    title: '',
    text: '',
  });
  const [isMoreDocumentModalOpen, setIsMoreDocumentModalOpen] = useState(false);
  const [newDocumentType, setNewDocumentType] = useState<AttachmentKind | ''>(
    ''
  );
  const [newDocumentTitle, setNewDocumentTitle] = useState('');
  const [newDocumentFile, setNewDocumentFile] = useState<File | null>(null);
  const [previewAttachment, setPreviewAttachment] = useState<{
    title: string;
    url: string;
    type: AttachmentKind;
  } | null>(null);
  const [moreDocuments, setMoreDocuments] = useState<ExtraDocument[]>([]);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const moreDocumentUploadInputRef = useRef<HTMLInputElement>(null);
  const uploadedObjectUrls = useRef<string[]>([]);

  useEffect(() => {
    setHeaderTitle(`${emp.idNumber}. Details of ${emp.nickName}`);
  }, [emp.idNumber, emp.nickName]);

  useEffect(() => {
    setEmp(createEmployeeStateFromSeed(selectedSeed));
    setBankAccounts(createBankAccountsFromSeed(selectedSeed));
    setEditField(null);
    setEditValue('');
    setCopiedField(null);
    setSelectedAttachment(null);
    setPreviewAttachment(null);
    setMoreDocuments([]);
    setExtraInfoItems([]);
    setIsBankModalOpen(false);
    setIsBankDropdownOpen(false);
    setBankForm({ bank: '', bankInput: '', ibanNo: '' });
    setIsMoreInfoModalOpen(false);
    setMoreInfoForm({ title: '', text: '' });
    setIsMoreDocumentModalOpen(false);
    setNewDocumentType('');
    setNewDocumentTitle('');
    setNewDocumentFile(null);
  }, [selectedSeed]);

  useEffect(() => {
    return () => {
      uploadedObjectUrls.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadDropdownValues = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'employees'));
        if (!isMounted || snapshot.empty) return;

        const uniqueValues: Record<DropdownField, Set<string>> = {
          nationality: new Set(dropdownOptions.nationality),
          accomodation: new Set(dropdownOptions.accomodation),
          sponsor: new Set(dropdownOptions.sponsor),
          branch: new Set(dropdownOptions.branch),
          occupationVisa: new Set(dropdownOptions.occupationVisa),
          bank: new Set(dropdownOptions.bank),
        };

        snapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data() as Record<string, unknown>;
          dropdownFields.forEach((field) => {
            const value = data[field];
            if (typeof value === 'string' && value.trim()) {
              uniqueValues[field].add(value.trim());
            }
          });
        });

        setDropdownOptions({
          nationality: Array.from(uniqueValues.nationality),
          accomodation: Array.from(uniqueValues.accomodation),
          sponsor: Array.from(uniqueValues.sponsor),
          branch: Array.from(uniqueValues.branch),
          occupationVisa: Array.from(uniqueValues.occupationVisa),
          bank: Array.from(uniqueValues.bank),
        });
      } catch (error) {
        console.warn('Failed to load dropdown values from database:', error);
      }
    };

    loadDropdownValues();

    return () => {
      isMounted = false;
    };
  }, []);

  const getFilteredDropdownOptions = (options: string[], query: string) => {
    const seen = new Set<string>();
    const normalizedQuery = query.toLowerCase();

    return options.filter((option) => {
      const normalizedOption = option.toLowerCase();
      if (seen.has(normalizedOption)) return false;
      seen.add(normalizedOption);
      return normalizedOption.includes(normalizedQuery);
    });
  };

  const handleEdit = (field: string, value: string) => {
    setEditField(field);
    setEditValue(isDropdownField(field) ? '' : value);
  };

  const handleSave = (field: string, overrideValue?: string) => {
    const nextValue = (overrideValue ?? editValue).trim();
    if (!nextValue) {
      setEditField(null);
      return;
    }

    setEmp({ ...emp, [field]: nextValue });

    if (isDropdownField(field)) {
      setDropdownOptions((prev) => {
        if (prev[field].includes(nextValue)) return prev;
        return { ...prev, [field]: [...prev[field], nextValue] };
      });
    }

    setEditField(null);
  };

  const handleCancel = () => setEditField(null);

  const handleCopy = async (text: string, field: string) => {
    if (!text) return;

    const copyWithExecCommand = () => {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.top = '0';
        textarea.style.left = '-9999px';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);
        const copied =
          typeof document.execCommand === 'function' &&
          document.execCommand('copy');
        document.body.removeChild(textarea);
        return copied;
      } catch {
        return false;
      }
    };

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text);
      } else if (!copyWithExecCommand()) {
        throw new Error('Clipboard API unavailable');
      }
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      if (copyWithExecCommand()) {
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
        return;
      }
      console.error('Copy failed:', error);
      alert('Copy failed on this browser. Please copy manually.');
    }
  };

  const handleStatusChange = (status: string) => {
    setEmp({ ...emp, status });
  };

  const handleOpenBankModal = () => {
    if (bankAccounts.length >= 3) {
      alert('You can add up to 3 bank accounts only.');
      return;
    }
    setBankForm({ bank: '', bankInput: '', ibanNo: '' });
    setIsBankDropdownOpen(false);
    setIsBankModalOpen(true);
  };

  const handleSelectBankOption = (value: string) => {
    const nextValue = value.trim();
    if (!nextValue) return;
    setBankForm((prev) => ({
      ...prev,
      bank: nextValue,
      bankInput: nextValue,
    }));
    setIsBankDropdownOpen(false);
  };

  const handleSaveBankAccount = () => {
    const bankName = bankForm.bank.trim();
    const ibanNo = bankForm.ibanNo.trim();

    if (!bankName || !ibanNo) return;
    if (bankAccounts.length >= 3) {
      alert('You can add up to 3 bank accounts only.');
      return;
    }

    const normalizedIban = ibanNo.slice(0, 24);

    setBankAccounts((prev) => [
      ...prev,
      { id: createId('bank'), bank: bankName, ibanNo: normalizedIban },
    ]);

    setDropdownOptions((prev) => {
      if (prev.bank.includes(bankName)) return prev;
      return { ...prev, bank: [...prev.bank, bankName] };
    });

    setIsBankModalOpen(false);
    setBankForm({ bank: '', bankInput: '', ibanNo: '' });
    setIsBankDropdownOpen(false);
  };

  const handleOpenMoreInfoModal = () => {
    if (extraInfoItems.length >= 2) {
      alert('You can add up to 2 additional info items only.');
      return;
    }
    setMoreInfoForm({ title: '', text: '' });
    setIsMoreInfoModalOpen(true);
  };

  const handleSaveMoreInfo = () => {
    const title = moreInfoForm.title.trim();
    const text = moreInfoForm.text.trim();
    if (!title || !text) return;
    if (extraInfoItems.length >= 2) {
      alert('You can add up to 2 additional info items only.');
      return;
    }

    setExtraInfoItems((prev) => [...prev, { id: createId('info'), title, text }]);
    setIsMoreInfoModalOpen(false);
    setMoreInfoForm({ title: '', text: '' });
  };

  const handleEditAttachment = (item: AttachmentConfig) => {
    setSelectedAttachment(item);
    if (attachmentInputRef.current) {
      attachmentInputRef.current.accept =
        item.type === 'pdf' ? 'application/pdf' : 'image/*';
      attachmentInputRef.current.click();
    }
  };

  const validateFileType = (file: File, expectedType: AttachmentKind) => {
    if (expectedType === 'image') {
      return file.type.startsWith('image/');
    }
    return file.type === 'application/pdf';
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedAttachment) return;
    if (!validateFileType(file, selectedAttachment.type)) {
      alert(
        selectedAttachment.type === 'pdf'
          ? 'Please select a PDF file.'
          : 'Please select an image file.'
      );
      e.target.value = '';
      return;
    }

    const newObjectUrl = URL.createObjectURL(file);
    uploadedObjectUrls.current.push(newObjectUrl);

    setEmp((prev) => {
      const previousUrl = prev.attachments[selectedAttachment.key];
      if (previousUrl && previousUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previousUrl);
      }

      return {
        ...prev,
        attachments: {
          ...prev.attachments,
          [selectedAttachment.key]: newObjectUrl,
        },
      };
    });

    setSelectedAttachment(null);
    e.target.value = '';
  };

  const handleDownloadAttachment = (item: AttachmentConfig) => {
    const fileUrl = emp.attachments[item.key];
    if (!fileUrl) {
      alert('No attachment found for download.');
      return;
    }

    const anchor = document.createElement('a');
    anchor.href = fileUrl;
    anchor.download = `${emp.idNumber}-${item.key}`;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.click();
  };

  const handlePreviewAttachment = (
    title: string,
    type: AttachmentKind,
    url: string | null
  ) => {
    if (!url) {
      alert(`No file found for ${title}.`);
      return;
    }
    setPreviewAttachment({ title, type, url });
  };

  const handleAddMoreDocument = () => {
    if (moreDocuments.length >= 5) {
      alert('You can add up to 5 documents only.');
      return;
    }
    setNewDocumentType('');
    setNewDocumentTitle('');
    setNewDocumentFile(null);
    setIsMoreDocumentModalOpen(true);
  };

  const handleMoreDocumentFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !newDocumentType) return;
    if (!validateFileType(file, newDocumentType)) {
      alert(
        newDocumentType === 'pdf'
          ? 'Please select a PDF file.'
          : 'Please select an image file.'
      );
      e.target.value = '';
      return;
    }
    setNewDocumentFile(file);
  };

  const handlePickMoreDocumentFile = () => {
    if (!newDocumentType) {
      alert('Please select document type first.');
      return;
    }
    moreDocumentUploadInputRef.current?.click();
  };

  const handleSaveMoreDocument = () => {
    if (!newDocumentType || !newDocumentTitle.trim() || !newDocumentFile) return;
    if (moreDocuments.length >= 5) {
      alert('You can add up to 5 documents only.');
      return;
    }

    const newObjectUrl = URL.createObjectURL(newDocumentFile);
    uploadedObjectUrls.current.push(newObjectUrl);

    setMoreDocuments((prev) => [
      ...prev,
      {
        id: createId('doc'),
        title: newDocumentTitle.trim(),
        type: newDocumentType,
        url: newObjectUrl,
      },
    ]);

    setIsMoreDocumentModalOpen(false);
    setNewDocumentType('');
    setNewDocumentTitle('');
    setNewDocumentFile(null);
    if (moreDocumentUploadInputRef.current) {
      moreDocumentUploadInputRef.current.value = '';
    }
  };

  const age = calculateAge(emp.dateOfBirth);
  const dobDisplay = emp.dateOfBirth
    ? `${formatDate(emp.dateOfBirth)} (${age} years)`
    : '—';
  const iqamaRemaining = getIqamaRemainingText(emp.iqamaExpiry);
  const iqamaWarning = getIqamaWarning(emp.iqamaExpiry);
  const passportWarning = getPassportWarning(emp.passportExpiry);
  const entryDuration = getElapsedDurationText(emp.entryDate);
  const entryDateDisplay = emp.entryDate
    ? `${formatDate(emp.entryDate)} (${entryDuration})`
    : '—';
  const agreementComplete = emp.agreement === 'Complete';
  const commitmentComplete = emp.commitment === 'Complete';
  const currentHeaderTheme =
    statusHeaderThemes[emp.status] ?? statusHeaderThemes.Working;
  const designationDropdownOptions = getFilteredDropdownOptions(
    dropdownOptions.occupationVisa,
    editValue
  );
  const branchDropdownOptions = getFilteredDropdownOptions(
    dropdownOptions.branch,
    editValue
  );
  const nationalityDropdownOptions = getFilteredDropdownOptions(
    dropdownOptions.nationality,
    editValue
  );
  const accommodationDropdownOptions = getFilteredDropdownOptions(
    dropdownOptions.accomodation,
    editValue
  );
  const bankDropdownOptions = getFilteredDropdownOptions(
    dropdownOptions.bank,
    bankForm.bankInput
  );
  const insuranceComplete =
    Boolean(emp.healthInsuranceName?.trim()) &&
    Boolean(emp.healthInsuranceExpiry?.trim());
  const selectedBankName = bankForm.bank.trim();
  const canSaveBankAccount =
    Boolean(selectedBankName) &&
    Boolean(bankForm.ibanNo.trim()) &&
    bankAccounts.length < 3;
  const canSaveMoreInfo =
    Boolean(moreInfoForm.title.trim()) &&
    Boolean(moreInfoForm.text.trim()) &&
    extraInfoItems.length < 2;
  const canAddMoreDocuments = moreDocuments.length < 5;
  const canSaveMoreDocument =
    Boolean(newDocumentType) &&
    Boolean(newDocumentTitle.trim()) &&
    Boolean(newDocumentFile) &&
    moreDocuments.length < 5;
  const moreDocumentAccept =
    newDocumentType === 'pdf'
      ? 'application/pdf'
      : newDocumentType === 'image'
        ? 'image/*'
        : 'image/*,application/pdf';

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5 pb-8">
        {/* Profile Card */}
        <div
          className={`bg-gradient-to-r ${currentHeaderTheme.gradient} rounded-2xl shadow-lg overflow-hidden transition-colors duration-300`}
        >
          <div className="p-5 sm:p-6">
            <div className="flex justify-end mb-4">
              <StatusDropdown current={emp.status} onChange={handleStatusChange} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Column 1: image + name + designation + branch */}
              <div className="rounded-xl bg-white/10 border border-white/20 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    {emp.attachments.selfie ? (
                      <img
                        src={emp.attachments.selfie}
                        alt="Selfie"
                        className="h-24 w-24 rounded-full object-cover border-4 border-white/50 shadow-md"
                      />
                    ) : (
                      <div className="h-24 w-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-3xl border-4 border-white/50 shadow-md">
                        {emp.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    {editField === 'fullName' ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white text-sm text-slate-800 border border-emerald-200 outline-none focus:ring-2 focus:ring-emerald-200"
                          autoFocus
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSave('fullName')}
                            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-500 text-white hover:bg-emerald-400"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancel}
                            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white/20 text-white hover:bg-white/30"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="group rounded-lg p-1 -m-1 hover:bg-white/10 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight break-words">
                            {emp.fullName}
                          </h2>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEdit('fullName', emp.fullName)}
                              className="p-1 rounded-full hover:bg-white/20 text-white"
                              title="Edit"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleCopy(emp.fullName, 'fullName')}
                              className="p-1 rounded-full hover:bg-white/20 text-white"
                              title="Copy"
                            >
                              {copiedField === 'fullName' ? (
                                <Check size={13} />
                              ) : (
                                <Copy size={13} />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="group rounded-lg px-2 py-1.5 hover:bg-white/10 transition-colors">
                    {editField === 'occupationVisa' ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          placeholder="Type designation"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white text-sm text-slate-800 border border-emerald-200 outline-none focus:ring-2 focus:ring-emerald-200"
                          autoFocus
                        />
                        <div className="border border-white/30 rounded-lg overflow-hidden bg-white/95 max-h-40 overflow-y-auto">
                          <button
                            onClick={() => handleSave('occupationVisa', editValue)}
                            disabled={!editValue.trim()}
                            className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:text-slate-400 disabled:hover:bg-white"
                          >
                            [Add {editValue.trim() || 'designation'}]
                          </button>
                          {designationDropdownOptions.map((option) => (
                            <button
                              key={option}
                              onClick={() => handleSave('occupationVisa', option)}
                              className="w-full text-left px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 border-t border-slate-100"
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleCancel}
                            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white/20 text-white hover:bg-white/30"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p
                            className={`text-[10px] uppercase tracking-wider ${currentHeaderTheme.softText}`}
                          >
                            Designation
                          </p>
                          <p className="text-sm font-medium text-white">
                            {emp.occupationVisa}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            handleEdit('occupationVisa', emp.occupationVisa)
                          }
                          className="p-1 rounded-full hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="group rounded-lg px-2 py-1.5 hover:bg-white/10 transition-colors">
                    {editField === 'branch' ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          placeholder="Type branch"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white text-sm text-slate-800 border border-emerald-200 outline-none focus:ring-2 focus:ring-emerald-200"
                          autoFocus
                        />
                        <div className="border border-white/30 rounded-lg overflow-hidden bg-white/95 max-h-40 overflow-y-auto">
                          <button
                            onClick={() => handleSave('branch', editValue)}
                            disabled={!editValue.trim()}
                            className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:text-slate-400 disabled:hover:bg-white"
                          >
                            [Add {editValue.trim() || 'branch'}]
                          </button>
                          {branchDropdownOptions.map((option) => (
                            <button
                              key={option}
                              onClick={() => handleSave('branch', option)}
                              className="w-full text-left px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 border-t border-slate-100"
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleCancel}
                            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white/20 text-white hover:bg-white/30"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p
                            className={`text-[10px] uppercase tracking-wider ${currentHeaderTheme.softText}`}
                          >
                            Branch
                          </p>
                          <p className="text-sm font-medium text-white">
                            {emp.branch}
                          </p>
                        </div>
                        <button
                          onClick={() => handleEdit('branch', emp.branch)}
                          className="p-1 rounded-full hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Column 2: DOB + phone + email */}
              <div className="rounded-xl bg-white/10 border border-white/20 p-4">
                <div className="pb-2 border-b border-white/15">
                  <p
                    className={`text-[10px] uppercase tracking-[0.15em] ${currentHeaderTheme.softText}`}
                  >
                    Date of Birth
                  </p>
                  <p className="mt-1 text-base font-semibold text-white leading-snug">
                    {dobDisplay}
                  </p>
                </div>

                <PhoneActions
                  field="phoneNo"
                  label="Phone 1"
                  phone={emp.phoneNo}
                  employeeName={emp.fullName}
                  mutedTextClass={currentHeaderTheme.softText}
                  editField={editField}
                  editValue={editValue}
                  copiedField={copiedField}
                  onEdit={handleEdit}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  onCopy={handleCopy}
                  onEditValueChange={setEditValue}
                />
                <PhoneActions
                  field="phoneNo2"
                  label="Phone 2"
                  phone={emp.phoneNo2}
                  employeeName={emp.fullName}
                  mutedTextClass={currentHeaderTheme.softText}
                  editField={editField}
                  editValue={editValue}
                  copiedField={copiedField}
                  onEdit={handleEdit}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  onCopy={handleCopy}
                  onEditValueChange={setEditValue}
                />

                <EmailActions
                  email={emp.email}
                  mutedTextClass={currentHeaderTheme.softText}
                  editField={editField}
                  editValue={editValue}
                  copiedField={copiedField}
                  onEdit={handleEdit}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  onCopy={handleCopy}
                  onEditValueChange={setEditValue}
                />
              </div>

              {/* Column 3: Iqama + Passport + Nationality */}
              <div className="rounded-xl bg-white/10 border border-white/20 p-4">
                <div className="group py-2 border-b border-white/15">
                  <p
                    className={`text-[10px] uppercase tracking-[0.15em] ${currentHeaderTheme.softText}`}
                  >
                    Iqama Number
                  </p>
                  <div className="mt-1 flex items-start justify-between gap-2">
                    <p className="text-lg sm:text-xl font-bold text-white break-all leading-tight">
                      {emp.iqamaNumber || '—'}
                    </p>
                    <button
                      onClick={() => handleCopy(emp.iqamaNumber, 'iqamaNumber')}
                      className="p-1 rounded-full hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copy"
                    >
                      {copiedField === 'iqamaNumber' ? (
                        <Check size={14} />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="group py-2 border-b border-white/15">
                  <p
                    className={`text-[10px] uppercase tracking-[0.15em] ${currentHeaderTheme.softText}`}
                  >
                    Iqama Expiry
                  </p>
                  {editField === 'iqamaExpiry' ? (
                    <div className="mt-2 space-y-2">
                      <input
                        type="date"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white text-sm text-slate-800 border border-emerald-200 outline-none focus:ring-2 focus:ring-emerald-200"
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSave('iqamaExpiry')}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-500 text-white hover:bg-emerald-400"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white/20 text-white hover:bg-white/30"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 flex items-start justify-between gap-2">
                      <p className="text-base font-semibold text-white leading-snug">
                        {formatDate(emp.iqamaExpiry)} ({iqamaRemaining})
                      </p>
                      <button
                        onClick={() => handleEdit('iqamaExpiry', emp.iqamaExpiry)}
                        className="p-1 rounded-full hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Edit"
                      >
                        <Edit2 size={13} />
                      </button>
                    </div>
                  )}
                  <WarningNote level={iqamaWarning.level} text={iqamaWarning.text} />
                </div>

                <div className="group py-2 border-b border-white/15">
                  <p
                    className={`text-[10px] uppercase tracking-[0.15em] ${currentHeaderTheme.softText}`}
                  >
                    Passport
                  </p>
                  {editField === 'passportExpiry' ? (
                    <div className="mt-2 space-y-2">
                      <input
                        type="date"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white text-sm text-slate-800 border border-emerald-200 outline-none focus:ring-2 focus:ring-emerald-200"
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSave('passportExpiry')}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-500 text-white hover:bg-emerald-400"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white/20 text-white hover:bg-white/30"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-white leading-snug break-all">
                        {emp.passportNo || '—'} ({formatDate(emp.passportExpiry)})
                      </p>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleCopy(emp.passportNo, 'passportNo')}
                          className="p-1 rounded-full hover:bg-white/20 text-white"
                          title="Copy Passport"
                        >
                          {copiedField === 'passportNo' ? (
                            <Check size={13} />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            handleEdit('passportExpiry', emp.passportExpiry)
                          }
                          className="p-1 rounded-full hover:bg-white/20 text-white"
                          title="Edit Expiry Date"
                        >
                          <Edit2 size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                  <WarningNote
                    level={passportWarning.level}
                    text={passportWarning.text}
                  />
                </div>

                <div className="group py-2">
                  <p
                    className={`text-[10px] uppercase tracking-[0.15em] ${currentHeaderTheme.softText}`}
                  >
                    Nationality
                  </p>
                  {editField === 'nationality' ? (
                    <div className="mt-2 space-y-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="Type nationality"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white text-sm text-slate-800 border border-emerald-200 outline-none focus:ring-2 focus:ring-emerald-200"
                        autoFocus
                      />
                      <div className="border border-white/30 rounded-lg overflow-hidden bg-white/95 max-h-40 overflow-y-auto">
                        <button
                          onClick={() => handleSave('nationality', editValue)}
                          disabled={!editValue.trim()}
                          className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:text-slate-400 disabled:hover:bg-white"
                        >
                          [Add {editValue.trim() || 'nationality'}]
                        </button>
                        {nationalityDropdownOptions.map((option) => (
                          <button
                            key={option}
                            onClick={() => handleSave('nationality', option)}
                            className="w-full text-left px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 border-t border-slate-100"
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCancel}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white/20 text-white hover:bg-white/30"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-white">
                        {emp.nationality || '—'}
                      </p>
                      <button
                        onClick={() => handleEdit('nationality', emp.nationality)}
                        className="p-1 rounded-full hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Edit"
                      >
                        <Edit2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Employee Details */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-700">Employee Details</h3>
            <button
              onClick={handleOpenMoreInfoModal}
              disabled={extraInfoItems.length >= 2}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:bg-slate-300 disabled:text-slate-600 disabled:cursor-not-allowed"
            >
              Add More Info ({extraInfoItems.length}/2)
            </button>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
              <EditableField
                label="Arabic Name"
                field="arabicName"
                value={emp.arabicName}
                isCopyable={false}
                {...{
                  editField,
                  editValue,
                  copiedField,
                  onEdit: handleEdit,
                  onSave: handleSave,
                  onCancel: handleCancel,
                  onCopy: handleCopy,
                  onEditValueChange: setEditValue,
                }}
              />

              <div className="group relative">
                <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-0.5">
                  Entry Date
                </label>
                <div className="flex items-center justify-between gap-2 p-1.5 -m-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                  {editField === 'entryDate' ? (
                    <div className="flex-1 flex gap-1">
                      <input
                        type="date"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-200 outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => handleSave('entryDate')}
                        className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-xs"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-2 py-1 bg-slate-200 rounded-lg text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm text-slate-700 font-medium">
                        {entryDateDisplay}
                      </span>
                      <button
                        onClick={() => handleEdit('entryDate', emp.entryDate)}
                        className="p-1 hover:bg-slate-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Edit"
                      >
                        <Edit2 size={12} className="text-slate-400" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <EditableField
                label="Sponsor"
                field="sponsor"
                value={emp.sponsor}
                isCopyable={false}
                dropdownOptions={dropdownOptions.sponsor}
                {...{
                  editField,
                  editValue,
                  copiedField,
                  onEdit: handleEdit,
                  onSave: handleSave,
                  onCancel: handleCancel,
                  onCopy: handleCopy,
                  onEditValueChange: setEditValue,
                }}
              />

              <div
                className={`rounded-xl border p-3 ${
                  insuranceComplete
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                  Health Insurance
                </p>

                <div className="mt-1 flex items-start justify-between gap-3">
                  <div className="group min-w-0 flex-1">
                    {editField === 'healthInsuranceName' ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-white text-sm text-slate-800 border border-emerald-200 outline-none focus:ring-2 focus:ring-emerald-200"
                          autoFocus
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSave('healthInsuranceName')}
                            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-500 text-white hover:bg-emerald-400"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancel}
                            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-200 text-slate-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-700 truncate">
                          {emp.healthInsuranceName || '—'}
                        </p>
                        <button
                          onClick={() =>
                            handleEdit('healthInsuranceName', emp.healthInsuranceName || '')
                          }
                          className="p-1 rounded hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Edit Insurance Name"
                        >
                          <Edit2 size={12} className="text-slate-500" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="group min-w-0">
                    {editField === 'healthInsuranceExpiry' ? (
                      <div className="space-y-2">
                        <input
                          type="date"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full min-w-[130px] px-2.5 py-1.5 rounded-lg bg-white text-sm text-slate-800 border border-emerald-200 outline-none focus:ring-2 focus:ring-emerald-200"
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleSave('healthInsuranceExpiry')}
                            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-500 text-white hover:bg-emerald-400"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancel}
                            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-200 text-slate-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-end gap-2">
                        <p className="text-sm font-semibold text-slate-700 whitespace-nowrap">
                          {formatDate(emp.healthInsuranceExpiry)}
                        </p>
                        <button
                          onClick={() =>
                            handleEdit(
                              'healthInsuranceExpiry',
                              emp.healthInsuranceExpiry || ''
                            )
                          }
                          className="p-1 rounded hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Edit Insurance Expiry"
                        >
                          <Edit2 size={12} className="text-slate-500" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div
                className={`group rounded-xl border p-3 ${
                  agreementComplete
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                      Agreement
                    </p>
                    <p className="text-sm font-semibold text-slate-700">
                      {emp.agreement}
                    </p>
                  </div>
                  {editField !== 'agreement' && (
                    <button
                      onClick={() => handleEdit('agreement', emp.agreement)}
                      className="p-1 hover:bg-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Edit"
                    >
                      <Edit2 size={12} className="text-slate-500" />
                    </button>
                  )}
                </div>
                {editField === 'agreement' && (
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEmp((prev) => ({ ...prev, agreement: 'Complete' }));
                        setEditField(null);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 text-white"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => {
                        setEmp((prev) => ({
                          ...prev,
                          agreement: 'Not Complete',
                        }));
                        setEditField(null);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-600 text-white"
                    >
                      Not Complete
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-200 text-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div
                className={`group rounded-xl border p-3 ${
                  commitmentComplete
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                      Commitment
                    </p>
                    <p className="text-sm font-semibold text-slate-700">
                      {emp.commitment}
                    </p>
                  </div>
                  {editField !== 'commitment' && (
                    <button
                      onClick={() => handleEdit('commitment', emp.commitment)}
                      className="p-1 hover:bg-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Edit"
                    >
                      <Edit2 size={12} className="text-slate-500" />
                    </button>
                  )}
                </div>
                {editField === 'commitment' && (
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEmp((prev) => ({ ...prev, commitment: 'Complete' }));
                        setEditField(null);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 text-white"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => {
                        setEmp((prev) => ({
                          ...prev,
                          commitment: 'Not Complete',
                        }));
                        setEditField(null);
                      }}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-600 text-white"
                    >
                      Not Complete
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-200 text-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 min-h-[92px]">
                <div className="group">
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    Accommodation
                  </p>
                  {editField === 'accomodation' ? (
                    <div className="mt-1 space-y-2">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="Type accommodation"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white text-sm text-slate-800 border border-emerald-200 outline-none focus:ring-2 focus:ring-emerald-200"
                        autoFocus
                      />
                      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white max-h-36 overflow-y-auto">
                        <button
                          onClick={() => handleSave('accomodation', editValue)}
                          disabled={!editValue.trim()}
                          className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:text-slate-400 disabled:hover:bg-white"
                        >
                          [Add {editValue.trim() || 'accommodation'}]
                        </button>
                        {accommodationDropdownOptions.map((option) => (
                          <button
                            key={option}
                            onClick={() => handleSave('accomodation', option)}
                            className="w-full text-left px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 border-t border-slate-100"
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={handleCancel}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-200 text-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="mt-1 flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-700">
                        {emp.accomodation || '—'}
                      </p>
                      <button
                        onClick={() => handleEdit('accomodation', emp.accomodation)}
                        className="p-1 rounded hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Edit Accommodation"
                      >
                        <Edit2 size={12} className="text-slate-500" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-2 pt-2 border-t border-slate-200 group">
                  <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    Transfer Count
                  </p>
                  <div className="mt-1 flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-700">
                      {String(emp.transferCount)}
                    </p>
                    {editField !== 'transferCount' && (
                      <button
                        onClick={() =>
                          handleEdit('transferCount', String(emp.transferCount))
                        }
                        className="p-1 rounded hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Edit Transfer Count"
                      >
                        <Edit2 size={12} className="text-slate-500" />
                      </button>
                    )}
                  </div>
                  {editField === 'transferCount' && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {['0', '1', '2', '3', '3+'].map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setEmp((prev) => ({ ...prev, transferCount: option }));
                            setEditField(null);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-emerald-100 hover:text-emerald-700"
                        >
                          {option}
                        </button>
                      ))}
                      <button
                        onClick={handleCancel}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-200 text-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {[0, 1].map((slotIndex) => {
                const info = extraInfoItems[slotIndex];
                return (
                  <div
                    key={`extra-info-slot-${slotIndex}`}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-3 min-h-[92px]"
                  >
                    {info ? (
                      <>
                        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                          {info.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-700 leading-snug whitespace-pre-wrap">
                          {info.text}
                        </p>
                      </>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-xs text-slate-400">
                          Use Add More Info to add data here
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="md:col-span-2 lg:col-span-3 pt-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                      Bank Accounts
                    </p>
                    <button
                      onClick={handleOpenBankModal}
                      disabled={bankAccounts.length >= 3}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:bg-slate-300 disabled:text-slate-600 disabled:cursor-not-allowed"
                    >
                      Add Bank Account ({bankAccounts.length}/3)
                    </button>
                  </div>
                  {bankAccounts.length === 0 ? (
                    <p className="text-sm text-slate-500">No bank account added yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {bankAccounts.map((account) => (
                        <div
                          key={account.id}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2"
                        >
                          <p className="text-[10px] uppercase tracking-wider text-slate-500">
                            Bank
                          </p>
                          <p className="text-sm font-semibold text-slate-700">
                            {account.bank}
                          </p>
                          <p className="mt-2 text-[10px] uppercase tracking-wider text-slate-500">
                            IBAN No.
                          </p>
                          <p className="text-sm font-medium text-slate-700 break-all">
                            {account.ibanNo}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Attachments */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-700">Attachments</h3>
            <button
              onClick={handleAddMoreDocument}
              disabled={!canAddMoreDocuments}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:bg-slate-300 disabled:text-slate-600 disabled:cursor-not-allowed"
            >
              Add More Document ({moreDocuments.length}/5)
            </button>
          </div>
          <div className="p-5">
            <input
              ref={attachmentInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleAttachmentChange}
              className="hidden"
            />
            <AttachmentGrid
              attachments={emp.attachments}
              configs={attachmentConfigs}
              onEdit={handleEditAttachment}
              onDownload={handleDownloadAttachment}
              onPreview={(item) =>
                handlePreviewAttachment(item.label, item.type, emp.attachments[item.key])
              }
            />
            {moreDocuments.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  More Documents
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {moreDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() =>
                        handlePreviewAttachment(doc.title, doc.type, doc.url)
                      }
                      className="border border-slate-200 rounded-xl p-3 text-center bg-slate-50 hover:shadow-md transition-all group cursor-pointer"
                    >
                      <div className="relative">
                        {doc.type === 'image' ? (
                          <img
                            src={doc.url}
                            alt={doc.title}
                            className="h-16 w-full object-cover rounded-lg mb-2"
                          />
                        ) : (
                          <div className="h-16 w-full bg-red-50 border border-red-100 rounded-lg mb-2 flex flex-col items-center justify-center">
                            <FileText size={20} className="text-red-500" />
                            <span className="text-[9px] font-semibold text-red-500 mt-1">
                              PDF
                            </span>
                          </div>
                        )}
                        <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const anchor = document.createElement('a');
                              anchor.href = doc.url;
                              anchor.download = `${doc.title}.${doc.type === 'pdf' ? 'pdf' : 'jpg'}`;
                              anchor.click();
                            }}
                            className="p-1 bg-white rounded-full shadow-md hover:bg-slate-100"
                            title="Download"
                          >
                            <Download size={12} className="text-slate-600" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] font-medium text-slate-500 mt-1 truncate">
                        {doc.title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {isMoreInfoModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsMoreInfoModalOpen(false)}
          >
            <div
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                <h4 className="text-sm font-bold text-slate-700">Add More Info</h4>
                <button
                  onClick={() => setIsMoreInfoModalOpen(false)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-600"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={moreInfoForm.title}
                    onChange={(e) =>
                      setMoreInfoForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Enter title"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-200 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={moreInfoForm.text}
                    onChange={(e) =>
                      setMoreInfoForm((prev) => ({
                        ...prev,
                        text: e.target.value,
                      }))
                    }
                    placeholder="Enter short details"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-200 outline-none resize-none"
                  />
                </div>
              </div>
              <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsMoreInfoModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveMoreInfo}
                  disabled={!canSaveMoreInfo}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:bg-slate-300 disabled:text-slate-600 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {isBankModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsBankModalOpen(false)}
          >
            <div
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                <h4 className="text-sm font-bold text-slate-700">Add Bank Account</h4>
                <button
                  onClick={() => setIsBankModalOpen(false)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-600"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">
                    Bank
                  </label>
                  <input
                    type="text"
                    value={bankForm.bankInput}
                    onFocus={() => {
                      setBankForm((prev) => ({
                        ...prev,
                        bank: '',
                        bankInput: '',
                      }));
                      setIsBankDropdownOpen(true);
                    }}
                    onChange={(e) =>
                      setBankForm((prev) => ({
                        ...prev,
                        bank: '',
                        bankInput: e.target.value,
                      }))
                    }
                    placeholder="Type to search or add bank"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-200 outline-none"
                  />
                  {isBankDropdownOpen && (
                    <div className="mt-1 border border-slate-200 rounded-lg bg-white overflow-hidden max-h-40 overflow-y-auto">
                      <button
                        onClick={() => handleSelectBankOption(bankForm.bankInput)}
                        disabled={!bankForm.bankInput.trim()}
                        className="w-full text-left px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:text-slate-400 disabled:hover:bg-white"
                      >
                        [Add {bankForm.bankInput.trim() || 'bank'}]
                      </button>
                      {bankDropdownOptions.map((option) => (
                        <button
                          key={option}
                          onClick={() => handleSelectBankOption(option)}
                          className="w-full text-left px-2.5 py-1.5 text-sm text-slate-700 hover:bg-slate-50 border-t border-slate-100"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                  {bankForm.bank && (
                    <p className="mt-1 text-xs text-emerald-700 font-medium truncate">
                      Selected: {bankForm.bank}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">
                    IBAN No.
                  </label>
                  <input
                    type="text"
                    value={bankForm.ibanNo}
                    onChange={(e) =>
                      setBankForm((prev) => ({
                        ...prev,
                        ibanNo: e.target.value.slice(0, 24),
                      }))
                    }
                    maxLength={24}
                    placeholder="Enter IBAN (max 24 characters)"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-200 outline-none"
                  />
                </div>
              </div>
              <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsBankModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBankAccount}
                  disabled={!canSaveBankAccount}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:bg-slate-300 disabled:text-slate-600 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {isMoreDocumentModalOpen && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsMoreDocumentModalOpen(false)}
          >
            <div
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                <h4 className="text-sm font-bold text-slate-700">Add More Document</h4>
                <button
                  onClick={() => setIsMoreDocumentModalOpen(false)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-600"
                  title="Close"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">
                    Document Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setNewDocumentType('image');
                        setNewDocumentFile(null);
                        if (moreDocumentUploadInputRef.current) {
                          moreDocumentUploadInputRef.current.value = '';
                        }
                      }}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                        newDocumentType === 'image'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Image
                    </button>
                    <button
                      onClick={() => {
                        setNewDocumentType('pdf');
                        setNewDocumentFile(null);
                        if (moreDocumentUploadInputRef.current) {
                          moreDocumentUploadInputRef.current.value = '';
                        }
                      }}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                        newDocumentType === 'pdf'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      PDF
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">
                    Document Name
                  </label>
                  <input
                    type="text"
                    value={newDocumentTitle}
                    onChange={(e) => setNewDocumentTitle(e.target.value)}
                    placeholder="Enter document name"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-200 outline-none"
                  />
                </div>

                <div>
                  <input
                    ref={moreDocumentUploadInputRef}
                    type="file"
                    accept={moreDocumentAccept}
                    onChange={handleMoreDocumentFileChange}
                    className="hidden"
                  />
                  <label className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block mb-1">
                    Upload
                  </label>
                  <button
                    onClick={handlePickMoreDocumentFile}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                  >
                    Upload File
                  </button>
                  <p className="mt-1 text-xs text-slate-500 truncate">
                    {newDocumentFile ? newDocumentFile.name : 'No file selected'}
                  </p>
                </div>
              </div>
              <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsMoreDocumentModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveMoreDocument}
                  disabled={!canSaveMoreDocument}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:bg-slate-300 disabled:text-slate-600 disabled:cursor-not-allowed"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {previewAttachment && (
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setPreviewAttachment(null)}
          >
            <div
              className="relative w-full max-w-3xl bg-white rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                <p className="text-sm font-semibold text-slate-700 capitalize">
                  {previewAttachment.title}
                </p>
                <button
                  onClick={() => setPreviewAttachment(null)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-600"
                  title="Close"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="bg-slate-900 p-3">
                {previewAttachment.type === 'image' ? (
                  <img
                    src={previewAttachment.url}
                    alt={previewAttachment.title}
                    className="w-full max-h-[75vh] object-contain rounded-lg"
                  />
                ) : (
                  <iframe
                    src={previewAttachment.url}
                    title={previewAttachment.title}
                    className="w-full h-[75vh] rounded-lg bg-white"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
