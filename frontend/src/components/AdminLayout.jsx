import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, Ticket, Settings, LogOut, Bell, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/clients', label: 'Clients', icon: Users },
  { to: '/admin/calendar', label: 'Calendar', icon: Calendar },
  { to: '/admin/tickets', label: 'Tickets', icon: Ticket },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showBell, setShowBell] = useState(false);
  const bellRef = useRef(null);

  function loadNotifications() {
    api.get('/notifications').then((res) => setNotifications(res.data)).catch(() => {});
  }
  useEffect(loadNotifications, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function onOutsideClick(e) {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setShowBell(false);
      }
    }
    document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, []);

  async function markAllRead() {
    await api.patch('/notifications/read-all');
    loadNotifications();
  }

  async function markOneRead(n) {
    if (!n.read) {
      await api.patch(`/notifications/${n.id}/read`);
      loadNotifications();
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="flex w-60 flex-col bg-navy text-slate-300">
        <div className="flex items-center gap-2 px-5 py-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white font-bold">G</div>
          <div>
            <div className="text-sm font-semibold text-white">GuessWhat?!</div>
            <div className="text-xs text-slate-400">Admin Panel</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
                  isActive ? 'bg-accent text-white' : 'hover:bg-navy-light hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
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
        <header className="flex items-center justify-end gap-4 border-b border-slate-200 bg-white px-6 py-3">
          {/* Bell with unread badge + dropdown */}
          <div ref={bellRef} className="relative">
            <button
              onClick={() => setShowBell((v) => !v)}
              className="relative rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
            >
              <Bell size={18} />
              {unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {showBell && (
              <div className="absolute right-0 top-10 z-50 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
                  <span className="text-sm font-medium text-slate-700">Notifications</span>
                  <div className="flex items-center gap-2">
                    {unread > 0 && (
                      <button onClick={markAllRead} className="text-xs text-accent hover:underline">
                        Mark all read
                      </button>
                    )}
                    <button onClick={() => setShowBell(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-slate-400">No notifications.</p>
                  ) : (
                    notifications.slice(0, 20).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markOneRead(n)}
                        className={`border-b border-slate-100 px-4 py-3 last:border-0 ${
                          !n.read ? 'cursor-pointer bg-indigo-50/40 hover:bg-indigo-50' : ''
                        }`}
                      >
                        <p className="text-sm text-slate-700">{n.message}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
                        {!n.read && <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-accent" />}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-medium text-white">
              {user?.name?.[0] || 'A'}
            </div>
            <span className="text-sm font-medium text-slate-700">{user?.name}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
