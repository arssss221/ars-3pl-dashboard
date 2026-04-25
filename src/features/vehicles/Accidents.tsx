{/*src/pages/vehicles/Accidents.tsx*/}
import { useState } from 'react';
import { Search, Plus, AlertTriangle, Calendar, FileText } from 'lucide-react';

interface AccidentRecord {
  id: number;
  vehicleNo: string;
  date: string;
  location: string;
  description: string;
  severity: 'minor' | 'moderate' | 'severe';
}

export default function Accidents() {
  const [search, setSearch] = useState('');

  const accidents: AccidentRecord[] = [
    { id: 1, vehicleNo: 'KA-01-1234', date: '2025-01-15', location: 'Uttara, Dhaka', description: 'Rear-end collision', severity: 'minor' },
    { id: 2, vehicleNo: 'KA-02-5678', date: '2025-01-20', location: 'Gulshan, Dhaka', description: 'Side swipe', severity: 'moderate' },
  ];

  const severityColor = {
    minor: 'bg-yellow-100 text-yellow-700',
    moderate: 'bg-orange-100 text-orange-700',
    severe: 'bg-red-100 text-red-700',
  };

  const filtered = accidents.filter(a => a.vehicleNo.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-800">Accidents</h1>
        <button className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2">
          <Plus size={16} /> Report Accident
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by vehicle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((acc) => (
          <div key={acc.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-500" />
                <h3 className="font-semibold text-slate-800">{acc.vehicleNo}</h3>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${severityColor[acc.severity]}`}>
                {acc.severity}
              </span>
            </div>
            <div className="mt-2 space-y-1 text-sm">
              <p className="flex items-center gap-1"><Calendar size={12} className="text-slate-400"/> {new Date(acc.date).toLocaleDateString()}</p>
              <p><span className="text-slate-500">Location:</span> {acc.location}</p>
              <p className="text-slate-600 text-xs flex items-start gap-1"><FileText size={12} className="mt-0.5"/> {acc.description}</p>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl"><p className="text-slate-400">No accident records</p></div>
        )}
      </div>
    </div>
  );
}