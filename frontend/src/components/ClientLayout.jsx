import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Calendar, ListChecks, Ticket, Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const NAV = [
  { to: '/portal', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/portal/calendar', label: 'Calendar', icon: Calendar },
  { to: '/portal/activities', label: 'Activities', icon: ListChecks },
  { to: '/portal/tickets', label: 'Tickets', icon: Ticket },
  { to: '/portal/notifications', label: 'Notifications', icon: Bell, showCount: true },
  { to: '/portal/profile', label: 'Profile', icon: User },
];

export default function ClientLayout() {
  const { user, company, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  function refreshUnread() {
    api.get('/notifications').then((res) => {
      setUnread(res.data.filter((n) => !n.read).length);
    }).catch(() => {});
  }
  useEffect(() => {
    refreshUnread();
    // Re-check badge whenever the notifications page marks items read
    window.addEventListener('notifications-updated', refreshUnread);
    return () => window.removeEventListener('notifications-updated', refreshUnread);
  }, []);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="flex w-60 flex-col bg-navy text-slate-300">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white font-bold">G</div>
          <div>
            <div className="text-sm font-semibold text-white">GuessWhat?!</div>
            <div className="text-xs text-slate-400">Client Portal</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map(({ to, label, icon: Icon, end, showCount }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition ${
                  isActive ? 'bg-accent text-white' : 'hover:bg-navy-light hover:text-white'
                }`
              }
            >
              <span className="flex items-center gap-3">
                <Icon size={18} />
                {label}
              </span>
              {showCount && unread > 0 && (
                <span className="rounded-full bg-red-500 px-1.5 text-xs text-white">{unread}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="mx-3 mb-5 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-navy-light hover:text-white"
        >
          <LogOut size={18} />
          Log out
        </button>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center justify-end gap-3 border-b border-slate-200 bg-white px-6 py-3">
          <span className="text-sm font-medium text-slate-700">{company?.name || user?.name}</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-medium text-white">
            {(company?.name || user?.name || '?')[0]}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
