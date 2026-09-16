import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/AdminLayout';
import ClientLayout from './components/ClientLayout';
import TicketDetail from './components/TicketDetail';

import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import AdminClients from './pages/admin/Clients';
import AdminCalendarPage from './pages/admin/CalendarPage';
import AdminTickets from './pages/admin/Tickets';
import AdminSettings from './pages/admin/Settings';

import ClientDashboard from './pages/client/Dashboard';
import ClientCalendarPage from './pages/client/CalendarPage';
import ClientActivities from './pages/client/Activities';
import ClientTickets from './pages/client/Tickets';
import ClientNotifications from './pages/client/Notifications';
import ClientProfile from './pages/client/Profile';

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/portal'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<Login />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="clients" element={<AdminClients />} />
            <Route path="calendar" element={<AdminCalendarPage />} />
            <Route path="tickets" element={<AdminTickets />} />
            <Route path="tickets/:id" element={<TicketDetail isAdmin backTo="/admin/tickets" />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route
            path="/portal"
            element={
              <ProtectedRoute role="client">
                <ClientLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ClientDashboard />} />
            <Route path="calendar" element={<ClientCalendarPage />} />
            <Route path="activities" element={<ClientActivities />} />
            <Route path="tickets" element={<ClientTickets />} />
            <Route path="tickets/:id" element={<TicketDetail backTo="/portal/tickets" />} />
            <Route path="notifications" element={<ClientNotifications />} />
            <Route path="profile" element={<ClientProfile />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
