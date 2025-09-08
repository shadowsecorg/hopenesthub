const db = require('../models');

async function addEmotion(req, res) {
  try {
    const patient_id = parseInt(req.params.id, 10);
    const body = req.body || {};
    const emotion_type = body.emotion_type || body.mood || body.emotion;
    const intensity = body.intensity != null ? parseInt(body.intensity, 10) : null;
    const notes = body.notes != null ? body.notes : (body.note != null ? body.note : null);
    const recorded_at = body.recorded_at || body.timestamp || new Date();

    if (!emotion_type) {
      return res.status(400).json({ error: 'emotion_type (or mood) is required' });
    }

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


