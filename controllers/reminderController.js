const db = require('../models');

async function createReminder(req, res) {
  try {
    const patient_id = parseInt(req.params.id, 10);
    const { type, title, message, scheduled_time, status } = req.body;
    const created = await db.Reminder.create({ patient_id, type, title, message, scheduled_time, status });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function listReminders(req, res) {
  try {
    const patient_id = parseInt(req.params.id, 10);
    const rows = await db.Reminder.findAll({ where: { patient_id }, order: [['scheduled_time', 'DESC']] });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateReminder(req, res) {
  try {
    const { type, title, message, scheduled_time, status } = req.body;
    const [count, rows] = await db.Reminder.update(
      { type, title, message, scheduled_time, status },
      { where: { id: req.params.id }, returning: true }
    );
    if (count === 0) return res.status(404).json({ error: 'Reminder not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteReminder(req, res) {
  try {
    const deleted = await db.Reminder.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ error: 'Reminder not found' });
    res.json({ message: 'deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  createReminder,
  listReminders,
  updateReminder,
  deleteReminder
};


