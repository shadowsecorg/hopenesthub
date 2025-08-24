function addMetrics(req, res) {
  res.json({ message: 'ok', route: 'add metrics', patient: req.params.id, body: req.body });
}

function listMetrics(req, res) {
  res.json({ message: 'ok', route: 'list metrics', patient: req.params.id });
}

function latestMetrics(req, res) {
  res.json({ message: 'ok', route: 'latest metrics', patient: req.params.id });
}

module.exports = {
  addMetrics,
  listMetrics,
  latestMetrics
};


