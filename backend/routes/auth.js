const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Company } = require('../models');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = await User.findOne({ where: { email } });
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

  const token = jwt.sign(
    { id: user.id, role: user.role, companyId: user.companyId, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  let company = null;
  if (user.companyId) company = await Company.findByPk(user.companyId);

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone },
    company,
  });
});

// GET /api/auth/me - confirms the token is valid and returns fresh user info
router.get('/me', requireAuth, async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  let company = null;
  if (user.companyId) company = await Company.findByPk(user.companyId);
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone }, company });
});

// PATCH /api/auth/profile - update own name/phone, or change password
router.patch('/profile', requireAuth, async (req, res) => {
  const user = await User.findByPk(req.user.id);
  const { name, phone, currentPassword, newPassword } = req.body;

  if (name) user.name = name;
  if (phone) user.phone = phone;

  if (newPassword) {
    if (!currentPassword) return res.status(400).json({ error: 'Current password required' });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    user.password = await bcrypt.hash(newPassword, 10);
  }

  await user.save();
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone } });
});

module.exports = router;
