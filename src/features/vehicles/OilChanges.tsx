{/*src/pages/vehicles/OilChanges.tsx*/}
import { useState } from 'react';
import { Search, Plus, Droplets, Calendar, Wrench, Eye } from 'lucide-react';

interface OilRecord {
  id: number;
  vehicleNo: string;
  oilType: string;
  lastChange: string;
  nextDue: string;
  status: 'normal' | 'due' | 'overdue';
}

export default function OilChanges() {
  const [search, setSearch] = useState('');

  const records: OilRecord[] = [
    {
      id: 1,
      vehicleNo: 'KA-01-1234',
      oilType: 'Synthetic 5W-30',
      lastChange: '2024-12-10',
      nextDue: '2025-03-10',
      status: 'normal',
    },
    {
      id: 2,
      vehicleNo: 'KA-02-5678',
      oilType: 'Mineral 15W-40',
      lastChange: '2024-11-20',
      nextDue: '2025-02-20',
      status: 'due',
    },
    {
      id: 3,
      vehicleNo: 'KA-03-9101',
      oilType: 'Synthetic 10W-40',
      lastChange: '2024-09-05',
      nextDue: '2024-12-05',
      status: 'overdue',
    },
  ];

  const statusColor = {
    normal: 'bg-emerald-100 text-emerald-700',
    due: 'bg-yellow-100 text-yellow-700',
    overdue: 'bg-red-100 text-red-700',
  };

  const filtered = records.filter((r) =>
    r.vehicleNo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-xl font-bold text-slate-800">Oil Changes</h1>
        <button className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2">
          <Plus size={16} /> Record Oil Change
        </button>
      </div>

      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="Search by vehicle number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-200"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600">
                  Vehicle
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600">
                  Oil Type
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600">
                  Last Change
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600">
                  Next Due
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600">
                  Status
                </th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((record) => (
                <tr key={record.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-800">
                    {record.vehicleNo}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {record.oilType}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {new Date(record.lastChange).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {new Date(record.nextDue).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                        statusColor[record.status]
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <button className="p-1 hover:bg-slate-100 rounded">
                      <Eye size={14} className="text-slate-400" />
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
