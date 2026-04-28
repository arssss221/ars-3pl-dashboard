import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Info, Trash2 } from 'lucide-react';
import {
  employeeSeeds,
  getEmployeeDisplayName,
  getEmployeeInitials,
  getSelfieUrl,
} from '../employees/employeeData';

interface PaidItem {
  id: number;
  date: string;
  riderName: string;
  category: string;
  amount: number;
  paidEntries: Array<{ id: number; date: string; amount: number }>;
}

const initialPaidItems: PaidItem[] = [
  {
    id: 4,
    date: '2026-04-20',
    riderName: 'Fatema Begum',
    category: 'Break Rules',
    amount: 240,
    paidEntries: [{ id: 41, date: '2026-04-21', amount: 240 }],
  },
  {
    id: 6,
    date: '2026-04-18',
    riderName: 'Md. Rahim Uddin',
    category: 'Official Payment',
    amount: 300,
    paidEntries: [
      { id: 61, date: '2026-04-19', amount: 150 },
      { id: 62, date: '2026-04-20', amount: 150 },
    ],
  },
];

const formatDate = (dateStr: string) => {
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString('en-GB');
};

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
  return (
    <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[11px] font-black">
      {seed ? getEmployeeInitials(seed, language) : displayName.slice(0, 2).toUpperCase()}
    </div>
  );
};

export default function PaidTransactions() {
  const { i18n } = useTranslation();
  const [items, setItems] = useState<PaidItem[]>(initialPaidItems);

  const cards = useMemo(() => {
    const map = new Map<string, PaidItem[]>();
    items.forEach((item) => {
      map.set(item.riderName, [...(map.get(item.riderName) ?? []), item]);
    });
    return Array.from(map.entries()).map(([riderName, paidItems]) => ({
      riderName,
      paidItems,
    }));
  }, [items]);

  const deleteItem = (itemId: number) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const deleteCard = (riderName: string) => {
    setItems((prev) => prev.filter((item) => item.riderName !== riderName));
  };

  return (
    <div className="ars-page h-full overflow-auto p-3 md:p-4">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-3">
        {cards.map((card) => (
          <div
            key={card.riderName}
            className="ars-list-card border-emerald-100 p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <RiderAvatar
                  riderName={card.riderName}
                  language={i18n.language}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-800">
                    {getRiderSeed(card.riderName)
                      ? getEmployeeDisplayName(
                          getRiderSeed(card.riderName)!,
                          i18n.language
                        )
                      : card.riderName}
                  </p>
                  <p className="text-[11px] font-semibold text-emerald-700">
                    {card.paidItems.length} paid item
                  </p>
                </div>
              </div>
              <button
                onClick={() => deleteCard(card.riderName)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                title="Delete card"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="mt-3 space-y-1.5">
              {card.paidItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-emerald-50 px-2.5 py-1.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-700">
                      {item.category}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {formatDate(item.date)} • {item.amount} SAR
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="relative group/paid">
                      <button className="rounded-full bg-white p-1 text-emerald-700 shadow-sm">
                        <Info size={12} />
                      </button>
                      <div style={{ insetInlineEnd: 0 }} className="ars-floating-menu absolute top-full z-20 mt-2 hidden w-48 rounded-xl border border-emerald-100 p-3 text-xs shadow-xl group-hover/paid:block">
                        <p className="font-black text-slate-700">Paid Entries</p>
                        <div className="mt-2 space-y-1">
                          {item.paidEntries.map((entry) => (
                            <div
                              key={entry.id}
                              className="flex justify-between rounded-lg bg-slate-50 px-2 py-1"
                            >
                              <span>{formatDate(entry.date)}</span>
                              <span className="font-bold text-emerald-700">
                                {entry.amount} SAR
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-red-600"
                      title="Delete item"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {cards.length === 0 && (
        <div className="ars-card rounded-2xl py-8 text-center">
          <p className="text-sm text-slate-400">No paid transactions found</p>
        </div>
      )}
    </div>
  );
}
