const db = require('../models');

async function listPatients(req, res) {
  try {
    const patients = await db.Patient.findAll({
      include: [{ model: db.User, attributes: ['id', 'name', 'email', 'phone'] }],
      order: [['id', 'ASC']]
    });
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getPatient(req, res) {
  try {
    const patient = await db.Patient.findByPk(req.params.id, {
      include: [
        { model: db.User, attributes: ['id', 'name', 'email', 'phone'] },
        { model: db.HealthMetric, limit: 10, order: [['recorded_at', 'DESC']] },
        { model: db.Symptom, limit: 10, order: [['recorded_at', 'DESC']] },
        { model: db.Emotion, limit: 10, order: [['recorded_at', 'DESC']] }
      ]
    });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createPatient(req, res) {
  try {
    const { user_id, cancer_type, diagnosis_date, treatment_plan, assigned_doctor_id } = req.body;
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });
    const created = await db.Patient.create({
      user_id,
      cancer_type,
      diagnosis_date,
      treatment_plan,
      assigned_doctor_id
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updatePatient(req, res) {
  try {
    const { cancer_type, diagnosis_date, treatment_plan, assigned_doctor_id } = req.body;
    const [count, rows] = await db.Patient.update(
      { cancer_type, diagnosis_date, treatment_plan, assigned_doctor_id },
      { where: { id: req.params.id }, returning: true }
    );
    if (count === 0) return res.status(404).json({ error: 'Patient not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deletePatient(req, res) {
  try {
    const deleted = await db.Patient.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Patient not found' });
    res.json({ message: 'deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  listPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient
};


