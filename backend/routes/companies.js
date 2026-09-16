const express = require('express');
const bcrypt = require('bcryptjs');
const { Company, User } = require('../models');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

// GET /api/companies - list all clients (admin only)
router.get('/', requireRole('admin'), async (req, res) => {
  const companies = await Company.findAll({ order: [['name', 'ASC']] });
  res.json(companies);
});

// GET /api/companies/:id - a single company's details
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (req.user.role === 'client' && req.user.companyId !== id) {
    return res.status(403).json({ error: "Cannot access another company's data" });
  }
  const company = await Company.findByPk(id);
  if (!company) return res.status(404).json({ error: 'Company not found' });
  res.json(company);
});

// POST /api/companies - create a new client + their first login user (admin only)
router.post('/', requireRole('admin'), async (req, res) => {
  const { name, contactPerson, email, phone, loginEmail, loginPassword } = req.body;
  if (!name) return res.status(400).json({ error: 'Company name is required' });

  const company = await Company.create({ name, contactPerson, email, phone, status: 'Active' });

  // Optionally create the client's first user account at the same time
  if (loginEmail && loginPassword) {
    const hashed = await bcrypt.hash(loginPassword, 10);
    await User.create({
      name: contactPerson || name,
      email: loginEmail,
      password: hashed,
      role: 'client',
      companyId: company.id,
    });
  }

  res.status(201).json(company);
});

// PATCH /api/companies/:id - edit a client (admin only)
router.patch('/:id', requireRole('admin'), async (req, res) => {
  const company = await Company.findByPk(req.params.id);
  if (!company) return res.status(404).json({ error: 'Company not found' });
  const { name, contactPerson, email, phone, status, logoUrl, loginEmail, loginPassword } = req.body;
  await company.update({ name, contactPerson, email, phone, status, logoUrl });

  // If login credentials were provided, create or update the client user for this company
  if (loginEmail && loginPassword) {
    const hashed = await bcrypt.hash(loginPassword, 10);
    const existing = await User.findOne({ where: { companyId: company.id, role: 'client' } });
    if (existing) {
      await existing.update({ email: loginEmail, password: hashed });
    } else {
      await User.create({
        name: contactPerson || company.name,
        email: loginEmail,
        password: hashed,
        role: 'client',
        companyId: company.id,
      });
    }
  }

  res.json(company);
});

// DELETE /api/companies/:id (admin only)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  const company = await Company.findByPk(req.params.id);
  if (!company) return res.status(404).json({ error: 'Company not found' });
  await company.destroy();
  res.status(204).send();
});

module.exports = router;
