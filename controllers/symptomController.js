const db = require('../models');

async function addSymptom(req, res) {
  try {
    const patient_id = parseInt(req.params.id, 10);
    const body = req.body || {};
    const symptom_type = body.symptom_type || body.type || body.symptom;
    const severity = body.severity != null ? parseInt(body.severity, 10)
      : (body.intensity != null ? parseInt(body.intensity, 10) : null);
    const notes = body.notes != null ? body.notes : (body.note != null ? body.note : null);
    const recorded_at = body.recorded_at || body.timestamp || new Date();

    if (!symptom_type) {
      return res.status(400).json({ error: 'symptom_type (or type) is required' });
    }

    const created = await db.Symptom.create({ patient_id, symptom_type, severity, notes, recorded_at });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function listSymptoms(req, res) {
  try {
    const patient_id = parseInt(req.params.id, 10);
    const rows = await db.Symptom.findAll({ where: { patient_id }, order: [['recorded_at', 'DESC']] });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  addSymptom,
  listSymptoms
};


