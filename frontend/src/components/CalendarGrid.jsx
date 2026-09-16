/**
 * CalendarGrid — Teams/Outlook-style monthly calendar.
 *
 * Each day cell shows:
 *  - All-day events as pill chips at the top (events with no time, or time = "")
 *  - Timed events as positioned blocks inside a mini time column, scaled by duration
 *
 * Props:
 *  - year, month  (0-indexed month)
 *  - events       array of CalendarEvent objects
 *  - onEventClick (ev) => void
 *  - onDayClick   (dayNumber) => void
 */

const CATEGORY_COLORS = {
  'Social Media': { bg: 'bg-emerald-500', light: 'bg-emerald-50 border-emerald-300 text-emerald-800', dot: 'bg-emerald-500' },
  Content:        { bg: 'bg-blue-500',    light: 'bg-blue-50 border-blue-300 text-blue-800',           dot: 'bg-blue-500' },
  Event:          { bg: 'bg-amber-500',   light: 'bg-amber-50 border-amber-300 text-amber-800',         dot: 'bg-amber-500' },
  Campaign:       { bg: 'bg-purple-500',  light: 'bg-purple-50 border-purple-300 text-purple-800',      dot: 'bg-purple-500' },
  Other:          { bg: 'bg-slate-400',   light: 'bg-slate-50 border-slate-300 text-slate-700',         dot: 'bg-slate-400' },
};

const STATUS_LEFT_BORDER = {
  Planned:     'border-l-amber-400',
  'In Progress': 'border-l-blue-500',
  Completed:   'border-l-emerald-500',
  Delayed:     'border-l-red-500',
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// DAY_HEIGHT: total px height of the timed section per day cell (8 am – 8 pm = 12 h)
const DAY_START_H = 8;   // 08:00
const DAY_END_H   = 20;  // 20:00
const TOTAL_HOURS = DAY_END_H - DAY_START_H; // 12
const DAY_HEIGHT  = 168; // px  — 14 px per hour

function buildMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const startPad = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/** Parse "HH:MM" or "HH:MM AM/PM" → fractional hours from midnight */
function parseTime(str) {
  if (!str) return null;
  const clean = str.trim().toUpperCase();
  const ampm = clean.includes('AM') || clean.includes('PM');
  const parts = clean.replace(/[APM\s]/g, '').split(':');
  let h = parseInt(parts[0], 10);
  const m = parseInt(parts[1] || '0', 10);
  if (ampm) {
    if (clean.includes('PM') && h !== 12) h += 12;
    if (clean.includes('AM') && h === 12) h = 0;
  }
  if (isNaN(h)) return null;
  return h + m / 60;
}

/** Returns top % and height % within [DAY_START_H, DAY_END_H] */
function timeToPosition(timeStr, durationHours = 1) {
  const h = parseTime(timeStr);
  if (h === null) return null;
  const clampedStart = Math.max(DAY_START_H, Math.min(DAY_END_H, h));
  const clampedEnd   = Math.max(DAY_START_H, Math.min(DAY_END_H, h + durationHours));
  const top    = ((clampedStart - DAY_START_H) / TOTAL_HOURS) * DAY_HEIGHT;
  const height = Math.max(18, ((clampedEnd - clampedStart) / TOTAL_HOURS) * DAY_HEIGHT);
  return { top, height };
}

function isToday(year, month, day) {
  const now = new Date();
  return now.getFullYear() === year && now.getMonth() === month && now.getDate() === day;
}

export default function CalendarGrid({ year, month, events, onDayClick, onEventClick }) {
  const cells = buildMonthGrid(year, month);

  // Only keep events that belong to this year+month, then group by day
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthEvents = events.filter((ev) => ev.date?.startsWith(monthStr));

  // Group events by day number
  const allDayByDay = {};
  const timedByDay  = {};

  monthEvents.forEach((ev) => {
    const day = Number(ev.date?.slice(8, 10));
    if (!day) return;
    const hasTime = ev.time && parseTime(ev.time) !== null;
    if (hasTime) {
      timedByDay[day] = timedByDay[day] || [];
      timedByDay[day].push(ev);
    } else {
      allDayByDay[day] = allDayByDay[day] || [];
      allDayByDay[day].push(ev);
    }
  });

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Weekday header */}
      <div className="grid grid-cols-7 border-b border-slate-200">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
            {w}
          </div>
        ))}
      </div>

      {/* Rows */}
      <div>
        {Array.from({ length: cells.length / 7 }, (_, row) => (
          <div key={row} className="grid grid-cols-7 border-b border-slate-100 last:border-0">
            {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
              const today = day ? isToday(year, month, day) : false;
              const allDay = day ? (allDayByDay[day] || []) : [];
              const timed  = day ? (timedByDay[day]  || []) : [];
              const hasTimed = timed.length > 0;

              return (
                <div
                  key={col}
                  onClick={() => day && onDayClick?.(day)}
                  className={`relative flex flex-col border-r border-slate-100 last:border-0 ${
                    day ? 'cursor-pointer' : 'bg-slate-50/60'
                  }`}
                  style={{ minHeight: hasTimed ? DAY_HEIGHT + 60 : 80 }}
                >
                  {/* Day number */}
                  {day && (
                    <div className="flex items-start justify-between px-2 pt-1.5 pb-1">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                          today
                            ? 'bg-accent text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {day}
                      </span>
                    </div>
                  )}

                  {/* All-day events — pill chips */}
                  {allDay.length > 0 && (
                    <div className="flex flex-col gap-0.5 px-1 pb-1">
                      {allDay.slice(0, 3).map((ev) => {
                        const colors = CATEGORY_COLORS[ev.category] || CATEGORY_COLORS.Other;
                        const border = STATUS_LEFT_BORDER[ev.status] || 'border-l-slate-300';
                        return (
                          <button
                            key={ev.id}
                            onClick={(e) => { e.stopPropagation(); onEventClick?.(ev); }}
                            title={ev.title}
                            className={`w-full truncate rounded border-l-2 px-1.5 py-0.5 text-left text-xs font-medium ${colors.light} ${border} hover:brightness-95`}
                          >
                            <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${colors.dot}`} />
                            {ev.title}
                          </button>
                        );
                      })}
                      {allDay.length > 3 && (
                        <span className="px-1.5 text-[11px] text-slate-400">+{allDay.length - 3} more</span>
                      )}
                    </div>
                  )}

                  {/* Timed events — positioned blocks */}
                  {hasTimed && (
                    <div
                      className="relative mx-1 mb-1 flex-1 rounded border border-slate-100 bg-slate-50/50"
                      style={{ height: DAY_HEIGHT }}
                    >
                      {/* Hour grid lines */}
                      {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                        <div
                          key={i}
                          className="absolute left-0 right-0 border-t border-slate-100"
                          style={{ top: (i / TOTAL_HOURS) * DAY_HEIGHT }}
                        />
                      ))}

                      {/* Hour labels (only on first column of each row) */}
                      {col === 0 && Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
                        const h = DAY_START_H + i;
                        const label = h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;
                        return (
                          <span
                            key={i}
                            className="absolute left-0.5 text-[9px] text-slate-300"
                            style={{ top: (i / TOTAL_HOURS) * DAY_HEIGHT - 5 }}
                          >
                            {label}
                          </span>
                        );
                      })}

                      {timed.map((ev) => {
                        const pos = timeToPosition(ev.time, 1);
                        if (!pos) return null;
                        const colors = CATEGORY_COLORS[ev.category] || CATEGORY_COLORS.Other;
                        const border = STATUS_LEFT_BORDER[ev.status] || 'border-l-slate-300';
                        return (
                          <button
                            key={ev.id}
                            onClick={(e) => { e.stopPropagation(); onEventClick?.(ev); }}
                            title={`${ev.time} — ${ev.title}`}
                            style={{ top: pos.top, height: pos.height, left: 2, right: 2 }}
                            className={`absolute overflow-hidden rounded border-l-2 px-1 py-0.5 text-left text-[11px] font-medium shadow-sm ${colors.light} ${border} hover:brightness-95`}
                          >
                            <span className="block truncate leading-tight">{ev.title}</span>
                            {pos.height > 24 && (
                              <span className="block truncate text-[10px] opacity-70">{ev.time}</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
