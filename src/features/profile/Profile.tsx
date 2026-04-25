import { useState } from 'react';
import { User, Mail, Phone, Building2, Shield, Save, Camera } from 'lucide-react';

export default function Profile() {
  const user = JSON.parse(localStorage.getItem('userSession') || '{}');

  const [form, setForm] = useState({
    name: user?.name || 'Md. Rahim',
    email: user?.email || 'rahim@arslogisticsmanager.com',
    phone: '+880 1712 345678',
    company: 'ARS Logistics Manager',
    role: user?.role || 'owner',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <h1 className="text-xl font-bold text-slate-800">My Profile</h1>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="relative h-24 bg-gradient-to-r from-emerald-600 to-emerald-800"></div>
        <div className="relative px-5 pb-5">
          <div className="flex justify-between items-end -mt-10">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-white p-1 shadow-md">
                <div className="h-full w-full rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-2xl">
                  {form.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <button className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-md border border-slate-200">
                <Camera size={14} className="text-slate-500" />
              </button>
            </div>
            <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <Save size={16} /> Save Changes
            </button>
          </div>

          <div className="mt-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 flex items-center gap-1"><User size={12} /> Full Name</label>
                <input name="name" value={form.name} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-200" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 flex items-center gap-1"><Mail size={12} /> Email</label>
                <input name="email" value={form.email} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 flex items-center gap-1"><Phone size={12} /> Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-600 flex items-center gap-1"><Building2 size={12} /> Company</label>
                <input name="company" value={form.company} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Shield size={14} className="text-emerald-500" /> Role:{' '}
                <span className="font-semibold text-slate-700 capitalize">{form.role}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
