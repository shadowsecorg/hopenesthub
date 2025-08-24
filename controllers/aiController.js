const db = require('../models');

async function analyze(req, res) {
  // Placeholder for real AI - return aggregated health metrics as a simple example
  try {
    const { patient_id } = req.body;
    if (!patient_id) return res.status(400).json({ error: 'patient_id is required' });
    const metrics = await db.HealthMetric.findAll({ where: { patient_id }, order: [['recorded_at', 'DESC']], limit: 50 });
    res.json({ metricsCount: metrics.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function aiAlerts(req, res) {
  try {
    const patient_id = parseInt(req.params.id, 10);
    const rows = await db.AiAlert.findAll({ where: { patient_id }, order: [['created_at', 'DESC']] });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function recommendations(req, res) {
  try {
    const { patient_id, recommendation } = req.body;
    if (!patient_id || !recommendation) return res.status(400).json({ error: 'patient_id and recommendation required' });
    const created = await db.PatientReport.create({ patient_id, report_type: 'recommendation', content: { text: recommendation }, created_at: new Date() });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function predictions(req, res) {
  try {
    const patient_id = parseInt(req.params.id, 10);
    const rows = await db.AiPrediction.findAll({ where: { patient_id }, order: [['created_at', 'DESC']] });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  analyze,
  aiAlerts,
  recommendations,
  predictions
};


