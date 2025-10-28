/**
 * Seed script for AcheiUmPro.
 * Usage: set env variables (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME) and run:
 *   node scripts/seed.js
 * This script uses the same db helper and auth helper in src/lib to create sample users/providers/services.
 */

const pool = require('../src/lib/db');
const { hashPassword } = require('../src/lib/auth');

async function run() {
  try {
    // sample client
    const clientPassword = await hashPassword('client123');
    const [c] = await pool.query('INSERT INTO users (name, email, phone, password, role, location) VALUES (?, ?, ?, ?, ?, ?)', ['Cliente Teste', 'cliente@example.com', '11999990000', clientPassword, 'client', 'São Paulo']);

    // sample provider
    const provPass = await hashPassword('provider123');
    const [u] = await pool.query('INSERT INTO users (name, email, phone, password, role, location) VALUES (?, ?, ?, ?, ?, ?)', ['Pedro Prestador', 'pedro.provider@example.com', '11988880000', provPass, 'provider', 'São Paulo']);
    const providerUserId = u.insertId;

    const [p] = await pool.query('INSERT INTO providers (user_id, description, photo_url) VALUES (?, ?, ?)', [providerUserId, 'Prestador especializado em manutenção residencial', 'https://placehold.co/128x128']);
    const providerId = p.insertId;

    // services
    await pool.query('INSERT INTO services (provider_id, name, price) VALUES ?', [[[providerId, 'Instalação elétrica', 180.00], [providerId, 'Reparo hidráulico', 120.00]]]);

    console.log('Seed finished: client id', c.insertId, 'provider id', providerId);
    process.exit(0);
  } catch (err) {
    console.error('Seed error', err);
    process.exit(1);
  }
}

run();
