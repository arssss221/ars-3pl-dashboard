{/*src/pages/vehicles/Servicing.tsx*/}
import { useState } from 'react';
import { Search, Plus, Wrench, Calendar, AlertCircle } from 'lucide-react';

interface ServiceRecord {
  id: number;
  vehicleNo: string;
  serviceType: string;
  serviceDate: string;
  cost: number;
  status: 'completed' | 'scheduled' | 'overdue';
}

export default function Servicing() {
  const [search, setSearch] = useState('');

  const records: ServiceRecord[] = [
    {
      id: 1,
      vehicleNo: 'KA-01-1234',
      serviceType: 'General Checkup',
      serviceDate: '2025-01-10',
      cost: 4500,
      status: 'completed',
    },
    {
      id: 2,
      vehicleNo: 'KA-02-5678',
      serviceType: 'Engine Tuning',
      serviceDate: '2025-02-15',
      cost: 7800,
      status: 'scheduled',
    },
    {
      id: 3,
      vehicleNo: 'KA-03-9101',
      serviceType: 'Brake Pad Replacement',
      serviceDate: '2025-01-05',
      cost: 3200,
      status: 'overdue',
    },
  ];

  const statusStyles = {
    completed: 'bg-emerald-100 text-emerald-700',
    scheduled: 'bg-blue-100 text-blue-700',
    overdue: 'bg-red-100 text-red-700',
  };

  const filtered = records.filter((r) =>
    r.vehicleNo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-800">Servicing</h1>
        <button className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2">
          <Plus size={16} /> Schedule Service
        </button>
      </div>

      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="Search vehicle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((record) => (
          <div
            key={record.id}
            className="bg-white rounded-xl shadow-sm border border-slate-100 p-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <Wrench size={18} className="text-emerald-600" />
                <h3 className="font-semibold text-slate-800">
                  {record.vehicleNo}
                </h3>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                  statusStyles[record.status]
                }`}
              >
                {record.status}
              </span>
            </div>
            <div className="mt-2 space-y-1 text-sm">
              <p>
                <span className="text-slate-500">Service:</span>{' '}
                {record.serviceType}
              </p>
              <p className="flex items-center gap-1">
                <Calendar size={12} className="text-slate-400" />{' '}
                {new Date(record.serviceDate).toLocaleDateString()}
              </p>
              <p className="font-semibold text-emerald-600">
                ৳{record.cost.toLocaleString()}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end">
              <button className="text-xs text-emerald-600 hover:underline">
                Details →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
