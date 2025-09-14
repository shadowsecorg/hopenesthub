const db = require('../models');

function normalizeItem(raw, patient_id, fallbackNotes, fallbackRecordedAt) {
  const symptom_type = raw.symptom_type || raw.type || raw.symptom;
  const severity = raw.severity != null
    ? parseInt(raw.severity, 10)
    : (raw.intensity != null ? parseInt(raw.intensity, 10) : null);
  const notes = raw.notes != null ? raw.notes : (raw.note != null ? raw.note : fallbackNotes);
  const recorded_at = raw.recorded_at || raw.timestamp || fallbackRecordedAt || new Date();
  return { patient_id, symptom_type, severity, notes, recorded_at };
}

async function addSymptom(req, res) {
  try {
    const patient_id = parseInt(req.params.id, 10);
    const body = req.body || {};

    // Support multiple payload shapes:
    // 1) Single object { symptom_type, severity, notes }
    // 2) Array of objects [ { symptom_type, severity }, ... ]
    // 3) { items: [ ... ], notes, recorded_at }
    // 4) { symptoms: { nausea: 2, fatigue: 3, ... }, notes }

    let items = [];

    if (Array.isArray(body)) {
      items = body.map(x => normalizeItem(x, patient_id, body.notes, body.recorded_at));
    } else if (Array.isArray(body.items)) {
      items = body.items.map(x => normalizeItem(x, patient_id, body.notes, body.recorded_at));
    } else if (body.symptoms && typeof body.symptoms === 'object' && !Array.isArray(body.symptoms)) {
      // Map shape: { symptoms: { nausea: 2, fatigue: 3, ... } }
      items = Object.entries(body.symptoms).map(([key, value]) => normalizeItem({ symptom_type: key, severity: value }, patient_id, body.notes, body.recorded_at));
    } else {
      // Single-item shape
      const single = normalizeItem(body, patient_id, body.notes, body.recorded_at);
      items = [single];
    }

    // Validate and clean
    items = items.filter(i => i.symptom_type && (i.severity != null));
    if (items.length === 0) {
      return res.status(400).json({ error: 'No valid symptoms provided' });
    }

    // Optional: clamp severity to 1..10 if provided
    items = items.map(i => ({
      ...i,
      severity: (i.severity == null ? null : Math.max(1, Math.min(10, parseInt(i.severity, 10))))
    }));

    if (items.length === 1) {
      const created = await db.Symptom.create(items[0]);
      return res.status(201).json(created);
    }

    const createdAll = await db.Symptom.bulkCreate(items, { returning: true });
    return res.status(201).json(createdAll);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function listSymptoms(req, res) {
  try {
    const patient_id = parseInt(req.params.id, 10);
    const rows = await db.Symptom.findAll({ where: { patient_id }, order: [['recorded_at', 'DESC']] });
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  addSymptom,
  listSymptoms
};


