import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, Pencil, Trash2, Paperclip } from 'lucide-react';
import api from '../../api/client';
import CalendarGrid from '../../components/CalendarGrid';
import StatusBadge from '../../components/StatusBadge';

const CATEGORIES = ['Social Media', 'Event', 'Campaign', 'Content', 'Other'];
const STATUSES = ['Planned', 'In Progress', 'Completed', 'Delayed'];

function emptyForm() {
  return { companyId: '', title: '', category: 'Social Media', status: 'Planned', platform: '', date: '', time: '', description: '', notes: '' };
}

export default function AdminCalendarPage() {
  const [cursor, setCursor] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [companyFilter, setCompanyFilter] = useState('All');

  // Detail panel
  const [selected, setSelected] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Create / Edit form
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // event being edited (null = create mode)
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  function load() {
    const params = {};
    if (categoryFilter !== 'All') params.category = categoryFilter;
    if (companyFilter !== 'All') params.companyId = companyFilter;
    api.get('/events', { params }).then((res) => setEvents(res.data));
  }
  useEffect(load, [categoryFilter, companyFilter]);
  useEffect(() => { api.get('/companies').then((res) => setCompanies(res.data)); }, []);

  function shiftMonth(delta) {
    setCursor(new Date(year, month + delta, 1));
  }

  // ── Detail panel ─────────────────────────────────────────────────────────────

  function openDetail(ev) {
    setSelected(ev);
    loadAttachments(ev.id);
  }

  function loadAttachments(eventId) {
    api.get('/attachments', { params: { ownerType: 'event', ownerId: eventId } })
      .then((res) => setAttachments(res.data))
      .catch(() => setAttachments([]));
  }

  async function updateStatus(status) {
    await api.patch(`/events/${selected.id}`, { status });
    const updated = { ...selected, status };
    setSelected(updated);
    load();
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('ownerType', 'event');
      fd.append('ownerId', selected.id);
      await api.post('/attachments', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      loadAttachments(selected.id);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  // ── Create / Edit form ────────────────────────────────────────────────────────

  function openCreate(prefillDate = '') {
    setEditTarget(null);
    setForm({ ...emptyForm(), date: prefillDate });
    setShowForm(true);
  }

  function openEdit(ev) {
    setEditTarget(ev);
    setForm({
      companyId: ev.companyId ?? ev.Company?.id ?? '',
      title: ev.title ?? '',
      category: ev.category ?? 'Social Media',
      status: ev.status ?? 'Planned',
      platform: ev.platform ?? '',
      date: ev.date ?? '',
      time: ev.time ?? '',
      description: ev.description ?? '',
      notes: ev.notes ?? '',
    });
    setSelected(null);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editTarget) {
        await api.patch(`/events/${editTarget.id}`, form);
      } else {
        await api.post('/events', form);
      }
      setShowForm(false);
      setForm(emptyForm());
      setEditTarget(null);
      load();
    } finally {
      setSaving(false);
    }
  }

  // ── Delete event ──────────────────────────────────────────────────────────────

  async function handleDelete(id) {
    await api.delete(`/events/${id}`);
    setDeleteConfirm(null);
    setSelected(null);
    load();
  }

  // ── onDayClick — pre-fill date in create form ────────────────────────────────

  function handleDayClick(day) {
    // CalendarGrid passes a plain day number (1-31)
    const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    openCreate(iso);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">Calendar</h1>
        <div className="flex flex-wrap items-center gap-2">
          <select value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="All">All Clients</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            <option value="All">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button
            onClick={() => openCreate()}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            <Plus size={16} /> Add Event
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => shiftMonth(-1)} className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50"><ChevronLeft size={16} /></button>
        <span className="text-sm font-medium text-slate-700">{cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
        <button onClick={() => shiftMonth(1)} className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50"><ChevronRight size={16} /></button>
        <button onClick={() => setCursor(new Date())} className="ml-2 text-xs text-accent hover:underline">Today</button>
      </div>

      <CalendarGrid year={year} month={month} events={events} onEventClick={openDetail} onDayClick={handleDayClick} />

      {/* ── Event detail panel ─────────────────────────────────────────────────── */}
      {selected && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-lg" style={{ maxHeight: '90vh' }}>
            <div className="mb-3 flex items-start justify-between">
              <div>
                <StatusBadge status={selected.status} />
                <h2 className="mt-2 text-lg font-semibold text-slate-900">{selected.title}</h2>
                <p className="text-xs text-slate-400">{selected.Company?.name} · {selected.category}</p>
                {selected.date && <p className="text-xs text-slate-400">{new Date(selected.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}{selected.time && ` · ${selected.time}`}</p>}
                {selected.platform && <p className="text-xs text-slate-400">Platform: {selected.platform}</p>}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(selected)} title="Edit event" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-accent">
                  <Pencil size={15} />
                </button>
                <button onClick={() => setDeleteConfirm(selected.id)} title="Delete event" className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500">
                  <Trash2 size={15} />
                </button>
                <button onClick={() => setSelected(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                  <X size={18} />
                </button>
              </div>
            </div>

            <p className="mb-3 text-sm text-slate-600">{selected.description || 'No description.'}</p>

            {selected.notes && (
              <div className="mb-4">
                <p className="mb-1 text-xs font-semibold uppercase text-slate-400">Notes</p>
                <ul className="list-disc pl-4 text-sm text-slate-600">
                  {selected.notes.split('\n').map((n, i) => <li key={i}>{n}</li>)}
                </ul>
              </div>
            )}

            {/* Status buttons */}
            <div className="mb-4">
              <label className="mb-1 block text-xs font-medium text-slate-500">Update status</label>
              <div className="flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(s)}
                    className={`rounded-full px-3 py-1 text-xs ${selected.status === s ? 'bg-accent text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Attachments */}
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-500">Attachments</label>
              {attachments.length > 0 ? (
                <ul className="mb-2 space-y-1">
                  {attachments.map((a) => (
                    <li key={a.id} className="flex items-center gap-2 text-sm text-accent">
                      <Paperclip size={13} className="shrink-0 text-slate-400" />
                      <a href={`http://localhost:4000/uploads/${a.filePath.split(/[\\/]/).pop()}`} target="_blank" rel="noreferrer" className="hover:underline truncate">
                        {a.fileName}
                      </a>
                      <span className="text-xs text-slate-400">({Math.round(a.fileSize / 1024)} KB)</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mb-2 text-xs text-slate-400">No attachments yet.</p>
              )}
              <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-60"
              >
                <Paperclip size={13} />
                {uploading ? 'Uploading…' : 'Attach file'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirmation ──────────────────────────────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <h2 className="mb-2 text-base font-semibold text-slate-900">Delete event?</h2>
            <p className="mb-5 text-sm text-slate-500">
              This will permanently delete <strong>{events.find((e) => e.id === deleteConfirm)?.title || selected?.title}</strong>. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 rounded-lg border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create / Edit form ────────────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-lg" style={{ maxHeight: '90vh' }}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">{editTarget ? 'Edit Event' : 'Create New Event'}</h2>
              <button onClick={() => { setShowForm(false); setEditTarget(null); }}><X size={18} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">Client</label>
                <select required value={form.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  <option value="">Select client</option>
                  {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">Title</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Category</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Date</label>
                <input required type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Time (optional)</label>
                <input value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} placeholder="10:00 AM" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">Platform (optional)</label>
                <input value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-600">Notes (internal, one per line)</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="e.g. Approved by client&#10;Assets needed" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
              </div>
              <button type="submit" disabled={saving} className="col-span-2 rounded-lg bg-accent py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60">
                {saving ? 'Saving…' : editTarget ? 'Save Changes' : 'Create Event'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
