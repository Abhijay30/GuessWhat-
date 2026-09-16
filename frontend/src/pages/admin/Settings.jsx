import { useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function AdminSettings() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileMsg, setProfileMsg] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  async function handleProfileSave(e) {
    e.preventDefault();
    setProfileMsg('');
    const res = await api.patch('/auth/profile', { name, phone });
    setUser(res.data.user);
    localStorage.setItem('brandflow_user', JSON.stringify(res.data.user));
    setProfileMsg('Profile updated.');
  }

  async function handlePasswordSave(e) {
    e.preventDefault();
    setPasswordMsg('');
    if (newPassword !== confirmPassword) {
      setPasswordMsg('New passwords do not match.');
      return;
    }
    try {
      await api.patch('/auth/profile', { currentPassword, newPassword });
      setPasswordMsg('Password updated.');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      setPasswordMsg(err.response?.data?.error || 'Failed to update password.');
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-slate-900">Settings</h1>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <form onSubmit={handleProfileSave} className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Profile Information</h2>
          <div className="space-y-3">
            <Field label="Name" value={name} onChange={setName} />
            <Field label="Email" value={user?.email} disabled />
            <Field label="Phone" value={phone} onChange={setPhone} />
          </div>
          {profileMsg && <p className="mt-2 text-xs text-emerald-600">{profileMsg}</p>}
          <button type="submit" className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover">
            Update Profile
          </button>
        </form>

        <form onSubmit={handlePasswordSave} className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Change Password</h2>
          <div className="space-y-3">
            <Field label="Current Password" type="password" value={currentPassword} onChange={setCurrentPassword} />
            <Field label="New Password" type="password" value={newPassword} onChange={setNewPassword} />
            <Field label="Confirm New Password" type="password" value={confirmPassword} onChange={setConfirmPassword} />
          </div>
          {passwordMsg && <p className="mt-2 text-xs text-slate-600">{passwordMsg}</p>}
          <button type="submit" className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover">
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', disabled }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      <input
        type={type}
        value={value || ''}
        disabled={disabled}
        onChange={(e) => onChange && onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
      />
    </div>
  );
}
