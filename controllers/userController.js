const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

function getPool(req) {
  return req.app.locals.pool;
}

async function register(req, res) {
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
}

async function login(req, res) {
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
}

function logout(req, res) {
  res.json({ message: 'logged_out' });
}

function getProfile(req, res) {
  res.json({ user: req.user || null });
}

function updateProfile(req, res) {
  res.json({ message: 'profile updated', body: req.body });
}

function uploadAvatar(req, res) {
  res.json({ message: 'avatar uploaded', file: req.file });
}

module.exports = {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  uploadAvatar
};


