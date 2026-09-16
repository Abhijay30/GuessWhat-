const express = require('express');
const { Op } = require('sequelize');
const { CalendarEvent, Company, User, Notification, EventFeedback } = require('../models');
const { requireAuth, requireRole, scopeToOwnCompany } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// Notify every client user at a company about something happening to their event
async function notifyCompanyUsers(companyId, type, message, linkId) {
  const users = await User.findAll({ where: { companyId, role: 'client' } });
  await Promise.all(
    users.map((u) => Notification.create({ userId: u.id, type, message, linkType: 'event', linkId }))
  );
}

// GET /api/events?companyId=&category=&status=&month=&year=
router.get('/', async (req, res) => {
  const where = {};
  if (req.user.role === 'client') {
    where.companyId = req.user.companyId;
  } else if (req.query.companyId) {
    where.companyId = req.query.companyId;
  }
  if (req.query.category && req.query.category !== 'All') where.category = req.query.category;
  if (req.query.status && req.query.status !== 'All') where.status = req.query.status;
  if (req.query.month && req.query.year) {
    const month = String(req.query.month).padStart(2, '0');
    where.date = { [Op.like]: `${req.query.year}-${month}-%` };
  }

  const events = await CalendarEvent.findAll({
    where,
    include: [{ model: Company, attributes: ['id', 'name'] }],
    order: [['date', 'ASC']],
  });
  res.json(events);
});

// GET /api/events/:id
router.get('/:id', async (req, res) => {
  const event = await CalendarEvent.findByPk(req.params.id, { include: [Company] });
  if (!event) return res.status(404).json({ error: 'Event not found' });
  if (req.user.role === 'client' && event.companyId !== req.user.companyId) {
    return res.status(403).json({ error: "Cannot access another company's data" });
  }
  res.json(event);
});

// POST /api/events - create a new activity (admin only)
router.post('/', requireRole('admin'), async (req, res) => {
  const { companyId, title, category, status, platform, date, time, description, notes } = req.body;
  if (!companyId || !title || !category || !date) {
    return res.status(400).json({ error: 'companyId, title, category and date are required' });
  }
  const event = await CalendarEvent.create({
    companyId, title, category, status: status || 'Planned', platform, date, time, description, notes,
    createdBy: req.user.name,
  });

  await notifyCompanyUsers(companyId, 'new_activity', `New activity added: ${title}`, event.id);
  res.status(201).json(event);
});

// PATCH /api/events/:id - edit an activity, including status changes (admin only)
router.patch('/:id', requireRole('admin'), async (req, res) => {
  const event = await CalendarEvent.findByPk(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const previousStatus = event.status;
  const { title, category, status, platform, date, time, description, notes } = req.body;
  await event.update({ title, category, status, platform, date, time, description, notes });

  if (status && status !== previousStatus) {
    const type = status === 'Delayed' ? 'activity_delayed' : 'activity_changed';
    const message =
      status === 'Delayed'
        ? `${event.title} has been delayed`
        : `${event.title} status changed to ${status}`;
    await notifyCompanyUsers(event.companyId, type, message, event.id);
  }

  res.json(event);
});

// GET /api/events/:id/feedback
router.get('/:id/feedback', async (req, res) => {
  const event = await CalendarEvent.findByPk(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  if (req.user.role === 'client' && event.companyId !== req.user.companyId) {
    return res.status(403).json({ error: "Cannot access another company's data" });
  }
  const feedback = await EventFeedback.findAll({ where: { eventId: req.params.id }, order: [['createdAt', 'ASC']] });
  res.json(feedback);
});

// POST /api/events/:id/feedback - client leaves a comment/question on an activity
router.post('/:id/feedback', requireRole('client'), async (req, res) => {
  const event = await CalendarEvent.findByPk(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  if (event.companyId !== req.user.companyId) {
    return res.status(403).json({ error: "Cannot access another company's data" });
  }
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  const feedback = await EventFeedback.create({ eventId: event.id, senderName: req.user.name, message });

  const admins = await User.findAll({ where: { role: 'admin' } });
  await Promise.all(
    admins.map((a) =>
      Notification.create({
        userId: a.id,
        type: 'ticket_update',
        message: `${req.user.name} left feedback on "${event.title}"`,
        linkType: 'event',
        linkId: event.id,
      })
    )
  );

  res.status(201).json(feedback);
});

// DELETE /api/events/:id (admin only)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  const event = await CalendarEvent.findByPk(req.params.id);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  await event.destroy();
  res.status(204).send();
});

module.exports = router;
