function sendNotification(req, res) {
  res.json({ message: 'ok', route: 'send notification', body: req.body });
}

function getNotification(req, res) {
  res.json({ message: 'ok', route: 'get notification', id: req.params.id });
}

function deleteNotification(req, res) {
  res.json({ message: 'ok', route: 'delete notification', id: req.params.id });
}

module.exports = {
  sendNotification,
  getNotification,
  deleteNotification
};


