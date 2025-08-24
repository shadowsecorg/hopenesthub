const db = require('../models');

async function addEmotion(req, res) {
  try {
    const patient_id = parseInt(req.params.id, 10);
    const { emotion_type, intensity, notes, recorded_at } = req.body;
    const created = await db.Emotion.create({ patient_id, emotion_type, intensity, notes, recorded_at });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function listEmotions(req, res) {
  try {
    const patient_id = parseInt(req.params.id, 10);
    const rows = await db.Emotion.findAll({ where: { patient_id }, order: [['recorded_at', 'DESC']] });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  addEmotion,
  listEmotions
};


