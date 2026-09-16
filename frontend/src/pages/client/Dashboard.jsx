import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, CheckCircle2, Ticket as TicketIcon } from 'lucide-react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';

const CARDS = [
  { key: 'upcomingActivities', label: 'Upcoming Activities', icon: Calendar,     link: '/portal/calendar'    },
  { key: 'inProgress',         label: 'In Progress',         icon: Clock,        link: '/portal/activities'  },
  { key: 'completedThisMonth', label: 'Completed',           icon: CheckCircle2, link: '/portal/activities'  },
  { key: 'openTickets',        label: 'Open Tickets',        icon: TicketIcon,   link: '/portal/tickets'     },
];

export default function ClientDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard/client').then((res) => setData(res.data));
  }, []);

  if (!data) return <p className="text-slate-500">Loading…</p>;

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold text-slate-900">Good morning, {user.name}! 👋</h1>
      <p className="mb-6 text-sm text-slate-500">Here's what's happening this month.</p>

      {/* Stat cards — entire card clickable */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map(({ key, label, icon: Icon, link }) => (
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
              <div className="rounded-lg bg-indigo-50 p-2 text-accent"><Icon size={18} /></div>
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
            <Link to="/portal/calendar" className="text-xs font-normal text-accent hover:underline">View All</Link>
          </h2>
          <div className="space-y-2">
            {data.upcomingActivitiesList.length === 0 && (
              <p className="text-sm text-slate-400">Nothing scheduled.</p>
            )}
            {data.upcomingActivitiesList.map((ev) => (
              <div
                key={ev.id}
                onClick={() => navigate('/portal/calendar')}
                className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5 hover:bg-slate-50"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {ev.title}
                  </p>
                  <p className="text-xs text-slate-400">{ev.category}</p>
                </div>
                <StatusBadge status={ev.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity / Notifications */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 flex items-center justify-between text-sm font-semibold text-slate-900">
            Recent Activity
            <Link to="/portal/notifications" className="text-xs font-normal text-accent hover:underline">View All</Link>
          </h2>
          <div className="space-y-2">
            {data.recentNotifications.length === 0 && (
              <p className="text-sm text-slate-400">No recent activity.</p>
            )}
            {data.recentNotifications.map((n) => {
              // If the notification links to a ticket, clicking navigates there
              const dest = n.linkType === 'ticket' && n.linkId
                ? `/portal/tickets/${n.linkId}`
                : '/portal/notifications';
              return (
                <div
                  key={n.id}
                  onClick={() => navigate(dest)}
                  className="cursor-pointer rounded-lg border border-slate-100 px-3 py-2.5 hover:bg-slate-50"
                >
                  <p className="text-sm text-slate-700">{n.message}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 p-3">
            <span className="text-sm text-slate-600">Need something?</span>
            <button
              onClick={() => navigate('/portal/tickets')}
              className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-hover"
            >
              Raise Ticket
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
