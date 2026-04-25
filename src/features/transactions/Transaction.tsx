import { useState } from 'react';
import { Search, Plus, TrendingUp, TrendingDown, Eye } from 'lucide-react';

interface TransactionItem {
  id: number;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
}

export default function Transaction() {
  const [search, setSearch] = useState('');

  const transactions: TransactionItem[] = [
    {
      id: 1,
      date: '2025-01-25',
      description: 'Client payment - ABC Logistics',
      amount: 25000,
      type: 'income',
      category: 'Revenue',
    },
    {
      id: 2,
      date: '2025-01-24',
      description: 'Fuel purchase',
      amount: 8500,
      type: 'expense',
      category: 'Fuel',
    },
    {
      id: 3,
      date: '2025-01-23',
      description: 'Vehicle service',
      amount: 12000,
      type: 'expense',
      category: 'Maintenance',
    },
    {
      id: 4,
      date: '2025-01-22',
      description: 'Salary payment',
      amount: 45000,
      type: 'expense',
      category: 'Payroll',
    },
    {
      id: 5,
      date: '2025-01-21',
      description: 'Client payment - XYZ Ltd',
      amount: 32000,
      type: 'income',
      category: 'Revenue',
    },
  ];

  const filtered = transactions.filter((t) =>
    t.description.toLowerCase().includes(search.toLowerCase())
  );

  const totalIncome = filtered
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filtered
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-800">Transaction</h1>
        <button className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2">
          <Plus size={16} /> Add Transaction
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3">
          <div className="flex items-center gap-2 text-emerald-600">
            <TrendingUp size={16} /> Income
          </div>
          <p className="text-xl font-bold text-slate-800">
            ৳{totalIncome.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3">
          <div className="flex items-center gap-2 text-red-500">
            <TrendingDown size={16} /> Expense
          </div>
          <p className="text-xl font-bold text-slate-800">
            ৳{totalExpense.toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-3">
          <div className="flex items-center gap-2 text-emerald-600">
            Balance
          </div>
          <p className="text-xl font-bold text-slate-800">
            ৳{balance.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="Search transactions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600">
                  Date
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600">
                  Description
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600">
                  Category
                </th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-slate-600">
                  Amount
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 text-slate-600">
                    {new Date(t.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">
                    {t.description}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{t.category}</td>
                  <td
                    className={`px-4 py-2.5 text-right font-semibold ${
                      t.type === 'income' ? 'text-emerald-600' : 'text-red-500'
                    }`}
                  >
                    {t.type === 'income' ? '+' : '-'} ৳
                    {t.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5">
                    <button className="p-1 hover:bg-slate-100 rounded">
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
