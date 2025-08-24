const db = require('../models');

async function addMetrics(req, res) {
  try {
    const patient_id = parseInt(req.params.id, 10);
    const payload = { ...req.body, patient_id };
    const created = await db.HealthMetric.create(payload);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function listMetrics(req, res) {
  try {
    const patient_id = parseInt(req.params.id, 10);
    const rows = await db.HealthMetric.findAll({ where: { patient_id }, order: [['recorded_at', 'DESC']], limit: 200 });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function latestMetrics(req, res) {
  try {
    const patient_id = parseInt(req.params.id, 10);
    const row = await db.HealthMetric.findOne({ where: { patient_id }, order: [['recorded_at', 'DESC']] });
    res.json(row || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  addMetrics,
  listMetrics,
  latestMetrics
};


