const express = require('express');
const router = express.Router();
const db = require('../models');

// Admin panel
router.get(['/admin', '/admin/index'], async (req, res) => {
  try {
    const totalUsers = await db.User.count();
    const totalPatients = await db.Patient.count();
    const recentAlerts = await db.AiAlert.count({});
    res.render('admin/index', { layout: 'layouts/admin_layout', active: 'dashboard', title: 'Admin Dashboard', totals: { totalUsers, totalPatients, recentAlerts } });
  } catch (err) {
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
    res.status(500).send(err.message);
  }
});

router.post('/admin/users/:id/update', async (req, res) => {
  try {
    const { name, email, role_id, status } = req.body;
    await db.User.update({ name, email, role_id: parseInt(role_id, 10) || null, status }, { where: { id: req.params.id } });
    res.redirect('/admin/users');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post('/admin/users/:id/delete', async (req, res) => {
  try {
    await db.User.destroy({ where: { id: req.params.id } });
    res.redirect('/admin/users');
  } catch (err) {
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
    res.status(500).send(err.message);
  }
});

router.post('/admin/users/:id/verify', async (req, res) => {
  try {
    await db.User.update({ is_verified: true }, { where: { id: req.params.id } });
    res.redirect('/admin/users');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get('/admin/alerts', async (req, res) => {
  try {
    const alerts = await db.AiAlert.findAll({ include: [{ model: db.Patient }], order: [['created_at', 'DESC']], limit: 200 });
    res.render('admin/alerts', { layout: 'layouts/admin_layout', active: 'alerts', title: 'Alerts', alerts });
  } catch (err) {
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
    res.status(500).send(err.message);
  }
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
    const messages = await db.Message.findAll({ order: [['created_at', 'DESC']], limit: 100 });
    res.render('admin/messages', { layout: 'layouts/admin_layout', active: 'messages', title: 'Messages', messages });
  } catch (err) {
    res.status(500).send(err.message);
  }
});
router.post('/admin/messages/send', async (req, res) => {
  try {
    const { recipientType, recipient, groupRecipient, content } = req.body;
    // For simplicity: if individual, set receiver_id; else leave null and store as group
    const sender_id = req.user?.id || 1; // demo
    const receiver_id = recipientType === 'individual' ? recipient : null;
    await db.Message.create({ sender_id, receiver_id, content, message_type: 'text', created_at: new Date() });
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
    // simplistic date filter
    if (start || end) where.created_at = {};
    if (start) where.created_at[db.Sequelize.Op.gte] = new Date(start);
    if (end) where.created_at[db.Sequelize.Op.lte] = new Date(end);
    const patientReports = await db.PatientReport.findAll({ where, order: [['created_at', 'DESC']], limit: 100 });
    res.render('admin/reports', { layout: 'layouts/admin_layout', active: 'reports', title: 'Reports', patientReports });
  } catch (err) {
    res.status(500).send(err.message);
  }
});
router.get('/admin/settings', (req, res) => res.render('admin/settings', { layout: 'layouts/admin_layout', active: 'settings', title: 'Settings' }));
router.get('/admin/advanced-analytics', (req, res) => res.render('admin/advanced_analytics', { layout: 'layouts/admin_layout', active: 'advanced', title: 'Advanced Analytics' }));
router.get('/admin/wearable-management', (req, res) => res.render('admin/wearable_management', { layout: 'layouts/admin_layout', active: 'wearable', title: 'Wearable Management' }));

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
    res.render('caregiver/dashboard', { layout: 'layouts/caregiver_layout', active: 'dashboard', patients, alerts, messages, reports, caregiverId });
  } catch (err) { res.status(500).send(err.message); }
});

router.get('/caregiver/patient-list', async (req, res) => {
  try {
    const { patients } = await loadCaregiverData();
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

router.get('/caregiver/messages', async (req, res) => {
  try {
    const { patients, messages } = await loadCaregiverData();
    const caregiverId = req.user?.id || 1;
    res.render('caregiver/messages', { layout: 'layouts/caregiver_layout', active: 'messages', patients, messages, caregiverId });
  } catch (err) { res.status(500).send(err.message); }
});

router.get('/caregiver/reports', async (req, res) => {
  try {
    const { patients, reports } = await loadCaregiverData();
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
    if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
      return res.json({ ok: true });
    }
    res.redirect('/caregiver/patient-list');
  } catch (err) {
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
    if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
      return res.json({ ok: true });
    }
    res.redirect('/caregiver/patient-list');
  } catch (err) {
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
    if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
      return res.json({ ok: true });
    }
    res.redirect('/caregiver/messages');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Caregiver: acknowledge/dismiss alerts
router.post('/caregiver/alerts/:id/ack', async (req, res) => {
  try {
    await db.AiAlert.update({ status: 'acknowledged' }, { where: { id: req.params.id } });
    if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
      return res.json({ ok: true });
    }
    res.redirect('/caregiver/dashboard');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post('/caregiver/alerts/:id/dismiss', async (req, res) => {
  try {
    await db.AiAlert.update({ status: 'dismissed' }, { where: { id: req.params.id } });
    if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
      return res.json({ ok: true });
    }
    res.redirect('/caregiver/dashboard');
  } catch (err) {
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
    if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
      return res.json({ ok: true });
    }
    res.redirect('/caregiver/settings');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Caregiver: create recommendation (stored as DoctorNote with note_type 'recommendation')
router.post('/caregiver/recommendations', async (req, res) => {
  try {
    const { patientId, content } = req.body;
    await db.DoctorNote.create({ patient_id: patientId, doctor_id: null, note_type: 'recommendation', content, created_at: new Date() });
    if (req.headers['content-type'] && req.headers['content-type'].includes('application/json')) {
      return res.json({ ok: true });
    }
    res.redirect('/caregiver/recommendations');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;


