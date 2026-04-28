import { Fragment, useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ChevronDown,
  Edit2,
  FileImage,
  Info,
  Plus,
  Receipt,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import {
  employeeSeeds,
  getEmployeeDisplayName,
  getEmployeeInitials,
  getSelfieUrl,
} from '../employees/employeeData';

type TransactionType = 'Addition' | 'Deduction';

interface LayoutContext {
  searchTerm: string;
}

interface PaymentEntry {
  id: number;
  date: string;
  amount: number;
}

interface TransactionItem {
  id: number;
  date: string;
  riderName: string;
  type: TransactionType;
  amount: number;
  category: string;
  note: string;
  receiptName: string;
  payments: PaymentEntry[];
}

const todayIso = () => new Date().toISOString().slice(0, 10);

const categories = [
  'Official Payment',
  'Loan / Salafiya',
  'Lack of Duty',
  'Break Rules',
  'Due Salary',
  'Supervisor',
  'Damage or Loss',
  'Vehicle Servicing',
  'Others',
];

const initialTransactions: TransactionItem[] = [
  {
    id: 1,
    date: '2026-04-24',
    riderName: 'Md. Rahim Uddin',
    type: 'Addition',
    amount: 850,
    category: 'Official Payment',
    note: 'Platform payment pending collection.',
    receiptName: 'rahim-payment.jpg',
    payments: [{ id: 11, date: '2026-04-25', amount: 500 }],
  },
  {
    id: 2,
    date: '2026-04-23',
    riderName: 'Shahidul Islam',
    type: 'Addition',
    amount: 780,
    category: 'Vehicle Servicing',
    note: 'Brake servicing charge.',
    receiptName: 'service-bill.jpg',
    payments: [],
  },
  {
    id: 3,
    date: '2026-04-22',
    riderName: 'Masud Rana',
    type: 'Addition',
    amount: 300,
    category: 'Loan / Salafiya',
    note: 'Short advance recorded.',
    receiptName: '',
    payments: [{ id: 31, date: '2026-04-26', amount: 100 }],
  },
  {
    id: 4,
    date: '2026-04-20',
    riderName: 'Fatema Begum',
    type: 'Addition',
    amount: 240,
    category: 'Break Rules',
    note: 'Fully settled old deduction.',
    receiptName: '',
    payments: [{ id: 41, date: '2026-04-21', amount: 240 }],
  },
];

const formatDate = (dateStr: string) => {
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString('en-GB');
};

const getPaidAmount = (item: TransactionItem) =>
  item.type === 'Deduction'
    ? item.amount
    : item.payments.reduce((sum, payment) => sum + payment.amount, 0);

const getDueAmount = (item: TransactionItem) =>
  Math.max((item.type === 'Addition' ? item.amount : 0) - getPaidAmount(item), 0);

const getRiderSeed = (riderName: string) =>
  employeeSeeds.find((employee) => employee.fullName === riderName);

const RiderAvatar = ({
  riderName,
  language,
}: {
  riderName: string;
  language: string;
}) => {
  const seed = getRiderSeed(riderName);
  const selfieUrl = seed ? getSelfieUrl(seed) : null;
  const displayName = seed ? getEmployeeDisplayName(seed, language) : riderName;

  if (selfieUrl) {
    return (
      <img
        src={selfieUrl}
        alt={displayName}
        className="h-8 w-8 rounded-full object-cover border border-emerald-200"
      />
    );
  }

  const initials =
    seed ? getEmployeeInitials(seed, language) : displayName.slice(0, 2).toUpperCase();

  return (
    <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[11px] font-black">
      {initials}
    </div>
  );
};

export default function Transaction() {
  const { i18n } = useTranslation();
  const outletContext = useOutletContext<LayoutContext | undefined>();
  const searchTerm = outletContext?.searchTerm ?? '';
  const [records, setRecords] =
    useState<TransactionItem[]>(initialTransactions);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [expandedRider, setExpandedRider] = useState<string | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<TransactionItem | null>(
    null
  );
  const [paymentEditor, setPaymentEditor] = useState<{
    itemId: number;
    direction: 'up' | 'down';
    top: number;
    left: number;
  } | null>(null);
  const [paymentDraft, setPaymentDraft] = useState({
    date: todayIso(),
    amount: '',
  });
  const [form, setForm] = useState({
    date: todayIso(),
    riderName: employeeSeeds[0]?.fullName ?? '',
    type: 'Addition' as TransactionType,
    amount: '',
    category: categories[0],
    note: '',
    receiptName: '',
  });

  const filteredRecords = useMemo(() => {
    const searchValue = searchTerm.toLowerCase().trim();
    return records.filter((record) => {
      const matchesCategory =
        categoryFilter === 'All' ? true : record.category === categoryFilter;
      const matchesSearch = [
        record.riderName,
        getRiderSeed(record.riderName)
          ? getEmployeeDisplayName(getRiderSeed(record.riderName)!, i18n.language)
          : '',
        record.category,
        record.note,
        record.type,
      ]
        .join(' ')
        .toLowerCase()
        .includes(searchValue);
      return matchesCategory && matchesSearch;
    });
  }, [categoryFilter, i18n.language, records, searchTerm]);

  const riderSummaries = useMemo(() => {
    const map = new Map<
      string,
      {
        riderName: string;
        totalDue: number;
        totalPaid: number;
        balance: number;
        unpaidHistory: TransactionItem[];
        paidHistory: TransactionItem[];
      }
    >();

    filteredRecords.forEach((record) => {
      const current =
        map.get(record.riderName) ??
        {
          riderName: record.riderName,
          totalDue: 0,
          totalPaid: 0,
          balance: 0,
          unpaidHistory: [],
          paidHistory: [],
        };

      const originalDue = record.type === 'Addition' ? record.amount : 0;
      const paid = getPaidAmount(record);
      const due = getDueAmount(record);

      current.totalDue += originalDue;
      current.totalPaid += paid;
      current.balance = current.totalDue - current.totalPaid;
      if (due > 0) {
        current.unpaidHistory.push(record);
      } else {
        current.paidHistory.push(record);
      }
      map.set(record.riderName, current);
    });

    return Array.from(map.values())
      .map((summary) => ({
        ...summary,
        unpaidHistory: [...summary.unpaidHistory].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
        paidHistory: [...summary.paidHistory].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
      }))
      .sort(
        (a, b) => b.balance - a.balance || a.riderName.localeCompare(b.riderName)
      );
  }, [filteredRecords]);

  const visibleRiderSummaries = riderSummaries.filter(
    (rider) => rider.unpaidHistory.length > 0
  );

  const totalPeople = riderSummaries.length;
  const totalDue = riderSummaries.reduce((sum, rider) => sum + rider.totalDue, 0);
  const totalPaid = riderSummaries.reduce(
    (sum, rider) => sum + rider.totalPaid,
    0
  );
  const totalBalance = riderSummaries.reduce(
    (sum, rider) => sum + rider.balance,
    0
  );
  const paymentEditorItem = paymentEditor
    ? records.find((record) => record.id === paymentEditor.itemId)
    : null;

  const canSave =
    form.date &&
    form.riderName &&
    form.type &&
    form.amount.trim() &&
    Number(form.amount) > 0 &&
    form.category;

  const handleSave = () => {
    if (!canSave) return;
    setRecords((prev) => [
      {
        id: Date.now(),
        date: form.date,
        riderName: form.riderName,
        type: form.type,
        amount: Number(form.amount),
        category: form.category,
        note: form.note.trim(),
        receiptName: form.receiptName,
        payments: form.type === 'Deduction'
          ? [{ id: Date.now() + 1, date: form.date, amount: Number(form.amount) }]
          : [],
      },
      ...prev,
    ]);
    setIsDrawerOpen(false);
    setForm({
      date: todayIso(),
      riderName: employeeSeeds[0]?.fullName ?? '',
      type: 'Addition',
      amount: '',
      category: categories[0],
      note: '',
      receiptName: '',
    });
  };

  useEffect(() => {
    if (!paymentEditor) return;
    const closeEditor = () => setPaymentEditor(null);
    window.addEventListener('click', closeEditor);
    return () => window.removeEventListener('click', closeEditor);
  }, [paymentEditor]);

  const openPaymentEditor = (
    itemId: number,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const popupHeight = 280;
    const popupWidth = 256;
    const spaceBelow = window.innerHeight - rect.bottom;
    const direction = spaceBelow > popupHeight + 24 ? 'down' : 'up';
    setPaymentEditor({
      itemId,
      direction,
      top:
        direction === 'down'
          ? rect.bottom + 12
          : Math.max(12, rect.top - popupHeight - 12),
      left: Math.min(
        window.innerWidth - popupWidth - 12,
        Math.max(12, rect.right - popupWidth)
      ),
    });
    setPaymentDraft({ date: todayIso(), amount: '' });
  };

  const savePayment = (item: TransactionItem) => {
    const amount = Number(paymentDraft.amount);
    const due = getDueAmount(item);
    if (!paymentDraft.date || Number.isNaN(amount) || amount <= 0 || due <= 0) {
      return;
    }

    const safeAmount = Math.min(amount, due);
    setRecords((prev) =>
      prev.map((record) =>
        record.id === item.id
          ? {
              ...record,
              payments: [
                ...record.payments,
                { id: Date.now(), date: paymentDraft.date, amount: safeAmount },
              ],
            }
          : record
      )
    );

    if (safeAmount >= due) {
      setPaymentEditor(null);
    }
    setPaymentDraft({ date: todayIso(), amount: '' });
  };

  return (
    <div className="ars-page h-full overflow-auto p-3 md:p-4">
      <div className="mb-3 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5">
        <SummaryCard
          label="Total People"
          value={`${totalPeople}`}
          icon={<Users size={16} />}
          tone="slate"
        />
        <SummaryCard
          label="Total Due"
          value={`${totalDue.toLocaleString()} SAR`}
          icon={<Receipt size={16} />}
          tone="red"
        />
        <SummaryCard
          label="Total Paid"
          value={`${totalPaid.toLocaleString()} SAR`}
          icon={<Wallet size={16} />}
          tone="emerald"
        />
        <SummaryCard
          label="Total Balance"
          value={`${totalBalance.toLocaleString()} SAR`}
          icon={<Receipt size={16} />}
          tone={totalBalance > 0 ? 'amber' : 'emerald'}
        />

        <div className="ars-card rounded-2xl p-3">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="ars-primary-button w-full px-3 py-2 rounded-xl text-sm font-black flex items-center justify-center gap-1.5"
          >
            <Plus size={16} /> Add Transaction
          </button>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="ars-glass-button mt-2 w-full rounded-xl px-3 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-200"
          >
            <option value="All">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="ars-table-shell overflow-visible">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="ars-table-head border-b border-slate-100">
              <tr>
                <th className="sticky top-0 z-10 w-16 bg-slate-50 px-4 py-2 text-left text-xs font-semibold text-slate-600">
                  Sl.
                </th>
                <th className="sticky top-0 z-10 bg-slate-50 px-4 py-2 text-left text-xs font-semibold text-slate-600">
                  Rider Name
                </th>
                <th className="sticky top-0 z-10 bg-slate-50 px-4 py-2 text-left text-xs font-semibold text-slate-600">
                  Total Due
                </th>
                <th className="sticky top-0 z-10 bg-slate-50 px-4 py-2 text-left text-xs font-semibold text-slate-600">
                  Total Paid
                </th>
                <th className="sticky top-0 z-10 bg-slate-50 px-4 py-2 text-left text-xs font-semibold text-slate-600">
                  Balance
                </th>
                <th className="sticky top-0 z-10 w-16 bg-slate-50 px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {visibleRiderSummaries.map((rider, index) => {
                const isExpanded = expandedRider === rider.riderName;
                const rowTone =
                  index % 2 === 0 ? 'bg-emerald-50' : 'bg-sky-50';
                const auraClass = isExpanded
                  ? 'shadow-[inset_4px_0_0_rgba(16,185,129,0.8),0_12px_30px_-24px_rgba(16,185,129,0.95)]'
                  : '';

                return (
                  <Fragment key={rider.riderName}>
                    <tr
                      onClick={() =>
                        setExpandedRider(isExpanded ? null : rider.riderName)
                      }
                      className={`cursor-pointer transition-all ${rowTone} ${auraClass}`}
                    >
                      <td className="px-4 py-3 font-bold text-slate-500">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        <div className="flex items-center gap-2">
                          <RiderAvatar
                            riderName={rider.riderName}
                            language={i18n.language}
                          />
                          <span>
                            {getRiderSeed(rider.riderName)
                              ? getEmployeeDisplayName(
                                  getRiderSeed(rider.riderName)!,
                                  i18n.language
                                )
                              : rider.riderName}
                          </span>
                        </div>
                      </td>
                      <td dir="ltr" className="px-4 py-3 text-left font-bold text-red-600">
                        {rider.totalDue.toLocaleString()} SAR
                      </td>
                      <td dir="ltr" className="px-4 py-3 text-left font-bold text-emerald-600">
                        {rider.totalPaid.toLocaleString()} SAR
                      </td>
                      <td dir="ltr" className="px-4 py-3 text-left font-black text-slate-800">
                        {rider.balance.toLocaleString()} SAR
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ChevronDown
                          size={16}
                          className={`ml-auto text-slate-400 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr className={auraClass}>
                        <td colSpan={6} className="bg-emerald-50/40 px-4 pb-4 pt-1">
                          <div className="overflow-visible rounded-b-2xl border-x border-b border-emerald-100 bg-white/70 shadow-sm backdrop-blur">
                            <table className="w-full text-xs">
                              <tbody className="divide-y divide-slate-50">
                                {rider.unpaidHistory.map((item) => {
                                  const due = getDueAmount(item);
                                  const paid = getPaidAmount(item);
                                  return (
                                    <tr key={item.id} className="relative">
                                      <td className="px-3 py-2 font-bold text-slate-400">
                                        {rider.unpaidHistory.indexOf(item) + 1}
                                      </td>
                                      <td className="px-3 py-2 text-slate-600">
                                        {formatDate(item.date)}
                                      </td>
                                      <td className="px-3 py-2 text-slate-600">
                                        {item.category}
                                      </td>
                                      <td dir="ltr" className="px-3 py-2 font-bold text-slate-700">
                                        {item.type} {item.amount} SAR
                                      </td>
                                      <td dir="ltr" className="px-3 py-2 text-right font-bold text-emerald-600">
                                        <div className="relative inline-flex items-center gap-1">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openPaymentEditor(item.id, e);
                                            }}
                                            className="rounded-md bg-emerald-50 p-1 text-emerald-700 hover:bg-emerald-100"
                                            title="Add paid amount"
                                          >
                                            <Edit2 size={12} />
                                          </button>
                                          {paid} SAR
                                        </div>
                                      </td>
                                      <td dir="ltr" className="px-3 py-2 text-right font-black text-red-600">
                                        {due} SAR Due
                                      </td>
                                      <td className="px-3 py-2 text-center">
                                        {item.receiptName && (
                                          <button
                                            onClick={() =>
                                              setReceiptPreview(item)
                                            }
                                            className="rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100"
                                          >
                                            Receipt
                                          </button>
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-center">
                                        {item.note && (
                                          <div className="relative inline-block group/info">
                                            <button className="rounded-full bg-slate-100 p-1 text-slate-600">
                                              <Info size={12} />
                                            </button>
                                            <div style={{ insetInlineEnd: 0 }} className="ars-floating-menu absolute top-full z-20 mt-2 hidden w-56 rounded-xl border border-slate-100 p-3 text-left text-xs text-slate-600 shadow-xl group-hover/info:block">
                                              {item.note}
                                            </div>
                                          </div>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {visibleRiderSummaries.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-slate-400">No transactions found</p>
          </div>
        )}
      </div>

      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-[1px]">
          <div className="ars-drawer-panel h-full w-full max-w-md flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                Add Transaction
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
                  Date*
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, date: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Rider Name*
                </label>
                <select
                  value={form.riderName}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, riderName: e.target.value }))
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
                  Type*
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(['Addition', 'Deduction'] as TransactionType[]).map(
                    (type) => (
                      <button
                        key={type}
                        onClick={() => setForm((prev) => ({ ...prev, type }))}
                        className={`rounded-xl border px-2 py-2 text-xs font-bold ${
                          form.type === type
                            ? type === 'Addition'
                              ? 'border-red-500 bg-red-50 text-red-700'
                              : 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {type}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Amount*
                </label>
                <div className="mt-1 flex overflow-hidden rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-emerald-200">
                  <input
                    type="number"
                    value={form.amount}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, amount: e.target.value }))
                    }
                    className="min-w-0 flex-1 px-3 py-2 text-sm outline-none"
                  />
                  <span className="bg-slate-50 px-3 py-2 text-sm font-black text-slate-500">
                    SAR
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Category*
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, category: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
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

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Receipt Image
                </label>
                <label className="mt-1 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-6 text-sm font-semibold text-slate-500 hover:bg-slate-100">
                  <FileImage size={18} />
                  {form.receiptName || 'Upload receipt image'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        receiptName: e.target.files?.[0]?.name ?? '',
                      }))
                    }
                  />
                </label>
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
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:bg-slate-300"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {receiptPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="ars-card w-full max-w-2xl overflow-hidden rounded-3xl shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <p className="text-sm font-black text-slate-800">
                  Receipt Image
                </p>
                <p className="text-xs text-slate-500">
                  {receiptPreview.receiptName}
                </p>
              </div>
              <button
                onClick={() => setReceiptPreview(null)}
                className="rounded-full p-1 hover:bg-slate-100"
              >
                <X size={18} className="text-slate-500" />
              </button>
            </div>
            <div className="flex min-h-80 items-center justify-center bg-slate-950 p-6 text-white">
              <div className="flex h-64 w-full max-w-lg items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-emerald-500/20 to-blue-500/20">
                <FileImage size={64} />
              </div>
            </div>
          </div>
        </div>
      )}

      {paymentEditor && paymentEditorItem && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ top: paymentEditor.top, left: paymentEditor.left }}
          className={`ars-floating-menu fixed z-[60] w-64 rounded-2xl border border-emerald-100 p-3 text-left shadow-xl ${
            paymentEditor.direction === 'down'
              ? 'before:absolute before:-top-2 before:right-8 before:h-4 before:w-4 before:rotate-45 before:border-l before:border-t before:border-emerald-100 before:bg-inherit'
              : 'after:absolute after:-bottom-2 after:right-8 after:h-4 after:w-4 after:rotate-45 after:border-b after:border-r after:border-emerald-100 after:bg-inherit'
          }`}
        >
          <p className="text-xs font-black uppercase tracking-wider text-slate-500">
            Paid Entries
          </p>
          <div className="mt-2 max-h-32 space-y-1 overflow-y-auto">
            {paymentEditorItem.payments.length === 0 && (
              <p className="text-xs text-slate-400">No payment yet</p>
            )}
            {paymentEditorItem.payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1 text-xs"
              >
                <span>{formatDate(payment.date)}</span>
                <span className="font-bold text-emerald-700">
                  {payment.amount} SAR
                </span>
              </div>
            ))}
          </div>

          {getDueAmount(paymentEditorItem) > 0 && (
            <div className="mt-3 space-y-2 rounded-xl bg-emerald-50 p-2">
              <input
                type="date"
                value={paymentDraft.date}
                onChange={(e) =>
                  setPaymentDraft((prev) => ({
                    ...prev,
                    date: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-emerald-100 px-2 py-1.5 text-xs outline-none"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  value={paymentDraft.amount}
                  onChange={(e) =>
                    setPaymentDraft((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  placeholder={`Due ${getDueAmount(paymentEditorItem)}`}
                  className="min-w-0 flex-1 rounded-lg border border-emerald-100 px-2 py-1.5 text-xs outline-none"
                />
                <button
                  onClick={() => savePayment(paymentEditorItem)}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: 'slate' | 'red' | 'emerald' | 'amber';
}) {
  const toneClass = {
    slate: 'bg-slate-50 text-slate-700 border-slate-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
  }[tone];

  return (
    <div className={`ars-card rounded-2xl px-3 py-3 text-center ${toneClass}`}>
      <div className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider">
        {icon}
        {label}
      </div>
      <p dir="ltr" className="mt-1 text-base font-black text-slate-800">
        {value}
      </p>
    </div>
  );
}
