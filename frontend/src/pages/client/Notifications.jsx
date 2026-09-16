import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';

// Maps linkType to the portal route for that resource
function resolveLink(linkType, linkId) {
  if (!linkType || !linkId) return null;
  if (linkType === 'ticket') return `/portal/tickets/${linkId}`;
  if (linkType === 'event') return `/portal/calendar`; // events live on the calendar page
  return null;
}

export default function ClientNotifications() {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  function load() {
    api.get('/notifications').then((res) => setNotifications(res.data));
    // Tell ClientLayout sidebar to refresh its unread badge
    window.dispatchEvent(new Event('notifications-updated'));
  }
  useEffect(load, []);

  async function markAllRead() {
    await api.patch('/notifications/read-all');
    load();
  }

  async function handleClick(n) {
    // Mark as read first (if unread)
    if (!n.read) {
      await api.patch(`/notifications/${n.id}/read`);
      load();
    }
    // Navigate to the linked resource if one exists
    const dest = resolveLink(n.linkType, n.linkId);
    if (dest) navigate(dest);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Notifications</h1>
        <button onClick={markAllRead} className="text-sm text-accent hover:underline">
          Mark all as read
        </button>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {notifications.map((n) => {
          const dest = resolveLink(n.linkType, n.linkId);
          const isClickable = !n.read || !!dest;
          return (
            <div
              key={n.id}
              onClick={() => handleClick(n)}
              className={`flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-0 transition
                ${!n.read ? 'bg-indigo-50/40' : ''}
                ${isClickable ? 'cursor-pointer hover:bg-slate-50' : ''}
              `}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-700">{n.message}</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <p className="text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
                  {dest && (
                    <span className="text-xs font-medium text-accent hover:underline">
                      {n.linkType === 'ticket' ? 'View ticket →' : 'View on calendar →'}
                    </span>
                  )}
                </div>
              </div>
              {!n.read && <span className="ml-3 h-2 w-2 shrink-0 rounded-full bg-accent" />}
            </div>
          );
        })}
        {notifications.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-slate-400">No notifications yet.</p>
        )}
      </div>
    </div>
  );
}
