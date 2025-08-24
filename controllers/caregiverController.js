function caregiverPatients(req, res) {
  res.json({ message: 'ok', route: 'caregiver patients', caregiver: req.params.id });
}

function assignCaregiver(req, res) {
  res.json({ message: 'ok', route: 'assign caregiver to patient', caregiver: req.params.id, body: req.body });
}

function removeCaregiver(req, res) {
  res.json({ message: 'ok', route: 'remove caregiver from patient', caregiver: req.params.id, patient: req.params.pid });
}

module.exports = {
  caregiverPatients,
  assignCaregiver,
  removeCaregiver
};


