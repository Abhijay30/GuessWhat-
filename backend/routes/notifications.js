const express = require('express');
const { Notification } = require('../models');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/notifications - the current user's notifications, newest first
router.get('/', async (req, res) => {
  const notifications = await Notification.findAll({
    where: { userId: req.user.id },
    order: [['createdAt', 'DESC']],
  });
  res.json(notifications);
});

// PATCH /api/notifications/read-all  — must be registered BEFORE /:id/read so Express doesn't treat "read-all" as an id
router.patch('/read-all', async (req, res) => {
  await Notification.update({ read: true }, { where: { userId: req.user.id, read: false } });
  res.json({ success: true });
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res) => {
  const notification = await Notification.findByPk(req.params.id);
  if (!notification || notification.userId !== req.user.id) {
    return res.status(404).json({ error: 'Notification not found' });
  }
  await notification.update({ read: true });
  res.json(notification);
});

module.exports = router;
