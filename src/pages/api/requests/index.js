const pool = require('../../../lib/db');
const Joi = require('joi');
const { getUserFromToken } = require('../../../lib/auth');

const createSchema = Joi.object({
  provider_id: Joi.number().integer().required(),
  service_id: Joi.number().integer().optional(),
  scheduled_at: Joi.date().iso().optional(),
  description: Joi.string().allow('', null).optional()
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const user = token ? await getUserFromToken(token) : null;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  if (user.role !== 'client') return res.status(403).json({ error: 'Only clients can create requests' });

  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { provider_id, service_id, scheduled_at, description } = value;
  try {
    // validate provider exists
    const [pr] = await pool.query('SELECT id FROM providers WHERE id = ?', [provider_id]);
    if (!pr.length) return res.status(404).json({ error: 'Provider not found' });

    const [r] = await pool.query('INSERT INTO requests (client_id, provider_id, service_id, scheduled_at, description) VALUES (?, ?, ?, ?, ?)', [user.id, provider_id, service_id || null, scheduled_at || null, description || null]);
    return res.status(201).json({ message: 'Request created', requestId: r.insertId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
