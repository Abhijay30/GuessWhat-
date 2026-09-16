import { useState } from 'react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

export default function ClientProfile() {
  const { user, company, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [msg, setMsg] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  async function handleSave(e) {
    e.preventDefault();
    const res = await api.patch('/auth/profile', { name, phone });
    setUser(res.data.user);
    localStorage.setItem('brandflow_user', JSON.stringify(res.data.user));
    setMsg('Profile updated.');
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
      <h1 className="mb-6 text-xl font-semibold text-slate-900">Profile</h1>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Company</h2>
          <div className="space-y-3 text-sm">
            <Row label="Company Name" value={company?.name} />
            <Row label="Contact Person" value={company?.contactPerson} />
            <Row label="Email" value={company?.email} />
            <Row label="Phone" value={company?.phone} />
          </div>
          <p className="mt-3 text-xs text-slate-400">To update company details, contact your account manager.</p>
        </div>

        <div className="space-y-4">
          <form onSubmit={handleSave} className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Your Details</h2>
            <div className="space-y-3">
              <Field label="Name" value={name} onChange={setName} />
              <Field label="Email" value={user?.email} disabled />
              <Field label="Phone" value={phone} onChange={setPhone} />
            </div>
            {msg && <p className="mt-2 text-xs text-emerald-600">{msg}</p>}
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
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b border-slate-100 pb-2 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-700">{value || '—'}</span>
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
