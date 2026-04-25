import { useState } from 'react';
import {
  Search,
  Plus,
  UserSquare,
  CheckCircle,
  XCircle,
  Eye,
  Clock,
} from 'lucide-react';

interface IdRequest {
  id: number;
  name: string;
  employeeId: string;
  department: string;
  status: 'pending' | 'approved' | 'rejected';
  submitted: string;
}

export default function IDManager() {
  const [search, setSearch] = useState('');

  const requests: IdRequest[] = [
    {
      id: 1,
      name: 'Md. Rahim',
      employeeId: 'EMP001',
      department: 'Operations',
      status: 'pending',
      submitted: '2025-01-25',
    },
    {
      id: 2,
      name: 'Fatema Begum',
      employeeId: 'EMP002',
      department: 'HR',
      status: 'approved',
      submitted: '2025-01-20',
    },
    {
      id: 3,
      name: 'Shahidul Islam',
      employeeId: 'EMP003',
      department: 'Drivers',
      status: 'rejected',
      submitted: '2025-01-22',
    },
  ];

  const statusIcon = {
    pending: <Clock size={14} className="text-yellow-500" />,
    approved: <CheckCircle size={14} className="text-emerald-500" />,
    rejected: <XCircle size={14} className="text-red-500" />,
  };

  const filtered = requests.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.employeeId.includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-slate-800">ID Manager</h1>
        <button className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2">
          <Plus size={16} /> New Request
        </button>
      </div>

      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="Search by name or ID..."
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
                  Name
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600">
                  Employee ID
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600">
                  Department
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600">
                  Submitted
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-slate-600">
                  Status
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-800">
                    {req.name}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {req.employeeId}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {req.department}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {new Date(req.submitted).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1.5">
                      {statusIcon[req.status]}
                      <span className="capitalize text-xs">{req.status}</span>
                    </div>
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
