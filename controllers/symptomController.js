function addSymptom(req, res) {
  res.json({ message: 'ok', route: 'add symptom', patient: req.params.id, body: req.body });
}

function listSymptoms(req, res) {
  res.json({ message: 'ok', route: 'list symptoms', patient: req.params.id });
}

module.exports = {
  addSymptom,
  listSymptoms
};


