const db = require('../models');

async function doctorPatients(req, res) {
  try {
    const doctor_user_id = parseInt(req.params.id, 10);
    const patients = await db.Patient.findAll({ where: { assigned_doctor_id: doctor_user_id } });
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function patientReport(req, res) {
  try {
    const patient_id = parseInt(req.params.pid, 10);
    const report = await db.PatientReport.findAll({ where: { patient_id }, order: [['created_at', 'DESC']], limit: 10 });
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function addNote(req, res) {
  try {
    const doctor_id = parseInt(req.params.id, 10);
    const patient_id = parseInt(req.params.pid, 10);
    const { note_type, content } = req.body;
    const created = await db.DoctorNote.create({ doctor_id, patient_id, note_type, content, created_at: new Date() });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function addPrescription(req, res) {
  try {
    const doctor_id = parseInt(req.params.id, 10);
    const patient_id = parseInt(req.params.pid, 10);
    const { medication_name, dosage, frequency, start_date, end_date } = req.body;
    const created = await db.Prescription.create({ doctor_id, patient_id, medication_name, dosage, frequency, start_date, end_date });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function doctorAnalytics(req, res) {
  try {
    const doctor_user_id = parseInt(req.params.id, 10);
    const count = await db.Patient.count({ where: { assigned_doctor_id: doctor_user_id } });
    res.json({ patients: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function doctorAlert(req, res) {
  try {
    const doctor_user_id = parseInt(req.params.id, 10);
    const { patient_id, alert_type, severity, description } = req.body;
    // Could enforce doctor-patient relation here
    const created = await db.AiAlert.create({ patient_id, alert_type, severity, description });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  doctorPatients,
  patientReport,
  addNote,
  addPrescription,
  doctorAlert,
  doctorAnalytics
};


