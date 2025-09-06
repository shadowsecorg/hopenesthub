const jwt = require('jsonwebtoken');
const db = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

function parseCookies(req) {
  try {
    const raw = req.headers && req.headers.cookie ? String(req.headers.cookie) : '';
    if (!raw) return {};
    return raw.split(';').reduce((acc, part) => {
      const idx = part.indexOf('=');
      if (idx === -1) return acc;
      const key = part.slice(0, idx).trim();
      const val = decodeURIComponent(part.slice(idx + 1).trim());
      acc[key] = val;
      return acc;
    }, {});
  } catch (_) { return {}; }
}

function getTokenFromRequest(req) {
  const authHeader = req.headers && req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length);
  }
  const cookies = parseCookies(req);
  if (cookies && cookies.token) return cookies.token;
  if (req.query && req.query.token) return String(req.query.token);
  return null;
}

function authenticateToken(req, res, next) {
  const token = getTokenFromRequest(req);
  if (!token) return res.status(401).json({ error: 'Missing token' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

function loadUserFromToken(req, _res, next) {
  const token = getTokenFromRequest(req);
  if (!token) return next();
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (!err && user) req.user = user;
    return next();
  });
}

module.exports = { authenticateToken, loadUserFromToken };
async function loadCurrentUser(req, _res, next) {
  try {
    if (!req.user || !req.user.id) return next();
    if (req.currentUser && req.currentUser.id === req.user.id) return next();
    const user = await db.User.findByPk(req.user.id, { include: [{ model: db.Role, attributes: ['name'] }] });
    if (user) {
      req.currentUser = user;
      req.currentUserRole = user.Role ? user.Role.name : null;
    }
    return next();
  } catch (_) { return next(); }
}

function requireRoleApi(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return [authenticateToken, loadCurrentUser, function(req, res, next) {
    const r = (req.currentUserRole || '').toLowerCase();
    if (!r || !roles.map(x => String(x).toLowerCase()).includes(r)) {
      return res.status(403).json({ error: 'forbidden' });
    }
    return next();
  }];
}

function requireRolePage(allowedRoles, loginPath) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return async function(req, res, next) {
    try {
      if (!req.user || !req.user.id) {
        return res.redirect(loginPath || '/');
      }
      await loadCurrentUser(req, res, () => {});
      const r = (req.currentUserRole || '').toLowerCase();
      if (!r || !roles.map(x => String(x).toLowerCase()).includes(r)) {
        return res.status(403).send('Forbidden');
      }
      return next();
    } catch (e) { return res.status(500).send('Auth error'); }
  };
}

module.exports.loadCurrentUser = loadCurrentUser;
module.exports.requireRoleApi = requireRoleApi;
module.exports.requireRolePage = requireRolePage;


