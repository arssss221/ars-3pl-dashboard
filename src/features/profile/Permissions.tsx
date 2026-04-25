import { Shield, Plus, Lock, CheckCircle } from 'lucide-react';

export default function Permissions() {
  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-2.5 flex justify-between items-center">
        <div className="flex items-center gap-2 overflow-x-auto">
          {['Roles', 'Access Logs', 'Security'].map((tab) => (
            <button
              key={tab}
              className="whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-tighter bg-slate-100 text-slate-600 hover:bg-slate-800 hover:text-white transition-all"
            >
              {tab}
            </button>
          ))}
        </div>
        <button className="bg-slate-800 text-white px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2">
          <Plus size={14} /> New Role
        </button>
      </div>

      <div className="p-6 space-y-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
              <Shield size={20} />
            </div>
            <div>
              <p className="font-bold text-slate-800">Admin Role</p>
              <p className="text-[10px] text-slate-500">
                Full system access and user management.
              </p>
            </div>
          </div>
          <CheckCircle className="text-emerald-500" size={18} />
        </div>
      </div>
    </div>
  );
}
