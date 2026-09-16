import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, Calendar, Ticket, CheckCircle2 } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';

const CARD_CONFIG = [
  { key: 'totalClients',       label: 'Total Clients',         icon: Users,        link: '/admin/clients'   },
  { key: 'upcomingActivities', label: 'Upcoming Activities',   icon: Calendar,     link: '/admin/calendar'  },
  { key: 'openTickets',        label: 'Open Tickets',          icon: Ticket,       link: '/admin/tickets'   },
  { key: 'completedThisMonth', label: 'Completed This Month',  icon: CheckCircle2, link: '/admin/calendar'  },
];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard/admin').then((res) => setData(res.data));
  }, []);

  if (!data) return <p className="text-slate-500">Loading…</p>;

  const { ticketsOverview } = data;
  const pct = (n) => (ticketsOverview.total ? Math.round((n / ticketsOverview.total) * 360) : 0);

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-slate-900">Dashboard</h1>

      {/* Stat cards — entire card is clickable */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARD_CONFIG.map(({ key, label, icon: Icon, link }) => (
          <div
            key={key}
            onClick={() => navigate(link)}
            className="cursor-pointer rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md hover:ring-1 hover:ring-accent/20"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{data[key]}</p>
              </div>
              <div className="rounded-lg bg-indigo-50 p-2 text-accent">
                <Icon size={18} />
              </div>
            </div>
            <p className="mt-3 text-xs text-accent">View →</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Upcoming Activities */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center justify-between text-sm font-semibold text-slate-900">
            Upcoming Activities
            <Link to="/admin/calendar" className="text-xs font-normal text-accent hover:underline">View All</Link>
          </h2>
          <div className="space-y-2">
            {data.upcomingActivitiesList.length === 0 && (
              <p className="text-sm text-slate-400">Nothing scheduled.</p>
            )}
            {data.upcomingActivitiesList.map((ev) => (
              <div
                key={ev.id}
                onClick={() => navigate('/admin/calendar')}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5 hover:bg-slate-50"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {ev.title}
                  </p>
                  <p className="text-xs text-slate-400">{ev.Company?.name}</p>
                </div>
                <StatusBadge status={ev.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Tickets Overview */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center justify-between text-sm font-semibold text-slate-900">
            Tickets Overview
            <Link to="/admin/tickets" className="text-xs font-normal text-accent hover:underline">View All</Link>
          </h2>

          {/* Donut chart + legend */}
          <div
            className="mb-4 flex cursor-pointer items-center gap-6"
            onClick={() => navigate('/admin/tickets')}
          >
            <div
              className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#ef4444 0deg ${pct(ticketsOverview.open)}deg, #3b82f6 ${pct(ticketsOverview.open)}deg ${pct(ticketsOverview.open) + pct(ticketsOverview.inProgress)}deg, #10b981 ${pct(ticketsOverview.open) + pct(ticketsOverview.inProgress)}deg 360deg)`,
              }}
            >
              <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full bg-white">
                <span className="text-lg font-semibold">{ticketsOverview.total}</span>
                <span className="text-[10px] text-slate-400">Total</span>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <p
                onClick={(e) => { e.stopPropagation(); navigate('/admin/tickets'); }}
                className="flex cursor-pointer items-center gap-2 hover:text-red-600"
              >
                <span className="h-2 w-2 rounded-full bg-red-500" /> Open {ticketsOverview.open}
              </p>
              <p
                onClick={(e) => { e.stopPropagation(); navigate('/admin/tickets'); }}
                className="flex cursor-pointer items-center gap-2 hover:text-blue-600"
              >
                <span className="h-2 w-2 rounded-full bg-blue-500" /> In Progress {ticketsOverview.inProgress}
              </p>
              <p
                onClick={(e) => { e.stopPropagation(); navigate('/admin/tickets'); }}
                className="flex cursor-pointer items-center gap-2 hover:text-emerald-600"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Resolved {ticketsOverview.resolved}
              </p>
            </div>
          </div>

          {/* Recent tickets — full row clickable */}
          <h3 className="mb-2 text-xs font-semibold uppercase text-slate-400">Recent Tickets</h3>
          <div className="space-y-2">
            {data.recentTickets.map((t) => (
              <div
                key={t.id}
                onClick={() => navigate(`/admin/tickets/${t.id}`)}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50"
              >
                <p className="text-sm font-medium text-slate-700">
                  <span className="text-accent">#{t.id}</span> {t.subject}
                </p>
                <StatusBadge status={t.status} />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
