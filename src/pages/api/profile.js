const pool = require('../../../lib/db');
const Joi = require('joi');
const { getUserFromToken } = require('../../../lib/auth');

const updateSchema = Joi.object({
  name: Joi.string().min(2).optional(),
  phone: Joi.string().allow('', null).optional(),
  location: Joi.string().allow('', null).optional(),
  description: Joi.string().allow('', null).optional(),
  photo_url: Joi.string().uri().allow('', null).optional(),
  services: Joi.array().items(Joi.object({ name: Joi.string().required(), price: Joi.number().precision(2).optional() })).optional()
});

export default async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' });

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  const user = token ? await getUserFromToken(token) : null;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { error, value } = updateSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  const { name, phone, location, description, photo_url, services } = value;
  try {
    // update users
    const updates = [];
    const params = [];
    if (name) { updates.push('name = ?'); params.push(name); }
    if (phone !== undefined) { updates.push('phone = ?'); params.push(phone || null); }
    if (location !== undefined) { updates.push('location = ?'); params.push(location || null); }
    if (updates.length) {
      params.push(user.id);
      await pool.query('UPDATE users SET ' + updates.join(', ') + ' WHERE id = ?', params);
    }

    // if provider update providers / services
    if (user.role === 'provider') {
      // find provider id
      const [pr] = await pool.query('SELECT id FROM providers WHERE user_id = ?', [user.id]);
      if (pr.length) {
        const providerId = pr[0].id;
        if (description !== undefined || photo_url !== undefined) {
          await pool.query('UPDATE providers SET description = ?, photo_url = ? WHERE id = ?', [description || null, photo_url || null, providerId]);
        }
        if (Array.isArray(services)) {
          // simple approach: delete existing services and reinsert
          await pool.query('DELETE FROM services WHERE provider_id = ?', [providerId]);
          if (services.length) {
            const svcValues = services.map(s => [providerId, s.name, s.price || null]);
            await pool.query('INSERT INTO services (provider_id, name, price) VALUES ?', [svcValues]);
          }
        }
      }
    }

    return res.json({ message: 'Profile updated' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
