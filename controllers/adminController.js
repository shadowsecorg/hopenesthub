function adminUsers(req, res) {
  res.json({ message: 'ok', route: 'admin users' });
}

function adminReports(req, res) {
  res.json({ message: 'ok', route: 'admin reports' });
}

function adminLogs(req, res) {
  res.json({ message: 'ok', route: 'admin logs' });
}

function adminSettings(req, res) {
  res.json({ message: 'ok', route: 'admin settings', body: req.body });
}

module.exports = {
  adminUsers,
  adminReports,
  adminLogs,
  adminSettings
};


