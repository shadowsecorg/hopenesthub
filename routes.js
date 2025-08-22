const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

// --- Simple JWT middleware ---
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Helper to get pool from app locals
function getPool(req) {
  return req.app.locals.pool;
}

// --------------------
// Users & Authentication
// --------------------

// POST /api/register
router.post('/register', async (req, res) => {
  // NOTE: no strict rules here; in real app validate inputs and hash passwords
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const pool = getPool(req);
    const hashed = await bcrypt.hash(password, 8);
    // Example insert (table may not exist yet)
    // await pool.query('INSERT INTO users(email,password,name) VALUES($1,$2,$3)', [email, hashed, name]);
    res.json({ message: 'registered', email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    // In a real app, fetch user and compare password
    // const result = await pool.query('SELECT id, email, password FROM users WHERE email=$1', [email]);
    // if (result.rowCount === 0) return res.status(401).json({ error: 'Invalid creds' });
    // const user = result.rows[0];
    // const ok = await bcrypt.compare(password, user.password);
    const fakeUser = { id: 1, email };
    const token = jwt.sign(fakeUser, JWT_SECRET, { expiresIn: '8h' });
    res.json({ message: 'logged_in', token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/logout
router.post('/logout', authenticateToken, (req, res) => {
  // Stateless JWT: client should discard token. For stateful, implement blacklist.
  res.json({ message: 'logged_out' });
});

// GET /api/profile
router.get('/profile', authenticateToken, (req, res) => {
  // Return user profile
  res.json({ user: req.user || null });
});

// PUT /api/profile
router.put('/profile', authenticateToken, (req, res) => {
  // Update profile (stub)
  res.json({ message: 'profile updated', body: req.body });
});

// POST /api/profile/avatar
router.post('/profile/avatar', authenticateToken, upload.single('avatar'), (req, res) => {
  // In real app store file and update user record
  res.json({ message: 'avatar uploaded', file: req.file });
});

// --------------------
// Patients
// --------------------
router.get('/patients', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'list patients' }));
router.get('/patients/:id', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'get patient', id: req.params.id }));
router.post('/patients', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'create patient', body: req.body }));
router.put('/patients/:id', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'update patient', id: req.params.id, body: req.body }));
router.delete('/patients/:id', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'delete patient', id: req.params.id }));

// --------------------
// Emotions & Symptoms
// --------------------
router.post('/patients/:id/symptoms', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'add symptom', patient: req.params.id, body: req.body }));
router.get('/patients/:id/symptoms', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'list symptoms', patient: req.params.id }));
router.post('/patients/:id/emotions', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'add emotion', patient: req.params.id, body: req.body }));
router.get('/patients/:id/emotions', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'list emotions', patient: req.params.id }));

// --------------------
// Metrics Health
// --------------------
router.post('/patients/:id/metrics', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'add metrics', patient: req.params.id, body: req.body }));
router.get('/patients/:id/metrics', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'list metrics', patient: req.params.id }));
router.get('/patients/:id/metrics/latest', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'latest metrics', patient: req.params.id }));

// --------------------
// Medication & Reminders
// --------------------
router.post('/patients/:id/reminders', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'create reminder', patient: req.params.id, body: req.body }));
router.get('/patients/:id/reminders', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'list reminders', patient: req.params.id }));
router.put('/reminders/:id', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'update reminder', id: req.params.id, body: req.body }));
router.delete('/reminders/:id', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'delete reminder', id: req.params.id }));
router.post('/patients/:id/medications', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'create medication', patient: req.params.id, body: req.body }));
router.get('/patients/:id/medications', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'list medications', patient: req.params.id }));

// --------------------
// Caregivers
// --------------------
router.get('/caregivers/:id/patients', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'caregiver patients', caregiver: req.params.id }));
router.post('/caregivers/:id/assign', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'assign caregiver to patient', caregiver: req.params.id, body: req.body }));
router.delete('/caregivers/:id/patients/:pid', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'remove caregiver from patient', caregiver: req.params.id, patient: req.params.pid }));

// --------------------
// Doctors (phase 2)
// --------------------
router.get('/doctors/:id/patients', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'doctor patients', doctor: req.params.id }));
router.get('/doctors/:id/patients/:pid/report', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'patient report', doctor: req.params.id, patient: req.params.pid }));
router.post('/doctors/:id/patients/:pid/notes', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'add note', doctor: req.params.id, patient: req.params.pid, body: req.body }));
router.post('/doctors/:id/patients/:pid/prescriptions', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'add prescription', doctor: req.params.id, patient: req.params.pid, body: req.body }));
router.post('/doctors/:id/alerts', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'doctor alert', doctor: req.params.id, body: req.body }));
router.get('/doctors/:id/analytics', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'doctor analytics', doctor: req.params.id }));

// --------------------
// Analytics & AI
// --------------------
router.post('/ai/analyze', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'ai analyze', body: req.body }));
router.get('/ai/patients/:id/alerts', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'ai alerts', patient: req.params.id }));
router.post('/ai/recommendations', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'ai recommendations', body: req.body }));
router.get('/ai/patients/:id/predictions', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'ai predictions', patient: req.params.id }));

// --------------------
// Chat & Chatbot
// --------------------
router.post('/chatbot/message', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'chatbot message', body: req.body }));
router.get('/chatbot/history', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'chatbot history' }));
router.post('/messages/:id_receiver', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'send message', to: req.params.id_receiver, body: req.body }));
router.get('/messages', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'list messages' }));

// --------------------
// Devices / Wearable
// --------------------
router.post('/devices/register', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'register device', body: req.body }));
router.get('/devices/:id', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'get device', id: req.params.id }));
router.post('/devices/:id/sync', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'sync device', id: req.params.id, body: req.body }));
router.get('/devices/:id/metrics', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'device metrics', id: req.params.id }));

// --------------------
// Admin Panel
// --------------------
router.get('/admin/users', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'admin users' }));
router.get('/admin/reports', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'admin reports' }));
router.get('/admin/logs', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'admin logs' }));
router.post('/admin/settings', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'admin settings', body: req.body }));

// --------------------
// Notifications
// --------------------
router.post('/notifications/send', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'send notification', body: req.body }));
router.get('/notifications/:id', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'get notification', id: req.params.id }));
router.delete('/notifications/:id', authenticateToken, (req, res) => res.json({ message: 'ok', route: 'delete notification', id: req.params.id }));

module.exports = router;
