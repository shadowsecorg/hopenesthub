const db = require('../models');

async function adminUsers(req, res) {
  try {
    const users = await db.User.findAll({ attributes: { exclude: ['password_hash'] }, order: [['id', 'ASC']] });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function adminReports(req, res) {
  try {
    const reports = await db.PatientReport.findAll({ order: [['created_at', 'DESC']], limit: 200 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function adminLogs(req, res) {
  try {
    const logs = await db.AuditLog.findAll({ order: [['created_at', 'DESC']], limit: 200 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function adminSettings(req, res) {
  res.json({ message: 'ok' });
}

module.exports = {
  adminUsers,
  adminReports,
  adminLogs,
  adminSettings
};


