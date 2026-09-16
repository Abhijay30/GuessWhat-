import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import api from '../../api/client';
import CalendarGrid from '../../components/CalendarGrid';
import StatusBadge from '../../components/StatusBadge';

const CATEGORIES = ['Social Media', 'Event', 'Campaign', 'Content', 'Other'];

export default function ClientCalendarPage() {
  const [cursor, setCursor] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selected, setSelected] = useState(null);
  const [pastFeedback, setPastFeedback] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [sent, setSent] = useState(false);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  function load() {
    // Fetch all events for this company — no month filter so seeded data
    // always appears regardless of when it was created. The grid only
    // renders cells for the current month so out-of-month events are ignored.
    const params = {};
    if (categoryFilter !== 'All') params.category = categoryFilter;
    api.get('/events', { params }).then((res) => setEvents(res.data));
  }
  useEffect(load, [categoryFilter]);

  function openEvent(ev) {
    setSelected(ev);
    setFeedback('');
    setSent(false);
    // Load existing feedback for this event
    api.get(`/events/${ev.id}/feedback`)
      .then((res) => setPastFeedback(res.data))
      .catch(() => setPastFeedback([]));
  }

  async function submitFeedback(e) {
    e.preventDefault();
    if (!feedback.trim()) return;
    await api.post(`/events/${selected.id}/feedback`, { message: feedback });
    setFeedback('');
    setSent(true);
    // Reload feedback thread
    api.get(`/events/${selected.id}/feedback`).then((res) => setPastFeedback(res.data));
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">Calendar</h1>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <button
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-medium text-slate-700">
          {cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <button
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <CalendarGrid year={year} month={month} events={events} onEventClick={openEvent} />

      {selected && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 p-4">
          <div
            className="w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-lg"
            style={{ maxHeight: '90vh' }}
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <StatusBadge status={selected.status} />
                <h2 className="mt-2 text-lg font-semibold text-slate-900">{selected.title}</h2>
                <p className="text-xs text-slate-400">
                  {selected.category}
                  {selected.date && ` · ${new Date(selected.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
                  {selected.time && ` · ${selected.time}`}
                </p>
                {selected.platform && (
                  <p className="text-xs text-slate-400">Platform: {selected.platform}</p>
                )}
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
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

            {/* Past feedback thread */}
            {pastFeedback.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Previous Feedback</p>
                <div className="space-y-2">
                  {pastFeedback.map((f) => (
                    <div key={f.id} className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-sm text-slate-700">{f.message}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{f.senderName}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New feedback form */}
            <form onSubmit={submitFeedback} className="border-t border-slate-100 pt-4">
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Feedback / Questions
              </label>
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
                {sent && (
                  <p className="text-xs text-emerald-600">
                    Thanks — your note was sent to the team.
                  </p>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
