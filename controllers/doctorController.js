function doctorPatients(req, res) {
  res.json({ message: 'ok', route: 'doctor patients', doctor: req.params.id });
}

function patientReport(req, res) {
  res.json({ message: 'ok', route: 'patient report', doctor: req.params.id, patient: req.params.pid });
}

function addNote(req, res) {
  res.json({ message: 'ok', route: 'add note', doctor: req.params.id, patient: req.params.pid, body: req.body });
}

function addPrescription(req, res) {
  res.json({ message: 'ok', route: 'add prescription', doctor: req.params.id, patient: req.params.pid, body: req.body });
}

function doctorAnalytics(req, res) {
  res.json({ message: 'ok', route: 'doctor analytics', doctor: req.params.id });
}

function doctorAlert(req, res) {
  res.json({ message: 'ok', route: 'doctor alert', doctor: req.params.id, body: req.body });
}

module.exports = {
  doctorPatients,
  patientReport,
  addNote,
  addPrescription,
  doctorAlert,
  doctorAnalytics
};


