const db = require('../models');

async function sendNotification(req, res) {
  try {
    const { user_id, action, details } = req.body;
    const created = await db.AuditLog.create({ user_id, action: action || 'notify', details, created_at: new Date() });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getNotification(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const row = await db.AuditLog.findByPk(id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteNotification(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const deleted = await db.AuditLog.destroy({ where: { id } });
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  sendNotification,
  getNotification,
  deleteNotification
};


