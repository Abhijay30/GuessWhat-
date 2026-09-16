import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';

const TABS = ['All', 'Open', 'In Progress', 'Resolved'];

export default function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [tab, setTab] = useState('All');
  const [companies, setCompanies] = useState([]);
  const [companyFilter, setCompanyFilter] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/companies').then((res) => setCompanies(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const params = {};
    if (tab !== 'All') params.status = tab;
    if (companyFilter !== 'All') params.companyId = companyFilter;
    api.get('/tickets', { params }).then((res) => setTickets(res.data));
  }, [tab, companyFilter]);

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold text-slate-900">Tickets</h1>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        {/* Status tabs */}
        <div className="flex gap-1 border-b border-slate-200">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium ${
                tab === t ? 'border-b-2 border-accent text-accent' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Company filter */}
        <select
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        >
          <option value="All">All Clients</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Ticket ID</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((t) => (
              <tr
                key={t.id}
                onClick={() => navigate(`/admin/tickets/${t.id}`)}
                className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
              >
                <td className="px-4 py-3 font-medium text-accent">#{t.id}</td>
                <td className="px-4 py-3 text-slate-600">{t.Company?.name}</td>
                <td className="px-4 py-3 text-slate-700">{t.subject}</td>
                <td className="px-4 py-3"><StatusBadge status={t.priority} /></td>
                <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">No tickets.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
