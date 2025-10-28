const pool = require('../../../lib/db');
const Joi = require('joi');

// GET: list providers with services and avg rating. supports ?service=NAME
export default async function handler(req, res) {
  if (req.method === 'GET') {
    const schema = Joi.object({ service: Joi.string().optional(), q: Joi.string().optional() });
    const { error, value } = schema.validate(req.query);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { service, q } = value;
    try {
      let sql = `SELECT p.id as provider_id, u.id as user_id, u.name, u.email, u.phone, u.location, p.description, p.photo_url,
        IFNULL(AVG(r.rating),0) as avg_rating, COUNT(r.id) as reviews_count
        FROM providers p
        JOIN users u ON u.id = p.user_id
        LEFT JOIN reviews r ON r.provider_id = p.id`;
      const params = [];
      if (service) {
        sql += ' JOIN services s ON s.provider_id = p.id WHERE s.name = ?';
        params.push(service);
      } else if (q) {
        sql += ' WHERE (u.name LIKE ? OR p.description LIKE ? OR u.location LIKE ?)';
        const like = `%${q}%`;
        params.push(like, like, like);
      }
      sql += ' GROUP BY p.id ORDER BY avg_rating DESC';
      const [rows] = await pool.query(sql, params);

      // fetch services for each provider
      const providerIds = rows.map(r => r.provider_id);
      let servicesMap = {};
      if (providerIds.length) {
        const [svcs] = await pool.query('SELECT provider_id, id, name, price FROM services WHERE provider_id IN (?)', [providerIds]);
        svcs.forEach(s => {
          servicesMap[s.provider_id] = servicesMap[s.provider_id] || [];
          servicesMap[s.provider_id].push(s);
        });
      }

      const result = rows.map(r => ({
        ...r,
        avg_rating: Number(r.avg_rating || 0),
        reviews_count: Number(r.reviews_count || 0),
        services: servicesMap[r.provider_id] || []
      }));
      return res.json({ providers: result });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
