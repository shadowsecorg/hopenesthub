const express = require('express');
const router = express.Router();
const db = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { loadUserFromToken, requireRolePage } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// Helper: decide if client expects JSON
function wantsJson(req) {
  const accept = req.headers && req.headers.accept ? String(req.headers.accept) : '';
  const contentType = req.headers && req.headers['content-type'] ? String(req.headers['content-type']) : '';
  return (accept.includes('application/json') || contentType.includes('application/json') || req.query?.format === 'json');
}

function respondOk(req, res, fallbackRedirect, payload) {
  if (wantsJson(req)) {
    return res.json(payload || { ok: true });
  }
  return res.redirect(fallbackRedirect);
}

// Attach lightweight auth loader to make req.user available when a token cookie exists
router.use(loadUserFromToken);

async function ensureDefaultAdmin() {
  const [adminRole] = await db.Role.findOrCreate({ where: { name: 'admin' }, defaults: { name: 'admin', description: 'Administrator' } });
  const email = process.env.DEFAULT_ADMIN_EMAIL || 'admin@hopenest.local';
  const existing = await db.User.findOne({ where: { email } });
  if (existing) return existing;
  const password = process.env.DEFAULT_ADMIN_PASSWORD || 'ChangeMe123!';
  const password_hash = await bcrypt.hash(password, 8);
  const user = await db.User.create({ name: 'Admin User', email, password_hash, role_id: adminRole.id, status: 'active' });
  return user;
}

function issueToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

// Auth pages: Admin Login
router.get('/admin/login', async (req, res) => {
  try { await ensureDefaultAdmin(); } catch (_) {}
  res.render('auth/login', { layout: false, panel: 'admin', action: '/admin/login', title: 'Admin Login' });
});

router.post('/admin/login', async (req, res) => {
  try {
    await ensureDefaultAdmin();
    const { email, password } = req.body;
    const user = await db.User.findOne({ where: { email } });
    if (!user) return res.status(401).send('Invalid credentials');
    const ok = await bcrypt.compare(password || '', user.password_hash || '');
    if (!ok) return res.status(401).send('Invalid credentials');
    const token = issueToken({ id: user.id, email: user.email });
    const secure = Boolean(process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production');
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure, maxAge: 8 * 3600 * 1000 });
    return res.redirect('/admin');
  } catch (err) { return res.status(500).send(err.message); }
});

// Auth pages: Caregiver Login & Register
router.get('/caregiver/login', (req, res) => {
  res.render('auth/login', { layout: false, panel: 'caregiver', action: '/caregiver/login', title: 'Caregiver Login' });
});

router.post('/caregiver/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await db.User.findOne({ where: { email } });
    if (!user) return res.status(401).send('Invalid credentials');
    const ok = await bcrypt.compare(password || '', user.password_hash || '');
    if (!ok) return res.status(401).send('Invalid credentials');
    const token = issueToken({ id: user.id, email: user.email });
    const secure = Boolean(process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production');
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure, maxAge: 8 * 3600 * 1000 });
    return res.redirect('/caregiver/dashboard');
  } catch (err) { return res.status(500).send(err.message); }
});

router.get('/caregiver/register', (req, res) => {
  res.render('auth/register', { layout: false, panel: 'caregiver', action: '/caregiver/register', title: 'Caregiver Register' });
});

router.post('/caregiver/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!email || !password) return res.status(400).send('email and password required');
    const exists = await db.User.findOne({ where: { email } });
    if (exists) return res.status(409).send('Email already registered');
    const [caregiverRole] = await db.Role.findOrCreate({ where: { name: 'caregiver' }, defaults: { name: 'caregiver', description: 'Caregiver' } });
    const password_hash = await bcrypt.hash(password, 8);
    const user = await db.User.create({ name: name || 'Caregiver', email, phone: phone || null, role_id: caregiverRole.id, status: 'active', password_hash });
    await db.Caregiver.findOrCreate({ where: { user_id: user.id }, defaults: { user_id: user.id, relationship: 'family' } });
    const token = issueToken({ id: user.id, email: user.email });
    const secure = Boolean(process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production');
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure, maxAge: 8 * 3600 * 1000 });
    return res.redirect('/caregiver/dashboard');
  } catch (err) { return res.status(500).send(err.message); }
});

router.post('/logout', (req, res) => {
  try {
    const secure = Boolean(process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production');
    res.cookie('token', '', { httpOnly: true, sameSite: 'lax', secure, expires: new Date(0) });
    const redirectTo = (req.query && req.query.to === 'admin') ? '/admin/login' : '/caregiver/login';
    return res.redirect(redirectTo);
  } catch (err) { return res.status(500).send(err.message); }
});

router.get('/logout', (req, res) => {
  try {
    const secure = Boolean(process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production');
    res.cookie('token', '', { httpOnly: true, sameSite: 'lax', secure, expires: new Date(0) });
    const redirectTo = (req.query && req.query.to === 'admin') ? '/admin/login' : '/caregiver/login';
    return res.redirect(redirectTo);
  } catch (err) { return res.status(500).send(err.message); }
});

// Resolve a valid caregiver user id even if req.user is missing
async function resolveCaregiverUserId(req) {
  try {
    let id = (req.user && req.user.id) ? parseInt(req.user.id, 10) : null;
    if (id) {
      const exists = await db.User.count({ where: { id } });
      if (exists) return id;
    }
    const caregiverRole = await db.Role.findOne({ where: { name: 'caregiver' } });
    const user = caregiverRole
      ? await db.User.findOne({ where: { role_id: caregiverRole.id }, order: [['id', 'ASC']] })
      : await db.User.findOne({ order: [['id', 'ASC']] });
    return user ? user.id : null;
  } catch (_) {
    return null;
  }
}

// Admin panel
router.get(['/admin', '/admin/index'], requireRolePage('admin', '/admin/login'), async (req, res) => {
  try {
    const totalUsers = await db.User.count();
    const totalPatients = await db.Patient.count();
    const recentAlerts = await db.AiAlert.count({});
    // Load optional dashboard stats from SystemSetting if present
    const dashboardSettings = await db.SystemSetting.findOne({ where: { key: 'admin_dashboard_stats' } });
    const stats = dashboardSettings?.value || {};
    // Build simple 7-day aggregates for charts (heart rate, sleep, steps)
    const since = new Date();
    since.setDate(since.getDate() - 6);
    const metrics = await db.HealthMetric.findAll({
      attributes: [
        [db.Sequelize.fn('date_trunc', 'day', db.Sequelize.col('recorded_at')), 'day'],
        [db.Sequelize.fn('avg', db.Sequelize.col('heart_rate')), 'avg_hr'],
        [db.Sequelize.fn('avg', db.Sequelize.col('sleep_hours')), 'avg_sleep'],
        [db.Sequelize.fn('avg', db.Sequelize.col('steps')), 'avg_steps']
      ],
      where: { recorded_at: { [db.Sequelize.Op.gte]: since } },
      group: [db.Sequelize.fn('date_trunc', 'day', db.Sequelize.col('recorded_at'))],
      order: [[db.Sequelize.fn('date_trunc', 'day', db.Sequelize.col('recorded_at')), 'ASC']]
    });
    const labels = [];
    const hr = [];
    const sleep = [];
    const steps = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = d.toISOString().slice(0,10);
      labels.push(key);
      const row = metrics.find(m => (new Date(m.get('day')).toISOString().slice(0,10) === key));
      hr.push(row ? Number(row.get('avg_hr')) || 0 : 0);
      sleep.push(row ? Number(row.get('avg_sleep')) || 0 : 0);
      steps.push(row ? Number(row.get('avg_steps')) || 0 : 0);
    }
    const statusCounts = await db.Patient.findAll({ attributes: ['health_status', [db.Sequelize.fn('count', '*'), 'count']], group: ['health_status'] });
    const dist = { stable: 0, 'at-risk': 0, critical: 0 };
    statusCounts.forEach(r => { dist[String(r.get('health_status')||'stable')] = Number(r.get('count')); });
    const adminCharts = { labels, heartRate: hr, sleepQuality: sleep, steps, statusDistribution: dist };
    const alertTypeRows = await db.AiAlert.findAll({ attributes: ['alert_type', [db.Sequelize.fn('count', '*'), 'count']], group: ['alert_type'] });
    const alertSummary = {};
    alertTypeRows.forEach(r => { alertSummary[String(r.get('alert_type')||'Other')] = Number(r.get('count')); });
    res.render('admin/index', { layout: 'layouts/admin_layout', active: 'dashboard', title: 'Admin Dashboard', totals: { totalUsers, totalPatients, recentAlerts }, stats, adminCharts, alertSummary });
  } catch (err) {
    if (wantsJson(req)) return res.status(500).json({ error: err.message });
    res.status(500).send(err.message);
  }
});

router.get('/admin/users', requireRolePage('admin', '/admin/login'), async (req, res) => {
  try {
    const { q, role, status } = req.query;
    const where = {};
    if (q) {
      where[db.Sequelize.Op.or] = [
        { name: { [db.Sequelize.Op.iLike]: `%${q}%` } },
        { email: { [db.Sequelize.Op.iLike]: `%${q}%` } }
      ];
    }
    // Load roles for filters and forms
    const roles = await db.Role.findAll({ order: [['id', 'ASC']] });
    if (role) {
      let roleIdFilter = null;
      const numeric = String(role).match(/^\d+$/);
      if (numeric) {
        const r = await db.Role.findByPk(parseInt(role, 10));
        if (r) roleIdFilter = r.id;
      } else {
        const r = await db.Role.findOne({ where: { name: role } });
        if (r) roleIdFilter = r.id;
      }
      if (roleIdFilter) where.role_id = roleIdFilter;
    }
    if (status) where.status = status;
    const users = await db.User.findAll({ where, attributes: { exclude: ['password_hash'] }, include: [{ model: db.Role, attributes: ['id', 'name'] }], order: [['id', 'ASC']] });
    res.render('admin/users', { layout: 'layouts/admin_layout', active: 'users', title: 'User Management', users, roles });
  } catch (err) {
    if (wantsJson(req)) return res.status(500).json({ error: err.message });
    res.status(500).send(err.message);
  }
});

// Admin users CRUD and actions
router.post('/admin/users', requireRolePage('admin', '/admin/login'), async (req, res) => {
  try {
    const { name, email, role_id, status, password, role } = req.body;
    const bcrypt = require('bcryptjs');
    const password_hash = password ? await bcrypt.hash(password, 8) : await bcrypt.hash('ChangeMe123!', 8);
    // Resolve role id safely
    let roleIdFinal = null;
    if (role_id !== undefined && role_id !== null && String(role_id).trim() !== '') {
      const rid = parseInt(role_id, 10);
      if (!Number.isNaN(rid)) {
        const r = await db.Role.findByPk(rid);
        if (r) roleIdFinal = r.id;
      }
    }
    if (roleIdFinal === null && role) {
      const r = await db.Role.findOne({ where: { name: role } });
      if (r) roleIdFinal = r.id;
    }
    await db.User.create({ name, email, role_id: roleIdFinal, status: status || 'active', password_hash });
    res.redirect('/admin/users');
  } catch (err) {
    if (wantsJson(req)) return res.status(500).json({ error: err.message });
    res.status(500).send(err.message);
  }
});

router.post('/admin/users/:id/update', requireRolePage('admin', '/admin/login'), async (req, res) => {
  try {
    const { name, email, role_id, status, role } = req.body;
    // Resolve role id safely
    let roleIdFinal = null;
    if (role_id !== undefined && role_id !== null && String(role_id).trim() !== '') {
      const rid = parseInt(role_id, 10);
      if (!Number.isNaN(rid)) {
        const r = await db.Role.findByPk(rid);
        if (r) roleIdFinal = r.id; else roleIdFinal = null;
      }
    }
    if (roleIdFinal === null && role) {
      const r = await db.Role.findOne({ where: { name: role } });
      if (r) roleIdFinal = r.id;
    }
    await db.User.update({ name, email, role_id: roleIdFinal, status }, { where: { id: req.params.id } });
    res.redirect('/admin/users');
  } catch (err) {
    if (wantsJson(req)) return res.status(500).json({ error: err.message });
    res.status(500).send(err.message);
  }
});

router.post('/admin/users/:id/delete', requireRolePage('admin', '/admin/login'), async (req, res) => {
  try {
    await db.User.destroy({ where: { id: req.params.id } });
    res.redirect('/admin/users');
  } catch (err) {
    if (wantsJson(req)) return res.status(500).json({ error: err.message });
    res.status(500).send(err.message);
  }
});

router.post('/admin/users/:id/reset-password', requireRolePage('admin', '/admin/login'), async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { password } = req.body;
    const newPass = password || 'ChangeMe123!';
    const password_hash = await bcrypt.hash(newPass, 8);
    await db.User.update({ password_hash }, { where: { id: req.params.id } });
    res.redirect('/admin/users');
  } catch (err) {
    if (wantsJson(req)) return res.status(500).json({ error: err.message });
    res.status(500).send(err.message);
  }
});

router.post('/admin/users/:id/verify', requireRolePage('admin', '/admin/login'), async (req, res) => {
  try {
    await db.User.update({ is_verified: true }, { where: { id: req.params.id } });
    res.redirect('/admin/users');
  } catch (err) {
    if (wantsJson(req)) return res.status(500).json({ error: err.message });
    res.status(500).send(err.message);
  }
});

router.get('/admin/alerts', requireRolePage('admin', '/admin/login'), async (req, res) => {
  try {
    const { type, severity, status, userId } = req.query;

    const where = {};
    if (type) where.alert_type = type;
    if (severity) where.severity = severity;
    if (status) where.status = status;

    const include = [{
      model: db.Patient,
      include: [{ model: db.User, attributes: ['id', 'name'] }]
    }];

    // If userId provided, constrain by joined Patient.User.id
    if (userId) {
      include[0].where = { }; // placeholder to ensure required join if needed
      include[0].required = true;
      include[0].include[0].where = { id: Number(userId) };
      include[0].include[0].required = true;
    }

    const alerts = await db.AiAlert.findAll({
      where,
      include,
      order: [['created_at', 'DESC']],
      limit: 200
    });

    res.render('admin/alerts', {
      layout: 'layouts/admin_layout',
      active: 'alerts',
      title: 'Alerts',
      alerts,
      // echo selected filters for the form
      selected: {
        type: type || '',
        severity: severity || '',
        status: status || '',
        userId: userId || ''
      }
    });
  } catch (err) {
    if (wantsJson(req)) return res.status(500).json({ error: err.message });
    res.status(500).send(err.message);
  }
});

router.get('/admin/patients', requireRolePage('admin', '/admin/login'), async (req, res) => {
  try {
    const { q, pid, status } = req.query;
    const where = {};
    if (pid) where.id = pid;
    if (status) where.health_status = status;
    let patients = await db.Patient.findAll({
      where,
      include: [{ model: db.User, attributes: ['name'] }],
      order: [['id', 'ASC']]
    });
    if (q) {
      const qLower = String(q).toLowerCase();
      patients = patients.filter(p => (p.User?.name || '').toLowerCase().includes(qLower));
    }
    res.render('admin/patients', { layout: 'layouts/admin_layout', active: 'patients', title: 'Patient Status', patients });
  } catch (err) {
    if (wantsJson(req)) return res.status(500).json({ error: err.message });
    res.status(500).send(err.message);
  }
});
// Admin: patient details API
router.get('/admin/patients/:id/details', requireRolePage('admin', '/admin/login'), async (req, res) => {
  try {
    const id = req.params.id;
    const patient = await db.Patient.findOne({ where: { id }, include: [{ model: db.User, attributes: ['name', 'email'] }] });
    const [metrics, alerts, notes, symptoms, emotions] = await Promise.all([
      db.HealthMetric.findAll({ where: { patient_id: id }, order: [['recorded_at', 'DESC']], limit: 20 }),
      db.AiAlert.findAll({ where: { patient_id: id }, order: [['created_at', 'DESC']], limit: 10 }),
      db.DoctorNote.findAll({ where: { patient_id: id }, order: [['created_at', 'DESC']], limit: 10 }),
      db.Symptom.findAll({ where: { patient_id: id }, order: [['recorded_at', 'DESC']], limit: 10 }),
      db.Emotion.findAll({ where: { patient_id: id }, order: [['recorded_at', 'DESC']], limit: 10 })
    ]);
    return res.json({ patient, metrics, alerts, notes, symptoms, emotions });
  } catch (err) { if (wantsJson(req)) return res.status(500).json({ error: err.message }); res.status(500).send(err.message); }
});
router.post('/admin/patients', requireRolePage('admin', '/admin/login'), async (req, res) => {
  try {
    const { user_id, cancer_type, diagnosis_date, assigned_doctor_id } = req.body;
    console.log(req.body);
    await db.Patient.create({ user_id, cancer_type, diagnosis_date, assigned_doctor_id });
    res.redirect('/admin/patients');
  } catch (err) {
    console.log(err);
    res.status(500).send(err.message);
  }
});

router.post('/admin/patients/:id/delete', requireRolePage('admin', '/admin/login'), async (req, res) => {
  try {
    await db.Patient.destroy({ where: { id: req.params.id } });
    res.redirect('/admin/patients');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post('/admin/alerts/:id/confirm', requireRolePage('admin', '/admin/login'), async (req, res) => {
  try {
    await db.AiAlert.update({ status: 'confirmed' }, { where: { id: req.params.id } });
    res.redirect('/admin/alerts');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post('/admin/alerts/:id/reject', requireRolePage('admin', '/admin/login'), async (req, res) => {
  try {
    await db.AiAlert.update({ status: 'rejected' }, { where: { id: req.params.id } });
    res.redirect('/admin/alerts');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post('/admin/alert-settings', requireRolePage('admin', '/admin/login'), async (req, res) => {
  try {
    const { user_id, heart_rate_threshold, sleep_threshold, activity_threshold } = req.body;
    const targetUserId = parseInt(user_id, 10) || 1;
    const [row, created] = await db.AlertSetting.findOrCreate({
      where: { user_id: targetUserId },
      defaults: { heart_rate_threshold, sleep_threshold, activity_threshold }
    });
    if (!created) {
      await row.update({ heart_rate_threshold, sleep_threshold, activity_threshold });
    }
    res.redirect('/admin/alerts');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Stubs for other admin pages to render static shell, can be expanded
router.get('/admin/messages', requireRolePage('admin', '/admin/login'), async (req, res) => {
  try {
    const messages = await db.Message.findAll({
      include: [
        { model: db.User, as: 'receiver', attributes: ['name'] },
        { model: db.User, as: 'sender', attributes: ['name'] }
      ],
      order: [['created_at', 'DESC']],
      limit: 100
    });

    const users = await db.User.findAll({ attributes: ['id', 'name', 'role_id'], order: [['name', 'ASC']] });

    const uid = parseInt(req.query.uid, 10) || null;
    let selectedUser = null;
    let thread = [];
    if (uid) {
      selectedUser = await db.User.findByPk(uid, { attributes: ['id', 'name'] });
      if (selectedUser) {
        thread = await db.Message.findAll({
          where: {
            [db.Sequelize.Op.or]: [
              { sender_id: uid },
              { receiver_id: uid }
            ]
          },
          include: [
            { model: db.User, as: 'receiver', attributes: ['name'] },
            { model: db.User, as: 'sender', attributes: ['name'] }
          ],
          order: [['created_at', 'ASC']],
          limit: 200
        });
      }
    }

    res.render('admin/messages', {
      layout: 'layouts/admin_layout',
      active: 'messages',
      title: 'Messages',
      messages,
      users,
      selectedUser,
      thread
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});
router.post('/admin/messages/send', requireRolePage('admin', '/admin/login'), async (req, res) => {
  try {
    const { recipientType, recipient, groupRecipient, content } = req.body;
    const sender_id = (req.user && req.user.id) ? (parseInt(req.user.id, 10) || null) : null;
    const text = String(content || '').trim();
    if (!text) return res.status(400).send('content required');

    const isIndividual = recipientType === 'individual';
    if (isIndividual) {
      const receiver_id = parseInt(recipient, 10) || null;
      if (!receiver_id) return res.status(400).send('recipient required');
      const receiverExists = await db.User.count({ where: { id: receiver_id } });
      if (!receiverExists) return res.status(400).send('recipient not found');
      const message_type = 'text';
      await db.Message.create({ sender_id, receiver_id, content: text, message_type, created_at: new Date() });
      return respondOk(req, res, '/admin/messages', { ok: true, created: 1 });
    }

    // Group send: distribute as per-recipient messages while tagging message_type with group
    const group = (groupRecipient || 'all').toLowerCase();
    const Op = db.Sequelize.Op;
    // Resolve role ids dynamically to avoid magic numbers
    const roles = await db.Role.findAll({ where: { name: { [Op.in]: ['patient', 'caregiver'] } } });
    const roleIdByName = {};
    roles.forEach(r => { roleIdByName[String(r.name)] = r.id; });

    let whereClause;
    if (group === 'patients') {
      whereClause = { role_id: roleIdByName['patient'] || -1 };
    } else if (group === 'caregivers') {
      whereClause = { role_id: roleIdByName['caregiver'] || -1 };
    } else {
      const ids = [roleIdByName['patient'], roleIdByName['caregiver']].filter(Boolean);
      whereClause = { role_id: { [Op.in]: ids.length ? ids : [-1] } };
    }

    const recipients = await db.User.findAll({ where: whereClause, attributes: ['id'] });
    const rows = recipients.map(u => ({
      sender_id,
      receiver_id: u.id,
      content: text,
      message_type: `group:${group}`,
      created_at: new Date()
    }));
    if (!rows.length) return respondOk(req, res, '/admin/messages', { ok: true, created: 0 });
    await db.Message.bulkCreate(rows);
    return respondOk(req, res, '/admin/messages', { ok: true, created: rows.length });
  } catch (err) {
    res.status(500).send(err.message);
  }
});
router.get('/admin/reports', requireRolePage('admin', '/admin/login'), async (req, res) => {
  try {
    const { pid, start, end, range } = req.query;
    const where = {};
    if (pid) where.patient_id = pid;
    const createdAt = {};
    if (range === 'last-week') { const d = new Date(); d.setDate(d.getDate()-7); createdAt[db.Sequelize.Op.gte] = d; }
    if (range === 'last-month') { const d = new Date(); d.setMonth(d.getMonth()-1); createdAt[db.Sequelize.Op.gte] = d; }
    if (start) createdAt[db.Sequelize.Op.gte] = new Date(start);
    if (end) createdAt[db.Sequelize.Op.lte] = new Date(end);
    if (Object.keys(createdAt).length) where.created_at = createdAt;
    const patientReports = await db.PatientReport.findAll({ where, order: [['created_at', 'DESC']], limit: 100 });

    // Build summary stats and aggregates from HealthMetric for charts
    const metricWhere = {};
    if (pid) metricWhere.patient_id = pid;
    if (Object.keys(createdAt).length) metricWhere.recorded_at = createdAt;
    const metrics = await db.HealthMetric.findAll({ where: metricWhere, order: [['recorded_at', 'DESC']], limit: 1000 });
    const avg = (arr) => arr.length ? (arr.reduce((a,b)=>a+b,0) / arr.length) : 0;
    const avgHeart = avg(metrics.map(m => m.heart_rate || 0));
    const avgSleep = avg(metrics.map(m => (m.sleep_hours || 0) * 100/8));
    const avgSteps = avg(metrics.map(m => m.steps || 0));
    const summary = { avgHeart: Math.round(avgHeart), avgSleep: Math.round(avgSleep), avgSteps: Math.round(avgSteps) };

    const startDate = createdAt[db.Sequelize.Op.gte] || new Date(new Date().setDate(new Date().getDate()-6));
    const labels = [];
    for (let i=0;i<7;i++){ const d=new Date(startDate); d.setDate(d.getDate()+i); labels.push(d.toISOString().slice(0,10)); }
    const byDay = {};
    metrics.forEach(m => { const k = new Date(m.recorded_at).toISOString().slice(0,10); if(!byDay[k]) byDay[k]=[]; byDay[k].push(m); });
    const series = labels.map(k => avg((byDay[k]||[]).map(m => m.heart_rate||0)));
    const sleepSeries = labels.map(k => avg((byDay[k]||[]).map(m => (m.sleep_hours||0)*100/8)));
    const stepsSeries = labels.map(k => avg((byDay[k]||[]).map(m => m.steps||0)));
    const adminReportCharts = { labels, heartRate: series, sleepQuality: sleepSeries, steps: stepsSeries };

    // Build Patient Comparison from metrics (per patient averages)
    const byPatient = {};
    metrics.forEach(m => {
      const pidKey = String(m.patient_id);
      if (!byPatient[pidKey]) byPatient[pidKey] = { heart: [], sleepPct: [], steps: [] };
      if (typeof m.heart_rate === 'number') byPatient[pidKey].heart.push(m.heart_rate);
      if (typeof m.sleep_hours === 'number') byPatient[pidKey].sleepPct.push((m.sleep_hours || 0) * 100/8);
      if (typeof m.steps === 'number') byPatient[pidKey].steps.push(m.steps);
    });
    const patientIds = Object.keys(byPatient).map(id => Number(id));
    let idToName = {};
    if (patientIds.length) {
      const patients = await db.Patient.findAll({ where: { id: patientIds }, include: [{ model: db.User, attributes: ['name'] }] });
      patients.forEach(p => { idToName[p.id] = p.User?.name || `PT${p.id}`; });
    }
    const patientComparison = patientIds.map(id => ({
      patient_id: id,
      name: idToName[id] || `PT${id}`,
      avg_hr: Math.round(avg(byPatient[String(id)].heart) || 0),
      avg_sleep: Math.round(avg(byPatient[String(id)].sleepPct) || 0),
      avg_steps: Math.round(avg(byPatient[String(id)].steps) || 0)
    })).sort((a,b)=>a.patient_id-b.patient_id);

    res.render('admin/reports', {
      layout: 'layouts/admin_layout',
      active: 'reports',
      title: 'Reports',
      patientReports,
      summary,
      adminReportCharts,
      patientComparison,
      // echo back selected filters for the form
      pid: pid || '',
      range: range || '',
      start: start || '',
      end: end || ''
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});
router.get('/admin/settings', requireRolePage('admin', '/admin/login'), async (req, res) => {
  try {
    const roles = await db.Role.findAll({ order: [['id', 'ASC']] });
    const chatbotRow = await db.SystemSetting.findOne({ where: { key: 'chatbot_settings' } });
    const wearableRow = await db.SystemSetting.findOne({ where: { key: 'wearable_settings' } });
    const securityRow = await db.SystemSetting.findOne({ where: { key: 'security_settings' } });
    const chatbotSettings = chatbotRow?.value || null;
    const wearableSettings = wearableRow?.value || null;
    const securitySettings = securityRow?.value || null;
    res.render('admin/settings', { layout: 'layouts/admin_layout', active: 'settings', title: 'Settings', roles, chatbotSettings, wearableSettings, securitySettings });
  } catch (err) { if (wantsJson(req)) return res.status(500).json({ error: err.message }); res.status(500).send(err.message); }
});
router.get('/admin/advanced-analytics', requireRolePage('admin', '/admin/login'), (req, res) => res.render('admin/advanced_analytics', { layout: 'layouts/admin_layout', active: 'advanced', title: 'Advanced Analytics' }));
router.get('/admin/wearable-management', requireRolePage('admin', '/admin/login'), async (req, res) => {
  try {
    const { q, type } = req.query;
    const where = {};
    if (type) where.device_type = type;
    if (q) {
      where[db.Sequelize.Op.or] = [
        { device_id: { [db.Sequelize.Op.iLike]: `%${q}%` } },
        { user_id: isNaN(Number(q)) ? -1 : Number(q) }
      ];
    }

    // Connected devices list with query filters
    const devices = await db.WearableDevice.findAll({ where, order: [['updated_at', 'DESC']], limit: 500 });

    // Load wearable settings (if any)
    const wearableSettingsRow = await db.SystemSetting.findOne({ where: { key: 'wearable_settings' } });
    const wearableSettings = wearableSettingsRow?.value || {};

    // Build analytics for Status & Analytics section
    const Op = db.Sequelize.Op;
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const deviceTypes = ['google-fit', 'healthkit'];
    const labelMap = { 'google-fit': 'Google Fit', 'healthkit': 'Apple HealthKit' };

    // Totals
    const [totalDevices, totalConnectedDevices, connectedRecentCount, disconnectedCount, dataPointsCollected] = await Promise.all([
      db.WearableDevice.count(),
      db.WearableDevice.count({ where: { status: 'connected' } }),
      db.WearableDevice.count({ where: { status: 'connected', last_sync: { [Op.gte]: dayAgo } } }),
      db.WearableDevice.count({ where: { status: 'disconnected' } }),
      db.HealthMetric.count({ where: { source: { [Op.in]: deviceTypes } } })
    ]);

    const deviceUsageLabels = deviceTypes.map((t) => labelMap[t]);
    const deviceUsageData = [];
    const syncSuccessLabels = deviceTypes.map((t) => labelMap[t]);
    const syncSuccessData = [];
    const deviceSummary = [];

    for (const t of deviceTypes) {
      // Totals per type
      const [totalType, connectedType, successType, dataPointsType] = await Promise.all([
        db.WearableDevice.count({ where: { device_type: t } }),
        db.WearableDevice.count({ where: { device_type: t, status: 'connected' } }),
        db.WearableDevice.count({ where: { device_type: t, status: 'connected', last_sync: { [Op.gte]: dayAgo } } }),
        db.HealthMetric.count({ where: { source: t } })
      ]);
      const successPercent = totalType ? Math.round((successType / totalType) * 100) : 0;
      const errorsType = Math.max(0, totalType - successType);
      deviceUsageData.push(totalType);
      syncSuccessData.push(successPercent);
      deviceSummary.push({ label: labelMap[t], connectedUsers: connectedType, dataPoints: dataPointsType, successPercent, errors: errorsType });
    }

    const syncSuccessRate = totalDevices ? Math.round((connectedRecentCount / totalDevices) * 100) : 0;
    const syncErrors = Math.max(0, totalDevices - connectedRecentCount);

    res.render('admin/wearable_management', {
      layout: 'layouts/admin_layout',
      active: 'wearable',
      title: 'Wearable Management',
      devices,
      q: q || '',
      type: type || '',
      wearableSettings,
      totals: { connected: totalConnectedDevices, dataPointsCollected, syncSuccessRate, syncErrors },
      charts: {
        deviceUsage: { labels: deviceUsageLabels, data: deviceUsageData },
        syncSuccess: { labels: syncSuccessLabels, data: syncSuccessData }
      },
      deviceSummary
    });
  } catch (err) { if (wantsJson(req)) return res.status(500).json({ error: err.message }); res.status(500).send(err.message); }
});

// Wearable devices CRUD
router.post('/admin/wearables/connect', requireRolePage('admin', '/admin/login'), async (req, res) => {
  try {
    const { userId, deviceType, deviceId } = req.body;
    await db.WearableDevice.create({ user_id: userId, device_type: deviceType, device_id: deviceId, status: 'connected', last_sync: null });
    return respondOk(req, res, '/admin/wearable-management');
  } catch (err) { if (wantsJson(req)) return res.status(500).json({ error: err.message }); res.status(500).send(err.message); }
});

router.post('/admin/wearables/:deviceId/disconnect', requireRolePage('admin', '/admin/login'), async (req, res) => {
  try {
    await db.WearableDevice.update({ status: 'disconnected' }, { where: { device_id: req.params.deviceId } });
    return respondOk(req, res, '/admin/wearable-management');
  } catch (err) { if (wantsJson(req)) return res.status(500).json({ error: err.message }); res.status(500).send(err.message); }
});

router.post('/admin/wearables/:deviceId/reconnect', requireRolePage('admin', '/admin/login'), async (req, res) => {
  try {
    await db.WearableDevice.update({ status: 'connected', last_sync: new Date() }, { where: { device_id: req.params.deviceId } });
    return respondOk(req, res, '/admin/wearable-management');
  } catch (err) { if (wantsJson(req)) return res.status(500).json({ error: err.message }); res.status(500).send(err.message); }
});

// Export wearable devices (CSV)
router.get('/admin/wearables/export', requireRolePage('admin', '/admin/login'), async (req, res) => {
  try {
    const { q, type } = req.query;
    const where = {};
    if (type) where.device_type = type;
    if (q) {
      where[db.Sequelize.Op.or] = [
        { device_id: { [db.Sequelize.Op.iLike]: `%${q}%` } },
        { user_id: isNaN(Number(q)) ? -1 : Number(q) }
      ];
    }
    const devices = await db.WearableDevice.findAll({ where, order: [['updated_at', 'DESC']], limit: 5000 });
    const rows = [['user_id','device_type','device_id','status','last_sync']].concat(
      devices.map(d => [d.user_id, d.device_type, d.device_id, d.status, d.last_sync ? d.last_sync.toISOString() : ''])
    );
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="wearables.csv"');
    res.send(csv);
  } catch (err) { if (wantsJson(req)) return res.status(500).json({ error: err.message }); res.status(500).send(err.message); }
});

// Admin settings persistence
router.post('/admin/settings/chatbot', requireRolePage('admin', '/admin/login'), async (req, res) => {
  try {
    // Normalize inputs
    const status = !!(req.body.chatbotStatus === 'on' || req.body.chatbotStatus === 'true' || req.body.chatbotStatus === true);
    let responses = req.body.chatbotResponses;
    try { if (typeof responses === 'string') responses = JSON.parse(responses); } catch (_) {}
    const platform = (req.body.chatbotPlatform || '').toLowerCase() || 'dialogflow';
    const value = { status, responses, platform };
    const [row, created] = await db.SystemSetting.findOrCreate({ where: { key: 'chatbot_settings' }, defaults: { value } });
    if (!created) await row.update({ value });
    return respondOk(req, res, '/admin/settings');
  } catch (err) { if (wantsJson(req)) return res.status(500).json({ error: err.message }); res.status(500).send(err.message); }
});

router.post('/admin/settings/wearables', requireRolePage('admin', '/admin/login'), async (req, res) => {
  try {
    const toBool = (v) => (v === 'on' || v === 'true' || v === true || v === '1');
    const googleFitEnabled = toBool(req.body.googleFitStatus);
    const healthKitEnabled = toBool(req.body.healthKitStatus);
    const freq = (req.body.syncFrequency || '').toLowerCase() || 'daily';
    const value = {
      googleFit: {
        enabled: googleFitEnabled,
        apiKey: req.body.googleFitApiKey || '',
        dataTypes: {
          heartRate: !!req.body.googleFitHeartRate,
          sleep: !!req.body.googleFitSleep,
          activity: !!req.body.googleFitActivity
        }
      },
      healthKit: {
        enabled: healthKitEnabled,
        apiKey: req.body.healthKitApiKey || '',
        dataTypes: {
          heartRate: !!req.body.healthKitHeartRate,
          sleep: !!req.body.healthKitSleep,
          activity: !!req.body.healthKitActivity
        }
      },
      frequency: freq
    };
    const [row, created] = await db.SystemSetting.findOrCreate({ where: { key: 'wearable_settings' }, defaults: { value } });
    if (!created) await row.update({ value });
    const redirectTo = (typeof req.body.redirectTo === 'string' && req.body.redirectTo) ? req.body.redirectTo : '/admin/settings';
    return respondOk(req, res, redirectTo);
  } catch (err) { if (wantsJson(req)) return res.status(500).json({ error: err.message }); res.status(500).send(err.message); }
});

router.post('/admin/settings/security', requireRolePage('admin', '/admin/login'), async (req, res) => {
  try {
    const twoFactorAuth = !!(req.body.twoFactorAuth === 'on' || req.body.twoFactorAuth === 'true' || req.body.twoFactorAuth === true);
    const encryptionLevel = (req.body.encryptionLevel || 'aes-256').toLowerCase();
    const sessionTimeout = parseInt(req.body.sessionTimeout, 10) || 30;
    const passwordPolicy = {
      length: !!(req.body.passwordLength === 'on' || req.body.passwordLength === 'true' || req.body.passwordLength === true),
      specialChar: !!(req.body.passwordSpecialChar === 'on' || req.body.passwordSpecialChar === 'true' || req.body.passwordSpecialChar === true)
    };
    const value = { twoFactorAuth, encryptionLevel, sessionTimeout, passwordPolicy };
    const [row, created] = await db.SystemSetting.findOrCreate({ where: { key: 'security_settings' }, defaults: { value } });
    if (!created) await row.update({ value });
    return respondOk(req, res, '/admin/settings');
  } catch (err) { if (wantsJson(req)) return res.status(500).json({ error: err.message }); res.status(500).send(err.message); }
});

// Roles & Permissions CRUD
router.post('/admin/settings/roles', requireRolePage('admin', '/admin/login'), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).send('name required');
    await db.Role.create({ name, permissions: { viewPatients: true } });
    return respondOk(req, res, '/admin/settings');
  } catch (err) { if (wantsJson(req)) return res.status(500).json({ error: err.message }); res.status(500).send(err.message); }
});

router.post('/admin/settings/roles/:id/update', requireRolePage('admin', '/admin/login'), async (req, res) => {
  try {
    const { name, permissions } = req.body;
    let parsedPerms = {};
    try { parsedPerms = permissions ? JSON.parse(permissions) : {}; } catch (_) { parsedPerms = {}; }
    await db.Role.update({ name, permissions: parsedPerms }, { where: { id: req.params.id } });
    return respondOk(req, res, '/admin/settings');
  } catch (err) { if (wantsJson(req)) return res.status(500).json({ error: err.message }); res.status(500).send(err.message); }
});

router.post('/admin/settings/roles/:id/delete', requireRolePage('admin', '/admin/login'), async (req, res) => {
  try {
    await db.Role.destroy({ where: { id: req.params.id } });
    return respondOk(req, res, '/admin/settings');
  } catch (err) { if (wantsJson(req)) return res.status(500).json({ error: err.message }); res.status(500).send(err.message); }
});

// Caregiver panel
router.get('/caregiver', requireRolePage('caregiver', '/caregiver/login'), (req, res) => res.redirect('/caregiver/dashboard'));

// Helper: resolve patient ids assigned to the current caregiver user
async function getAssignedPatientIds(caregiverUserId) {
  try {
    const caregiver = await db.Caregiver.findOne({ where: { user_id: caregiverUserId } });
    if (!caregiver) return [];
    const links = await db.PatientCaregiver.findAll({ where: { caregiver_id: caregiver.id } });
    return links.map(l => l.patient_id);
  } catch (_) { return []; }
}

async function loadCaregiverData(patientIds, caregiverUserId) {
  const wherePatients = Array.isArray(patientIds) && patientIds.length ? { id: patientIds } : undefined;
  const patients = await db.Patient.findAll({ where: wherePatients, include: [{ model: db.User, attributes: ['name'] }], order: [['id', 'ASC']] });

  // Alerts scoped by patients if provided
  const alertInclude = [{ model: db.Patient, include: [{ model: db.User, attributes: ['name'] }] }];
  if (wherePatients) { alertInclude[0].where = wherePatients; alertInclude[0].required = true; }
  const alerts = await db.AiAlert.findAll({ include: alertInclude, order: [['created_at', 'DESC']], limit: 20 });

  // Messages: include those to/from caregiver user and to/from assigned patients' users
  const includeMsg = [
    { model: db.User, as: 'receiver', attributes: ['name'] },
    { model: db.User, as: 'sender', attributes: ['name'] }
  ];
  const whereMsg = {};
  {
    const Op = db.Sequelize.Op;
    const ors = [];
    if (caregiverUserId) {
      ors.push({ sender_id: caregiverUserId });
      ors.push({ receiver_id: caregiverUserId });
    }
    if (wherePatients) {
      const patientUserIds = patients.map(p => p.user_id);
      if (patientUserIds.length) {
        ors.push({ sender_id: { [Op.in]: patientUserIds } });
        ors.push({ receiver_id: { [Op.in]: patientUserIds } });
      }
    }
    if (ors.length) whereMsg[Op.or] = ors;
  }
  const messages = await db.Message.findAll({ include: includeMsg, where: whereMsg, order: [['created_at', 'DESC']], limit: 20 });

  const Op = db.Sequelize.Op;
  const reportsWhere = (Array.isArray(patientIds) && patientIds.length) ? { patient_id: { [Op.in]: patientIds } } : undefined;
  const reports = await db.PatientReport.findAll({ where: reportsWhere, order: [['created_at', 'DESC']], limit: 20 });

  return { patients, alerts, messages, reports };
}

router.get('/caregiver/dashboard', requireRolePage('caregiver', '/caregiver/login'), async (req, res) => {
  try {
    const caregiverUserId = await resolveCaregiverUserId(req);
    const patientIds = await getAssignedPatientIds(caregiverUserId);
    const { patients, alerts, messages, reports } = await loadCaregiverData(patientIds, caregiverUserId);
    const caregiverId = caregiverUserId;

    // Build 7-day chart aggregates from HealthMetric (scoped by patientIds if available)
    const since = new Date(); since.setDate(since.getDate()-6);
    const Op = db.Sequelize.Op;
    const metricWhere = { recorded_at: { [Op.gte]: since } };
    if (Array.isArray(patientIds) && patientIds.length) metricWhere.patient_id = { [Op.in]: patientIds };
    const metrics = await db.HealthMetric.findAll({
      attributes: [
        [db.Sequelize.fn('date_trunc', 'day', db.Sequelize.col('recorded_at')), 'day'],
        [db.Sequelize.fn('avg', db.Sequelize.col('heart_rate')), 'avg_hr'],
        [db.Sequelize.fn('avg', db.Sequelize.col('sleep_hours')), 'avg_sleep'],
        [db.Sequelize.fn('avg', db.Sequelize.col('steps')), 'avg_steps']
      ],
      where: metricWhere,
      group: [db.Sequelize.fn('date_trunc', 'day', db.Sequelize.col('recorded_at'))],
      order: [[db.Sequelize.fn('date_trunc', 'day', db.Sequelize.col('recorded_at')), 'ASC']]
    });
    const labels = []; const hr = []; const sleep = []; const steps = [];
    for (let i=0;i<7;i++){ const d=new Date(since); d.setDate(since.getDate()+i); const key=d.toISOString().slice(0,10); labels.push(key); const row=metrics.find(m=>new Date(m.get('day')).toISOString().slice(0,10)===key); hr.push(row?Number(row.get('avg_hr'))||0:0); sleep.push(row?Number(row.get('avg_sleep'))||0:0); steps.push(row?Number(row.get('avg_steps'))||0:0); }
    const dashCharts = { labels, heartRate: hr, sleepQuality: sleep, steps };

    // Cards & distribution scoped to caregiver's patients
    const atRiskPatients = Array.isArray(patientIds) && patientIds.length
      ? await db.Patient.count({ where: { id: { [Op.in]: patientIds }, health_status: 'at-risk' } })
      : await db.Patient.count({ where: { health_status: 'at-risk' } });

    const criticalAlerts = Array.isArray(patientIds) && patientIds.length
      ? await db.AiAlert.count({ where: { patient_id: { [Op.in]: patientIds }, severity: 'critical' } })
      : await db.AiAlert.count({ where: { severity: 'critical' } });

    const unreadMessages = await db.Message.count({ where: { receiver_id: caregiverId } });

    const pendingRecs = await db.DoctorNote.findAll({
      where: { note_type: 'recommendation', status: 'pending' },
      include: [
        { model: db.Patient, where: (Array.isArray(patientIds)&&patientIds.length)?{ id: { [Op.in]: patientIds } }:undefined, required: (Array.isArray(patientIds)&&patientIds.length) || false, include: [{ model: db.User, attributes: ['name'] }] }
      ],
      order: [['created_at','DESC']],
      limit: 10
    });

    res.render('caregiver/dashboard', { layout: 'layouts/caregiver_layout', active: 'dashboard', patients, alerts, messages, reports, caregiverId, dashCharts, cards: { totalPatients: patients.length, criticalAlerts, atRiskPatients, unreadMessages }, pendingRecs });
  } catch (err) { res.status(500).send(err.message); }
});

// Caregiver dashboard API
router.get('/caregiver/api/dashboard', requireRolePage('caregiver', '/caregiver/login'), async (req, res) => {
  try {
    const caregiverUserId = await resolveCaregiverUserId(req);
    const patientIds = await getAssignedPatientIds(caregiverUserId);
    const Op = db.Sequelize.Op;
    const patientWhere = (Array.isArray(patientIds) && patientIds.length) ? { id: { [Op.in]: patientIds } } : {};

    const totalPatients = await db.Patient.count({ where: patientWhere });
    const criticalAlerts = await db.AiAlert.count({ where: (patientWhere.id?{ patient_id: patientWhere.id, severity: 'critical' }:{ severity: 'critical' }) });
    const atRiskPatients = await db.Patient.count({ where: Object.assign({ health_status: 'at-risk' }, patientWhere) });
    const unreadMessages = await db.Message.count({ where: { receiver_id: caregiverUserId } });

    // Status distribution
    const rawStatuses = await db.Patient.findAll({ attributes: ['health_status', [db.Sequelize.fn('count', '*'), 'count']], where: patientWhere, group: ['health_status'] });
    const statusDistribution = { stable: 0, 'at-risk': 0, critical: 0 };
    rawStatuses.forEach(r => { statusDistribution[String(r.get('health_status')||'stable')] = Number(r.get('count')); });

    // 7-day metrics (scoped)
    const since = new Date(); since.setDate(since.getDate()-6);
    const metricWhere = { recorded_at: { [Op.gte]: since } };
    if (patientWhere.id) metricWhere.patient_id = patientWhere.id;
    const rows = await db.HealthMetric.findAll({ where: metricWhere, order: [['recorded_at','ASC']], limit: 1000 });
    const labels = Array.from({length:7},(_,i)=>{ const d=new Date(since); d.setDate(d.getDate()+i); return d.toISOString().slice(0,10); });
    const byDay = {}; rows.forEach(m=>{ const k=new Date(m.recorded_at).toISOString().slice(0,10); if(!byDay[k]) byDay[k]=[]; byDay[k].push(m); });
    const avg=a=>a.length?(a.reduce((x,y)=>x+y,0)/a.length):0;
    const heartRate = labels.map(k=>avg((byDay[k]||[]).map(m=>m.heart_rate||0)));
    const sleepQuality = labels.map(k=>avg((byDay[k]||[]).map(m=>m.sleep_hours||0)));
    const steps = labels.map(k=>avg((byDay[k]||[]).map(m=>m.steps||0)));
    res.json({ labels, heartRate, sleepQuality, steps, statusDistribution, cards: { totalPatients, criticalAlerts, atRiskPatients, unreadMessages } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/caregiver/patient-list', requireRolePage('caregiver', '/caregiver/login'), async (req, res) => {
  try {
    const caregiverId = await resolveCaregiverUserId(req);
    const patients = await db.Patient.findAll({ 
      include: [
        { 
          model: db.User, 
          attributes: ['name', 'date_of_birth', 'email'],
          include: [
            { 
              model: db.WearableDevice, 
              attributes: ['device_type', 'status'], 
              where: { status: 'connected' }, 
              required: false 
            }
          ]
        }
      ], 
      order: [['id','ASC']] 
    });
    res.render('caregiver/patients', { layout: 'layouts/caregiver_layout', active: 'patients', patients, caregiverId });
  } catch (err) { res.status(500).send(err.message); }
});

router.get('/caregiver/under-care', requireRolePage('caregiver', '/caregiver/login'), async (req, res) => {
  try {
    const caregiverId = await resolveCaregiverUserId(req);
    const patientIds = await getAssignedPatientIds(caregiverId);
    const { patients } = await loadCaregiverData(patientIds, caregiverId);
    res.render('caregiver/under_care', { layout: 'layouts/caregiver_layout', active: 'under-care', patients, caregiverId });
  } catch (err) { res.status(500).send(err.message); }
});

// API to get metrics for a patient for charts
router.get('/caregiver/api/metrics', requireRolePage('caregiver', '/caregiver/login'), async (req, res) => {
  try {
    const { patientId, days } = req.query;
    if (!patientId) return res.status(400).json({ error: 'patientId required' });
    const since = new Date();
    since.setDate(since.getDate() - (parseInt(days, 10) || 7));
    const metrics = await db.HealthMetric.findAll({
      where: { patient_id: patientId, recorded_at: { [db.Sequelize.Op.gte]: since } },
      order: [['recorded_at', 'ASC']],
      limit: 500
    });
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/caregiver/messages', requireRolePage('caregiver', '/caregiver/login'), async (req, res) => {
  try {
    const caregiverId = await resolveCaregiverUserId(req);
    const patientIds = await getAssignedPatientIds(caregiverId);
    const { patients, messages } = await loadCaregiverData(patientIds, caregiverId);
    res.render('caregiver/messages', { layout: 'layouts/caregiver_layout', active: 'messages', patients, messages, caregiverId });
  } catch (err) { res.status(500).send(err.message); }
});

// Caregiver: view message thread with a user
router.get('/caregiver/messages/thread/:userId', requireRolePage('caregiver', '/caregiver/login'), async (req, res) => {
  try {
    const caregiverId = await resolveCaregiverUserId(req);
    const otherUserId = parseInt(req.params.userId, 10);
    const Op = db.Sequelize.Op;
    const thread = await db.Message.findAll({
      where: {
        [Op.or]: [
          { sender_id: caregiverId, receiver_id: otherUserId },
          { sender_id: otherUserId, receiver_id: caregiverId }
        ]
      },
      include: [
        { model: db.User, as: 'receiver', attributes: ['id','name'] },
        { model: db.User, as: 'sender', attributes: ['id','name'] }
      ],
      order: [['created_at', 'ASC']],
      limit: 200
    });
    const otherUser = await db.User.findByPk(otherUserId, { attributes: ['id','name'] });
    const patientIds = await getAssignedPatientIds(caregiverId);
    const { patients } = await loadCaregiverData(patientIds, caregiverId);
    res.render('caregiver/thread', { layout: 'layouts/caregiver_layout', active: 'messages', caregiverId, otherUser, thread, patients });
  } catch (err) { res.status(500).send(err.message); }
});

// Caregiver: delete a message (own sent or received within thread)
router.post('/caregiver/messages/:id/delete', requireRolePage('caregiver', '/caregiver/login'), async (req, res) => {
  try {
    const caregiverId = await resolveCaregiverUserId(req);
    const id = parseInt(req.params.id, 10);
    const msg = await db.Message.findByPk(id);
    if (!msg) return respondOk(req, res, '/caregiver/messages', { ok: false, error: 'not found' });

    // Allowed if caregiver is a participant OR message involves one of caregiver's assigned patients
    let allowed = (msg.sender_id === caregiverId || msg.receiver_id === caregiverId);
    if (!allowed) {
      const patientIds = await getAssignedPatientIds(caregiverId);
      if (Array.isArray(patientIds) && patientIds.length) {
        const patients = await db.Patient.findAll({ where: { id: patientIds }, attributes: ['user_id'] });
        const patientUserIds = patients.map(p => p.user_id);
        allowed = patientUserIds.includes(msg.sender_id) || patientUserIds.includes(msg.receiver_id);
      }
    }

    if (!allowed) return respondOk(req, res, '/caregiver/messages', { ok: false, error: 'forbidden' });

    await db.Message.destroy({ where: { id } });
    return respondOk(req, res, '/caregiver/messages', { ok: true });
  } catch (err) { if (wantsJson(req)) return res.status(500).json({ error: err.message }); res.status(500).send(err.message); }
});

router.get('/caregiver/reports', requireRolePage('caregiver', '/caregiver/login'), async (req, res) => {
  try {
    const caregiverId = await resolveCaregiverUserId(req);
    const patientIds = await getAssignedPatientIds(caregiverId);
    const { patients } = await loadCaregiverData(patientIds, caregiverId);
    const { pid } = req.query;
    const where = {};
    if (pid) where.patient_id = pid;
    const reports = await db.PatientReport.findAll({ where, order: [['created_at', 'DESC']], limit: 200 });
    res.render('caregiver/reports', { layout: 'layouts/caregiver_layout', active: 'reports', patients, reports, caregiverId, selectedPid: pid || '' });
  } catch (err) { res.status(500).send(err.message); }
});

router.get('/caregiver/recommendations', requireRolePage('caregiver', '/caregiver/login'), async (req, res) => {
  try {
    const caregiverId = await resolveCaregiverUserId(req);
    const patientIds = await getAssignedPatientIds(caregiverId);
    const { patients } = await loadCaregiverData(patientIds, caregiverId);
    const recommendations = await db.DoctorNote.findAll({
      where: { note_type: 'recommendation' },
      include: [
        { model: db.Patient, include: [{ model: db.User, attributes: ['name'] }] }
      ],
      order: [['created_at', 'DESC']],
      limit: 200
    });
    res.render('caregiver/recommendations', { layout: 'layouts/caregiver_layout', active: 'recommendations', patients, caregiverId, recommendations });
  } catch (err) { res.status(500).send(err.message); }
});

router.get('/caregiver/settings', requireRolePage('caregiver', '/caregiver/login'), async (req, res) => {
  try {
    const caregiverId = await resolveCaregiverUserId(req);
    const patientIds = await getAssignedPatientIds(caregiverId);
    const { patients } = await loadCaregiverData(patientIds, caregiverId);
    const [settings] = await db.AlertSetting.findAll({ where: { user_id: caregiverId }, limit: 1 });
    res.render('caregiver/settings', { layout: 'layouts/caregiver_layout', active: 'settings', patients, caregiverId, settings });
  } catch (err) { res.status(500).send(err.message); }
});

router.post('/caregiver/assign', requireRolePage('caregiver', '/caregiver/login'), async (req, res) => {
  try {
    const { patient_id } = req.body;
    const caregiverUserId = req.user?.id;
    if (!caregiverUserId) {
      if (wantsJson(req)) return res.status(401).json({ error: 'not authenticated' });
      return res.status(401).send('not authenticated');
    }

    // Validate caregiver user exists
    const caregiverUser = await db.User.findByPk(caregiverUserId);
    if (!caregiverUser) {
      if (wantsJson(req)) return res.status(400).json({ error: 'caregiver user not found' });
      return res.status(400).send('caregiver user not found');
    }

    // Validate patient exists
    const patient = await db.Patient.findByPk(patient_id);
    if (!patient) {
      if (wantsJson(req)) return res.status(404).json({ error: 'patient not found' });
      return res.status(404).send('patient not found');
    }

    // Ensure caregiver profile exists for this user
    let caregiver = await db.Caregiver.findOne({ where: { user_id: caregiverUserId } });
    if (!caregiver) {
      caregiver = await db.Caregiver.create({ user_id: caregiverUserId, relationship: 'self' });
    }

    await db.PatientCaregiver.findOrCreate({ where: { caregiver_id: caregiver.id, patient_id }, defaults: { caregiver_id: caregiver.id, patient_id } });
    return respondOk(req, res, '/caregiver/patient-list');
  } catch (err) {
    if (wantsJson(req)) return res.status(500).json({ error: err.message });
    res.status(500).send(err.message);
  }
});

// Caregiver: add patient (simplified demo — creates User + Patient)
router.post('/caregiver/patients', requireRolePage('caregiver', '/caregiver/login'), async (req, res) => {
  try {
    const { patientName, patientAge, email, password } = req.body;
    const name = String(patientName || '').trim();
    const providedEmail = String(email || '').trim();
    const providedPassword = String(password || '').trim();

    if (!name) return res.status(400).json({ error: 'patientName is required' });
    if (!providedEmail) return res.status(400).json({ error: 'email is required' });
    if (!providedPassword || providedPassword.length < 6) return res.status(400).json({ error: 'password must be at least 6 characters' });

    // Calculate date of birth from age
    const age = parseInt(patientAge) || 0;
    const dateOfBirth = new Date();
    dateOfBirth.setFullYear(dateOfBirth.getFullYear() - age);

    const bcrypt = require('bcryptjs');
    const password_hash = await bcrypt.hash(providedPassword, 8);
    // Ensure we have the 'patient' role and use its id
    const [patientRole] = await db.Role.findOrCreate({ where: { name: 'patient' }, defaults: { name: 'patient', description: 'Patient' } });
    const roleId = patientRole.id;
    const user = await db.User.create({ 
      name, 
      email: providedEmail, 
      role_id: roleId, 
      status: 'active', 
      password_hash,
      date_of_birth: dateOfBirth
    });
    await db.Patient.create({ user_id: user.id });
    return respondOk(req, res, '/caregiver/patient-list');
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      if (wantsJson(req)) return res.status(409).json({ error: 'email already exists' });
      return res.status(409).send('email already exists');
    }
    if (wantsJson(req)) return res.status(500).json({ error: err.message });
    res.status(500).send(err.message);
  }
});

// Caregiver: send message
router.post('/caregiver/messages/send', requireRolePage('caregiver', '/caregiver/login'), async (req, res) => {
  try {
    const { recipient, content, sender_id: senderFromBody } = req.body;
    const text = String(content || '').trim();
    const receiver_id = parseInt(recipient, 10) || null;
    let sender_id = (req.user && req.user.id) ? parseInt(req.user.id, 10) : null;
    if (!sender_id && senderFromBody !== undefined) sender_id = parseInt(senderFromBody, 10) || null;

    if (!sender_id) {
      // Best-effort fallback to first caregiver user (demo mode)
      const caregiverRole = await db.Role.findOne({ where: { name: 'caregiver' } });
      const fallbackUser = caregiverRole
        ? await db.User.findOne({ where: { role_id: caregiverRole.id }, order: [['id', 'ASC']] })
        : await db.User.findOne({ order: [['id', 'ASC']] });
      sender_id = fallbackUser ? fallbackUser.id : null;
    }

    if (!sender_id) return res.status(401).json({ error: 'sender not resolved; please login' });
    if (!receiver_id) return res.status(400).json({ error: 'recipient required' });
    if (!text) return res.status(400).json({ error: 'content required' });

    // Validate FK existence
    let [senderExists, receiverExists] = await Promise.all([
      db.User.count({ where: { id: sender_id } }),
      db.User.count({ where: { id: receiver_id } })
    ]);
    if (!senderExists) {
      // Try to resolve a valid caregiver/user as fallback
      const caregiverRole = await db.Role.findOne({ where: { name: 'caregiver' } });
      const fallbackUser = caregiverRole
        ? await db.User.findOne({ where: { role_id: caregiverRole.id }, order: [['id', 'ASC']] })
        : await db.User.findOne({ order: [['id', 'ASC']] });
      if (fallbackUser) {
        sender_id = fallbackUser.id;
        senderExists = 1;
      }
    }
    if (!senderExists) return res.status(400).json({ error: 'invalid sender' });
    if (!receiverExists) return res.status(400).json({ error: 'invalid recipient' });

    await db.Message.create({ sender_id, receiver_id, content: text, message_type: 'text', created_at: new Date() });
    return respondOk(req, res, '/caregiver/messages', { ok: true });
  } catch (err) {
    if (wantsJson(req)) return res.status(500).json({ error: err.message });
    res.status(500).send(err.message);
  }
});

// Caregiver: acknowledge/dismiss alerts
router.post('/caregiver/alerts/:id/ack', requireRolePage('caregiver', '/caregiver/login'), async (req, res) => {
  try {
    await db.AiAlert.update({ status: 'acknowledged' }, { where: { id: req.params.id } });
    return respondOk(req, res, '/caregiver/dashboard');
  } catch (err) {
    if (wantsJson(req)) return res.status(500).json({ error: err.message });
    res.status(500).send(err.message);
  }
});

router.post('/caregiver/alerts/:id/dismiss', requireRolePage('caregiver', '/caregiver/login'), async (req, res) => {
  try {
    await db.AiAlert.update({ status: 'dismissed' }, { where: { id: req.params.id } });
    return respondOk(req, res, '/caregiver/dashboard');
  } catch (err) {
    if (wantsJson(req)) return res.status(500).json({ error: err.message });
    res.status(500).send(err.message);
  }
});

// Caregiver: export reports (CSV minimal)
router.get('/caregiver/reports/export', requireRolePage('caregiver', '/caregiver/login'), async (req, res) => {
  try {
    const { format, pid } = req.query;
    const where = {};
    if (pid) where.patient_id = pid;
    const reports = await db.PatientReport.findAll({ where, order: [['created_at', 'DESC']], limit: 2000 });

    const records = reports.map(r => ({
      patient_id: r.patient_id,
      created_at: r.created_at?.toISOString?.() || r.created_at,
      report_type: r.report_type || '',
      content: r.content ? (typeof r.content === 'object' ? JSON.stringify(r.content) : String(r.content)) : ''
    }));

    if ((format || '').toLowerCase() === 'pdf') {
      const PDFDocument = require('pdfkit');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="reports${pid?`_PT${pid}`:''}.pdf"`);
      const doc = new PDFDocument({ margin: 36 });
      doc.pipe(res);
      doc.fontSize(16).text('Caregiver Reports Export', { align: 'center' });
      if (pid) doc.moveDown(0.5).fontSize(10).text(`Patient: PT${pid}`, { align: 'center' });
      doc.moveDown();
      records.forEach((rec, idx) => {
        doc.fontSize(12).text(`#${idx+1}  PT${rec.patient_id}  ${rec.created_at}`);
        doc.fontSize(11).text(`Type: ${rec.report_type}`);
        doc.fontSize(10).text(`Content: ${rec.content}`);
        doc.moveDown();
      });
      doc.end();
      return;
    }

    if ((format || '').toLowerCase() === 'excel') {
      try {
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Reports');
        worksheet.columns = [
          { header: 'patient_id', key: 'patient_id', width: 12 },
          { header: 'created_at', key: 'created_at', width: 20 },
          { header: 'report_type', key: 'report_type', width: 20 },
          { header: 'content', key: 'content', width: 60 }
        ];
        records.forEach(r => worksheet.addRow(r));
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="reports${pid?`_PT${pid}`:''}.xlsx"`);
        await workbook.xlsx.write(res);
        return res.end();
      } catch (e) {
        // Fallback to CSV if exceljs is unavailable
      }
    }

    // Default to CSV compatible with Excel
    const headers = ['patient_id','created_at','report_type','content'];
    const rows = [headers].concat(
      records.map(rec => headers.map(h => `"${String(rec[h]).replace(/"/g, '""')}"`))
    );
    const csv = rows.map(r => r.join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    const filename = `reports${pid?`_PT${pid}`:''}.csv`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    if (wantsJson(req)) return res.status(500).json({ error: err.message });
    res.status(500).send(err.message);
  }
});

// Caregiver: save settings
router.post('/caregiver/settings', async (req, res) => {
  try {
    const { notificationPreference, alertThreshold, language } = req.body;
    const user_id = req.user?.id || 1;
    const [row, created] = await db.AlertSetting.findOrCreate({
      where: { user_id },
      defaults: { heart_rate_threshold: alertThreshold || null, sleep_threshold: null, activity_threshold: null, language: language || 'en', notification_preference: notificationPreference || 'email' }
    });
    if (!created) {
      await row.update({ heart_rate_threshold: alertThreshold || null, language: language || row.language, notification_preference: notificationPreference || row.notification_preference });
    }
    return respondOk(req, res, '/caregiver/settings');
  } catch (err) {
    if (wantsJson(req)) return res.status(500).json({ error: err.message });
    res.status(500).send(err.message);
  }
});

// Caregiver: create recommendation (stored as DoctorNote with note_type 'recommendation')
router.post('/caregiver/recommendations', async (req, res) => {
  try {
    const { patientId, content } = req.body;
    await db.DoctorNote.create({ patient_id: patientId, doctor_id: null, note_type: 'recommendation', status: 'pending', content, created_at: new Date() });
    return respondOk(req, res, '/caregiver/recommendations');
  } catch (err) {
    if (wantsJson(req)) return res.status(500).json({ error: err.message });
    res.status(500).send(err.message);
  }
});

router.post('/caregiver/recommendations/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await db.DoctorNote.update({ status }, { where: { id: req.params.id } });
    return respondOk(req, res, '/caregiver/recommendations');
  } catch (err) { if (wantsJson(req)) return res.status(500).json({ error: err.message }); res.status(500).send(err.message); }
});

router.post('/caregiver/recommendations/:id/delete', async (req, res) => {
  try {
    await db.DoctorNote.destroy({ where: { id: req.params.id } });
    return respondOk(req, res, '/caregiver/recommendations');
  } catch (err) { if (wantsJson(req)) return res.status(500).json({ error: err.message }); res.status(500).send(err.message); }
});

// DEV: quick demo data populate for caregiver panel
router.post('/caregiver/dev/populate', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'disabled in production' });
    const userId = req.user?.id || 1;
    // Find or create a patient
    let patient = await db.Patient.findOne({ include: [{ model: db.User, attributes: ['name'] }], order: [['id','ASC']] });
    if (!patient) {
      const bcrypt = require('bcryptjs');
      const password_hash = await bcrypt.hash('ChangeMe123!', 8);
      const [patientRole] = await db.Role.findOrCreate({ where: { name: 'patient' }, defaults: { name: 'patient', description: 'Patient' } });
      const u = await db.User.create({ name: 'Demo Patient', email: `demo_patient_${Date.now()}@local`, password_hash, role_id: patientRole.id, status: 'active' });
      patient = await db.Patient.create({ user_id: u.id, cancer_type: 'Demo', diagnosis_date: new Date(), treatment_plan: 'Demo' });
    }
    // Ensure assigned to caregiver 1 (or current user)
    const caregiverId = 1;
    await db.PatientCaregiver.findOrCreate({ where: { patient_id: patient.id, caregiver_id: caregiverId }, defaults: { patient_id: patient.id, caregiver_id: caregiverId } });

    const now = new Date();
    const day = 24*3600*1000;
    const safe = async (fn) => { try { await fn(); } catch (_) {} };

    // Health metrics for last 7 days
    for (let i=6;i>=0;i--) {
      const d = new Date(now.getTime() - i*day);
      await safe(()=>db.HealthMetric.create({ patient_id: patient.id, source: 'fitbit', heart_rate: 65+Math.floor(Math.random()*20), spo2: 95+Math.floor(Math.random()*4), temperature: 36+Math.random(), steps: 3000+Math.floor(Math.random()*5000), sleep_hours: 6+Math.random()*2, recorded_at: d }));
    }
    // Emotions
    await safe(()=>db.Emotion.create({ patient_id: patient.id, emotion_type: 'anxiety', intensity: 2, notes: 'mild', recorded_at: now }));
    await safe(()=>db.Emotion.create({ patient_id: patient.id, emotion_type: 'calm', intensity: 3, notes: 'after walk', recorded_at: new Date(now.getTime()-2*day) }));
    // Symptoms
    await safe(()=>db.Symptom.create({ patient_id: patient.id, symptom_type: 'nausea', severity: 2, notes: 'morning', recorded_at: new Date(now.getTime()-day) }));
    // Reports
    await safe(()=>db.PatientReport.create({ patient_id: patient.id, report_type: 'weekly_summary', content: { steps: 22000, avg_hr: 72, note: 'stable' }, created_at: now }));
    await safe(()=>db.PatientReport.create({ patient_id: patient.id, report_type: 'recommendation', content: { text: 'Increase hydration and light activity.' }, created_at: new Date(now.getTime()-2*day) }));
    // Alerts
    await safe(()=>db.AiAlert.create({ patient_id: patient.id, alert_type: 'high_heart_rate', severity: 'low', description: 'Slightly elevated average HR', created_at: now }));
    // Messages
    await safe(()=>db.Message.create({ sender_id: userId, receiver_id: 1, message_type: 'text', content: 'Checking in with patient.', created_at: now }));

    return res.json({ ok: true, patient_id: patient.id });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

module.exports = router;


