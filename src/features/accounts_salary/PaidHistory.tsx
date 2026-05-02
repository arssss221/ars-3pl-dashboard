import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Image as ImageIcon, WalletCards } from 'lucide-react';

interface PaidSalarySheet {
  id: string;
  monthKey: string;
  reportTitle: string;
  savedAt: string;
  employeeCount: number;
  totalFinalSalary: number;
  images: string[];
}

const paidHistoryStorageKey = 'ars-paid-salary-sheets';

const loadPaidHistory = (): PaidSalarySheet[] => {
  try {
    const stored = localStorage.getItem(paidHistoryStorageKey);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export default function PaidHistory() {
  const { t } = useTranslation();
  const tr = (term: string) => t(`terms.${term}`, term);
  const [paidSheets, setPaidSheets] = useState<PaidSalarySheet[]>(loadPaidHistory);

  useEffect(() => {
    const syncPaidHistory = () => setPaidSheets(loadPaidHistory());
    window.addEventListener('storage', syncPaidHistory);
    window.addEventListener('ars-paid-salary-history-updated', syncPaidHistory);
    return () => {
      window.removeEventListener('storage', syncPaidHistory);
      window.removeEventListener('ars-paid-salary-history-updated', syncPaidHistory);
    };
  }, []);

  return (
    <section className="ars-page p-4 md:p-5">
      <div className="mb-4 ars-glass-panel rounded-2xl p-4 md:p-5">
        <h1 className="text-lg font-black text-slate-900 dark:text-slate-100">
          {tr('Paid History')}
        </h1>
        <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          {tr('Salary paid history module is ready for payment records.')}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {paidSheets.map((sheet) => (
          <article
            key={sheet.id}
            className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-normal text-slate-500">
                  {tr('Salary Sheet')}
                </p>
                <h2 className="mt-1 text-lg font-black text-slate-900 dark:text-slate-100">
                  {sheet.reportTitle}
                </h2>
              </div>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <WalletCards size={20} />
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm font-black">
              <div className="rounded-lg bg-slate-50 p-2 dark:bg-slate-950">
                <p className="text-slate-900 dark:text-slate-100">
                  {sheet.employeeCount}
                </p>
                <p className="text-[11px] text-slate-500">{tr('Employees')}</p>
              </div>
              <div className="rounded-lg bg-cyan-50 p-2 dark:bg-cyan-950/30">
                <p className="text-cyan-700">{sheet.totalFinalSalary.toFixed(2)}</p>
                <p className="text-[11px] text-slate-500">{tr('Final Salary')}</p>
              </div>
              <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-950/30">
                <p className="text-emerald-700">{sheet.images.length}</p>
                <p className="text-[11px] text-slate-500">{tr('Images')}</p>
              </div>
            </div>

            <p className="mt-3 flex items-center gap-2 text-xs font-bold text-slate-500">
              <CalendarDays size={14} />
              {new Date(sheet.savedAt).toLocaleDateString('en-GB')}
            </p>

            {sheet.images.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {sheet.images.slice(0, 4).map((image, index) => (
                  <img
                    key={`${sheet.id}_${index}`}
                    src={image}
                    alt={`${sheet.reportTitle} ${index + 1}`}
                    className="h-16 w-full rounded-lg border border-slate-200 object-cover dark:border-slate-700"
                  />
                ))}
              </div>
            )}

            {sheet.images.length === 0 && (
              <p className="mt-3 flex items-center gap-2 rounded-lg bg-amber-50 p-2 text-xs font-bold text-amber-800">
                <ImageIcon size={14} />
                {tr('No printed copy image attached.')}
              </p>
            )}
          </article>
        ))}

        {paidSheets.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-white/70 p-8 text-center dark:border-slate-700 dark:bg-slate-900/60">
            <p className="text-sm font-black text-slate-500">
              {tr('No paid salary sheet found yet.')}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
