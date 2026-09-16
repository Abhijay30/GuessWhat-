const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'brandflow-dev-secret-change-me';

// Verifies the JWT and attaches the decoded user (id, role, companyId) to req.user
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Restricts a route to specific roles, e.g. requireRole('admin')
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Not allowed for your role' });
    }
    next();
  };
}

// For client users: makes sure they can only touch data belonging to their own company.
// Admins bypass this check entirely.
function scopeToOwnCompany(req, res, next) {
  if (req.user.role === 'admin') return next();
  const requestedCompanyId = Number(req.params.companyId || req.body.companyId || req.query.companyId);
  if (requestedCompanyId && requestedCompanyId !== req.user.companyId) {
    return res.status(403).json({ error: "Cannot access another company's data" });
  }
  next();
}

module.exports = { requireAuth, requireRole, scopeToOwnCompany, JWT_SECRET };
