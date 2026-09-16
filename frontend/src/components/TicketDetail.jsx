import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Send, CheckCircle, Circle, Clock } from 'lucide-react';
import api from '../api/client';
import StatusBadge from './StatusBadge';
import { useAuth } from '../context/AuthContext';

const STATUS_CONFIG = [
  { value: 'Open',        label: 'Open',        Icon: Circle,      activeClass: 'border-amber-400 bg-amber-50 text-amber-700',   iconClass: 'text-amber-500'  },
  { value: 'In Progress', label: 'In Progress',  Icon: Clock,       activeClass: 'border-blue-400 bg-blue-50 text-blue-700',      iconClass: 'text-blue-500'   },
  { value: 'Resolved',    label: 'Resolved',     Icon: CheckCircle, activeClass: 'border-emerald-400 bg-emerald-50 text-emerald-700', iconClass: 'text-emerald-500' },
];

export default function TicketDetail({ isAdmin, backTo }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [statusLoading, setStatusLoading] = useState(null); // which status value is loading
  const messagesEndRef = useRef(null);

  function load() {
    return api.get(`/tickets/${id}`).then((res) => setTicket(res.data));
  }

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages?.length]);

  async function handleSend(e) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      await api.post(`/tickets/${id}/messages`, { message: reply });
      setReply('');
      await load();
    } finally {
      setSending(false);
    }
  }

  async function updateStatus(newStatus) {
    if (ticket.status === newStatus) return; // already this status, do nothing
    setStatusLoading(newStatus);
    try {
      const res = await api.patch(`/tickets/${id}/status`, { status: newStatus });
      // Update ticket in state immediately from the response
      setTicket((prev) => ({ ...prev, status: res.data.status }));
      if (newStatus === 'Resolved') {
        setTimeout(() => navigate(backTo), 900);
      }
    } catch (err) {
      console.error('Failed to update ticket status:', err);
    } finally {
      setStatusLoading(null);
    }
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-slate-400">Loading ticket…</p>
      </div>
    );
  }

  const messages = ticket.messages || [];
  const isResolved = ticket.status === 'Resolved';

  return (
    <div>
      <button
        onClick={() => navigate(backTo)}
        className="mb-4 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ChevronLeft size={16} /> Back to Tickets
      </button>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.4fr]">

        {/* ── Left: ticket info + status ───────────────────────────────────── */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Ticket #{ticket.id}</span>
              <StatusBadge status={ticket.priority} />
            </div>
            <h1 className="mb-1 text-lg font-semibold text-slate-900">{ticket.subject}</h1>
            <p className="mb-1 text-xs text-slate-400">{ticket.Company?.name}</p>
            {ticket.category && <p className="mb-1 text-xs text-slate-400">Category: {ticket.category}</p>}
            <p className="mb-4 text-xs text-slate-400">
              Opened: {new Date(ticket.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
            <p className="text-sm leading-relaxed text-slate-600">{ticket.description}</p>
          </div>

          {/* Admin status control */}
          {isAdmin && (
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Ticket Status
              </p>
              <div className="flex flex-col gap-2">
                {STATUS_CONFIG.map(({ value, label, Icon, activeClass, iconClass }) => {
                  const isActive = ticket.status === value;
                  const isLoading = statusLoading === value;
                  return (
                    <button
                      key={value}
                      onClick={() => updateStatus(value)}
                      disabled={isLoading}
                      className={`flex items-center gap-3 rounded-lg border-2 px-4 py-2.5 text-sm font-medium transition-all ${
                        isActive
                          ? activeClass
                          : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <Icon size={16} className={isActive ? '' : iconClass} />
                      {isLoading ? 'Updating…' : label}
                      {isActive && (
                        <span className="ml-auto text-[11px] font-semibold opacity-70">● Current</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {!isResolved && (
                <button
                  onClick={() => updateStatus('Resolved')}
                  disabled={statusLoading !== null}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
                >
                  <CheckCircle size={16} />
                  {statusLoading === 'Resolved' ? 'Closing…' : 'Mark as Resolved & Close'}
                </button>
              )}

              {isResolved && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                  <CheckCircle size={16} />
                  Ticket resolved — redirecting…
                </div>
              )}
            </div>
          )}

          {/* Client status display */}
          {!isAdmin && (
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Status</p>
              <StatusBadge status={ticket.status} />
            </div>
          )}
        </div>

        {/* ── Right: conversation ───────────────────────────────────────────── */}
        <div className="flex flex-col rounded-xl bg-white shadow-sm" style={{ minHeight: 480 }}>
          <div className="border-b border-slate-100 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-slate-900">
              Conversation
              {messages.length > 0 && (
                <span className="ml-2 text-xs font-normal text-slate-400">({messages.length})</span>
              )}
            </h2>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-5">
            {messages.length === 0 ? (
              <p className="text-center text-sm text-slate-400">
                No messages yet. Send the first reply below.
              </p>
            ) : (
              messages.map((m) => {
                const isSelf = m.senderId === user?.id;
                return (
                  <div key={m.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm ${
                        isSelf
                          ? 'rounded-br-sm bg-accent text-white'
                          : 'rounded-bl-sm bg-slate-100 text-slate-800'
                      }`}
                    >
                      <p className="leading-relaxed">{m.message}</p>
                      <p className={`mt-1 text-[10px] ${isSelf ? 'text-indigo-200' : 'text-slate-400'}`}>
                        {m.senderName} · {new Date(m.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 border-t border-slate-100 p-4"
          >
            <input
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder={isResolved ? 'Ticket is resolved' : 'Type your response…'}
              disabled={isResolved}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
            />
            <button
              type="submit"
              disabled={sending || isResolved}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
            >
              <Send size={14} />
              {sending ? 'Sending…' : 'Send'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
