import { useState, useEffect } from 'react';

export default function ProfileForm({ user, onSave, onCancel }: any) {
  const [formData, setFormData] = useState({
    name: '', branch: 'Driver', status: 'Working', phone: '',
  });

  useEffect(() => {
    if (user) setFormData(user);
    else setFormData({ name: '', branch: 'Driver', status: 'Working', phone: '' });
  }, [user]);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-6">{user ? 'Edit' : 'Add New'} Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        <div>
          <label>Name</label>
          <input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border p-2 rounded outline-blue-500" />
        </div>
        <div>
          <label>Phone</label>
          <input required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full border p-2 rounded outline-blue-500" />
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="flex-1 bg-gray-200 p-2 rounded">Cancel</button>
          <button type="submit" className="flex-1 bg-blue-600 text-white p-2 rounded">Save</button>
        </div>
      </form>
    </div>
  );
}