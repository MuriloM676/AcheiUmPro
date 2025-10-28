const pool = require('../../../lib/db');
const Joi = require('joi');
const dayjs = require('dayjs');
require('dayjs/locale/pt-br');
dayjs.locale('pt-br');

// GET: list providers with services and avg rating. supports ?service=NAME
export default async function handler(req, res) {
  if (req.method === 'GET') {
    const schema = Joi.object({ service: Joi.string().optional(), q: Joi.string().optional() });
    const { error, value } = schema.validate(req.query);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { service, q } = value;
    try {
      let sql = `SELECT p.id as provider_id, u.id as user_id, u.name, u.email, u.phone, u.location, p.description, p.photo_url,
        IFNULL(AVG(r.rating),0) as avg_rating, COUNT(r.id) as reviews_count,
        (SELECT COUNT(*) FROM provider_verifications pv WHERE pv.provider_id = p.id AND pv.status = 'approved') AS verified_count
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

      let availabilityMap = {};
      if (providerIds.length) {
        const [availabilityRows] = await pool.query(`
          SELECT provider_id, weekday, start_time, end_time
            FROM provider_availability
           WHERE provider_id IN (?)
           ORDER BY provider_id, weekday, start_time
        `, [providerIds]);

        availabilityRows.forEach((slot) => {
          availabilityMap[slot.provider_id] = availabilityMap[slot.provider_id] || [];
          availabilityMap[slot.provider_id].push(slot);
        });
      }

  const weekdayLabels = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

      const withScore = rows.map((r) => {
        const rating = Number(r.avg_rating || 0);
        const reviewsCount = Number(r.reviews_count || 0);
        const verified = Number(r.verified_count || 0) > 0;
        const services = servicesMap[r.provider_id] || [];

  const score = rating * 0.7 + Math.min(reviewsCount, 50) * 0.05 + (verified ? 1 : 0) + (nextSlot ? 0.3 : 0);

        const slots = availabilityMap[r.provider_id] || [];
        let nextSlot = null;
        if (slots.length) {
          const now = dayjs();
          const upcoming = slots
            .map((slot) => {
              const dayDiff = (slot.weekday - now.day() + 7) % 7;
              const baseDate = now.add(dayDiff, 'day')
                .hour(Number(slot.start_time.slice(0, 2)))
                .minute(Number(slot.start_time.slice(3, 5)))
                .second(0);
              return { slot, date: baseDate };
            })
            .sort((a, b) => a.date.valueOf() - b.date.valueOf());
          if (upcoming.length) {
            const first = upcoming[0];
            nextSlot = `${weekdayLabels[first.slot.weekday]} às ${first.slot.start_time.slice(0,5)}`;
          }
        }

        return {
          ...r,
          avg_rating: rating,
          reviews_count: reviewsCount,
          services,
          is_verified: verified,
          recommendation_score: score,
          next_availability: nextSlot
        };
      });

      withScore.sort((a, b) => b.recommendation_score - a.recommendation_score);

      const topRatedIds = new Set(withScore.slice(0, 3).map((provider) => provider.provider_id));

      const result = withScore.map((provider) => ({
        ...provider,
        is_top_rated: topRatedIds.has(provider.provider_id)
      }));

      return res.json({ providers: result });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
