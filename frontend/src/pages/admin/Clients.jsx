import { useEffect, useState } from 'react';
import { Plus, X, Pencil, Trash2 } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';

const emptyForm = () => ({ name: '', contactPerson: '', email: '', phone: '', loginEmail: '', loginPassword: '' });

export default function Clients() {
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // company being edited (null = create mode)
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // company id to confirm delete

  function load() {
    api.get('/companies').then((res) => setCompanies(res.data));
  }
  useEffect(load, []);

  function openCreate() {
    setEditTarget(null);
    setForm(emptyForm());
    setShowForm(true);
  }

  function openEdit(c) {
    setEditTarget(c);
    setForm({ name: c.name, contactPerson: c.contactPerson || '', email: c.email || '', phone: c.phone || '', loginEmail: '', loginPassword: '' });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editTarget) {
        // Edit mode — only send non-login fields (login creds handled separately or left untouched)
        const payload = { name: form.name, contactPerson: form.contactPerson, email: form.email, phone: form.phone };
        if (form.loginEmail) payload.loginEmail = form.loginEmail;
        if (form.loginPassword) payload.loginPassword = form.loginPassword;
        await api.patch(`/companies/${editTarget.id}`, payload);
      } else {
        await api.post('/companies', form);
      }
      setShowForm(false);
      setForm(emptyForm());
      setEditTarget(null);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    await api.delete(`/companies/${id}`);
    setDeleteConfirm(null);
    load();
  }

  const filtered = companies.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Clients</h1>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
          <Plus size={16} /> Add Client
        </button>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search clients..."
        className="mb-4 w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
      />

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Client Name</th>
              <th className="px-4 py-3">Contact Person</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                <td className="px-4 py-3 text-slate-600">{c.contactPerson}</td>
                <td className="px-4 py-3 text-slate-600">{c.email}</td>
                <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEdit(c)}
                      title="Edit client"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-accent"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(c.id)}
                      title="Delete client"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">No clients found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">{editTarget ? 'Edit Client' : 'Add Client'}</h2>
              <button onClick={() => { setShowForm(false); setEditTarget(null); }}><X size={18} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input label="Company Name" required value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <Input label="Contact Person" value={form.contactPerson} onChange={(v) => setForm({ ...form, contactPerson: v })} />
              <Input label="Company Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
              <Input label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
              <hr className="my-2" />
              <p className="text-xs font-medium text-slate-500">
                {editTarget ? 'Update portal login (leave blank to keep existing)' : 'Client portal login (optional)'}
              </p>
              <Input label="Login Email" type="email" value={form.loginEmail} onChange={(v) => setForm({ ...form, loginEmail: v })} />
              <Input label="Login Password" type="password" value={form.loginPassword} onChange={(v) => setForm({ ...form, loginPassword: v })} />
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
              >
                {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Add Client'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h2 className="mb-2 text-base font-semibold text-slate-900">Delete client?</h2>
            <p className="mb-5 text-sm text-slate-500">
              This will permanently delete <strong>{companies.find((c) => c.id === deleteConfirm)?.name}</strong> and all their associated data. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 rounded-lg border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', required }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
      />
    </div>
  );
}
