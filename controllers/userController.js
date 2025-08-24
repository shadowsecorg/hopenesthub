const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

async function register(req, res) {
  const { email, password, name, phone, role_id } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const exists = await db.User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ error: 'Email already registered' });
    const password_hash = await bcrypt.hash(password, 8);
    const user = await db.User.create({ email, password_hash, name, phone, role_id });
    res.status(201).json({ id: user.id, email: user.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const user = await db.User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

function logout(req, res) {
  res.json({ message: 'logged_out' });
}

async function getProfile(req, res) {
  try {
    const user = await db.User.findByPk(req.user?.id, { attributes: { exclude: ['password_hash'] } });
    res.json(user || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateProfile(req, res) {
  try {
    const { name, phone } = req.body;
    const [count, rows] = await db.User.update({ name, phone }, { where: { id: req.user?.id }, returning: true });
    if (count === 0) return res.status(404).json({ error: 'User not found' });
    const user = rows[0];
    delete user.dataValues.password_hash;
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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


