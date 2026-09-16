const STYLES = {
  Planned: 'bg-amber-50 text-amber-700',
  'In Progress': 'bg-blue-50 text-blue-700',
  Completed: 'bg-emerald-50 text-emerald-700',
  Delayed: 'bg-red-50 text-red-700',
  Open: 'bg-red-50 text-red-700',
  Resolved: 'bg-emerald-50 text-emerald-700',
  Active: 'bg-emerald-50 text-emerald-700',
  Inactive: 'bg-red-50 text-red-700',
  High: 'bg-red-50 text-red-700',
  Medium: 'bg-amber-50 text-amber-700',
  Low: 'bg-slate-100 text-slate-600',
};

const DOTS = {
  Planned: 'bg-amber-500',
  'In Progress': 'bg-blue-500',
  Completed: 'bg-emerald-500',
  Delayed: 'bg-red-500',
  Open: 'bg-red-500',
  Resolved: 'bg-emerald-500',
  Active: 'bg-emerald-500',
  Inactive: 'bg-red-500',
  High: 'bg-red-500',
  Medium: 'bg-amber-500',
  Low: 'bg-slate-400',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`badge ${STYLES[status] || 'bg-slate-100 text-slate-600'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${DOTS[status] || 'bg-slate-400'}`} />
      {status}
    </span>
  );
}
