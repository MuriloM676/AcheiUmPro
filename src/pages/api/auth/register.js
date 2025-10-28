const pool = require('../../../lib/db');
const Joi = require('joi');
const { hashPassword, signToken } = require('../../../lib/auth');

const registerSchema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().allow('', null),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('client', 'provider').required(),
  location: Joi.string().allow('', null),
  description: Joi.string().allow('', null),
  photo_url: Joi.string().uri().allow('', null),
  services: Joi.array().items(Joi.object({ name: Joi.string().required(), price: Joi.number().precision(2).optional() })).optional()
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { error, value } = registerSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { name, email, phone, password, role, location, description, photo_url, services } = value;
  try {
    // check existing
    const [exist] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (exist.length) return res.status(409).json({ error: 'Email already registered' });

    const hashed = await hashPassword(password);
    const [result] = await pool.query('INSERT INTO users (name, email, phone, password, role, location) VALUES (?, ?, ?, ?, ?, ?)', [name, email, phone || null, hashed, role, location || null]);
    const userId = result.insertId;

    let providerId = null;
    if (role === 'provider') {
      const [pr] = await pool.query('INSERT INTO providers (user_id, description, photo_url) VALUES (?, ?, ?)', [userId, description || null, photo_url || null]);
      providerId = pr.insertId;
      if (Array.isArray(services) && services.length) {
        const svcValues = services.map(s => [providerId, s.name, s.price || null]);
        await pool.query('INSERT INTO services (provider_id, name, price) VALUES ?', [svcValues]);
      }
    }

    const token = signToken({ id: userId, email, role });
    return res.status(201).json({ message: 'Registered successfully', token, user: { id: userId, email, name, role, providerId } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
