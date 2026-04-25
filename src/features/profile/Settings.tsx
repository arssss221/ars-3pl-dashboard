import { Settings as SettingsIcon, Building, Bell, Globe } from 'lucide-react';

export default function Settings() {
  const menus = [
    {
      icon: Building,
      label: 'Company Profile',
      desc: 'Manage branch and business details',
    },
    {
      icon: Bell,
      label: 'Notification Settings',
      desc: 'Configure alerts and email triggers',
    },
    {
      icon: Globe,
      label: 'Language & Region',
      desc: 'Set timezones and system language',
    },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-2.5 flex justify-between items-center">
        <h1 className="text-xs font-black uppercase text-slate-500 tracking-widest">
          Preferences
        </h1>
        <button className="text-xs font-bold text-emerald-600 hover:underline">
          Reset Defaults
        </button>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {menus.map((m, i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-3xl border border-slate-100 hover:border-emerald-200 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                <m.icon size={24} />
              </div>
              <div>
                <p className="font-black text-slate-800 tracking-tight">
                  {m.label}
                </p>
                <p className="text-[11px] text-slate-500 font-medium">
                  {m.desc}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
