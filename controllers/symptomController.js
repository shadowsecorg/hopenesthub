const db = require('../models');

async function addSymptom(req, res) {
  try {
    const patient_id = parseInt(req.params.id, 10);
    const { symptom_type, severity, notes, recorded_at } = req.body;
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


