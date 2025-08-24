function registerDevice(req, res) {
  res.json({ message: 'ok', route: 'register device', body: req.body });
}

function getDevice(req, res) {
  res.json({ message: 'ok', route: 'get device', id: req.params.id });
}

function syncDevice(req, res) {
  res.json({ message: 'ok', route: 'sync device', id: req.params.id, body: req.body });
}

function deviceMetrics(req, res) {
  res.json({ message: 'ok', route: 'device metrics', id: req.params.id });
}

module.exports = {
  registerDevice,
  getDevice,
  syncDevice,
  deviceMetrics
};


