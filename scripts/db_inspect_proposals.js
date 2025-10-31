const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

(async function() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'acheiuser',
    password: process.env.DB_PASSWORD || 'acheipass',
    database: process.env.DB_NAME || 'acheiumpro'
  });
  try {
    const [rows] = await conn.query('SELECT id, request_id, provider_id, proposed_price, message, status FROM service_proposals WHERE request_id = ?', [5]);
    console.log(JSON.stringify(rows, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await conn.end();
  }
})();

