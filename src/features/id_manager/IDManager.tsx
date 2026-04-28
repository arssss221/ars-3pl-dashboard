import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, Copy, Edit2, Eye, Plus, X } from 'lucide-react';
import {
  employeeSeeds,
  getEmployeeDisplayName,
  getEmployeeInitials,
  getSelfieUrl,
} from '../employees/employeeData';

type EditableStatus = 'Active' | 'Pending' | 'Blocked';
type DisplayStatus = EditableStatus | 'Expired';
type StatusFilter = 'All' | DisplayStatus;

interface LayoutContext {
  searchTerm: string;
}

interface ManagedId {
  id: number;
  platform: string;
  underConstruct: string;
  idNumber: string;
  owner: string;
  idStatus: EditableStatus;
  phoneNumber: string;
  email: string;
  password: string;
  note: string;
}

const initialIds: ManagedId[] = [
  {
    id: 1,
    platform: 'HungerStation',
    underConstruct: 'No',
    idNumber: 'HS-782104',
    owner: 'Md. Rahim Uddin',
    idStatus: 'Active',
    phoneNumber: '+966501112233',
    email: 'rahim.hs@ars.com',
    password: 'Rahim@123',
    note: 'Main rider account.',
  },
  {
    id: 2,
    platform: 'Jahez',
    underConstruct: 'Yes',
    idNumber: 'JZ-554210',
    owner: 'Shahidul Islam',
    idStatus: 'Pending',
    phoneNumber: '+966522221144',
    email: 'shahid.jahez@ars.com',
    password: 'Pending#45',
    note: 'Waiting for document approval.',
  },
  {
    id: 3,
    platform: 'Mrsool',
    underConstruct: 'No',
    idNumber: 'MR-991045',
    owner: 'Masud Rana',
    idStatus: 'Blocked',
    phoneNumber: '+966533331122',
    email: 'masud.mrsool@ars.com',
    password: 'Masud#2026',
    note: 'Payment issue under review.',
  },
];

const editableStatusOptions: EditableStatus[] = ['Active', 'Pending', 'Blocked'];
const statusFilters: StatusFilter[] = [
  'All',
  'Active',
  'Pending',
  'Blocked',
  'Expired',
];

const statusStyles: Record<DisplayStatus, string> = {
  Active: 'bg-emerald-100 text-emerald-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  Blocked: 'bg-red-100 text-red-700',
  Expired: 'bg-slate-100 text-slate-700',
};

const isExpiredDate = (dateStr: string) => {
  if (!dateStr) return false;
  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return target < today;
};

export default function IDManager() {
  const { i18n } = useTranslation();
  const outletContext = useOutletContext<LayoutContext | undefined>();
  const searchTerm = outletContext?.searchTerm ?? '';
  const [records, setRecords] = useState<ManagedId[]>(initialIds);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeStatus, setActiveStatus] = useState<StatusFilter>('All');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [editField, setEditField] = useState<keyof ManagedId | null>(null);
  const [editValue, setEditValue] = useState('');
  const [form, setForm] = useState({
    platform: '',
    underConstruct: 'No',
    idNumber: '',
    owner: employeeSeeds[0]?.fullName ?? '',
    phoneNumber: '',
    email: '',
    password: '',
    note: '',
  });

  const ownerExpiryMap = useMemo(() => {
    const map = new Map<string, string>();
    employeeSeeds.forEach((employee) => {
      map.set(employee.fullName, employee.iqamaExpiry);
    });
    return map;
  }, []);

  const getDisplayStatus = (record: ManagedId): DisplayStatus => {
    const iqamaExpiry = ownerExpiryMap.get(record.owner);
    return iqamaExpiry && isExpiredDate(iqamaExpiry) ? 'Expired' : record.idStatus;
  };

  const platformOptions = useMemo(
    () => Array.from(new Set(records.map((record) => record.platform))).sort(),
    [records]
  );

  const underConstructOptions = useMemo(
    () =>
      Array.from(new Set(records.map((record) => record.underConstruct))).sort(),
    [records]
  );

  const selectedRecord = records.find((record) => record.id === selectedRecordId);
  const getOwnerSeed = (owner: string) =>
    employeeSeeds.find((employee) => employee.fullName === owner);
  const getOwnerDisplayName = (owner: string) => {
    const ownerSeed = getOwnerSeed(owner);
    return ownerSeed ? getEmployeeDisplayName(ownerSeed, i18n.language) : owner;
  };

  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      All: records.length,
      Active: 0,
      Pending: 0,
      Blocked: 0,
      Expired: 0,
    };
    records.forEach((record) => {
      counts[getDisplayStatus(record)] += 1;
    });
    return counts;
  }, [records]);

  const filteredRecords = useMemo(() => {
    const searchValue = searchTerm.toLowerCase().trim();
    return records
      .filter((record) => {
        const status = getDisplayStatus(record);
        const matchesStatus =
          activeStatus === 'All' ? true : status === activeStatus;
        const matchesPlatform =
          platformFilter === 'All' ? true : record.platform === platformFilter;
        const matchesSearch = [
          record.platform,
          record.underConstruct,
          record.idNumber,
          record.owner,
          getOwnerDisplayName(record.owner),
          status,
          record.phoneNumber,
          record.email,
          record.note,
        ]
          .join(' ')
          .toLowerCase()
          .includes(searchValue);

        return matchesStatus && matchesPlatform && matchesSearch;
      })
      .sort((a, b) => a.id - b.id);
  }, [activeStatus, i18n.language, platformFilter, records, searchTerm]);

  const canSave =
    form.platform.trim() &&
    form.idNumber.trim() &&
    form.owner.trim() &&
    form.phoneNumber.trim();

  const updateRecord = (id: number, patch: Partial<ManagedId>) => {
    setRecords((prev) =>
      prev.map((record) => (record.id === id ? { ...record, ...patch } : record))
    );
  };

  const startEdit = (field: keyof ManagedId, value: string) => {
    setEditField(field);
    setEditValue(value);
  };

  const saveEdit = (recordId: number, field: keyof ManagedId, value?: string) => {
    const nextValue = (value ?? editValue).trim();
    updateRecord(recordId, { [field]: nextValue } as Partial<ManagedId>);
    setEditField(null);
    setEditValue('');
  };

  const copyIdNumber = async (id: number, idNumber: string) => {
    await navigator.clipboard.writeText(idNumber);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1200);
  };

  const handleSave = () => {
    if (!canSave) return;
    setRecords((prev) => [
      {
        id: Date.now(),
        platform: form.platform.trim(),
        underConstruct: form.underConstruct.trim(),
        idNumber: form.idNumber.trim(),
        owner: form.owner,
        idStatus: 'Active',
        phoneNumber: form.phoneNumber.trim(),
        email: form.email.trim(),
        password: form.password,
        note: form.note.trim(),
      },
      ...prev,
    ]);
    setIsDrawerOpen(false);
    setForm({
      platform: '',
      underConstruct: 'No',
      idNumber: '',
      owner: employeeSeeds[0]?.fullName ?? '',
      phoneNumber: '',
      email: '',
      password: '',
      note: '',
    });
  };

  return (
    <div className="ars-page h-full overflow-auto p-3 md:p-4">
      <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto scrollbar-hide ars-toolbar-dock">
          {statusFilters.map((status) => (
            <button
              key={status}
              onClick={() => setActiveStatus(status)}
              className={`ars-filter-pill shrink-0 transition-all ${
                activeStatus === status
                  ? 'ars-filter-pill-active'
                  : ''
              }`}
            >
              {status} ({statusCounts[status]})
            </button>
          ))}
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2">
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="ars-glass-button w-36 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-200"
          >
            <option value="All">All Platform</option>
            {platformOptions.map((platform) => (
              <option key={platform} value={platform}>
                {platform}
              </option>
            ))}
          </select>
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="ars-primary-button px-3.5 py-2 rounded-xl text-sm font-black flex items-center gap-1.5"
          >
            <Plus size={16} /> Add ID
          </button>
        </div>
      </div>

      <div className="ars-table-shell">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm">
            <thead className="ars-table-head border-b border-slate-100">
              <tr>
                <th className="sticky top-0 z-10 w-16 bg-slate-50 text-left px-4 py-2 text-xs font-semibold text-slate-600">
                  Sl.
                </th>
                <th className="sticky top-0 z-10 bg-slate-50 text-left px-4 py-2 text-xs font-semibold text-slate-600">
                  ID Number
                </th>
                <th className="sticky top-0 z-10 bg-slate-50 text-left px-4 py-2 text-xs font-semibold text-slate-600">
                  Platform
                </th>
                <th className="sticky top-0 z-10 bg-slate-50 text-left px-4 py-2 text-xs font-semibold text-slate-600">
                  Owner
                </th>
                <th className="sticky top-0 z-10 w-52 bg-slate-50 text-left px-4 py-2 text-xs font-semibold text-slate-600">
                  ID Status
                </th>
                <th className="sticky top-0 z-10 w-16 bg-slate-50 px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRecords.map((record, index) => {
                const displayStatus = getDisplayStatus(record);
                const isExpired = displayStatus === 'Expired';

                return (
                  <tr key={record.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-bold text-slate-500">
                      {index + 1}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="group/id inline-flex max-w-full items-center gap-2">
                        <span className="truncate font-semibold text-slate-800">
                          {record.idNumber}
                        </span>
                        <button
                          onClick={() => copyIdNumber(record.id, record.idNumber)}
                          className="rounded p-1 text-slate-400 opacity-0 transition-opacity hover:bg-slate-100 hover:text-emerald-700 group-hover/id:opacity-100"
                          title="Copy ID number"
                        >
                          {copiedId === record.id ? (
                            <Check size={13} />
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">
                      <span className="block truncate font-semibold">
                        {record.platform}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">
                      <div className="flex items-center gap-2 min-w-0">
                        {(() => {
                          const ownerSeed = getOwnerSeed(record.owner);
                          const selfieUrl = ownerSeed ? getSelfieUrl(ownerSeed) : null;
                          return selfieUrl ? (
                            <img
                              src={selfieUrl}
                              alt={getOwnerDisplayName(record.owner)}
                              className="h-7 w-7 rounded-full object-cover border border-emerald-200 shrink-0"
                            />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-black shrink-0">
                              {ownerSeed
                                ? getEmployeeInitials(ownerSeed, i18n.language)
                                : 'ID'}
                            </div>
                          );
                        })()}
                        <span className="block truncate">
                          {getOwnerDisplayName(record.owner)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      {isExpired ? (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-bold ${statusStyles.Expired}`}
                        >
                          Expired
                        </span>
                      ) : (
                        <select
                          value={record.idStatus}
                          onChange={(e) =>
                            updateRecord(record.id, {
                              idStatus: e.target.value as EditableStatus,
                            })
                          }
                          className={`rounded-full border-none px-2 py-1 text-xs font-bold outline-none ${statusStyles[record.idStatus]}`}
                        >
                          {editableStatusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => setSelectedRecordId(record.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-emerald-700"
                        title="View details"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredRecords.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-slate-400">No ID records found</p>
          </div>
        )}
      </div>

      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="ars-card w-full max-w-xl rounded-3xl shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                ID Details of {getOwnerDisplayName(selectedRecord.owner)}
              </h3>
              <button
                onClick={() => {
                  setSelectedRecordId(null);
                  setEditField(null);
                }}
                className="rounded-full p-1 hover:bg-slate-100"
              >
                <X size={18} className="text-slate-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                <p className="text-[11px] font-black uppercase tracking-wider text-emerald-700">
                  ID Number
                </p>
                <p className="mt-1 text-2xl font-black tracking-tight text-slate-800">
                  {selectedRecord.idNumber}
                </p>
              </div>

              <DetailField
                label="Platform"
                field="platform"
                value={selectedRecord.platform}
                recordId={selectedRecord.id}
                editField={editField}
                editValue={editValue}
                options={platformOptions}
                onStartEdit={startEdit}
                onEditValueChange={setEditValue}
                onSave={saveEdit}
                onCancel={() => setEditField(null)}
              />
              <DetailField
                label="Under construct"
                field="underConstruct"
                value={selectedRecord.underConstruct}
                recordId={selectedRecord.id}
                editField={editField}
                editValue={editValue}
                options={underConstructOptions}
                onStartEdit={startEdit}
                onEditValueChange={setEditValue}
                onSave={saveEdit}
                onCancel={() => setEditField(null)}
              />
              <DetailField
                label="Phone Number"
                field="phoneNumber"
                value={selectedRecord.phoneNumber}
                recordId={selectedRecord.id}
                editField={editField}
                editValue={editValue}
                onStartEdit={startEdit}
                onEditValueChange={setEditValue}
                onSave={saveEdit}
                onCancel={() => setEditField(null)}
              />
              <DetailField
                label="Email"
                field="email"
                value={selectedRecord.email}
                recordId={selectedRecord.id}
                editField={editField}
                editValue={editValue}
                onStartEdit={startEdit}
                onEditValueChange={setEditValue}
                onSave={saveEdit}
                onCancel={() => setEditField(null)}
              />
              <DetailField
                label="Password"
                field="password"
                value={selectedRecord.password}
                recordId={selectedRecord.id}
                editField={editField}
                editValue={editValue}
                onStartEdit={startEdit}
                onEditValueChange={setEditValue}
                onSave={saveEdit}
                onCancel={() => setEditField(null)}
              />
              <DetailField
                label="Note"
                field="note"
                value={selectedRecord.note}
                recordId={selectedRecord.id}
                editField={editField}
                editValue={editValue}
                multiline
                onStartEdit={startEdit}
                onEditValueChange={setEditValue}
                onSave={saveEdit}
                onCancel={() => setEditField(null)}
              />
            </div>
          </div>
        </div>
      )}

      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-[1px]">
          <div className="ars-drawer-panel h-full w-full max-w-md flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                Add ID Record
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
                  Platform*
                </label>
                <input
                  list="platform-options"
                  value={form.platform}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, platform: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Under construct
                </label>
                <input
                  list="under-construct-options"
                  value={form.underConstruct}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      underConstruct: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  ID Number*
                </label>
                <input
                  type="text"
                  value={form.idNumber}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, idNumber: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Owner*
                </label>
                <select
                  value={form.owner}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, owner: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  {employeeSeeds.map((employee) => (
                    <option key={employee.id} value={employee.fullName}>
                      {getEmployeeDisplayName(employee, i18n.language)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Phone Number*
                </label>
                <input
                  type="tel"
                  value={form.phoneNumber}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      phoneNumber: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Password
                </label>
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Note
                </label>
                <textarea
                  rows={3}
                  value={form.note}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, note: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                />
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
                onClick={handleSave}
                disabled={!canSave}
                className="ars-primary-button rounded-2xl px-4 py-2 text-sm font-bold disabled:bg-slate-300"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <datalist id="platform-options">
        {platformOptions.map((platform) => (
          <option key={platform} value={platform} />
        ))}
      </datalist>
      <datalist id="under-construct-options">
        {underConstructOptions.map((value) => (
          <option key={value} value={value} />
        ))}
      </datalist>
    </div>
  );
}

interface DetailFieldProps {
  label: string;
  field: keyof ManagedId;
  value: string;
  recordId: number;
  editField: keyof ManagedId | null;
  editValue: string;
  options?: string[];
  multiline?: boolean;
  onStartEdit: (field: keyof ManagedId, value: string) => void;
  onEditValueChange: (value: string) => void;
  onSave: (recordId: number, field: keyof ManagedId, value?: string) => void;
  onCancel: () => void;
}

function DetailField({
  label,
  field,
  value,
  recordId,
  editField,
  editValue,
  options,
  multiline = false,
  onStartEdit,
  onEditValueChange,
  onSave,
  onCancel,
}: DetailFieldProps) {
  const isEditing = editField === field;
  const trimmedValue = editValue.trim();
  const filteredOptions =
    options?.filter((option) =>
      option.toLowerCase().includes(editValue.toLowerCase())
    ) ?? [];

  return (
    <div className="group/detail rounded-2xl border border-slate-100 bg-white px-4 py-3 transition-colors hover:bg-slate-50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            {label}
          </p>
          {isEditing ? (
            <div className="mt-2 space-y-2">
              {multiline ? (
                <textarea
                  autoFocus
                  rows={3}
                  value={editValue}
                  onChange={(e) => onEditValueChange(e.target.value)}
                  className="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-100"
                />
              ) : (
                <input
                  autoFocus
                  type="text"
                  value={editValue}
                  onChange={(e) => onEditValueChange(e.target.value)}
                  className="w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-100"
                />
              )}

              {options && (
                <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                  <button
                    onClick={() => trimmedValue && onSave(recordId, field, trimmedValue)}
                    disabled={!trimmedValue}
                    className="w-full px-3 py-2 text-left text-xs font-black text-emerald-700 hover:bg-emerald-50 disabled:text-slate-400"
                  >
                    [Add {trimmedValue || label}]
                  </button>
                  {filteredOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => onSave(recordId, field, option)}
                      className="w-full border-t border-slate-100 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={onCancel}
                  className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                {!options && (
                  <button
                    onClick={() => onSave(recordId, field)}
                    className="ars-primary-button rounded-xl px-3 py-1.5 text-xs font-bold"
                  >
                    Save
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-1 break-words text-sm font-semibold text-slate-700">
              {value || '-'}
            </p>
          )}
        </div>

        {!isEditing && (
          <button
            onClick={() => onStartEdit(field, value)}
            className="rounded-lg p-1.5 text-slate-400 opacity-0 transition-opacity hover:bg-white hover:text-emerald-700 group-hover/detail:opacity-100"
            title={`Edit ${label}`}
          >
            <Edit2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
