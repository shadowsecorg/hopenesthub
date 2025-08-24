function analyze(req, res) {
  res.json({ message: 'ok', route: 'ai analyze', body: req.body });
}

function aiAlerts(req, res) {
  res.json({ message: 'ok', route: 'ai alerts', patient: req.params.id });
}

function recommendations(req, res) {
  res.json({ message: 'ok', route: 'ai recommendations', body: req.body });
}

function predictions(req, res) {
  res.json({ message: 'ok', route: 'ai predictions', patient: req.params.id });
}

module.exports = {
  analyze,
  aiAlerts,
  recommendations,
  predictions
};


