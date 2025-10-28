const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const JWT_EXPIRES = '7d';

async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

function signToken(user) {
  // include minimal claims
  const payload = { id: user.id, email: user.email, role: user.role };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

async function getUserFromToken(token) {
  const decoded = verifyToken(token);
  if (!decoded) return null;
  const [rows] = await pool.query('SELECT id, name, email, role, phone, location FROM users WHERE id = ?', [decoded.id]);
  return rows[0] || null;
}

module.exports = {
  hashPassword,
  comparePassword,
  signToken,
  verifyToken,
  getUserFromToken,
};
