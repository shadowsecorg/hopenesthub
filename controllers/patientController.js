function listPatients(req, res) {
  res.json({ message: 'ok', route: 'list patients' });
}

function getPatient(req, res) {
  res.json({ message: 'ok', route: 'get patient', id: req.params.id });
}

function createPatient(req, res) {
  res.json({ message: 'ok', route: 'create patient', body: req.body });
}

function updatePatient(req, res) {
  res.json({ message: 'ok', route: 'update patient', id: req.params.id, body: req.body });
}

function deletePatient(req, res) {
  res.json({ message: 'ok', route: 'delete patient', id: req.params.id });
}

module.exports = {
  listPatients,
  getPatient,
  createPatient,
  updatePatient,
  deletePatient
};


