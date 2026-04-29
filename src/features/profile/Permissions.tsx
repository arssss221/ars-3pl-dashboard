import { useState, useRef, useEffect } from 'react';
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  X,
  User as UserIcon,
  CheckCircle,
  XCircle,
  Camera,
} from 'lucide-react';

interface PermissionLevel {
  view: boolean;
  edit: boolean;
}

type ModuleKey = 'dashboard' | 'employees' | 'vehicles' | 'idManager' | 'transaction' | 'settings';

const moduleNames: Record<ModuleKey, string> = {
  dashboard: 'Dashboard',
  employees: 'Employees',
  vehicles: 'Vehicles',
  idManager: 'ID Manager',
  transaction: 'Transaction',
  settings: 'Settings',
};

interface UserPermissions {
  dashboard: PermissionLevel;
  employees: PermissionLevel;
  vehicles: PermissionLevel;
  idManager: PermissionLevel;
  transaction: PermissionLevel;
  settings: PermissionLevel;
}

interface UserData {
  id: string;
  fullName: string;
  idNumber: string;
  phoneNumber: string;
  roleName: string;
  username: string;
  password?: string;
  profilePicture?: string;
  permissions: UserPermissions;
  isOwner?: boolean;
}

const defaultPermissions = (): UserPermissions => ({
  dashboard: { view: false, edit: false },
  employees: { view: false, edit: false },
  vehicles: { view: false, edit: false },
  idManager: { view: false, edit: false },
  transaction: { view: false, edit: false },
  settings: { view: false, edit: false },
});

export default function Permissions() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);

  useEffect(() => {
    // Load session user and initialize if it's the first time
    const sessionData = localStorage.getItem('userSession');
    let sessionUser = null;
    if (sessionData) {
      sessionUser = JSON.parse(sessionData);
    }
    
    // Only set initial if empty, in a real app this would fetch from DB
    const initialUsers: UserData[] = [
      {
        id: sessionUser?.id || '1',
        fullName: sessionUser?.name || 'System Owner',
        idNumber: 'OWN-001',
        phoneNumber: sessionUser?.phone || '+1234567890',
        roleName: 'Owner',
        username: sessionUser?.email?.split('@')[0] || 'owner_admin',
        password: 'securepassword', // Don't show real password in UI
        profilePicture: sessionUser?.profilePicture || '',
        isOwner: true,
        permissions: {
          dashboard: { view: true, edit: true },
          employees: { view: true, edit: true },
          vehicles: { view: true, edit: true },
          idManager: { view: true, edit: true },
          transaction: { view: true, edit: true },
          settings: { view: true, edit: true },
        },
      },
    ];
    setUsers(initialUsers);
  }, []);

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter((u) => u.id !== id));
    }
  };

  const handleSaveUser = (user: UserData) => {
    if (editingUser) {
      setUsers(users.map((u) => (u.id === user.id ? user : u)));
      
      // If editing the owner, update the session data so Layout header reflects the change
      if (user.isOwner) {
        const sessionData = localStorage.getItem('userSession');
        if (sessionData) {
          const sessionUser = JSON.parse(sessionData);
          sessionUser.name = user.fullName;
          sessionUser.profilePicture = user.profilePicture;
          localStorage.setItem('userSession', JSON.stringify(sessionUser));
          
          // Dispatch event to trigger re-render in Layout
          window.dispatchEvent(new Event('userSessionUpdated'));
        }
      }
    } else {
      setUsers([...users, { ...user, id: Date.now().toString() }]);
    }
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const openAddModal = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserData) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-full bg-slate-50/50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">Team & Permissions</h1>
            <p className="mt-1 text-sm text-slate-500">Manage your employees, assign roles, and control access levels.</p>
          </div>
          <button 
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Plus size={18} /> Add User
          </button>
        </header>

        {/* User Cards Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <UserCard 
              key={user.id} 
              user={user} 
              onEdit={() => openEditModal(user)} 
              onDelete={() => handleDelete(user.id)} 
            />
          ))}
        </div>

      </div>

      {/* User Modal */}
      {isModalOpen && (
        <UserModal 
          user={editingUser}
          onClose={() => {
            setIsModalOpen(false);
            setEditingUser(null);
          }} 
          onSave={handleSaveUser} 
        />
      )}
    </div>
  );
}

function UserCard({ user, onEdit, onDelete }: { user: UserData, onEdit: () => void, onDelete: () => void }) {
  return (
    <div className="relative flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      {user.isOwner && (
        <div className="absolute top-4 right-4 rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
          Owner
        </div>
      )}
      
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-slate-100 bg-slate-50 text-slate-400">
          {user.profilePicture ? (
            <img src={user.profilePicture} alt={user.fullName} className="h-full w-full object-cover" />
          ) : (
            <UserIcon size={28} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold text-slate-900">{user.fullName}</h3>
          <p className="text-sm font-medium text-emerald-600">{user.roleName}</p>
          <p className="mt-1 truncate text-xs text-slate-500">ID: {user.idNumber}</p>
        </div>
      </div>

      <div className="mt-6 flex-1 space-y-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Login Info</p>
          <p className="text-sm font-medium text-slate-700">@{user.username}</p>
        </div>
        
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Key Permissions</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(user.permissions) as ModuleKey[]).map(key => {
              const perm = user.permissions[key];
              if (perm.view || perm.edit) {
                return (
                  <span key={key} className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                    <Shield size={12} className="text-emerald-500" />
                    {moduleNames[key]}
                  </span>
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-4">
        <button 
          onClick={onEdit}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          <Edit2 size={16} /> Edit
        </button>
        {!user.isOwner && (
          <button 
            onClick={onDelete}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
          >
            <Trash2 size={16} /> Delete
          </button>
        )}
      </div>
    </div>
  );
}

function UserModal({ user, onClose, onSave }: { user: UserData | null, onClose: () => void, onSave: (user: UserData) => void }) {
  const [formData, setFormData] = useState<UserData>(user || {
    id: '',
    fullName: '',
    idNumber: '',
    phoneNumber: '',
    roleName: '',
    username: '',
    password: '',
    profilePicture: '',
    permissions: defaultPermissions(),
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof UserData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePermissionChange = (module: ModuleKey, type: 'view' | 'edit', checked: boolean) => {
    if (formData.isOwner) return; // Prevent changing owner permissions
    
    setFormData(prev => {
      const newPerms = { ...prev.permissions };
      newPerms[module] = { ...newPerms[module], [type]: checked };
      
      // If edit is true, view must be true
      if (type === 'edit' && checked) {
        newPerms[module].view = true;
      }
      // If view is false, edit must be false
      if (type === 'view' && !checked) {
        newPerms[module].edit = false;
      }
      
      return { ...prev, permissions: newPerms };
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange('profilePicture', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 sm:p-6 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl my-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-4 backdrop-blur">
          <h2 className="text-xl font-bold text-slate-900">{user ? 'Edit User details' : 'Add New User'}</h2>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid gap-8 lg:grid-cols-2">
            
            {/* Left Col - Details */}
            <div className="space-y-6">
              
              {/* Profile Pic */}
              <div className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 p-4 text-center bg-slate-50/50">
                <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-200 shadow-md group">
                  {formData.profilePicture ? (
                    <img src={formData.profilePicture} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <UserIcon size={32} className="text-slate-400" />
                  )}
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 inset-x-0 bg-black/40 py-1 text-white hover:bg-black/60 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Camera size={14} />
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    className="hidden" 
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">Profile Picture</p>
                  <p className="text-xs text-slate-500">Upload a photo for the user</p>
                </div>
              </div>

              {/* Personal Info */}
              <div className="space-y-4 rounded-xl border border-slate-200 p-5">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Personal Information</h3>
                
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Full Name</label>
                  <input required type="text" value={formData.fullName} onChange={(e) => handleChange('fullName', e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="e.g. John Doe" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">ID Number</label>
                    <input required type="text" value={formData.idNumber} onChange={(e) => handleChange('idNumber', e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="e.g. EMP-001" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Phone Number</label>
                    <input required type="tel" value={formData.phoneNumber} onChange={(e) => handleChange('phoneNumber', e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="+1234567890" />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Role Title</label>
                  <input required type="text" value={formData.roleName} onChange={(e) => handleChange('roleName', e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="e.g. Dispatcher, Accountant" disabled={formData.isOwner} />
                </div>
              </div>

              {/* Login Info */}
              <div className="space-y-4 rounded-xl border border-slate-200 p-5 bg-slate-50/50">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Login Credentials</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Username</label>
                    <input required type="text" value={formData.username} onChange={(e) => handleChange('username', e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="user_name" disabled={formData.isOwner} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
                    <input required={!formData.isOwner} type="password" value={formData.password} onChange={(e) => handleChange('password', e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="••••••••" disabled={formData.isOwner} />
                  </div>
                </div>
              </div>

            </div>

            {/* Right Col - Permissions */}
            <div className={`rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col h-full ${formData.isOwner ? 'opacity-70 pointer-events-none' : ''}`}>
              <div className="border-b border-slate-100 p-5 bg-slate-50 rounded-t-xl">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Page Permissions</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {formData.isOwner ? 'Owner has full access to all pages.' : 'Select what this user can view and edit.'}
                </p>
              </div>
              
              <div className="p-2 flex-1">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500">
                      <th className="px-4 py-3 font-semibold">Page Name</th>
                      <th className="px-4 py-3 font-semibold text-center w-24">Viewer</th>
                      <th className="px-4 py-3 font-semibold text-center w-24">Editor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(Object.keys(moduleNames) as ModuleKey[]).map((module) => (
                      <tr key={module} className="border-b border-slate-50 last:border-none hover:bg-slate-50/50 transition">
                        <td className="px-4 py-3.5 font-medium text-slate-800">{moduleNames[module]}</td>
                        <td className="px-4 py-3.5 text-center">
                          <label className="inline-flex cursor-pointer items-center justify-center p-1">
                            <input 
                              type="checkbox" 
                              checked={formData.permissions[module].view}
                              onChange={(e) => handlePermissionChange(module, 'view', e.target.checked)}
                              className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:opacity-50" 
                              disabled={formData.isOwner}
                            />
                          </label>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <label className="inline-flex cursor-pointer items-center justify-center p-1">
                            <input 
                              type="checkbox" 
                              checked={formData.permissions[module].edit}
                              onChange={(e) => handlePermissionChange(module, 'edit', e.target.checked)}
                              className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:opacity-50" 
                              disabled={formData.isOwner}
                            />
                          </label>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          <div className="sticky bottom-0 mt-8 flex items-center justify-end gap-3 border-t border-slate-100 bg-white pt-5">
            <button 
              type="button"
              onClick={onClose}
              className="rounded-lg px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="rounded-lg bg-emerald-600 px-8 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Save User Details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
