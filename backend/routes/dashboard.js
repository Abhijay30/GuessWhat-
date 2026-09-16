const express = require('express');
const { Op, fn, col } = require('sequelize');
const { Company, CalendarEvent, Ticket, Notification } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

function startOfMonthISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

// GET /api/dashboard/admin - totals for the admin dashboard cards
router.get('/admin', requireRole('admin'), async (req, res) => {
  const [totalClients, upcomingActivities, openTickets, completedThisMonth] = await Promise.all([
    Company.count(),
    CalendarEvent.count({ where: { date: { [Op.gte]: new Date().toISOString().slice(0, 10) } } }),
    Ticket.count({ where: { status: { [Op.ne]: 'Resolved' } } }),
    CalendarEvent.count({ where: { status: 'Completed', date: { [Op.gte]: startOfMonthISO() } } }),
  ]);

  const [open, inProgress, resolved] = await Promise.all([
    Ticket.count({ where: { status: 'Open' } }),
    Ticket.count({ where: { status: 'In Progress' } }),
    Ticket.count({ where: { status: 'Resolved' } }),
  ]);

  const recentTickets = await Ticket.findAll({ order: [['createdAt', 'DESC']], limit: 5 });
  const upcoming = await CalendarEvent.findAll({
    where: { date: { [Op.gte]: new Date().toISOString().slice(0, 10) } },
    order: [['date', 'ASC']],
    limit: 5,
    include: [{ model: Company, attributes: ['name'] }],
  });

  res.json({
    totalClients,
    upcomingActivities,
    openTickets,
    completedThisMonth,
    ticketsOverview: { open, inProgress, resolved, total: open + inProgress + resolved },
    recentTickets,
    upcomingActivitiesList: upcoming,
  });
});

// GET /api/dashboard/client - totals for the client dashboard cards (own company only)
router.get('/client', requireRole('client'), async (req, res) => {
  const companyId = req.user.companyId;
  const todayISO = new Date().toISOString().slice(0, 10);

  const [upcoming, inProgress, completedThisMonth, openTickets] = await Promise.all([
    CalendarEvent.count({ where: { companyId, date: { [Op.gte]: todayISO } } }),
    CalendarEvent.count({ where: { companyId, status: 'In Progress' } }),
    CalendarEvent.count({ where: { companyId, status: 'Completed', date: { [Op.gte]: startOfMonthISO() } } }),
    Ticket.count({ where: { companyId, status: { [Op.ne]: 'Resolved' } } }),
  ]);

  const upcomingActivitiesList = await CalendarEvent.findAll({
    where: { companyId, date: { [Op.gte]: todayISO } },
    order: [['date', 'ASC']],
    limit: 5,
  });

  const recentNotifications = await Notification.findAll({
    where: { userId: req.user.id },
    order: [['createdAt', 'DESC']],
    limit: 5,
  });

  res.json({
    upcomingActivities: upcoming,
    inProgress,
    completedThisMonth,
    openTickets,
    upcomingActivitiesList,
    recentNotifications,
  });
});

module.exports = router;
