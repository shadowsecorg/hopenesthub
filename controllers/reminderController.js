function createReminder(req, res) {
  res.json({ message: 'ok', route: 'create reminder', patient: req.params.id, body: req.body });
}

function listReminders(req, res) {
  res.json({ message: 'ok', route: 'list reminders', patient: req.params.id });
}

function updateReminder(req, res) {
  res.json({ message: 'ok', route: 'update reminder', id: req.params.id, body: req.body });
}

function deleteReminder(req, res) {
  res.json({ message: 'ok', route: 'delete reminder', id: req.params.id });
}

module.exports = {
  createReminder,
  listReminders,
  updateReminder,
  deleteReminder
};


