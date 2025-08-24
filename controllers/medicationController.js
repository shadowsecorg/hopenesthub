const db = require('../models');

async function createMedication(req, res) {
  try {
    const patient_id = parseInt(req.params.id, 10);
    const { name, dosage, frequency, start_date, end_date } = req.body;
    const created = await db.Medication.create({ patient_id, name, dosage, frequency, start_date, end_date });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function listMedications(req, res) {
  try {
    const patient_id = parseInt(req.params.id, 10);
    const rows = await db.Medication.findAll({ where: { patient_id }, order: [['id', 'DESC']] });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createMedication,
  listMedications
};


