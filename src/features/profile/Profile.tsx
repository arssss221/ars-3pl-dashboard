import React, { useState, useRef } from 'react';
import {
  Building2, Camera, Check, Copy, Edit3, Globe2, Mail, Phone, Plus, X, FileText,
  Download, Eye, UploadCloud, Briefcase
} from 'lucide-react';

type DocumentItem = { id: string; name: string; url: string; type: 'image' | 'pdf' } | null;

interface CompanyProfile {
  logo: string;
  englishName: string;
  arabicName: string;
  crNumber: string;
  vatNumber: string;
  ibans: string[];
  phone1: string;
  phone2: string;
  email: string;
  website: string;
  documents: DocumentItem[];
}

const COMPANY_PROFILE_KEY = 'ars-company-profile';

const defaultProfile: CompanyProfile = {
  logo: '',
  englishName: 'ARS Logistics Manager',
  arabicName: 'شركة ايه آر إس للخدمات اللوجستية',
  crNumber: '1010923456',
  vatNumber: '300987654300003',
  ibans: ['SA1234567890123456789012'],
  phone1: '+966 50 111 2233',
  phone2: '+966 50 444 5566',
  email: 'info@arslogisticsmanager.com',
  website: 'arslogisticsmanager.com',
  documents: [null, null, null, null, null]
};

const loadProfile = (): CompanyProfile => {
  try {
    const stored = localStorage.getItem(COMPANY_PROFILE_KEY);
    return stored ? { ...defaultProfile, ...JSON.parse(stored) } : defaultProfile;
  } catch {
    return defaultProfile;
  }
};

const saveProfile = (profile: CompanyProfile) => {
  localStorage.setItem(COMPANY_PROFILE_KEY, JSON.stringify(profile));
  window.dispatchEvent(
    new CustomEvent('ars-company-profile-updated', { detail: profile })
  );
};

export default function Profile() {
  const [profile, setProfileState] = useState<CompanyProfile>(loadProfile);
  const [toast, setToast] = useState('');
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);

  const setProfile = (updater: React.SetStateAction<CompanyProfile>) => {
    setProfileState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      saveProfile(next);
      return next;
    });
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2000);
  };

  const updateField = (field: keyof CompanyProfile, value: string) => {
    setProfile(p => ({ ...p, [field]: value }));
    showToast('Updated successfully');
  };

  const addIban = () => {
    setProfile(p => ({ ...p, ibans: [...p.ibans, ''] }));
  };
  
  const updateIban = (index: number, value: string) => {
    const newIbans = [...profile.ibans];
    newIbans[index] = value;
    setProfile(p => ({ ...p, ibans: newIbans }));
    showToast('IBAN updated');
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeDocIndex, setActiveDocIndex] = useState<number | null>(null);

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || activeDocIndex === null) return;
    
    const type = file.type.includes('pdf') ? 'pdf' : 'image';
    const reader = new FileReader();
    reader.onload = () => {
      const newDocs = [...profile.documents];
      newDocs[activeDocIndex] = {
        id: Math.random().toString(),
        name: file.name,
        url: reader.result as string,
        type
      };
      setProfile(p => ({ ...p, documents: newDocs }));
      showToast('Document uploaded');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
    setActiveDocIndex(null);
  };

  const triggerUpload = (index: number) => {
    setActiveDocIndex(index);
    fileInputRef.current?.click();
  };

  const downloadFile = (doc: DocumentItem) => {
    if (!doc) return;
    const a = document.createElement('a');
    a.href = doc.url;
    a.download = doc.name;
    a.click();
  };

  return (
    <div className="h-full bg-slate-50 p-4 md:p-6 overflow-auto">
      <div className="mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-4 md:gap-5 items-start">
        
        {/* Sidebar: Company Identity */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 flex flex-col items-center text-center gap-6">
           <div className="relative group w-32 h-32 shrink-0">
             <div className="w-full h-full rounded-[2rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
               {profile.logo ? (
                 <img src={profile.logo} alt="Logo" className="w-full h-full object-contain" />
               ) : (
                 <Building2 className="text-slate-300" size={48} />
               )}
             </div>
             <label className="absolute inset-0 bg-slate-900/40 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem] flex items-center justify-center cursor-pointer backdrop-blur-sm">
               <Camera size={24} />
               <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                 const file = e.target.files?.[0];
                 if(file) {
                    const r = new FileReader();
                    r.onload = () => updateField('logo', r.result as string);
                    r.readAsDataURL(file);
                 }
               }} />
             </label>
           </div>

           <div className="w-full space-y-5">
             <EditableField 
               label="Company Name" 
               value={profile.englishName} 
               onSave={(v) => updateField('englishName', v)} 
               onCopy={() => navigator.clipboard.writeText(profile.englishName)} 
               large
             />
             <EditableField 
               label="اسم الشركة (Arabic Name)" 
               value={profile.arabicName} 
               onSave={(v) => updateField('arabicName', v)} 
               onCopy={() => navigator.clipboard.writeText(profile.arabicName)} 
               rtl 
               large
             />
           </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
          
          <BentoBox title="Registration" icon={<Briefcase size={16} />}>
             <EditableField label="CR Number" value={profile.crNumber} onSave={(v) => updateField('crNumber', v)} onCopy={() => navigator.clipboard.writeText(profile.crNumber)} />
             <EditableField label="VAT Number" value={profile.vatNumber} onSave={(v) => updateField('vatNumber', v)} onCopy={() => navigator.clipboard.writeText(profile.vatNumber)} />
          </BentoBox>

          <BentoBox title="Contact Details" icon={<Phone size={16} />}>
             <EditableField label="Primary Phone" value={profile.phone1} onSave={(v) => updateField('phone1', v)} onCopy={() => navigator.clipboard.writeText(profile.phone1)} icon={<Phone size={14}/>} />
             <EditableField label="Secondary Phone" value={profile.phone2} onSave={(v) => updateField('phone2', v)} onCopy={() => navigator.clipboard.writeText(profile.phone2)} icon={<Phone size={14}/>} />
             <EditableField label="Email" value={profile.email} onSave={(v) => updateField('email', v)} onCopy={() => navigator.clipboard.writeText(profile.email)} icon={<Mail size={14}/>} />
             <EditableField label="Website" value={profile.website} onSave={(v) => updateField('website', v)} onCopy={() => navigator.clipboard.writeText(profile.website)} icon={<Globe2 size={14}/>} />
          </BentoBox>

          <BentoBox title="Banking & Finance" icon={<Globe2 size={16} />} className="md:col-span-2">
            <div className="grid gap-3 sm:grid-cols-2">
              {profile.ibans.map((iban, idx) => (
                <div key={idx} className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <EditableField label={`IBAN ${idx + 1}`} value={iban} onSave={(v) => updateIban(idx, v)} onCopy={() => navigator.clipboard.writeText(iban)} />
                  </div>
                </div>
              ))}
              <button 
                onClick={addIban} 
                className="bg-emerald-50 text-emerald-600 rounded-2xl p-3 border border-emerald-100 border-dashed flex flex-col items-center justify-center gap-1 hover:bg-emerald-100 transition min-h-[72px]"
              >
                <Plus size={20} />
                <span className="text-xs font-black uppercase tracking-wider">Add IBAN</span>
              </button>
            </div>
          </BentoBox>

          <BentoBox title="Company Documents (5 Slots)" icon={<FileText size={16} />} className="md:col-span-2">
             <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
               {profile.documents.map((doc, idx) => (
                 <div key={idx} className="relative group aspect-square rounded-[1.5rem] border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                   {doc ? (
                     <>
                       {doc.type === 'image' ? (
                         <img src={doc.url} alt={doc.name} className="w-full h-full object-cover" />
                       ) : (
                         <div className="flex flex-col items-center text-slate-400 p-2 text-center">
                           <FileText size={28} className="text-emerald-500 mb-2" />
                           <span className="text-[10px] font-bold truncate w-full">{doc.name}</span>
                         </div>
                       )}
                       {/* Hover Actions */}
                       <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]">
                          <div className="flex gap-2">
                            <button onClick={() => setPreviewDoc(doc)} className="h-8 w-8 flex items-center justify-center bg-white rounded-full text-slate-700 hover:text-emerald-600 hover:scale-110 transition shadow-sm" title="View">
                              <Eye size={14} />
                            </button>
                            <button onClick={() => downloadFile(doc)} className="h-8 w-8 flex items-center justify-center bg-white rounded-full text-slate-700 hover:text-blue-600 hover:scale-110 transition shadow-sm" title="Download">
                              <Download size={14} />
                            </button>
                          </div>
                          <button onClick={() => triggerUpload(idx)} className="text-[10px] font-black uppercase tracking-wider bg-white/20 text-white px-3 py-1.5 rounded-full hover:bg-white/30 transition" title="Replace">
                            Replace
                          </button>
                       </div>
                     </>
                   ) : (
                     <button onClick={() => triggerUpload(idx)} className="w-full h-full flex flex-col items-center justify-center text-slate-400 hover:bg-slate-100 transition hover:text-emerald-600">
                       <UploadCloud size={24} className="mb-2 opacity-50" />
                       <span className="text-[10px] font-black uppercase tracking-wider opacity-70">Slot {idx + 1}</span>
                     </button>
                   )}
                 </div>
               ))}
             </div>
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleDocUpload} />
          </BentoBox>

        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-2.5 rounded-full shadow-2xl text-sm font-bold flex items-center gap-2 animate-in slide-in-from-bottom-4 fade-in">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Check size={12} strokeWidth={3} />
          </span>
          {toast}
        </div>
      )}

      {previewDoc && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 flex items-center justify-center p-4 backdrop-blur-sm transition-opacity" onClick={() => setPreviewDoc(null)}>
          <div className="relative max-w-5xl w-full bg-white rounded-[2rem] p-4 flex flex-col shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4 px-2">
              <h3 className="font-black text-slate-800">{previewDoc.name}</h3>
              <button onClick={() => setPreviewDoc(null)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-hidden rounded-[1.5rem] bg-slate-100 flex items-center justify-center min-h-[60vh] border border-slate-200">
               {previewDoc.type === 'image' ? (
                 <img src={previewDoc.url} alt={previewDoc.name} className="max-w-full max-h-[70vh] object-contain" />
               ) : (
                 <iframe src={previewDoc.url} className="w-full h-[70vh] rounded-[1.5rem]" title={previewDoc.name} />
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BentoBox({ title, icon, children, className = '' }: { title: string, icon: React.ReactNode, children: React.ReactNode, className?: string }) {
  return (
    <div className={`bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60 flex flex-col gap-4 ${className}`}>
      <div className="flex items-center gap-2 text-slate-800 pb-2 border-b border-slate-100">
        <span className="flex h-8 w-8 items-center justify-center bg-slate-50 rounded-xl text-slate-500 border border-slate-100">{icon}</span>
        <h2 className="font-black text-sm uppercase tracking-wider">{title}</h2>
      </div>
      <div className="flex flex-col gap-3">
        {children}
      </div>
    </div>
  );
}

function EditableField({ label, value, onSave, onCopy, rtl, icon, large }: { label: string, value: string, onSave: (v: string) => void, onCopy: () => void, rtl?: boolean, icon?: React.ReactNode, large?: boolean }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const handleSave = () => {
    onSave(draft);
    setIsEditing(false);
  };

  return (
    <div className={`group relative flex flex-col gap-1 w-full ${rtl ? 'text-right items-end' : 'text-left items-start'}`}>
      <span className={`text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5 ${rtl ? 'flex-row-reverse' : ''}`}>
        {icon && <span className="text-slate-300">{icon}</span>}
        {label}
      </span>
      {isEditing ? (
        <div className={`flex gap-2 items-center w-full mt-1 ${rtl ? 'flex-row-reverse' : ''}`}>
          <input
            autoFocus
            dir={rtl ? 'rtl' : 'ltr'}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="flex-1 bg-white border border-emerald-300 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 outline-none focus:ring-4 ring-emerald-50 shadow-sm"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <button onClick={handleSave} className="h-9 w-9 flex items-center justify-center bg-emerald-500 text-white rounded-xl shadow-sm hover:bg-emerald-600 transition"><Check size={16}/></button>
          <button onClick={() => { setIsEditing(false); setDraft(value); }} className="h-9 w-9 flex items-center justify-center bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition"><X size={16}/></button>
        </div>
      ) : (
        <div className={`flex items-start w-full gap-2 ${rtl ? 'flex-row-reverse' : ''}`}>
           <div className="flex-1 min-w-0">
             <p dir={rtl ? 'rtl' : 'ltr'} className={`font-black text-slate-800 break-words ${large ? 'text-xl md:text-2xl' : 'text-sm'} ${!value && 'text-slate-300 font-medium italic'}`}>
               {value || 'Not provided'}
             </p>
           </div>
           <div className={`opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 shrink-0 ${rtl ? 'mr-2' : 'ml-2'}`}>
             <button onClick={() => setIsEditing(true)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="Edit"><Edit3 size={14}/></button>
             <button onClick={onCopy} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Copy"><Copy size={14}/></button>
           </div>
        </div>
      )}
    </div>
  );
}
