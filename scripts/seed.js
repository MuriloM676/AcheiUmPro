// Load .env.local if present (simple parser) to ensure DB env vars are available
const fs = require('fs')
const path = require('path')
try {
  const envPath = path.resolve(__dirname, '..', '.env.local')
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8')
    content.split(/\r?\n/).forEach(line => {
      const m = line.match(/^\s*([^#=]+)=\s*(.*)\s*$/)
      if (m) {
        const key = m[1].trim()
        let val = m[2].trim()
        // remove surrounding quotes
        if ((val.startsWith("\'") && val.endsWith("\'")) || (val.startsWith('"') && val.endsWith('"'))) {
          val = val.slice(1, -1)
        }
        if (!process.env[key]) process.env[key] = val
      }
    })
  }
} catch (err) {
  // ignore
}

const pool = require('../src/lib/db')
const bcrypt = require('bcryptjs')

async function seed() {
  try {
    const passwordHash = await bcrypt.hash('password123', 10)

    // Create client
    const [cRes] = await pool.query('INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)', ['Cliente Teste', 'client@example.com', '123456789', passwordHash, 'client'])
    const clientId = cRes.insertId

    // Create provider user
    const [pUserRes] = await pool.query('INSERT INTO users (name, email, phone, password, role) VALUES (?, ?, ?, ?, ?)', ['Provider Teste', 'provider@example.com', '987654321', passwordHash, 'provider'])
    const providerUserId = pUserRes.insertId

    // Provider profile
    const [pRes] = await pool.query('INSERT INTO providers (user_id, description) VALUES (?, ?)', [providerUserId, 'Prestador de teste'])
    const providerId = pRes.insertId

    // Services
    await pool.query('INSERT INTO services (provider_id, name, price) VALUES (?, ?, ?)', [providerId, 'Corte de cabelo', 30.00])
    await pool.query('INSERT INTO services (provider_id, name, price) VALUES (?, ?, ?)', [providerId, 'Barba', 15.00])

    // Request
    const [rRes] = await pool.query('INSERT INTO requests (client_id, provider_id, service_id, description) VALUES (?, ?, ?, ?)', [clientId, providerId, 1, 'Quero agendar'])
    const requestId = rRes.insertId

    // Messages table might not exist in some envs; attempt insert if it exists
    try {
      await pool.query('INSERT INTO messages (request_id, sender_id, recipient_id, content) VALUES (?, ?, ?, ?)', [requestId, clientId, providerUserId, 'Olá, gostaria de agendar.'])
    } catch (err) {
      console.warn('Messages table insert skipped (not present):', err.message)
    }

    // Notifications
    try {
      await pool.query('INSERT INTO notifications (user_id, channel, title, body) VALUES (?, ?, ?, ?)', [providerUserId, 'in_app', 'Novo pedido', 'Você recebeu uma nova solicitação'])
    } catch (err) {
      console.warn('Notifications insert skipped (not present):', err.message)
    }

    console.log('Seed concluído. clientId=', clientId, 'providerUserId=', providerUserId, 'requestId=', requestId)
    process.exit(0)
  } catch (err) {
    console.error('Seed falhou:', err)
    process.exit(1)
  }
}

seed()
