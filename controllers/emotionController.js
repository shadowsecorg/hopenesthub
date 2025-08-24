function addEmotion(req, res) {
  res.json({ message: 'ok', route: 'add emotion', patient: req.params.id, body: req.body });
}

function listEmotions(req, res) {
  res.json({ message: 'ok', route: 'list emotions', patient: req.params.id });
}

module.exports = {
  addEmotion,
  listEmotions
};


