function createMedication(req, res) {
  res.json({ message: 'ok', route: 'create medication', patient: req.params.id, body: req.body });
}

function listMedications(req, res) {
  res.json({ message: 'ok', route: 'list medications', patient: req.params.id });
}

module.exports = {
  createMedication,
  listMedications
};


