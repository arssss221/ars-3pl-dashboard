import { useState, type ChangeEvent, useEffect } from 'react';
import {
  Bell,
  Building2,
  CheckCircle,
  Cloud,
  Database,
  Globe2,
  Lock,
  Save,
  Smartphone,
  Wifi,
  Languages,
  ShieldAlert,
  HardDrive,
  Upload,
} from 'lucide-react';

interface SettingsData {
  companyName: string;
  arabicName: string;
  branch: string;
  country: string;
  timezone: string;
  currency: string;
  language: string;
  logo: string;
  emailAlerts: boolean;
  paperAlerts: boolean;
  fleetAlerts: boolean;
  financeAlerts: boolean;
  autoBackup: boolean;
  strictPermissions: boolean;
  twoFactorAuth: boolean;
}

export default function Settings() {
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'security'>('general');
  const [settings, setSettings] = useState<SettingsData>({
    companyName: 'ARS 3PL Logistics',
    arabicName: 'شركة ايه آر إس للخدمات اللوجستية',
    branch: 'Riyadh Main Operation',
    country: 'Saudi Arabia',
    timezone: 'Asia/Riyadh',
    currency: 'SAR',
    language: 'English / Arabic',
    logo: '',
    emailAlerts: true,
    paperAlerts: true,
    fleetAlerts: true,
    financeAlerts: true,
    autoBackup: true,
    strictPermissions: true,
    twoFactorAuth: false,
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem('ars-system-settings');
    const savedProfile = localStorage.getItem('ars-company-profile');
    
    if (savedSettings) {
      setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
    }
    
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setSettings(prev => ({
        ...prev,
        companyName: profile.englishName || prev.companyName,
        arabicName: profile.arabicName || prev.arabicName,
        logo: profile.logo || prev.logo
      }));
    }
  }, []);

  const handleTextChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleToggle = (key: keyof SettingsData) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    // Save system settings
    localStorage.setItem('ars-system-settings', JSON.stringify({
      branch: settings.branch,
      country: settings.country,
      timezone: settings.timezone,
      currency: settings.currency,
      language: settings.language,
      emailAlerts: settings.emailAlerts,
      paperAlerts: settings.paperAlerts,
      fleetAlerts: settings.fleetAlerts,
      financeAlerts: settings.financeAlerts,
      autoBackup: settings.autoBackup,
      strictPermissions: settings.strictPermissions,
      twoFactorAuth: settings.twoFactorAuth,
    }));

    // Update Company Profile (used by Layout)
    const newProfile = {
      englishName: settings.companyName,
      arabicName: settings.arabicName,
      logo: settings.logo,
    };
    localStorage.setItem('ars-company-profile', JSON.stringify(newProfile));
    
    // Dispatch event so Layout updates immediately
    window.dispatchEvent(new CustomEvent('ars-company-profile-updated', { detail: newProfile }));

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-full bg-slate-50/50 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">System Settings</h1>
            <p className="mt-1 text-sm text-slate-500">Configure your company profile, notifications, and security preferences.</p>
          </div>
          <button 
            onClick={handleSave}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 ${
              saved ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-900 hover:bg-slate-800'
            }`}
          >
            {saved ? <CheckCircle size={18} /> : <Save size={18} />}
            {saved ? 'Settings Saved' : 'Save Changes'}
          </button>
        </header>

        {/* System Status Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatusCard icon={<Wifi size={20} />} title="System Status" value="Online & Synced" tone="emerald" />
          <StatusCard icon={<Cloud size={20} />} title="Cloud Backup" value={settings.autoBackup ? 'Auto-Sync ON' : 'Manual Mode'} tone="sky" />
          <StatusCard icon={<Lock size={20} />} title="Security Policy" value={settings.strictPermissions ? 'Strict Mode' : 'Standard'} tone="amber" />
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Left Sidebar Menu */}
          <aside className="w-full md:w-64 shrink-0 space-y-2">
            <TabButton 
              active={activeTab === 'general'} 
              onClick={() => setActiveTab('general')} 
              icon={<Building2 size={18} />} 
              label="General Settings" 
            />
            <TabButton 
              active={activeTab === 'notifications'} 
              onClick={() => setActiveTab('notifications')} 
              icon={<Bell size={18} />} 
              label="Notifications" 
            />
            <TabButton 
              active={activeTab === 'security'} 
              onClick={() => setActiveTab('security')} 
              icon={<ShieldAlert size={18} />} 
              label="Security & Backup" 
            />
          </aside>

          {/* Right Content Panel */}
          <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            
            {/* GENERAL SETTINGS */}
            {activeTab === 'general' && (
              <div className="space-y-8 animate-in fade-in">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Company Identity</h2>
                  <p className="text-sm text-slate-500 mb-5">This information will be displayed on the dashboard and official documents.</p>
                  
                  <div className="flex items-start gap-6">
                    {/* Logo Upload */}
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 group">
                        {settings.logo ? (
                          <img src={settings.logo} alt="Logo" className="h-full w-full object-contain p-2" />
                        ) : (
                          <Building2 size={32} className="text-slate-300" />
                        )}
                        <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                          <Upload size={20} className="text-white" />
                          <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                        </label>
                      </div>
                      <span className="text-xs font-medium text-slate-500">Company Logo</span>
                    </div>

                    <div className="flex-1 space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <InputGroup label="Company Name (English)" name="companyName" value={settings.companyName} onChange={handleTextChange} icon={<Building2 size={16} />} />
                        <InputGroup label="Company Name (Arabic)" name="arabicName" value={settings.arabicName} onChange={handleTextChange} icon={<Languages size={16} />} dir="rtl" />
                      </div>
                      <InputGroup label="Branch / HQ" name="branch" value={settings.branch} onChange={handleTextChange} icon={<Smartphone size={16} />} />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-100"></div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-5">Localization</h2>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <SelectGroup label="Country" name="country" value={settings.country} onChange={handleTextChange} icon={<Globe2 size={16} />} options={['Saudi Arabia', 'United Arab Emirates', 'Qatar', 'Bangladesh']} />
                    <SelectGroup label="Timezone" name="timezone" value={settings.timezone} onChange={handleTextChange} icon={<Globe2 size={16} />} options={['Asia/Riyadh', 'Asia/Dubai', 'Asia/Dhaka', 'UTC']} />
                    <SelectGroup label="Currency" name="currency" value={settings.currency} onChange={handleTextChange} icon={<Database size={16} />} options={['SAR', 'AED', 'QAR', 'BDT', 'USD']} />
                    <SelectGroup label="Default Language" name="language" value={settings.language} onChange={handleTextChange} icon={<Languages size={16} />} options={['English / Arabic', 'English Only', 'Arabic Only']} />
                  </div>
                </div>
              </div>
            )}

            {/* NOTIFICATION SETTINGS */}
            {activeTab === 'notifications' && (
              <div className="space-y-6 animate-in fade-in">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Alert Preferences</h2>
                  <p className="text-sm text-slate-500 mb-5">Control which notifications you want to receive on your dashboard.</p>
                </div>
                
                <div className="space-y-4">
                  <ToggleSetting 
                    label="Email Summaries" 
                    description="Receive a daily digest of all operational activities directly to your inbox." 
                    enabled={settings.emailAlerts} 
                    onToggle={() => handleToggle('emailAlerts')} 
                  />
                  <ToggleSetting 
                    label="Paperwork Expiry Alerts" 
                    description="Get notified before employee Iqamas, contracts, and insurances expire." 
                    enabled={settings.paperAlerts} 
                    onToggle={() => handleToggle('paperAlerts')} 
                  />
                  <ToggleSetting 
                    label="Fleet Maintenance Alerts" 
                    description="Automated alerts for oil changes, periodic servicing, and permit renewals." 
                    enabled={settings.fleetAlerts} 
                    onToggle={() => handleToggle('fleetAlerts')} 
                  />
                  <ToggleSetting 
                    label="Finance & Ledger Alerts" 
                    description="Stay updated on outstanding balances, dues, and paid transactions." 
                    enabled={settings.financeAlerts} 
                    onToggle={() => handleToggle('financeAlerts')} 
                  />
                </div>
              </div>
            )}

            {/* SECURITY SETTINGS */}
            {activeTab === 'security' && (
              <div className="space-y-8 animate-in fade-in">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Access & Security</h2>
                  <p className="text-sm text-slate-500 mb-5">Protect your company data and manage backup policies.</p>
                </div>
                
                <div className="space-y-4 border-b border-slate-100 pb-8">
                  <ToggleSetting 
                    label="Strict Role Permissions" 
                    description="Enforce rigid access control. Users will be completely blocked from viewing unauthorized URLs." 
                    enabled={settings.strictPermissions} 
                    onToggle={() => handleToggle('strictPermissions')} 
                  />
                  <ToggleSetting 
                    label="Two-Factor Authentication (2FA)" 
                    description="Require a secondary code for all Admin and Owner level accounts upon login." 
                    enabled={settings.twoFactorAuth} 
                    onToggle={() => handleToggle('twoFactorAuth')} 
                  />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900 mb-5">Data Backup</h2>
                  <div className="space-y-4">
                    <ToggleSetting 
                      label="Automatic Cloud Backup" 
                      description="Silently backup your database to secure cloud storage every 24 hours." 
                      enabled={settings.autoBackup} 
                      onToggle={() => handleToggle('autoBackup')} 
                    />
                    
                    <div className="mt-6 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm text-slate-600">
                          <HardDrive size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">Manual Database Export</p>
                          <p className="text-xs text-slate-500">Download a complete CSV backup of your system.</p>
                        </div>
                      </div>
                      <button className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 transition">
                        Export Data
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

// --- Helper Components ---

function StatusCard({ icon, title, value, tone }: { icon: ReactNode, title: string, value: string, tone: 'emerald' | 'sky' | 'amber' }) {
  const styles = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    sky: 'bg-sky-50 text-sky-700 border-sky-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
  }[tone];

  return (
    <div className={`flex items-center gap-4 rounded-2xl border p-4 shadow-sm ${styles}`}>
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wider opacity-80">{title}</p>
        <p className="text-sm font-bold mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
        active 
          ? 'bg-slate-900 text-white shadow-md' 
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function InputGroup({ label, name, value, onChange, icon, dir = 'ltr' }: any) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
          {icon}
        </div>
        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          dir={dir}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500"
        />
      </div>
    </div>
  );
}

function SelectGroup({ label, name, value, onChange, icon, options }: any) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
          {icon}
        </div>
        <select
          name={name}
          value={value}
          onChange={onChange}
          className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-sm font-medium text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 cursor-pointer"
        >
          {options.map((opt: string) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 pointer-events-none">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function ToggleSetting({ label, description, enabled, onToggle }: { label: string, description: string, enabled: boolean, onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4 transition hover:bg-slate-50">
      <div>
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <button 
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          enabled ? 'bg-emerald-500' : 'bg-slate-300'
        }`}
      >
        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`} />
      </button>
    </div>
  );
}
