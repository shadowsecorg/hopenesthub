const db = require('../models');

function isNumericId(value) {
  return String(value).match(/^\d+$/);
}

async function findDeviceByParam(idParam) {
  const idStr = String(idParam || '').trim();
  if (!idStr) return null;
  if (isNumericId(idStr)) {
    const byPk = await db.WearableDevice.findByPk(parseInt(idStr, 10));
    if (byPk) return byPk;
  }
  return await db.WearableDevice.findOne({ where: { device_id: idStr } });
}

function normalizeRegisterBody(body) {
  const device_type = body.device_type || body.type || body.provider || 'unknown';
  const device_id = body.device_id || body.serial || body.id || null;
  return { device_type, device_id };
}

function mapIncomingMetric(device, raw) {
  const m = raw || {};
  const toNumber = (v) => (v === undefined || v === null || v === '' ? undefined : Number(v));
  const toDate = (v) => {
    try { return v ? new Date(v) : new Date(); } catch (_) { return new Date(); }
  };
  const record = {
    source: m.source || device?.device_type || 'device',
    heart_rate: toNumber(m.heart_rate !== undefined ? m.heart_rate : m.heartRate),
    spo2: toNumber(m.spo2),
    ecg_data: m.ecg_data || m.ecgData || undefined,
    temperature: toNumber(m.temperature),
    respiration_rate: toNumber(m.respiration_rate !== undefined ? m.respiration_rate : m.respirationRate),
    blood_pressure_sys: toNumber(m.blood_pressure_sys !== undefined ? m.blood_pressure_sys : m.bpSys),
    blood_pressure_dia: toNumber(m.blood_pressure_dia !== undefined ? m.blood_pressure_dia : m.bpDia),
    steps: toNumber(m.steps),
    activity_minutes: toNumber(m.activity_minutes !== undefined ? m.activity_minutes : m.activityMinutes),
    sleep_hours: (m.sleep_hours !== undefined ? Number(m.sleep_hours) : (m.sleepHours !== undefined ? Number(m.sleepHours) : undefined)),
    stress_level: toNumber(m.stress_level !== undefined ? m.stress_level : m.stressLevel),
    recorded_at: toDate(m.recorded_at || m.timestamp)
  };
  // Remove undefined keys to keep inserts clean
  Object.keys(record).forEach((k) => { if (record[k] === undefined) delete record[k]; });
  return record;
}

async function registerDevice(req, res) {
  try {
    const { device_type, device_id } = normalizeRegisterBody(req.body || {});
    const userIdFromToken = req.user && req.user.id ? parseInt(req.user.id, 10) : null;
    const user_id = userIdFromToken || (req.body && parseInt(req.body.user_id, 10)) || null;
    if (!user_id) return res.status(400).json({ error: 'user_id not resolved (login or provide user_id)' });
    if (!device_id) return res.status(400).json({ error: 'device_id is required' });

    const existing = await db.WearableDevice.findOne({ where: { device_id } });
    if (!existing) {
      const row = await db.WearableDevice.create({ user_id, device_type, device_id, status: 'connected', last_sync: null });
      return res.status(201).json(row);
    }
    if (existing.user_id !== user_id) {
      return res.status(409).json({ error: 'device already registered to another user' });
    }
    await existing.update({ device_type: device_type || existing.device_type, status: 'connected' });
    return res.status(200).json(existing);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getDevice(req, res) {
  try {
    const device = await findDeviceByParam(req.params.id);
    if (!device) return res.status(404).json({ error: 'not_found' });
    return res.json(device);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function syncDevice(req, res) {
  try {
    const device = await findDeviceByParam(req.params.id);
    if (!device) return res.status(404).json({ error: 'device_not_found' });
    const patient = await db.Patient.findOne({ where: { user_id: device.user_id } });
    if (!patient) return res.status(404).json({ error: 'patient_not_found_for_device' });

    const incoming = Array.isArray(req.body) ? req.body : (Array.isArray(req.body?.payload) ? req.body.payload : [req.body]);
    const rowsToInsert = incoming.map((row) => ({ ...mapIncomingMetric(device, row), patient_id: patient.id }));
    const rows = await db.HealthMetric.bulkCreate(rowsToInsert);
    await device.update({ last_sync: new Date(), status: 'connected' });
    return res.status(200).json({ synced: true, count: rows.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function deviceMetrics(req, res) {
  try {
    const device = await findDeviceByParam(req.params.id);
    if (!device) return res.status(404).json({ error: 'device_not_found' });
    const patient = await db.Patient.findOne({ where: { user_id: device.user_id } });
    if (!patient) return res.status(404).json({ error: 'patient_not_found_for_device' });
    const rows = await db.HealthMetric.findAll({ where: { patient_id: patient.id }, order: [['recorded_at', 'DESC']], limit: 200 });
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  registerDevice,
  getDevice,
  syncDevice,
  deviceMetrics
};


