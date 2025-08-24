const db = require('../models');

async function caregiverPatients(req, res) {
  try {
    const caregiver_id = parseInt(req.params.id, 10);
    const links = await db.PatientCaregiver.findAll({ where: { caregiver_id }, include: [{ model: db.Patient }] });
    res.json(links);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function assignCaregiver(req, res) {
  try {
    const caregiver_id = parseInt(req.params.id, 10);
    const { patient_id } = req.body;
    if (!patient_id) return res.status(400).json({ error: 'patient_id is required' });
    const created = await db.PatientCaregiver.create({ caregiver_id, patient_id });
    res.status(201).json(created);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Already assigned' });
    }
    res.status(500).json({ error: err.message });
  }
}

async function removeCaregiver(req, res) {
  try {
    const caregiver_id = parseInt(req.params.id, 10);
    const patient_id = parseInt(req.params.pid, 10);
    const deleted = await db.PatientCaregiver.destroy({ where: { caregiver_id, patient_id } });
    if (!deleted) return res.status(404).json({ error: 'Assignment not found' });
    res.json({ message: 'removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  caregiverPatients,
  assignCaregiver,
  removeCaregiver
};


