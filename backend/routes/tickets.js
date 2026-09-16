const express = require('express');
const { Ticket, TicketMessage, Company, User, Notification } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/tickets?companyId=&status=
router.get('/', async (req, res) => {
  const where = {};
  if (req.user.role === 'client') {
    where.companyId = req.user.companyId;
  } else if (req.query.companyId) {
    where.companyId = req.query.companyId;
  }
  if (req.query.status && req.query.status !== 'All') where.status = req.query.status;

  const tickets = await Ticket.findAll({
    where,
    include: [{ model: Company, attributes: ['id', 'name'] }],
    order: [['createdAt', 'DESC']],
  });
  res.json(tickets);
});

// GET /api/tickets/:id - includes full conversation
router.get('/:id', async (req, res) => {
  const ticket = await Ticket.findByPk(req.params.id, {
    include: [Company, { model: TicketMessage, as: 'messages' }],
    order: [[{ model: TicketMessage, as: 'messages' }, 'createdAt', 'ASC']],
  });
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  if (req.user.role === 'client' && ticket.companyId !== req.user.companyId) {
    return res.status(403).json({ error: "Cannot access another company's data" });
  }
  res.json(ticket);
});

// POST /api/tickets - client raises a new ticket
router.post('/', requireRole('client'), async (req, res) => {
  const { subject, description, category, priority } = req.body;
  if (!subject || !description) return res.status(400).json({ error: 'Subject and description are required' });

  const ticket = await Ticket.create({
    companyId: req.user.companyId,
    subject,
    description,
    category,
    priority: priority || 'Medium',
    status: 'Open',
  });

  // Notify all admins that a new ticket came in
  const admins = await User.findAll({ where: { role: 'admin' } });
  await Promise.all(
    admins.map((a) =>
      Notification.create({
        userId: a.id,
        type: 'ticket_update',
        message: `New ticket raised: ${subject}`,
        linkType: 'ticket',
        linkId: ticket.id,
      })
    )
  );

  res.status(201).json(ticket);
});

// PATCH /api/tickets/:id/status - admin updates ticket status
router.patch('/:id/status', requireRole('admin'), async (req, res) => {
  const ticket = await Ticket.findByPk(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  const { status } = req.body;
  if (!['Open', 'In Progress', 'Resolved'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  await ticket.update({ status });

  const clientUsers = await User.findAll({ where: { companyId: ticket.companyId, role: 'client' } });
  await Promise.all(
    clientUsers.map((u) =>
      Notification.create({
        userId: u.id,
        type: 'ticket_update',
        message: `Your ticket #${ticket.id} has been ${status.toLowerCase()}`,
        linkType: 'ticket',
        linkId: ticket.id,
      })
    )
  );

  res.json(ticket);
});

// POST /api/tickets/:id/messages - reply on a ticket (admin or the owning client)
router.post('/:id/messages', async (req, res) => {
  const ticket = await Ticket.findByPk(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  if (req.user.role === 'client' && ticket.companyId !== req.user.companyId) {
    return res.status(403).json({ error: "Cannot access another company's data" });
  }

  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message text is required' });

  const ticketMessage = await TicketMessage.create({
    ticketId: ticket.id,
    senderId: req.user.id,
    senderName: req.user.name,
    senderRole: req.user.role,
    message,
  });

  // Notify the other side of the conversation
  if (req.user.role === 'admin') {
    const clientUsers = await User.findAll({ where: { companyId: ticket.companyId, role: 'client' } });
    await Promise.all(
      clientUsers.map((u) =>
        Notification.create({
          userId: u.id,
          type: 'ticket_response',
          message: `New reply on ticket #${ticket.id}`,
          linkType: 'ticket',
          linkId: ticket.id,
        })
      )
    );
  } else {
    const admins = await User.findAll({ where: { role: 'admin' } });
    await Promise.all(
      admins.map((a) =>
        Notification.create({
          userId: a.id,
          type: 'ticket_response',
          message: `New reply on ticket #${ticket.id}`,
          linkType: 'ticket',
          linkId: ticket.id,
        })
      )
    );
  }

  res.status(201).json(ticketMessage);
});

module.exports = router;
