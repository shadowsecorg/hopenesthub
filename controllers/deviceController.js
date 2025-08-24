const db = require('../models');

async function registerDevice(req, res) {
  // No device table; store a log
  try {
    const { user_id, device_type, details } = req.body;
    const row = await db.AuditLog.create({ user_id, action: 'device_register', details: JSON.stringify({ device_type, details }), created_at: new Date() });
    res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getDevice(req, res) {
  res.json({ message: 'not_implemented' });
}

async function syncDevice(req, res) {
  try {
    const patient_id = parseInt(req.params.id, 10);
    const metrics = Array.isArray(req.body) ? req.body : [req.body];
    const rows = await db.HealthMetric.bulkCreate(metrics.map(m => ({ ...m, patient_id })));
    res.status(201).json({ inserted: rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deviceMetrics(req, res) {
  try {
    const patient_id = parseInt(req.params.id, 10);
    const rows = await db.HealthMetric.findAll({ where: { patient_id }, order: [['recorded_at', 'DESC']], limit: 200 });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  registerDevice,
  getDevice,
  syncDevice,
  deviceMetrics
};


