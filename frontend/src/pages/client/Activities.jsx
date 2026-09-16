import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';

const CATEGORIES = ['All', 'Social Media', 'Event', 'Campaign', 'Content', 'Other'];
const STATUSES = ['All', 'Planned', 'In Progress', 'Completed', 'Delayed'];

export default function ClientActivities() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [sent, setSent] = useState(false);

  function load() {
    const params = {};
    if (category !== 'All') params.category = category;
    if (status !== 'All') params.status = status;
    api.get('/events', { params }).then((res) => setEvents(res.data));
  }
  useEffect(load, [category, status]);

  function openDetail(ev) {
    setSelected(ev);
    setFeedback('');
    setSent(false);
  }

  async function submitFeedback(e) {
    e.preventDefault();
    if (!feedback.trim()) return;
    await api.post(`/events/${selected.id}/feedback`, { message: feedback });
    setFeedback('');
    setSent(true);
  }

  const filtered = events.filter((e) => e.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">Activities</h1>
        <div className="flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activities..."
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">
            {STATUSES.map((s) => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((ev) => (
          <div
            key={ev.id}
            onClick={() => openDetail(ev)}
            className="flex cursor-pointer items-center justify-between rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            <div>
              <p className="text-sm font-medium text-slate-800">{ev.title}</p>
              <p className="text-xs text-slate-400">
                {ev.category} · {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <StatusBadge status={ev.status} />
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-slate-400">No activities found.</p>}
      </div>

      {/* Activity detail modal */}
      {selected && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-lg" style={{ maxHeight: '90vh' }}>
            <div className="mb-3 flex items-start justify-between">
              <div>
                <StatusBadge status={selected.status} />
                <h2 className="mt-2 text-lg font-semibold text-slate-900">{selected.title}</h2>
                <p className="text-xs text-slate-400">
                  {selected.category}
                  {selected.date && ` · ${new Date(selected.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
                  {selected.time && ` · ${selected.time}`}
                </p>
                {selected.platform && <p className="text-xs text-slate-400">Platform: {selected.platform}</p>}
              </div>
              <button onClick={() => setSelected(null)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
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

            <form onSubmit={submitFeedback} className="border-t border-slate-100 pt-4">
              <label className="mb-1 block text-xs font-medium text-slate-500">Feedback / Questions</label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                placeholder="Leave your feedback or ask any questions..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="submit"
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
                >
                  Submit
                </button>
                {sent && <p className="text-xs text-emerald-600">Thanks — your note was sent to the team.</p>}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
