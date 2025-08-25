const express = require('express');
const router = express.Router();
const db = require('../models');

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

// Admin panel
router.get(['/admin', '/admin/index'], async (req, res) => {
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

router.get('/admin/users', async (req, res) => {
  try {
    const { q, role, status } = req.query;
    const where = {};
    if (q) {
      where[db.Sequelize.Op.or] = [
        { name: { [db.Sequelize.Op.iLike]: `%${q}%` } },
        { email: { [db.Sequelize.Op.iLike]: `%${q}%` } }
      ];
    }
    if (role) {
      const roleMap = { patient: 3, caregiver: 4, doctor: 2, admin: 1 };
      const roleId = roleMap[role] || parseInt(role, 10);
      if (roleId) where.role_id = roleId;
    }
    if (status) where.status = status;
    const users = await db.User.findAll({ where, attributes: { exclude: ['password_hash'] }, order: [['id', 'ASC']] });
    res.render('admin/users', { layout: 'layouts/admin_layout', active: 'users', title: 'User Management', users });
  } catch (err) {
    if (wantsJson(req)) return res.status(500).json({ error: err.message });
    res.status(500).send(err.message);
  }
});

// Admin users CRUD and actions
router.post('/admin/users', async (req, res) => {
  try {
    const { name, email, role_id, status, password } = req.body;
    const bcrypt = require('bcryptjs');
    const password_hash = password ? await bcrypt.hash(password, 8) : await bcrypt.hash('ChangeMe123!', 8);
    await db.User.create({ name, email, role_id: parseInt(role_id, 10) || null, status: status || 'active', password_hash });
    res.redirect('/admin/users');
  } catch (err) {
    if (wantsJson(req)) return res.status(500).json({ error: err.message });
    res.status(500).send(err.message);
  }
});

router.post('/admin/users/:id/update', async (req, res) => {
  try {
    const { name, email, role_id, status } = req.body;
    await db.User.update({ name, email, role_id: parseInt(role_id, 10) || null, status }, { where: { id: req.params.id } });
    res.redirect('/admin/users');
  } catch (err) {
    if (wantsJson(req)) return res.status(500).json({ error: err.message });
    res.status(500).send(err.message);
  }
});

router.post('/admin/users/:id/delete', async (req, res) => {
  try {
    await db.User.destroy({ where: { id: req.params.id } });
    res.redirect('/admin/users');
  } catch (err) {
    if (wantsJson(req)) return res.status(500).json({ error: err.message });
    res.status(500).send(err.message);
  }
});

router.post('/admin/users/:id/reset-password', async (req, res) => {
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

router.post('/admin/users/:id/verify', async (req, res) => {
  try {
    await db.User.update({ is_verified: true }, { where: { id: req.params.id } });
    res.redirect('/admin/users');
  } catch (err) {
    if (wantsJson(req)) return res.status(500).json({ error: err.message });
    res.status(500).send(err.message);
  }
});

router.get('/admin/alerts', async (req, res) => {
  try {
    const alerts = await db.AiAlert.findAll({ include: [{ model: db.Patient, include: [{ model: db.User, attributes: ['name'] }] }], order: [['created_at', 'DESC']], limit: 200 });
    res.render('admin/alerts', { layout: 'layouts/admin_layout', active: 'alerts', title: 'Alerts', alerts });
  } catch (err) {
    if (wantsJson(req)) return res.status(500).json({ error: err.message });
    res.status(500).send(err.message);
  }
});

router.get('/admin/patients', async (req, res) => {
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
router.get('/admin/patients/:id/details', async (req, res) => {
  try {
    const id = req.params.id;
    const patient = await db.Patient.findOne({ where: { id }, include: [{ model: db.User, attributes: ['name', 'email'] }] });
    const metrics = await db.HealthMetric.findAll({ where: { patient_id: id }, order: [['recorded_at', 'DESC']], limit: 20 });
    const alerts = await db.AiAlert.findAll({ where: { patient_id: id }, order: [['created_at', 'DESC']], limit: 10 });
    const notes = await db.DoctorNote.findAll({ where: { patient_id: id }, order: [['created_at', 'DESC']], limit: 10 });
    return res.json({ patient, metrics, alerts, notes });
  } catch (err) { if (wantsJson(req)) return res.status(500).json({ error: err.message }); res.status(500).send(err.message); }
});
router.post('/admin/patients', async (req, res) => {
  try {
    const { user_id, cancer_type, diagnosis_date, assigned_doctor_id } = req.body;
    await db.Patient.create({ user_id, cancer_type, diagnosis_date, assigned_doctor_id });
    res.redirect('/admin/patients');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post('/admin/patients/:id/delete', async (req, res) => {
  try {
    await db.Patient.destroy({ where: { id: req.params.id } });
    res.redirect('/admin/patients');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post('/admin/alerts/:id/confirm', async (req, res) => {
  try {
    await db.AiAlert.update({ status: 'confirmed' }, { where: { id: req.params.id } });
    res.redirect('/admin/alerts');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post('/admin/alerts/:id/reject', async (req, res) => {
  try {
    await db.AiAlert.update({ status: 'rejected' }, { where: { id: req.params.id } });
    res.redirect('/admin/alerts');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post('/admin/alert-settings', async (req, res) => {
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
router.get('/admin/messages', async (req, res) => {
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
    res.render('admin/messages', { layout: 'layouts/admin_layout', active: 'messages', title: 'Messages', messages, users });
  } catch (err) {
    res.status(500).send(err.message);
  }
});
router.post('/admin/messages/send', async (req, res) => {
  try {
    const { recipientType, recipient, groupRecipient, content } = req.body;
    const sender_id = req.user?.id || 1; // demo
    const isIndividual = recipientType === 'individual';
    const receiver_id = isIndividual ? parseInt(recipient, 10) || null : null;
    const message_type = isIndividual ? 'text' : `group:${groupRecipient || 'all'}`;
    await db.Message.create({ sender_id, receiver_id, content, message_type, created_at: new Date() });
    res.redirect('/admin/messages');
  } catch (err) {
    res.status(500).send(err.message);
  }
});
router.get('/admin/reports', async (req, res) => {
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

    res.render('admin/reports', { layout: 'layouts/admin_layout', active: 'reports', title: 'Reports', patientReports, summary, adminReportCharts });
  } catch (err) {
    res.status(500).send(err.message);
  }
});
router.get('/admin/settings', async (req, res) => {
  try {
    const roles = await db.Role.findAll({ order: [['id', 'ASC']] });
    res.render('admin/settings', { layout: 'layouts/admin_layout', active: 'settings', title: 'Settings', roles });
  } catch (err) { if (wantsJson(req)) return res.status(500).json({ error: err.message }); res.status(500).send(err.message); }
});
router.get('/admin/advanced-analytics', (req, res) => res.render('admin/advanced_analytics', { layout: 'layouts/admin_layout', active: 'advanced', title: 'Advanced Analytics' }));
router.get('/admin/wearable-management', async (req, res) => {
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
    const devices = await db.WearableDevice.findAll({ where, order: [['updated_at', 'DESC']], limit: 500 });
    res.render('admin/wearable_management', { layout: 'layouts/admin_layout', active: 'wearable', title: 'Wearable Management', devices, q: q || '', type: type || '' });
  } catch (err) { if (wantsJson(req)) return res.status(500).json({ error: err.message }); res.status(500).send(err.message); }
});

// Wearable devices CRUD
router.post('/admin/wearables/connect', async (req, res) => {
  try {
    const { userId, deviceType, deviceId } = req.body;
    await db.WearableDevice.create({ user_id: userId, device_type: deviceType, device_id: deviceId, status: 'connected', last_sync: null });
    return respondOk(req, res, '/admin/wearable-management');
  } catch (err) { if (wantsJson(req)) return res.status(500).json({ error: err.message }); res.status(500).send(err.message); }
});

router.post('/admin/wearables/:deviceId/disconnect', async (req, res) => {
  try {
    await db.WearableDevice.update({ status: 'disconnected' }, { where: { device_id: req.params.deviceId } });
    return respondOk(req, res, '/admin/wearable-management');
  } catch (err) { if (wantsJson(req)) return res.status(500).json({ error: err.message }); res.status(500).send(err.message); }
});

router.post('/admin/wearables/:deviceId/reconnect', async (req, res) => {
  try {
    await db.WearableDevice.update({ status: 'connected', last_sync: new Date() }, { where: { device_id: req.params.deviceId } });
    return respondOk(req, res, '/admin/wearable-management');
  } catch (err) { if (wantsJson(req)) return res.status(500).json({ error: err.message }); res.status(500).send(err.message); }
});

// Export wearable devices (CSV)
router.get('/admin/wearables/export', async (req, res) => {
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
router.post('/admin/settings/chatbot', async (req, res) => {
  try {
    const value = { status: req.body.chatbotStatus, responses: req.body.chatbotResponses, platform: req.body.chatbotPlatform };
    const [row, created] = await db.SystemSetting.findOrCreate({ where: { key: 'chatbot_settings' }, defaults: { value } });
    if (!created) await row.update({ value });
    return respondOk(req, res, '/admin/settings');
  } catch (err) { if (wantsJson(req)) return res.status(500).json({ error: err.message }); res.status(500).send(err.message); }
});

router.post('/admin/settings/wearables', async (req, res) => {
  try {
    const value = {
      googleFit: { enabled: req.body.googleFitStatus, apiKey: req.body.googleFitApiKey },
      healthKit: { enabled: req.body.healthKitStatus, apiKey: req.body.healthKitApiKey },
      frequency: req.body.syncFrequency
    };
    const [row, created] = await db.SystemSetting.findOrCreate({ where: { key: 'wearable_settings' }, defaults: { value } });
    if (!created) await row.update({ value });
    return respondOk(req, res, '/admin/settings');
  } catch (err) { if (wantsJson(req)) return res.status(500).json({ error: err.message }); res.status(500).send(err.message); }
});

router.post('/admin/settings/security', async (req, res) => {
  try {
    const value = {
      twoFactorAuth: req.body.twoFactorAuth,
      encryptionLevel: req.body.encryptionLevel,
      sessionTimeout: req.body.sessionTimeout,
      passwordPolicy: { length: req.body.passwordLength, specialChar: req.body.passwordSpecialChar }
    };
    const [row, created] = await db.SystemSetting.findOrCreate({ where: { key: 'security_settings' }, defaults: { value } });
    if (!created) await row.update({ value });
    return respondOk(req, res, '/admin/settings');
  } catch (err) { if (wantsJson(req)) return res.status(500).json({ error: err.message }); res.status(500).send(err.message); }
});

// Roles & Permissions CRUD
router.post('/admin/settings/roles', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).send('name required');
    await db.Role.create({ name, permissions: { viewPatients: true } });
    return respondOk(req, res, '/admin/settings');
  } catch (err) { if (wantsJson(req)) return res.status(500).json({ error: err.message }); res.status(500).send(err.message); }
});

router.post('/admin/settings/roles/:id/update', async (req, res) => {
  try {
    const { name, permissions } = req.body;
    let parsedPerms = {};
    try { parsedPerms = permissions ? JSON.parse(permissions) : {}; } catch (_) { parsedPerms = {}; }
    await db.Role.update({ name, permissions: parsedPerms }, { where: { id: req.params.id } });
    return respondOk(req, res, '/admin/settings');
  } catch (err) { if (wantsJson(req)) return res.status(500).json({ error: err.message }); res.status(500).send(err.message); }
});

router.post('/admin/settings/roles/:id/delete', async (req, res) => {
  try {
    await db.Role.destroy({ where: { id: req.params.id } });
    return respondOk(req, res, '/admin/settings');
  } catch (err) { if (wantsJson(req)) return res.status(500).json({ error: err.message }); res.status(500).send(err.message); }
});

// Caregiver panel
router.get('/caregiver', (req, res) => res.redirect('/caregiver/dashboard'));

async function loadCaregiverData() {
  const patients = await db.Patient.findAll({ include: [{ model: db.User, attributes: ['name'] }], order: [['id', 'ASC']] });
  const alerts = await db.AiAlert.findAll({ include: [{ model: db.Patient, include: [{ model: db.User, attributes: ['name'] }] }], order: [['created_at', 'DESC']], limit: 20 });
  const messages = await db.Message.findAll({
    include: [
      { model: db.User, as: 'receiver', attributes: ['name'] },
      { model: db.User, as: 'sender', attributes: ['name'] }
    ],
    order: [['created_at', 'DESC']],
    limit: 20
  });
  const reports = await db.PatientReport.findAll({ order: [['created_at', 'DESC']], limit: 20 });
  return { patients, alerts, messages, reports };
}

router.get('/caregiver/dashboard', async (req, res) => {
  try {
    const { patients, alerts, messages, reports } = await loadCaregiverData();
    const caregiverId = req.user?.id || 1;
    // Build 7-day chart aggregates from HealthMetric
    const since = new Date(); since.setDate(since.getDate()-6);
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
    const labels = []; const hr = []; const sleep = []; const steps = [];
    for (let i=0;i<7;i++){ const d=new Date(since); d.setDate(since.getDate()+i); const key=d.toISOString().slice(0,10); labels.push(key); const row=metrics.find(m=>new Date(m.get('day')).toISOString().slice(0,10)===key); hr.push(row?Number(row.get('avg_hr'))||0:0); sleep.push(row?Number(row.get('avg_sleep'))||0:0); steps.push(row?Number(row.get('avg_steps'))||0:0); }
    const dashCharts = { labels, heartRate: hr, sleepQuality: sleep, steps };
    const atRiskPatients = await db.Patient.count({ where: { health_status: 'at-risk' } });
    const criticalAlerts = await db.AiAlert.count({ where: { severity: 'critical' } });
    const unreadMessages = await db.Message.count({ where: { receiver_id: caregiverId } });
    const pendingRecs = await db.DoctorNote.findAll({ where: { note_type: 'recommendation', status: 'pending' }, include: [{ model: db.Patient, include: [{ model: db.User, attributes: ['name'] }] }], order: [['created_at','DESC']], limit: 10 });
    res.render('caregiver/dashboard', { layout: 'layouts/caregiver_layout', active: 'dashboard', patients, alerts, messages, reports, caregiverId, dashCharts, cards: { totalPatients: patients.length, criticalAlerts, atRiskPatients, unreadMessages }, pendingRecs });
  } catch (err) { res.status(500).send(err.message); }
});

// Caregiver dashboard API
router.get('/caregiver/api/dashboard', async (req, res) => {
  try {
    const caregiverId = req.user?.id || 1;
    const totalPatients = await db.Patient.count();
    const criticalAlerts = await db.AiAlert.count({ where: { severity: 'critical' } });
    const atRiskPatients = await db.Patient.count({ where: { health_status: 'at-risk' } });
    const unreadMessages = await db.Message.count({ where: { receiver_id: caregiverId } });
    const since = new Date(); since.setDate(since.getDate()-6);
    const rows = await db.HealthMetric.findAll({ where: { recorded_at: { [db.Sequelize.Op.gte]: since } }, order: [['recorded_at','ASC']], limit: 1000 });
    const labels = Array.from({length:7},(_,i)=>{ const d=new Date(since); d.setDate(d.getDate()+i); return d.toISOString().slice(0,10); });
    const byDay = {}; rows.forEach(m=>{ const k=new Date(m.recorded_at).toISOString().slice(0,10); if(!byDay[k]) byDay[k]=[]; byDay[k].push(m); });
    const avg=a=>a.length?(a.reduce((x,y)=>x+y,0)/a.length):0;
    const heartRate = labels.map(k=>avg((byDay[k]||[]).map(m=>m.heart_rate||0)));
    const sleepQuality = labels.map(k=>avg((byDay[k]||[]).map(m=>m.sleep_hours||0)));
    const steps = labels.map(k=>avg((byDay[k]||[]).map(m=>m.steps||0)));
    res.json({ labels, heartRate, sleepQuality, steps, cards: { totalPatients, criticalAlerts, atRiskPatients, unreadMessages } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/caregiver/patient-list', async (req, res) => {
  try {
    const patients = await db.Patient.findAll({ include: [{ model: db.User, attributes: ['name', 'date_of_birth'] }], order: [['id','ASC']] });
    const caregiverId = req.user?.id || 1;
    res.render('caregiver/patients', { layout: 'layouts/caregiver_layout', active: 'patients', patients, caregiverId });
  } catch (err) { res.status(500).send(err.message); }
});

router.get('/caregiver/under-care', async (req, res) => {
  try {
    const { patients } = await loadCaregiverData();
    const caregiverId = req.user?.id || 1;
    res.render('caregiver/under_care', { layout: 'layouts/caregiver_layout', active: 'under-care', patients, caregiverId });
  } catch (err) { res.status(500).send(err.message); }
});

// API to get metrics for a patient for charts
router.get('/caregiver/api/metrics', async (req, res) => {
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

router.get('/caregiver/messages', async (req, res) => {
  try {
    const { patients, messages } = await loadCaregiverData();
    const caregiverId = req.user?.id || 1;
    res.render('caregiver/messages', { layout: 'layouts/caregiver_layout', active: 'messages', patients, messages, caregiverId });
  } catch (err) { res.status(500).send(err.message); }
});

router.get('/caregiver/reports', async (req, res) => {
  try {
    const { patients } = await loadCaregiverData();
    const { pid } = req.query;
    const where = {};
    if (pid) where.patient_id = pid;
    const reports = await db.PatientReport.findAll({ where, order: [['created_at', 'DESC']], limit: 200 });
    const caregiverId = req.user?.id || 1;
    res.render('caregiver/reports', { layout: 'layouts/caregiver_layout', active: 'reports', patients, reports, caregiverId });
  } catch (err) { res.status(500).send(err.message); }
});

router.get('/caregiver/recommendations', async (req, res) => {
  try {
    const { patients } = await loadCaregiverData();
    const caregiverId = req.user?.id || 1;
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

router.get('/caregiver/settings', async (req, res) => {
  try {
    const caregiverId = req.user?.id || 1;
    const { patients } = await loadCaregiverData();
    const [settings] = await db.AlertSetting.findAll({ where: { user_id: caregiverId }, limit: 1 });
    res.render('caregiver/settings', { layout: 'layouts/caregiver_layout', active: 'settings', patients, caregiverId, settings });
  } catch (err) { res.status(500).send(err.message); }
});

router.post('/caregiver/assign', async (req, res) => {
  try {
    const { caregiver_id, patient_id } = req.body;
    await db.PatientCaregiver.findOrCreate({ where: { caregiver_id, patient_id }, defaults: { caregiver_id, patient_id } });
    return respondOk(req, res, '/caregiver/patient-list');
  } catch (err) {
    if (wantsJson(req)) return res.status(500).json({ error: err.message });
    res.status(500).send(err.message);
  }
});

// Caregiver: add patient (simplified demo — creates User + Patient)
router.post('/caregiver/patients', async (req, res) => {
  try {
    const { patientId, patientName, patientAge } = req.body;
    const name = String(patientName || '').trim();
    if (!name) return res.status(400).json({ error: 'patientName is required' });
    const email = `patient_${Date.now()}@example.com`;
    const bcrypt = require('bcryptjs');
    const password_hash = await bcrypt.hash('ChangeMe123!', 8);
    const roleId = 3; // patient role
    const user = await db.User.create({ name, email, role_id: roleId, status: 'active', password_hash });
    await db.Patient.create({ user_id: user.id });
    return respondOk(req, res, '/caregiver/patient-list');
  } catch (err) {
    if (wantsJson(req)) return res.status(500).json({ error: err.message });
    res.status(500).send(err.message);
  }
});

// Caregiver: send message
router.post('/caregiver/messages/send', async (req, res) => {
  try {
    const { recipient, content } = req.body;
    const sender_id = req.user?.id || 1;
    const receiver_id = recipient || null;
    await db.Message.create({ sender_id, receiver_id, content, message_type: 'text', created_at: new Date() });
    return respondOk(req, res, '/caregiver/messages');
  } catch (err) {
    if (wantsJson(req)) return res.status(500).json({ error: err.message });
    res.status(500).send(err.message);
  }
});

// Caregiver: acknowledge/dismiss alerts
router.post('/caregiver/alerts/:id/ack', async (req, res) => {
  try {
    await db.AiAlert.update({ status: 'acknowledged' }, { where: { id: req.params.id } });
    return respondOk(req, res, '/caregiver/dashboard');
  } catch (err) {
    if (wantsJson(req)) return res.status(500).json({ error: err.message });
    res.status(500).send(err.message);
  }
});

router.post('/caregiver/alerts/:id/dismiss', async (req, res) => {
  try {
    await db.AiAlert.update({ status: 'dismissed' }, { where: { id: req.params.id } });
    return respondOk(req, res, '/caregiver/dashboard');
  } catch (err) {
    if (wantsJson(req)) return res.status(500).json({ error: err.message });
    res.status(500).send(err.message);
  }
});

// Caregiver: export reports (CSV minimal)
router.get('/caregiver/reports/export', async (req, res) => {
  try {
    const { format } = req.query;
    const reports = await db.PatientReport.findAll({ order: [['created_at', 'DESC']], limit: 200 });
    const rows = [['patient_id', 'created_at', 'summary', 'details']].concat(
      reports.map(r => [r.patient_id, r.created_at?.toISOString?.() || r.created_at, r.summary || '', r.details || ''])
    );
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="reports.csv"');
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

module.exports = router;


